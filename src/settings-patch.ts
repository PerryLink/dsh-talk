/**
 * Settings write-back: the settings panel's engine/language changes are
 * rendered as ONE append-only `- set:` operation against the profile's
 * `cordis.patch.yml` (the same append-with-backup discipline as the loader
 * patch vocabulary). The plugin never rewrites the file: user comments and
 * unrelated rows stay byte-for-byte untouched, a timestamped backup is
 * written before each append, and the appended block can be hand-removed to
 * undo. Generated fragments carry plain string values only — no `!!js`.
 *
 * @module dsh-talk/settings-patch
 */

import { copyFile, readFile, readdir, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Config } from './config.ts'
import { STT_ENGINES, TTS_ENGINES, type TalkSettingsInput } from './wire.ts'

/** Backup filename suffix: `<file>.bak-<epoch-ms>`. */
const BACKUP_SUFFIX = '.bak-'

/** Fresh-file header when the patch layer does not exist yet. */
const FRESH_FILE_HEADER = `# dsh-talk managed patch layer (created by the talk settings panel).
# Operations are APPEND-ONLY: the panel never rewrites existing content.
[]
`

/** The plugin row id the panel writes (`id` of the bundle's insert row). */
export const TALK_ROW_ID = 'talk'

/** The package name every generated row names. */
export const TALK_PACKAGE_NAME = 'dsh-talk'

/** One validation error, code + human text (the client localizes the code). */
export interface TalkSettingsIssue {
  /** Stable error code (locale keys derive from it). */
  code: 'stt-engine-invalid' | 'tts-engine-invalid' | 'language-invalid' | 'funasr-requires-url' | 'settings-malformed'
  /** English explanation (fallback text on every surface). */
  text: string
}

/** Validation outcome: the normalized settings or the first issues. */
export type TalkSettingsValidation =
  | { readonly ok: true; readonly settings: TalkSettingsInput }
  | { readonly ok: false; readonly issues: readonly TalkSettingsIssue[] }

/**
 * Validate one settings submission against the config vocabulary. The wire
 * codec already proved the JSON shapes; this pass re-checks domain rules
 * (enum membership, language tag, cross-field addressability) at the durable
 * boundary, where a bad value would otherwise be persisted.
 *
 * @param input - raw JSON from the client (untrusted).
 * @param rawConfig - the row's current raw config (host-owned).
 * @returns the validation outcome.
 */
export function validateSettingsInput(input: unknown, rawConfig: Config | undefined): TalkSettingsValidation {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { ok: false, issues: [{ code: 'settings-malformed', text: 'Settings must be a JSON object.' }] }
  }
  const value = input as Record<string, unknown>
  const issues: TalkSettingsIssue[] = []
  const sttEngine = value['sttEngine']
  if (sttEngine !== undefined && !(STT_ENGINES as readonly unknown[]).includes(sttEngine)) {
    issues.push({ code: 'stt-engine-invalid', text: 'sttEngine must be one of auto | web | funasr | whisper.' })
  }
  const ttsEngine = value['ttsEngine']
  if (ttsEngine !== undefined && !(TTS_ENGINES as readonly unknown[]).includes(ttsEngine)) {
    issues.push({ code: 'tts-engine-invalid', text: 'ttsEngine must be one of auto | browser | edge-tts | piper.' })
  }
  const language = value['language']
  if (language !== undefined && (typeof language !== 'string' || (language !== 'auto' && !/^[a-zA-Z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$/.test(language)))) {
    issues.push({ code: 'language-invalid', text: 'language must be "auto" or a BCP-47 tag.' })
  }
  for (const key of ['announceEnabled', 'onTurnEnd', 'onApproval', 'onError', 'interrupt']) {
    const entry = value[key]
    if (entry !== undefined && typeof entry !== 'boolean') {
      issues.push({ code: 'settings-malformed', text: `${key} must be a boolean.` })
    }
  }
  // Enabling the funasr engine without an endpoint would fail at first use;
  // refuse it here so the panel can explain instead of persisting a broken row.
  const effectiveStt = sttEngine ?? rawConfig?.stt?.engine ?? 'auto'
  if (effectiveStt === 'funasr') {
    const url = rawConfig?.stt?.funasr?.url
    if (typeof url !== 'string' || url === '') {
      issues.push({ code: 'funasr-requires-url', text: 'The funasr engine needs stt.funasr.url set in cordis.patch.yml first.' })
    }
  }
  if (issues.length > 0) return { ok: false, issues }
  return {
    ok: true,
    settings: {
      ...(sttEngine !== undefined ? { sttEngine: sttEngine as TalkSettingsInput['sttEngine'] } : {}),
      ...(ttsEngine !== undefined ? { ttsEngine: ttsEngine as TalkSettingsInput['ttsEngine'] } : {}),
      ...(typeof language === 'string' ? { language } : {}),
      ...(value['announceEnabled'] === true || value['announceEnabled'] === false ? { announceEnabled: value['announceEnabled'] } : {}),
      ...(value['onTurnEnd'] === true || value['onTurnEnd'] === false ? { onTurnEnd: value['onTurnEnd'] } : {}),
      ...(value['onApproval'] === true || value['onApproval'] === false ? { onApproval: value['onApproval'] } : {}),
      ...(value['onError'] === true || value['onError'] === false ? { onError: value['onError'] } : {}),
      ...(value['interrupt'] === true || value['interrupt'] === false ? { interrupt: value['interrupt'] } : {}),
    },
  }
}

