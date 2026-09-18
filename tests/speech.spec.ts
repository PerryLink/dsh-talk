/**
 * The speech gate: a plain append that reports `true` when the host's
 * vocabulary covers the type, and a skip that reports `false` on every other
 * host (no supported line stamps an `ignorable` marker on a non-surface type).
 * The old source-text probe is gone; this spec pins that no marked or
 * unconditional append can come back.
 * @module dsh-talk/test/speech.spec
 */

import { describe, expect, it } from 'vitest'
import { KNOWN_SESSION_EVENT_TYPES, type Session } from '@deepseek-ai/dsh-session'
import { appendSpeechEvent, SPEECH_EVENT, type DshTalkSpeechEvent } from '../src/speech.ts'

const payload: DshTalkSpeechEvent = {
  kind: 'tts',
  utteranceId: 'u-1',
  engine: 'edge-tts',
  text: 'hello',
  audioBytes: 12,
  reason: 'speak-tool',
}

describe('appendSpeechEvent', () => {
  it('appends plainly and reports true when the host knows the vocabulary', () => {
    ;(KNOWN_SESSION_EVENT_TYPES as Set<string>).add(SPEECH_EVENT)
    try {
      const calls: unknown[][] = []
      const append = function (type: string, data: unknown) {
        calls.push([type, data])
        return {}
      }
      const appended = appendSpeechEvent({ append } as unknown as Session, payload)
      expect(appended).toBe(true)
      expect(calls).toEqual([[SPEECH_EVENT, payload]])
    } finally {
      ;(KNOWN_SESSION_EVENT_TYPES as Set<string>).delete(SPEECH_EVENT)
    }
  })

  it('reports false and never appends on an unknown-vocabulary host, even with an ignorable-shaped body', () => {
    const calls: unknown[][] = []
    const append = function (type: string, data: unknown, options?: unknown) {
      const ignorable = (options as { ignorable?: boolean } | undefined)?.ignorable
      void ignorable
      calls.push(options === undefined ? [type, data] : [type, data, options])
      return { ignorable: ignorable === true }
    }
    const appended = appendSpeechEvent({ append } as unknown as Session, payload)
    expect(appended).toBe(false)
    expect(calls).toHaveLength(0)
  })

  it('reports false on a surface-intent-shaped host without calling append', () => {
    const calls: unknown[][] = []
    const append = function (type: string, data: unknown, surface?: unknown) {
      calls.push(surface === undefined ? [type, data] : [type, data, surface])
      return { surface }
    }
    const appended = appendSpeechEvent({ append } as unknown as Session, payload)
    expect(appended).toBe(false)
    expect(calls).toHaveLength(0)
  })
})
