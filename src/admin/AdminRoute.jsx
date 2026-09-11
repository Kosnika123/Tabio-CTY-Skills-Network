import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AdminRoute() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      setLoading(true);

      // 1. Get the currently logged-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setIsAdmin(false);
        return;
      }

      // 2. Get the user's profile
      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        setIsAdmin(false);
        return;
      }

      // 3. Only admins are allowed
      setIsAdmin(profile.role === "admin");
    } catch (error) {
      console.error(
        "Admin authentication error:",
        error
      );

      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  // While checking Supabase
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-navy-600" />

          <p className="mt-4 text-sm font-medium text-slate-500">
            Checking permissions...
          </p>
        </div>
      </div>
    );
  }

  // Not an admin
  if (!isAdmin) {
    return <Navigate to="/login" replace />;
  }

  // Admin
  return <Outlet />;
}

