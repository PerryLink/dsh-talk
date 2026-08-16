/**
 * The talk settings tab (id `talk` in `settings.plugins.tab`): STT/TTS
 * engine and language selects, announcement switches, the speak-to-interrupt
 * toggle, and an append-only save through `talk/applySettings`.
 *
 * @module dsh-talk/client/TalkSettingsTab
 */

import { useEffect, useState, type ReactNode } from 'react'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { TalkSettingsInput, TalkSettingsResult, TalkStatus } from '../wire.ts'

/** Registration-side injected face: the settings RPCs (RemoteResult unwrapped). */
export interface TalkSettingsTabInjected {
  /** Read the current settings snapshot. */
  status: () => Promise<TalkStatus>
  /** Append the panel's edits to the profile patch layer. */
  applySettings: (settings: TalkSettingsInput) => Promise<TalkSettingsResult>
}

/** Full component props assembled by the Settings slot renderer. */
export type TalkSettingsTabProps =
  PropsRuntime<'settings.plugins.tab'>
  & PropsLocale<'settings.talk'>
  & InjectFace<TalkSettingsTabInjected>

/**
 * The tab body: reads the snapshot once, edits locally, and saves through the
 * host. The note tells the user to reload the profile for the changes.
 *
 * @param props - injected bindings plus the framework seats.
 * @returns the settings form.
 */
export function TalkSettingsTab(props: TalkSettingsTabProps): ReactNode {
  const { status, applySettings, t } = props
  const [snapshot, setSnapshot] = useState<TalkStatus | undefined>(undefined)
  const [note, setNote] = useState<string | undefined>(undefined)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    void status().then(value => {
      if (!cancelled) setSnapshot(value)
    }).catch(() => {})
    return () => {
      cancelled = true
    }
  }, [status])

  if (snapshot === undefined) return null

  const sttEngine = snapshot.stt.engine
  const ttsEngine = snapshot.tts.engine
  const language = snapshot.stt.language
  const save = (): void => {
    setFailed(false)
    void applySettings({
      sttEngine,
      ttsEngine,
      language,
      announceEnabled: snapshot.announce.enabled,
      onTurnEnd: snapshot.announce.onTurnEnd,
      onApproval: snapshot.announce.onApproval,
      onError: snapshot.announce.onError,
      interrupt: snapshot.interrupt,
    }).then(result => {
      setNote(result.note)
    }).catch(() => {
      setFailed(true)
      setNote(undefined)
    })
  }

  return (
    <div data-dsh-talk-settings>
      <label>
        {t('sttEngine')}
        <select value={sttEngine} onChange={event => setSnapshot({ ...snapshot, stt: { ...snapshot.stt, engine: event.target.value as TalkStatus['stt']['engine'] } })}>
          <option value="auto">auto</option>
          <option value="web">web</option>
          <option value="funasr">funasr</option>
          <option value="whisper">whisper</option>
        </select>
      </label>
      <label>
        {t('ttsEngine')}
        <select value={ttsEngine} onChange={event => setSnapshot({ ...snapshot, tts: { ...snapshot.tts, engine: event.target.value as TalkStatus['tts']['engine'] } })}>
          <option value="auto">auto</option>
          <option value="browser">browser</option>
          <option value="edge-tts">edge-tts</option>
          <option value="piper">piper</option>
        </select>
      </label>
      <label>
        {t('language')}
        <input type="text" value={language} onChange={event => setSnapshot({ ...snapshot, stt: { ...snapshot.stt, language: event.target.value } })} />
      </label>
      <div className="row">
        <input type="checkbox" checked={snapshot.announce.enabled} onChange={event => setSnapshot({ ...snapshot, announce: { ...snapshot.announce, enabled: event.target.checked } })} />
        {t('announceEnabled')}
      </div>
      <div className="row">
        <input type="checkbox" checked={snapshot.announce.onTurnEnd} onChange={event => setSnapshot({ ...snapshot, announce: { ...snapshot.announce, onTurnEnd: event.target.checked } })} />
        {t('announceOnTurnEnd')}
      </div>
      <div className="row">
        <input type="checkbox" checked={snapshot.announce.onApproval} onChange={event => setSnapshot({ ...snapshot, announce: { ...snapshot.announce, onApproval: event.target.checked } })} />
        {t('announceOnApproval')}
      </div>
      <div className="row">
        <input type="checkbox" checked={snapshot.announce.onError} onChange={event => setSnapshot({ ...snapshot, announce: { ...snapshot.announce, onError: event.target.checked } })} />
        {t('announceOnError')}
      </div>
      <div className="row">
        <input type="checkbox" checked={snapshot.interrupt} onChange={event => setSnapshot({ ...snapshot, interrupt: event.target.checked })} />
        {t('interrupt')}
      </div>
      <button type="button" onClick={save}>{t('save')}</button>
      {note !== undefined && <div className="note">{note}</div>}
      {failed && <div className="note">{t('saveFailed')}</div>}
    </div>
  )
}
