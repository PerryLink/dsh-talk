/**
 * Lifecycle and export-contract suite: the HMR-safety test (dispose the
 * contributing fiber, re-query the authoritative registries), the
 * default-export guard (module namespace + Loader unwrap round-trip), the
 * speak tool three-interface assertion (model schema + canonical value +
 * content blocks), and the explicit resolveConfig negatives (engine parsing).
 *
 * @module dsh-talk/test/lifecycle.spec
 */

import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import Loader from '@deepseek-ai/cordis-plugin-loader'
import { CallId } from '@deepseek-ai/dsh-llm'
import SessionStore, { SessionId } from '@deepseek-ai/dsh-session'
import SessionProjectionRegistry from '@deepseek-ai/dsh-session-projection'
import ToolRuntime from '@deepseek-ai/dsh-tools'
import { resolveConfig } from '../src/config.ts'
import { FakeSubprocessRuntime, makeAgent, mountHarness } from './harness.ts'

async function mount(config: Record<string, unknown> = {}) {
  const ctx = new Context()
  await ctx.plugin(SessionStore)
  const session = ctx.sessions.create(SessionId('dsh-talk-lifecycle'))
  session.append('turn/start', { turn: 1 })
  ctx.provide('systemPrompt', { tools: () => () => undefined, section: () => () => undefined } as never)
  await ctx.plugin(ToolRuntime)
  await ctx.plugin(SessionProjectionRegistry)
  new FakeSubprocessRuntime(ctx)
  const plugin = await import('../src/index.ts')
  const pluginFiber = await ctx.plugin(plugin as unknown as import('@deepseek-ai/cordis').Plugin, config)
  return { ctx, session, agent: makeAgent(session), pluginFiber }
}

// ---------------------------------------------------------------------------
// C2: the function-plugin namespace must survive Loader unwrapping
// ---------------------------------------------------------------------------

describe('export contract', () => {
  it('module carries no default export and Loader unwrap round-trips the namespace', async () => {
    const plugin = await import('../src/index.ts')
    expect('default' in plugin).toBe(false)
    const loader = Object.create(Loader.prototype)
    const unwrapped = loader.unwrapExports(plugin)
    expect(unwrapped).toBe(plugin)
    expect(unwrapped.name).toBe('talk')
    expect(unwrapped.inject).toEqual(['tools', 'subprocess'])
    expect(typeof unwrapped.Config).toBe('function')
    expect(typeof unwrapped.apply).toBe('function')
  })
})

// ---------------------------------------------------------------------------
// C1: disposing the contributing fiber removes every registry contribution
// ---------------------------------------------------------------------------

describe('fiber disposal', () => {
  it('removes the talk service and the speak tool on dispose', async () => {
    const harness = await mount()
    try {
      expect(harness.ctx.get('talk')).toBeDefined()
      expect(harness.ctx.tools.get('speak')).toBeDefined()

      await harness.pluginFiber.dispose()

      expect(harness.ctx.get('talk')).toBeUndefined()
      expect(harness.ctx.tools.get('speak')).toBeUndefined()
    } finally {
      await harness.ctx.fiber.dispose()
    }
  })
})

// ---------------------------------------------------------------------------
// U2: the speak tool three interfaces in one assertion
// ---------------------------------------------------------------------------

describe('speak tool three interfaces', () => {
  it('keeps the model schema, canonical value, and content blocks stable', async () => {
    const harness = await mountHarness()
    try {
      const schema = harness.ctx.tools.schemas().find(entry => entry.name === 'speak')
      expect(schema).toBeDefined()
      expect(schema!.parameters).toMatchObject({
        type: 'object',
        properties: {
          text: { type: 'string' },
          engine: { type: 'string', enum: ['auto', 'browser', 'edge-tts', 'piper'] },
        },
      })
      expect(schema!.parameters.required).toContain('text')

      const result = await harness.ctx.tools.execute({
        callId: CallId('dsh-talk-three-interfaces'),
        name: 'speak',
        arguments: { text: 'hello', engine: 'browser' },
        agent: harness.agent,
        signal: new AbortController().signal,
      })
      expect(result.isError).toBe(false)
      // Canonical value: the model-facing speak outcome.
      expect(result.value).toMatchObject({ spoken: true, engine: 'browser', audioBytes: 0 })
      expect(typeof (result.value as { utteranceId?: string }).utteranceId).toBe('string')
      // Content blocks: the rendered model text.
      expect(result.content).toEqual([{
        type: 'text',
        text: 'Spoke hello aloud with the browser engine.',
      }])
    } finally {
      await harness.ctx.fiber.dispose()
    }
  })
})

// ---------------------------------------------------------------------------
// U4: the explicit resolveConfig layer rejects invalid engine values
// ---------------------------------------------------------------------------

describe('resolveConfig engine fail-loud', () => {
  it('rejects an unknown stt engine with the real message', () => {
    expect(() => resolveConfig({ stt: { engine: 'bogus' as never } })).toThrow(/stt.engine must be one of "auto", "web", "funasr", "whisper"/u)
  })

  it('rejects funasr without an endpoint', () => {
    expect(() => resolveConfig({ stt: { engine: 'funasr' } })).toThrow(/engine is "funasr" but config.stt.funasr.url is not set/u)
  })

  it('rejects whisper without a model path', () => {
    expect(() => resolveConfig({ stt: { engine: 'whisper' } })).toThrow(/engine is "whisper" but config.stt.whisper.modelPath is not set/u)
  })

  it('rejects piper without a model path', () => {
    expect(() => resolveConfig({ tts: { engine: 'piper' } })).toThrow(/engine is "piper" but config.tts.piper.modelPath is not set/u)
  })
})
