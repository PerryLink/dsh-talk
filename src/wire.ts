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
  result: Object.freeze({
    mode: 'strict',
    typeSymbol: 'dsh-talk/types#TalkStatus',
    schema: TALK_STATUS_SCHEMA,
  }),
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
    codec: Object.freeze({
      mode: 'strict',
      typeSymbol: 'dsh-talk/types#TalkAudioUtteranceId',
      schema: z.string(),
    }),
  } satisfies InvocationDescriptor['parameters'][number])]),
  result: Object.freeze({
    mode: 'strict',
    typeSymbol: 'dsh-talk/types#TalkAudio',
    // Null when the utterance was evicted from the in-memory cache.
    schema: z.union([TALK_AUDIO_SCHEMA, z.null()]),
  }),
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
    codec: Object.freeze({
      mode: 'strict',
      typeSymbol: 'dsh-talk/types#TalkTranscribeAudioData',
      schema: z.string(),
    }),
  } satisfies InvocationDescriptor['parameters'][number])]),
  result: Object.freeze({
    mode: 'strict',
    typeSymbol: 'dsh-talk/types#TalkTranscript',
    schema: TALK_TRANSCRIPT_SCHEMA,
  }),
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
    codec: Object.freeze({
      mode: 'strict',
      typeSymbol: 'dsh-talk/types#TalkSettingsInput',
      schema: TALK_SETTINGS_INPUT_SCHEMA,
    }),
  } satisfies InvocationDescriptor['parameters'][number])]),
  result: Object.freeze({
    mode: 'strict',
    typeSymbol: 'dsh-talk/types#TalkSettingsResult',
    schema: TALK_SETTINGS_RESULT_SCHEMA,
  }),
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
  result: Object.freeze({
    mode: 'strict',
    typeSymbol: 'dsh-talk/types#TalkInterruptResult',
    schema: TALK_INTERRUPT_RESULT_SCHEMA,
  }),
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
])
