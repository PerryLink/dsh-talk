/**
 * The hand-written Typert HOST manifest for `dsh-talk`, exported as
 * `./typert` so the harness's typert-loader registers the `talk` status,
 * audio, transcription, settings, and interrupt invocations automatically
 * when this plugin mounts. Same shape as a generator output (validated by
 * the loader): package face, empty model and schemas, and the canonical
 * invocation list shared with the client Remote contribution
 * (`src/wire.ts`).
 *
 * @module dsh-talk/typert
 */

import { TALK_INVOCATIONS } from './wire.ts'

/** Host Typert manifest (validated by `@deepseek-ai/dsh-typert-loader`). */
export const TYPERT = Object.freeze({
  package: 'dsh-talk',
  face: 'host',
  schemas: Object.freeze([]),
  invocations: TALK_INVOCATIONS,
  model: Object.freeze({
    services: Object.freeze([]),
    events: Object.freeze([]),
    objects: Object.freeze([]),
  }),
})
