import { useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { formatDay } from '../format';
import { exportFilename, meditationsToJson, meditationsToText, writtenOn } from '../services/exporter';
import {
  deleteMeditation,
  listMeditations,
  updateMeditation,
  type Meditation,
} from '../services/journal';
import { canShare, copyToClipboard, downloadFile, shareText } from '../services/share';
import { browserStorage } from '../services/storage';
import { useApp } from '../state/AppContext';

export function Journal() {
  const { state, t } = useApp();
  const storage = useMemo(browserStorage, []);
  const [items, setItems] = useState(() => listMeditations(storage));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState('');

  const locale = state.uiLang;
  const selected = items.find((item) => item.id === selectedId);
  const refresh = () => setItems(listMeditations(storage));
  const dayOf = (item: Meditation) => formatDay(item.date ?? writtenOn(item), locale);

  const copy = async (text: string) => {
    setNotice((await copyToClipboard(text)) ? t('journal.copied') : t('journal.copyFailed'));
  };
  const share = async (title: string, text: string) => {
    if (!(await shareText(title, text))) setNotice(t('journal.shareFailed'));
  };
  const download = (extension: 'txt' | 'json') => {
    const now = Date.now();
    if (extension === 'txt') {
      downloadFile(exportFilename('txt', now), 'text/plain', meditationsToText(items, locale));
    } else {
      downloadFile(exportFilename('json', now), 'application/json', meditationsToJson(items, now));
    }
  };

  const open = (id: string) => {
    setSelectedId(id);
    setEditing(false);
    setConfirming(false);
    setNotice('');
  };
  const backToList = () => {
    setSelectedId(null);
    setEditing(false);
    setConfirming(false);
    setNotice('');
  };

  if (selected) {
    const asText = meditationsToText([selected], locale);
    return (
      <Layout back>
        <p className="eyebrow">{dayOf(selected)}</p>
        <h1>{selected.reference}</h1>

        {editing ? (
          <>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={10}
              aria-label={t('reflection.writeTitle')}
            />
            <div className="actions">
              <button
                disabled={draft.trim().length === 0}
                onClick={() => {
                  updateMeditation(storage, selected.id, draft);
                  refresh();
                  setEditing(false);
                }}
              >
                {t('journal.save')}
              </button>
              <button className="secondary" onClick={() => setEditing(false)}>
                {t('journal.cancel')}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="entry-text">{selected.text}</p>
            <div className="actions">
              <button
                onClick={() => {
                  setDraft(selected.text);
                  setEditing(true);
                }}
              >
                {t('journal.edit')}
              </button>
              <button className="secondary" onClick={() => void copy(asText)}>
                {t('journal.copy')}
              </button>
              {canShare() && (
                <button className="secondary" onClick={() => void share(selected.reference, asText)}>
                  {t('journal.share')}
                </button>
              )}
            </div>
            <div className="actions">
              {confirming ? (
                <>
                  <button
                    className="danger"
                    onClick={() => {
                      deleteMeditation(storage, selected.id);
                      refresh();
                      backToList();
                    }}
                  >
                    {t('journal.confirmDelete')}
                  </button>
                  <button className="secondary" onClick={() => setConfirming(false)}>
                    {t('journal.cancel')}
                  </button>
                </>
              ) : (
                <button className="secondary" onClick={() => setConfirming(true)}>
                  {t('journal.delete')}
                </button>
              )}
            </div>
          </>
        )}
        {notice && <p className="status" role="status">{notice}</p>}
        <p className="actions">
          <button className="secondary" onClick={backToList}>
            {t('journal.backToList')}
          </button>
        </p>
      </Layout>
    );
  }

  return (
    <Layout back>
      <h1>{t('journal.title')}</h1>
      <p className="muted">{t('journal.local')}</p>

      {items.length === 0 ? (
        <p className="note">{t('journal.empty')}</p>
      ) : (
        <>
          <ul className="entries">
            {items.map((item) => (
              <li key={item.id}>
                <button className="entry" onClick={() => open(item.id)}>
                  <span className="entry-title">{item.reference}</span>
                  <span className="entry-sub">{dayOf(item)}</span>
                  <span className="entry-preview">{item.text}</span>
                </button>
              </li>
            ))}
          </ul>

          <section className="export">
            <h2>{t('journal.exportTitle')}</h2>
            <div className="actions">
              <button className="secondary" onClick={() => void copy(meditationsToText(items, locale))}>
                {t('journal.copyAll')}
              </button>
              {canShare() && (
                <button
                  className="secondary"
                  onClick={() => void share(t('journal.title'), meditationsToText(items, locale))}
                >
                  {t('journal.share')}
                </button>
              )}
              <button className="secondary" onClick={() => download('txt')}>
                {t('journal.downloadText')}
              </button>
              <button className="secondary" onClick={() => download('json')}>
                {t('journal.downloadJson')}
              </button>
            </div>
            {notice && <p className="status" role="status">{notice}</p>}
          </section>
        </>
      )}
    </Layout>
  );
}
