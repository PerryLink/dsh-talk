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
    const speech = harness.session.events.filter(event => event.type === 'dsh-talk/speech')
    expect(speech.some(event => (event.data as { reason: string }).reason === 'approval')).toBe(true)
  })

  it('announces turn completion after a running → idle transition', async () => {
    const harness = await mountHarness({ tts: { engine: 'browser' } })
    const agent = makeAgent(harness.session)
    harness.ctx.emit('agent/status', { agent, status: 'running' })
    harness.ctx.emit('agent/status', { agent, status: 'idle' })
    const speech = harness.session.events.filter(event => event.type === 'dsh-talk/speech')
    expect(speech.some(event => (event.data as { reason: string }).reason === 'turn-end')).toBe(true)
  })

  it('stays silent for an idle observation without a prior running', async () => {
    const harness = await mountHarness()
    const before = harness.session.events.filter(event => event.type === 'dsh-talk/speech').length
    harness.ctx.emit('agent/status', { agent: makeAgent(harness.session), status: 'idle' })
    const after = harness.session.events.filter(event => event.type === 'dsh-talk/speech').length
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
