/**
 * The mic-button state machine: press → recording → transcribing → done,
 * failures, and the elapsed-seconds cap.
 *
 * @module dsh-talk/test/present.spec
 */

import { describe, expect, it } from 'vitest'
import { clampRecordSeconds, foldMic, initMic } from '../src/client/present.ts'

describe('foldMic', () => {
  it('walks the happy path', () => {
    let state = initMic()
    state = foldMic(state, { kind: 'press', maxSeconds: 60 })
    expect(state.phase).toBe('recording')
    state = foldMic(state, { kind: 'tick', elapsedSec: 3, maxSeconds: 60 })
    expect(state.elapsedSec).toBe(3)
    state = foldMic(state, { kind: 'stopped' })
    expect(state.phase).toBe('transcribing')
    state = foldMic(state, { kind: 'transcribed', text: '  hello world  ' })
    expect(state.phase).toBe('idle')
    expect(state.lastText).toBe('hello world')
  })

  it('records a failure and recovers on reset', () => {
    let state = initMic()
    state = foldMic(state, { kind: 'failed', message: 'mic denied' })
    expect(state.phase).toBe('error')
    expect(state.error).toBe('mic denied')
    state = foldMic(state, { kind: 'reset' })
    expect(state.phase).toBe('idle')
    expect(state.error).toBeUndefined()
  })

  it('caps the elapsed seconds', () => {
    let state = foldMic(initMic(), { kind: 'press', maxSeconds: 30 })
    state = foldMic(state, { kind: 'tick', elapsedSec: 120, maxSeconds: 30 })
    expect(state.elapsedSec).toBe(30)
  })
})

describe('clampRecordSeconds', () => {
  it('clamps to the floor and ceiling', () => {
    expect(clampRecordSeconds(0, 60)).toBe(60)
    expect(clampRecordSeconds(9999, 60)).toBe(600)
    expect(clampRecordSeconds(45.9, 60)).toBe(45)
    expect(clampRecordSeconds(Number.NaN, 60)).toBe(60)
  })
})
