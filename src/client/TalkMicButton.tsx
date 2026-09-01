/**
 * The composer microphone button: record with MediaRecorder, transcribe with
 * the browser's Web Speech API when available (interim results included) or
 * through the host's `talk/transcribe` for the local engines, fill the draft
 * (or send directly when auto-submit is on), and play fresh utterances from
 * the `talk:speech` projection (browser voice locally, cached audio through
 * `talk/audio` for the local engines). Pressing record also interrupts host
 * playback (speak-to-interrupt).
 *
 * @module dsh-talk/client/TalkMicButton
 */

import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '../projection.ts'
import { foldMic, initMic, type MicViewModel } from './present.ts'
import { advanceSilence, isSpeechFrame, rmsOf, silenceTrips } from './vad.ts'
import { selectBrowserVoice } from './browserVoice.ts'
import type { TalkAudio, TalkInterruptResult, TalkStatus, TalkTranscript } from '../wire.ts'

/** Registration-side injected face: the recorder's host/browser bindings. */
export interface TalkMicInjected {
  /** Read the effective settings snapshot once. */
  status: () => Promise<TalkStatus>
  /** Stop in-flight host synthesis. */
  interrupt: () => Promise<TalkInterruptResult>
  /** Host transcription for the local STT engines. */
  transcribe: (audioData: string) => Promise<TalkTranscript>
  /** Serve one cached utterance's audio. */
  audio: (utteranceId: string) => Promise<TalkAudio | null>
  /** Write the transcription into the composer draft. */
  setDraft: (text: string) => void
  /** Send the transcription as a user message. */
  send: (text: string) => Promise<void>
  /**
   * Resolve the current master input facade for one session id through
   * `sessions.scope(id)` + `conversation.input.for(actx)`; undefined when
   * either service is unavailable (rc.8 builds without the scope exchange).
   */
  forSession?: (id: unknown) => { setDraft(text: string): void; submit(): void } | undefined
}

/** Full component props assembled by the input-slot renderer. */
export type TalkMicProps = PropsRuntime<'conversation.input.left'> & InjectFace<TalkMicInjected>
  // The projection seat is structural: the alpha.3 session kit carries
  // `useProjection` on the input-zone standard kit again, but the button still
  // reads it optionally and casts at the single call site.
  & { readonly useProjection?: unknown }

/** Structural face of the standard-kit input actions current master feeds every session-scope slot component. */
interface RuntimeInputActions {
  setDraft(text: string): void
  submit(): void
}

/** Minimal structural face of the Web Speech API (Chrome/Edge). */
interface SpeechRecognitionLike {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>>; resultIndex: number }) => void) | null
  onend: (() => void) | null
  onerror: ((event: { error?: string }) => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

function webRecognition(): SpeechRecognitionLike | undefined {
  const scope = globalThis as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
  const Ctor = scope.SpeechRecognition ?? scope.webkitSpeechRecognition
  if (Ctor === undefined) return undefined
  try {
    return new Ctor()
  } catch {
    return undefined
  }
}

function supportedMime(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined
  const candidates = ['audio/wav', 'audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
  for (const candidate of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(candidate)) return candidate
    } catch {
      // isTypeSupported can throw on hostile environments; try the next.
    }
  }
  return undefined
}

/**
 * The record button itself. All browser capability reads are feature-detected
 * and degrade to a disabled button with no throw.
 *
 * @param props - injected bindings plus the framework standard kit.
 * @returns the button element.
 */
