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
  loggedPoints: Record<number, PointStatus>;   // routePointId → status
  pointOrder: Record<string, number[]>;         // routeId → [pointId, ...] custom order
  useCustomOrder: Record<string, boolean>;      // routeId → whether custom order is active
  sessionDate: string | null;

  setActiveDelivery: (d: ActiveDelivery | null) => void;
  logPoint: (routePointId: number, status: PointStatus) => void;
  hydratePoints: (points: Record<number, PointStatus>) => void;
  setPointOrder: (routeId: string, order: number[]) => void;
  resetPointOrder: (routeId: string) => void;
  setUseCustomOrder: (routeId: string, value: boolean) => void;
  clearSession: () => void;
  resetIfNewDay: (today: string) => void;
}

export const useDeliveryStore = create<DeliveryStore>()(
  persist(
    (set, get) => ({
      activeDelivery: null,
      loggedPoints: {},
      pointOrder: {},
      useCustomOrder: {},
      sessionDate: null,

      setActiveDelivery: (d) =>
        set({
          activeDelivery: d,
          sessionDate: d ? new Date().toISOString().split('T')[0] : get().sessionDate,
        }),

      logPoint: (routePointId, status) =>
        set((state) => ({
          loggedPoints: { ...state.loggedPoints, [routePointId]: status },
        })),

      hydratePoints: (points) =>
        set((state) => ({
          // Server data is base; local optimistic updates take precedence
          loggedPoints: { ...points, ...state.loggedPoints },
        })),

      setPointOrder: (routeId, order) =>
        set((state) => ({
          pointOrder: { ...state.pointOrder, [routeId]: order },
        })),

      resetPointOrder: (routeId) =>
        set((state) => {
          const newOrder = { ...state.pointOrder };
          delete newOrder[routeId];
          const newCustom = { ...state.useCustomOrder };
          delete newCustom[routeId];
          return { pointOrder: newOrder, useCustomOrder: newCustom };
        }),

      setUseCustomOrder: (routeId, value) =>
        set((state) => ({
          useCustomOrder: { ...state.useCustomOrder, [routeId]: value },
        })),

      clearSession: () =>
        set({ activeDelivery: null, loggedPoints: {}, pointOrder: {}, useCustomOrder: {}, sessionDate: null }),

      resetIfNewDay: (today) => {
        const { sessionDate } = get();
        if (sessionDate && sessionDate !== today) {
          set({ activeDelivery: null, loggedPoints: {}, pointOrder: {}, useCustomOrder: {}, sessionDate: null });
        }
      },
    }),
    { name: 'asahi-delivery-session' }
  )
);
