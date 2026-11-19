import { useCallback, useEffect, useState } from 'react';
import {
  BotKillSwitchState,
  getBotKillSwitchState,
  setBotKilled,
  subscribeBotKillSwitch,
  syncBotKillSwitchFromBackend,
  updateBotKillSwitchOnBackend,
} from '@/services/botKillSwitch';

export function useBotKillSwitch(accessToken?: string) {
  const [state, setState] = useState<BotKillSwitchState>(() => getBotKillSwitchState());
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setState(getBotKillSwitchState());
    void syncBotKillSwitchFromBackend(accessToken);
    return subscribeBotKillSwitch(setState);
  }, [accessToken]);

  const update = useCallback(
    async (enabled: boolean, updatedBy?: string, tokenOverride?: string) => {
      const token = tokenOverride ?? accessToken;
      if (!token) {
        const next = setBotKilled(enabled, updatedBy);
        setState(next);
        return next;
      }

      setIsUpdating(true);
      try {
        const next = await updateBotKillSwitchOnBackend(enabled, token);
        setState(next);
        return next;
      } finally {
        setIsUpdating(false);
      }
    },
    [accessToken],
  );

  return { botKilled: state.enabled, state, isUpdating, setBotKilled: update };
}
