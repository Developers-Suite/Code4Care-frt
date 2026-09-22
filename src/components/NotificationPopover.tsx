import React from 'react';
import { Bell, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { SupportRequestListItem } from '@/services/supportRequestService';

interface NotificationPopoverProps {
  notifications: SupportRequestListItem[];
  onSelectNotification?: (requestId: string) => void;
  onRequestPermission?: () => void;
  permissionGranted?: boolean;
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({
  notifications,
  onSelectNotification,
  onRequestPermission,
  permissionGranted = true,
}) => {
  // Limit to the first 10 notifications as specified
  const displayNotifications = notifications.slice(0, 10);
  const count = notifications.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative gap-1.5 text-xs h-8 border-gray-200 text-gray-700 hover:bg-gray-100"
          title="Notifications"
        >
          <Bell className="w-4 h-4 text-gray-600" />
          <span className="hidden sm:inline font-medium">Notifications</span>
          {count > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-600 rounded-full animate-pulse">
              {count > 10 ? '10+' : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm text-gray-900">Notifications</h4>
            {count > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full">
                {count} {count === 1 ? 'item' : 'items'}
              </span>
            )}
          </div>
          {!permissionGranted && onRequestPermission && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[11px] px-2 text-amber-700 hover:bg-amber-100/50"
              onClick={onRequestPermission}
            >
              Enable Alerts
            </Button>
          )}
        </div>

        <div className="max-h-[320px] overflow-y-auto divide-y divide-gray-100">
          {displayNotifications.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
              <p className="font-medium text-gray-700">All caught up!</p>
              <p className="mt-0.5 text-gray-400">No pending notifications at the moment.</p>
            </div>
          ) : (
            displayNotifications.map((item) => {
              const isUrgent = item.urgency === 'high' || item.urgency === 'critical';
              return (
                <div
                  key={item.id}
                  onClick={() => onSelectNotification?.(item.id)}
                  className={`p-3 text-xs transition-colors cursor-pointer hover:bg-slate-50 flex items-start gap-2.5 ${
                    isUrgent ? 'bg-rose-50/40' : ''
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {isUrgent ? (
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-semibold text-gray-900 truncate">
                        {item.user_nickname || item.userNickname || 'User Request'}
                      </p>
                      {isUrgent && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 flex-shrink-0">
                          URGENT
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-[11px] mt-0.5 truncate">
                      Status: <span className="font-medium capitalize text-gray-700">{item.status}</span>
                      {item.region ? ` • ${item.region}` : ''}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {count > 10 && (
          <div className="p-2 border-t border-gray-100 bg-gray-50/50 text-center text-[11px] text-gray-500 font-medium">
            Showing first 10 of {count} available notifications
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
