import { wordCount } from '@manducapp/core';
import { useState } from 'react';
import { Layout } from '../components/Layout';
import { LanguagePicker } from '../components/LanguagePicker';
import { useApp } from '../state/AppContext';

const MIN_WORDS = 5;

export function OwnText() {
  const { t, submitOwnText } = useApp();
  const [text, setText] = useState('');
  const words = wordCount(text);
  const ready = words >= MIN_WORDS;

  return (
    <Layout back>
      <h1>{t('own.title')}</h1>
      <p className="muted">{t('own.hint')}</p>
      <LanguagePicker label="own.language" />

      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={t('own.placeholder')}
        rows={10}
        aria-label={t('own.title')}
      />
      {text.length > 0 && !ready && <p className="status">{t('own.tooShort')}</p>}

      <div className="actions">
        <button disabled={!ready} onClick={() => submitOwnText(text)}>
          {t('own.continue')}
        </button>
      </div>
    </Layout>
  );
}
