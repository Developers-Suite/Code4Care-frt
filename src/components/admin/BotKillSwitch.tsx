import { useState } from 'react';
import { Power, PowerOff } from 'lucide-react';
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
 * Admin-only kill switch for the AI bot. Engaging it blocks every request to the
 * bot API; manual counselor chat keeps working.
 */
export function BotKillSwitch({ session }: BotKillSwitchProps) {
  const { botKilled, setBotKilled } = useBotKillSwitch();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (session.role !== 'admin') {
    return null;
  }

  const actor = session.name || session.staffId;

  const handleEngage = () => {
    setBotKilled(true, actor);
    setConfirmOpen(false);
    toast.warning('Bot shut down. No messages will reach the bot API until it is restarted.');
  };

  const handleRestart = () => {
    setBotKilled(false, actor);
    toast.success('Bot restarted. Automated replies are live again.');
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => (botKilled ? handleRestart() : setConfirmOpen(true))}
        aria-pressed={botKilled}
        title={botKilled ? 'Bot is shut down - click to restart' : 'Shut down the AI bot'}
        className={`h-9 gap-1.5 px-2.5 text-xs cursor-pointer ${botKilled
          ? 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800'
          : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`}
      >
        {botKilled ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
        <span className="hidden sm:inline font-semibold">
          {botKilled ? 'Bot shut down' : 'Bot live'}
        </span>
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Shut down the AI bot?</DialogTitle>
            <DialogDescription>
              New messages stop reaching the bot API until an admin restarts it. Live counselor
              chat and the support queue keep working.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleEngage}>
              Shut down bot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
