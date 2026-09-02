/**
 * The speak tool through the REAL tool registry: registration, schema
 * validation, the browser-engine fast path, the local-engine failure →
 * browser fallback, and the interrupt outcome. The subprocess provider is
 * scripted; every other piece of the pipeline runs for real.
 *
 * @module dsh-talk/test/tool.spec
 */

import { describe, expect, it } from 'vitest'
import type { ToolExecutionResult } from '@deepseek-ai/dsh-tools'
import { mountHarness, type Harness } from './harness.ts'

let callCounter = 0

/** Execute-parameter brand of the call id (CallId on rc.2, ToolCallId on 0.1.2-alpha). */
type ExecuteArgs = Parameters<Harness['ctx']['tools']['execute']>[0]

/** Build a call id typed to whichever brand the resolved tool registry expects. */
function callIdOf(id: string): ExecuteArgs['callId'] {
  return id as ExecuteArgs['callId']
}

async function callTool(harness: Harness, args: unknown): Promise<ToolExecutionResult> {
  callCounter += 1
  return harness.ctx.tools.execute({
    callId: callIdOf(`talk-spec-${callCounter}`),
    name: 'speak',
    arguments: args,
    agent: harness.agent,
    signal: new AbortController().signal,
  })
}

describe('speak tool', () => {
  it('registers in the real registry', async () => {
    const harness = await mountHarness()
    expect(harness.ctx.tools.get('speak')).toBeDefined()
  })

  it('rejects empty text', async () => {
    const harness = await mountHarness()
    const result = await callTool(harness, { text: '   ' })
    expect(result.isError).toBe(true)
  })

  it('speaks through the browser engine without subprocess I/O', async () => {
    const harness = await mountHarness()
    const result = await callTool(harness, { text: 'hello', engine: 'browser' })
    expect(result.isError).toBe(false)
    if (result.isError) return
    const value = result.value as { spoken: boolean; engine: string; audioBytes: number }
    expect(value.spoken).toBe(true)
    expect(value.engine).toBe('browser')
    expect(value.audioBytes).toBe(0)
    // Model-visible ⟺ logged: the utterance landed in the session log.
    const speech = harness.session.snapshotEvents().filter(event => event.type === 'dsh-talk/speech')
    expect(speech.length).toBeGreaterThan(0)
  })

  it('carries browser delivery settings and the per-call voice override in the speech event', async () => {
    const harness = await mountHarness({ tts: { browser: { voiceName: 'Configured Voice', rate: 1.5, pitch: 0.8 } } })
    await callTool(harness, { text: 'hello', engine: 'browser' })
    let data = (harness.session.snapshotEvents().filter(event => event.type === 'dsh-talk/speech').at(-1)?.data ?? {}) as {
      voice?: string
      rate?: number
      pitch?: number
    }
    expect(data.voice).toBe('Configured Voice')
    expect(data.rate).toBe(1.5)
    expect(data.pitch).toBe(0.8)
    await callTool(harness, { text: 'hello again', engine: 'browser', voice: 'Override Voice' })
    data = (harness.session.snapshotEvents().filter(event => event.type === 'dsh-talk/speech').at(-1)?.data ?? {}) as typeof data
    expect(data.voice).toBe('Override Voice')
    expect(data.rate).toBe(1.5)
    expect(data.pitch).toBe(0.8)
  })

  it('omits browser delivery fields on local-engine utterances', async () => {
    const harness = await mountHarness()
    harness.subprocess.nextSynthBytes = 'ID3-fake-audio'
    const result = await callTool(harness, { text: 'hello', engine: 'edge-tts', interrupt: false })
    expect(result.isError).toBe(false)
    if (result.isError) throw new Error('expected successful local synthesis')
    expect(result.value).toMatchObject({ spoken: true, engine: 'edge-tts' })
    const data = (harness.session.snapshotEvents().filter(event => event.type === 'dsh-talk/speech').at(-1)?.data ?? {}) as Record<string, unknown>
    expect(data.engine).toBe('edge-tts')
    expect('voice' in data).toBe(false)
    expect('rate' in data).toBe(false)
    expect('pitch' in data).toBe(false)
  })

  it('falls back to the browser voice when edge-tts fails', async () => {
    const harness = await mountHarness()
    harness.subprocess.nextExitCode = 1
    harness.subprocess.nextStderr = 'edge-tts exploded'
    const result = await callTool(harness, { text: 'hello', engine: 'edge-tts', interrupt: false })
    expect(result.isError).toBe(false)
    if (result.isError) return
    const value = result.value as { engine: string; error?: string }
    expect(value.engine).toBe('browser')
    expect(value.error).toContain('edge-tts')
    expect(harness.subprocess.spawns.length).toBeGreaterThan(0)
  })

  it('refuses a hostile engine value at the schema boundary', async () => {
    const harness = await mountHarness()
    const result = await callTool(harness, { text: 'hi', engine: 'rm-rf' })
    expect(result.isError).toBe(true)
  })
})
