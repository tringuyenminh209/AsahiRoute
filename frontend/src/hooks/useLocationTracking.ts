import { useEffect, useRef } from 'react';
import { useDeliveryStore } from '../stores/delivery.store';
import { deliveryService } from '../services/delivery.service';

const SEND_INTERVAL_MS = 10_000; // send at most once per 10 seconds

export function useLocationTracking() {
  const activeDelivery = useDeliveryStore((s) => s.activeDelivery);
  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef<number>(0);

  useEffect(() => {
    if (!activeDelivery || !navigator.geolocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastSentRef.current < SEND_INTERVAL_MS) return;
        lastSentRef.current = now;
        deliveryService
          .sendLocation(
            pos.coords.latitude,
            pos.coords.longitude,
            pos.coords.speed ?? 0,
          )
          .catch(() => {/* silent — offline or error */});
      },
      () => {/* ignore errors */},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [activeDelivery?.id]);
}
