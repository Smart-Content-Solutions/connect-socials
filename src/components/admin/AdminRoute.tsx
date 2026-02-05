import React from "react";
import { useUser } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  // Check for admin role in publicMetadata (support both role and base_tier fields)
  const isAdmin =
    user?.publicMetadata?.role === "admin" ||
    user?.publicMetadata?.base_tier === "admin";

  if (!isAdmin) {
    toast.error("Unauthorized Access: Admins only.");
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
