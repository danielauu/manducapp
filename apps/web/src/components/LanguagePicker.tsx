import { LANGS, isLang } from '@manducapp/core';
import { useId } from 'react';
import { LANG_NAMES, type MessageKey } from '../i18n';
import { useApp } from '../state/AppContext';

export function LanguagePicker({ label = 'lang.label' }: { label?: MessageKey }) {
  const { state, t, setLang } = useApp();
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{t(label)}</label>
      <select
        id={id}
        value={state.lang}
        disabled={state.loading}
        onChange={(event) => {
          if (isLang(event.target.value)) setLang(event.target.value);
        }}
      >
        {LANGS.map((code) => (
          <option key={code} value={code}>
            {LANG_NAMES[code]}
          </option>
        ))}
      </select>
    </div>
  );
}
