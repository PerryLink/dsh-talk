/**
 * Pure voice-activity detection: RMS energy, the speech/silence verdict, and
 * the accumulated-silence state machine.
 * @module dsh-talk/test/vad.spec
 */

import { describe, expect, it } from 'vitest'
import { advanceSilence, isSpeechFrame, rmsOf, silenceTrips } from '../src/client/vad.ts'

describe('rmsOf', () => {
  it('returns 0 for an empty frame', () => {
    expect(rmsOf(new Float32Array(0))).toBe(0)
  })

  it('computes the root-mean-square of a frame', () => {
    expect(rmsOf(new Float32Array([3, 4]))).toBeCloseTo(Math.sqrt((9 + 16) / 2))
  })

  it('returns 0 for silence', () => {
    expect(rmsOf(new Float32Array([0, 0, 0, 0]))).toBe(0)
  })
})

describe('isSpeechFrame', () => {
  it('classifies a frame against the energy floor', () => {
    expect(isSpeechFrame(0.02, 0.01)).toBe(true)
    expect(isSpeechFrame(0.005, 0.01)).toBe(false)
  })
})

describe('advanceSilence', () => {
  it('resets on a speech frame and accumulates on a silent frame', () => {
    expect(advanceSilence(0, 500, false)).toBe(500)
    expect(advanceSilence(500, 500, false)).toBe(1000)
    expect(advanceSilence(1000, 500, true)).toBe(0)
  })
})

describe('silenceTrips', () => {
  it('trips only at or past the threshold', () => {
    expect(silenceTrips(1500, 1500)).toBe(true)
    expect(silenceTrips(2000, 1500)).toBe(true)
    expect(silenceTrips(1499, 1500)).toBe(false)
  })
})
