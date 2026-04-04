import { Navigate } from "react-router";
import { useAuthStore } from "../../stores/auth.store";

interface Props {
  children: React.ReactNode;
  requiredRole?: "company_admin" | "admin" | "deliverer";
  redirectTo?: string;
}

export function ProtectedRoute({ children, requiredRole, redirectTo = "/login" }: Props) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    if (user.role === "company_admin") return <Navigate to="/company" replace />;
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    return <Navigate to="/mobile" replace />;
  }

  return <>{children}</>;
}
