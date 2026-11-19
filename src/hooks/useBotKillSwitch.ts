import { useCallback, useEffect, useState } from 'react';
import {
  BotKillSwitchState,
  getBotKillSwitchState,
  setBotKilled,
  subscribeBotKillSwitch,
} from '@/services/botKillSwitch';

export function useBotKillSwitch() {
  const [state, setState] = useState<BotKillSwitchState>(() => getBotKillSwitchState());

  useEffect(() => {
    setState(getBotKillSwitchState());
    return subscribeBotKillSwitch(setState);
  }, []);

  const update = useCallback((enabled: boolean, updatedBy?: string) => {
    setState(setBotKilled(enabled, updatedBy));
  }, []);

  return { botKilled: state.enabled, state, setBotKilled: update };
}
