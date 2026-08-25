/**
 * Pure browser-voice selection for SpeechSynthesis playback: exact name
 * match first, then case-insensitive, otherwise `undefined` so the caller
 * keeps the platform default voice. Kept free of `speechSynthesis` access
 * so it stays unit-testable outside a browser.
 *
 * @module dsh-talk/client/browser-voice
 */

/** Minimal structural face of a `SpeechSynthesisVoice`. */
export interface BrowserVoiceLike {
  /** The voice's display name (`voiceName` config matches this). */
  readonly name: string
}

/**
 * Pick the configured voice out of the platform's voice list.
 *
 * @param voices - platform voices (`speechSynthesis.getVoices()`).
 * @param wanted - configured or per-call voice name; `undefined`/empty selects none.
 * @returns the matched voice, or `undefined` to fall back to the platform default.
 */
export function selectBrowserVoice<T extends BrowserVoiceLike>(voices: ArrayLike<T>, wanted: string | undefined): T | undefined {
  if (wanted === undefined || wanted === '') return undefined
  const list = Array.from(voices)
  for (const voice of list) {
    if (voice.name === wanted) return voice
  }
  const lowered = wanted.toLowerCase()
  for (const voice of list) {
    if (voice.name.toLowerCase() === lowered) return voice
  }
  return undefined
}
