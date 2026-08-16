/**
 * Pure display/redaction helpers. Everything that reaches a log line, a tool
 * render, a wire payload, or a console message goes through these functions:
 * credentials, tokens, and temp audio paths never leak into presentation.
 * All functions are pure (no I/O, no clock) and are extreme-case tested in
 * `tests/sanitize.spec.ts`.
 *
 * @module dsh-talk/sanitize
 */

/** Credential-shaped prefixes redacted from arbitrary text. */
const SECRET_PATTERNS: readonly RegExp[] = [
  // OpenAI-style keys, GitHub tokens, generic sk-* credentials (prefix preserved).
  /(^|[\s"':=])(sk-[A-Za-z0-9_-]{8,})/gu,
  // The full Authorization bearer header (label preserved).
  /(Authorization\s*:\s*Bearer\s+)\S+/giu,
  // A bare Bearer credential (label preserved); the Authorization header
  // form is handled above.
  /(?<!Authorization\s*:\s*)\b(Bearer)\s+\S+/giu,
  // key=value pairs for credential-shaped keys.
  /\b((?:api[-_]?key|token|secret|password))\s*[:=]\s*[^\s,;]+/giu,
  // JWT payloads (three base64url segments).
  /\b(eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,})\b/gu,
]

/** Replacements applied per pattern; index-aligned with {@link SECRET_PATTERNS}. */
const SECRET_REPLACEMENTS: readonly (string | ((...groups: string[]) => string))[] = [
  (_match: string, prefix: string | undefined, token: string): string =>
    `${prefix ?? ''}${token.startsWith('sk-') ? 'sk-***' : '***'}`,
  '$1***',
  '$1***',
  '$1=***',
  '***.jwt',
]

/** Control characters stripped from display text (kept: tab and newline). */
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/gu

/**
 * Redact credential-shaped material from arbitrary text. Unknown shapes pass
 * through unchanged: the goal is to strip the obvious secret carriers without
 * mangling ordinary prose.
 *
 * @param value - raw text (any input; non-strings collapse to an empty string).
 * @returns redacted text.
 */
export function redactSecrets(value: unknown): string {
  if (typeof value !== 'string') return ''
  let text = value
  for (let index = 0; index < SECRET_PATTERNS.length; index += 1) {
    const pattern = SECRET_PATTERNS[index]!
    text = text.replace(pattern, SECRET_REPLACEMENTS[index] as string)
  }
  return text
}

/**
 * Collapse one arbitrary value into safe single-line display text: strip
 * control characters, cap the length, and redact secrets. Errors lose their
 * stack and keep only the message (stacks embed paths and tokens).
 *
 * @param value - any value (Error instances keep `message` only).
 * @param maxChars - cap; text longer than the cap is cut with an ellipsis.
 * @returns the sanitized text.
 */
export function sanitizeText(value: unknown, maxChars = 4_000): string {
  let raw: unknown = value
  if (raw instanceof Error) raw = raw.message
  const text = redactSecrets(typeof raw === 'string' ? raw : safeString(raw, maxChars))
    .replace(CONTROL_CHARACTERS, '')
    .replace(/\s+/gu, ' ')
    .trim()
  return cap(text, maxChars)
}

/** Stringify a non-string value defensively; failures collapse to `[unprintable]`. */
function safeString(value: unknown, maxChars: number): string {
  try {
    const text = JSON.stringify(value)
    return typeof text === 'string' ? cap(text, maxChars) : '[unprintable]'
  } catch {
    return '[unprintable]'
  }
}

/**
 * Render a filesystem path for display without leaking the full absolute path:
 * the last two segments survive, everything above (including temp dirs) is
 * elided. Absolute and relative paths both end on their basename.
 *
 * @param value - the path (any input; non-strings collapse to `''`).
 * @returns the display form.
 */
export function displayPath(value: unknown): string {
  if (typeof value !== 'string') return ''
  const normalized = value.replaceAll('\\', '/')
  const segments = normalized.split('/').filter(segment => segment.length > 0)
  if (segments.length === 0) return ''
  const tail = segments.slice(-2).join('/')
  return redactSecrets(cap(tail, 400))
}

/** Cap a string, appending an ellipsis only when actually cut. */
function cap(text: string, maxChars: number): string {
  return text.length <= maxChars ? text : `${text.slice(0, maxChars - 1)}…`
}
