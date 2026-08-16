/**
 * Display/redaction: credential shapes, temp paths, control characters, and
 * length caps. The sanitizers must stay total — never throw, never leak.
 *
 * @module dsh-talk/test/sanitize.spec
 */

import { describe, expect, it } from 'vitest'
import { displayPath, redactSecrets, sanitizeText } from '../src/sanitize.ts'

describe('redactSecrets', () => {
  it('redacts sk- tokens', () => {
    expect(redactSecrets('key sk-abcdef1234567890 done')).toBe('key sk-*** done')
  })

  it('redacts bearer tokens', () => {
    expect(redactSecrets('Authorization: Bearer abc.def.ghi')).toBe('Authorization: Bearer ***')
  })

  it('redacts key=value assignments', () => {
    expect(redactSecrets('api_key=sk-abcdef1234567890')).toBe('api_key=***')
  })

  it('redacts JWTs', () => {
    expect(redactSecrets('x eyJhbGciOiJIUzI1NiJ9.abcdefghijklmnopqrstuvwxyz0123456789.signature')).toBe('x ***.jwt')
  })

  it('leaves ordinary prose alone', () => {
    expect(redactSecrets('Turn complete.')).toBe('Turn complete.')
  })

  it('is total on non-strings', () => {
    expect(redactSecrets(42)).toBe('')
    expect(redactSecrets(undefined)).toBe('')
  })
})

describe('sanitizeText', () => {
  it('strips control characters and collapses whitespace', () => {
    expect(sanitizeText('a\u0000b\u0007c\td', 100)).toBe('abc d')
  })

  it('caps with an ellipsis', () => {
    expect(sanitizeText('x'.repeat(500), 20)).toHaveLength(20)
    expect(sanitizeText('x'.repeat(500), 20).endsWith('…')).toBe(true)
  })

  it('keeps only the message of an Error', () => {
    expect(sanitizeText(new Error('boom')).length).toBeLessThanOrEqual(4000)
    expect(sanitizeText(new Error('boom'))).toBe('boom')
  })
})

describe('displayPath', () => {
  it('keeps only the last two segments', () => {
    expect(displayPath('C:\\Users\\me\\AppData\\Local\\Temp\\talk\\out.mp3')).toBe('talk/out.mp3')
  })

  it('collapses non-strings to empty', () => {
    expect(displayPath(null)).toBe('')
  })
})
