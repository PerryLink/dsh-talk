# Security policy

## Reporting a vulnerability

Please **do not** open a public issue for security vulnerabilities.

Report privately through GitHub's private vulnerability reporting:

**https://github.com/PerryLink/dsh-talk/security/advisories/new**

That flow keeps the report confidential while we triage, and it is the channel we watch first.

## Before you report

- **Redact sensitive data** from any logs or session excerpts you attach: tokens, API keys, secrets, Authorization/request headers, personal paths, and account identifiers. Trimmed stack traces are usually enough.
- Include, when possible: the plugin version, the harness (`dsh`) version, Node and OS versions, and the minimal steps to reproduce.

## What to expect

- **Acknowledgment**: within 5 business days.
- **Triage**: within 10 business days we confirm the issue and assess severity, or ask for more details.
- **Fix**: security fixes are prepared in a private fork, released as a patch version, and announced in the release notes.

## Disclosure and credit

- We follow coordinated disclosure: a public advisory (and CVE request where appropriate) is published once a fix ships.
- Reporters are credited in the advisory unless they ask to remain anonymous. There is no bug bounty program at this time.

## Scope

This plugin gives the harness a voice loop: microphone recording with browser/local speech-to-text, text-to-speech through the browser voice or local subprocess engines (edge-tts/piper), and event announcements. Its own guarantees:

- Audio content never enters the model context or the session log — only sanitized metadata (utterance id, engine, reason, size, text) is logged.
- Spoken text and every display/log surface pass the sanitizers (credentials, JWTs, bearer headers, control characters, temp paths are redacted or bounded).
- Local engines run through the official `ctx.subprocess` seam with argv arrays (no shell string interpolation) and abort-signal wiring.
- The settings panel writes config only as append-only patch fragments with a timestamped backup; it never rewrites the profile file.
- Microphone permission and recording are entirely browser-mediated; the plugin stores audio in memory only, capped, and never persists it.
- The `dsh-talk/speech` session event is appended without the `ignorable` marker, because no released DSH host through `0.1.1-rc.2` lets a plugin set it. Hosts from `0.1.0-rc.7` onward refuse to cold-load a session log that carries an unmarked event type they do not know, so a session that has spoken at least once fails its next cold load with `SessionFormatUnsupportedError`. Nothing is corrupted: the log is intact, the running session is unaffected, and adding `"ignorable":true` to each `dsh-talk/speech` line restores the session (repair steps in the README's Known limitations). The planned fix carries live playback over a Remote push instead of the session log and writes the log event only on hosts that can mark it ignorable.

Vulnerabilities in the harness itself should be reported to the official harness maintainers instead.
