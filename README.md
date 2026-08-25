<div align="center">

# 🎙️ dsh-talk
[![Gitee](https://img.shields.io/badge/Gitee-mirror-c71d23?logo=gitee)](https://gitee.com/perrylink/dsh-talk)

**Voice-first session loop for DeepSeek Harness: talk to it, hear it answer.**

*Press the mic, speak, and the reply is spoken back — with speak-to-interrupt.*

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![DSH plugin](https://img.shields.io/badge/dsh-plugin-✅-green)](https://github.com/topics/dsh-plugin)
[![Node](https://img.shields.io/badge/node-%5E22.19%20%7C%7C%20%3E%3D24-brightgreen.svg)](#)
[![CI](https://img.shields.io/github/actions/workflow/status/PerryLink/dsh-talk/ci.yml?branch=main&label=CI)](https://github.com/PerryLink/dsh-talk/actions)
[![Version](https://img.shields.io/github/v/tag/PerryLink/dsh-talk?label=version)](https://github.com/PerryLink/dsh-talk/releases)
[![npm version](https://img.shields.io/npm/v/dsh-talk)](https://www.npmjs.com/package/dsh-talk)
[![npm downloads](https://img.shields.io/npm/dm/dsh-talk)](https://www.npmjs.com/package/dsh-talk)

[English](README.md) · [简体中文](README.zh.md) · [Español](README.es.md) · [Português](README.pt.md) · [हिन्दी](README.hi.md)

</div>

---

## Compatibility

| Surface | Status |
|---|---|
| Harness | DeepSeek Harness `0.1.1-rc.2` |
| Node | `^22.19.0 \|\| >=24.0.0` |
| Browser | Web Speech + MediaRecorder (Chrome/Edge best); host transcription/TTS engines for the rest |

## What you get

`dsh-talk` closes the voice loop in both directions:

- **`speak` tool** — the agent speaks its replies aloud. TTS engines: the browser voice, `edge-tts` (network neural voices), or `piper` (local). Audio plays in the browser; the session log records the sanitized utterance.
- **Composer mic button** — press it, speak, and the transcription lands in the input box (or submits directly). STT engines: the browser's Web Speech (interim results included), a FunASR HTTP server, or local `whisper.cpp`.
- **Speak-to-interrupt** — starting to talk stops whatever is playing (client → host over the `talk` Remote namespace).
- **Event announcements** — turn completion, pending approvals (waterfall-safe: never blocks the gate), and errors, with a mute switch and configurable phrases.
- **Settings tab** — engine/language selects and announcement switches, saved as append-only profile-patch operations with backups.

```text
browser                                host
  🎙 press ──▶ interrupt ─────────────────▶ talk/interrupt
  record (MediaRecorder / Web Speech)
  transcribe (browser) or talk/transcribe ─▶ FunASR / whisper.cpp
  setDraft(text) or submit()  ◀── talk:speech projection ── speak tool / announcements
  ▶ play audio (talk/audio or speechSynthesis)
```

## Quick start

```sh
# 1. install the bundle into your profile
dsh plugin --profile web add "github:PerryLink/dsh-talk#main"

# or from npm (published releases)
dsh plugin --profile web add dsh-talk

# 2. restart and verify the row
dsh --profile web --dump-config | grep -A2 'id: talk'
```

Then press the microphone next to the composer and talk; ask the agent to `speak` its reply:

```
> Say "hello" with the speak tool.
```

## Install & uninstall

- **git channel** (latest `main`): `dsh plugin --profile web add "github:PerryLink/dsh-talk#main"` — the `prepare` script builds with production dependencies only.
- **npm channel** (published releases): `dsh plugin --profile web add dsh-talk`.
- **tarball channel**: `pnpm pack` in this repo, then `dsh plugin --profile web add ./dsh-talk-<version>.tgz`.
- **uninstall**: `dsh plugin --profile web remove dsh-talk` (or remove the row from the profile patch).

> If pnpm reports `ERR_PNPM_IGNORED_BUILDS` for this package (esbuild's harmless platform-binary validation), add `allowBuilds: { esbuild: true }` to your `pnpm-workspace.yaml` — the `dsh` CLI prints the exact snippet.

## Configuration

All tunables are Schemastery `Config` fields (changeable from cordis.yml). `cordis.patch.yml` documents each key inline.

| Key | Default | Meaning |
|---|---|---|
| `record.enabled` | `true` | Show the composer mic button |
| `record.hotkey` | *(none)* | Optional toggle hotkey, e.g. `"alt+r"` |
| `record.maxSeconds` | `60` | Recording cap in seconds (1..600) |
| `record.autoSubmit` | `false` | Submit the transcription as a user message (false = fill the draft) |
| `record.vad.enabled` / `silenceMs` / `energyThreshold` | `true` / `1500` / `0.01` | Voice-activity detection: silence auto-ends the recording (degrades when `AudioContext` is absent) |
| `stt.engine` | `auto` | `auto` / `web` / `funasr` / `whisper`; auto prefers a configured local engine, then Web Speech |
| `stt.language` | `auto` | BCP-47 language or `auto` |
| `stt.interim` | `true` | Show interim transcriptions (Web Speech) |
| `stt.silenceFinaliseMs` | `4000` | Stop continuous Web Speech recognition after this many milliseconds without speech (500..15000) |
| `stt.funasr.url` | *(none)* | FunASR inference endpoint; required when the engine is `funasr` |
| `stt.whisper.modelPath` | *(none)* | whisper.cpp model; required when the engine is `whisper` |
| `tts.engine` | `auto` | `auto` / `browser` / `edge-tts` / `piper`; auto prefers piper, then edge-tts, then the browser voice |
| `tts.rate` | `0` | Rate offset in percent (-50..50) for edge-tts/piper |
| `tts.fallbackToBrowser` | `true` | Fall back to the browser voice when a local engine fails |
| `tts.piper.modelPath` | *(none)* | piper voice model; required when the engine is `piper` |
| `announce.enabled` | `true` | Master switch for event announcements |
| `announce.onTurnEnd` / `onApproval` / `onError` | `true` | Which events are spoken |
| `announce.messages.*` | *"Turn complete." etc.* | Spoken phrases |
| `interrupt` | `true` | Talking stops current playback |
| `maxSpeakChars` | `20000` | Cap on the speak tool's text length (1..100000) |
| `maxAudioCacheBytes` | `8388608` | In-memory synthesized-audio cache cap (1 MiB..64 MiB) |

## Tools & surfaces

| Surface | Kind | Notes |
|---|---|---|
| `speak` | tool | Speaks text aloud (browser/edge-tts/piper); per-call engine/voice overrides; canonical JSON outcome |
| mic button | `conversation.input.left` slot | Record → transcribe → fill draft (or submit); speak-to-interrupt on press |
| settings tab | `settings.plugins.tab` (id `talk`) | Engine/language/announcement switches; append-only save |
| `talk:*` | Typert Remote | `status`, `audio`, `transcribe`, `applySettings`, `interrupt` (host namespace) |

## Permissions & data

- **Permissions**: the plugin stores nothing but an in-memory, byte-capped audio cache; microphone permission is browser-mediated. The settings tab only appends patch fragments to the profile with a timestamped backup — never rewrites the file.
- **Data**: audio never enters the model context or the session log. The `dsh-talk/speech` event carries the utterance id, engine, reason, size, and sanitized text only. All display/log surfaces redact credentials, JWTs, bearer headers, and temp paths.
- **Network**: only the engines you configure are contacted. `edge-tts` performs network synthesis, FunASR uses its configured endpoint, and Chrome's `webkitSpeechRecognition` sends microphone audio to Google's servers for transcription; browser `speechSynthesis` playback remains local.

## Security boundaries

- **Model-visible ⟺ logged** — the model sees only the speak tool's canonical value; every utterance is reconstructable from the session log.
- **Approval announcements never block** — the `approval/request` listener always calls `next()`.
- **Sanitized output** — credentials and temp audio paths never reach logs or displays.
- **Fail loud** — invalid engines, out-of-range values, and engines configured without their required model/endpoint fail the mount.

## Known limitations

- **Browser support**: Web Speech and MediaRecorder are feature-detected; without them the mic button disables itself and host engines (FunASR/whisper.cpp) can still transcribe when configured.
- **Local engines are your install**: `edge-tts`, `piper`, and `whisper.cpp` executables and models must be installed separately.
- **Recording format**: the browser records with its native MediaRecorder codec; whisper.cpp may require a WAV-configured recorder or a server-side conversion for other formats.
- **Settings apply on reload**: the settings tab appends to the profile patch; a profile reload (or web-app restart) activates the changes.

## Development

```sh
pnpm install        # node ^22.19 || >=24
pnpm run typecheck  # tsc: src + tests against the local harness checkout
pnpm run typecheck:ci  # tsc against the published 0.1.1-rc.2 types (no paths)
pnpm test           # vitest: 58 tests, 10 suites
pnpm run build      # tsc declarations + tsdown bundles (lib/)
pnpm run verify:self-contained  # dependency specs resolve from the registry
pnpm run verify:artifacts       # built ESM faces + client ModuleLoader handshake
pnpm pack           # the published tarball
```

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `voice`, `speech`, `tts`, `stt`, `speech-to-text`, `text-to-speech`, `microphone`

## Contributors

- [@PerryLink](https://github.com/PerryLink) — creator and maintainer: speak pipeline, speech engines, mic recorder, event announcements, projection unit, and the five-language docs.

## PerryLink DSH Plugin Family

This project is one of the [29 DeepSeek Harness plugins](https://github.com/PerryLink) maintained by [PerryLink](https://github.com/PerryLink). If this one helps you, the others likely will too:

| Plugin | One-liner |
|---|---|
| [dsh-auto-review](https://github.com/PerryLink/dsh-auto-review) | Second-model auto-review on the approval chain, fail-closed by default |
| [dsh-background-agents](https://github.com/PerryLink/dsh-background-agents) | Durable background child agents with a Web UI sidebar, messaging and interrupt |
| [dsh-budget](https://github.com/PerryLink/dsh-budget) | Cost governance for DeepSeek Harness: budgets, carbon, and latency in one panel. |
| [dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind) | Claude Code /rewind-equivalent: snapshots, session forks, one-shot restore |
| [dsh-claude-move](https://github.com/PerryLink/dsh-claude-move) | Migrate Claude Code sessions, memory, skills and CLAUDE.md into DSH |
| [dsh-click](https://github.com/PerryLink/dsh-click) | Cross-platform native desktop control for DeepSeek Harness — Windows first. |
| [dsh-composer-history](https://github.com/PerryLink/dsh-composer-history) | Terminal-style input history for the web composer: arrows, Ctrl+R search |
| [dsh-defend](https://github.com/PerryLink/dsh-defend) | Prompt-injection, jailbreak, and secret-leak defense for DeepSeek Harness. |
| [dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck) | Engineering-discipline guard: requirements grill, test gates, adversary review |
| [dsh-draw](https://github.com/PerryLink/dsh-draw) | Unified static-image generation routing for DeepSeek Harness. |
| [dsh-fast](https://github.com/PerryLink/dsh-fast) | Read-only performance diagnostics for DeepSeek Harness. |
| [dsh-github](https://github.com/PerryLink/dsh-github) | GitHub PR/issues integration for DSH, every write gated by approval |
| [dsh-library](https://github.com/PerryLink/dsh-library) | Local document knowledge base for DeepSeek Harness. |
| [dsh-local-ai](https://github.com/PerryLink/dsh-local-ai) | Local-model (Ollama) integration for DeepSeek Harness. |
| [dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions) | LSP diagnostics, formatting, completion, code actions and rename over language servers |
| [dsh-mask](https://github.com/PerryLink/dsh-mask) | PII masking middleware for DeepSeek Harness — anonymize personal data before it reaches the model, restore it at the display layer. |
| [dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel) | Read-only MCP runtime panel: /mcp command + Settings tab with status, tools and errors |
| [dsh-memento](https://github.com/PerryLink/dsh-memento) | Approval-gated cross-session memory: ctx.memory seam + SQLite + memory tool |
| [dsh-observe](https://github.com/PerryLink/dsh-observe) | OpenTelemetry and Langfuse observability exporter for DeepSeek Harness. |
| [dsh-output-styles](https://github.com/PerryLink/dsh-output-styles) | Claude Code outputStyles-equivalent runtime style switching |
| [dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules) | Claude Code-style declarative allow/deny/ask permission rules with audit |
| [dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide) | Plugin-development knowledge base as an on-demand agent skill |
| [dsh-score](https://github.com/PerryLink/dsh-score) | Multi-dimensional quality scoring for DeepSeek Harness plugins. |
| [dsh-session-pin](https://github.com/PerryLink/dsh-session-pin) | Pin sessions in the Web sidebar with durable ordering |
| [dsh-session-sync](https://github.com/PerryLink/dsh-session-sync) | Cross-device session sync for DeepSeek Harness — a dedicated git mirror of your session store. |
| [dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security) | Security-audit skill pack: secret scan, dependency and supply-chain review |
| **[dsh-talk](https://github.com/PerryLink/dsh-talk)** | Voice-first session loop for DeepSeek Harness: talk to it, hear it answer. |
| [dsh-test-drive](https://github.com/PerryLink/dsh-test-drive) | Isolated install-and-smoke test drives for DeepSeek Harness plugins. |
| [dsh-translate](https://github.com/PerryLink/dsh-translate) | Vendor parameter translation and deterministic JSON repair for DeepSeek Harness. |

## License

[Apache License 2.0](LICENSE) © 2026 dsh-talk contributors
