import { LANGS, isLang } from '@manducapp/core';
import { useEffect, useId, useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { LanguagePicker } from '../components/LanguagePicker';
import { LANG_NAMES } from '../i18n';
import { usePlayerSettings } from '../session/playerSettings';
import { useApp } from '../state/AppContext';
import { SAMPLES } from '../tts/samples';
import type { VoiceOption } from '../tts/voices';
import { createWebSpeechTts } from '../tts/webSpeech';

export function Settings() {
  const { state, t, setUiLang } = useApp();
  const [player, updatePlayer] = usePlayerSettings();
  const tts = useMemo(createWebSpeechTts, []);
  const uiLangId = useId();
  const voiceId = useId();
  const [voices, setVoices] = useState<VoiceOption[] | null>(null);
  const [testing, setTesting] = useState(false);

  // Las voces dependen del dispositivo y del idioma de lectura; se vuelven a pedir al cambiarlo.
  useEffect(() => {
    let active = true;
    setVoices(null);
    void tts.voices(state.lang).then((list) => {
      if (active) setVoices(list);
    });
    return () => {
      active = false;
      tts.cancel();
    };
  }, [tts, state.lang]);

  const chosen = player.voices[state.lang] ?? '';
  const selected = voices?.some((voice) => voice.name === chosen) ? chosen : '';

  const chooseVoice = (name: string) => {
    const next = { ...player.voices };
    if (name) next[state.lang] = name;
    else delete next[state.lang];
    updatePlayer({ voices: next });
  };

  const test = async (voiceName: string) => {
    setTesting(true);
    await tts.speak(SAMPLES[state.lang].short, {
      lang: state.lang,
      rate: player.rate,
      voiceName: voiceName || undefined,
    });
    setTesting(false);
  };

  return (
    <Layout back>
      <h1>{t('settings.title')}</h1>

      <div className="field">
        <label htmlFor={uiLangId}>{t('settings.uiLanguage')}</label>
        <select
          id={uiLangId}
          value={state.uiLang}
          onChange={(event) => {
            if (isLang(event.target.value)) setUiLang(event.target.value);
          }}
        >
          {LANGS.map((code) => (
            <option key={code} value={code}>
              {LANG_NAMES[code]}
            </option>
          ))}
        </select>
      </div>

      <LanguagePicker />

      {tts.available && (
        <section className="voice-settings" aria-label={t('settings.voice')}>
          <h2>{t('settings.voice')}</h2>
          {voices === null ? (
            <p className="status">{t('settings.voiceLoading')}</p>
          ) : voices.length === 0 ? (
            <p className="note">{t('settings.noVoices')}</p>
          ) : (
            <>
              <div className="field">
                <label htmlFor={voiceId}>{LANG_NAMES[state.lang]}</label>
                <select id={voiceId} value={selected} onChange={(event) => chooseVoice(event.target.value)}>
                  <option value="">{t('settings.voiceDefault')}</option>
                  {voices.map((voice) => (
                    <option key={`${voice.name}-${voice.lang}`} value={voice.name}>
                      {voice.name} [{voice.lang}]{voice.local ? '' : ` · ${t('settings.voiceNetwork')}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="actions">
                <button className="secondary" disabled={testing} onClick={() => void test(selected)}>
                  {t('settings.voiceTest')}
                </button>
              </div>
            </>
          )}
          <p className="note">{t('settings.voiceHint')}</p>
        </section>
      )}
    </Layout>
  );
}
