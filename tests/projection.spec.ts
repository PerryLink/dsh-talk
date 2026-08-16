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

  it('validates both the null and value shapes', () => {
    expect(talkSpeechProjectionSchema.safeParse(null).success).toBe(true)
    const value = applyTalkSpeechProjection(initTalkSpeechProjection(), speechEvent(2, 'u-1'))!
    expect(talkSpeechProjectionSchema.safeParse(value).success).toBe(true)
    expect(talkSpeechProjectionSchema.safeParse({ nope: 1 }).success).toBe(false)
  })
})
