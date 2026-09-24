# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.14] - 2026-09-24
### Changed

- Host pins move to `0.1.7-rc.1`; re-verified against that host line. Every `@deepseek-ai/dsh-*` dev/test dependency now pins `0.1.7-rc.1`, the `pnpm-lock.yaml` graph is regenerated, `dshWorkshop.compatibility.dshVersions` appends `0.1.7-rc.1`, the monthly Compat workflow and the CI probe install the `0.1.7-rc.1` host, and the compatibility baseline in every README records `dsh-v0.1.7-rc.1`. The declared host ranges (`engines.dsh` and the `peerDependencies` union) are deliberately **unchanged** — they already admit `0.1.7-rc.1`, and a range is what the manifest accepts, not what has been tested.

## [0.3.13] - 2026-09-23

### Changed

- Move the `@deepseek-ai/dsh-*` dev/test pins to the published `0.1.7-alpha.2` line and record `0.1.7-alpha.2` in `dshWorkshop.compatibility.dshVersions`; the monthly Compat workflow now installs the `0.1.7-alpha.2` host (`dsh-base` + `dsh-headless`) instead of `0.1.6-alpha.2`.
- Append the fourth host clause `|| >=0.1.7-0 <0.2.0` to `engines.dsh` and to all ten `@deepseek-ai/dsh-*` peer ranges. Under semver's prerelease rule a range whose only prerelease comparators sit on earlier tuples cannot admit a later alpha, so the three-clause band excluded the very host line this release targets. No previously supported host line is dropped.
- Raise the `@deepseek-ai/cordis` dev/test pin to `^4.0.4`, `@deepseek-ai/schemastery` to `^3.18.4`, and `@deepseek-ai/cordis-plugin-include` to `^1.0.9`.
- Correct the five README Harness rows, which still named `0.1.5-rc.2` as this package's npm dev/test line while the pins had already moved, and the `Development` block's `typecheck:ci` note, which still claimed the ruler measures the published `0.1.5-rc.2` types. `AGENTS.md` is corrected the same way: its `tests/` layout entry and its `Checks` ruler note had named `0.1.2-rc.1` as the line the package ships against.

## [0.3.12] - 2026-09-19

### Added

- `pnpm run check:lockfile` (`scripts/check-lockfile-drift.mjs`) fails fast when `package.json` and `pnpm-lock.yaml` disagree; the probe is read-only and the documented checks chain runs it alongside the other gates.

### Changed

- The release workflow now publishes through **npm trusted publishing** (OIDC) instead of the long-lived `NPM_TOKEN` secret: `setup-node` no longer sets `registry-url` (its empty `_authToken` line made the registry answer 404 on PUT), npm is upgraded to >= 11.5.1 before publishing, and the "NPM_TOKEN is not set -> skip" guard is gone so a missing publisher cannot turn a release into a silent no-op.
## [0.3.11] - 2026-09-18

### Added

- `talk/latest(sessionId)`: the newest utterance of ONE session plus that session's appended/skipped counters and whether the utterance reached the session log. The host keys its bounded record table by session id, so a multi-session surface never reads another session's utterance, and an empty id is refused instead of resolving to some other session. The projection shape is unchanged, so the projection state version stays at 1.

### Changed

- Carry both Typert strict-codec faces on the wire descriptors: the published `schema` field (0.1.5-rc.2 line) and the `create` factory the 0.1.6-alpha.1 checkout materializes lazily on first use. Both typecheck rulers stay green.
- Implement the new `SubprocessRuntime.terminalEnvironment` member and `SubprocessHandle.control` field in the scripted test provider (0.1.6-alpha.1 extended the subprocess seam).
- Append the third peer clause `|| >=0.1.6-0 <0.2.0` to the ten `@deepseek-ai/dsh-*` peer ranges (the `schemastery` peer and the seven optional peers are untouched) and declare the same range in `engines.dsh`; `dsh.manifestVersion` is now `1`. These are declarations only, read back rather than enforced by a reader, and no previously supported host line is dropped.
- Re-anchor the monthly Compat workflow to `0.1.6-alpha.2` (pin, trigger, and `minimumReleaseAge: 0`), so the job installs the line this release is built against instead of the previous one.

