/**
 * Pure voice-activity detection (VAD) helpers: root-mean-square energy, the
 * speech/silence frame verdict, and the accumulated-silence state machine.
 * No browser APIs, no React — the microphone button drives these with an
 * `AnalyserNode` and they are unit-tested in isolation. The browser wiring is
 * feature-detected and degrades to no auto-end when `AudioContext` is absent.
 *
 * @module dsh-talk/client/vad
 */

/** Root-mean-square energy of one audio frame (0..1 for normalized float samples). */
export function rmsOf(samples: Float32Array): number {
  if (samples.length === 0) return 0
  let sum = 0
  for (let index = 0; index < samples.length; index += 1) {
    const sample = samples[index]!
    sum += sample * sample
  }
  return Math.sqrt(sum / samples.length)
}

/** A frame's activity verdict at a given energy floor. */
export function isSpeechFrame(rms: number, threshold: number): boolean {
  return rms >= threshold
}

/**
 * Advance the consecutive-silence accumulator by one frame. A speech frame
 * resets the accumulator to zero; a silent frame adds the frame duration.
 * @param previousSilenceMs - accumulated silence so far (ms).
 * @param frameMs - this frame's duration (ms).
 * @param speech - whether this frame was speech.
 * @returns the new accumulated silence (ms).
 */
export function advanceSilence(previousSilenceMs: number, frameMs: number, speech: boolean): number {
  return speech ? 0 : previousSilenceMs + frameMs
}

/** Whether the accumulated silence trips the auto-end threshold. */
export function silenceTrips(silenceMs: number, thresholdMs: number): boolean {
  return silenceMs >= thresholdMs
}
