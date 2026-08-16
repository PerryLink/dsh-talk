/**
 * Client UI dictionaries for the `settings.talk` namespace. The harness
 * locale registry accepts `en`/`zh` UI codes; the English file is the source
 * of truth and the Chinese file mirrors it key-for-key.
 *
 * @module dsh-talk/client/locales
 */

export type TalkLocaleKey =
  | 'tab'
  | 'mic'
  | 'micRecording'
  | 'micTranscribing'
  | 'micError'
  | 'micHotkeyHint'
  | 'sttEngine'
  | 'ttsEngine'
  | 'language'
  | 'announceEnabled'
  | 'announceOnTurnEnd'
  | 'announceOnApproval'
  | 'announceOnError'
  | 'interrupt'
  | 'save'
  | 'saved'
  | 'saveFailed'
  | 'reloadNote'

export const en: Record<TalkLocaleKey, string> = {
  tab: 'Talk',
  mic: 'Microphone',
  micRecording: 'Recording… click to stop',
  micTranscribing: 'Transcribing…',
  micError: 'Recording failed',
  micHotkeyHint: 'Speak; the text lands in the composer',
  sttEngine: 'Speech-to-text engine',
  ttsEngine: 'Text-to-speech engine',
  language: 'Language (BCP-47 or auto)',
  announceEnabled: 'Event announcements',
  announceOnTurnEnd: 'Announce turn completion',
  announceOnApproval: 'Announce pending approvals',
  announceOnError: 'Announce errors',
  interrupt: 'Talking stops playback',
  save: 'Save settings',
  saved: 'Settings appended to the profile patch; reload to apply.',
  saveFailed: 'Could not save settings',
  reloadNote: 'Reload the profile to apply settings.',
}

export const zh: Record<TalkLocaleKey, string> = {
  tab: '语音',
  mic: '麦克风',
  micRecording: '录音中… 点击停止',
  micTranscribing: '转写中…',
  micError: '录音失败',
  micHotkeyHint: '说话即可，文字会填入输入框',
  sttEngine: '语音转文字引擎',
  ttsEngine: '文字转语音引擎',
  language: '语言（BCP-47 或 auto）',
  announceEnabled: '事件播报',
  announceOnTurnEnd: '回合完成时播报',
  announceOnApproval: '待审批时播报',
  announceOnError: '出错时播报',
  interrupt: '开始说话即停止播放',
  save: '保存设置',
  saved: '设置已追加到 profile patch，重载后生效。',
  saveFailed: '设置保存失败',
  reloadNote: '请重载 profile 以应用设置。',
}
