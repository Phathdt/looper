import { Navigate, Outlet } from "react-router-dom";
import { authStore } from "@/lib/auth-store";

export function AuthGuard() {
  const token = authStore((state) => state.token);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
