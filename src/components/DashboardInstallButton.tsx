import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { useDashboardPwaInstall } from '@/hooks/useDashboardPwaInstall';

/**
 * Installs the dashboard as its own app (start URL and scope limited to /dashboard).
 */
export function DashboardInstallButton() {
  const { isInstalled, promptInstall } = useDashboardPwaInstall();

  if (isInstalled) return null;

  const handleInstall = async () => {
    try {
      const outcome = await promptInstall();

      if (outcome === 'unavailable') {
        toast.info('Install the dashboard', {
          description: 'Open your browser menu and choose "Install app", or "Add to Home Screen" on iOS.',
        });
      }
    } catch {
      toast.error('Could not open the install prompt. Use your browser menu to install the dashboard.');
    }
  };

  return (
    <Button
      variant="ghost"
      className="h-9 flex-shrink-0 gap-1.5 px-2 text-gray-600 hover:text-gray-900"
      onClick={handleInstall}
      aria-label="Install the dashboard app"
      title="Install the dashboard app"
    >
      <Download className="w-4 h-4" />
      <span className="hidden text-xs font-semibold sm:inline">Install</span>
    </Button>
  );
}
