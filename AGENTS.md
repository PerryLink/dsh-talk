# AGENTS.md

Standalone DeepSeek Harness plugin repository (`dsh-talk`). Development follows the dsh-plugin-guide skill and the official plugin contract; this file records repo-local decisions.

## Layout

- `src/index.ts` — function-plugin contract (`name`/`inject`/`Config`/`apply`; NO default export). Injects `tools` + `subprocess`. Mounts the talk service, the `speak` tool, the `talk:speech` projection unit, and the three announcement listeners (turn-end via `agent/status` running→idle tracking; `agent/error`; `approval/request` waterfall that ALWAYS calls `next()` and never blocks the gate on speech).
- `src/config.ts` — Schemastery schema + explicit `resolveConfig`. Current-API notes: Schemastery 3.18 has no `.nullable()`/`.optional()`; absent object keys pass through `undefined`, and a NULL `.default()` never fills (the resolver returns the original data when the fallback is nullable) — so leaf defaults only, nested objects resolve through `resolveConfig`'s `?? {}` chain, and optional strings are plain `z.string()` (type says string, runtime may omit). Cross-field engine checks (`funasr` needs a URL, `piper`/`whisper` need a model) throw in `resolveConfig`.
- `src/service.ts` — `TalkService` (TypertRemoteService, namespace `talk`): speak pipeline (resolve engine → subprocess synthesis or browser delegation → in-memory audio cache → `dsh-talk/speech` event), `status`/`audio`/`transcribe`/`interrupt`/`applySettings` Remote methods. The profile patch layer path is read STRUCTURALLY (`ctx.baseUrl`) because the loader package is not published.
- `src/tool.ts` — the `speak` tool through `defineTool` (strict schema typing: `required: true as const`, `additionalProperties: false`, render/execute inferred — never annotated with broad `JsonValue`).
- `src/engine.ts` — pure command builders (edge-tts/piper/whisper.cpp) + `runCommand`/`synthesize`/`transcribe*` over `ctx.subprocess` and one FunASR HTTP endpoint; temp files per attempt, removed before returning.
- `src/speech.ts` / `src/vocabulary.ts` / `src/projection.ts` — the `dsh-talk/speech` session-event merge, the shared payload types, and the `talk:speech` projection unit (schema = value ∪ null, so the registry's `ZodType<TalkSpeechProjection | null>` matches exactly).
- `src/wire.ts` — the `talk` Remote wire vocabulary with zod v4 codecs + the shared invocation descriptors (host `./typert` manifest and client Remote contribution consume the SAME list).
- `src/settings-patch.ts` — append-only profile-patch write-back with timestamped backups (settings tab saves).
- `src/sanitize.ts` — display redaction: sk-* keys, the Authorization bearer header (label preserved), bare Bearer tokens, key=value credentials, JWTs; temp-path and control-character handling. Pattern ORDER is load-bearing: header form before bare form, key-list excludes `authorization`.
- `src/client/` — browser half: `$mount` the Remote contribution, register the mic button in `conversation.input.left` (id `talk-mic`) and the settings tab (`settings.plugins.tab`, id `talk`); pure presenter (`present.ts`), inline scoped stylesheet (standalone bundles cannot use the in-repo CSS-module pipeline), en/zh dictionaries.
- `tests/` — vitest; real `Context` + `Session`/`ToolRuntime`/`SessionProjectionRegistry` from the `0.1.1-rc.2` peers; the subprocess provider is scripted (a subclass of the REAL `SubprocessRuntime`); browser-only surfaces (MediaRecorder/Web Speech) are feature-detected and covered through the pure presenter/state machine.

## Hard rules applied here

- **Waterfall discipline.** The `approval/request` announcement listener always calls `next()` and never blocks the gate; the announcement is fire-and-forget speech.
- **Model-visible ⟺ logged.** The model sees only the `speak` tool's canonical value and render text; every utterance lands in the session log as `dsh-talk/speech` (two-argument `Session.append` — rc.2's optional envelope applies to surface events only). Audio bytes stay in the in-memory cache and cross only the `talk/audio` endpoint.
- **Sanitized everything.** All display/log surfaces pass `sanitizeText`/`redactSecrets`/`displayPath`; credentials, JWTs, and temp audio paths never leak into presentation.
- **Fail loud.** `resolveConfig` re-validates bounds and cross-field engine requirements; the loader's Schemastery pass validates the schema itself. (Raw `ctx.plugin` mounts in tests swallow async apply rejections — the two documented fail-loud layers are the schema and `resolveConfig`.)
- **Effect-owning lifecycles.** Every registration (service, tool, projection, listeners) rides the plugin fiber; client registrations ride the client plugin fiber and `$mount` owns the Remote namespace.
- **No hardcoded tunables.** Every knob is a validated `Config` field documented in `cordis.patch.yml` and the five READMEs.

## Build

`typescript` + `tsdown` are regular `dependencies` (the git channel's `prepare` builds with production dependencies alone). `scripts/prepare.mjs` is the single build entry (tsc declarations → `lib/types`, tsdown bundles → `lib/index.js` + `lib/typert.host.js` + `lib/client.js`). The client bundle follows the shell's ModuleLoader handshake (`window.__ModuleLoader__.load({ id: 'dsh-talk', factory })`) with platform modules external; zod is inlined into both halves.

## Checks

`pnpm run typecheck && pnpm run typecheck:ci && pnpm test && pnpm run build && pnpm run verify:self-contained && pnpm run verify:artifacts && pnpm pack`. The plain `typecheck` resolves the local checkout through tsconfig `paths`; `typecheck:ci` resolves the npm-published `0.1.1-rc.2` faces — keep both green.

## Docs

- Five-language READMEs (`README.md` is the source of truth) — keep all five in sync.
- GitHub topics: `dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `voice`, `speech`, `tts`, `stt`, `speech-to-text`, `text-to-speech`, `microphone` (mirror `package.json` keywords).
- License is Apache-2.0. `THIRD_PARTY_NOTICES.md` documents the build-time dependencies; no third-party source is bundled.
