import { Component, type ReactNode } from 'react';
import { useI18n } from '../i18n/context';
import { syncEngine } from '../sync/cloud';
import { isNewerData } from '../utils/dataVersion';
import { storageService } from '../utils/storage';

const reload = () => window.location.reload();

interface ReadOnlyNoticeProps {
  /** Leaves the newer file on show. Leave it out when the data on show isn't a file. */
  onCloseFile?: () => void;
}

/** Says why nothing can be changed, and what to do about it. */
export const ReadOnlyNotice = ({ onCloseFile }: ReadOnlyNoticeProps) => {
  const { t } = useI18n();
  return (
    <div className="leaf notice mt-2 mb-4" role="status">
      <p>
        <strong>{t('readOnlyTitle')}</strong> {t(onCloseFile ? 'readOnlyFile' : 'readOnlyData')}
      </p>
      {onCloseFile ? (
        <button onClick={onCloseFile} className="btn btn-primary">
          {t('readOnlyCloseFile')}
        </button>
      ) : (
        <button onClick={reload} className="btn btn-primary">
          {t('readOnlyReload')}
        </button>
      )}
    </div>
  );
};

/** For data in a newer format that can't be shown at all. Nothing has changed, so a reload is safe. */
export const NewerDataPage = () => {
  const { t } = useI18n();
  return (
    <main className="auth">
      <div className="leaf auth-card">
        <h1 className="auth-title">{t('readOnlyTitle')}</h1>
        <p className="lede">{t('newerDataRefused')}</p>
        <button onClick={reload} className="btn btn-primary btn-block">
          {t('readOnlyReload')}
        </button>
      </div>
    </main>
  );
};

const isReadOnly = () => {
  try {
    const stored = storageService.getData();
    return Boolean(syncEngine?.getSnapshot().readOnly) || (stored !== null && isNewerData(stored));
  } catch {
    return false;
  }
};

/**
 * A newer format may be one this version can't draw. That must not look like a broken site, so it gets
 * the same request to update. Any other error is none of this boundary's business.
 */
export class NewerDataBoundary extends Component<{ children: ReactNode }, { error: unknown }> {
  state = { error: null };

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  render() {
    if (this.state.error === null) return this.props.children;
    if (!isReadOnly()) throw this.state.error;
    return <NewerDataPage />;
  }
}
