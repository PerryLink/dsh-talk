/**
 * Engine command builders: argv shape, rate/length-scale mapping, whisper
 * language handling, and the abort/failure classification contract.
 *
 * @module dsh-talk/test/engine.spec
 */

import { describe, expect, it } from 'vitest'
import { resolveConfig } from '../src/config.ts'
import { edgeTtsArgv, piperSpec, whisperArgv } from '../src/engine.ts'

describe('edgeTtsArgv', () => {
  it('builds the full edge-tts argv with a positive rate', () => {
    const resolved = resolveConfig({ tts: { rate: 20, edgeTts: { voice: 'en-US-AriaNeural' } } })
    const argv = edgeTtsArgv(resolved, 'hello', 'C:\\tmp\\out.mp3')
    expect(argv).toEqual([
      'edge-tts',
      '--voice', 'en-US-AriaNeural',
      '--rate=+20%',
      '--text', 'hello',
      '--write-media', 'C:\\tmp\\out.mp3',
    ])
  })

  it('uses the resolved tts voice override', () => {
    const resolved = resolveConfig({ tts: { voice: 'zh-CN-XiaoxiaoNeural' } })
    const argv = edgeTtsArgv(resolved, 'hi', '/tmp/out.mp3')
    expect(argv[2]).toBe('zh-CN-XiaoxiaoNeural')
  })
})

describe('piperSpec', () => {
  it('maps a positive rate onto a shorter length scale', () => {
    const resolved = resolveConfig({ tts: { rate: 40, piper: { modelPath: 'en.onnx' } } })
    const spec = piperSpec(resolved, '/tmp/out.wav')
    expect(spec.argv[0]).toBe('piper')
    expect(spec.argv).toContain('--model')
    expect(spec.argv).toContain('en.onnx')
    expect(spec.argv).toContain('--length_scale')
    expect(Number(spec.argv[spec.argv.indexOf('--length_scale') + 1])).toBeLessThan(1)
    expect(spec.stdin).toBe('')
  })
})

describe('whisperArgv', () => {
  it('passes the language tag when configured', () => {
    const resolved = resolveConfig({ stt: { whisper: { modelPath: 'ggml.bin', language: 'en' } } })
    const argv = whisperArgv(resolved, '/tmp/in.wav', '/tmp/base', 'auto')
    expect(argv[0]).toBe('whisper-cli')
    expect(argv).toContain('--language')
    expect(argv).toContain('en')
  })

  it('omits the language flag for auto', () => {
    const resolved = resolveConfig({ stt: { whisper: { modelPath: 'ggml.bin' } } })
    const argv = whisperArgv(resolved, '/tmp/in.wav', '/tmp/base', 'auto')
    expect(argv).not.toContain('--language')
  })
})
