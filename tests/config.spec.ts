/**
 * Config contract: the Schemastery schema fills leaf defaults on an empty
 * input, rejects out-of-range values loudly, and `resolveConfig` re-judges
 * every default for programmatic mounts plus the cross-field engine checks.
 *
 * @module dsh-talk/test/config.spec
 */

import { describe, expect, it } from 'vitest'
import { Config, resolveConfig, MAX_RECORD_SECONDS } from '../src/config.ts'

describe('Config schema', () => {
  it('fills every leaf default on an empty input', () => {
    const normalized = Config({}) as { record: { enabled: boolean }; stt: { engine: string; language: string; interim: boolean }; tts: { engine: string; rate: number }; announce: { enabled: boolean; messages: { turnEnd: string } } }
    expect(normalized.record.enabled).toBe(true)
    expect(normalized.stt.engine).toBe('auto')
    expect(normalized.stt.language).toBe('auto')
    expect(normalized.stt.interim).toBe(true)
    expect(normalized.tts.engine).toBe('auto')
    expect(normalized.tts.rate).toBe(0)
    expect(normalized.announce.enabled).toBe(true)
    expect(normalized.announce.messages.turnEnd).toBe('Turn complete.')
  })

  it('keeps nested defaults when only a leaf is overridden', () => {
    const normalized = Config({ record: { autoSubmit: true } }) as { record: { autoSubmit: boolean; enabled: boolean }; stt: { interim: boolean } }
    expect(normalized.record.autoSubmit).toBe(true)
    expect(normalized.record.enabled).toBe(true)
    expect(normalized.stt.interim).toBe(true)
  })

  it('rejects a recording cap above the ceiling', () => {
    expect(() => Config({ record: { maxSeconds: MAX_RECORD_SECONDS + 1 } })).toThrow()
  })

  it('rejects an unknown STT engine', () => {
    expect(() => Config({ stt: { engine: 'watson' as 'web' } })).toThrow()
  })
})

describe('resolveConfig', () => {
  it('re-validates bounds for a programmatic mount', () => {
    expect(() => resolveConfig({ maxSpeakChars: 0 })).toThrow(/maxSpeakChars/u)
  })

  it('fails loud when funasr is selected without an endpoint', () => {
    expect(() => resolveConfig({ stt: { engine: 'funasr' } })).toThrow(/funasr/u)
  })

  it('fails loud when piper is selected without a model', () => {
    expect(() => resolveConfig({ tts: { engine: 'piper' } })).toThrow(/piper/u)
  })

  it('accepts the auto engine without any local model', () => {
    const resolved = resolveConfig({})
    expect(resolved.sttEngine).toBe('auto')
    expect(resolved.ttsEngine).toBe('auto')
  })

  it('keeps the default announce messages', () => {
    const resolved = resolveConfig({})
    expect(resolved.messageApproval).toBe('Approval required.')
  })
})
