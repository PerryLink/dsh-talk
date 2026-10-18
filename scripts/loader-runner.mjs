// scripts/loader-runner.mjs — real Loader composition runner for dsh-talk
// (community five-layer model, layer 4). An independent process boots a real
// Context, mounts the vendored Loader with the Include builtin, provides a
// scripted subprocess face (the browser engine path never touches it, and the
// audio-export path gets a real media file written where the engine's argv
// points), reads the given cordis.yml (session + system-prompt + tools service
// rows, then the plugin row), and asserts the plugin's contributions through
// the authoritative registries plus real behavior: the speak tool through the
// browser engine, and — when DSH_LOADER_EXPORT_DIR is set — the audio file the
// local engine path exports.
//
// Usage: node scripts/loader-runner.mjs <cordis.yml>
// Exit 0 prints DSH_LOADER_RESULT <json>; any load or assertion failure exits
// non-zero with the reason on stderr (used by the invalid-config regression).

import { Context } from '@deepseek-ai/cordis'
import Include from '@deepseek-ai/cordis-plugin-include'
import Loader from '@deepseek-ai/cordis-plugin-loader'
import { ToolCallId as CallId } from '@deepseek-ai/dsh-llm'
import { SessionId } from '@deepseek-ai/dsh-session'
import { readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'

const configArgument = process.argv[2]
if (configArgument === undefined) {
  console.error('usage: loader-runner.mjs <cordis.yml>')
  process.exit(2)
}

/** Bytes the scripted edge-tts face writes where `--write-media` points. */
const SYNTH_BYTES = 'ID3-loader-runner-audio'

const configPath = resolve(configArgument)
const configRequire = createRequire(resolve(import.meta.dirname, '../package.json'))

const ctx = new Context()
try {
  ctx.baseUrl = `${pathToFileURL(dirname(configPath)).href}/`
  await ctx.plugin(Loader)
  ctx.loader.internal = /** @type {any} */ ({
    version: 'v2',
    async import(specifier) {
      if (specifier.startsWith('file:')) return import(specifier)
      if (specifier.startsWith('node:')) return import(specifier)
      const absolute = /^([a-zA-Z]:)?[\\/]/u.test(specifier)
      return import(pathToFileURL(absolute ? specifier : configRequire.resolve(specifier)).href)
    },
  })
  ctx.loader.builtins.include = Include
  // The plugin hard-injects `subprocess`. The browser-engine path never calls
  // it (any unexpected argv throws), and the local-engine path needs a real
  // file where `--write-media` points — exactly what a real edge-tts does.
  ctx.provide('subprocess', {
    spawn(spec) {
      const marker = spec.argv.indexOf('--write-media')
      if (marker === -1 || marker + 1 >= spec.argv.length) {
        throw new Error(`subprocess face: unexpected argv ${JSON.stringify(spec.argv)}`)
      }
      const outPath = spec.argv[marker + 1]
      const emptyReader = { readFrom: () => ({ text: '', nextOffset: 0, lossy: false }) }
      return {
        stdin: undefined,
        stdout: undefined,
        stderr: undefined,
        control: undefined,
        collected: { stdout: emptyReader, stderr: emptyReader },
        done: writeFile(outPath, SYNTH_BYTES, 'binary').then(() => ({ exitCode: 0, signal: null })),
        terminate: () => undefined,
        waitForExit: async () => true,
      }
    },
  })
  await ctx.loader.create({
    name: 'cordis:include',
    config: { path: pathToFileURL(configPath).href },
  })
  await ctx.loader.await()
  await rethrowFirstFailedRow()

  // Authoritative registries carry the plugin's contributions.
  if (ctx.get('talk') === undefined) {
    throw new Error('Loader composition: talk service is missing from the context')
  }
  const session = ctx.sessions.create(SessionId('dsh-talk-loader-runner'))
  const agent = /** @type {any} */ ({
    id: session.id,
    options: {},
    session,
    inbox: {},
    status: 'idle',
    ctx,
    cancel: () => undefined,
    whenIdle: async () => undefined,
    runMaintenance: async (task) => task(new AbortController().signal),
    send: () => undefined,
    followup: () => undefined,
    steer: () => undefined,
    inject: () => undefined,
  })

  // Real behavior: the speak tool through the browser engine (no subprocess I/O).
  const result = await ctx.tools.execute({
    callId: CallId('dsh-talk-loader-runner'),
    name: 'speak',
    arguments: { text: 'hello', engine: 'browser' },
    agent,
    signal: new AbortController().signal,
  })
  const value = result.isError === false ? result.value : null
  if (value === null || value.spoken !== true || value.engine !== 'browser') {
    throw new Error(`Loader composition: speak returned ${JSON.stringify({ isError: result.isError, value: result.value })}`)
  }

  const summary = {
    service: 'talk',
    tools: ctx.tools.schemas().map(schema => schema.name),
    spoken: value.spoken,
    engine: value.engine,
  }

  // Real behavior: the local-engine path exports a real audio file. Opt-in via
  // the environment so a run with the production default export directory
  // (under the user's home) never writes anything.
  const exportDir = process.env.DSH_LOADER_EXPORT_DIR
  if (exportDir !== undefined && exportDir !== '') {
    const local = await ctx.tools.execute({
      callId: CallId('dsh-talk-loader-runner-export'),
      name: 'speak',
      arguments: { text: 'hello', engine: 'edge-tts', interrupt: false },
      agent,
      signal: new AbortController().signal,
    })
    const exported = local.isError === false ? local.value : null
    if (exported === null || exported.audioExport !== 'file' || typeof exported.audioPath !== 'string') {
      throw new Error(`Loader composition: local speak returned ${JSON.stringify({ isError: local.isError, value: local.value })}`)
    }
    const resolvedExport = resolve(exportDir)
    if (!resolve(exported.audioPath).startsWith(resolvedExport + sep)) {
      throw new Error(`Loader composition: ${exported.audioPath} is outside the configured export directory ${resolvedExport}`)
    }
    const written = await readFile(exported.audioPath)
    if (written.byteLength !== SYNTH_BYTES.length) {
      throw new Error(`Loader composition: exported file holds ${written.byteLength} bytes, expected ${SYNTH_BYTES.length}`)
    }
    summary.audioExport = exported.audioExport
    summary.audioPath = exported.audioPath
    summary.fileBytes = written.byteLength
  }

  process.stdout.write(`DSH_LOADER_RESULT ${JSON.stringify(summary)}\n`)
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
} finally {
  await ctx.fiber.dispose()
}

/**
 * Re-throw the first FAILED loader row's own reason.
 *
 * `cordis-plugin-loader` 1.0.6 dropped the failure surface `await()` had in 1.0.4: the old body
 * collected every `entry._await()` outcome and threw the single failure (or an AggregateError),
 * while the new body only drains `_initTask || fiber.inertia` and so resolves even when a row's
 * `apply` threw. Without this the negative composition regressions report the runner's own
 * downstream symptom instead of the reason they assert. `fiber.await()` still rethrows the
 * stored error, so the reason comes back without touching the logger.
 *
 * `DSH_LOADER_RUNNER_NO_RETHROW=1` disables it for re-measurement only.
 */
async function rethrowFirstFailedRow() {
  if (process.env.DSH_LOADER_RUNNER_NO_RETHROW === '1') return
  const failures = []
  for (const entry of ctx.loader.entries()) {
    // FiberState.FAILED === 3 (const enum, erased at runtime).
    if (entry?.fiber?.state !== 3) continue
    try {
      await entry.fiber.await()
    } catch (error) {
      failures.push(error instanceof Error ? error : new Error(String(error)))
    }
  }
  if (failures.length === 1) throw failures[0]
  if (failures.length > 1) throw new AggregateError(failures, 'loader fibers failed')
}
