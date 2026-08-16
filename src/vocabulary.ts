/**
 * Pure shared vocabulary: the speech payload types and the projection wire
 * schema. This module imports nothing from host-side package roots, so both
 * the host program (which merges `SessionEventMap`) and the client program
 * (which must not hold host `Context` merges) can import it safely. The
 * session-log merge lives in `./speech.ts`; the projection-unit merge lives
 * in `./projection.ts`.
 *
 * @module dsh-talk/vocabulary
 */

import { z } from 'zod'

/** What triggered one spoken utterance. */
export type SpeechReason = 'speak-tool' | 'turn-end' | 'approval' | 'error'

/** Engines that can synthesize speech in this plugin. */
export type SpeechTtsEngine = 'browser' | 'edge-tts' | 'piper'

/** Payload of one `dsh-talk/speech` session event. */
export interface DshTalkSpeechEvent {
  /** Always `tts` — a host-synthesized (or browser-delegated) utterance. */
  kind: 'tts'
  /** Stable id the client fetches audio with through `talk/audio`. */
  utteranceId: string
  /** Engine that produced (or will produce) the audio. */
  engine: SpeechTtsEngine
  /** The spoken text, sanitized and capped. */
  text: string
  /** Synthesized audio size in bytes; 0 for the browser engine (client-side synthesis). */
  audioBytes: number
  /** What triggered the utterance. */
  reason: SpeechReason
  /** Sanitized failure note when synthesis failed; absent on success. */
  error?: string | undefined
  /** True when the user interrupted the utterance before it finished. */
  interrupted?: boolean | undefined
}

/** The wire payload of the `talk:speech` projection. */
export interface TalkSpeechProjection {
  /** Seq of the `dsh-talk/speech` event this value reflects. */
  seq: number
  /** Stable utterance id for `talk/audio`. */
  utteranceId: string
  /** Engine that produced the audio (browser = client-side synthesis). */
  engine: SpeechTtsEngine
  /** The spoken text, sanitized and capped. */
  text: string
  /** Synthesized audio size in bytes; 0 for the browser engine. */
  audioBytes: number
  /** What triggered the utterance. */
  reason: SpeechReason
  /** Sanitized failure note; absent on success. */
  error?: string | undefined
  /** True when the utterance was interrupted. */
  interrupted?: boolean | undefined
}

/** Strict schema validating the projection value before it leaves the host. */
export const talkSpeechProjectionSchema = z.object({
  seq: z.number().int(),
  utteranceId: z.string(),
  engine: z.union([z.literal('browser'), z.literal('edge-tts'), z.literal('piper')]),
  text: z.string(),
  audioBytes: z.number().int(),
  reason: z.union([z.literal('speak-tool'), z.literal('turn-end'), z.literal('approval'), z.literal('error')]),
  error: z.string().optional(),
  interrupted: z.boolean().optional(),
})
