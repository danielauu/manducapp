import { useEffect } from 'react';
import { Layout } from '../components/Layout';
import { estimateMinutes } from '../services/view';
import { useApp } from '../state/AppContext';
import { navigate } from '../useRoute';

export function Preview() {
  const { state, t } = useApp();
  const gospel = state.gospel;

  // Si se recarga la página directamente en esta ruta no hay texto elegido: se vuelve al inicio.
  useEffect(() => {
    if (!gospel) navigate('home');
  }, [gospel]);
  if (!gospel) return null;

  return (
    <Layout back>
      <p className="eyebrow">{t('preview.title')}</p>
      <h1>{gospel.reference}</h1>
      {gospel.title && <p className="muted">{gospel.title}</p>}
      <p className="meta">
        {t('preview.sentences', { count: gospel.sentences.length })} ·{' '}
        {t('preview.minutes', { minutes: estimateMinutes(gospel.sentences) })}
      </p>

      <ol className="sentences" lang={gospel.lang}>
        {gospel.sentences.map((sentence, index) => (
          <li key={index}>{sentence}</li>
        ))}
      </ol>

      {gospel.credit && <p className="credit">{t('preview.credit', { credit: gospel.credit })}</p>}
      <p className="note">{t('preview.soon')}</p>
    </Layout>
  );
}
