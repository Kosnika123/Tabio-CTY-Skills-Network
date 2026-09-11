
import { Outlet } from "react-router-dom";
import { useState } from "react";

import AdminSidebar from "./AdminSidebar";
import AdminNavbar from "./AdminNavbar";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100">

      <AdminSidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
      />

      <div className="lg:pl-72">

        <AdminNavbar
          setSidebarOpen={setSidebarOpen}
        />

        <main className="p-5 sm:p-6 lg:p-8">
          <Outlet />
        </main>

      </div>

    </div>
  );
}

