/**
 * The talk host service: the `talk` Typert Remote namespace plus the speak
 * pipeline the tool and the announcement listeners share. It resolves the
 * effective engine, synthesizes local audio through `ctx.subprocess` (or
 * delegates to the browser voice), appends every utterance as a
 * `dsh-talk/speech` log-only session event, keeps an in-memory audio cache
 * for the client's `talk/audio` fetches, and applies the settings panel's
 * engine/language edits as append-only profile-patch operations.
 *
 * @module dsh-talk/service
 */

import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import type { Session } from '@deepseek-ai/dsh-session'
import type {} from '@deepseek-ai/dsh-subprocess'
import type { Config, ResolvedConfig, TtsEngine } from './config.ts'
import { EngineFailure, synthesize, transcribeFunasr, transcribeWhisper } from './engine.ts'
import { sanitizeText } from './sanitize.ts'
import {
  appendSettingsFragment,
  mergeTalkRowConfig,
  renderSettingsFragment,
  validateSettingsInput,
} from './settings-patch.ts'
import type { DshTalkSpeechEvent, SpeechReason, SpeechTtsEngine } from './speech.ts'
import type { TalkAudio, TalkInterruptResult, TalkSettingsInput, TalkSettingsResult, TalkStatus, TalkTranscript } from './wire.ts'

/** Profile patch-layer filename the settings panel appends to. */
const PROFILE_PATCH_FILENAME = 'cordis.patch.yml'

/** Cap on one synthesized utterance kept in memory (base64-unfriendly, so bytes). */
const MAX_UTTERANCE_COUNT = 64

/** One cached utterance the client fetches through `talk/audio`. */
interface StoredUtterance {
  /** MIME type of the audio. */
  mime: string
  /** The audio bytes. */
  data: Uint8Array
  /** The spoken text (sanitized). */
  text: string
  /** Engine that produced the audio. */
  engine: 'edge-tts' | 'piper'
}

/** Engine-specific delivery fields recorded with one speech event. */
type SpeechDelivery =
  | { readonly engine: 'browser'; readonly voice?: string; readonly rate: number; readonly pitch: number }
  | { readonly engine: 'edge-tts' | 'piper' }

/** Result of one speak request (the speak tool's canonical value). */
export interface SpeakOutcome {
  /** Whether audio was produced or delegated. */
  spoken: boolean
  /** Engine that produced (or will produce) the audio. */
  engine: SpeechTtsEngine
  /** Synthesized audio size in bytes; 0 for the browser engine. */
  audioBytes: number
  /** Wall-clock synthesis duration in seconds; absent for the browser engine. */
  durationSec?: number
  /** Sanitized failure note (fallback or interruption); absent on clean success. */
  error?: string
  /** The utterance id the client plays; absent when nothing was produced. */
  utteranceId?: string
}

/** Options for one speak request. */
export interface SpeakOptions {
  /** Engine override (tool arg); falls back to the resolved config. */
  engine?: TtsEngine
  /** Voice override (tool arg). */
  voice?: string
  /** Interrupt current speech before starting (default true). */
  interrupt?: boolean
  /** Why the utterance is spoken (logged with the event). */
  reason: SpeechReason
  /** Session the utterance is logged to; absent = no log (headless trial). */
  session?: Session
  /** Caller abort signal (the tool's exec signal). */
  signal?: AbortSignal
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** Voice-loop host service (this package). */
    talk: TalkService
  }
}

/**
 * Resolve the effective TTS engine: explicit override → configured engine →
 * `auto` prefers piper (configured model), then edge-tts, then the browser.
 *
 * @param explicit - tool-arg override, or undefined.
 * @param resolved - resolved config.
 * @returns the effective engine.
 */
export function resolveTtsEngine(explicit: TtsEngine | undefined, resolved: ResolvedConfig): 'browser' | 'edge-tts' | 'piper' {
  const selected = explicit ?? resolved.ttsEngine
  if (selected !== 'auto') return selected
  if (resolved.piperModelPath !== null) return 'piper'
  return 'edge-tts'
}

/**
 * Resolve the effective STT engine for host-side transcription: configured
 * engine → `auto` prefers funasr (configured endpoint), then whisper
 * (configured model), then the browser's Web Speech.
 *
 * @param resolved - resolved config.
 * @returns the effective engine.
 */
