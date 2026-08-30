/**
 * The adaptive speech gate: plain append on known-type hosts, marked append on
 * `ignorable`-envelope hosts, and a silent skip on envelope-less hosts
 * (0.1.0-rc.6/rc.8, 0.1.1-rc.2, 0.1.2-alpha.1).
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
  it('appends plainly when the host knows the vocabulary', () => {
    ;(KNOWN_SESSION_EVENT_TYPES as Set<string>).add(SPEECH_EVENT)
    try {
      const calls: unknown[][] = []
      const append = function (type: string, data: unknown) {
        calls.push([type, data])
        return {}
      }
      appendSpeechEvent({ append } as unknown as Session, payload)
      expect(calls).toEqual([[SPEECH_EVENT, payload]])
    } finally {
      ;(KNOWN_SESSION_EVENT_TYPES as Set<string>).delete(SPEECH_EVENT)
    }
  })

  it('appends with the marker on envelope hosts', () => {
    const calls: unknown[][] = []
    const append = function (type: string, data: unknown, options?: unknown) {
      // The `ignorable` marker rides the options bag on envelope hosts.
      calls.push(options === undefined ? [type, data] : [type, data, options])
      return { ignorable: (options as { ignorable?: boolean } | undefined)?.ignorable === true }
    }
    appendSpeechEvent({ append } as unknown as Session, payload)
    expect(calls).toEqual([[SPEECH_EVENT, payload, { ignorable: true }]])
  })

  it('skips the append on envelope-less hosts', () => {
    const calls: unknown[][] = []
    const append = function (type: string, data: unknown, surface?: unknown) {
      calls.push(surface === undefined ? [type, data] : [type, data, surface])
      return { surface }
    }
    appendSpeechEvent({ append } as unknown as Session, payload)
    expect(calls).toHaveLength(0)
  })
})
