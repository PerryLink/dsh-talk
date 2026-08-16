/**
 * Local speech engines over the public `ctx.subprocess` seam and one HTTP
 * endpoint (FunASR's OpenAI-compatible transcription API). Command lines are
 * built by pure functions (unit-tested), then executed through the generic
 * {@link runCommand} / {@link transcribeViaHttp} primitives so integration
 * tests can exercise the same code with stub executables.
 *
 * - edge-tts: `edge-tts --voice <voice> --rate=<±N%> --text <text>
 *   --write-media <out.mp3>` (network-backed neural voices).
 * - piper: `piper --model <model.onnx> --output_file <out.wav>
 *   --length_scale <scale>`, text on stdin.
 * - whisper.cpp: `whisper-cli --model <ggml> --file <in.wav> --output-txt
 *   --output-file <base> [--language <tag>]`, transcript read from `<base>.txt`.
 * - FunASR: multipart POST `{url}/v1/audio/transcriptions` (file + optional
 *   model) → `{ text }`.
 *
 * @module dsh-talk/engine
 */

import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { SubprocessRuntime } from '@deepseek-ai/dsh-subprocess'
import type { ResolvedConfig } from './config.ts'
import { sanitizeText } from './sanitize.ts'

/** Timeout for one FunASR HTTP transcription request (ms). */
const FUNASR_TIMEOUT_MS = 120_000

/** Bytes cap for one synthesized audio file (16 MiB). */
export const MAX_SYNTH_BYTES = 16 * 1024 * 1024

/** Result of one successful local synthesis. */
export interface SynthResult {
  /** MIME type of the produced audio. */
  mime: string
  /** The audio bytes. */
  data: Uint8Array
}

/** Failure classification of one synthesis attempt. */
export class EngineFailure extends Error {
  /** True when the caller's abort signal ended the attempt. */
  readonly aborted: boolean

  constructor(message: string, aborted: boolean) {
    super(message)
    this.name = 'EngineFailure'
    this.aborted = aborted
  }
}

/**
 * Build the edge-tts command line.
 *
 * @param resolved - resolved config.
 * @param text - text to speak (sanitized by the caller).
 * @param outPath - absolute media output path.
 * @returns the argv (argv[0] is the executable).
 */
export function edgeTtsArgv(resolved: ResolvedConfig, text: string, outPath: string): readonly string[] {
  const rate = resolved.ttsRate >= 0 ? `+${resolved.ttsRate}%` : `${resolved.ttsRate}%`
  return [
    resolved.edgeTtsCommand,
    '--voice', resolved.ttsVoice ?? resolved.edgeTtsVoice,
    `--rate=${rate}`,
    '--text', text,
    '--write-media', outPath,
  ]
}

/**
 * Build the piper command line and its stdin payload.
 *
 * @param resolved - resolved config.
 * @param outPath - absolute wav output path.
 * @returns the argv and the stdin text.
 */
export function piperSpec(resolved: ResolvedConfig, outPath: string): { readonly argv: readonly string[]; readonly stdin: string } {
  const modelPath = resolved.piperModelPath ?? ''
  // Positive rate percent = faster speech = shorter length scale.
  const lengthScale = Math.max(0.5, Math.min(1.5, 1 - resolved.ttsRate / 200))
  return {
    argv: [
      resolved.piperCommand,
      '--model', modelPath,
      '--output_file', outPath,
      '--length_scale', lengthScale.toFixed(3),
    ],
    stdin: '',
  }
}

/**
 * Build the whisper.cpp command line.
 *
 * @param resolved - resolved config.
 * @param wavPath - absolute 16 kHz mono WAV input path.
 * @param outBase - absolute output base (`<outBase>.txt` receives the transcript).
 * @param language - BCP-47 tag or `auto`.
 * @returns the argv.
 */
export function whisperArgv(resolved: ResolvedConfig, wavPath: string, outBase: string, language: string): readonly string[] {
  const argv = [
    resolved.whisperCommand,
    '--model', resolved.whisperModelPath ?? '',
    '--file', wavPath,
    '--output-txt',
    '--output-file', outBase,
    '--no-prints',
  ]
  const tag = resolved.whisperLanguage ?? language
  if (tag !== 'auto' && tag !== '') argv.push('--language', tag)
  return argv
}

/**
 * Run one local engine command through the public subprocess service:
 * bounded collect on both streams, explicit stdin, and the caller's abort
 * signal wired to tree-scoped termination.
 *
 * @param subprocess - the subprocess service.
 * @param argv - executable + arguments.
 * @param stdin - stdin payload (empty string = no input).
 * @param signal - abort signal; firing it classifies the failure as aborted.
 * @param graceMs - termination escalation grace.
 * @returns exit code and collected tail text.
 */
export async function runCommand(
  subprocess: SubprocessRuntime,
  argv: readonly string[],
  stdin: string,
  signal: AbortSignal,
  graceMs = 5_000,
): Promise<{ readonly exitCode: number | null; readonly stdout: string; readonly stderr: string }> {
  const handle = subprocess.spawn({
    argv,
    cwd: tmpdir(),
    stdio: {
      stdin: stdin === '' ? 'ignore' : { data: stdin },
      stdout: { maxBytes: 64 * 1024 },
      stderr: { maxBytes: 16 * 1024 },
    },
    graceMs,
    signal,
  })
  const outcome = await handle.done
  const stdout = handle.collected.stdout?.readFrom(0).text ?? ''
  const stderr = handle.collected.stderr?.readFrom(0).text ?? ''
  return { exitCode: outcome.exitCode, stdout, stderr }
}

