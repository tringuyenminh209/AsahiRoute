import { createBrowserRouter } from "react-router";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Onboarding } from "./pages/Onboarding";
import { Home } from "./pages/Home";
import { RouteMap } from "./pages/RouteMap";
import { RouteList } from "./pages/RouteList";
import { DeliveryPointDetail } from "./pages/DeliveryPointDetail";
import { DeliverySummary } from "./pages/DeliverySummary";
import { Notifications } from "./pages/Notifications";
import { DeliveryInventory } from "./pages/DeliveryInventory";
import { DeliveryStatusManagement } from "./pages/DeliveryStatusManagement";
import { Settings } from "./pages/Settings";
import { LearnMode } from "./pages/LearnMode";
import { SOS } from "./pages/SOS";
import { Profile } from "./pages/Profile";
import { RootLayout } from "./layouts/RootLayout";

// Company imports
import { CompanyLayout } from "./layouts/CompanyLayout";
import { Dashboard as CompanyDashboard } from "./pages/company/Dashboard";
import { ShopManagement } from "./pages/company/ShopManagement";

// Admin imports
import { AdminLayout } from "./layouts/AdminLayout";
import { AdminLogin } from "./pages/admin/AdminLogin";
import { Dashboard } from "./pages/admin/Dashboard";
import { AreaManagement } from "./pages/admin/AreaManagement";
import { SubscriberManagement } from "./pages/admin/SubscriberManagement";
import { SubscriberDetail } from "./pages/admin/SubscriberDetail";
import { RouteManagement } from "./pages/admin/RouteManagement";
import { RouteEdit } from "./pages/admin/RouteEdit";
import { RoutePrint } from "./pages/admin/RoutePrint";
import { SuspensionManagement } from "./pages/admin/SuspensionManagement";
import { InsertionManagement } from "./pages/admin/InsertionManagement";
import { UserManagement } from "./pages/admin/UserManagement";
import { LiveTracking } from "./pages/admin/LiveTracking";
import { Reports } from "./pages/admin/Reports";
import { AuditLog } from "./pages/admin/AuditLog";
import { Settings as AdminSettings } from "./pages/admin/Settings";
import { ShiftManagement } from "./pages/admin/ShiftManagement";

export const router = createBrowserRouter([
  { path: "/", Component: Landing },
  { path: "/login", Component: Login },
  { path: "/admin/login", Component: AdminLogin },
  { path: "/onboarding", Component: Onboarding },

  // ── Mobile (deliverer) ──────────────────────────────────────────────
  {
    path: "/mobile",
    element: (
      <ProtectedRoute requiredRole="deliverer" redirectTo="/login">
        <RootLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: Home },
      { path: "route/:id/map", Component: RouteMap },
      { path: "route/:id/list", Component: RouteList },
      { path: "route/:id/point/:pointId", Component: DeliveryPointDetail },
      { path: "delivery/:id/summary", Component: DeliverySummary },
      { path: "notifications", Component: Notifications },
      { path: "delivery-inventory", Component: DeliveryInventory },
      { path: "delivery-status-management", Component: DeliveryStatusManagement },
      { path: "settings", Component: Settings },
      { path: "route/:id/learn", Component: LearnMode },
      { path: "sos", Component: SOS },
      { path: "profile", Component: Profile },
    ],
  },

  // ── Company ─────────────────────────────────────────────────────────
  {
    path: "/company",
    element: (
      <ProtectedRoute requiredRole="company_admin" redirectTo="/login">
        <CompanyLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: CompanyDashboard },
      { path: "shops", Component: ShopManagement },
    ],
  },

  // ── Admin ───────────────────────────────────────────────────────────
  {
    path: "/admin",
    element: (
      <ProtectedRoute requiredRole="admin" redirectTo="/admin/login">
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: Dashboard },
      { path: "areas", Component: AreaManagement },
      { path: "subscribers", Component: SubscriberManagement },
      { path: "subscribers/:id", Component: SubscriberDetail },
      { path: "routes", Component: RouteManagement },
      { path: "routes/:id/edit", Component: RouteEdit },
      { path: "routes/:id/print", Component: RoutePrint },
      { path: "suspensions", Component: SuspensionManagement },
      { path: "insertions", Component: InsertionManagement },
      { path: "users", Component: UserManagement },
      { path: "shifts", Component: ShiftManagement },
      { path: "deliveries/live", Component: LiveTracking },
      { path: "reports", Component: Reports },
      { path: "audit-log", Component: AuditLog },
      { path: "settings", Component: AdminSettings },
    ],
  },
]);
