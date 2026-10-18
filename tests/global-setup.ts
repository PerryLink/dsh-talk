/**
 * Vitest global setup: a test run's audio-export temp directories are removed
 * when the run ends. Worker processes cannot do this themselves — vitest
 * terminates its forks without running `process.on('exit')` handlers — so the
 * main process records which `dsh-talk-export-*` directories already existed
 * and removes exactly the ones this run created.
 *
 * Nothing outside that prefix is ever touched, and a directory that predates
 * the run is left alone.
 *
 * @module dsh-talk/test/global-setup
 */

import { readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/** Prefix of every audio-export temp directory (see `tests/harness.ts`). */
const PREFIX = 'dsh-talk-export-'

/** Names currently present under the temp directory. */
function exportDirs(): string[] {
  return readdirSync(tmpdir()).filter(name => name.startsWith(PREFIX))
}

/**
 * Vitest global setup hook: snapshot the pre-existing export temp directories
 * and return the teardown that removes this run's own.
 *
 * @returns the teardown hook.
 */
export default function setup(): () => void {
  const preexisting = new Set(exportDirs())
  return () => {
    for (const name of exportDirs()) {
      if (preexisting.has(name)) continue
      try {
        rmSync(join(tmpdir(), name), { recursive: true, force: true })
      } catch {
        // Best-effort: a leftover empty temp directory is harmless.
      }
    }
  }
}
