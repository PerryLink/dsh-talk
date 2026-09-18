/**
 * `talk/latest`: the per-session read of the newest utterance. The host keys
 * its records by session id, so a multi-session client showing session A must
 * never receive session B's utterance — that keying is the whole point of the
 * method and is what these specs pin down.
 *
 * @module dsh-talk/test/latest.spec
 */

import { describe, expect, it } from 'vitest'
import { mountHarness, SessionId, withKnownSpeechVocabulary } from './harness.ts'

const BROWSER = { tts: { engine: 'browser' } }

describe('talk/latest', () => {
  it('answers null for a session that never spoke and for an unknown session id', async () => {
    const harness = await mountHarness(BROWSER)
    expect(harness.service.latest(String(harness.session.id))).toBeNull()
    expect(harness.service.latest('no-such-session')).toBeNull()
  })

  it('refuses a missing session id instead of answering for some other session', async () => {
    const harness = await mountHarness(BROWSER)
    expect(() => harness.service.latest('')).toThrow(/requires a non-empty sessionId/)
    expect(() => harness.service.latest(undefined as never)).toThrow(/requires a non-empty sessionId/)
  })

  it('keys the record by session, so one session never reads another session\u2019s utterance', async () => {
    const harness = await mountHarness(BROWSER)
    const first = harness.session
    const second = harness.ctx.sessions.create(SessionId('dsh-talk-second'))

    await harness.service.speak('first session utterance', { reason: 'speak-tool', session: first })
    const afterFirst = harness.service.latest(String(first.id))
    await harness.service.speak('second session utterance', { reason: 'turn-end', session: second })

    const latestFirst = harness.service.latest(String(first.id))
    const latestSecond = harness.service.latest(String(second.id))
    expect(latestFirst?.text).toBe('first session utterance')
    expect(latestFirst?.reason).toBe('speak-tool')
    expect(latestFirst?.sessionId).toBe(String(first.id))
    expect(latestSecond?.text).toBe('second session utterance')
    expect(latestSecond?.reason).toBe('turn-end')
    expect(latestSecond?.sessionId).toBe(String(second.id))
    // The first session's record is untouched by the second session's speech.
    expect(latestFirst?.utteranceId).toBe(afterFirst?.utteranceId)

    // Within one session the newest utterance wins (last-wins, like the projection).
    await harness.service.speak('first session again', { reason: 'approval', session: first })
    const rotated = harness.service.latest(String(first.id))
    expect(rotated?.text).toBe('first session again')
    expect(rotated?.utteranceId).not.toBe(afterFirst?.utteranceId)
    expect(harness.service.latest(String(second.id))?.text).toBe('second session utterance')
  })

  it('reports the log gate per session: skipped by default, appended once the vocabulary is known', async () => {
    const harness = await mountHarness(BROWSER)
    const other = harness.ctx.sessions.create(SessionId('dsh-talk-third'))

    await harness.service.speak('unloggable', { reason: 'speak-tool', session: harness.session })
    const skipped = harness.service.latest(String(harness.session.id))
    expect(skipped).toMatchObject({ logged: false, appended: 0, skipped: 1 })
    expect(skipped?.engine).toBe('browser')
    expect(skipped?.audioBytes).toBe(0)
    // A session with no attempt of its own reports nothing at all.
    expect(harness.service.latest(String(other.id))).toBeNull()

    await withKnownSpeechVocabulary(async () => {
      await harness.service.speak('loggable', { reason: 'error', session: harness.session })
    })
    expect(harness.service.latest(String(harness.session.id))).toMatchObject({
      text: 'loggable',
      reason: 'error',
      logged: true,
      appended: 1,
      skipped: 1,
    })
    // Still keyed away from the untouched session.
    expect(harness.service.latest(String(other.id))).toBeNull()
  })
})
