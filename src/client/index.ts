/**
 * `dsh-talk`, browser half: mounts the `talk` Remote contribution, registers
 * the composer microphone button into `conversation.input.left`, and the
 * settings tab (`settings.plugins.tab`, id `talk`). All data arrives through
 * the `remote.talk` namespace; the draft/send bindings come from the
 * conversation input face resolved for the session scope.
 *
 * @module dsh-talk/client
 */

import type { Context } from '@deepseek-ai/cordis'
// Type-only: declares the client `remote` service (with `$mount`) on the
// cordis Context — the published assembly package that owns the merge on both
// the 0.1.1-rc.2 line and the 0.1.2-alpha checkout.
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: pulls the 'settings.plugins.tab' SlotMap declaration into this
// program so the tab registration typechecks against the real declaration.
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
// Type-only: pulls the 'conversation.input.left' SlotMap declaration in.
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { RemoteResult } from '@deepseek-ai/dsh-typert-protocol'
import type { IConversation } from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { TalkSettingsTabInjected } from './TalkSettingsTab.tsx'
import { TalkSettingsTab } from './TalkSettingsTab.tsx'
import type { TalkMicInjected } from './TalkMicButton.tsx'
import { TalkMicButton } from './TalkMicButton.tsx'
import { en, zh, type TalkLocaleKey } from './locales.ts'
import { TALK_REMOTE } from './remote.ts'
import { installTalkStyles } from './styles.ts'
import type {
  TalkAudio,
  TalkInterruptResult,
  TalkSettingsInput,
  TalkSettingsResult,
  TalkStatus,
  TalkTranscript,
} from '../wire.ts'

export type { TalkMicInjected, TalkMicProps } from './TalkMicButton.tsx'
export type { TalkSettingsTabInjected, TalkSettingsTabProps } from './TalkSettingsTab.tsx'
export type { TalkLocaleKey } from './locales.ts'
export { foldMic, initMic, clampRecordSeconds, type MicEvent, type MicPhase, type MicViewModel } from './present.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Voice-loop settings copy. */
    'settings.talk': TalkLocaleKey
  }
}

/** Dictionary namespace owned by this plugin. */
export const NS = 'settings.talk'

/** Plugin name: matches the package name, the graph row id, and the bundle id. */
export const name = 'dsh-talk'

/** Services the browser half reads; `remote.talk` appears once the contribution mounts. */
export const inject = ['slots', 'locale', 'remote']

/**
 * Minimal structural contract of the slot registry this client uses. Declared
 * locally because the registry's owning package differs across host lines
 * (the removed client runtime on 0.1.1-rc.2, the UI renderer on 0.1.2-alpha);
 * the runtime contract is structural.
 */
interface SlotsFace {
  inject(slot: string, factory: () => unknown): unknown
  register(options: Record<string, unknown>, component: unknown): unknown
}

/**
 * Browser plugin body: dictionaries, the scoped stylesheet, the Remote
 * contribution mount, the mic-button slot, and the settings tab.
 *
 * @param ctx - client root context.
 */
export async function apply(ctx: Context): Promise<void> {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-talk: dictionaries')
  ctx.effect(() => installTalkStyles(), 'dsh-talk: stylesheet')

  // $mount registers the 'remote.talk' namespace service and owns its removal.
  await ctx.remote.$mount(TALK_REMOTE)

  const slots = ctx.get('slots') as SlotsFace
  ctx.inject(['remote.talk', 'conversation'], (scope) => {
    const talk = scope.remote.talk
    const t = scope.locale.bind(NS)
    const unwrap = <T>(result: RemoteResult<T>, method: string): T => {
      if (!result.ok) {
        throw new Error(`talk.${method} failed: ${result.error.code}: ${result.error.message}`)
      }
      return result.value
    }
    const status: TalkMicInjected['status'] = async () =>
      unwrap<TalkStatus>(await talk.status(), 'status')
    const interrupt: TalkMicInjected['interrupt'] = async () =>
      unwrap<TalkInterruptResult>(await talk.interrupt(), 'interrupt')
    const transcribe: TalkMicInjected['transcribe'] = async (audioData) =>
      unwrap<TalkTranscript>(await talk.transcribe(audioData), 'transcribe')
    const audio: TalkMicInjected['audio'] = async (utteranceId) =>
      unwrap<TalkAudio | null>(await talk.audio(utteranceId), 'audio')
    const conversation = scope.get('conversation') as IConversation | undefined
    // Master's sanctioned id → session-scope-ctx exchange (same pattern
    // ui-commands uses); resolves to undefined when either service is
    // unavailable (rc.8 builds without the scope exchange).
    const sessions = scope.get('sessions') as { scope?: (id: unknown) => unknown } | undefined
    const forSession: NonNullable<TalkMicInjected['forSession']> = (id) => {
      if (typeof id !== 'string') return undefined
      if (conversation === undefined || sessions?.scope === undefined) return undefined
      const actx = sessions.scope(id)
      if (actx === undefined || actx === null) return undefined
      return conversation.input.for(actx as Parameters<typeof conversation.input.for>[0])
    }
    const setDraft: TalkMicInjected['setDraft'] = (text) => {
      conversation?.input.for(scope).setDraft(text)
    }
    const send: TalkMicInjected['send'] = async (text) => {
      if (conversation === undefined) return
      conversation.input.for(scope).setDraft(text)
      conversation.input.for(scope).submit()
    }
    const applySettings: TalkSettingsTabInjected['applySettings'] = async (settings: TalkSettingsInput) =>
      unwrap<TalkSettingsResult>(await talk.applySettings(settings), 'applySettings')

    slots.inject('conversation.input.left', () => slots.register({
      name: 'conversation.input.left',
      id: 'talk-mic',
      order: 20,
      inject: (): TalkMicInjected => ({ status, interrupt, transcribe, audio, setDraft, send, forSession }),
    }, TalkMicButton))

    slots.inject('settings.plugins.tab', () => slots.register({
      name: 'settings.plugins.tab',
      id: 'talk',
      order: 50,
      label: () => t('tab'),
      locale: NS,
      inject: (): TalkSettingsTabInjected => ({ status, applySettings }),
    }, TalkSettingsTab))
  })
}