export function resolveSttEngine(resolved: ResolvedConfig): 'web' | 'funasr' | 'whisper' {
  if (resolved.sttEngine === 'funasr') return 'funasr'
  if (resolved.sttEngine === 'whisper') return 'whisper'
  if (resolved.sttEngine === 'web') return 'web'
  if (resolved.funasrUrl !== null) return 'funasr'
  if (resolved.whisperModelPath !== null) return 'whisper'
  return 'web'
}

/**
 * Voice-loop host service exported over the `talk` Remote namespace. Speak
 * requests from the tool and the announcement listeners land in {@link speak};
 * the client fetches audio, transcripts speech, interrupts playback, reads
 * the effective settings, and applies panel edits through the Remote methods.
 */
export class TalkService extends TypertRemoteService {
  static inject = ['subprocess']

  /** Cached utterances in insertion order (oldest first). */
  private readonly utterances = new Map<string, StoredUtterance>()
  /** Total cached audio bytes. */
  private totalCachedBytes = 0
  /** In-flight local syntheses by utterance id (abortable for interruption). */
  private readonly activeSyntheses = new Map<string, AbortController>()

  /**
   * @param ctx - context carrying the subprocess service.
   * @param rawConfig - the row's raw loader config (settings writes merge over it).
   * @param resolved - the resolved runtime policy.
   * @param backupCount - patch backups retained per settings write.
   */
  constructor(
    ctx: Context,
    private readonly rawConfig: Config | undefined,
    private readonly resolved: ResolvedConfig,
    private readonly backupCount: number,
  ) {
    super(ctx, 'talk')
  }

  /**
   * Speak one utterance: resolve the engine, synthesize locally or delegate
   * to the browser voice, cache the audio, and append the `dsh-talk/speech`
   * session event (log-only; appended without the `ignorable` marker, see `speech.ts`).
   *
   * @param text - text to speak (sanitized and capped here).
   * @param options - engine/voice/reason/session/signal.
   * @returns the speak outcome (the tool's canonical value).
   */
  async speak(text: string, options: SpeakOptions): Promise<SpeakOutcome> {
    const spoken = sanitizeText(text, this.resolved.maxSpeakChars)
    if (spoken === '') throw new Error('dsh-talk: speak text must not be empty')

    if (options.interrupt !== false) this.interrupt()

    const engine = resolveTtsEngine(options.engine, this.resolved)
    const utteranceId = randomUUID()

    if (engine === 'browser') {
      const event = this.speechEvent(utteranceId, this.browserDelivery(options.voice), spoken, 0, options.reason)
      this.appendSpeechEvent(options.session, event)
      return { spoken: true, engine: 'browser', audioBytes: 0, utteranceId }
    }

    const localEngine = engine // edge-tts | piper
    const controller = new AbortController()
    this.activeSyntheses.set(utteranceId, controller)
    const signal = options.signal === undefined ? controller.signal : AbortSignal.any([controller.signal, options.signal])
    const startedAt = Date.now()
    try {
      const result = await synthesize(this.ctx.subprocess, this.resolved, localEngine, spoken, signal)
      const durationSec = Math.max(0, (Date.now() - startedAt) / 1000)
      this.cacheUtterance(utteranceId, result.mime, result.data, spoken, localEngine)
      this.appendSpeechEvent(options.session, this.speechEvent(utteranceId, { engine: localEngine }, spoken, result.data.byteLength, options.reason))
      return { spoken: true, engine: localEngine, audioBytes: result.data.byteLength, durationSec, utteranceId }
    } catch (error) {
      const failure = error instanceof EngineFailure ? error : new EngineFailure(sanitizeText(error instanceof Error ? error.message : String(error)), false)
      if (failure.aborted) {
        this.appendSpeechEvent(options.session, this.speechEvent(utteranceId, { engine: localEngine }, spoken, 0, options.reason, 'interrupted', true))
        return { spoken: false, engine: localEngine, audioBytes: 0, error: 'interrupted', utteranceId }
      }
      if (this.resolved.ttsFallbackToBrowser) {
        this.appendSpeechEvent(options.session, this.speechEvent(utteranceId, this.browserDelivery(options.voice), spoken, 0, options.reason, failure.message))
        return {
          spoken: true,
          engine: 'browser',
          audioBytes: 0,
          error: `${localEngine} failed: ${failure.message}; fell back to the browser voice`,
          utteranceId,
        }
      }
      this.appendSpeechEvent(options.session, this.speechEvent(utteranceId, { engine: localEngine }, spoken, 0, options.reason, failure.message))
      return { spoken: false, engine: localEngine, audioBytes: 0, error: failure.message, utteranceId }
    } finally {
      this.activeSyntheses.delete(utteranceId)
    }
  }

