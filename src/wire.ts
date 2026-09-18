/**
 * The `talk` Remote wire vocabulary: the status/audio/transcription/settings
 * payload types, their zod v4 validation schemas (the strict codecs both
 * Typert faces carry), and the invocation descriptors shared verbatim by the
 * host `./typert` manifest (`src/typert.host.ts`) and the client Remote
 * contribution (`src/client/remote.ts`). One canonical source keeps the two
 * codecs from ever drifting apart. Audio crosses the wire as a single base64
 * string inside one JSON payload; every scalar has an explicit shape.
 *
 * @module dsh-talk/wire
 */

import { z } from 'zod'
import type { InvocationDescriptor } from '@deepseek-ai/dsh-typert-protocol'
import type { SpeechReason, SpeechTtsEngine } from './vocabulary.ts'

/**
 * Strict wire codec carrying BOTH published and checkout faces: the
 * `schema` field feeds the npm-published 0.1.5-rc.2 line, `create` feeds the
 * checkout 0.1.6-alpha.1+ line (schemas materialize lazily on first use).
 * Built through a variable, so neither typecheck ruler flags the other
 * face's field as excess.
 */
function strictWire<T>(typeSymbol: string, schema: T) {
  return Object.freeze({ ...{ mode: 'strict' as const, typeSymbol, schema }, create: () => schema })
}

/** The engines the settings panel may select for speech-to-text. */
export const STT_ENGINES = ['auto', 'web', 'funasr', 'whisper'] as const

/** The engines the settings panel may select for text-to-speech. */
export const TTS_ENGINES = ['auto', 'browser', 'edge-tts', 'piper'] as const

/** Read-only settings snapshot served by `talk/status`. */
export interface TalkStatus {
  /** STT selection and resolved engine. */
  stt: {
    engine: (typeof STT_ENGINES)[number]
    resolved: 'web' | 'funasr' | 'whisper'
    language: string
    silenceFinaliseMs: number
    funasrUrl: string | null
    whisperModel: string | null
  }
  /** TTS selection and resolved engine. */
  tts: {
    engine: (typeof TTS_ENGINES)[number]
    resolved: 'browser' | 'edge-tts' | 'piper'
    voice: string | null
    fallbackToBrowser: boolean
    piperModel: string | null
    edgeTtsVoice: string
    /** Browser SpeechSynthesis delivery settings. */
    browser: {
      /** Preferred browser voice name; null = platform default. */
      voiceName: string | null
      /** SpeechSynthesis rate. */
      rate: number
      /** SpeechSynthesis pitch. */
      pitch: number
    }
  }
  /** Event announcement switches and phrases. */
  announce: {
    enabled: boolean
    onTurnEnd: boolean
    onApproval: boolean
    onError: boolean
  }
  /** Recording behavior. */
  record: {
    enabled: boolean
    hotkey: string | null
    maxSeconds: number
    autoSubmit: boolean
    /** Voice-activity detection (silence auto-end). */
    vad: {
      enabled: boolean
      silenceMs: number
      energyThreshold: number
    }
  }
  /** Whether starting to talk interrupts playback. */
  interrupt: boolean
  /** Absolute path of the patch layer settings writes append to, or null. */
  patchFile: string | null
}

