// scripts/loader-runner.mjs — real Loader composition runner for dsh-talk
// (community five-layer model, layer 4). An independent process boots a real
// Context, mounts the vendored Loader with the Include builtin, provides a
// scripted subprocess face (the browser engine path never touches it), reads
// the given cordis.yml (session + system-prompt + tools service rows, then the
// plugin row), and asserts the plugin's contributions through the authoritative
// registries plus one real behavior: the speak tool through the browser engine.
//
// Usage: node scripts/loader-runner.mjs <cordis.yml>
// Exit 0 prints DSH_LOADER_RESULT <json>; any load or assertion failure exits
// non-zero with the reason on stderr (used by the invalid-config regression).

import { Context } from '@deepseek-ai/cordis'
import Include from '@deepseek-ai/cordis-plugin-include'
import Loader from '@deepseek-ai/cordis-plugin-loader'
import { CallId } from '@deepseek-ai/dsh-llm'
import { SessionId } from '@deepseek-ai/dsh-session'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const configArgument = process.argv[2]
if (configArgument === undefined) {
  console.error('usage: loader-runner.mjs <cordis.yml>')
  process.exit(2)
}

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
  // The plugin hard-injects `subprocess`; the browser-engine speak path never
  // calls it, so a scripted face suffices for this composition.
  ctx.provide('subprocess', { spawn: () => { throw new Error('subprocess not used by the browser engine') } })
  await ctx.loader.create({
    name: 'cordis:include',
    config: { path: pathToFileURL(configPath).href },
  })
  await ctx.loader.await()

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
  process.stdout.write(`DSH_LOADER_RESULT ${JSON.stringify(summary)}\n`)
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
} finally {
  await ctx.fiber.dispose()
}
