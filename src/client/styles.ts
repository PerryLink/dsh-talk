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
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border: 1px solid transparent;
      border-radius: 6px;
      background: transparent;
      cursor: pointer;
      font: inherit;
      color: inherit;
    }
    [data-dsh-talk-mic]:hover {
      background: rgba(127, 127, 127, 0.12);
    }
    [data-dsh-talk-mic][data-recording='true'] {
      border-color: #d33;
      color: #d33;
    }
    [data-dsh-talk-mic][data-disabled='true'] {
      opacity: 0.45;
      cursor: default;
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