/** Strict wire schema for {@link TalkStatus}. */
export const TALK_STATUS_SCHEMA = z.object({
  stt: z.object({
    engine: z.union([z.literal('auto'), z.literal('web'), z.literal('funasr'), z.literal('whisper')]),
    resolved: z.union([z.literal('web'), z.literal('funasr'), z.literal('whisper')]),
    language: z.string(),
    silenceFinaliseMs: z.number().int().min(500).max(15000),
    funasrUrl: z.string().nullable(),
    whisperModel: z.string().nullable(),
  }),
  tts: z.object({
    engine: z.union([z.literal('auto'), z.literal('browser'), z.literal('edge-tts'), z.literal('piper')]),
    resolved: z.union([z.literal('browser'), z.literal('edge-tts'), z.literal('piper')]),
    voice: z.string().nullable(),
    fallbackToBrowser: z.boolean(),
    piperModel: z.string().nullable(),
    edgeTtsVoice: z.string(),
    browser: z.object({
      voiceName: z.string().nullable(),
      rate: z.number().min(0.1).max(10),
      pitch: z.number().min(0).max(2),
    }),
  }),
  announce: z.object({
    enabled: z.boolean(),
    onTurnEnd: z.boolean(),
    onApproval: z.boolean(),
    onError: z.boolean(),
  }),
  record: z.object({
    enabled: z.boolean(),
    hotkey: z.string().nullable(),
    maxSeconds: z.number().int(),
    autoSubmit: z.boolean(),
    vad: z.object({
      enabled: z.boolean(),
      silenceMs: z.number().int(),
      energyThreshold: z.number(),
    }),
  }),
  interrupt: z.boolean(),
  patchFile: z.string().nullable(),
})

/** Synthesized audio served by `talk/audio`. */
export interface TalkAudio {
  /** The utterance id requested. */
  utteranceId: string
  /** MIME type: `audio/wav` (piper) or `audio/mpeg` (edge-tts). */
  mime: string
  /** Audio bytes as base64. */
  data: string
  /** The spoken text (sanitized). */
  text: string
  /** Engine that produced the audio. */
  engine: 'edge-tts' | 'piper'
}

/** Strict wire schema for {@link TalkAudio}. */
export const TALK_AUDIO_SCHEMA = z.object({
  utteranceId: z.string(),
  mime: z.string(),
  data: z.string(),
  text: z.string(),
  engine: z.union([z.literal('edge-tts'), z.literal('piper')]),
})

/** Result of `talk/transcribe`: the recognized text. */
export interface TalkTranscript {
  /** Recognized text, trimmed. */
  text: string
  /** Engine that ran on the host. */
  engine: 'whisper' | 'funasr'
  /** Language the engine used (`auto` when detection was left to it). */
  language: string
}

/** Strict wire schema for {@link TalkTranscript}. */
export const TALK_TRANSCRIPT_SCHEMA = z.object({
  text: z.string(),
  engine: z.union([z.literal('whisper'), z.literal('funasr')]),
  language: z.string(),
})

/** Settings the panel may change. */
export interface TalkSettingsInput {
  /** STT engine selection. */
  sttEngine?: (typeof STT_ENGINES)[number] | undefined
  /** TTS engine selection. */
  ttsEngine?: (typeof TTS_ENGINES)[number] | undefined
  /** BCP-47 language or `auto`. */
  language?: string | undefined
  /** Master announcement switch. */
  announceEnabled?: boolean | undefined
  /** Announce turn completion. */
  onTurnEnd?: boolean | undefined
  /** Announce pending approvals. */
  onApproval?: boolean | undefined
  /** Announce errors. */
  onError?: boolean | undefined
  /** Whether talking interrupts playback. */
  interrupt?: boolean | undefined
}

/** Strict wire schema for {@link TalkSettingsInput}. */
export const TALK_SETTINGS_INPUT_SCHEMA = z.object({
  sttEngine: z.union([z.literal('auto'), z.literal('web'), z.literal('funasr'), z.literal('whisper')]).optional(),
  ttsEngine: z.union([z.literal('auto'), z.literal('browser'), z.literal('edge-tts'), z.literal('piper')]).optional(),
  language: z.string().optional(),
  announceEnabled: z.boolean().optional(),
  onTurnEnd: z.boolean().optional(),
  onApproval: z.boolean().optional(),
  onError: z.boolean().optional(),
  interrupt: z.boolean().optional(),
})

