/**
 * Audio export suite: the pure naming/directory/prune policy, the real write
 * path against a temp directory, and the four degradation states visible
 * through the speak tool (file / unsupported / disabled / failed). The browser
 * state is the one the task must never leave implicit: it says "no audio file"
 * in both the canonical value and the model-facing render text.
 *
 * @module dsh-talk/test/audio-export.spec
 */

import { afterEach, describe, expect, it } from 'vitest'
import { mkdtemp, mkdir, readFile, readdir, rm, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { renderSpeak } from '../src/tool.ts'
import {
  BROWSER_EXPORT_NOTE,
  EXPORT_FILE_PATTERN,
  exportFileName,
  exportSynthesizedAudio,
  pruneExports,
  resolveExportDir,
  selectPrunableExports,
} from '../src/audio-export.ts'
import { mountHarness, type Harness } from './harness.ts'

const created: string[] = []

async function tempDir(prefix = 'dsh-talk-export-spec-'): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), prefix))
  created.push(dir)
  return dir
}

afterEach(async () => {
  while (created.length > 0) {
    const dir = created.pop()
    if (dir !== undefined) await rm(dir, { recursive: true, force: true })
  }
})

/** Execute the speak tool through the real registry. */
async function speak(harness: Harness, args: unknown) {
  return harness.ctx.tools.execute({
    callId: `export-spec-${Math.random().toString(16).slice(2)}` as unknown as Parameters<Harness['ctx']['tools']['execute']>[0]['callId'],
    name: 'speak',
    arguments: args,
    agent: harness.agent,
    signal: new AbortController().signal,
  })
}

/** The engine scripted to write `bytes` where the argv points. */
function scriptSynth(harness: Harness, bytes: string): void {
  harness.subprocess.nextSynthBytes = bytes
}

describe('resolveExportDir', () => {
  it('defaults to the plugin directory under the home directory, never the workspace', () => {
    expect(resolveExportDir('', '/home/ada')).toBe(join('/home/ada', '.dsh-talk', 'audio'))
    expect(resolveExportDir(undefined, '/home/ada')).toBe(join('/home/ada', '.dsh-talk', 'audio'))
  })

  it('expands ~ and resolves a relative path against home', () => {
    expect(resolveExportDir('~/voice', '/home/ada')).toBe(join('/home/ada', 'voice'))
    expect(resolveExportDir('voice', '/home/ada')).toBe(join('/home/ada', 'voice'))
  })

  it('keeps an absolute path as configured', () => {
    const absolute = join(tmpdir(), 'dsh-talk-absolute')
    expect(resolveExportDir(absolute, '/home/ada')).toBe(absolute)
  })
})

describe('exportFileName', () => {
  it('names each engine output by UTC stamp and utterance token', () => {
    const name = exportFileName('edge-tts', new Date('2026-10-12T15:30:12.345Z'), '3f9a1c7d-0000-4000-8000-000000000000')
    expect(name).toBe('speech-20261012T153012Z-3f9a1c7d.mp3')
    expect(EXPORT_FILE_PATTERN.test(name)).toBe(true)
    expect(exportFileName('piper', new Date('2026-10-12T15:30:12.345Z'), '3f9a1c7d-0000')).toBe('speech-20261012T153012Z-3f9a1c7d.wav')
  })

  it('never derives a name from the spoken text and pads a short token', () => {
    expect(exportFileName('edge-tts', new Date(0), 'ab')).toBe('speech-19700101T000000Z-ab000000.mp3')
  })
})

