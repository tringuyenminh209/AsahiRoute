import { Navigate } from "react-router";
import { useAuthStore } from "../../stores/auth.store";

interface Props {
  children: React.ReactNode;
  requiredRole?: "admin" | "deliverer";
  redirectTo?: string;
}

export function ProtectedRoute({ children, requiredRole, redirectTo = "/login" }: Props) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // Admin が /login に飛んでしまわないよう分岐
    return <Navigate to={user.role === "admin" ? "/admin" : "/mobile"} replace />;
  }

  return <>{children}</>;
}
