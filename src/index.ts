/**
 * `dsh-talk` — the voice-first session loop for DeepSeek Harness.
 *
 * Host half: mounts the `talk` Remote service (speak pipeline + audio cache
 * + settings write-back), registers the `speak` tool, registers the
 * `talk:speech` session-projection unit the web client plays utterances
 * from, and speaks event announcements:
 * - `agent/status` → `idle` after a `running` observation: turn complete.
 * - `agent/error`: a turn errored.
 * - `approval/request` (waterfall): an approval is pending — the listener
 *   announces without blocking and always calls `next()`.
 *
 * Function plugin — no default export (the Loader unwraps
 * `exports.default ?? exports`).
 *
 * @module dsh-talk
 */

import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type { ApprovalOutcome, ApprovalRequest } from '@deepseek-ai/dsh-user-approval'
import type {} from '@deepseek-ai/dsh-tools'
import type {} from '@deepseek-ai/dsh-subprocess'
import type {} from '@deepseek-ai/dsh-session'
import type {} from '@deepseek-ai/dsh-session-projection'
import { Config, resolveConfig } from './config.ts'
import {
  applyTalkSpeechProjection,
  initTalkSpeechProjection,
  TALK_SPEECH_PROJECTION_STATE_VERSION,
  talkSpeechProjectionSchema,
  viewTalkSpeechProjection,
} from './projection.ts'
import { TalkService } from './service.ts'
import { speakTool } from './tool.ts'

export const name = 'talk'

/** Hard services: the tool registry and the subprocess service. */
export const inject = ['tools', 'subprocess']

export { Config, resolveConfig, type Config as TalkConfig, type ResolvedConfig } from './config.ts'
export { TalkService, resolveSttEngine, resolveTtsEngine, type SpeakOptions, type SpeakOutcome } from './service.ts'
export { speakTool, renderSpeak } from './tool.ts'
export { sanitizeText, redactSecrets, displayPath } from './sanitize.ts'
export { edgeTtsArgv, piperSpec, whisperArgv, runCommand, synthesize, transcribeWhisper, transcribeFunasr, EngineFailure } from './engine.ts'
export { appendSettingsFragment, mergeTalkRowConfig, renderSettingsFragment, validateSettingsInput, yamlScalar } from './settings-patch.ts'
export type { TalkAudio, TalkInterruptResult, TalkSettingsInput, TalkSettingsResult, TalkStatus, TalkTranscript } from './wire.ts'
export type { DshTalkSpeechEvent, SpeechReason, SpeechTtsEngine } from './speech.ts'
export type { TalkSpeechProjection, TalkSpeechProjectionState } from './projection.ts'

/**
 * Mount the plugin: the talk service, the speak tool, the projection unit,
 * and the three announcement listeners. Every registration is an effect on
 * this fiber, so unload/hot-reload removes the tool, the projection, and all
 * listeners together.
 *
 * @param ctx - context carrying tools + subprocess.
 * @param config - raw loader config; defaults applied through {@link resolveConfig}.
 */
export async function apply(ctx: Context, config: Config): Promise<void> {
  const resolved = resolveConfig(config)

  // Mount the talk service: the Service constructor self-registers; the
  // function plugin body must return nothing (a non-disposer return would
  // be rejected as an invalid effect).
  await ctx.plugin(function mountTalkService(ctx: Context): void {
    new TalkService(ctx, config, resolved, 5)
  })
  const service = ctx.get('talk') as TalkService

  ctx.effect(() => ctx.tools.register(speakTool(service, resolved.maxSpeakChars)), 'dsh-talk: speak tool')

  // The `talk:speech` projection unit: last-wins fold of spoken utterances,
  // read by the web client's record button through useProjection.
  ctx.inject(['sessionProjections'], (projectionCtx) => {
    projectionCtx.effect(() => projectionCtx.sessionProjections.register<'talk:speech', ReturnType<typeof initTalkSpeechProjection>>({
      key: 'talk:speech',
      schema: talkSpeechProjectionSchema,
      init: initTalkSpeechProjection,
      apply: applyTalkSpeechProjection,
      view: viewTalkSpeechProjection,
      stateVersion: TALK_SPEECH_PROJECTION_STATE_VERSION,
    }), 'dsh-talk: talk:speech projection')
  })

  // Turn-completion announcement: idle after an observed running transition.
  const runningAgents = new Set<Agent>()
  ctx.on('agent/status', ({ agent, status }) => {
    if (status === 'running') {
      runningAgents.add(agent)
      return
    }
    if (!runningAgents.delete(agent)) return
    if (!resolved.announceEnabled || !resolved.announceOnTurnEnd) return
    void service.speak(resolved.messageTurnEnd, { reason: 'turn-end', session: agent.session })
  })

  // Error announcement: emit-mode notification, fire-and-forget speech.
  ctx.on('agent/error', ({ agent }) => {
    if (!resolved.announceEnabled || !resolved.announceOnError) return
    void service.speak(resolved.messageError, { reason: 'error', session: agent.session })
  })

  // Approval announcement: waterfall listener — always delegates with next()
  // and never blocks the gate on speech.
  ctx.on('approval/request', (request: ApprovalRequest, next: () => Promise<ApprovalOutcome>) => {
    const outcome = next()
    if (resolved.announceEnabled && resolved.announceOnApproval) {
      void service.speak(resolved.messageApproval, { reason: 'approval', session: request.agent.session }).catch(() => {})
    }
    return outcome
  })
}