describe('selectPrunableExports', () => {
  const now = Date.parse('2026-10-12T12:00:00Z')
  const policy = { maxFiles: 3, maxAgeMinutes: 60 }
  const entry = (name: string, minutesAgo: number) => ({ name, mtimeMs: now - minutesAgo * 60_000 })
  const own = (token: string) => `speech-20261012T110000Z-${token}.mp3`

  it('expires by age first', () => {
    const doomed = selectPrunableExports([entry(own('aaaaaaaa'), 120), entry(own('bbbbbbbb'), 10)], ['keep'], policy, now)
    expect(doomed).toEqual([own('aaaaaaaa')])
  })

  it('then trims the oldest survivors down to maxFiles, counting the kept file', () => {
    const entries = [entry(own('aaaaaaaa'), 10), entry(own('bbbbbbbb'), 20), entry(own('cccccccc'), 30)]
    const doomed = selectPrunableExports(entries, [own('dddddddd')], { maxFiles: 2, maxAgeMinutes: 60 }, now)
    expect(doomed).toEqual([own('bbbbbbbb'), own('cccccccc')])
  })

  it('keeps the kept file and stays inside maxFiles when nothing is over the bound', () => {
    const entries = [entry(own('aaaaaaaa'), 10), entry(own('bbbbbbbb'), 20)]
    expect(selectPrunableExports(entries, [own('cccccccc')], { maxFiles: 3, maxAgeMinutes: 60 }, now)).toEqual([])
    expect(selectPrunableExports(entries, [own('cccccccc')], { maxFiles: 2, maxAgeMinutes: 60 }, now)).toEqual([own('bbbbbbbb')])
  })

  it('never touches the kept file, foreign files, or names it did not generate', () => {
    const foreign = [{ name: 'user-notes.mp3', mtimeMs: 0 }, { name: 'speech-x.mp3', mtimeMs: 0 }]
    const doomed = selectPrunableExports(foreign, [own('aaaaaaaa')], { maxFiles: 1, maxAgeMinutes: 1 }, now)
    expect(doomed).toEqual([])
  })
})

describe('exportSynthesizedAudio', () => {
  const policy = { enabled: true, dir: '', maxFiles: 5, maxAgeMinutes: 60 }

  it('writes the bytes and reports the absolute path', async () => {
    const dir = await tempDir()
    const outcome = await exportSynthesizedAudio({ ...policy, dir }, 'edge-tts', 'a1b2c3d4-0000', new TextEncoder().encode('ID3-bytes'))
    expect(outcome.audioExport).toBe('file')
    expect(outcome.audioPath).toBe(join(dir, exportFileName('edge-tts', new Date(), 'a1b2c3d4-0000')))
    expect(await readFile(outcome.audioPath!, 'utf8')).toBe('ID3-bytes')
  })

  it('reports disabled without touching the disk', async () => {
    const dir = join(await tempDir(), 'never-created')
    const outcome = await exportSynthesizedAudio({ ...policy, dir, enabled: false }, 'piper', 'a1b2c3d4', new Uint8Array([1]))
    expect(outcome).toMatchObject({ audioExport: 'disabled' })
    expect(outcome.audioPath).toBeUndefined()
    expect(await readdir(join(dir, '..'))).toEqual([])
  })

  it('reports a failed write instead of throwing when the directory cannot be created', async () => {
    const blocker = join(await tempDir(), 'blocker')
    await writeFile(blocker, 'not a directory', 'utf8')
    const outcome = await exportSynthesizedAudio({ ...policy, dir: join(blocker, 'audio') }, 'edge-tts', 'a1b2c3d4', new Uint8Array([1]))
    expect(outcome.audioExport).toBe('failed')
    expect(outcome.exportNote).toMatch(/audio export failed/u)
  })

  it('bounds the directory by count on every write', async () => {
    const dir = await tempDir()
    await mkdir(dir, { recursive: true })
    for (const token of ['11111111', '22222222', '33333333', '44444444']) {
      await writeFile(join(dir, `speech-20260101T00000${token.slice(0, 1)}Z-${token}.mp3`), 'old')
    }
    await writeFile(join(dir, 'keep-me.txt'), 'foreign')
    const outcome = await exportSynthesizedAudio({ ...policy, dir, maxFiles: 2 }, 'edge-tts', 'a1b2c3d4', new Uint8Array([9]))
    const names = (await readdir(dir)).sort()
    expect(outcome.audioExport).toBe('file')
    expect(names.filter(name => EXPORT_FILE_PATTERN.test(name))).toHaveLength(2)
    expect(names).toContain('keep-me.txt')
  })

  it('bounds the directory by age on every write', async () => {
    const dir = await tempDir()
    await mkdir(dir, { recursive: true })
    const stale = join(dir, 'speech-20250101T000000Z-deadbeef.mp3')
    await writeFile(stale, 'stale')
    const old = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    await utimes(stale, old, old)
    await exportSynthesizedAudio({ ...policy, dir, maxFiles: 10, maxAgeMinutes: 1_440 }, 'piper', 'a1b2c3d4', new Uint8Array([9]))
    expect(await readdir(dir)).toHaveLength(1)
  })

  it('pruneExports is best-effort on a missing directory', async () => {
    expect(await pruneExports(join(await tempDir(), 'absent'), [], policy, Date.now())).toBe(0)
  })
})

