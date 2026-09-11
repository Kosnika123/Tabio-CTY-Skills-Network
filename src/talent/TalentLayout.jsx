import { useState } from "react";
import { Outlet } from "react-router-dom";

import TalentSidebar from "./components/TalentSidebar";
import TalentTopbar from "./components/TalentTopbar";
import {
  TalentProvider,
  useTalent,
} from "./context/TalentContext";

export default function TalentLayout() {
  return (
    <TalentProvider>
      <TalentWorkspace />
    </TalentProvider>
  );
}


function TalentWorkspace() {
  const [mobileOpen, setMobileOpen] =
    useState(false);

  const {
    loading,
    error,
  } = useTalent();


  /*
   * Loading state
   */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">

        <div className="text-center">

          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-navy-600" />

          <p className="mt-4 text-sm font-semibold text-slate-500">
            Loading your workspace...
          </p>

        </div>

      </div>
    );
  }


  /*
   * Profile error
   */

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">

        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
            !
          </div>

          <h1 className="mt-4 text-lg font-bold text-slate-900">
            Unable to load your workspace
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error}
          </p>

        </div>

      </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-50">

      {/* Sidebar */}

      <TalentSidebar
        mobileOpen={mobileOpen}
        setMobileOpen={
          setMobileOpen
        }
      />


      {/* Main */}

      <div className="lg:pl-72">

        <TalentTopbar
          setMobileOpen={
            setMobileOpen
          }
        />

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

          <Outlet />

        </main>

      </div>

    </div>
  );
}
