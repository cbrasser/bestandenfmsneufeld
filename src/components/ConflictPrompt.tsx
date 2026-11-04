import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Cloud, Loader2, Smartphone, type LucideIcon } from 'lucide-react';
import { useI18n } from '../i18n/context';
import { formatDateTime } from '../lib/utils';
import { syncEngine } from '../sync/cloud';
import type { ConflictSide, SyncConflict, SyncEngine } from '../sync/engine';

/**
 * Both sides really changed, so the student chooses which version to keep. There is no way out but a
 * choice: until then the two versions stay apart, and any edit would only add to the difference.
 */
export const ConflictPrompt = () => (syncEngine ? <ConflictPromptFor engine={syncEngine} /> : null);

const ConflictPromptFor = ({ engine }: { engine: SyncEngine }) => {
  const { conflict } = useSyncExternalStore(engine.subscribe, engine.getSnapshot);
  return conflict ? <ConflictDialog engine={engine} conflict={conflict} /> : null;
};

type Choice = 'keepThisDevice' | 'keepCloud';

const ConflictDialog = ({ engine, conflict }: { engine: SyncEngine; conflict: SyncConflict }) => {
  const { t } = useI18n();
  const dialog = useRef<HTMLDivElement>(null);
  const [choosing, setChoosing] = useState<Choice | null>(null);
  const [failed, setFailed] = useState(false);

  // Into the dialog, but onto neither choice, so that a stray Enter doesn't decide anything
  useEffect(() => dialog.current?.focus(), []);

  const choose = async (choice: Choice) => {
    setChoosing(choice);
    setFailed(false);
    const done = await engine[choice]();
    setChoosing(null);
    setFailed(!done);
  };

  const choiceButton = (choice: Choice, label: string) => (
    <button onClick={() => void choose(choice)} disabled={choosing !== null} className="btn">
      {choosing === choice && <Loader2 size={16} strokeWidth={2.5} className="animate-spin" aria-hidden="true" />}
      {label}
    </button>
  );

  return (
    <div className="scrim">
      <div
        ref={dialog}
        tabIndex={-1}
        className="leaf dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="conflict-title"
        aria-describedby="conflict-description"
      >
        <h2 id="conflict-title" className="leaf-title">
          {t('conflictTitle')}
        </h2>
        <p id="conflict-description" className="lede text-sm">
          {t('conflictDescription')}
        </p>
        <div className="conflict-sides">
          <Side title={t('conflictThisDevice')} Icon={Smartphone} details={conflict.local} />
          <Side title={t('conflictCloud')} Icon={Cloud} details={conflict.cloud} />
        </div>
        <p className="text-sm text-ink-2">{t('conflictBackupNote')}</p>
        {failed && (
          <p className="form-error" role="alert">
            {t('conflictChoiceError')}
          </p>
        )}
        <div className="dialog-actions dialog-choices">
          {choiceButton('keepThisDevice', t('conflictKeepThisDevice'))}
          {choiceButton('keepCloud', t('conflictKeepCloud'))}
        </div>
      </div>
    </div>
  );
};

const Side = ({ title, Icon, details }: { title: string; Icon: LucideIcon; details: ConflictSide }) => {
  const { t, language } = useI18n();
  return (
    <section className="note conflict-side">
      <h3 className="flex items-center gap-2 font-extrabold">
        <Icon size={16} strokeWidth={2.5} aria-hidden="true" />
        {title}
      </h3>
      <dl>
        <div>
          <dt>{t('gradesLabel')}</dt>
          <dd>{details.gradeCount}</dd>
        </div>
        <div>
          <dt>{t('conflictLastChange')}</dt>
          <dd>{details.changedAt ? formatDateTime(details.changedAt, language) : t('conflictLastChangeUnknown')}</dd>
        </div>
      </dl>
    </section>
  );
};
