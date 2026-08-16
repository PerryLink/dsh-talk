/**
 * Plugin configuration and its explicit resolve step. `resolveConfig` re-judges
 * every default and bound so programmatic construction that bypasses
 * Schemastery normalization still fails loud instead of running with hidden
 * defaults (the explicit-resolve contract).
 *
 * @module dsh-talk/config
 */

import z from '@deepseek-ai/schemastery'

/** Speech-to-text engines. `auto` prefers a configured local engine, then Web Speech. */
export type SttEngine = 'auto' | 'web' | 'funasr' | 'whisper'

/** Text-to-speech engines. `auto` prefers piper, then edge-tts, then the browser voice. */
export type TtsEngine = 'auto' | 'browser' | 'edge-tts' | 'piper'

/** Default recording cap in seconds. */
export const DEFAULT_MAX_RECORD_SECONDS = 60

/** Ceiling for one recording: the client holds the whole clip in memory. */
export const MAX_RECORD_SECONDS = 600

/** Default speak-tool text cap in characters. */
export const DEFAULT_MAX_SPEAK_CHARS = 20_000

/** Ceiling for one speak request. */
export const MAX_SPEAK_CHARS = 100_000

/** Default announce-master switch. */
export const DEFAULT_ANNOUNCE_ENABLED = true

/** Default in-memory audio cache cap in bytes (8 MiB). */
export const DEFAULT_MAX_AUDIO_CACHE_BYTES = 8 * 1024 * 1024

/** Ceiling for the audio cache. */
export const MAX_AUDIO_CACHE_BYTES = 64 * 1024 * 1024

/** Recording behavior: the composer microphone button and its hotkey. */
export interface RecordConfig {
  /** Show the microphone button and allow recording (default true). */
  enabled?: boolean
  /** Optional toggle hotkey such as "alt+r"; unset = click only. */
  hotkey?: string | null
  /** Recording cap in seconds (default 60). */
  maxSeconds?: number
  /** Submit the transcription as the user message automatically (default false). */
  autoSubmit?: boolean
}

/** Speech-to-text configuration. */
export interface SttConfig {
  /** Engine selection: auto | web | funasr | whisper (default auto). */
  engine?: SttEngine
  /** BCP-47 language code such as "en-US", or "auto" (default auto). */
  language?: string
  /** Show interim transcriptions while speaking (Web Speech; default true). */
  interim?: boolean
  /** FunASR HTTP inference server (used when engine resolves to funasr). */
  funasr?: {
    /** Full inference endpoint URL; required for the funasr engine. */
    url?: string
    /** Model name sent to the server; unset = server default. */
    model?: string
  }
  /** whisper.cpp local engine (used when engine resolves to whisper). */
  whisper?: {
    /** whisper.cpp executable (default "whisper-cli"). */
    command?: string
    /** Model file path; required for the whisper engine. */
    modelPath?: string
    /** Language override; unset = the global stt.language or auto-detect. */
    language?: string
  }
}

/** Text-to-speech configuration. */
export interface TtsConfig {
  /** Engine selection: auto | browser | edge-tts | piper (default auto). */
  engine?: TtsEngine
  /** Voice name override for the resolved engine; unset = engine default. */
  voice?: string
  /** Rate offset in percent (-50..50) for edge-tts/piper (default 0). */
  rate?: number
  /** Fall back to the browser voice when a local engine fails (default true). */
  fallbackToBrowser?: boolean
  /** Browser SpeechSynthesis settings. */
  browser?: {
    /** Preferred voice name; unset = platform default. */
    voiceName?: string
    /** SpeechSynthesis rate 0.1..10 (default 1). */
    rate?: number
    /** SpeechSynthesis pitch 0..2 (default 1). */
    pitch?: number
  }
  /** edge-tts local engine. */
  edgeTts?: {
    /** edge-tts executable (default "edge-tts"). */
    command?: string
    /** Azure neural voice name (default "en-US-JennyNeural"). */
    voice?: string
  }
  /** piper local engine. */
  piper?: {
    /** piper executable (default "piper"). */
    command?: string
    /** piper voice model file; required for the piper engine. */
    modelPath?: string
  }
}

/** Event announcement configuration. */
export interface AnnounceConfig {
  /** Master switch for all event announcements (default true). */
  enabled?: boolean
  /** Announce turn completion (default true). */
  onTurnEnd?: boolean
  /** Announce pending approvals (default true). */
  onApproval?: boolean
  /** Announce errors (default true). */
  onError?: boolean
  /** Spoken phrases; the English strings are the defaults. */
  messages?: {
    /** Spoken on turn completion (default "Turn complete."). */
    turnEnd?: string
    /** Spoken when an approval is requested (default "Approval required."). */
    approval?: string
    /** Spoken on error (default "Something went wrong."). */
    error?: string
  }
}

