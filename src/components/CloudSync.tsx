import { useEffect, useRef, useState } from 'react';
import { Cloud, CloudOff, Copy, Check, KeyRound, LogIn, Loader2, AlertTriangle } from 'lucide-react';
import { useI18n } from '../i18n/context';
import type { StudentData } from '../types';
import {
  cloudSync,
  getStoredCode,
  setStoredCode,
  clearStoredCode,
  normalizeCode,
  formatCode,
} from '../utils/cloudSync';

interface CloudSyncProps {
  /** Aktuelle Daten (werden bei Änderung in die Cloud gepusht). */
  data: StudentData;
  /** Wird aufgerufen, wenn per Code geladene Daten übernommen werden. */
  onLoaded: (data: StudentData) => void;
}

type SyncStatus = 'idle' | 'saving' | 'saved' | 'error';

export const CloudSync = ({ data, onLoaded }: CloudSyncProps) => {
  const { t } = useI18n();
  const [code, setCode] = useState<string | null>(() => getStoredCode());
  const [status, setStatus] = useState<SyncStatus>('idle');

  // Modal-Zustände
  const [showCreated, setShowCreated] = useState(false);
  const [showEnter, setShowEnter] = useState(false);
  const [enteredCode, setEnteredCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const connected = Boolean(code);

  // Debounced push bei Datenänderung, solange verbunden.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRun = useRef(true);
  useEffect(() => {
    if (!connected || !code) return;
    if (firstRun.current) {
      firstRun.current = false;
      return; // beim Mount nicht sofort überschreiben
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setStatus('saving');
    saveTimer.current = setTimeout(async () => {
      try {
        const ok = await cloudSync.save(code, data);
        setStatus(ok ? 'saved' : 'error');
      } catch {
        setStatus('error');
      }
    }, 1500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [data, code, connected]);

  if (!cloudSync.isConfigured) return null;

  const handleCreate = async () => {
    setBusy(true);
    setError(null);
    try {
      const newCode = await cloudSync.createAccount(data);
      setCode(newCode);
      firstRun.current = true; // direkt nach Anlegen nicht erneut pushen
      setShowCreated(true);
      setStatus('saved');
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
    try {
      const remote = await cloudSync.load(canonical);
      if (!remote) {
        setError(t('cloudUnknownCode'));
        return;
      }
      setStoredCode(canonical);
      setCode(canonical);
      firstRun.current = true;
      onLoaded(remote);
      setStatus('saved');
      setShowEnter(false);
      setEnteredCode('');
    } catch {
      setError(t('cloudLoadError'));
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = () => {
    if (!window.confirm(t('cloudConfirmDisconnect'))) {
      return;
    }
    clearStoredCode();
    setCode(null);
    setStatus('idle');
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

  const statusLabel: Record<SyncStatus, string> = {
    idle: '',
    saving: t('cloudSaving'),
    saved: t('cloudSynced'),
    error: t('cloudSyncFailed'),
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Cloud className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{t('cloudSync')}</h3>
      </div>

      {!connected ? (
        <div className="space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            {t('cloudSyncDescription')}
          </p>
          <button
            onClick={handleCreate}
            disabled={busy}
            className="w-full text-left px-4 py-3 rounded-lg border-2 border-blue-200 dark:border-blue-900 hover:border-blue-300 dark:hover:border-blue-700 text-blue-700 dark:text-blue-300 transition-colors flex items-center gap-3 disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            <div className="font-medium">{t('cloudCreateCode')}</div>
          </button>
          <button
            onClick={() => {
              setShowEnter(true);
              setError(null);
            }}
            className="w-full text-left px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-3"
          >
            <LogIn className="w-4 h-4" />
            <div className="font-medium">{t('cloudLoginWithCode')}</div>
          </button>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="px-4 py-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">{t('cloudConnected')}</span>
              <span className="flex items-center gap-1 text-xs text-blue-700 dark:text-blue-300">
                {status === 'saving' && <Loader2 className="w-3 h-3 animate-spin" />}
                {status === 'saved' && <Check className="w-3 h-3" />}
                {status === 'error' && <AlertTriangle className="w-3 h-3" />}
                {statusLabel[status]}
              </span>
            </div>
            <div className="mt-1 font-mono text-sm tracking-wider text-blue-800 dark:text-blue-200">
              {code ? formatCode(code) : ''}
            </div>
          </div>
          <button
            onClick={handleCopy}
            className="w-full text-left px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-3"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            <div className="font-medium">{copied ? t('cloudCopied') : t('cloudCopyCode')}</div>
          </button>
          <button
            onClick={handleDisconnect}
            className="w-full text-left px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-3"
          >
            <CloudOff className="w-4 h-4" />
            <div className="font-medium">{t('cloudDisconnect')}</div>
          </button>
        </div>
      )}

      {/* Modal: Code erstellt */}
      {showCreated && code && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <KeyRound className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('cloudYourCode')}</h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              {t('cloudCodeNotice')}{' '}
              <strong className="text-red-600 dark:text-red-400">{t('cloudCodeWarning')}</strong>
            </p>
            <div className="text-center font-mono text-xl tracking-widest py-4 px-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 select-all">
              {formatCode(code)}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium flex items-center justify-center gap-2"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {copied ? t('cloudCopied') : t('cloudCopy')}
              </button>
              <button
                onClick={() => setShowCreated(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                {t('cloudUnderstood')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Mit Code anmelden */}
      {showEnter && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <LogIn className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('cloudLoginWithCode')}</h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              {t('cloudEnterCodeDescription')}
            </p>
            <input
              type="text"
              value={enteredCode}
              onChange={(e) => setEnteredCode(e.target.value)}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono tracking-wider focus:border-blue-500 focus:outline-none"
            />
            {error && <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setShowEnter(false);
                  setEnteredCode('');
                  setError(null);
                }}
                className="flex-1 px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleConnect}
                disabled={busy}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('cloudLogin')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
