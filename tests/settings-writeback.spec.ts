/**
 * The profile-patch write-back (A7): a settings submission whose MERGED row
 * cannot load must be refused before anything touches the patch layer — the
 * file stays byte-identical and no backup appears — while a row that loads is
 * appended with exactly one backup. The wire validation only inspects the
 * submission itself, so the merged-config check is the layer under test here
 * (`ttsEngine: 'piper'` passes the wire check but needs a configured model).
 * @module dsh-talk/test/settings-writeback.spec
 */

import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { mountHarness } from './harness.ts'

/** Run `body` over a fresh throwaway profile directory holding a patch layer. */
async function withProfilePatch(body: (dir: string, file: string) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), 'dsh-talk-patch-'))
  const file = join(dir, 'cordis.patch.yml')
  await writeFile(file, '# hand-authored profile patch layer\n- insert:\n    - id: talk\n', 'utf8')
  try {
    await body(dir, file)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

/** Point the mounted service at `dir` through the loader's `baseUrl` seat. */
async function mountAt(dir: string) {
  const harness = await mountHarness({})
  ;(harness.ctx as unknown as { baseUrl?: string }).baseUrl = dir
  return harness
}

const backupNames = (names: string[]): string[] => names.filter(name => name.includes('.bak-'))

describe('applySettings profile-patch write-back', () => {
  it('refuses a merged configuration that cannot load, leaving the file and its backups untouched', async () => {
    await withProfilePatch(async (dir, file) => {
      const harness = await mountAt(dir)
      const before = await readFile(file, 'utf8')
      // `piper` passes the wire validation but needs `tts.piper.modelPath`.
      await expect(harness.service.applySettings({ ttsEngine: 'piper' })).rejects.toThrow(/cannot load/)
      expect(await readFile(file, 'utf8')).toBe(before)
      expect(backupNames(await readdir(dir))).toHaveLength(0)
    })
  })

  it('appends the validated fragment and exactly one backup for a configuration that loads', async () => {
    await withProfilePatch(async (dir, file) => {
      const harness = await mountAt(dir)
      const before = await readFile(file, 'utf8')
      const result = await harness.service.applySettings({ ttsEngine: 'browser' })
      expect(result.file).toBe(file)
      const written = await readFile(file, 'utf8')
      // The fragment restates the ROW config (config vocabulary: `tts.engine`),
      // not the panel's flat submission keys, and never rewrites what was there.
      expect(written.startsWith(before)).toBe(true)
      expect(written).toContain('- set:')
      expect(written).toContain('    id: talk')
      expect(written).toContain('    name: dsh-talk')
      expect(written).toMatch(/^ {6}tts:$/m)
      expect(written).toMatch(/^ {8}engine: browser$/m)
      const backups = backupNames(await readdir(dir))
      expect(backups).toHaveLength(1)
      expect(await readFile(join(dir, backups[0]!), 'utf8')).toBe(before)
    })
  })

  it('rejects a malformed submission before touching the file at all', async () => {
    await withProfilePatch(async (dir, file) => {
      const harness = await mountAt(dir)
      const before = await readFile(file, 'utf8')
      await expect(harness.service.applySettings({ sttEngine: 'not-an-engine' } as never)).rejects.toThrow()
      expect(await readFile(file, 'utf8')).toBe(before)
      expect(backupNames(await readdir(dir))).toHaveLength(0)
    })
  })
})
