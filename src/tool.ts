/**
 * The `speak` tool: the agent's audible reply channel. Execution resolves
 * the TTS engine through the service (config defaults + per-call overrides)
 * and returns a small canonical value the model can reason about — the audio
 * itself plays in the browser and never enters model context. The model
 * only sees the render text; the spoken utterance lands in the session log
 * as a `dsh-talk/speech` event.
 *
 * A local engine (edge-tts/piper) also writes the audio to a bounded
 * plugin-owned file, and the absolute path rides the value and the render text
 * so the model can hand it to another tool (a messenger's file argument). The
 * browser engine has no host bytes and says so explicitly.
 *
 * @module dsh-talk/tool
 */

import { defineTool } from '@deepseek-ai/dsh-tools'
import { redactSecrets, sanitizeText } from './sanitize.ts'
import type { TalkService } from './service.ts'

/**
 * Render the audio-file clause of one successful utterance. `displayPath` is
 * deliberately NOT applied: the path is the usable artifact (the model passes
 * it verbatim to another tool), it lives in the plugin's own directory rather
 * than a temp dir, and it still passes `redactSecrets`.
 *
 * @param value - the canonical outcome fields that describe the file.
 * @returns the sentence to append, or an empty string when there is nothing to say.
 */
function renderAudioFile(value: { audioPath?: string; audioExport?: string; exportNote?: string }): string {
  if (value.audioExport === 'file' && value.audioPath !== undefined && value.audioPath !== '') {
    return ` Audio file: ${redactSecrets(value.audioPath)}`
  }
  if (value.audioExport === undefined) return ''
  const note = value.exportNote === undefined || value.exportNote === '' ? value.audioExport : value.exportNote
  return ` No audio file: ${redactSecrets(note)}.`
}

/**
 * Render one speak outcome as the model-facing content. The value shape is
 * the schema-inferred canonical value (every property optional).
 *
 * @param args - the validated tool arguments.
 * @param value - the canonical outcome.
 * @returns the model content blocks.
 */
export function renderSpeak(args: { text: string }, value: {
  spoken?: boolean
  engine?: string
  audioBytes?: number
  durationSec?: number
  error?: string
  utteranceId?: string
  audioPath?: string
  audioExport?: string
  exportNote?: string
}) {
  if (value.spoken === true) {
    const note = value.error === undefined ? '' : ` (${value.error})`
    return [{
      type: 'text' as const,
      text: `Spoke ${sanitizeText(args.text, 200)} aloud with the ${value.engine ?? 'unknown'} engine.${note}${renderAudioFile(value)}`,
    }]
  }
  return [{
    type: 'text' as const,
    text: `Speech failed with the ${value.engine ?? 'unknown'} engine: ${value.error ?? 'unknown error'}.`,
  }]
}

/**
 * Assemble the `speak` tool definition. `execute` returns only the canonical
 * {@link SpeakOutcome} declared by the output schema; infrastructure failures
 * (empty text) throw so the pipeline marks the call errored.
 *
 * @param service - the talk service the execution delegates to.
 * @param maxChars - cap on one spoken text (resolved config).
 * @returns a registry-ready tool.
 */
export function speakTool(service: TalkService, maxChars: number) {
  return defineTool({
    name: 'speak',
    description: 'Speak text aloud to the user through the configured text-to-speech engine (browser voice, edge-tts, or piper). Use it for audible replies. The audio plays in the browser; with a local engine (edge-tts/piper) it is also written to a file whose absolute path is returned in audioPath and can be passed to another tool that takes a file path. The session log records what was spoken.',
    parameters: {
      text: {
        type: 'string',
        required: true as const,
        description: 'The exact text to speak aloud.',
      },
      engine: {
        type: 'string',
        enum: ['auto', 'browser', 'edge-tts', 'piper'],
        description: 'TTS engine override; default is the configured engine.',
      },
      voice: {
        type: 'string',
        description: 'Voice name override for the resolved engine.',
      },
      interrupt: {
        type: 'boolean',
        description: 'Interrupt any speech currently playing before starting (default true).',
      },
    },
    output: {
      schema: {
        type: 'object',
        properties: {
          spoken: { type: 'boolean' },
          engine: { type: 'string' },
          audioBytes: { type: 'integer' },
          durationSec: { type: 'number' },
          error: { type: 'string' },
          utteranceId: { type: 'string' },
          audioPath: { type: 'string' },
          audioExport: { type: 'string', enum: ['file', 'unsupported', 'disabled', 'failed'] },
          exportNote: { type: 'string' },
        },
        additionalProperties: false,
      },
      render: renderSpeak,
    },
    async execute(args, exec) {
      const text = args.text.trim()
      if (text === '') throw new Error('dsh-talk: speak text must not be empty')
      if (text.length > maxChars) throw new Error(`dsh-talk: speak text exceeds the ${maxChars} character cap`)
      const session = exec.agent?.session
      return await service.speak(text, {
        ...(args.engine === undefined ? {} : { engine: args.engine }),
        ...(args.voice === undefined ? {} : { voice: args.voice }),
        ...(args.interrupt === undefined ? {} : { interrupt: args.interrupt }),
        reason: 'speak-tool',
        ...(session === undefined ? {} : { session }),
        signal: exec.signal,
      })
    },
  })
}