export function TalkMicButton(props: TalkMicProps): ReactNode {
  const { status, interrupt, transcribe, audio, setDraft, send, useProjection, forSession } = props
  const inputActions = (props as Partial<Record<'inputActions', RuntimeInputActions>>).inputActions
  const sessionIdProp = (props as Partial<Record<'sessionId', unknown>>).sessionId
  const writeDraft = (text: string): void => {
    if (inputActions !== undefined) {
      inputActions.setDraft(text)
      return
    }
    const facade = sessionIdProp !== undefined ? forSession?.(sessionIdProp) : undefined
    if (facade !== undefined) {
      facade.setDraft(text)
      return
    }
    console.warn('[dsh-talk] falling back to rc.8 injected setDraft')
    setDraft(text)
  }
  const submitText = async (text: string): Promise<void> => {
    if (inputActions !== undefined) {
      inputActions.setDraft(text)
      inputActions.submit()
      return
    }
    const facade = sessionIdProp !== undefined ? forSession?.(sessionIdProp) : undefined
    if (facade !== undefined) {
      facade.setDraft(text)
      facade.submit()
      return
    }
    await send(text)
  }
  const [mic, setMic] = useState<MicViewModel>(initMic)
  const [recording, setRecording] = useState(false)
  const [settings, setSettings] = useState<TalkStatus | undefined>(undefined)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedRef = useRef<number>(0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const silenceMsRef = useRef<number>(0)
  const micRef = useRef(mic)
  micRef.current = mic
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  // One-shot settings snapshot (cap, engines, auto-submit, hotkey).
  useEffect(() => {
    let cancelled = false
    void status().then(snapshot => {
      if (!cancelled) setSettings(snapshot)
    }).catch(() => {})
    return () => {
      cancelled = true
    }
  }, [status])

  const finishWithText = (text: string): void => {
    const trimmed = text.trim()
    setMic(foldMic(micRef.current, trimmed === '' ? { kind: 'failed', message: 'empty transcription' } : { kind: 'transcribed', text: trimmed }))
    if (trimmed === '') return
    if (settingsRef.current?.record.autoSubmit === true) {
      void submitText(trimmed)
    } else {
      writeDraft(trimmed)
    }
  }

  const stopRecognition = (): void => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
  }

  const stopRecorder = (): void => {
    const recorder = recorderRef.current
    recorderRef.current = null
    if (recorder !== null && recorder.state !== 'inactive') {
      try {
        recorder.stop()
      } catch {
        // The recorder already stopped; the dataavailable handler finished us.
      }
    }
  }

  // Feature-detected voice-activity detection: attach an AnalyserNode to the
  // live stream when the recorder path is used. Absent AudioContext degrades
  // to no auto-end (the user stops manually).
  const setupVad = (stream: MediaStream, vad: TalkStatus['record']['vad']): void => {
    if (!vad.enabled) return
    const Ctor = (globalThis as unknown as { AudioContext?: typeof AudioContext }).AudioContext
    if (Ctor === undefined) return
    try {
      const context = new Ctor()
      const source = context.createMediaStreamSource(stream)
      const analyser = context.createAnalyser()
      analyser.fftSize = 2048
      source.connect(analyser)
      audioContextRef.current = context
      analyserRef.current = analyser
      silenceMsRef.current = 0
    } catch {
      // VAD degrades to no auto-end.
    }
  }

  const teardownVad = (): void => {
    analyserRef.current = null
    silenceMsRef.current = 0
    const context = audioContextRef.current
    audioContextRef.current = null
    if (context !== null) {
      try {
        void context.close()
      } catch {
        // The context already closed.
      }
    }
  }

  const stop = (): void => {
    setRecording(false)
    if (timerRef.current !== null) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (recognitionRef.current !== null) stopRecognition()
    else stopRecorder()
    teardownVad()
    setMic(foldMic(micRef.current, { kind: 'stopped' }))
  }

  const start = async (): Promise<void> => {
    const snapshot = settingsRef.current
    if (snapshot === undefined || snapshot.record.enabled !== true) return
    // Speak-to-interrupt: starting to talk stops host playback.
    if (snapshot.interrupt) void interrupt()
    const recognition = webRecognition()
    if (recognition !== undefined) {
      // An 'auto' language must not assign the empty string: Chrome handles
      // '' badly on some setups (observed as a silent immediate no-speech).
      // Fall back to the browser locale instead.
      const lang = snapshot.stt.language === 'auto'
        ? (navigator.language || 'en-US')
        : snapshot.stt.language
      recognition.lang = lang
      recognition.interimResults = true
      recognition.continuous = true
      recognition.maxAlternatives = 1
      let lastFull = ''
      let recognitionFailed = false
      const silenceFinaliseMs = snapshot.stt.silenceFinaliseMs
      let silenceTimer: ReturnType<typeof setTimeout> | null = null
      const clearSilence = (): void => {
        if (silenceTimer !== null) {
          clearTimeout(silenceTimer)
          silenceTimer = null
        }
      }
      const armSilence = (): void => {
        clearSilence()
        silenceTimer = setTimeout(() => {
          silenceTimer = null
          if (recognitionRef.current !== recognition) return
          try {
            recognition.stop()
          } catch {
            // The recognizer already ended; onend handled finalisation.
          }
        }, silenceFinaliseMs)
      }
      armSilence()
      // Web Speech re-reports the whole results collection on every event, so
      // rebuild the complete transcript from index 0 each time instead of
      // accumulating fragments across events (an accumulator duplicates text
      // whenever a result is revised or re-finalised).
      const buildTranscript = (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }): string => {
        const parts: string[] = []
        for (let index = 0; index < event.results.length; index += 1) {
          const text = event.results[index]?.[0]?.transcript ?? ''
          if (text.trim() !== '') parts.push(text.trim())
        }
        return parts.join(' ')
      }
      recognition.onresult = (event) => {
        lastFull = buildTranscript(event)
        armSilence()
        if (lastFull !== '') writeDraft(lastFull)
      }
      recognition.onend = () => {
        clearSilence()
        recognitionRef.current = null
        setRecording(false)
        if (!recognitionFailed) finishWithText(lastFull)
      }
      recognition.onerror = (event) => {
        clearSilence()
        recognitionFailed = true
        recognitionRef.current = null
        setRecording(false)
        console.warn(`[dsh-talk] speech recognition error: ${String(event.error ?? 'unknown')}`)
        setMic(foldMic(micRef.current, { kind: 'failed', message: `web speech recognition failed (${String(event.error ?? 'unknown')})` }))
      }
      recognitionRef.current = recognition
      try {
        recognition.start()
      } catch {
        recognitionRef.current = null
        setMic(foldMic(micRef.current, { kind: 'failed', message: 'web speech recognition unavailable' }))
        return
      }
      setMic(foldMic(micRef.current, { kind: 'press', maxSeconds: snapshot.record.maxSeconds }))
      setRecording(true)
      return
    }
    const mime = supportedMime()
    if (mime === undefined || navigator.mediaDevices === undefined) {
      setMic(foldMic(micRef.current, { kind: 'failed', message: 'MediaRecorder is unavailable in this browser' }))
      return
    }
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setMic(foldMic(micRef.current, { kind: 'failed', message: 'microphone permission denied' }))
      return
    }
    setupVad(stream, snapshot.record.vad)
    let recorder: MediaRecorder
    try {
      recorder = new MediaRecorder(stream, { mimeType: mime })
    } catch {
      stream.getTracks().forEach(track => track.stop())
      setMic(foldMic(micRef.current, { kind: 'failed', message: 'microphone capture failed' }))
      return
    }
    chunksRef.current = []
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data)
    }
    recorder.onstop = () => {
      stream.getTracks().forEach(track => track.stop())
      const blob = new Blob(chunksRef.current, { type: mime })
      chunksRef.current = []
      void blob.arrayBuffer().then(buffer => {
        let binary = ''
        const bytes = new Uint8Array(buffer)
        for (let index = 0; index < bytes.length; index += 0x8000) {
          binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000))
        }
        return btoa(binary)
      }).then(base64 => transcribe(base64))
        .then(transcript => finishWithText(transcript.text))
        .catch(() => {
          setMic(foldMic(micRef.current, { kind: 'failed', message: 'transcription failed' }))
        })
    }
    recorderRef.current = recorder
    try {
      recorder.start()
    } catch {
      recorderRef.current = null
      setMic(foldMic(micRef.current, { kind: 'failed', message: 'microphone capture failed' }))
      return
    }
    startedRef.current = Date.now()
    setMic(foldMic(micRef.current, { kind: 'press', maxSeconds: snapshot.record.maxSeconds }))
    setRecording(true)
    timerRef.current = setInterval(() => {
      const elapsed = Math.ceil((Date.now() - startedRef.current) / 1000)
      setMic(foldMic(micRef.current, { kind: 'tick', elapsedSec: elapsed, maxSeconds: settingsRef.current?.record.maxSeconds ?? 60 }))
      const analyser = analyserRef.current
      const vad = settingsRef.current?.record.vad
      if (analyser !== null && vad?.enabled === true) {
        const buffer = new Float32Array(analyser.fftSize)
        analyser.getFloatTimeDomainData(buffer)
        silenceMsRef.current = advanceSilence(silenceMsRef.current, 500, isSpeechFrame(rmsOf(buffer), vad.energyThreshold))
        if (silenceTrips(silenceMsRef.current, vad.silenceMs)) {
          stop()
          return
        }
      }
      if (elapsed >= (settingsRef.current?.record.maxSeconds ?? 60)) stop()
    }, 500)
  }

  // Optional toggle hotkey.
  useEffect(() => {
    const hotkey = settings?.record.hotkey
    if (hotkey === null || hotkey === undefined || hotkey === '') return
    const listener = (event: KeyboardEvent): void => {
      if (event.altKey && event.key.toLowerCase() === hotkey.toLowerCase().slice('alt+'.length)) {
        event.preventDefault()
        if (recording) stop()
        else void start()
      }
    }
    window.addEventListener('keydown', listener)
    return () => {
      window.removeEventListener('keydown', listener)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, recording])

  // Playback: fresh utterances from the talk:speech projection.
  const readProjection = useProjection as unknown as (unit: 'talk:speech') => {
    utteranceId: string
    engine?: string
    text?: string
    voice?: string
    rate?: number
    pitch?: number
  } | null | undefined
  const speech = readProjection('talk:speech')
  const playedRef = useRef<string | null>(null)
  useEffect(() => {
    if (speech === null || speech === undefined || speech.utteranceId === playedRef.current) return
    playedRef.current = speech.utteranceId
    if (speech.engine === 'browser') {
      if (typeof speechSynthesis !== 'undefined') {
        const utterance = new SpeechSynthesisUtterance(speech.text)
        const voice = selectBrowserVoice(speechSynthesis.getVoices(), speech.voice)
        if (voice !== undefined) utterance.voice = voice
        if (speech.rate !== undefined) utterance.rate = speech.rate
        if (speech.pitch !== undefined) utterance.pitch = speech.pitch
        speechSynthesis.speak(utterance)
      } else {
        console.warn('[dsh-talk] speechSynthesis unavailable')
      }
      return
    }
    void audio(speech.utteranceId).then(entry => {
      if (entry === null) return
      const binary = atob(entry.data)
      const bytes = new Uint8Array(binary.length)
      for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
      const url = URL.createObjectURL(new Blob([bytes], { type: entry.mime }))
      const player = new Audio(url)
      void player.play()
      player.addEventListener('ended', () => URL.revokeObjectURL(url))
    }).catch(() => {})
  }, [speech, audio])

  const disabled = settings === undefined || settings.record.enabled !== true
  const label = recording
    ? (mic.phase === 'transcribing' ? '…' : '⏹')
    : '🎙'
  return (
    <button
      type="button"
      data-dsh-talk-mic
      data-recording={recording ? 'true' : 'false'}
      data-disabled={disabled ? 'true' : 'false'}
      title={mic.phase === 'error' ? mic.error : undefined}
      disabled={disabled}
      onClick={() => {
        if (recording) stop()
        else start()
      }}
    >
      {label}
    </button>
  )
}