/**
 * Merge one validated settings submission over the row's RAW config. Fields
 * the panel did not change keep their raw values (including `!!js`
 * expressions and non-displayed keys), so a panel write never flattens a
 * hand-authored row.
 *
 * @param rawConfig - the row's raw config (host-owned, never displayed).
 * @param settings - the validated submission.
 * @returns the merged row config for emission.
 */
export function mergeTalkRowConfig(rawConfig: Config | undefined, settings: TalkSettingsInput): Record<string, unknown> {
  const merged: Record<string, unknown> = {
    ...(rawConfig !== undefined ? { ...rawConfig } : {}),
  }
  const stt = (typeof merged['stt'] === 'object' && merged['stt'] !== null && !Array.isArray(merged['stt']))
    ? { ...(merged['stt'] as Record<string, unknown>) }
    : {}
  const tts = (typeof merged['tts'] === 'object' && merged['tts'] !== null && !Array.isArray(merged['tts']))
    ? { ...(merged['tts'] as Record<string, unknown>) }
    : {}
  const announce = (typeof merged['announce'] === 'object' && merged['announce'] !== null && !Array.isArray(merged['announce']))
    ? { ...(merged['announce'] as Record<string, unknown>) }
    : {}
  if (settings.sttEngine !== undefined) stt['engine'] = settings.sttEngine
  if (settings.language !== undefined) stt['language'] = settings.language
  if (settings.ttsEngine !== undefined) tts['engine'] = settings.ttsEngine
  if (settings.announceEnabled !== undefined) announce['enabled'] = settings.announceEnabled
  if (settings.onTurnEnd !== undefined) announce['onTurnEnd'] = settings.onTurnEnd
  if (settings.onApproval !== undefined) announce['onApproval'] = settings.onApproval
  if (settings.onError !== undefined) announce['onError'] = settings.onError
  if (settings.interrupt !== undefined) merged['interrupt'] = settings.interrupt
  merged['stt'] = stt
  merged['tts'] = tts
  merged['announce'] = announce
  return merged
}

/** Quote one string for YAML emission (plain-safe scalars stay plain). */
export function yamlScalar(value: string): string {
  if (value === '') return "''"
  if (/^[A-Za-z][A-Za-z0-9_./@%+=,:-]*$/u.test(value) && !RESERVED_WORDS.has(value.toLocaleLowerCase())) return value
  if (/[\u0000-\u001f\u007f]/u.test(value)) return JSON.stringify(value)
  return `'${value.replaceAll("'", "''")}'`
}

/** YAML vocabulary values that would change type when emitted plain. */
const RESERVED_WORDS = new Set(['true', 'false', 'null', 'yes', 'no', 'on', 'off', '~', 'y', 'n'])

/** One-line comment stamp for a generated operation block. */
export function settingsPatchComment(now = new Date()): string {
  return `dsh-talk: settings applied by the panel (${now.toISOString().slice(0, 10)})`
}

/**
 * Render the merged row config as one append-only `- set:` loader patch
 * fragment. The row is restated in full, so a later panel write supersedes an
 * earlier one exactly like a hand-edited patch line.
 *
 * @param rowConfig - the merged row config.
 * @param now - timestamp anchor (tests pass a fixed date).
 * @returns the YAML fragment (no trailing newline; callers append one).
 */
