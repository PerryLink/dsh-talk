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
}

/** Full component props assembled by the input-slot renderer. */
export type TalkMicProps = PropsRuntime<'conversation.input.left'> & InjectFace<TalkMicInjected>

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
  const { status, interrupt, transcribe, audio, setDraft, send, useProjection } = props
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
      void send(trimmed)
    } else {
      setDraft(trimmed)
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
      recognition.lang = snapshot.stt.language === 'auto' ? '' : snapshot.stt.language
      recognition.interimResults = true
      recognition.continuous = false
      recognition.maxAlternatives = 1
      let finalText = ''
      recognition.onresult = (event) => {
        let interim = ''
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index]!
          const text = result[0]?.transcript ?? ''
          if (index === event.results.length - 1) interim += text
          else finalText += text
        }
        if (interim !== '') setDraft(interim)
      }
      recognition.onend = () => {
        recognitionRef.current = null
        setRecording(false)
        finishWithText(finalText)
      }
      recognition.onerror = () => {
        recognitionRef.current = null
        setRecording(false)
        setMic(foldMic(micRef.current, { kind: 'failed', message: 'web speech recognition failed' }))
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
  const speech = useProjection('talk:speech')
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
