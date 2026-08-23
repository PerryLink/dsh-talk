/**
 * The composer mic button's glyphs: a capsule-and-stand microphone (idle and
 * ready), a filled square (recording — the universal stop affordance), and a
 * ring spinner (transcribing). All three ride `currentColor`, so the button's
 * own CSS drives per-state coloring and animation; none of the three needs to
 * resemble any prior icon set.
 *
 * @module dsh-talk/client/MicIcon
 */

/** One glyph's rendered edge in px. */
interface IconProps {
  size: number
}

/** Idle/ready glyph: classic mic capsule over a stand arc. */
export function MicIcon({ size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor" />
      <path d="M6 11a6 6 0 0 0 12 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/** Recording glyph: a filled stop square, the universal "press to end" mark. */
export function MicStopIcon({ size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor" />
    </svg>
  )
}

/** Transcribing glyph: a partial ring, spun by the button's own CSS animation. */
export function MicSpinnerIcon({ size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
      <path d="M12 4a8 8 0 0 1 8 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}
