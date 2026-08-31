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
 * The append goes through the adaptive gate in {@link appendSpeechEvent}:
 * - hosts whose known-type set covers the vocabulary append plainly;
 * - hosts with an `ignorable` append option (pre-0.1.2 master builds) append
 *   with the marker, so builds that do not know the type skip it on restore;
 * - envelope-less hosts (0.1.0-rc.6/rc.8, 0.1.1-rc.2, and 0.1.2-alpha.1,
 *   which removed the envelope and fails closed on unknown types at read)
 *   get no append — the `speak` tool results remain the reconstructable
 *   audit trail, and the `talk:speech` projection simply stays empty there. On 0.1.2-alpha.2 the envelope field is restored for stored-log read compatibility only - its Session.append still cannot stamp the marker, so the gate behavior is unchanged.
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

/** Loose append shape probed at runtime (envelope-less hosts take no options; pre-0.1.2 master builds took `ignorable`). */
type AppendProbe = (type: string, data: unknown, options?: { ignorable: true }) => unknown

/**
 * Append one `dsh-talk/speech` event when the host can carry it safely; skip
 * silently otherwise (the `tool/call` + `tool/result` events remain the
 * model-visible log, so nothing model-visible is lost). See the module doc
 * for the three host classes.
 * @param session - the calling session.
 * @param data - the speech event payload.
 */
export function appendSpeechEvent(session: Session, data: DshTalkSpeechEvent): void {
  if (KNOWN_SESSION_EVENT_TYPES.has(SPEECH_EVENT)) {
    session.append(SPEECH_EVENT, data)
    return
  }
  const append = session.append as AppendProbe
  if (Function.prototype.toString.call(append).includes('ignorable')) {
    append.call(session, SPEECH_EVENT, data, { ignorable: true })
  }
}
