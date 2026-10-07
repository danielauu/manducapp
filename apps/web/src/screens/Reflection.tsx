import { useMemo, useState, type CSSProperties } from 'react';
import { Layout } from '../components/Layout';
import { addMeditation, newMeditationId } from '../services/journal';
import { browserStorage } from '../services/storage';
import type { GospelView } from '../services/view';
import { useApp } from '../state/AppContext';
import { navigate } from '../useRoute';

type Stage = 'silence' | 'write' | 'saved';

/** Tiempo sugerido de silencio antes de escribir; se puede saltar en cualquier momento. */
const SILENCE_SECONDS = 60;

export function Reflection({ gospel, sentences }: { gospel: GospelView; sentences: readonly string[] }) {
  const { t } = useApp();
  const storage = useMemo(browserStorage, []);
  const [stage, setStage] = useState<Stage>('silence');
  const [text, setText] = useState('');

  const save = () => {
    const now = Date.now();
    addMeditation(
      storage,
      { date: gospel.date, reference: gospel.reference, lang: gospel.lang, text },
      now,
      newMeditationId(now),
    );
    setStage('saved');
  };
  const goHome = () => navigate('home');

  if (stage === 'saved') {
    return (
      <Layout>
        <h1>{t('reflection.saved')}</h1>
        <p className="muted">{t('reflection.savedText')}</p>
        <div className="actions">
          <button onClick={goHome}>{t('reflection.home')}</button>
        </div>
      </Layout>
    );
  }

  if (stage === 'write') {
    return (
      <Layout>
        <p className="eyebrow">{gospel.reference}</p>
        <h1>{t('reflection.writeTitle')}</h1>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={t('reflection.placeholder')}
          rows={9}
          aria-label={t('reflection.writeTitle')}
        />
        <p className="note">{t('reflection.private')}</p>
        <div className="actions">
          <button disabled={text.trim().length === 0} onClick={save}>
            {t('reflection.save')}
          </button>
          <button className="secondary" onClick={goHome}>
            {t('reflection.finishNoSave')}
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <p className="eyebrow">{gospel.reference}</p>
      <h1>{t('reflection.silenceTitle')}</h1>
      <p className="muted">{t('reflection.silenceText')}</p>
      <div className="countdown calm" aria-hidden="true">
        <span style={{ '--turn': `${SILENCE_SECONDS}s` } as CSSProperties} />
      </div>
      <div className="actions">
        <button onClick={() => setStage('write')}>{t('reflection.write')}</button>
        <button className="secondary" onClick={goHome}>
          {t('reflection.skip')}
        </button>
      </div>
      <details className="player-settings">
        <summary>{t('reflection.reread')}</summary>
        <ol className="sentences" lang={gospel.lang}>
          {sentences.map((sentence, index) => (
            <li key={index}>{sentence}</li>
          ))}
        </ol>
      </details>
    </Layout>
  );
}