  /** Assemble one speech event payload. */
  private speechEvent(
    utteranceId: string,
    delivery: SpeechDelivery,
    text: string,
    audioBytes: number,
    reason: SpeechReason,
    error?: string,
    interrupted?: boolean,
  ): DshTalkSpeechEvent {
    return {
      kind: 'tts',
      utteranceId,
      engine: delivery.engine,
      text,
      audioBytes,
      reason,
      ...(error !== undefined ? { error } : {}),
      ...(interrupted === true ? { interrupted: true } : {}),
      ...(delivery.engine === 'browser' ? {
        ...(delivery.voice !== undefined ? { voice: delivery.voice } : {}),
        rate: delivery.rate,
        pitch: delivery.pitch,
      } : {}),
    }
  }

  /**
   * Browser delivery settings for one utterance: the per-call `voice` override
   * wins over the configured `tts.browser.voiceName`; rate/pitch always ride
   * along so the client needs no settings round-trip at playback time.
   */
  private browserDelivery(voiceOverride?: string): Extract<SpeechDelivery, { readonly engine: 'browser' }> {
    return {
      engine: 'browser',
      ...(voiceOverride !== undefined
        ? { voice: voiceOverride }
        : this.resolved.browserVoiceName !== null ? { voice: this.resolved.browserVoiceName } : {}),
      rate: this.resolved.browserRate,
      pitch: this.resolved.browserPitch,
    }
  }

  /** Append one log-only speech event; a disposed session must never kill speech. */
  private appendSpeechEvent(session: Session | undefined, event: DshTalkSpeechEvent): void {
    if (session === undefined) return
    try {
      // Two-argument append: the pinned 0.1.0-rc.6 peers have no append-envelope
      // option; the two-argument form typechecks against rc.6 and newer builds.
      session.append('dsh-talk/speech', event)
    } catch (error) {
      this.ctx.logger.warn(`dsh-talk: failed to log speech event: ${sanitizeText(error instanceof Error ? error.message : String(error))}`)
    }
  }

  /** Store one utterance, evicting the oldest entries past the byte/count caps. */
  private cacheUtterance(
    utteranceId: string,
    mime: string,
    data: Uint8Array,
    text: string,
    engine: 'edge-tts' | 'piper',
  ): void {
    const maxBytes = this.resolved.maxAudioCacheBytes
    this.utterances.set(utteranceId, { mime, data, text, engine })
    this.totalCachedBytes += data.byteLength
    while ((this.totalCachedBytes > maxBytes || this.utterances.size > MAX_UTTERANCE_COUNT) && this.utterances.size > 1) {
      const oldest = this.utterances.entries().next().value as [string, StoredUtterance] | undefined
      if (oldest === undefined || oldest[0] === utteranceId) break
      this.utterances.delete(oldest[0])
      this.totalCachedBytes -= oldest[1].data.byteLength
    }
  }

  /** Read-only settings snapshot for the settings tab. */
  status(): TalkStatus {
    return {
      stt: {
        engine: this.resolved.sttEngine,
        resolved: resolveSttEngine(this.resolved),
        language: this.resolved.sttLanguage,
        silenceFinaliseMs: this.resolved.sttSilenceFinaliseMs,
        funasrUrl: this.resolved.funasrUrl,
        whisperModel: this.resolved.whisperModelPath,
      },
      tts: {
        engine: this.resolved.ttsEngine,
        resolved: resolveTtsEngine(undefined, this.resolved),
        voice: this.resolved.ttsVoice,
        fallbackToBrowser: this.resolved.ttsFallbackToBrowser,
        piperModel: this.resolved.piperModelPath,
        edgeTtsVoice: this.resolved.edgeTtsVoice,
        browser: {
          voiceName: this.resolved.browserVoiceName,
          rate: this.resolved.browserRate,
          pitch: this.resolved.browserPitch,
        },
      },
      announce: {
        enabled: this.resolved.announceEnabled,
        onTurnEnd: this.resolved.announceOnTurnEnd,
        onApproval: this.resolved.announceOnApproval,
        onError: this.resolved.announceOnError,
      },
      record: {
        enabled: this.resolved.recordEnabled,
        hotkey: this.resolved.recordHotkey,
        maxSeconds: this.resolved.recordMaxSeconds,
        autoSubmit: this.resolved.recordAutoSubmit,
        vad: {
          enabled: this.resolved.vadEnabled,
          silenceMs: this.resolved.vadSilenceMs,
          energyThreshold: this.resolved.vadEnergyThreshold,
        },
      },
      interrupt: this.resolved.interruptEnabled,
      patchFile: this.patchFile(),
    }
  }