/** Read one synthesized file and delete the temp directory it lived in. */
async function readSynthFile(dir: string, name: string): Promise<Uint8Array> {
  const bytes = await readFile(join(dir, name))
  await rm(dir, { recursive: true, force: true }).catch(() => {})
  if (bytes.byteLength > MAX_SYNTH_BYTES) {
    throw new EngineFailure(`synthesized audio exceeds the ${MAX_SYNTH_BYTES} byte cap`, false)
  }
  return bytes
}

/**
 * Synthesize speech with the local TTS engine (edge-tts or piper). Temp files
 * are created per attempt and removed before returning; an abort or a
 * non-zero exit surfaces as {@link EngineFailure}.
 *
 * @param subprocess - the subprocess service.
 * @param resolved - resolved config.
 * @param engine - which local engine to run.
 * @param text - text to speak (sanitized by the caller).
 * @param signal - caller abort signal (interruption).
 * @returns the audio bytes and MIME type.
 */
export async function synthesize(
  subprocess: SubprocessRuntime,
  resolved: ResolvedConfig,
  engine: 'edge-tts' | 'piper',
  text: string,
  signal: AbortSignal,
): Promise<SynthResult> {
  const dir = await mkdtemp(join(tmpdir(), 'dsh-talk-'))
  try {
    if (engine === 'edge-tts') {
      const outPath = join(dir, 'speech.mp3')
      const { exitCode, stderr } = await runCommand(subprocess, edgeTtsArgv(resolved, text, outPath), '', signal)
      if (exitCode !== 0) {
        throw new EngineFailure(`edge-tts exited ${String(exitCode)}: ${sanitizeText(stderr)}`, signal.aborted)
      }
      return { mime: 'audio/mpeg', data: await readSynthFile(dir, 'speech.mp3') }
    }
    const outPath = join(dir, 'speech.wav')
    const spec = piperSpec(resolved, outPath)
    const { exitCode, stderr } = await runCommand(subprocess, spec.argv, spec.stdin, signal)
    if (exitCode !== 0) {
      throw new EngineFailure(`piper exited ${String(exitCode)}: ${sanitizeText(stderr)}`, signal.aborted)
    }
    return { mime: 'audio/wav', data: await readSynthFile(dir, 'speech.wav') }
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}

/**
 * Transcribe a 16 kHz mono WAV with whisper.cpp over the subprocess service.
 *
 * @param subprocess - the subprocess service.
 * @param resolved - resolved config.
 * @param wav - WAV bytes from the client.
 * @param language - BCP-47 tag or `auto`.
 * @param signal - caller abort signal.
 * @returns the trimmed transcript.
 */
export async function transcribeWhisper(
  subprocess: SubprocessRuntime,
  resolved: ResolvedConfig,
  wav: Uint8Array,
  language: string,
  signal: AbortSignal,
): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'dsh-talk-'))
  try {
    const wavPath = join(dir, 'speech.wav')
    const outBase = join(dir, 'transcript')
    await writeFile(wavPath, wav)
    const { exitCode, stderr } = await runCommand(subprocess, whisperArgv(resolved, wavPath, outBase, language), '', signal)
    if (exitCode !== 0) {
      throw new EngineFailure(`whisper exited ${String(exitCode)}: ${sanitizeText(stderr)}`, signal.aborted)
    }
    const text = await readFile(`${outBase}.txt`, 'utf8')
    return text.replace(/\s+/gu, ' ').trim()
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}

/**
 * Transcribe a 16 kHz mono WAV through FunASR's OpenAI-compatible endpoint:
 * multipart POST `{baseUrl}/v1/audio/transcriptions` with `file` (and the
 * configured model when set); the response carries `text`. A full endpoint
 * URL (ending in `/v1/audio/transcriptions`) is used verbatim.
 *
 * @param resolved - resolved config.
 * @param wav - WAV bytes from the client.
 * @param signal - caller abort signal.
 * @returns the trimmed transcript.
 */
export async function transcribeFunasr(resolved: ResolvedConfig, wav: Uint8Array, signal: AbortSignal): Promise<string> {
  const base = resolved.funasrUrl ?? ''
  if (base === '') throw new EngineFailure('funasr: no endpoint configured', false)
  const url = base.endsWith('/v1/audio/transcriptions') ? base : `${base.replace(/\/+$/u, '')}/v1/audio/transcriptions`
  const form = new FormData()
  form.append('file', new Blob([wav as BlobPart], { type: 'audio/wav' }), 'speech.wav')
  if (resolved.funasrModel !== null) form.append('model', resolved.funasrModel)
  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      body: form,
      signal: AbortSignal.any([signal, AbortSignal.timeout(FUNASR_TIMEOUT_MS)]),
    })
  } catch (error) {
    throw new EngineFailure(`funasr request failed: ${sanitizeText(error instanceof Error ? error.message : String(error))}`, signal.aborted)
  }
  if (!response.ok) {
    const body = sanitizeText(await response.text().catch(() => ''), 500)
    throw new EngineFailure(`funasr responded ${String(response.status)}: ${body}`, false)
  }
  const payload: unknown = await response.json().catch(() => ({}))
  if (typeof payload !== 'object' || payload === null) throw new EngineFailure('funasr responded with a non-object payload', false)
  const text = (payload as Record<string, unknown>)['text']
  if (typeof text !== 'string') throw new EngineFailure('funasr response has no text field', false)
  return text.replace(/\s+/gu, ' ').trim()
}