/** Plugin configuration. */
export interface Config {
  /** Microphone recording behavior. */
  record?: RecordConfig
  /** Speech-to-text configuration. */
  stt?: SttConfig
  /** Text-to-speech configuration. */
  tts?: TtsConfig
  /** Event announcement configuration. */
  announce?: AnnounceConfig
  /** Whether starting to talk interrupts current playback (default true). */
  interrupt?: boolean
  /** Cap on the speak tool's text length in characters (default 20000). */
  maxSpeakChars?: number
  /** In-memory synthesized-audio cache cap in bytes (default 8388608). */
  maxAudioCacheBytes?: number
}

/** Fully resolved configuration captured at plugin load. */
export interface ResolvedConfig {
  /** Whether the composer microphone button is enabled. */
  recordEnabled: boolean
  /** Toggle hotkey, or null for click-only. */
  recordHotkey: string | null
  /** Recording cap in seconds. */
  recordMaxSeconds: number
  /** Submit transcriptions automatically. */
  recordAutoSubmit: boolean
  /** Resolved STT engine preference. */
  sttEngine: SttEngine
  /** BCP-47 language or "auto". */
  sttLanguage: string
  /** Show interim transcriptions. */
  sttInterim: boolean
  /** FunASR inference endpoint, or null. */
  funasrUrl: string | null
  /** FunASR model name, or null for the server default. */
  funasrModel: string | null
  /** whisper.cpp executable. */
  whisperCommand: string
  /** whisper.cpp model path, or null. */
  whisperModelPath: string | null
  /** whisper.cpp language override, or null for the global language. */
  whisperLanguage: string | null
  /** Resolved TTS engine preference. */
  ttsEngine: TtsEngine
  /** Voice override, or null for the engine default. */
  ttsVoice: string | null
  /** Rate offset in percent for edge-tts/piper. */
  ttsRate: number
  /** Fall back to the browser voice on local-engine failure. */
  ttsFallbackToBrowser: boolean
  /** Preferred browser voice name, or null. */
  browserVoiceName: string | null
  /** SpeechSynthesis rate. */
  browserRate: number
  /** SpeechSynthesis pitch. */
  browserPitch: number
  /** edge-tts executable. */
  edgeTtsCommand: string
  /** edge-tts voice name. */
  edgeTtsVoice: string
  /** piper executable. */
  piperCommand: string
  /** piper model path, or null. */
  piperModelPath: string | null
  /** Whether any event announcements are enabled. */
  announceEnabled: boolean
  /** Announce turn completion. */
  announceOnTurnEnd: boolean
  /** Announce pending approvals. */
  announceOnApproval: boolean
  /** Announce errors. */
  announceOnError: boolean
  /** Spoken phrase for turn completion. */
  messageTurnEnd: string
  /** Spoken phrase for approvals. */
  messageApproval: string
  /** Spoken phrase for errors. */
  messageError: string
  /** Whether talking interrupts current playback. */
  interruptEnabled: boolean
  /** Cap on the speak tool's text length. */
  maxSpeakChars: number
  /** In-memory synthesized-audio cache cap in bytes. */
  maxAudioCacheBytes: number
}

/** Schemastery schema for loader-validated configuration. */
export const Config: z<Config> = z.object({
  record: z.object({
    enabled: z.boolean().default(true),
    hotkey: z.union([z.string(), z.const(null)]).default(null),
    maxSeconds: z.number().min(1).max(MAX_RECORD_SECONDS).default(DEFAULT_MAX_RECORD_SECONDS),
    autoSubmit: z.boolean().default(false),
  }),
  stt: z.object({
    engine: z.union(['auto', 'web', 'funasr', 'whisper'] as const).default('auto'),
    language: z.string().default('auto'),
    interim: z.boolean().default(true),
    funasr: z.object({
      url: z.string(),
      model: z.string(),
    }),
    whisper: z.object({
      command: z.string().default('whisper-cli'),
      modelPath: z.string(),
      language: z.string(),
    }),
  }),
  tts: z.object({
    engine: z.union(['auto', 'browser', 'edge-tts', 'piper'] as const).default('auto'),
    voice: z.string(),
    rate: z.number().min(-50).max(50).default(0),
    fallbackToBrowser: z.boolean().default(true),
    browser: z.object({
      voiceName: z.string(),
      rate: z.number().min(0.1).max(10).default(1),
      pitch: z.number().min(0).max(2).default(1),
    }),
    edgeTts: z.object({
      command: z.string().default('edge-tts'),
      voice: z.string().default('en-US-JennyNeural'),
    }),
    piper: z.object({
      command: z.string().default('piper'),
      modelPath: z.string(),
    }),
  }),
  announce: z.object({
    enabled: z.boolean().default(true),
    onTurnEnd: z.boolean().default(true),
    onApproval: z.boolean().default(true),
    onError: z.boolean().default(true),
    messages: z.object({
      turnEnd: z.string().default('Turn complete.'),
      approval: z.string().default('Approval required.'),
      error: z.string().default('Something went wrong.'),
    }),
  }),
  interrupt: z.boolean().default(true),
  maxSpeakChars: z.number().min(1).max(MAX_SPEAK_CHARS).default(DEFAULT_MAX_SPEAK_CHARS),
  maxAudioCacheBytes: z.number().min(1024 * 1024).max(MAX_AUDIO_CACHE_BYTES).default(DEFAULT_MAX_AUDIO_CACHE_BYTES),
})

