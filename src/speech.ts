/**
 * The `dsh-talk/speech` session-log seat. Every utterance the plugin speaks
 * aloud — tool speech, turn-end/approval/error announcements — is appended as
 * a log-only session event, and the `talk:speech` projection over it drives
 * live playback in the client. The payload carries the utterance id, engine,
 * reason, size, and spoken text, so the voice loop is reconstructable from
 * the session log wherever the host can carry the event; the audio bytes
 * themselves stay out of the log and travel only through the `talk/audio`
 * Remote endpoint.
 *
 * The append goes through the gate in {@link appendSpeechEvent}:
 * - hosts whose known-type set covers the vocabulary append plainly and the
 *   call reports `true`;
 * - every other host gets no append and the call reports `false` — the `speak`
 *   tool results remain the reconstructable audit trail, and the `talk:speech`
 *   projection simply stays empty there.
 *
 * HARD RULE (measured on the 0.1.6-alpha.2 line): `Session.append`'s third
 * parameter carries a `SurfaceIntent`, and only for surface-eligible event
 * types; it is never an `ignorable` envelope. An out-of-repo non-surface type
 * therefore cannot be stamped, and an unmarked unknown event makes a later
 * reader refuse the whole stored log — so the source-text probe that used to
 * look for an `ignorable` option was removed and must not come back in any
 * form (least of all as an unconditional append).
 *
 * @module dsh-talk/speech
 */

import { KNOWN_SESSION_EVENT_TYPES, type Session } from '@deepseek-ai/dsh-session'
import type { DshTalkSpeechEvent } from './vocabulary.ts'

export type { DshTalkSpeechEvent, SpeechReason, SpeechTtsEngine } from './vocabulary.ts'

/** The speech session event type. */
export const SPEECH_EVENT = 'dsh-talk/speech' as const

declare module '@deepseek-ai/dsh-session' {
  interface SessionEventMap {
    'dsh-talk/speech': DshTalkSpeechEvent
  }
}

/**
 * Append one `dsh-talk/speech` event when the host's known-type set covers the
 * vocabulary; skip otherwise and report the degradation to the caller (the
 * `tool/call` + `tool/result` events remain the model-visible log, so nothing
 * model-visible is lost).
 * @param session - the calling session.
 * @param data - the speech event payload.
 * @returns `true` when the event was appended, `false` when this host cannot
 *   carry it (the caller records the skip so the degradation is observable).
 */
export function appendSpeechEvent(session: Session, data: DshTalkSpeechEvent): boolean {
  if (!KNOWN_SESSION_EVENT_TYPES.has(SPEECH_EVENT)) return false
  session.append(SPEECH_EVENT, data)
  return true
}