### Fixed

- Speech events were never written to the session log, on any host line. The gate looked for an `ignorable` append option by stringifying `Function.prototype.toString` and probing the option name inside the resulting source text; that probe could not match, so every utterance was skipped, the call returned nothing, and no surface could tell "logged" from "dropped". The gate is a plain yes/no append again and the call reports which one happened, while the `speak` tool results remain the reconstructable audit trail on hosts whose vocabulary does not carry the event.
- `applySettings` validated only the submitted settings, not the row they merge into, so a combination that passes the wire check but cannot load (for example `ttsEngine: piper` without `tts.piper.modelPath`) was appended to `cordis.patch.yml` and broke the next profile load. The merged row is now resolved before the patch layer is touched: a refusal leaves the file byte-identical and creates no backup.
- The plugin registered its speak tool, projection unit, and announcement listeners after `await ctx.plugin(...)`. Unmounting or reloading while that mount resolved threw `INACTIVE_EFFECT` and left a half-mounted plugin behind; the apply path now stops instead of registering once the fiber is disposed.
- The browser half called `useProjection` unconditionally. On host lines whose input-zone kit does not supply the seat the call threw during render and took the mic button down with it. A missing seat now means no playback — a behaviour change for those lines — while recording, transcription, and sending keep working.
- The test harness added `dsh-talk/speech` to the host's known-type set, so two integration specs exercised a branch that can never run in production. The shortcut is gone, the specs pin the degradation and the per-session record instead, and they were reverse-verified against the previous gate (they fail there and pass here).

## [0.3.10] - 2026-09-12

### Changed

- Rename the four translated READMEs to `README-<lang>.md`. npm selects the package-page readme as the first markdown file matching its `{README,README.*}` glob (`@npmcli/package-json`, publish path), and that glob order puts `README.<lang>.md` ahead of `README.md` — so npm was serving the Simplified-Chinese file for this package too (measured on 15/15 sampled packages of the family). The new names sit outside the glob, so the English source is served again. No content changed apart from the language-switcher link each translation holds to its siblings, and the repo readme gate still passes. Takes effect with the next release; an already-published version cannot gain a corrected readme retroactively.
- Pin the `@deepseek-ai/dsh-*` dev/test dependencies to the published `0.1.5-rc.2` line and record `0.1.5-rc.2` in `dshWorkshop.compatibility.dshVersions`; the monthly Compat workflow now runs against `0.1.5-rc.2`. The peer range `>=0.1.2-rc.1 <0.2.0 || >=0.1.5-alpha.1 <0.2.0` is unchanged, so no supported host line is dropped.

### Fixed

- The release workflow claimed provenance but never passed the flag: it runs `npm publish --access public`, and npm only attests a token-based publish when `--provenance` is given explicitly. The publish step is now `npm publish --access public --provenance`, matching the rest of the family. Takes effect from the next release; an already-published version cannot gain attestations retroactively.
## [0.3.9] - 2026-09-10

### Changed

- Pin the `@deepseek-ai/dsh-*` dev/test dependencies to the published `0.1.5-rc.1` line and record `0.1.5-rc.1` in `dshWorkshop.compatibility.dshVersions`; the monthly Compat workflow now runs against `0.1.5-rc.1`. The peer range `>=0.1.2-rc.1 <0.2.0 || >=0.1.5-alpha.1 <0.2.0` is unchanged, so no supported host line is dropped.

### Docs

- Refresh the five-language README compatibility baseline to `dsh-v0.1.5-rc.1` (verified 2026-09-10).

## [0.3.8] - 2026-09-09

### Changed

