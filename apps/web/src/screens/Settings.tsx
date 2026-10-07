import { LANGS, isLang } from '@manducapp/core';
import { useId } from 'react';
import { Layout } from '../components/Layout';
import { LanguagePicker } from '../components/LanguagePicker';
import { LANG_NAMES } from '../i18n';
import { useApp } from '../state/AppContext';

export function Settings() {
  const { state, t, setUiLang } = useApp();
  const uiLangId = useId();

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
    </Layout>
  );
}
