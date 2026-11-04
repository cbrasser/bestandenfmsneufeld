import { useEffect, useRef } from 'react';
import type { StudentData } from '../types';
import { storageService } from '../utils/storage';
import { onCloudData, syncEngine } from './cloud';
import { SHARED_SYNC_KEYS, type CloudDataListener } from './webStore';

const SAVE_DELAY_MS = 1500;

/**
 * Connects the app to its sync: pulls on open and on return to the page, retries when the connection
 * returns, and saves after the delay when the data changes, or at once when the page is left. Tabs
 * share their storage, so what another tab stores is shown here too. Call it after the effect that
 * writes data to storage: effects run in order, and the sync reads what is stored.
 */
export function useCloudSync(data: StudentData | null, onDataFromElsewhere: CloudDataListener) {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => onCloudData(onDataFromElsewhere), [onDataFromElsewhere]);

  useEffect(() => {
    if (!syncEngine || !data || !syncEngine.noteLocalChange()) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      void syncEngine?.sync();
    }, SAVE_DELAY_MS);
  }, [data]);

  const loaded = Boolean(data);
  useEffect(() => {
    if (syncEngine && loaded) void syncEngine.sync();
  }, [loaded]);

  useEffect(() => {
    const engine = syncEngine;
    if (!engine) return;

    const takeOtherTabData = () => {
      engine.noteOtherTabChange();
      const stored = storageService.getData();
      if (stored) onDataFromElsewhere(stored, { keepSelectedYear: true });
    };
    const onStorage = ({ key }: StorageEvent) => {
      if (key === null || SHARED_SYNC_KEYS.includes(key)) takeOtherTabData();
    };
    const syncOnReturn = () => {
      if (document.visibilityState !== 'visible') return;
      // A page restored from the browser's cache missed what other tabs wrote
      takeOtherTabData();
      void engine.sync();
    };
    // Don't wait out the delay on a page the browser may stop at any moment. If this fails or is cut
    // off, the edit stays marked unsynced for the next open.
    const saveOnLeave = () => {
      if (document.visibilityState !== 'hidden' || !saveTimer.current) return;
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
      void engine.sync();
    };
    // A save already under way when the connection returned may still fail, so that one doesn't count
    const syncOnReconnect = async () => {
      await engine.sync();
      if (engine.getSnapshot().failure === 'unreachable') void engine.sync();
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', syncOnReturn);
    window.addEventListener('online', syncOnReconnect);
    document.addEventListener('visibilitychange', syncOnReturn);
    document.addEventListener('visibilitychange', saveOnLeave);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', syncOnReturn);
      window.removeEventListener('online', syncOnReconnect);
      document.removeEventListener('visibilitychange', syncOnReturn);
      document.removeEventListener('visibilitychange', saveOnLeave);
    };
  }, [onDataFromElsewhere]);

  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    []
  );
}
