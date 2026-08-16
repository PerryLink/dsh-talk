/**
 * The `dsh-talk/speech` session-log seat. Every utterance the plugin speaks
 * aloud — tool speech, turn-end/approval/error announcements — is appended as
 * a log-only session event (ignorable: builds without this plugin still read
 * the session). The payload carries the utterance id, engine, reason, size,
 * and spoken text, so the voice loop is reconstructable from the session log;
 * the audio bytes themselves stay out of the log and travel only through the
 * `talk/audio` Remote endpoint.
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
