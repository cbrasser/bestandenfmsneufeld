import { useEffect, useRef } from 'react';
import type { StudentData } from '../types';
import { onCloudData, syncEngine } from './cloud';

const SAVE_DELAY_MS = 1500;

/**
 * Connects the app to its sync: pulls on open and on return to the page, and saves after the delay
 * when the data changes. Call it after the effect that writes data to storage: effects run in order,
 * and the sync reads what is stored.
 */
export function useCloudSync(data: StudentData | null, onCloudDataTaken: (data: StudentData) => void) {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => onCloudData(onCloudDataTaken), [onCloudDataTaken]);

  useEffect(() => {
    if (!syncEngine || !data || !syncEngine.noteLocalChange()) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void syncEngine?.sync(), SAVE_DELAY_MS);
  }, [data]);

  const loaded = Boolean(data);
  useEffect(() => {
    if (syncEngine && loaded) void syncEngine.sync();
  }, [loaded]);

  useEffect(() => {
    const syncIfVisible = () => {
      if (document.visibilityState === 'visible') void syncEngine?.sync();
    };
    window.addEventListener('focus', syncIfVisible);
    document.addEventListener('visibilitychange', syncIfVisible);
    return () => {
      window.removeEventListener('focus', syncIfVisible);
      document.removeEventListener('visibilitychange', syncIfVisible);
    };
  }, []);

  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    []
  );
}
