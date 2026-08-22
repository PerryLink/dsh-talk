/**
 * The `talk:speech` session-projection unit: a last-wins fold of
 * `dsh-talk/speech` events into one whole value per session. The web client's
 * session-scoped record button reads the value through `useProjection` and
 * plays each fresh utterance (audio fetched through `talk/audio`, or spoken
 * by the browser voice for the browser engine). Pure mathematics only — the
 * projection registry owns the drive and notification. Imports the pure
 * `/types` outlet of dsh-session (never its root), so the client program can
 * pull the `SessionProjectionMap` merge in without host `Context` merges.
 *
 * @module dsh-talk/projection
 */

import { z } from 'zod'
import type { SessionEvent } from '@deepseek-ai/dsh-session/types'
import { talkSpeechProjectionSchema as talkSpeechValueSchema } from './vocabulary.ts'
import type { TalkSpeechProjection } from './vocabulary.ts'

export type { TalkSpeechProjection } from './vocabulary.ts'

/** State schema for the projection registry: the value or null before the first speech event. */
export const talkSpeechProjectionSchema = z.union([talkSpeechValueSchema, z.null()])

/** Unit state: the latest speech event, or null for an empty log. */
export type TalkSpeechProjectionState = TalkSpeechProjection | null

/** State for the empty log. */
export function initTalkSpeechProjection(): TalkSpeechProjectionState {
  return null
}

/**
 * Pure transition: a `dsh-talk/speech` event replaces the whole state; every
 * other event returns the same reference so the drive does zero work.
 *
 * @param state - the state covering all prior events.
 * @param event - the next committed session event.
 * @returns the next state (same reference when the event is not speech).
 */
export function applyTalkSpeechProjection(state: TalkSpeechProjectionState, event: SessionEvent): TalkSpeechProjectionState {
  if (event.type !== 'dsh-talk/speech') return state
  return {
    seq: event.seq,
    utteranceId: event.data.utteranceId,
    engine: event.data.engine,
    text: event.data.text,
    audioBytes: event.data.audioBytes,
    reason: event.data.reason,
    ...(event.data.error !== undefined ? { error: event.data.error } : {}),
    ...(event.data.interrupted === true ? { interrupted: true } : {}),
  }
}

/** State → wire payload (the state already matches the wire shape). */
export function viewTalkSpeechProjection(state: TalkSpeechProjectionState): TalkSpeechProjection | null {
  return state
}

/** Cache-invalidation version for the persisted projection cache. */
export const TALK_SPEECH_PROJECTION_STATE_VERSION = 1

declare module '@deepseek-ai/dsh-session-projection/types' {
  interface SessionProjectionMap {
    'talk:speech': TalkSpeechProjection | null
  }
  interface SessionProjectionStateMap {
    'talk:speech': TalkSpeechProjectionState
  }
}
