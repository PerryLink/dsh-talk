/**
 * Browser-voice selection for SpeechSynthesis playback: exact match wins,
 * case-insensitive second, anything else falls back to the platform default.
 *
 * @module dsh-talk/test/browser-voice.spec
 */

import { describe, expect, it } from 'vitest'
import { selectBrowserVoice } from '../src/client/browserVoice.ts'

const VOICES = [
  { name: 'Microsoft Aria Online (Natural) - English (United States)', lang: 'en-US' },
  { name: 'Google UK English Female', lang: 'en-GB' },
  { name: 'espeak-ng-english', lang: 'en' },
] as const

describe('selectBrowserVoice', () => {
  it('matches an exact voice name', () => {
    expect(selectBrowserVoice(VOICES, 'Google UK English Female')?.name).toBe('Google UK English Female')
  })

  it('matches case-insensitively when the exact form is absent', () => {
    expect(selectBrowserVoice(VOICES, 'google uk english female')?.lang).toBe('en-GB')
  })

  it('returns undefined for an unknown voice so playback keeps the platform default', () => {
    expect(selectBrowserVoice(VOICES, 'No Such Voice')).toBeUndefined()
  })

  it('returns undefined for unset or empty names', () => {
    expect(selectBrowserVoice(VOICES, undefined)).toBeUndefined()
    expect(selectBrowserVoice(VOICES, '')).toBeUndefined()
  })

  it('tolerates the empty pre-populated voice list', () => {
    expect(selectBrowserVoice([], 'Google UK English Female')).toBeUndefined()
  })
})