const STT_ENGINES = ['auto', 'web', 'funasr', 'whisper'] as const
const TTS_ENGINES = ['auto', 'browser', 'edge-tts', 'piper'] as const

function isSttEngine(value: unknown): value is SttEngine {
  return typeof value === 'string' && (STT_ENGINES as readonly string[]).includes(value)
}

function isTtsEngine(value: unknown): value is TtsEngine {
  return typeof value === 'string' && (TTS_ENGINES as readonly string[]).includes(value)
}

function stringOf(value: unknown, fallback: string, label: string): string {
  if (value === undefined) return fallback
  if (typeof value !== 'string') throw new TypeError(`dsh-talk: config.${label} must be a string`)
  return value
}

function nullableStringOf(value: unknown, label: string): string | null {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string') throw new TypeError(`dsh-talk: config.${label} must be a string or null`)
  return value
}

function booleanOf(value: unknown, fallback: boolean, label: string): boolean {
  if (value === undefined) return fallback
  if (typeof value !== 'boolean') throw new TypeError(`dsh-talk: config.${label} must be a boolean`)
  return value
}

function numberOf(value: unknown, fallback: number, min: number, max: number, label: string): number {
  if (value === undefined) return fallback
  if (!Number.isFinite(value) || (value as number) < min || (value as number) > max) {
    throw new Error(`dsh-talk: config.${label} must be a finite number between ${min} and ${max}`)
  }
  return value as number
}

/**
 * Resolve raw config to the runtime policy, re-validating defaults and bounds.
 * Cross-field consistency (an engine that requires a model path or endpoint)
 * fails here too, so a misconfigured row is loud at load instead of failing
 * on the first utterance.
 *
 * @param config - raw loader config; `undefined` for a bare row.
 * @returns the frozen resolved config.
 */
