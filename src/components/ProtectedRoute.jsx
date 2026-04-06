import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ requiredRole }) {
  const { currentUser, userProfile, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) return <Navigate to="/login" replace />;

  if (requiredRole && userProfile?.user_role !== requiredRole) {
    if (userProfile?.user_role === "client") return <Navigate to="/client" replace />;
    if (userProfile?.user_role === "student") return <Navigate to="/student" replace />;
    return <Navigate to="/profile-setup" replace />;
  }

  return <Outlet />;
}
