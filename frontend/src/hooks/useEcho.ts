import { useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/auth.store';
import { getEcho, disconnectEcho } from '../lib/echo';

type EventCallback = (data: any) => void;

interface ChannelListener {
  event: string;
  callback: EventCallback;
}

/**
 * Subscribe to a private Echo channel and listen for events.
 * Automatically unsubscribes on unmount.
 *
 * @param channelName  e.g. `shop.3`
 * @param listeners    array of { event, callback } — event names match broadcastAs() without dot prefix
 * @param enabled      skip subscription when false (e.g. waiting for shopId)
 */
export function useEcho(
  channelName: string,
  listeners: ChannelListener[],
  enabled = true,
) {
  const user = useAuthStore((s) => s.user);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!enabled || !user) return;

    const echo = getEcho();
    const channel = echo.private(channelName);
    channelRef.current = channel;

    listeners.forEach(({ event, callback }) => {
      channel.listen(`.${event}`, callback);
    });

    return () => {
      listeners.forEach(({ event }) => {
        channel.stopListening(`.${event}`);
      });
      echo.leave(channelName);
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, enabled, user?.id]);

  return channelRef;
}

export { disconnectEcho };
