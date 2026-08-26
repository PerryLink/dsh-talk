/**
 * The unified SpeechProvider seam (reserved for the P2 registry). Today STT
 * and TTS engines are resolved through `resolveSttEngine`/`resolveTtsEngine`
 * and implemented by the pure functions in `engine.ts` (Web Speech, FunASR,
 * whisper.cpp, browser/edge-tts/piper). A future release will let third-party
 * providers register here instead of branching in the resolver; this interface
 * pins the shape providers will implement so consumers can plan against it
 * without waiting for the registry itself.
 *
 * @module dsh-talk/provider
 */

/** A speech-to-text provider (the future registry entry shape). */
export interface SpeechSttProvider {
  /** Discriminant. */
  readonly kind: 'stt'
  /** Stable provider id. */
  readonly id: string
  /** Transcribe one 16 kHz mono WAV to trimmed text. */
  transcribe(wav: Uint8Array, signal: AbortSignal): Promise<string>
}

/** A text-to-speech provider (the future registry entry shape). */
export interface SpeechTtsProvider {
  /** Discriminant. */
  readonly kind: 'tts'
  /** Stable provider id. */
  readonly id: string
  /** Synthesize one utterance to audio bytes plus a MIME type. */
  synthesize(text: string, signal: AbortSignal): Promise<{ mime: string; data: Uint8Array }>
}

/** A speech provider (STT or TTS). */
export type SpeechProvider = SpeechSttProvider | SpeechTtsProvider
