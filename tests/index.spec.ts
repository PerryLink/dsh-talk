/**
 * Plugin assembly: the apply body registers the speak tool and the
 * talk:speech projection, the approval announcement listener always calls
 * next() (waterfall discipline), and turn-end announcements fire only after
 * an observed running → idle transition.
 *
 * @module dsh-talk/test/index.spec
 */

import { describe, expect, it } from 'vitest'
import { mountHarness, makeAgent } from './harness.ts'

describe('apply — assembly', () => {
  it('registers the speak tool and the projection unit', async () => {
    const harness = await mountHarness()
    expect(harness.ctx.tools.get('speak')).toBeDefined()
    const projections = harness.ctx.get('sessionProjections') as { snapshot?: unknown }
    expect(projections).toBeDefined()
  })

  it('emits talk:speech on the registry change feed when a speech event lands', async () => {
    const harness = await mountHarness()
    const projections = harness.ctx.get('sessionProjections') as {
      onChanged(listener: (session: unknown, key: string, value: unknown, seq: number) => void): () => void
    }
    const seen: Array<{ key: string; value: { utteranceId: string } | null; seq: number }> = []
    projections.onChanged((_session, key, value, seq) => { seen.push({ key, value: value as { utteranceId: string } | null, seq }) })
    harness.session.append('dsh-talk/speech', {
      kind: 'tts',
      utteranceId: 'u-wire',
      engine: 'browser',
      text: 'wire check',
      audioBytes: 0,
      reason: 'speak-tool',
    })
    await new Promise(resolve => setTimeout(resolve, 20))
    const frame = seen.find(entry => entry.key === 'talk:speech')
    expect(frame).toBeDefined()
    expect(frame?.value?.utteranceId).toBe('u-wire')
  })

  it('approval/request announces without blocking and always delegates', async () => {
    const harness = await mountHarness({ announce: { onApproval: true } })
    let nextRan = false
    const outcome = await harness.ctx.waterfall(
      'approval/request',
      { agent: harness.agent } as never,
      () => {
        nextRan = true
        return Promise.resolve('rejected' as const)
      },
    )
    expect(nextRan).toBe(true)
    expect(outcome).toBe('rejected')
    // The announcement is fire-and-forget speech; give the pipeline a beat.
    await new Promise(resolve => setTimeout(resolve, 50))
    // This host line cannot carry the out-of-repo speech type, so the gate
    // skips the append — and the degradation must be observable instead of
    // silently dropping the utterance.
    const speech = harness.session.snapshotEvents().filter(event => event.type === 'dsh-talk/speech')
    expect(speech).toHaveLength(0)
    expect(harness.service.speechLogOutcome(String(harness.session.id))?.skipped ?? 0).toBeGreaterThan(0)
  })

  it('announces turn completion after a running → idle transition', async () => {
    const harness = await mountHarness({ tts: { engine: 'browser' } })
    const agent = makeAgent(harness.session)
    harness.ctx.emit('agent/status', { agent, status: 'running' })
    harness.ctx.emit('agent/status', { agent, status: 'idle' })
    // The announcement ran and the gate's skip was recorded (this host cannot
    // carry the speech type).
    const speech = harness.session.snapshotEvents().filter(event => event.type === 'dsh-talk/speech')
    expect(speech).toHaveLength(0)
    expect(harness.service.speechLogOutcome(String(harness.session.id))?.skipped ?? 0).toBeGreaterThan(0)
  })

  it('stays silent for an idle observation without a prior running', async () => {
    const harness = await mountHarness()
    const before = harness.session.snapshotEvents().filter(event => event.type === 'dsh-talk/speech').length
    harness.ctx.emit('agent/status', { agent: makeAgent(harness.session), status: 'idle' })
    const after = harness.session.snapshotEvents().filter(event => event.type === 'dsh-talk/speech').length
    expect(after).toBe(before)
  })

  it('applies defaults through the loader-style empty config', async () => {
    const harness = await mountHarness({})
    expect(harness.ctx.get('talk')).toBeDefined()
  })
})

describe('apply — fail loud', () => {
  it('resolveConfig throws when the row selects piper without a model', async () => {
    const { resolveConfig } = await import('../src/config.ts')
    expect(() => resolveConfig({ tts: { engine: 'piper' } })).toThrow(/piper/u)
  })

  it('resolveConfig throws when funasr is selected without an endpoint', async () => {
    const { resolveConfig } = await import('../src/config.ts')
    expect(() => resolveConfig({ stt: { engine: 'funasr' } })).toThrow(/funasr/u)
  })
})
