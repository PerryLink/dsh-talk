/**
 * Scoped inline styles for the talk client components. Standalone bundles
 * cannot use the in-repo CSS-module pipeline, so every rule lives here and is
 * installed (and removed) through one document-level `<style>` element.
 *
 * @module dsh-talk/client/styles
 */

/** One scoped stylesheet installation; returns its disposer. */
export function installTalkStyles(): () => void {
  const style = document.createElement('style')
  style.dataset['dshTalkStyles'] = '1'
  style.textContent = `
    [data-dsh-talk-mic] {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      padding: 0;
      border: none;
      border-radius: 8px;
      background: transparent;
      cursor: pointer;
      color: var(--dsw-alias-brand-primary, #e0302f);
      transition: background-color 120ms ease, color 120ms ease;
    }
    [data-dsh-talk-mic]:hover {
      background: rgba(224, 48, 47, 0.12);
    }
    [data-dsh-talk-mic][data-disabled='true'] {
      opacity: 0.4;
      cursor: default;
    }
    /* Recording: brighter red, glyph pulses to read as "live". */
    [data-dsh-talk-mic][data-recording='true'] {
      color: #ff4d4d;
    }
    [data-dsh-talk-mic][data-recording='true'] svg {
      animation: dsh-talk-pulse 1.1s ease-in-out infinite;
    }
    /* Transcribing: the ring spinner supplies its own motion — no pulse. */
    [data-dsh-talk-mic][data-transcribing='true'] svg {
      animation: dsh-talk-spin 0.9s linear infinite;
    }
    /* Ready: a transcript is sitting in the draft, unsent. A small amber dot
       — a different accent family from the red mic — flags it needs a
       glance, without implying "recording" (red) or "error". */
    [data-dsh-talk-mic][data-ready='true']::after {
      content: '';
      position: absolute;
      top: 3px;
      right: 3px;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #ffb020;
      box-shadow: 0 0 0 1.5px rgba(0, 0, 0, 0.4);
    }
    @keyframes dsh-talk-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.55; transform: scale(1.12); }
    }
    @keyframes dsh-talk-spin {
      to { transform: rotate(360deg); }
    }
    @media (prefers-reduced-motion: reduce) {
      [data-dsh-talk-mic][data-recording='true'] svg,
      [data-dsh-talk-mic][data-transcribing='true'] svg {
        animation: none;
      }
    }
    [data-dsh-talk-settings] {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 560px;
    }
    [data-dsh-talk-settings] label {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 0.85em;
    }
    [data-dsh-talk-settings] select,
    [data-dsh-talk-settings] input[type='text'] {
      padding: 4px 6px;
      font: inherit;
    }
    [data-dsh-talk-settings] .row {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.9em;
    }
    [data-dsh-talk-settings] .note {
      font-size: 0.8em;
      opacity: 0.75;
    }
  `
  document.head.appendChild(style)
  return () => {
    style.remove()
  }
}
