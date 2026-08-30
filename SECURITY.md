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

- Audio content never enters the model context or the session log — only sanitized metadata (utterance id, engine, reason, size, text, and browser voice/rate/pitch when applicable) is logged, and only on hosts whose session vocabulary can carry the event (see the adaptive gate below).
- Spoken text and every display/log surface pass the sanitizers (credentials, JWTs, bearer headers, control characters, temp paths are redacted or bounded).
- Local engines run through the official `ctx.subprocess` seam with argv arrays (no shell string interpolation) and abort-signal wiring.
- The settings panel writes config only as append-only patch fragments with a timestamped backup; it never rewrites the profile file.
- Microphone permission and recording are entirely browser-mediated; the plugin stores audio in memory only, capped, and never persists it.
- The `dsh-talk/speech` session event is appended through an adaptive gate: hosts whose known-type vocabulary covers the event append it plainly, hosts with the `ignorable` append option append it with the marker, and envelope-less hosts — every released line through `0.1.1-rc.2`, and `0.1.2-alpha.1`, which removed the envelope and fails closed on unknown types — get no append, so speech can never pollute the session log on those lines. Logs written by dsh-talk ≤ 0.2.1 may still carry unmarked events: on hosts `0.1.0-rc.7` and newer such a session fails its next cold load with `SessionFormatUnsupportedError`. Nothing is corrupted: the log is intact, the running session is unaffected, and adding `"ignorable":true` to each `dsh-talk/speech` line restores the session (repair steps in the README's Known limitations).
- Chrome's `webkitSpeechRecognition` sends microphone audio to Google's servers for transcription; Web Speech recognition is not an on-device transcription guarantee. Use a configured host engine when microphone audio must remain under your control.

Vulnerabilities in the harness itself should be reported to the official harness maintainers instead.
