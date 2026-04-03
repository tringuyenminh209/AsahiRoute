import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type PointStatus = 'delivered' | 'skipped' | 'failed' | 'absent';

interface ActiveDelivery {
  id: number;
  routeId: number;
  startedAt: string;
}

interface DeliveryStore {
  activeDelivery: ActiveDelivery | null;
  loggedPoints: Record<number, PointStatus>; // routePointId → status
  setActiveDelivery: (d: ActiveDelivery | null) => void;
  logPoint: (routePointId: number, status: PointStatus) => void;
  clearSession: () => void;
}

export const useDeliveryStore = create<DeliveryStore>()(
  persist(
    (set) => ({
      activeDelivery: null,
      loggedPoints: {},
      setActiveDelivery: (d) => set({ activeDelivery: d }),
      logPoint: (routePointId, status) =>
        set((state) => ({
          loggedPoints: { ...state.loggedPoints, [routePointId]: status },
        })),
      clearSession: () => set({ activeDelivery: null, loggedPoints: {} }),
    }),
    { name: 'asahi-delivery-session' }
  )
);
