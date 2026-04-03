import api from "../lib/api";

export interface RoutePoint {
  id: number;
  sequence_order: number;
  is_suspended: boolean;
  subscriber: {
    id: number;
    customer_code: string;
    name: string;
    address: string;
    address_detail: string | null;
    delivery_note: string | null;
    delivery_note_translations: Record<string, string> | null;
    newspapers: { name: string; code: string; delivery_time: string; quantity: number }[];
  };
}

export interface DeliveryRoute {
  id: number;
  name: string;
  delivery_time: "morning" | "evening";
  area: { id: number; name: string; code: string };
  total_points: number;
  active_points: number;
  suspended_count: number;
  estimated_duration_min: number | null;
  estimated_distance_m: number | null;
  points: RoutePoint[];
}

export interface DeliverySession {
  id: number;
  route_id: number;
  delivery_date: string;
  delivery_time: string;
  is_learning: boolean;
  started_at: string;
  total_points: number;
  status: string;
}

export interface DeliverySummary {
  delivery_id: number;
  route_name: string;
  delivery_date: string;
  delivery_time: string;
  started_at: string;
  completed_at: string;
  duration_minutes: number | null;
  counts: { total: number; delivered: number; skipped: number; failed: number; absent: number };
  total_distance_m: number | null;
  time_improvement_min: number | null;
  completion_rate: number;
}

export const deliveryService = {
  async getMyRoutes(date?: string, time?: "morning" | "evening"): Promise<DeliveryRoute[]> {
    const params: Record<string, string> = { date: date ?? new Date().toISOString().split("T")[0] };
    if (time) params.time = time;
    const res = await api.get<{ success: boolean; data: DeliveryRoute[] }>("/delivery/my-routes", { params });
    return res.data.data;
  },

  async startDelivery(payload: {
    route_id: number;
    delivery_date: string;
    delivery_time: "morning" | "evening";
    is_learning?: boolean;
  }): Promise<DeliverySession> {
    const res = await api.post<{ success: boolean; data: DeliverySession }>("/delivery/start", payload);
    return res.data.data;
  },

  async logPoint(payload: {
    delivery_id: number;
    route_point_id: number;
    status: "delivered" | "skipped" | "failed" | "absent";
    delivered_at: string;
    lat?: number;
    lng?: number;
    failure_reason?: string;
  }): Promise<{ log_id: number; status: string }> {
    const res = await api.post("/delivery/log", payload);
    return res.data.data;
  },

  async completeDelivery(deliveryId: number): Promise<DeliverySummary> {
    const res = await api.post<{ success: boolean; data: DeliverySummary }>(
      `/delivery/${deliveryId}/complete`
    );
    return res.data.data;
  },

  async getNotifications(unreadOnly = false, limit = 20) {
    const res = await api.get("/delivery/notifications", {
      params: { unread_only: unreadOnly, limit },
    });
    return res.data.data;
  },

  async markNotificationRead(id: string) {
    await api.put(`/delivery/notifications/${id}/read`);
  },

  async markAllNotificationsRead() {
    await api.put("/delivery/notifications/read-all");
  },

  async triggerSOS(lat: number, lng: number, notes?: string) {
    const res = await api.post("/delivery/sos", { lat, lng, notes });
    return res.data.data;
  },
};
