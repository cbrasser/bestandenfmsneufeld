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

  const side = (choice: Choice, title: string, Icon: LucideIcon, details: ConflictSide, action: string) => (
    <SideCard
      title={title}
      Icon={Icon}
      details={details}
      action={action}
      disabled={choosing !== null}
      busy={choosing === choice}
      onChoose={() => void choose(choice)}
    />
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
          {side('keepThisDevice', t('conflictThisDevice'), Smartphone, conflict.local, t('conflictKeepThisDevice'))}
          {side('keepCloud', t('conflictCloud'), Cloud, conflict.cloud, t('conflictKeepCloud'))}
        </div>
        {failed && (
          <p className="form-error" role="alert">
            {t('conflictChoiceError')}
          </p>
        )}
        <p className="text-sm text-ink-2">{t('conflictBackupNote')}</p>
      </div>
    </div>
  );
};

interface SideCardProps {
  title: string;
  Icon: LucideIcon;
  details: ConflictSide;
  action: string;
  disabled: boolean;
  busy: boolean;
  onChoose: () => void;
}

const SideCard = ({ title, Icon, details, action, disabled, busy, onChoose }: SideCardProps) => {
  const { t, language } = useI18n();
  return (
    <section className="note conflict-side">
      <h3 className="flex items-center gap-2 font-extrabold">
        <Icon size={16} strokeWidth={2.5} aria-hidden="true" />
        {title}
      </h3>
      <dl>
        <div>
          <dt>{t('conflictGrades')}</dt>
          <dd>{details.gradeCount}</dd>
        </div>
        <div>
          <dt>{t('conflictLastChange')}</dt>
          <dd>{details.changedAt ? formatDateTime(details.changedAt, language) : t('conflictLastChangeUnknown')}</dd>
        </div>
      </dl>
      <button onClick={onChoose} disabled={disabled} className="btn btn-block">
        {busy && <Loader2 size={16} strokeWidth={2.5} className="animate-spin" aria-hidden="true" />}
        {action}
      </button>
    </section>
  );
};
