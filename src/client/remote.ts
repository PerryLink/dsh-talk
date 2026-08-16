/**
 * The client-side Remote face of the `talk` namespace: the hand-written
 * `TypertRemoteContribution` mounted through `ctx.remote.$mount`, plus the
 * declaration merging that types `ctx.remote.talk`. The descriptor list is
 * shared with the host `./typert` manifest (`../wire.ts`), so the two faces
 * can never drift.
 *
 * @module dsh-talk/client/remote
 */

import type { RemoteResult, TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import { TALK_INVOCATIONS } from '../wire.ts'
import type {
  TalkAudio,
  TalkInterruptResult,
  TalkSettingsInput,
  TalkSettingsResult,
  TalkStatus,
  TalkTranscript,
} from '../wire.ts'

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface TypertRemoteNamespace$talk {
    /** Read-only settings snapshot. */
    status: () => Promise<RemoteResult<TalkStatus>>
    /** Serve one cached utterance's audio; null when evicted. */
    audio: (utteranceId: string) => Promise<RemoteResult<TalkAudio | null>>
    /** Transcribe one base64 WAV with the configured local STT engine. */
    transcribe: (audioData: string) => Promise<RemoteResult<TalkTranscript>>
    /** Apply the settings panel's edits as an append-only profile patch operation. */
    applySettings: (settings: TalkSettingsInput) => Promise<RemoteResult<TalkSettingsResult>>
    /** Stop in-flight host synthesis (the user started talking). */
    interrupt: () => Promise<RemoteResult<TalkInterruptResult>>
  }
  interface TypertRemoteMap {
    'talk/status': () => Promise<RemoteResult<TalkStatus>>
    'talk/audio': (utteranceId: string) => Promise<RemoteResult<TalkAudio | null>>
    'talk/transcribe': (audioData: string) => Promise<RemoteResult<TalkTranscript>>
    'talk/applySettings': (settings: TalkSettingsInput) => Promise<RemoteResult<TalkSettingsResult>>
    'talk/interrupt': () => Promise<RemoteResult<TalkInterruptResult>>
  }
  interface TypertRemoteNamespaceMap {
    talk: TypertRemoteNamespace$talk
  }
}

/** The client Remote contribution for the `talk` namespace. */
export const TALK_REMOTE = Object.freeze({
  package: 'dsh-talk',
  descriptors: TALK_INVOCATIONS,
} satisfies TypertRemoteContribution)
