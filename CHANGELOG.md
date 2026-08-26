# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- Speak-to-interrupt: starting to talk stops host synthesis (`talk/interrupt` over the client→host channel).
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