export function renderSettingsFragment(rowConfig: Record<string, unknown>, now = new Date()): string {
  const lines = [`# ${settingsPatchComment(now)}`, '- set:', `    id: ${yamlScalar(TALK_ROW_ID)}`, `    name: ${yamlScalar(TALK_PACKAGE_NAME)}`]
  emitBlock(lines, '    config:', rowConfig, 6)
  return lines.join('\n')
}

/** Emit a config object block under one `key:` line at a fixed indent. */
function emitBlock(lines: string[], keyLine: string, value: Record<string, unknown>, indent: number): void {
  const entries = Object.entries(value)
  if (entries.length === 0) {
    lines.push(`${keyLine} {}`)
    return
  }
  lines.push(keyLine)
  const pad = ' '.repeat(indent)
  for (const [key, entry] of entries) emitValue(lines, `${pad}${key}`, entry, indent)
}

/** Emit one JSON-ish value under a `key` prefix. */
function emitValue(lines: string[], key: string, value: unknown, indent: number): void {
  if (typeof value === 'string') {
    lines.push(`${key}: ${yamlScalar(value)}`)
    return
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    lines.push(`${key}: ${String(value)}`)
    return
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      lines.push(`${key}: []`)
      return
    }
    lines.push(`${key}:`)
    for (const entry of value) {
      if (typeof entry === 'string') lines.push(`${' '.repeat(indent + 2)}- ${yamlScalar(entry)}`)
      else lines.push(`${' '.repeat(indent + 2)}- ${JSON.stringify(entry)}`)
    }
    return
  }
  if (typeof value === 'object' && value !== null) {
    emitBlock(lines, `${key}:`, value as Record<string, unknown>, indent + 2)
    return
  }
  lines.push(`${key}: ${JSON.stringify(value)}`)
}

/**
 * Copy the current patch file to a timestamped backup, append one fragment,
 * and prune backups beyond `backupCount` (newest kept). Creates the file with
 * an empty list header when it does not exist. Backup → append, in that
 * order, so nothing is partially applied after the backup step.
 *
 * @param filePath - absolute path of the profile patch layer.
 * @param fragment - the generated YAML block (no trailing newline needed).
 * @param backupCount - backups retained (>= 1).
 * @returns the absolute backup path and the number of bytes appended.
 */
export async function appendSettingsFragment(
  filePath: string,
  fragment: string,
  backupCount: number,
): Promise<{ readonly backupPath: string; readonly bytes: number }> {
  let existing = true
  try {
    await readFile(filePath, 'utf8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException | null)?.code !== 'ENOENT') throw error
    existing = false
  }
  if (!existing) await writeFile(filePath, FRESH_FILE_HEADER, 'utf8')
  const backupPath = `${filePath}${BACKUP_SUFFIX}${Date.now()}`
  await copyFile(filePath, backupPath)
  const bytes = await appendFragment(filePath, fragment)
  await pruneBackups(filePath, backupCount)
  return { backupPath, bytes }
}

/** Append one fragment with surrounding newlines, normalizing a trailing newline first. */
async function appendFragment(filePath: string, fragment: string): Promise<number> {
  const content = await readFile(filePath, 'utf8')
  const normalized = content.endsWith('\n') ? content : `${content}\n`
  const block = normalized.endsWith('\n\n') ? `${fragment}\n` : `\n${fragment}\n`
  await writeFile(filePath, `${normalized}${block}`, 'utf8')
  return Buffer.byteLength(block, 'utf8')
}

/** Keep only the newest `keep` `*.bak-*` siblings of `filePath`. */
async function pruneBackups(filePath: string, keep: number): Promise<void> {
  const dir = join(filePath, '..')
  const prefix = filePath.slice(dir.length + 1) + BACKUP_SUFFIX
  let names: string[]
  try {
    names = (await readdir(dir)).filter(name => name.startsWith(prefix))
  } catch {
    return // Directory listing failed — pruning is best-effort, never fatal.
  }
  if (names.length <= keep) return
  const sorted = names
    .map(name => ({ name, stamp: Number(name.slice(prefix.length)) }))
    .filter(entry => Number.isFinite(entry.stamp))
    .sort((left, right) => right.stamp - left.stamp)
  for (const entry of sorted.slice(keep)) {
    try {
      await unlink(join(dir, entry.name))
    } catch {
      // A busy backup file only skips pruning.
    }
  }
}
