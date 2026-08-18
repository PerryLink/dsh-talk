/**
 * Sealed fake FunASR server tests (community five-layer model, adversarial
 * fixture): a real `node:http` server bound to loopback drives
 * `transcribeFunasr` through 200-JSON, 5xx, and hang→timeout modes. No
 * external network: the server listens on 127.0.0.1 only and is closed at the
 * end of the suite.
 *
 * @module dsh-talk/test/funasr-server.spec
 */

import { createServer, type Server } from 'node:http'
import { once } from 'node:events'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { EngineFailure, transcribeFunasr } from '../src/engine.ts'
import { resolveConfig } from '../src/config.ts'

let server: Server
let baseUrl = ''
let behavior: 'ok' | 'error' | 'hang' = 'ok'

const WAV = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00])

function funasrResolved(): ReturnType<typeof resolveConfig> {
  return resolveConfig({ stt: { engine: 'funasr', funasr: { url: baseUrl } } })
}

beforeAll(async () => {
  server = createServer((request, response) => {
    if (behavior === 'hang') return // never respond: the caller's abort must end it
    if (behavior === 'error') {
      response.writeHead(500, { 'content-type': 'application/json' })
      response.end(JSON.stringify({ error: 'inference failed' }))
      return
    }
    // ok: drain the multipart body, then answer with a transcript.
    request.resume()
    request.on('end', () => {
      response.writeHead(200, { 'content-type': 'application/json' })
      response.end(JSON.stringify({ text: 'hello world' }))
    })
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  if (address === null || typeof address === 'string') throw new Error('fake server did not bind to a port')
  baseUrl = `http://127.0.0.1:${address.port}/v1/audio/transcriptions`
})

afterAll(async () => {
  server.closeAllConnections()
  await new Promise<void>(resolve => server.close(() => resolve()))
})

describe('transcribeFunasr against a sealed fake server', () => {
  it('returns the trimmed transcript on a 200 JSON body', async () => {
    behavior = 'ok'
    const text = await transcribeFunasr(funasrResolved(), WAV, new AbortController().signal)
    expect(text).toBe('hello world')
  })

  it('fails as a non-aborted EngineFailure on a 5xx response', async () => {
    behavior = 'error'
    await expect(transcribeFunasr(funasrResolved(), WAV, new AbortController().signal)).rejects.toMatchObject({
      name: 'EngineFailure',
      aborted: false,
    })
  })

  it('fails as an aborted EngineFailure when the caller signal fires on a hang', async () => {
    behavior = 'hang'
    await expect(transcribeFunasr(funasrResolved(), WAV, AbortSignal.timeout(50))).rejects.toMatchObject({
      name: 'EngineFailure',
      aborted: true,
    })
  })

  it('exposes the failure classification without leaking a raw abort message', async () => {
    behavior = 'hang'
    let failure: EngineFailure | undefined
    try {
      await transcribeFunasr(funasrResolved(), WAV, AbortSignal.timeout(50))
    } catch (error) {
      failure = error as EngineFailure
    }
    expect(failure).toBeInstanceOf(EngineFailure)
    expect(failure?.aborted).toBe(true)
    expect(failure?.message).toContain('funasr request failed')
  })
})