  /** Serve one cached utterance's audio; null when evicted or never stored. */
  audio(utteranceId: string): TalkAudio | null {
    const stored = this.utterances.get(utteranceId)
    if (stored === undefined) return null
    return {
      utteranceId,
      mime: stored.mime,
      data: Buffer.from(stored.data).toString('base64'),
      text: stored.text,
      engine: stored.engine,
    }
  }

  /**
   * Transcribe one 16 kHz mono WAV (base64) with the configured local STT
   * engine. The web engine never reaches this endpoint: it runs in the
   * browser and fills the composer directly.
   *
   * @param audioData - base64 WAV bytes from the client.
   * @returns the recognized text.
   */
  async transcribe(audioData: string): Promise<TalkTranscript> {
    const engine = resolveSttEngine(this.resolved)
    if (engine === 'web') {
      throw new Error('dsh-talk: the web STT engine transcribes in the browser; configure funasr or whisper for host transcription')
    }
    let wav: Uint8Array
    try {
      wav = new Uint8Array(Buffer.from(audioData, 'base64'))
    } catch {
      throw new Error('dsh-talk: audioData is not valid base64')
    }
    if (wav.byteLength === 0) throw new Error('dsh-talk: audioData is empty')
    if (wav.byteLength > 16 * 1024 * 1024) throw new Error('dsh-talk: audio exceeds the 16 MiB cap')
    const text = engine === 'whisper'
      ? await transcribeWhisper(this.ctx.subprocess, this.resolved, wav, this.resolved.sttLanguage, new AbortController().signal)
      : await transcribeFunasr(this.resolved, wav, new AbortController().signal)
    return { text, engine, language: this.resolved.sttLanguage }
  }

  /** Stop every in-flight local synthesis (the user started talking). */
  interrupt(): TalkInterruptResult {
    let stopped = false
    for (const controller of this.activeSyntheses.values()) {
      stopped = true
      controller.abort()
    }
    this.activeSyntheses.clear()
    return { stopped }
  }

  /**
   * Apply the settings panel's engine/language edits: validate, merge over
   * the row's raw config, and append one `- set:` operation to the profile
   * patch layer (backup first). The change takes effect on the next reload.
   *
   * @param settings - the validated-at-the-wire panel submission.
   * @returns where the operation landed.
   */
  async applySettings(settings: TalkSettingsInput): Promise<TalkSettingsResult> {
    const validated = validateSettingsInput(settings, this.rawConfig)
    if (!validated.ok) {
      throw new Error(`dsh-talk: ${validated.issues.map(issue => issue.text).join(' ')}`)
    }
    const file = this.patchFile()
    if (file === null) throw new Error('dsh-talk: cannot locate the profile patch layer (ctx.baseUrl is unset)')
    const rowConfig = mergeTalkRowConfig(this.rawConfig, validated.settings)
    const fragment = renderSettingsFragment(rowConfig)
    const { backupPath, bytes } = await appendSettingsFragment(file, fragment, this.backupCount)
    return {
      file,
      backupPath,
      bytes,
      note: 'Settings appended to the profile patch layer. Reload the profile (or restart the web app) to apply them.',
    }
  }

  /** Absolute path of the profile patch layer, or null when unknown. */
  private patchFile(): string | null {
    // `baseUrl` is provided by the profile-bundle loader at mount; read it
    // structurally so this package needs no loader dependency (the loader
    // package is not published to the registry).
    const ctx = this.ctx as unknown as { baseUrl?: unknown }
    const base = ctx.baseUrl
    if (typeof base !== 'string' || base === '') return null
    const dir = base.startsWith('file://') ? fileURLToPath(base) : base
    return join(dir, PROFILE_PATCH_FILENAME)
  }
}

export default TalkService
