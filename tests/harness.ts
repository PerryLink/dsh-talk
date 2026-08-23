/**
 * Shared test harness for dsh-talk: REAL Cordis `Context`, REAL
 * `SessionStore`/`Session`/`ToolRuntime`/`SessionProjectionRegistry` from the
 * 0.1.0-rc.6 peers, plus a scripted subprocess provider (a subclass of the
 * REAL `SubprocessRuntime`) and a structurally complete fake agent. The
 * speech engines run through the same command/exit path as production, with
 * stdout/stderr and exit codes scripted per test.
 *
 * @module dsh-talk/test/harness
 */

import { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import { writeFile } from 'node:fs/promises'
import SessionStore, { SessionId, type Session } from '@deepseek-ai/dsh-session'
import {
  SubprocessRuntime,
  type SubprocessCollectedOutputs,
  type SubprocessHandle,
  type SubprocessOutcome,
  type SubprocessOutputReader,
  type SubprocessSpawnSpec,
} from '@deepseek-ai/dsh-subprocess'
import ToolRuntime from '@deepseek-ai/dsh-tools'
import SessionProjectionRegistry from '@deepseek-ai/dsh-session-projection'

/** A subprocess provider whose spawns answer from scripted stdout/exit facts. */
export class FakeSubprocessRuntime extends SubprocessRuntime {
  /** Scripted stdout text for the next spawn. */
  nextStdout = ''
  /** Scripted exit code for the next spawn. */
  nextExitCode = 0
  /** Scripted stderr text for the next spawn. */
  nextStderr = ''
  /** When set, a spawn whose argv carries `--write-media <path>` writes these bytes there (successful local synthesis). */
  nextSynthBytes: string | null = null
  /** Every spawn spec recorded. */
  spawns: SubprocessSpawnSpec[] = []

  constructor(ctx: Context) {
    super(ctx)
  }

  resolveExecutable(command: string): Promise<string> {
    return Promise.resolve(`C:\\Windows\\System32\\${command}`)
  }

  spawn(spec: SubprocessSpawnSpec): SubprocessHandle {
    this.spawns.push(spec)
    if (this.nextSynthBytes !== null) {
      const marker = spec.argv.indexOf('--write-media')
      if (marker !== -1 && marker + 1 < spec.argv.length) {
        void writeFile(spec.argv[marker + 1] as string, this.nextSynthBytes, 'binary').catch(() => {})
      }
    }
    const stdout = this.nextStdout
    const stderr = this.nextStderr
    const exitCode = this.nextExitCode
    const readerOf = (text: string): SubprocessOutputReader => ({
      readFrom: fromByte => ({ text: text.slice(fromByte), nextOffset: text.length, lossy: false }),
    })
    const collected: SubprocessCollectedOutputs = {
      stdout: readerOf(stdout),
      stderr: readerOf(stderr),
    }
    const outcome: SubprocessOutcome = { exitCode, signal: null }
    return {
      pid: 7777,
      stdin: undefined,
      stdout: undefined,
      stderr: undefined,
      collected,
      done: Promise.resolve(outcome),
      terminate: () => undefined,
      waitForExit: async () => true,
    }
  }

  spawnTerminal(): never {
    throw new Error('not used by tests')
  }
}

/** Build a structurally complete fake agent over a real session. */
export function makeAgent(session: Session): Agent {
  const fake = {
    id: session.id,
    options: {},
    session,
    inbox: {},
    status: 'idle',
    ctx: new Context(),
    cancel: () => undefined,
    whenIdle: async () => undefined,
    runMaintenance: async (task: (signal: AbortSignal) => Promise<unknown>) => task(new AbortController().signal),
    send: () => undefined,
    followup: () => undefined,
    steer: () => undefined,
    inject: () => undefined,
  }
  return fake as unknown as Agent
}

/** Everything a mounted harness hands back to a test. */
export interface Harness {
  readonly ctx: Context
  readonly session: Session
  readonly agent: Agent
  readonly subprocess: FakeSubprocessRuntime
}

/**
 * Mount real session/tools/projection services, the scripted subprocess, and
 * this plugin; open one turn so agent-scoped flows work.
 *
 * @param config - raw plugin config.
 * @returns the mounted harness.
 */
export async function mountHarness(config: Record<string, unknown> = {}): Promise<Harness> {
  const ctx = new Context()
  await ctx.plugin(SessionStore)
  const session = ctx.sessions.create(SessionId('dsh-talk-harness'))
  session.append('turn/start', { turn: 1 })
  ctx.provide('systemPrompt', { tools: () => () => undefined, section: () => () => undefined } as never)
  await ctx.plugin(ToolRuntime)
  // Direct construction binds the registry's own `session/event` listener to
  // THIS context; `ctx.plugin()` would mount it on a child scope whose
  // listener never sees root-emitted session events (production resolves the
  // service at composition level).
  new SessionProjectionRegistry(ctx)
  // `SubprocessRuntime` is a Cordis Service: construction self-registers.
  new FakeSubprocessRuntime(ctx)

  const plugin = await import('../src/index.ts')
  await ctx.plugin(plugin as unknown as import('@deepseek-ai/cordis').Plugin, config)

  const subprocess = ctx.get('subprocess') as unknown as FakeSubprocessRuntime
  const agent = makeAgent(session)
  return { ctx, session, agent, subprocess }
}

/** Re-exported for specs that script subprocess outcomes directly. */
export { SessionId }
