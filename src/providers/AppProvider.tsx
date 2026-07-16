import React, { createContext, useContext, useState, useEffect } from 'react';
import { safeStorage } from '@/utils/safeStorage';
import { logger } from '@/utils/logger';
import { APIClient } from '@/services/apiClient';

interface AppState {
  nickname: string | undefined;
  botName: string;
  ageRange: string;
  genderIdentity: string;
  region: string;
  sessionDuration: string;
  analyticsOptIn: boolean;
  sessionId: string;
  hasSeenOnboarding: boolean;
  consultantMode: boolean;
}

interface AppContextType extends AppState {
  setNickname: (name: string | undefined) => void;
  setBotName: (name: string) => void;
  setAgeRange: (value: string) => void;
  setGenderIdentity: (value: string) => void;
  setRegion: (value: string) => void;
  setSessionDuration: (duration: string) => void;
  setAnalyticsOptIn: (optIn: boolean) => void;
  setSessionId: (id: string) => void;
  setHasSeenOnboarding: (seen: boolean) => void;
  setConsultantMode: (active: boolean) => void;
  resetAll: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [nickname, setNickname] = useState<string | undefined>(() => safeStorage.getItem('lydiacontactcenter_nickname') || undefined);
  const [botName, setBotName] = useState<string>(() => safeStorage.getItem('lydiacontactcenter_botname') || 'Lydia Contact Center');
  const [ageRange, setAgeRange] = useState<string>(() => safeStorage.getItem('lydiacontactcenter_age_range') || '15-19');
  const [genderIdentity, setGenderIdentity] = useState<string>(() => safeStorage.getItem('lydiacontactcenter_gender_identity') || 'prefer-not-say');
  const [region, setRegion] = useState<string>(() => safeStorage.getItem('lydiacontactcenter_region') || 'greater-accra');
  const [sessionDuration, setSessionDuration] = useState<string>(() => safeStorage.getItem('lydiacontactcenter_duration') || '24h');
  const [analyticsOptIn, setAnalyticsOptIn] = useState<boolean>(() => {
    try {
      const stored = safeStorage.getItem('lydiacontactcenter_analytics');
      if (stored === null) {
        // default to enabled and persist
        safeStorage.setItem('lydiacontactcenter_analytics', 'true');
        return true;
      }
      return stored !== 'false';
    } catch {
      return true;
    }
  });
  const [sessionId, setSessionId] = useState<string>(() => safeStorage.getItem('lydiacontactcenter_session_id') || crypto.randomUUID());
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean>(() => safeStorage.getItem('lydiacontactcenter_onboarding_complete') === 'true');
  const [consultantMode, setConsultantMode] = useState<boolean>(false);

  // Initialize API client on app load
  useEffect(() => {
    APIClient.initialize({
      autoRefreshToken: true,
      onTokenExpired: () => {
        logger.warn('Session token expired');
      },
      onUnauthorized: () => {
        logger.warn('User unauthorized');
      },
    });
  }, []);

  // Exchange the local session ID for a backend-owned UUID on first load.
  // This ensures demographics (saved during onboarding) and chat conversations
  // are always stored under the same session_id.
  // Only touches sessionId — no other state is read or modified.
  useEffect(() => {
    const base = import.meta.env.VITE_API_BASE_URL?.trim();
    if (!base) return;

    // On first visit localStorage hasn't been populated yet — fall back to
    // the initial state value so the backend receives the same UUID that
    // onboarding will use, preventing a demographics/conversation split.
    const current = safeStorage.getItem('lydiacontactcenter_session_id') || sessionId;

    fetch(new URL('/v1/session/init', base).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: current || undefined }),
    })
      .then((r) => r.json())
      .then((data: unknown) => {
        const received = (data as Record<string, unknown>)?.session_id;
        if (typeof received === 'string' && received && received !== current) {
          setSessionId(received);
        }
      })
      .catch(() => {
        // Network unavailable — keep whatever ID we have, chat will still work
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount only

  // Persistence effects
  useEffect(() => {
    if (nickname) safeStorage.setItem('lydiacontactcenter_nickname', nickname);
    else safeStorage.removeItem('lydiacontactcenter_nickname');
  }, [nickname]);

  useEffect(() => {
    safeStorage.setItem('lydiacontactcenter_botname', botName);
  }, [botName]);

  useEffect(() => {
    safeStorage.setItem('lydiacontactcenter_age_range', ageRange);
  }, [ageRange]);

  useEffect(() => {
    safeStorage.setItem('lydiacontactcenter_gender_identity', genderIdentity);
  }, [genderIdentity]);

  useEffect(() => {
    safeStorage.setItem('lydiacontactcenter_region', region);
  }, [region]);

  useEffect(() => {
    safeStorage.setItem('lydiacontactcenter_duration', sessionDuration);
  }, [sessionDuration]);

  useEffect(() => {
    safeStorage.setItem('lydiacontactcenter_analytics', analyticsOptIn.toString());
  }, [analyticsOptIn]);

  useEffect(() => {
    safeStorage.setItem('lydiacontactcenter_onboarding_complete', hasSeenOnboarding.toString());
  }, [hasSeenOnboarding]);

  useEffect(() => {
    safeStorage.setItem('lydiacontactcenter_session_id', sessionId);
  }, [sessionId]);

  const resetAll = () => {
    logger.info('Resetting all app state...');
    safeStorage.removeItem('lydiacontactcenter_nickname');
    safeStorage.removeItem('lydiacontactcenter_botname');
    safeStorage.removeItem('lydiacontactcenter_language');
    safeStorage.removeItem('lydiacontactcenter_age_range');
    safeStorage.removeItem('lydiacontactcenter_gender_identity');
    safeStorage.removeItem('lydiacontactcenter_region');
    safeStorage.removeItem('lydiacontactcenter_duration');
    safeStorage.removeItem('lydiacontactcenter_analytics');
    safeStorage.removeItem('lydiacontactcenter_sessions');
    safeStorage.removeItem('lydiacontactcenter_panic_triggered');
    safeStorage.removeItem('lydiacontactcenter_onboarding_complete');
    safeStorage.removeItem('lydiacontactcenter_session_id');
    
    setNickname(undefined);
    setBotName('Lydia Contact Center');
    setAgeRange('15-19');
    setGenderIdentity('prefer-not-say');
    setRegion('greater-accra');
    setSessionDuration('24h');
    setAnalyticsOptIn(true);
    setSessionId(crypto.randomUUID());
    setHasSeenOnboarding(false);
    setConsultantMode(false);
  };

  const value = {
    nickname, setNickname,
    botName, setBotName,
    ageRange, setAgeRange,
    genderIdentity, setGenderIdentity,
    region, setRegion,
    sessionDuration, setSessionDuration,
    analyticsOptIn, setAnalyticsOptIn,
    sessionId, setSessionId,
    hasSeenOnboarding, setHasSeenOnboarding,
    consultantMode, setConsultantMode,
    resetAll
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
