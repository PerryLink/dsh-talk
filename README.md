<div align="center">

# 🎙️ dsh-talk
- **1024 store channel**: `npm i -g dsh1024` once, then `dsh1024 plugin --profile web add dsh-talk` (counts toward the [deepseek1024.com](https://deepseek1024.com) install ranking).
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
| `stt.funasr.url` | *(none)* | FunASR inference endpoint; required when the engine is `funasr` |
| `stt.whisper.modelPath` | *(none)* | whisper.cpp model; required when the engine is `whisper` |
| `tts.engine` | `auto` | `auto` / `browser` / `edge-tts` / `piper`; auto prefers piper, then edge-tts, then the browser voice |
| `tts.rate` | `0` | Rate offset in percent (-50..50) for edge-tts/piper |
| `tts.fallbackToBrowser` | `true` | Fall back to the browser voice when a local engine fails |
| `tts.browser.voiceName` | *(none)* | Preferred browser voice name; an unknown name uses the platform default |
| `tts.browser.rate` | `1` | Browser SpeechSynthesis rate (0.1..10) |
| `tts.browser.pitch` | `1` | Browser SpeechSynthesis pitch (0..2) |
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
- **Data**: audio never enters the model context or the session log. The `dsh-talk/speech` event carries the utterance id, engine, reason, size, sanitized text, and browser voice/rate/pitch when applicable. All display/log surfaces redact credentials, JWTs, bearer headers, and temp paths.
- **Network**: only the engines you configure are contacted (edge-tts network synthesis, a FunASR endpoint); the browser voice and Web Speech stay on-device.

## Security boundaries

- **Model-visible ⟺ logged** — the model sees only the speak tool's canonical value; every utterance is reconstructable from the session log.
- **Approval announcements never block** — the `approval/request` listener always calls `next()`.
- **Sanitized output** — credentials and temp audio paths never reach logs or displays.
- **Host compatibility** — the `dsh-talk/speech` session event is appended without the `ignorable` marker, because no released DSH host through `0.1.1-rc.2` lets a plugin set it. Hosts from `0.1.0-rc.7` onward refuse to cold-load a session log that carries an unmarked event type they do not know, so a session that has spoken at least once fails its next cold load with `SessionFormatUnsupportedError`. The log is intact and repairable (see Known limitations). The planned fix carries live playback over a Remote push instead of the session log and writes the log event only on hosts that can mark it ignorable.
- **Fail loud** — invalid engines, out-of-range values, and engines configured without their required model/endpoint fail the mount.

## Known limitations

- **Browser support**: Web Speech and MediaRecorder are feature-detected; without them the mic button disables itself and host engines (FunASR/whisper.cpp) can still transcribe when configured.
- **Local engines are your install**: `edge-tts`, `piper`, and `whisper.cpp` executables and models must be installed separately.
- **Recording format**: the browser records with its native MediaRecorder codec; whisper.cpp may require a WAV-configured recorder or a server-side conversion for other formats.
- **Settings apply on reload**: the settings tab appends to the profile patch; a profile reload (or web-app restart) activates the changes.
- **Session refuses to cold-load after speech**: on hosts `0.1.0-rc.7` and newer, a session's next cold load fails with `SessionFormatUnsupportedError` once its log contains unmarked `dsh-talk/speech` events. Repair: stop the host, back up the session's `.jsonl` log, add `"ignorable":true` as a top-level member of every JSON line whose `"type"` is `"dsh-talk/speech"` (for example, insert `"ignorable":true,` right after the opening `{`), then reopen the session. Nothing else changes and nothing is lost.

## Development

```sh
pnpm install        # node ^22.19 || >=24
pnpm run typecheck  # tsc: src + tests against the local harness checkout
pnpm run typecheck:ci  # tsc against the published 0.1.1-rc.2 types (no paths)
pnpm test           # vitest: 74 tests, 12 suites
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

This project is one of the [33 DeepSeek Harness plugins](https://github.com/PerryLink) maintained by [PerryLink](https://github.com/PerryLink). If this one helps you, the others likely will too:

| Plugin | One-liner |
|---|---|
| **[dsh-dsh-auto-review](https://github.com/PerryLink/dsh-dsh-auto-review)** | Second-model auto-review on the approval chain, fail-closed by default | |
| **[dsh-dsh-background-agents](https://github.com/PerryLink/dsh-dsh-background-agents)** | Durable background child agents with a Web UI sidebar, messaging and interrupt | |
| **[dsh-dsh-budget](https://github.com/PerryLink/dsh-dsh-budget)** | Cost governance for DeepSeek Harness: budgets, carbon, and latency in one panel. | |
| **[dsh-dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-dsh-checkpoint-rewind)** | Claude Code /rewind-equivalent: snapshots, session forks, one-shot restore | |
| **[dsh-dsh-claude-move](https://github.com/PerryLink/dsh-dsh-claude-move)** | Migrate Claude Code sessions, memory, skills and CLAUDE.md into DSH | |
| **[dsh-dsh-click](https://github.com/PerryLink/dsh-dsh-click)** | Cross-platform native desktop control for DeepSeek Harness — Windows first. | |
| **[dsh-dsh-composer-history](https://github.com/PerryLink/dsh-dsh-composer-history)** | Terminal-style input history for the web composer: arrows, Ctrl+R search | |
| **[dsh-dsh-data-quality](https://github.com/PerryLink/dsh-dsh-data-quality)** | Dataset quality checks and citation cross-checks (the optional numeric bridge consumed here) | |
| **[dsh-dsh-defend](https://github.com/PerryLink/dsh-dsh-defend)** | Prompt-injection, jailbreak, and secret-leak defense for DeepSeek Harness. | |
| **[dsh-dsh-doublecheck](https://github.com/PerryLink/dsh-dsh-doublecheck)** | Engineering-discipline guard: requirements grill, test gates, adversary review | |
| **[dsh-dsh-draw](https://github.com/PerryLink/dsh-dsh-draw)** | Unified static-image generation routing for DeepSeek Harness. | |
| **[dsh-dsh-fast](https://github.com/PerryLink/dsh-dsh-fast)** | Read-only performance diagnostics for DeepSeek Harness. | |
| **[dsh-dsh-fund-research](https://github.com/PerryLink/dsh-dsh-fund-research)** | Deterministic research reports for Chinese public mutual funds | |
| **[dsh-dsh-github](https://github.com/PerryLink/dsh-dsh-github)** | GitHub PR/issues integration for DSH, every write gated by approval | |
| **[dsh-dsh-industry-research](https://github.com/PerryLink/dsh-dsh-industry-research)** | Industry research orchestration that seals its deliverables through this plugin's `ctx.researchReport.assemble` | |
| **[dsh-dsh-library](https://github.com/PerryLink/dsh-dsh-library)** | Local document knowledge base for DeepSeek Harness. | |
| **[dsh-dsh-local-ai](https://github.com/PerryLink/dsh-dsh-local-ai)** | Local-model (Ollama) integration for DeepSeek Harness. | |
| **[dsh-dsh-lsp-actions](https://github.com/PerryLink/dsh-dsh-lsp-actions)** | LSP diagnostics, formatting, completion, code actions and rename over language servers | |
| **[dsh-dsh-mask](https://github.com/PerryLink/dsh-dsh-mask)** | PII masking middleware: anonymize at the model boundary, restore at the display layer | |
| **[dsh-dsh-mcp-panel](https://github.com/PerryLink/dsh-dsh-mcp-panel)** | Read-only MCP runtime panel: /mcp command + Settings tab with status, tools and errors | |
| **[dsh-dsh-memento](https://github.com/PerryLink/dsh-dsh-memento)** | Approval-gated cross-session memory: ctx.memory seam + SQLite + memory tool | |
| **[dsh-dsh-observe](https://github.com/PerryLink/dsh-dsh-observe)** | OpenTelemetry and Langfuse observability exporter for DeepSeek Harness. | |
| **[dsh-dsh-output-styles](https://github.com/PerryLink/dsh-dsh-output-styles)** | Claude Code outputStyles-equivalent runtime style switching | |
| **[dsh-dsh-permission-rules](https://github.com/PerryLink/dsh-dsh-permission-rules)** | Claude Code-style declarative allow/deny/ask permission rules with audit | |
| **[dsh-dsh-plugin-guide](https://github.com/PerryLink/dsh-dsh-plugin-guide)** | Plugin-development knowledge base as an on-demand agent skill | |
| **[dsh-dsh-research-report](https://github.com/PerryLink/dsh-dsh-research-report)** | Verifiable research-report engine: content-addressed evidence ledger and sealed versions | |
| **[dsh-dsh-score](https://github.com/PerryLink/dsh-dsh-score)** | Multi-dimensional quality scoring for DeepSeek Harness plugins. | |
| **[dsh-dsh-session-pin](https://github.com/PerryLink/dsh-dsh-session-pin)** | Pin sessions in the Web sidebar with durable ordering | |
| **[dsh-dsh-session-sync](https://github.com/PerryLink/dsh-dsh-session-sync)** | Cross-device session sync for DeepSeek Harness — a dedicated git mirror of your session store. | |
| **[dsh-dsh-skill-pack-security](https://github.com/PerryLink/dsh-dsh-skill-pack-security)** | Security-audit skill pack: secret scan, dependency and supply-chain review | |
| **[dsh-dsh-test-drive](https://github.com/PerryLink/dsh-dsh-test-drive)** | Isolated install-and-smoke test drives for DeepSeek Harness plugins. | |
| **[dsh-dsh-translate](https://github.com/PerryLink/dsh-dsh-translate)** | Vendor parameter translation and deterministic JSON repair for DeepSeek Harness. | |

## License

[Apache License 2.0](LICENSE) © 2026 dsh-talk contributors