- Align the `@deepseek-ai/dsh-*` peer ranges to `>=0.1.2-rc.1 <0.2.0 || >=0.1.5-alpha.1 <0.2.0` and pin the dev/test dependencies to the published `0.1.5-alpha.1` line: adaptation to DeepSeek Harness `dsh-v0.1.5-alpha.1` (session format V3, `ctx.agent` removal, `Inbox` type-only interface); runtime behavior is unchanged for every supported host line.
- Record `0.1.5-alpha.1` in `dshWorkshop.compatibility.dshVersions`.

### Docs

- Refresh the five-language README compatibility baseline to `dsh-v0.1.5-alpha.1` (verified 2026-09-09).

## [0.3.7] - 2026-09-08

### Docs

- Repair GBK mojibake in a historical CHANGELOG entry: the less-or-equal sign (U+2264) was corrupted to the U+922E U+003F marker pair; restored to the clean pre-corruption text; no behavior change.


## [0.3.6] - 2026-09-07

### Docs

- Fix the DSH plugin badge URL: shields.io rejects the four-segment static badge form with "404 badge not found"; the label now uses the documented double-dash form (`dsh--plugin`), rendering identically; no behavior change.


## [0.3.5] - 2026-09-07

### Fixed

- Align the `@deepseek-ai/dsh-*` peer ranges to `>=0.1.2-rc.1 <0.2.0`: the older `>=0.1.0-rc.8 <0.2.0` band resolved to only the `0.1.0-rc.8` prerelease under registry-driven resolution and broke fresh tarball installs; no behavior change.

### Docs

- Refresh the five-language README support-version wording: the verified GitHub tag `dsh-v0.1.3-alpha.1` now leads the compatibility claim, while npm `0.1.2-rc.1` stays the published dependency-pin line (peers `>=0.1.2-rc.1 <0.2.0`); no behavior change.


## [0.3.4] - 2026-09-04

### Changed

- Align the devDependency pins to the published dsh `0.1.2-rc.1` line (16 `@deepseek-ai/dsh-*` packages), the `dshWorkshop` compatibility list, and the compat workflow's CLI/base/headless installs; the five-language README harness rows record the rc.1 facts. No behavior change: the adaptive `dsh-talk/speech` gate behaves identically on `0.1.2-rc.1` (`Session.append` still cannot stamp the `ignorable` marker).

## [0.3.3] - 2026-09-02

### Docs

- Sync the five-language READMEs to the 0.1.2-alpha.5 facts; no behavior change.

## [0.3.2] - 2026-09-02

### Changed

- Align the devDependency pins to the published dsh 0.1.2-alpha.5 line and re-verify the adaptation claims; no behavior change.

## [0.3.1] - 2026-09-01

### Changed

- Align devDeps pins to the published dsh 0.1.2-alpha.2 line (0.1.1-rc.2 -> 0.1.2-alpha.2); no behavior change to envelope/gating semantics.
- Align devDeps pins to the published dsh 0.1.2-alpha.3 line (0.1.2-alpha.2 -> 0.1.2-alpha.3), widen the `dsh-client-ui-conversation`/`dsh-client-ui-slots` peers to `>=0.1.0-rc.8 <0.2.0`, and align `cordis`/`schemastery` to `^4.0.2`/`^3.18.2`. The speech-log gate behavior is unchanged on `0.1.2-alpha.3` (`Session.append` still cannot stamp the `ignorable` marker); the five-language READMEs record the alpha.3 fact.

## [0.3.0] - 2026-08-30

### Changed

- Gate the `dsh-talk/speech` session-log append adaptively: hosts whose known-type vocabulary covers the event append plainly, hosts with the `ignorable` append option append it with the marker, and envelope-less hosts (`0.1.1-rc.2`, `0.1.2-alpha.1`) get no append, so speech can never pollute the session log. On those hosts the client playback history stays empty and the speak tool results remain the reconstructable audit trail.
- Migrate the browser half off the removed `dsh-client-runtime`: the client context is the plain cordis `Context`, the `remote` service type comes from the published `dsh-api-remotes` assembly, and the slot registry is read through a local structural contract. The `dsh.client.inject` list and the peer/devDependencies no longer reference `dsh-client-runtime`.

### Fixed

