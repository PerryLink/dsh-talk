/**
 * The talk:speech projection unit: pure fold over speech events, null
 * before the first, and the state schema accepting both shapes.
 *
 * @module dsh-talk/test/projection.spec
 */

import { describe, expect, it } from 'vitest'
import type { SessionEvent } from '@deepseek-ai/dsh-session/types'
import {
  applyTalkSpeechProjection,
  initTalkSpeechProjection,
  talkSpeechProjectionSchema,
  viewTalkSpeechProjection,
} from '../src/projection.ts'

function speechEvent(seq: number, utteranceId: string) {
  return {
    seq,
    type: 'dsh-talk/speech',
    data: {
      kind: 'tts',
      utteranceId,
      engine: 'edge-tts',
      text: 'Turn complete.',
      audioBytes: 12,
      reason: 'turn-end',
    },
  } as unknown as SessionEvent
}

function browserSpeechEvent(seq: number, utteranceId: string) {
  return {
    seq,
    type: 'dsh-talk/speech',
    data: {
      kind: 'tts',
      utteranceId,
      engine: 'browser',
      text: 'Hello.',
      audioBytes: 0,
      reason: 'speak-tool',
      voice: 'Google UK English Female',
      rate: 1.2,
      pitch: 0.9,
    },
  } as unknown as SessionEvent
}

describe('talk:speech projection', () => {
  it('starts at null', () => {
    expect(initTalkSpeechProjection()).toBeNull()
  })

  it('folds the latest speech event and ignores everything else', () => {
    let state = initTalkSpeechProjection()
    const other = { seq: 1, type: 'user/message', data: {} } as unknown as SessionEvent
    expect(applyTalkSpeechProjection(state, other)).toBe(state)
    state = applyTalkSpeechProjection(state, speechEvent(2, 'u-1'))
    expect(state?.utteranceId).toBe('u-1')
    expect(state?.text).toBe('Turn complete.')
    state = applyTalkSpeechProjection(state, speechEvent(3, 'u-2'))
    expect(state?.utteranceId).toBe('u-2')
  })

  it('views the state as itself', () => {
    const state = applyTalkSpeechProjection(initTalkSpeechProjection(), speechEvent(2, 'u-1'))
    expect(viewTalkSpeechProjection(state)).toBe(state)
    expect(viewTalkSpeechProjection(null)).toBeNull()
  })

  it('folds browser delivery settings (voice/rate/pitch) through the projection', () => {
    const state = applyTalkSpeechProjection(initTalkSpeechProjection(), browserSpeechEvent(4, 'u-voice'))
    expect(state?.voice).toBe('Google UK English Female')
    expect(state?.rate).toBe(1.2)
    expect(state?.pitch).toBe(0.9)
    expect(talkSpeechProjectionSchema.safeParse(state).success).toBe(true)
    // Local-engine events carry no browser delivery fields.
    const local = applyTalkSpeechProjection(initTalkSpeechProjection(), speechEvent(5, 'u-local'))!
    expect('voice' in local).toBe(false)
    expect('rate' in local).toBe(false)
    expect('pitch' in local).toBe(false)
  })

  it('validates both the null and value shapes', () => {
    expect(talkSpeechProjectionSchema.safeParse(null).success).toBe(true)
    const value = applyTalkSpeechProjection(initTalkSpeechProjection(), speechEvent(2, 'u-1'))!
    expect(talkSpeechProjectionSchema.safeParse(value).success).toBe(true)
    expect(talkSpeechProjectionSchema.safeParse({ nope: 1 }).success).toBe(false)
    // Delivery bounds mirror the SpeechSynthesis utterance ranges.
    expect(talkSpeechProjectionSchema.safeParse({ ...value, rate: 0.05 }).success).toBe(false)
    expect(talkSpeechProjectionSchema.safeParse({ ...value, pitch: 2.5 }).success).toBe(false)
  })
})