/** Result of `talk/applySettings`: the appended patch operation. */
export interface TalkSettingsResult {
  /** Absolute file the fragment was appended to. */
  file: string
  /** Absolute timestamped backup created before the append. */
  backupPath: string
  /** Bytes appended. */
  bytes: number
  /** What the user should do next (reload note). */
  note: string
}

/** Strict wire schema for {@link TalkSettingsResult}. */
export const TALK_SETTINGS_RESULT_SCHEMA = z.object({
  file: z.string(),
  backupPath: z.string(),
  bytes: z.number().int(),
  note: z.string(),
})

/** Result of `talk/interrupt`: the host's in-flight synthesis stop. */
export interface TalkInterruptResult {
  /** Whether any in-flight synthesis existed to stop. */
  stopped: boolean
}

/** Strict wire schema for {@link TalkInterruptResult}. */
export const TALK_INTERRUPT_RESULT_SCHEMA = z.object({
  stopped: z.boolean(),
})

/**
 * Result of `talk/latest`: the newest utterance recorded for ONE session, plus
 * that session's speech-log counters. Keyed by session id on purpose — a
 * multi-session client asks about the session it is showing instead of reading
 * whichever session spoke last.
 */
export interface TalkLatest {
  /** The session this record belongs to (echoes the request). */
  sessionId: string
  /** Stable utterance id for `talk/audio`. */
  utteranceId: string
  /** Engine that produced (or will produce) the audio. */
  engine: SpeechTtsEngine
  /** The spoken text, sanitized and capped. */
  text: string
  /** Synthesized audio size in bytes; 0 for the browser engine. */
  audioBytes: number
  /** What triggered the utterance. */
  reason: SpeechReason
  /** Whether this utterance was appended to the session log (false = gate skip). */
  logged: boolean
  /** Utterances this session appended to its log so far. */
  appended: number
  /** Utterances this host could not append for this session so far. */
  skipped: number
  /** Sanitized failure note; absent on success. */
  error?: string
  /** True when the utterance was interrupted. */
  interrupted?: true
}

/** Strict wire schema for {@link TalkLatest}. */
export const TALK_LATEST_SCHEMA = z.object({
  sessionId: z.string(),
  utteranceId: z.string(),
  engine: z.union([z.literal('browser'), z.literal('edge-tts'), z.literal('piper')]),
  text: z.string(),
  audioBytes: z.number().int(),
  reason: z.union([z.literal('speak-tool'), z.literal('turn-end'), z.literal('approval'), z.literal('error')]),
  logged: z.boolean(),
  appended: z.number().int(),
  skipped: z.number().int(),
  error: z.string().optional(),
  interrupted: z.literal(true).optional(),
})

/** Frozen source position both faces carry (diagnostics only). */
const SOURCE = Object.freeze({ file: 'src/wire.ts', line: 1, column: 1 })

/** The `talk/status` invocation descriptor. */
export const TALK_STATUS_DESCRIPTOR = Object.freeze({
  id: 'dsh-talk#talk/status',
  service: 'talk',
  namespace: 'talk',
  method: 'status',
  invocation: Object.freeze({ kind: 'direct' }),
  parameters: Object.freeze([]),
  result: strictWire('dsh-talk/types#TalkStatus', TALK_STATUS_SCHEMA),
  sourceLocation: SOURCE,
} as const) satisfies InvocationDescriptor

/** The `talk/audio` invocation descriptor. */
export const TALK_AUDIO_DESCRIPTOR = Object.freeze({
  id: 'dsh-talk#talk/audio',
  service: 'talk',
  namespace: 'talk',
  method: 'audio',
  invocation: Object.freeze({ kind: 'direct' }),
  parameters: Object.freeze([Object.freeze({
    name: 'utteranceId',
    wire: 'utteranceId',
    source: 'json',
    codec: strictWire('dsh-talk/types#TalkAudioUtteranceId', z.string()),
  } satisfies InvocationDescriptor['parameters'][number])]),
  result: strictWire('dsh-talk/types#TalkAudio', z.union([TALK_AUDIO_SCHEMA, z.null()])),
  sourceLocation: SOURCE,
} as const) satisfies InvocationDescriptor