- Prefer the session slot's standard `inputActions` for composer writes, with scoped and legacy fallbacks for older hosts.
- Resolve automatic Web Speech language from the browser locale and surface the recognizer's actual error.
- Rebuild Web Speech transcripts from the current results collection so revised results do not duplicate text.
- Apply browser voice, rate, and pitch settings end to end while keeping local-engine speech events free of browser delivery fields.
- Keep Web Speech dictation active across pauses and auto-finalise it after the configured silence interval.

### Removed

- The `SessionFormatUnsupportedError` cold-load risk for newly written logs: unmarked `dsh-talk/speech` events are never appended anymore (legacy logs written by ≤ 0.2.1 still follow the documented repair steps).

## [0.2.1] - 2026-08-27

### Fixed

- Declare the web-client inject packages (`@deepseek-ai/dsh-client-connection`,
  `@deepseek-ai/dsh-client-locale`, `@deepseek-ai/dsh-client-runtime`,
  `@deepseek-ai/dsh-client-ui-settings`) as optional peerDependencies so the
  bundle composition is explicit and standalone installs stay clean.

## [0.2.0] - 2026-08-26

### Added

- VAD endpoint detection with silent auto-submit.

## [0.1.3] - 2026-08-23

### Changed

- Updated the vitest test/suite counts from 45/7 to 58/10 across all five READMEs (English is the source of truth).
- Removed the duplicate `[0.1.0]` changelog stub left over from the 0.1.0 re-release.

## [0.1.2] - 2026-08-22

### Changed

- Upgraded every `@deepseek-ai/dsh-*` devDependency to `0.1.1-rc.2`; the peer range stays `>=0.1.0-rc.8 <0.2.0`.
- Moved the `talk:speech` projection registration onto the rc.2 `register` contract: `stateSchema` plus `wire.viewSchema`/`wire.view`, and merge `SessionProjectionStateMap` alongside `SessionProjectionMap`.

## [0.1.1] - 2026-08-21

### Changed

- Upgraded every `@deepseek-ai/dsh-*` peer/devDependency to `0.1.0-rc.8`; the peer range is now `>=0.1.0-rc.8 <0.2.0`. No source changes were required: the two-argument `Session.append` form, `defineTool`, the `talk:speech` projection registration, and the `conversation.input.left` / `settings.plugins.tab` client slots are unchanged in rc.8.

## [0.1.0] - 2026-08-16

- Initial release: voice-first session loop with a composer microphone button, browser/local speech-to-text, the speak tool for text-to-speech replies, event announcements, and speak-to-interrupt.

### Added

- `speak` tool: the agent speaks replies aloud through browser/edge-tts/piper TTS; audio plays in the browser, the session log records the sanitized utterance.
- Composer microphone button (`conversation.input.left`): MediaRecorder capture with Web Speech transcription (interim results) or host transcription through FunASR/whisper.cpp; transcriptions fill the draft or submit directly (`record.autoSubmit`).
- Speak-to-interrupt: starting to talk stops host synthesis (`talk/interrupt` over the client鈫抙ost channel).
- Event announcements: turn completion, pending approvals (waterfall listener that always calls `next()`), and errors, with a mute switch and configurable phrases.
- `talk:speech` session projection: last-wins fold of spoken utterances the client plays back (browser voice or cached `talk/audio`).
- Settings tab (`settings.plugins.tab`, id `talk`): engine/language selects, announcement switches, and append-only profile-patch write-back with backups.
- Typert Remote namespace `talk` (status/audio/transcribe/applySettings/interrupt) with strict zod v4 wire schemas.

### Changed

- Configuration migrated to the current Schemastery API (no `.nullable()`/`.optional()`): leaf defaults only, absent nested objects resolved by `resolveConfig`.
- Session audit appends use the two-argument `Session.append` form for `0.1.0-rc.6` compatibility.

### Fixed

- Sanitizer ordering: the Authorization bearer header keeps its label; sk-* tokens keep their prefix.
- Client bundle follows the shell's ModuleLoader handshake; zod is inlined into both halves.
