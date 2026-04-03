import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo;
  }
}

window.Pusher = Pusher;

const PUSHER_KEY    = import.meta.env.VITE_PUSHER_APP_KEY    ?? 'asahi-key';
const PUSHER_HOST   = import.meta.env.VITE_PUSHER_HOST       ?? 'localhost';
const PUSHER_PORT   = Number(import.meta.env.VITE_PUSHER_PORT ?? 6001);
const PUSHER_SCHEME = import.meta.env.VITE_PUSHER_SCHEME      ?? 'http';
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_APP_CLUSTER ?? 'mt1';

let echoInstance: Echo | null = null;

export function getEcho(): Echo {
  if (!echoInstance) {
    echoInstance = new Echo({
      broadcaster: 'pusher',
      key: PUSHER_KEY,
      wsHost: PUSHER_HOST,
      wsPort: PUSHER_SCHEME === 'https' ? undefined : PUSHER_PORT,
      wssPort: PUSHER_SCHEME === 'https' ? PUSHER_PORT : undefined,
      cluster: PUSHER_CLUSTER,
      forceTLS: PUSHER_SCHEME === 'https',
      enabledTransports: ['ws', 'wss'],
      authEndpoint: '/broadcasting/auth',
      auth: {
        headers: {
          // Read token from Zustand persisted storage
          Authorization: `Bearer ${(() => {
            try {
              const stored = localStorage.getItem('asahi-auth');
              return stored ? JSON.parse(stored)?.state?.token ?? '' : '';
            } catch { return ''; }
          })()}`,
          Accept: 'application/json',
        },
      },
    });
  }
  return echoInstance;
}

export function disconnectEcho() {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
  }
}
