import { useCallback, useEffect, useState } from 'react';

import {
  DEFAULT_GENERAL_SETTINGS,
  getGeneralSettings,
} from '../../../infrastructure/firebase/services/settingsService';
import { notifyError } from '../../../shared/notifications/notify';
import type { GeneralSettings } from '../../../shared/types/generalSettings';

export interface UseGeneralSettingsResult {
  /** Current settings or defaults; valid when status is 'ready' or 'error'. */
  settings: GeneralSettings;
  /** 'loading' while fetching, 'ready' after first load or save, 'error' after failure. */
  status: 'loading' | 'ready' | 'error';
  /** Non-null only when status is 'error'. */
  error: Error | null;
  /** True when a save operation is in flight. */
  isSaving: boolean;
  /** Whether the document has never been saved (fallback to defaults is active). */
  hasNeverBeenSaved: boolean;
}

/**
 * Loads `settings/general` on mount; exposes it and a save callback. Falls back
 * to `DEFAULT_GENERAL_SETTINGS` when the document does not exist, flagging that
 * state via `hasNeverBeenSaved` so the UI can show a banner. Errors on load do
 * not throw; they surface in the result for the UI to display.
 */
export const useGeneralSettings = (): UseGeneralSettingsResult & {
  save: (settings: Omit<GeneralSettings, 'timezone'>, userId: string) => Promise<void>;
} => {
  const [settings, setSettings] = useState<GeneralSettings>(DEFAULT_GENERAL_SETTINGS);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<Error | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasNeverBeenSaved, setHasNeverBeenSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { settings: loaded, exists } = await getGeneralSettings();
        setSettings(loaded);
        setStatus('ready');
        setError(null);
        setHasNeverBeenSaved(!exists);
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err : new Error(String(err)));
        setSettings(DEFAULT_GENERAL_SETTINGS);
        setHasNeverBeenSaved(true);
      }
    };

    void load();
  }, []);

  const save = useCallback(async (newSettings: Omit<GeneralSettings, 'timezone'>, userId: string): Promise<void> => {
    setIsSaving(true);
    try {
      const { updateGeneralSettings } = await import('../../../infrastructure/firebase/services/settingsService');
      await updateGeneralSettings(userId, {
        timezone: 'Europe/Kyiv',
        defaultMealTimes: newSettings.defaultMealTimes,
      });
      setSettings({ timezone: 'Europe/Kyiv', ...newSettings });
      setStatus('ready');
      setError(null);
      setHasNeverBeenSaved(false);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err : new Error(String(err)));
      notifyError(err);
    } finally {
      setIsSaving(false);
    }
  }, []);

  return {
    settings,
    status,
    error,
    isSaving,
    hasNeverBeenSaved,
    save,
  };
};