describe('speak tool audio export', () => {
  it('writes the local engine audio and returns the file path to the model', async () => {
    const harness = await mountHarness()
    scriptSynth(harness, 'ID3-local-audio')
    const result = await speak(harness, { text: 'hello', engine: 'edge-tts', interrupt: false })
    expect(result.isError).toBe(false)
    if (result.isError) throw new Error('expected a successful local synthesis')
    const value = result.value as { audioPath?: string; audioExport?: string; audioBytes?: number }
    expect(value.audioExport).toBe('file')
    expect(value.audioPath).toBeDefined()
    expect(value.audioBytes).toBe('ID3-local-audio'.length)
    expect(await readFile(value.audioPath as string, 'utf8')).toBe('ID3-local-audio')
    // The path is inside the configured export directory, named by the plugin.
    expect(value.audioPath?.startsWith(harness.exportDir)).toBe(true)
    expect(EXPORT_FILE_PATTERN.test((value.audioPath as string).split(/[\\/]/u).pop() as string)).toBe(true)
    expect((await readdir(harness.exportDir))).toHaveLength(1)
    expect(renderSpeak({ text: 'hello' }, value)).toEqual([{ type: 'text', text: `Spoke hello aloud with the edge-tts engine. Audio file: ${value.audioPath}` }])
  })

  it('explains the browser engine instead of failing silently', async () => {
    const harness = await mountHarness()
    const result = await speak(harness, { text: 'hello', engine: 'browser' })
    expect(result.isError).toBe(false)
    if (result.isError) throw new Error('expected a successful browser delegation')
    const value = result.value as { audioPath?: string; audioExport?: string; exportNote?: string }
    expect(value.audioExport).toBe('unsupported')
    expect(value.audioPath).toBeUndefined()
    expect(value.exportNote).toBe(BROWSER_EXPORT_NOTE)
    // Nothing was written: the harness's export directory exists but is empty.
    expect(await readdir(harness.exportDir)).toEqual([])
    expect(renderSpeak({ text: 'hello' }, value)).toEqual([{
      type: 'text',
      text: 'Spoke hello aloud with the browser engine. No audio file: the browser engine synthesizes in the browser.',
    }])
  })

  it('reports the disabled state when tts.export.enabled is false', async () => {
    const harness = await mountHarness({ tts: { export: { enabled: false } } })
    scriptSynth(harness, 'ID3-local-audio')
    const result = await speak(harness, { text: 'hello', engine: 'edge-tts', interrupt: false })
    if (result.isError) throw new Error('expected a successful local synthesis')
    const value = result.value as { spoken?: boolean; audioPath?: string; audioExport?: string; exportNote?: string }
    expect(value.spoken).toBe(true)
    expect(value.audioExport).toBe('disabled')
    expect(value.audioPath).toBeUndefined()
    expect(value.exportNote).toContain('tts.export.enabled')
    expect(await readdir(harness.exportDir)).toEqual([])
  })

  it('keeps speech alive when the export write fails', async () => {
    const blockerDir = await tempDir()
    const blocker = join(blockerDir, 'blocker')
    await writeFile(blocker, 'not a directory', 'utf8')
    const harness = await mountHarness({ tts: { export: { dir: join(blocker, 'audio') } } })
    scriptSynth(harness, 'ID3-local-audio')
    const result = await speak(harness, { text: 'hello', engine: 'edge-tts', interrupt: false })
    expect(result.isError).toBe(false)
    if (result.isError) throw new Error('expected speech to survive a failed export')
    const value = result.value as { spoken?: boolean; audioExport?: string; exportNote?: string; audioCache?: unknown }
    expect(value.spoken).toBe(true)
    expect(value.audioExport).toBe('failed')
    expect(value.exportNote).toMatch(/audio export failed/u)
    // The utterance is still cached for browser playback through talk/audio.
    expect(harness.service.audio((result.value as { utteranceId: string }).utteranceId)).not.toBeNull()
  })

  it('falls back to the browser voice with the unsupported export state when a local engine fails', async () => {
    const harness = await mountHarness()
    harness.subprocess.nextExitCode = 1
    harness.subprocess.nextStderr = 'edge-tts exploded'
    const result = await speak(harness, { text: 'hello', engine: 'edge-tts', interrupt: false })
    if (result.isError) throw new Error('expected the browser fallback')
    const value = result.value as { engine?: string; audioExport?: string; audioPath?: string }
    expect(value.engine).toBe('browser')
    expect(value.audioExport).toBe('unsupported')
    expect(value.audioPath).toBeUndefined()
  })
})
