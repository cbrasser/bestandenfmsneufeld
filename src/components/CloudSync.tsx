import { useState, useSyncExternalStore } from 'react';
import { CloudOff, Copy, Check, KeyRound, LogIn, Loader2, AlertTriangle, X } from 'lucide-react';
import { useI18n } from '../i18n/context';
import { formatCode, normalizeCode } from '../sync/code';
import { syncEngine } from '../sync/cloud';
import type { SyncEngine, SyncStatus } from '../sync/engine';

interface CloudSyncProps {
  /** Wird aufgerufen, nachdem per Code geladene Daten übernommen wurden. */
  onConnected: () => void;
}

export const CloudSync = ({ onConnected }: CloudSyncProps) =>
  syncEngine ? <CloudSyncPanel engine={syncEngine} onConnected={onConnected} /> : null;

const CloudSyncPanel = ({ engine, onConnected }: CloudSyncProps & { engine: SyncEngine }) => {
  const { t } = useI18n();
  const { code, status } = useSyncExternalStore(engine.subscribe, engine.getSnapshot);

  // Modal-Zustände
  const [showCreated, setShowCreated] = useState(false);
  const [showEnter, setShowEnter] = useState(false);
  const [enteredCode, setEnteredCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const connected = Boolean(code);

  const handleCreate = async () => {
    setBusy(true);
    setError(null);
    try {
      await engine.createAccount();
      setShowCreated(true);
    } catch {
      setError(t('cloudCreateError'));
    } finally {
      setBusy(false);
    }
  };

  const handleConnect = async () => {
    const canonical = normalizeCode(enteredCode);
    if (canonical.length < 12) {
      setError(t('cloudInvalidCode'));
      return;
    }
    if (!window.confirm(t('cloudConfirmReplace'))) {
      return;
    }
    setBusy(true);
    setError(null);
    const result = await engine.connect(canonical);
    setBusy(false);
    if (result !== 'connected') {
      setError(t(result === 'unknown_code' ? 'cloudUnknownCode' : 'cloudLoadError'));
      return;
    }
    setShowEnter(false);
    setEnteredCode('');
    onConnected();
  };

  const handleDisconnect = () => {
    if (!window.confirm(t('cloudConfirmDisconnect'))) {
      return;
    }
    engine.disconnect();
  };

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(formatCode(code));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const closeEnter = () => {
    setShowEnter(false);
    setEnteredCode('');
    setError(null);
  };

  const statusLabel: Record<SyncStatus, string> = {
    idle: '',
    saving: t('cloudSaving'),
    saved: t('cloudSynced'),
    error: t('cloudSyncFailed'),
  };

  return (
    <section className="menu-group">
      <h3 className="group-title">{t('cloudSync')}</h3>

      {!connected ? (
        <div className="stack">
          <p className="lede text-sm">{t('cloudSyncDescription')}</p>
          <button onClick={handleCreate} disabled={busy} className="btn btn-block btn-start">
            {busy ? (
              <Loader2 size={16} strokeWidth={2.5} className="animate-spin" aria-hidden="true" />
            ) : (
              <KeyRound size={16} strokeWidth={2.5} aria-hidden="true" />
            )}
            {t('cloudCreateCode')}
          </button>
          <button
            onClick={() => {
              setShowEnter(true);
              setError(null);
            }}
            className="btn btn-block btn-start"
          >
            <LogIn size={16} strokeWidth={2.5} aria-hidden="true" />
            {t('cloudLoginWithCode')}
          </button>
          {error && <p className="form-error">{error}</p>}
        </div>
      ) : (
        <div className="stack">
          <div className="note">
            <div className="flex items-center justify-between gap-3">
              <span className="font-extrabold">{t('cloudConnected')}</span>
              <span
                className={`flex items-center gap-1 text-xs font-bold ${status === 'error' ? 'text-danger' : 'text-ink-2'}`}
                role="status"
              >
                {status === 'saving' && <Loader2 size={14} strokeWidth={2.5} className="animate-spin" aria-hidden="true" />}
                {status === 'saved' && <Check size={14} strokeWidth={3} aria-hidden="true" />}
                {status === 'error' && <AlertTriangle size={14} strokeWidth={2.5} aria-hidden="true" />}
                {statusLabel[status]}
              </span>
            </div>
            <div className="code mt-1 text-sm">{code ? formatCode(code) : ''}</div>
          </div>
          <button onClick={handleCopy} className="btn btn-block btn-start">
            {copied ? (
              <Check size={16} strokeWidth={3} aria-hidden="true" />
            ) : (
              <Copy size={16} strokeWidth={2.5} aria-hidden="true" />
            )}
            {copied ? t('cloudCopied') : t('cloudCopyCode')}
          </button>
          <button onClick={handleDisconnect} className="btn btn-block btn-start">
            <CloudOff size={16} strokeWidth={2.5} aria-hidden="true" />
            {t('cloudDisconnect')}
          </button>
        </div>
      )}

      {/* Modal: Code erstellt */}
      {showCreated && code && (
        <div className="scrim">
          <div className="leaf dialog" role="dialog" aria-modal="true" aria-labelledby="cloud-created-title">
            <h4 id="cloud-created-title" className="leaf-title">
              {t('cloudYourCode')}
            </h4>
            <p className="lede text-sm">{t('cloudCodeNotice')}</p>
            <p className="form-error">{t('cloudCodeWarning')}</p>
            <div className="note code text-center select-all">{formatCode(code)}</div>
            <div className="dialog-actions">
              <button onClick={handleCopy} className="btn">
                {copied ? (
                  <Check size={16} strokeWidth={3} aria-hidden="true" />
                ) : (
                  <Copy size={16} strokeWidth={2.5} aria-hidden="true" />
                )}
                {copied ? t('cloudCopied') : t('cloudCopy')}
              </button>
              <button onClick={() => setShowCreated(false)} className="btn btn-primary">
                {t('cloudUnderstood')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Mit Code anmelden */}
      {showEnter && (
        <div className="scrim">
          <div className="leaf dialog" role="dialog" aria-modal="true" aria-labelledby="cloud-enter-title">
            <div className="dialog-head">
              <h4 id="cloud-enter-title" className="leaf-title">
                {t('cloudLoginWithCode')}
              </h4>
              <button onClick={closeEnter} className="btn btn-quiet btn-icon" aria-label={t('close')}>
                <X size={18} strokeWidth={2.5} aria-hidden="true" />
              </button>
            </div>
            <p className="lede text-sm">{t('cloudEnterCodeDescription')}</p>
            {error && <p className="form-error">{error}</p>}
            <input
              type="text"
              value={enteredCode}
              onChange={(e) => setEnteredCode(e.target.value)}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              aria-label={t('cloudLoginWithCode')}
              aria-invalid={error ? true : undefined}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              className="input code"
            />
            <div className="dialog-actions">
              <button onClick={closeEnter} className="btn btn-quiet">
                {t('cancel')}
              </button>
              <button onClick={handleConnect} disabled={busy} className="btn btn-primary">
                {busy && <Loader2 size={16} strokeWidth={2.5} className="animate-spin" aria-hidden="true" />}
                {t('cloudLogin')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
