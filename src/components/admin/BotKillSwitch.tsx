import { useState } from 'react';
import { Loader2, Power, PowerOff } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useBotKillSwitch } from '@/hooks/useBotKillSwitch';
import { StaffSession } from '@/services/staffAccessService';

interface BotKillSwitchProps {
  session: StaffSession;
}

/**
 * Admin-only global kill switch for the AI bot. Engaging it turns the bot off
 * on the backend across all web and WhatsApp clients; live counselor chat keeps working.
 */
export function BotKillSwitch({ session }: BotKillSwitchProps) {
  const { botKilled, isUpdating, setBotKilled } = useBotKillSwitch(session.accessToken);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (session.role !== 'admin') {
    return null;
  }

  const actor = session.name || session.staffId;

  const handleEngage = async () => {
    try {
      await setBotKilled(true, actor, session.accessToken);
      setConfirmOpen(false);
      toast.warning('Bot turned off globally. Automated replies are paused until an admin turns it back on.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to turn off the bot.');
    }
  };

  const handleRestart = async () => {
    try {
      await setBotKilled(false, actor, session.accessToken);
      toast.success('Bot turned back on. Automated replies are live again.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to turn on the bot.');
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        disabled={isUpdating}
        onClick={() => (botKilled ? void handleRestart() : setConfirmOpen(true))}
        aria-pressed={botKilled}
        title={botKilled ? 'Bot is turned off - click to turn back on' : 'Turn off the AI bot'}
        className={`h-9 gap-1.5 px-2.5 text-xs cursor-pointer ${botKilled
          ? 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800'
          : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`}
      >
        {isUpdating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : botKilled ? (
          <PowerOff className="w-4 h-4" />
        ) : (
          <Power className="w-4 h-4" />
        )}
        <span className="hidden sm:inline font-semibold">
          {botKilled ? 'Bot off' : 'Bot on'}
        </span>
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Turn off the AI bot?</DialogTitle>
            <DialogDescription>
              Automated AI replies will stop globally across web and WhatsApp until an admin
              turns the bot back on. Live counselor chat and the support queue keep working.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={isUpdating} onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={isUpdating} onClick={() => void handleEngage()}>
              {isUpdating ? 'Turning off…' : 'Turn off bot'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