/** The `talk/transcribe` invocation descriptor. */
export const TALK_TRANSCRIBE_DESCRIPTOR = Object.freeze({
  id: 'dsh-talk#talk/transcribe',
  service: 'talk',
  namespace: 'talk',
  method: 'transcribe',
  invocation: Object.freeze({ kind: 'direct' }),
  parameters: Object.freeze([Object.freeze({
    name: 'audioData',
    wire: 'audioData',
    source: 'json',
    codec: strictWire('dsh-talk/types#TalkTranscribeAudioData', z.string()),
  } satisfies InvocationDescriptor['parameters'][number])]),
  result: strictWire('dsh-talk/types#TalkTranscript', TALK_TRANSCRIPT_SCHEMA),
  sourceLocation: SOURCE,
} as const) satisfies InvocationDescriptor

/** The `talk/applySettings` invocation descriptor. */
export const TALK_APPLY_SETTINGS_DESCRIPTOR = Object.freeze({
  id: 'dsh-talk#talk/applySettings',
  service: 'talk',
  namespace: 'talk',
  method: 'applySettings',
  invocation: Object.freeze({ kind: 'direct' }),
  parameters: Object.freeze([Object.freeze({
    name: 'settings',
    wire: 'settings',
    source: 'json',
    codec: strictWire('dsh-talk/types#TalkSettingsInput', TALK_SETTINGS_INPUT_SCHEMA),
  } satisfies InvocationDescriptor['parameters'][number])]),
  result: strictWire('dsh-talk/types#TalkSettingsResult', TALK_SETTINGS_RESULT_SCHEMA),
  sourceLocation: SOURCE,
} as const) satisfies InvocationDescriptor

/** The `talk/interrupt` invocation descriptor. */
export const TALK_INTERRUPT_DESCRIPTOR = Object.freeze({
  id: 'dsh-talk#talk/interrupt',
  service: 'talk',
  namespace: 'talk',
  method: 'interrupt',
  invocation: Object.freeze({ kind: 'direct' }),
  parameters: Object.freeze([]),
  result: strictWire('dsh-talk/types#TalkInterruptResult', TALK_INTERRUPT_RESULT_SCHEMA),
  sourceLocation: SOURCE,
} as const) satisfies InvocationDescriptor

/**
 * The `talk/latest` invocation descriptor. The session id is a REQUIRED
 * parameter: the host keys its per-session record table by it, so one session
 * can never read another's utterance.
 */
export const TALK_LATEST_DESCRIPTOR = Object.freeze({
  id: 'dsh-talk#talk/latest',
  service: 'talk',
  namespace: 'talk',
  method: 'latest',
  invocation: Object.freeze({ kind: 'direct' }),
  parameters: Object.freeze([Object.freeze({
    name: 'sessionId',
    wire: 'sessionId',
    source: 'json',
    codec: strictWire('dsh-talk/types#TalkLatestSessionId', z.string()),
  } satisfies InvocationDescriptor['parameters'][number])]),
  result: strictWire('dsh-talk/types#TalkLatest', z.union([TALK_LATEST_SCHEMA, z.null()])),
  sourceLocation: SOURCE,
} as const) satisfies InvocationDescriptor

/**
 * The canonical invocation list both Typert faces register — the host
 * manifest and the client contribution share these exact descriptor objects.
 */
export const TALK_INVOCATIONS = Object.freeze([
  TALK_STATUS_DESCRIPTOR,
  TALK_AUDIO_DESCRIPTOR,
  TALK_TRANSCRIBE_DESCRIPTOR,
  TALK_APPLY_SETTINGS_DESCRIPTOR,
  TALK_INTERRUPT_DESCRIPTOR,
  TALK_LATEST_DESCRIPTOR,
])
