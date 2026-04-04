import api from "../lib/api";

export interface CompanyShop {
  id: number;
  company_id: number;
  name: string;
  code: string;
  address: string;
  phone: string;
  emergency_phone: string | null;
  lat: number | null;
  lng: number | null;
  users_count?: number;
  areas_count?: number;
}

export interface ShopUser {
  id: number;
  shop_id: number;
  name: string;
  email: string;
  phone: string | null;
  role: "admin" | "deliverer";
  created_at: string;
}

export interface CompanyDashboard {
  total_shops: number;
  total_admins: number;
  total_deliverers: number;
  total_subscribers: number;
  today_deliveries: number;
  shops: { id: number; name: string; code: string; users_count: number; areas_count: number }[];
}

export const companyService = {
  async getDashboard(): Promise<CompanyDashboard> {
    const res = await api.get("/company/dashboard");
    return res.data.data;
  },

  async getShops(): Promise<CompanyShop[]> {
    const res = await api.get("/company/shops");
    return res.data.data;
  },

  async getShop(id: number): Promise<CompanyShop> {
    const res = await api.get(`/company/shops/${id}`);
    return res.data.data;
  },

  async createShop(data: Omit<CompanyShop, "id" | "company_id" | "users_count" | "areas_count">): Promise<CompanyShop> {
    const res = await api.post("/company/shops", data);
    return res.data.data;
  },

  async updateShop(id: number, data: Partial<CompanyShop>): Promise<CompanyShop> {
    const res = await api.put(`/company/shops/${id}`, data);
    return res.data.data;
  },

  async deleteShop(id: number): Promise<void> {
    await api.delete(`/company/shops/${id}`);
  },

  async getShopUsers(shopId: number): Promise<ShopUser[]> {
    const res = await api.get(`/company/shops/${shopId}/users`);
    return res.data.data;
  },

  async addShopUser(shopId: number, data: { name: string; email: string; phone?: string; role: "admin" | "deliverer"; password: string }): Promise<ShopUser> {
    const res = await api.post(`/company/shops/${shopId}/users`, data);
    return res.data.data;
  },
};
