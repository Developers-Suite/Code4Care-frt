import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { safeStorage } from '@/utils/safeStorage';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();

  // Sync i18next language with our localStorage key
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      safeStorage.setItem('lydiacontactcenter_language', lng);
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  return <>{children}</>;
};
