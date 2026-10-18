/**
 * Real Loader composition suite (community five-layer model, layer 4): an
 * independent process mounts the Loader over a cordis.yml with the real
 * session/system-prompt/tools service rows + the plugin row, proving the BUILT
 * entry loads under plain Node (A1) and that inject + config resolution work.
 * Also carries the Schemastery negative regression: an invalid config must
 * fail loud for the expected reason.
 *
 * @module dsh-talk/test/composition.spec
 */

import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const runner = join(repositoryRoot, 'scripts', 'loader-runner.mjs')
const builtEntry = join(repositoryRoot, 'lib', 'index.js')
const builtUrl = pathToFileURL(builtEntry).href

/** One cordis.yml: real service rows, then the plugin row with optional config. */
function configFor(pluginRow: string, configLines: string[] = []): string {
  return [
    "- name: '@deepseek-ai/dsh-session'",
    "- name: '@deepseek-ai/dsh-system-prompt'",
    "- name: '@deepseek-ai/dsh-tools'",
    `- name: ${JSON.stringify(pluginRow)}`,
    ...(configLines.length > 0 ? ['  config:', ...configLines.map(line => `    ${line}`)] : []),
    '',
  ].join('\n')
}

function runRunner(configPath: string, env: Record<string, string> = {}) {
  const result = spawnSync(process.execPath, [runner, configPath], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    env: { ...process.env, ...env },
    timeout: 120_000,
  })
  if (result.error !== undefined) throw result.error
  return { status: result.status, stdout: result.stdout, stderr: result.stderr }
}

/** The `DSH_LOADER_RESULT` summary the runner prints on success. */
function summaryOf(stdout: string): Record<string, unknown> {
  const marker = stdout.match(/DSH_LOADER_RESULT (.+)$/mu)
  expect(marker, `no DSH_LOADER_RESULT in:\n${stdout}`).not.toBeNull()
  return JSON.parse(marker![1]!) as Record<string, unknown>
}

const temporaryRoot = mkdtempSync(join(tmpdir(), 'dsh-talk-loader-'))

beforeAll(() => {
  const build = spawnSync('pnpm', ['run', 'build'], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    env: { ...process.env },
    shell: process.platform === 'win32',
    timeout: 120_000,
  })
  if (build.status !== 0) {
    throw new Error(`build failed (${String(build.status)}):\n${build.stdout}\n${build.stderr}`)
  }
}, 120_000)

afterAll(() => {
  rmSync(temporaryRoot, { recursive: true, force: true })
})

describe('Loader composition', () => {
  it('mounts the built plugin and speaks through the browser engine', () => {
    const configPath = join(temporaryRoot, 'valid.yml')
    writeFileSync(configPath, configFor(builtUrl))
    const evidence = runRunner(configPath)
    expect(evidence.status, `stderr:\n${evidence.stderr}`).toBe(0)
    expect(evidence.stdout).toContain('DSH_LOADER_RESULT')
    const summary = summaryOf(evidence.stdout)
    expect(summary.service).toBe('talk')
    expect(summary.tools).toContain('speak')
    expect(summary.spoken).toBe(true)
    expect(summary.engine).toBe('browser')
  })

  // The audio-export half of the built artifact, end to end: the Loader mounts
  // lib/index.js, the config carries the tts.export.* knobs, a scripted engine
  // writes real bytes where the argv points, and the plugin's own export step
  // must put that file in the CONFIGURED directory and return its path.
  it('exports the synthesized audio file through the built plugin', () => {
    const exportDir = join(temporaryRoot, 'exports')
    const configPath = join(temporaryRoot, 'export.yml')
    writeFileSync(configPath, configFor(builtUrl, [
      'tts:',
      '  engine: edge-tts',
      '  export:',
      `    dir: ${JSON.stringify(exportDir)}`,
      '    maxFiles: 3',
      '    maxAgeMinutes: 60',
    ]))
    const evidence = runRunner(configPath, { DSH_LOADER_EXPORT_DIR: exportDir })
    expect(evidence.status, `stderr:\n${evidence.stderr}`).toBe(0)
    const summary = summaryOf(evidence.stdout)
    expect(summary.audioExport).toBe('file')
    expect(String(summary.audioPath).startsWith(exportDir)).toBe(true)
    expect(summary.fileBytes).toBe('ID3-loader-runner-audio'.length)
    const written = readdirSync(exportDir)
    expect(written).toHaveLength(1)
    expect(written[0]).toMatch(/^speech-\d{8}T\d{6}Z-[0-9a-f]{8}\.mp3$/u)
  })

  it('fails loud through the Loader for an out-of-range export bound', () => {
    const configPath = join(temporaryRoot, 'invalid-export.yml')
    writeFileSync(configPath, configFor(builtUrl, ['tts:', '  export:', '    maxFiles: 0']))
    const evidence = runRunner(configPath)
    expect(evidence.status).not.toBe(0)
    expect(evidence.stderr).toMatch(/maxFiles|expected number/u)
  })

  it('fails loud through the Loader for a Schemastery type error', () => {
    const configPath = join(temporaryRoot, 'invalid-type.yml')
    writeFileSync(configPath, configFor(builtUrl, ["interrupt: 'yes'"]))
    const evidence = runRunner(configPath)
    expect(evidence.status).not.toBe(0)
    expect(evidence.stderr).toMatch(/expected boolean/u)
  })
})
