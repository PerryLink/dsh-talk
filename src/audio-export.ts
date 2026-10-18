/**
 * Persistent audio export: every locally synthesized utterance is also written
 * to a bounded, plugin-owned directory, and the absolute path is handed back to
 * the caller so another tool (for example a messenger plugin's file-attachment
 * argument) can pick the audio up. The browser engine produces no bytes on the
 * host and therefore has no export — the caller reports that state explicitly
 * instead of failing silently.
 *
 * The directory is bounded in BOTH dimensions: file count (`maxFiles`) and age
 * (`maxAgeMinutes`). Pruning only ever unlinks files whose names this module
 * generated itself ({@link EXPORT_FILE_PATTERN}), so a user-configured
 * directory that already holds other files is never touched. Every function
 * here is either pure ({@link exportFileName}, {@link resolveExportDir},
 * {@link selectPrunableExports}) or best-effort: {@link exportSynthesizedAudio}
 * never throws into the speak path, and a failed prune never fails the
 * utterance.
 *
 * @module dsh-talk/audio-export
 */

import { mkdir, readdir, stat, unlink, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { isAbsolute, join, normalize, sep } from 'node:path'
import { sanitizeText } from './sanitize.ts'

/** Local engines whose audio can be exported to a file. */
export type LocalTtsEngine = 'edge-tts' | 'piper'

/** Export state reported with one speak outcome. */
export type AudioExportState =
  /** The audio was written; `audioPath` is set. */
  | 'file'
  /** The engine synthesizes in the browser, so no host bytes exist. */
  | 'unsupported'
  /** `tts.export.enabled` is false. */
  | 'disabled'
  /** The write (or its directory) failed; speech itself still succeeded. */
  | 'failed'

/** Result of one export attempt: the path plus why there is none. */
export interface ExportOutcome {
  /** Absolute path of the written file; present only for the `file` state. */
  audioPath?: string
  /** What happened to the file. */
  audioExport: AudioExportState
  /** Sanitized explanation for every state except `file`. */
  exportNote?: string
}

/** Bounded export policy resolved from config. */
export interface ExportPolicy {
  /** Write audio files (false = report `disabled` and touch nothing). */
  readonly enabled: boolean
  /** Absolute target directory. */
  readonly dir: string
  /** Files retained in `dir` (including the one being written). */
  readonly maxFiles: number
  /** Files older than this many minutes are removed. */
  readonly maxAgeMinutes: number
}

/** One directory entry considered for pruning. */
export interface ExportEntry {
  /** Base name. */
  readonly name: string
  /** Last-modification time in epoch milliseconds. */
  readonly mtimeMs: number
}

/**
 * Names this module owns: `speech-<UTC stamp>-<utterance token>.<ext>`.
 * Pruning is restricted to this shape, so nothing else in the directory is
 * ever removed — and a name is never derived from the spoken text, which keeps
 * utterances out of file names.
 */
export const EXPORT_FILE_PATTERN = /^speech-\d{8}T\d{6}Z-[0-9a-f]{8}\.(?:mp3|wav)$/u

/** Default directory, relative to the user's home: `<home>/.dsh-talk/audio`. */
export const DEFAULT_EXPORT_DIRECTORY = '.dsh-talk/audio'

/** Note reported for the browser engine, which has no host-side bytes. */
export const BROWSER_EXPORT_NOTE = 'the browser engine synthesizes in the browser'

/**
 * File extension of one local engine's output.
 *
 * @param engine - the local engine that produced the audio.
 * @returns `mp3` for edge-tts, `wav` for piper.
 */
export function exportExtension(engine: LocalTtsEngine): 'mp3' | 'wav' {
  return engine === 'piper' ? 'wav' : 'mp3'
}

/**
 * Build the export file name: `speech-<YYYYMMDD>T<HHMMSS>Z-<8 hex>.<ext>`.
 * The stamp is UTC (so names sort chronologically and never depend on the
 * host's zone) and the token comes from the utterance id (so a file can be
 * traced back to the log entry that produced it).
 *
 * @param engine - the local engine that produced the audio.
 * @param now - timestamp of the write.
 * @param utteranceId - the utterance id (any string; non-hex characters drop).
 * @returns the base name.
 */
export function exportFileName(engine: LocalTtsEngine, now: Date, utteranceId: string): string {
  const stamp = now.toISOString().replace(/[-:]/gu, '').replace(/\.\d{3}Z$/u, 'Z')
  const token = `${utteranceId.replace(/[^0-9a-f]/giu, '').toLowerCase()}00000000`.slice(0, 8)
  return `speech-${stamp}-${token}.${exportExtension(engine)}`
}

/**
 * Resolve the export directory. An empty setting means `<home>/.dsh-talk/audio`
 * (the plugin's own directory — never the workspace root); `~` expands to the
 * home directory; a relative path resolves under the home directory on purpose,
 * so the export target can never depend on, or pollute, the host's working
 * directory.
 *
 * @param raw - the configured value (any input; non-strings mean "unset").
 * @param home - the home directory (injectable for tests).
 * @returns the absolute export directory.
 */
export function resolveExportDir(raw: unknown, home: string = homedir()): string {
  const value = typeof raw === 'string' ? raw.trim() : ''
  if (value === '') return normalize(join(home, DEFAULT_EXPORT_DIRECTORY))
  if (value === '~') return normalize(home)
  if (value.startsWith(`~${sep}`) || value.startsWith('~/') || value.startsWith('~\\')) return normalize(join(home, value.slice(2)))
  if (isAbsolute(value)) return normalize(value)
  return normalize(join(home, value))
}

/**
 * Decide which files one prune pass removes: every entry past `maxAgeMinutes`
 * first, then the oldest survivors until the directory holds at most
 * `maxFiles` files counting `keep`. Pure, so the whole policy is unit-tested
 * without touching a filesystem.
 *
 * @param entries - current directory entries (names + mtimes).
 * @param keep - names never pruned (the file just written).
 * @param policy - the count and age bounds.
 * @param nowMs - current time in epoch milliseconds.
 * @returns the names to unlink.
 */
export function selectPrunableExports(
  entries: readonly ExportEntry[],
  keep: readonly string[],
  policy: { readonly maxFiles: number; readonly maxAgeMinutes: number },
  nowMs: number,
): readonly string[] {
  const kept = new Set(keep)
  const owned = entries.filter(entry => !kept.has(entry.name) && EXPORT_FILE_PATTERN.test(entry.name))
  const maxAgeMs = policy.maxAgeMinutes * 60_000
  const expired = owned.filter(entry => nowMs - entry.mtimeMs > maxAgeMs)
  const expiredNames = new Set(expired.map(entry => entry.name))
  const survivors = owned
    .filter(entry => !expiredNames.has(entry.name))
    .sort((left, right) => right.mtimeMs - left.mtimeMs)
  const overflow = Math.max(0, kept.size + survivors.length - policy.maxFiles)
  const overCount = overflow === 0 ? [] : survivors.slice(survivors.length - overflow)
  return [...expired.map(entry => entry.name), ...overCount.map(entry => entry.name)]
}

/**
 * Write one synthesized utterance to the export directory, then bound the
 * directory (age first, then count). Never throws: a write failure or a failed
 * prune is reported in the outcome, because exporting is an addition to
 * speech and must never be able to break playback.
 *
 * @param policy - the resolved export policy.
 * @param engine - the local engine that produced the audio.
 * @param utteranceId - the utterance id (feeds the file name).
 * @param data - the audio bytes.
 * @param now - timestamp of the write (injectable for tests).
 * @returns the export outcome.
 */
export async function exportSynthesizedAudio(
  policy: ExportPolicy,
  engine: LocalTtsEngine,
  utteranceId: string,
  data: Uint8Array,
  now: Date = new Date(),
): Promise<ExportOutcome> {
  if (!policy.enabled) {
    return { audioExport: 'disabled', exportNote: 'audio file export is disabled (tts.export.enabled = false)' }
  }
  const name = exportFileName(engine, now, utteranceId)
  let file: string
  try {
    // 0o700 applies only to directories this call creates (POSIX; a no-op on
    // Windows) — the spoken text is the user's own material.
    await mkdir(policy.dir, { recursive: true, mode: 0o700 })
    file = join(policy.dir, name)
    await writeFile(file, data)
  } catch (error) {
    return {
      audioExport: 'failed',
      exportNote: `audio export failed: ${sanitizeText(error instanceof Error ? error.message : String(error))}`,
    }
  }
  await pruneExports(policy.dir, [name], policy, now.getTime())
  return { audioPath: file, audioExport: 'file' }
}

/**
 * Remove the files {@link selectPrunableExports} selects. Best-effort by
 * design: a prune failure (a locked file, a vanished entry, a permission
 * change) is swallowed — the next export tries again, and the age/count bounds
 * are enforced on every write.
 *
 * @param dir - the export directory.
 * @param keep - names never pruned.
 * @param policy - the count and age bounds.
 * @param nowMs - current time in epoch milliseconds.
 * @returns how many files were removed.
 */
export async function pruneExports(
  dir: string,
  keep: readonly string[],
  policy: { readonly maxFiles: number; readonly maxAgeMinutes: number },
  nowMs: number,
): Promise<number> {
  try {
    const names = await readdir(dir)
    const entries: ExportEntry[] = []
    for (const name of names) {
      if (!EXPORT_FILE_PATTERN.test(name)) continue
      try {
        const info = await stat(join(dir, name))
        if (info.isFile()) entries.push({ name, mtimeMs: info.mtimeMs })
      } catch {
        // The entry vanished between readdir and stat: nothing to prune.
      }
    }
    const doomed = selectPrunableExports(entries, keep, policy, nowMs)
    let removed = 0
    for (const name of doomed) {
      try {
        await unlink(join(dir, name))
        removed += 1
      } catch {
        // Locked or already gone: the next export re-evaluates the bounds.
      }
    }
    return removed
  } catch {
    return 0
  }
}