export function resolveConfig(config: Config | undefined): ResolvedConfig {
  const record = config?.record ?? {}
  const stt = config?.stt ?? {}
  const tts = config?.tts ?? {}
  const announce = config?.announce ?? {}
  const messages = announce.messages ?? {}

  const recordEnabled = booleanOf(record.enabled, true, 'record.enabled')
  const recordHotkey = nullableStringOf(record.hotkey, 'record.hotkey')
  if (recordHotkey !== null && recordHotkey.length > 40) {
    throw new Error('dsh-talk: config.record.hotkey must be at most 40 characters')
  }
  const recordMaxSeconds = numberOf(record.maxSeconds, DEFAULT_MAX_RECORD_SECONDS, 1, MAX_RECORD_SECONDS, 'record.maxSeconds')
  const recordAutoSubmit = booleanOf(record.autoSubmit, false, 'record.autoSubmit')

  const sttEngineRaw = stt.engine ?? 'auto'
  if (!isSttEngine(sttEngineRaw)) {
    throw new Error(`dsh-talk: config.stt.engine must be one of "auto", "web", "funasr", "whisper", got ${JSON.stringify(sttEngineRaw)}`)
  }
  const sttLanguage = stringOf(stt.language, 'auto', 'stt.language')
  if (sttLanguage !== 'auto' && !/^[a-zA-Z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$/.test(sttLanguage)) {
    throw new Error(`dsh-talk: config.stt.language must be "auto" or a BCP-47 tag, got ${JSON.stringify(sttLanguage)}`)
  }
  const sttInterim = booleanOf(stt.interim, true, 'stt.interim')

  const funasrUrl = nullableStringOf(stt.funasr?.url, 'stt.funasr.url')
  const funasrModel = nullableStringOf(stt.funasr?.model, 'stt.funasr.model')
  const whisperCommand = stringOf(stt.whisper?.command, 'whisper-cli', 'stt.whisper.command')
  if (whisperCommand.length === 0) throw new Error('dsh-talk: config.stt.whisper.command must not be empty')
  const whisperModelPath = nullableStringOf(stt.whisper?.modelPath, 'stt.whisper.modelPath')
  const whisperLanguage = nullableStringOf(stt.whisper?.language, 'stt.whisper.language')

  const ttsEngineRaw = tts.engine ?? 'auto'
  if (!isTtsEngine(ttsEngineRaw)) {
    throw new Error(`dsh-talk: config.tts.engine must be one of "auto", "browser", "edge-tts", "piper", got ${JSON.stringify(ttsEngineRaw)}`)
  }
  const ttsVoice = nullableStringOf(tts.voice, 'tts.voice')
  const ttsRate = numberOf(tts.rate, 0, -50, 50, 'tts.rate')
  const ttsFallbackToBrowser = booleanOf(tts.fallbackToBrowser, true, 'tts.fallbackToBrowser')
  const browserVoiceName = nullableStringOf(tts.browser?.voiceName, 'tts.browser.voiceName')
  const browserRate = numberOf(tts.browser?.rate, 1, 0.1, 10, 'tts.browser.rate')
  const browserPitch = numberOf(tts.browser?.pitch, 1, 0, 2, 'tts.browser.pitch')
  const edgeTtsCommand = stringOf(tts.edgeTts?.command, 'edge-tts', 'tts.edgeTts.command')
  if (edgeTtsCommand.length === 0) throw new Error('dsh-talk: config.tts.edgeTts.command must not be empty')
  const edgeTtsVoice = stringOf(tts.edgeTts?.voice, 'en-US-JennyNeural', 'tts.edgeTts.voice')
  const piperCommand = stringOf(tts.piper?.command, 'piper', 'tts.piper.command')
  if (piperCommand.length === 0) throw new Error('dsh-talk: config.tts.piper.command must not be empty')
  const piperModelPath = nullableStringOf(tts.piper?.modelPath, 'tts.piper.modelPath')

  // Cross-field consistency: an engine the user explicitly selected must be
  // fully addressable, or the row fails at load instead of at first use.
  if (sttEngineRaw === 'funasr' && funasrUrl === null) {
    throw new Error('dsh-talk: config.stt.engine is "funasr" but config.stt.funasr.url is not set')
  }
  if (sttEngineRaw === 'whisper' && whisperModelPath === null) {
    throw new Error('dsh-talk: config.stt.engine is "whisper" but config.stt.whisper.modelPath is not set')
  }
  if (ttsEngineRaw === 'piper' && piperModelPath === null) {
    throw new Error('dsh-talk: config.tts.engine is "piper" but config.tts.piper.modelPath is not set')
  }

  const announceEnabled = booleanOf(announce.enabled, DEFAULT_ANNOUNCE_ENABLED, 'announce.enabled')
  const announceOnTurnEnd = booleanOf(announce.onTurnEnd, true, 'announce.onTurnEnd')
  const announceOnApproval = booleanOf(announce.onApproval, true, 'announce.onApproval')
  const announceOnError = booleanOf(announce.onError, true, 'announce.onError')
  const messageTurnEnd = stringOf(messages.turnEnd, 'Turn complete.', 'announce.messages.turnEnd')
  const messageApproval = stringOf(messages.approval, 'Approval required.', 'announce.messages.approval')
  const messageError = stringOf(messages.error, 'Something went wrong.', 'announce.messages.error')

  const interruptEnabled = booleanOf(config?.interrupt, true, 'interrupt')
  const maxSpeakChars = numberOf(config?.maxSpeakChars, DEFAULT_MAX_SPEAK_CHARS, 1, MAX_SPEAK_CHARS, 'maxSpeakChars')
  const maxAudioCacheBytes = numberOf(
    config?.maxAudioCacheBytes,
    DEFAULT_MAX_AUDIO_CACHE_BYTES,
    1024 * 1024,
    MAX_AUDIO_CACHE_BYTES,
    'maxAudioCacheBytes',
  )

  return Object.freeze({
    recordEnabled,
    recordHotkey,
    recordMaxSeconds,
    recordAutoSubmit,
    sttEngine: sttEngineRaw,
    sttLanguage,
    sttInterim,
    funasrUrl,
    funasrModel,
    whisperCommand,
    whisperModelPath,
    whisperLanguage,
    ttsEngine: ttsEngineRaw,
    ttsVoice,
    ttsRate,
    ttsFallbackToBrowser,
    browserVoiceName,
    browserRate,
    browserPitch,
    edgeTtsCommand,
    edgeTtsVoice,
    piperCommand,
    piperModelPath,
    announceEnabled,
    announceOnTurnEnd,
    announceOnApproval,
    announceOnError,
    messageTurnEnd,
    messageApproval,
    messageError,
    interruptEnabled,
    maxSpeakChars,
    maxAudioCacheBytes,
  })
}
