import { useNavigate } from "react-router-dom";
import {
  Bell,
  Menu,
} from "lucide-react";

import { useTalent } from "../context/TalentContext";

export default function TalentTopbar({
  setMobileOpen,
}) {
  const navigate = useNavigate();

  const {
    displayName,
    initials,
    profile,
  } = useTalent();


  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">

      {/* Mobile Menu */}

      <button
        onClick={() =>
          setMobileOpen(true)
        }
        className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 lg:hidden"
      >
        <Menu size={20} />
      </button>


      {/* Workspace */}

      <div className="hidden lg:block">

        <p className="text-xs font-medium text-slate-400">
          Talent workspace
        </p>

        <p className="text-sm font-bold text-slate-800">
          Build. Create. Earn.
        </p>

      </div>


      {/* Right */}

      <div className="ml-auto flex items-center gap-2 sm:gap-3">

        {/* Notifications */}

        <button
          onClick={() =>
            navigate(
              "/talent/notifications"
            )
          }
          className="relative rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50"
        >

          <Bell size={18} />

          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-navy-600 ring-2 ring-white" />

        </button>


        {/* Profile */}

        <button
          onClick={() =>
            navigate(
              "/talent/profile"
            )
          }
          className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-50"
        >

          {profile?.avatar_url ? (
            <img
              src={
                profile.avatar_url
              }
              alt={displayName}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-100 text-xs font-bold text-navy-700">
              {initials}
            </div>
          )}

          <div className="hidden text-left sm:block">

            <p className="max-w-32 truncate text-xs font-bold text-slate-700">
              {displayName}
            </p>

            <p className="text-[9px] text-slate-400">
              Talent
            </p>

          </div>

        </button>

      </div>

    </header>
  );
}
