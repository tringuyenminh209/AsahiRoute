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
  async getAlerts() {
    const res = await api.get("/admin/dashboard/alerts");
    return res.data.data;
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
    return res.data.data;
  },
};

// ── Search ───────────────────────────────────────────────────────────────────
export const searchService = {
  async search(q: string, types?: string) {
    const res = await api.get("/admin/search", { params: { q, type: types } });
    return res.data.data;
  },
};
