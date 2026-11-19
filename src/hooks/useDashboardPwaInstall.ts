import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const APP_MANIFEST = '/manifest.json';
const DASHBOARD_MANIFEST = '/manifest-dashboard.json';

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches === true ||
  (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

/**
 * Keeps the document on the dashboard-only manifest while the dashboard is mounted and exposes the
 * browser install prompt, so installing from /dashboard produces an app scoped to /dashboard.
 */
export function useDashboardPwaInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(isStandalone);

  useEffect(() => {
    const links = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="manifest"]'));
    if (links.length === 0) return;

    const previousHrefs = links.map((link) => link.getAttribute('href') ?? APP_MANIFEST);
    links.forEach((link) => link.setAttribute('href', DASHBOARD_MANIFEST));

    return () => {
      links.forEach((link, index) => link.setAttribute('href', previousHrefs[index]));
    };
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      // Keep the browser mini-infobar from replacing the in-dashboard button.
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!installPrompt) return 'unavailable';

    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    if (outcome === 'accepted') {
      setInstallPrompt(null);
      setIsInstalled(true);
    }

    return outcome;
  }, [installPrompt]);

  return { isInstalled, promptInstall };
}
