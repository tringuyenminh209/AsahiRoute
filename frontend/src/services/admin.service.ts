import api from "../lib/api";

// ── Generic paginated response ───────────────────────────────────────────────
interface Paginated<T> {
  data: T[];
  meta: { current_page: number; per_page: number; total: number; last_page: number };
}

function paginated<T>(res: { data: { data: T[]; meta: Paginated<T>["meta"] } }): Paginated<T> {
  return { data: res.data.data, meta: res.data.meta };
}

// ── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardService = {
  async getSummary() {
    const res = await api.get("/admin/dashboard/summary");
    return res.data.data;
  },
  async getToday() {
    const res = await api.get("/admin/dashboard/today");
    return res.data.data;
  },
  async getAlerts(): Promise<any[]> {
    const res = await api.get("/admin/dashboard/alerts");
    // Backend returns { sos_alerts: [...], total: N } — extract the array
    return res.data.data?.sos_alerts ?? [];
  },
};

// ── Subscribers ──────────────────────────────────────────────────────────────
export const subscriberService = {
  async getList(params?: { area_id?: number; q?: string; suspended?: boolean; page?: number }) {
    const res = await api.get("/admin/subscribers", { params });
    return paginated(res);
  },
  async getById(id: number) {
    const res = await api.get(`/admin/subscribers/${id}`);
    return res.data.data;
  },
  async create(data: Record<string, unknown>) {
    const res = await api.post("/admin/subscribers", data);
    return res.data.data;
  },
  async update(id: number, data: Record<string, unknown>) {
    const res = await api.put(`/admin/subscribers/${id}`, data);
    return res.data.data;
  },
  async remove(id: number) {
    await api.delete(`/admin/subscribers/${id}`);
  },
  async exportCsv() {
    const res = await api.get("/admin/subscribers/export", { responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscribers_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },
  async importCsv(file: File) {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post("/admin/subscribers/import", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data as { imported: number; skipped: number; errors: string[] };
  },
  async updateNewspaperSchedule(
    subscriberId: number,
    subscriberNewspaperId: number,
    daySchedule: Record<string, number | null> | null,
    deliveryDays?: number[] | null
  ) {
    const body: Record<string, unknown> = { day_schedule: daySchedule };
    if (deliveryDays !== undefined) body.delivery_days = deliveryDays;
    const res = await api.put(
      `/admin/subscribers/${subscriberId}/newspapers/${subscriberNewspaperId}/schedule`,
      body
    );
    return res.data.data;
  },
};

// ── Special Days (holidays) ──────────────────────────────────────────────────
export const specialDayService = {
  async getList(year?: number, month?: number) {
    const res = await api.get("/admin/special-days", { params: { year, month } });
    return res.data.data as { id: number; date: string; name: string; day_type: string; note: string | null }[];
  },
  async create(data: { date: string; name: string; day_type?: string; note?: string }) {
    const res = await api.post("/admin/special-days", data);
    return res.data.data;
  },
  async remove(id: number) {
    await api.delete(`/admin/special-days/${id}`);
  },
};

// ── Routes ───────────────────────────────────────────────────────────────────
export const routeService = {
  async getList(params?: { area_id?: number; delivery_time?: string; page?: number }) {
    const res = await api.get("/admin/routes", { params });
    return paginated(res);
  },
  async getById(id: number) {
    const res = await api.get(`/admin/routes/${id}`);
    return res.data.data;
  },
  async reorder(id: number, orders: { id: number; sequence_order: number }[]) {
    await api.put(`/admin/routes/${id}/reorder`, { orders });
  },
  async optimize(id: number) {
    const res = await api.post(`/admin/routes/${id}/optimize`);
    return res.data.data;
  },
  async getPrint(id: number) {
    const res = await api.get(`/admin/routes/${id}/print`);
    return res.data.data;
  },
  async assign(id: number, userId: number) {
    await api.post(`/admin/routes/${id}/assign`, { user_id: userId });
  },
};

// ── Suspensions ───────────────────────────────────────────────────────────────
export const suspensionService = {
  async getList(params?: { status?: string; from?: string; to?: string; page?: number }) {
    const res = await api.get("/admin/suspensions", { params });
    return paginated(res);
  },
  async getCalendar(year: number, month: number) {
    const res = await api.get("/admin/suspensions/calendar", { params: { year, month } });
    return res.data.data;
  },
  async create(data: Record<string, unknown>) {
    const res = await api.post("/admin/suspensions", data);
    return res.data.data;
  },
  async update(id: number, data: Record<string, unknown>) {
    const res = await api.put(`/admin/suspensions/${id}`, data);
    return res.data.data;
  },
  async cancel(id: number) {
    await api.delete(`/admin/suspensions/${id}`);
  },
};

// ── Insertions ───────────────────────────────────────────────────────────────
export const insertionService = {
  async getList(params?: { status?: string; page?: number }) {
    const res = await api.get("/admin/insertions", { params });
    return paginated(res);
  },
  async approve(id: number) {
    const res = await api.post(`/admin/insertions/${id}/approve`);
    return res.data.data;
  },
  async reject(id: number) {
    await api.post(`/admin/insertions/${id}/reject`);
  },
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const userService = {
  async getList(params?: { role?: string }) {
    const res = await api.get("/admin/users", { params });
    return res.data.data;
  },
  async getPerformance(id: number, days = 30) {
    const res = await api.get(`/admin/users/${id}/performance`, { params: { days } });
    return res.data.data;
  },
  async create(data: Record<string, unknown>) {
    const res = await api.post("/admin/users", data);
    return res.data.data;
  },
  async update(id: number, data: Record<string, unknown>) {
    const res = await api.put(`/admin/users/${id}`, data);
    return res.data.data;
  },
  async remove(id: number) {
    await api.delete(`/admin/users/${id}`);
  },
};

// ── Reports ──────────────────────────────────────────────────────────────────
export const reportService = {
  async getDaily(date?: string) {
    const res = await api.get("/admin/reports/daily", { params: date ? { date } : {} });
    return res.data.data;
  },
  async getWeekly() {
    const res = await api.get("/admin/reports/weekly");
    return res.data.data;
  },
  async getMonthly(year?: number, month?: number) {
    const res = await api.get("/admin/reports/monthly", { params: { year, month } });
    return res.data.data;
  },
  async getAreaStats(from: string, to: string) {
    const res = await api.get("/admin/reports/area-stats", { params: { from, to } });
    return res.data.data as { id: number; name: string; sessions: number; delivered: number; total_points: number }[];
  },
  async getUserPerformance(from: string, to: string) {
    const res = await api.get("/admin/reports/user-performance", { params: { from, to } });
    return res.data.data as { id: number; name: string; sessions: number; delivered: number; total_points: number; avg_duration_min: number; completion_rate: number }[];
  },
  async getHourly(date?: string) {
    const res = await api.get("/admin/reports/hourly", { params: date ? { date } : {} });
    return (res.data.data?.hours ?? []) as { hour: string; deliveries: number; rate: number }[];
  },
};

// ── SOS Alerts ───────────────────────────────────────────────────────────────
export const sosAlertService = {
  async getList(params?: { status?: string }) {
    const res = await api.get("/admin/sos-alerts", { params });
    return paginated(res);
  },
  async acknowledge(id: number) {
    const res = await api.put(`/admin/sos-alerts/${id}/acknowledge`);
    return res.data.data;
  },
  async resolve(id: number, notes?: string) {
    const res = await api.put(`/admin/sos-alerts/${id}/resolve`, { notes });
    return res.data.data;
  },
};

// ── Areas ─────────────────────────────────────────────────────────────────────
export const areaService = {
  async getList() {
    const res = await api.get("/admin/areas");
    return res.data.data as {
      id: number; name: string; code: string; color: string | null;
      subscribers_count: number; routes_count: number;
    }[];
  },
  async create(data: { name: string; code: string; color?: string }) {
    const res = await api.post("/admin/areas", data);
    return res.data.data;
  },
  async update(id: number, data: { name?: string; code?: string; color?: string }) {
    const res = await api.put(`/admin/areas/${id}`, data);
    return res.data.data;
  },
  async remove(id: number) {
    await api.delete(`/admin/areas/${id}`);
  },
};

// ── Newspaper Types ──────────────────────────────────────────────────────────
export const newspaperTypeService = {
  async getList() {
    const res = await api.get("/admin/newspaper-types");
    return res.data.data as { id: number; name: string; code: string; delivery_time: 'morning' | 'evening' }[];
  },
  async create(data: { name: string; code: string; delivery_time: 'morning' | 'evening' }) {
    const res = await api.post("/admin/newspaper-types", data);
    return res.data.data;
  },
  async update(id: number, data: Partial<{ name: string; code: string; delivery_time: 'morning' | 'evening' }>) {
    const res = await api.put(`/admin/newspaper-types/${id}`, data);
    return res.data.data;
  },
  async remove(id: number) {
    await api.delete(`/admin/newspaper-types/${id}`);
  },
};

// ── Audit Logs ───────────────────────────────────────────────────────────────
export const auditLogService = {
  async getList(params?: { action?: string; user_id?: number; from?: string; to?: string; page?: number }) {
    const res = await api.get("/admin/audit-logs", { params });
    return res.data as { data: any[]; meta: { current_page: number; last_page: number; total: number } };
  },
  async exportCsv() {
    const res = await api.get("/admin/audit-logs/export", { responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },
};

// ── Shifts ───────────────────────────────────────────────────────────────────
export interface Shift {
  id: number;
  user_id: number;
  route_id: number;
  substitute_user_id: number | null;
  shift_date: string;
  shift_type: 'morning' | 'evening' | 'both';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  user?: { id: number; name: string };
  route?: { id: number; name: string; area?: { name: string } };
  substitute_user?: { id: number; name: string } | null;
}

export const shiftService = {
  async getShifts(from?: string, to?: string) {
    const res = await api.get('/admin/shifts', { params: { from, to } });
    return res.data.data as Shift[];
  },
  async getCalendar(year: number, month: number) {
    const res = await api.get('/admin/shifts/calendar', { params: { year, month } });
    return res.data.data as { year: number; month: number; calendar: Record<string, Shift[]> };
  },
  async createShift(data: { user_id: number; route_id: number; shift_date: string; shift_type: string }) {
    const res = await api.post('/admin/shifts', data);
    return res.data.data as Shift;
  },
  async updateShift(id: number, data: Partial<Pick<Shift, 'shift_date' | 'shift_type' | 'status' | 'substitute_user_id'>>) {
    const res = await api.put(`/admin/shifts/${id}`, data);
    return res.data.data as Shift;
  },
  async deleteShift(id: number) {
    await api.delete(`/admin/shifts/${id}`);
  },
};

// ── Search ───────────────────────────────────────────────────────────────────
export const searchService = {
  async search(q: string, types?: string) {
    const res = await api.get("/admin/search", { params: { q, type: types } });
    return res.data.data;
  },
};
