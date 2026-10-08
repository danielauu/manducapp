import { wordCount } from '@manducapp/core';
import { useId, useState } from 'react';
import { Layout } from '../components/Layout';
import { LanguagePicker } from '../components/LanguagePicker';
import { readClipboard } from '../services/share';
import { useApp } from '../state/AppContext';

const MIN_WORDS = 5;
const MAX_REFERENCE_LENGTH = 60;

export function OwnText() {
  const { t, submitOwnText } = useApp();
  const [text, setText] = useState('');
  const [reference, setReference] = useState('');
  const [pasteFailed, setPasteFailed] = useState(false);
  const referenceId = useId();
  const words = wordCount(text);
  const ready = words >= MIN_WORDS;

  const paste = async () => {
    const pasted = await readClipboard();
    setPasteFailed(pasted === undefined);
    if (pasted) setText(pasted);
  };

  return (
    <Layout back>
      <h1>{t('own.title')}</h1>
      <p className="muted">{t('own.hint')}</p>
      <LanguagePicker label="own.language" />

      <div className="field">
        <label htmlFor={referenceId}>{t('own.reference')}</label>
        <input
          id={referenceId}
          type="text"
          maxLength={MAX_REFERENCE_LENGTH}
          value={reference}
          placeholder={t('own.referencePlaceholder')}
          onChange={(event) => setReference(event.target.value)}
        />
      </div>

      <div className="actions">
        <button className="secondary" onClick={() => void paste()}>
          {t('own.paste')}
        </button>
      </div>
      {pasteFailed && (
        <p className="status" role="status">
          {t('own.pasteFailed')}
        </p>
      )}

      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={t('own.placeholder')}
        rows={10}
        aria-label={t('own.title')}
      />
      {text.length > 0 && !ready && <p className="status">{t('own.tooShort')}</p>}

      <div className="actions">
        <button disabled={!ready} onClick={() => submitOwnText(text, reference)}>
          {t('own.continue')}
        </button>
      </div>
    </Layout>
  );
}
