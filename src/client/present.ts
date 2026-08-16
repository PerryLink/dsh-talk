/**
 * Pure presentation for the microphone button: recording state machines
 * down to one discriminated view model plus the last transcription. No
 * browser APIs, no React — unit-tested in isolation.
 *
 * @module dsh-talk/client/present
 */

/** What the mic button is doing right now. */
export type MicPhase = 'idle' | 'starting' | 'recording' | 'transcribing' | 'error'

/** One user-visible recording step. */
export interface MicViewModel {
  /** Current phase. */
  phase: MicPhase
  /** Seconds recorded so far (rounded up), during recording. */
  elapsedSec: number
  /** The last completed transcription, trimmed. */
  lastText: string
  /** Sanitized failure note when phase is error. */
  error: string | undefined
}

/** An event the recorder state can receive. */
export type MicEvent =
  | { kind: 'press'; maxSeconds: number }
  | { kind: 'tick'; elapsedSec: number; maxSeconds: number }
  | { kind: 'stopped' }
  | { kind: 'transcribed'; text: string }
  | { kind: 'failed'; message: string }
  | { kind: 'reset' }

/**
 * Fold one event into the view model. The cap is re-checked on every tick so
 * the caller only has to drive `tick` with the current elapsed seconds.
 *
 * @param state - prior view model.
 * @param event - the incoming event.
 * @returns the next view model.
 */
export function foldMic(state: MicViewModel, event: MicEvent): MicViewModel {
  switch (event.kind) {
    case 'press':
      return { phase: 'recording', elapsedSec: 0, lastText: state.lastText, error: undefined }
    case 'tick':
      return state.phase === 'recording'
        ? { ...state, elapsedSec: Math.min(event.elapsedSec, event.maxSeconds) }
        : state
    case 'stopped':
      return { ...state, phase: 'transcribing' }
    case 'transcribed':
      return { phase: 'idle', elapsedSec: 0, lastText: event.text.trim(), error: undefined }
    case 'failed':
      return { phase: 'error', elapsedSec: 0, lastText: state.lastText, error: event.message }
    case 'reset':
      return { phase: 'idle', elapsedSec: 0, lastText: state.lastText, error: undefined }
    default:
      return state
  }
}

/** The idle start state. */
export function initMic(): MicViewModel {
  return { phase: 'idle', elapsedSec: 0, lastText: '', error: undefined }
}

/** Recording-cap seconds, clamped to a safe range for display. */
export function clampRecordSeconds(value: number, fallback: number): number {
  if (!Number.isFinite(value) || value <= 0) return fallback
  return Math.min(Math.floor(value), 600)
}
