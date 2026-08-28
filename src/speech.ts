/**
 * The `dsh-talk/speech` session-log seat. Every utterance the plugin speaks
 * aloud — tool speech, turn-end/approval/error announcements — is appended as
 * a log-only session event, and the `talk:speech` projection over it drives
 * live playback in the client. The event is appended WITHOUT the `ignorable`
 * marker because released DSH hosts through `0.1.1-rc.2` expose no way to set
 * it; hosts from `0.1.0-rc.7` onward refuse to cold-load a session log that
 * carries an unmarked event type they do not know
 * (`SessionFormatUnsupportedError`; the log stays intact and repairable, see
 * SECURITY.md and the README's Known limitations). The payload carries the
 * utterance id, engine, reason, size, and spoken text, so the voice loop is
 * reconstructable from the session log; the audio bytes themselves stay out
 * of the log and travel only through the `talk/audio` Remote endpoint.
 *
 * @module dsh-talk/speech
 */

import type { DshTalkSpeechEvent } from './vocabulary.ts'

export type { DshTalkSpeechEvent, SpeechReason, SpeechTtsEngine } from './vocabulary.ts'

declare module '@deepseek-ai/dsh-session' {
  interface SessionEventMap {
    'dsh-talk/speech': DshTalkSpeechEvent
  }
}
