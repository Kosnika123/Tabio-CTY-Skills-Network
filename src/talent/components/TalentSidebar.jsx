import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Compass,
  FileText,
  FolderKanban,
  BriefcaseBusiness,
  Wallet,
  MessageCircle,
  UserRound,
  Settings,
  LogOut,
  X,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

import { supabase } from "../../lib/supabase";
import { useTalent } from "../context/TalentContext";
import { LogoMark } from "../../components/Logo";

const navigation = [
  {
    label: "Dashboard",
    path: "/talent",
    icon: LayoutDashboard,
  },
  {
    label: "Discover",
    path: "/talent/opportunities",
    icon: Compass,
  },
  {
    label: "My Applications",
    path: "/talent/my-applications",
    icon: FileText,
  },
  {
    label: "My Projects",
    path: "/talent/projects",
    icon: FolderKanban,
  },
  {
    label: "Portfolio",
    path: "/talent/portfolio",
    icon: BriefcaseBusiness,
  },
  {
    label: "Earnings",
    path: "/talent/earnings",
    icon: Wallet,
  },
  {
    label: "Messages",
    path: "/talent/messages",
    icon: MessageCircle,
  },
];

const accountNavigation = [
  {
    label: "Profile",
    path: "/talent/profile",
    icon: UserRound,
  },
  {
    label: "Settings",
    path: "/talent/settings",
    icon: Settings,
  },
];

export default function TalentSidebar({
  mobileOpen,
  setMobileOpen,
}) {
  const navigate = useNavigate();

  const {
    displayName,
    initials,
    profile,
    profileCompletion,
  } = useTalent();

  const [profileOpen, setProfileOpen] =
    useState(false);

  const [loggingOut, setLoggingOut] =
    useState(false);


  const logout = async () => {
    try {
      setLoggingOut(true);

      await supabase.auth.signOut();

      navigate("/login");
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    } finally {
      setLoggingOut(false);
    }
  };


  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden"
          onClick={() =>
            setMobileOpen(false)
          }
        />
      )}


      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex w-72 flex-col
          border-r border-slate-200
          bg-white
          transition-transform duration-300
          lg:translate-x-0
          ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >

        {/* Logo */}

        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6">

          <button
            onClick={() =>
              navigate("/talent")
            }
            className="flex items-center gap-3"
          >

            <LogoMark className="h-10 w-10" />

            <div className="text-left">

              <p className="font-[var(--font-display)] text-lg font-bold tracking-tight text-slate-950">
                TCS<span className="text-green-500">N</span>
              </p>

              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-navy-600">
                Talent
              </p>

            </div>

          </button>


          <button
            onClick={() =>
              setMobileOpen(false)
            }
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 lg:hidden"
          >
            <X size={19} />
          </button>

        </div>


        {/* User */}

        <div className="border-b border-slate-100 p-4">

          <button
            onClick={() =>
              setProfileOpen(
                !profileOpen
              )
            }
            className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-slate-50"
          >

            {profile?.avatar_url ? (
              <img
                src={
                  profile.avatar_url
                }
                alt={displayName}
                className="h-10 w-10 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-100 font-bold text-navy-700">
                {initials}
              </div>
            )}

            <div className="min-w-0 flex-1">

              <p className="truncate text-sm font-bold text-slate-800">
                {displayName}
              </p>

              <p className="truncate text-[10px] text-slate-400">
                {profile?.username
                  ? `@${profile.username}`
                  : "Talent"}
              </p>

            </div>

            <ChevronDown
              size={15}
              className={`text-slate-400 transition ${
                profileOpen
                  ? "rotate-180"
                  : ""
              }`}
            />

          </button>


          {profileOpen && (
            <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50 p-2">

              <button
                onClick={() => {
                  navigate(
                    "/talent/profile"
                  );
                  setMobileOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-white hover:text-navy-600"
              >
                <UserRound size={14} />
                View Profile
              </button>


              <button
                onClick={logout}
                disabled={loggingOut}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold text-red-500 hover:bg-white"
              >

                <LogOut size={14} />

                {loggingOut
                  ? "Logging out..."
                  : "Logout"}

              </button>

            </div>
          )}

        </div>


        {/* Navigation */}

        <nav className="flex-1 overflow-y-auto px-4 py-5">

          <p className="mb-3 px-3 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Workspace
          </p>


          <div className="space-y-1">

            {navigation.map(
              ({
                label,
                path,
                icon: Icon,
              }) => (

                <NavLink
                  key={path}
                  to={path}
                  end={
                    path === "/talent"
                  }
                  onClick={() =>
                    setMobileOpen(false)
                  }
                  className={({ isActive }) =>
                    `
                    group flex items-center gap-3
                    rounded-xl px-3 py-3
                    text-sm font-semibold
                    transition
                    ${
                      isActive
                        ? "bg-navy-600 text-white shadow-lg shadow-navy-600/20"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }
                    `
                  }
                >

                  {({ isActive }) => (
                    <>

                      <Icon
                        size={17}
                        className={
                          isActive
                            ? "text-white"
                            : "text-slate-400 group-hover:text-navy-500"
                        }
                      />

                      <span>
                        {label}
                      </span>


                      {label ===
                        "Messages" && (
                        <span
                          className={`ml-auto rounded-full px-2 py-0.5 text-[9px] font-bold ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-navy-50 text-navy-600"
                          }`}
                        >
                          3
                        </span>
                      )}

                    </>
                  )}

                </NavLink>

              )
            )}

          </div>


          <p className="mb-3 mt-8 px-3 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Account
          </p>


          <div className="space-y-1">

            {accountNavigation.map(
              ({
                label,
                path,
                icon: Icon,
              }) => (

                <NavLink
                  key={path}
                  to={path}
                  onClick={() =>
                    setMobileOpen(false)
                  }
                  className={({ isActive }) =>
                    `
                    flex items-center gap-3
                    rounded-xl px-3 py-3
                    text-sm font-semibold
                    transition
                    ${
                      isActive
                        ? "bg-navy-50 text-navy-700"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }
                    `
                  }
                >

                  <Icon size={17} />

                  <span>
                    {label}
                  </span>

                </NavLink>

              )
            )}

          </div>

        </nav>


        {/* Profile Completion */}

        <div className="border-t border-slate-100 p-4">

          <div className="rounded-2xl bg-slate-950 p-4 text-white">

            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-navy-500">
              <Sparkles size={15} />
            </div>

            <p className="text-xs font-bold">
              Complete your profile
            </p>

            <p className="mt-1 text-[10px] leading-4 text-slate-400">
              A complete profile helps clients
              discover you faster.
            </p>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">

              <div
                className="h-full rounded-full bg-navy-500 transition-all duration-500"
                style={{
                  width: `${profileCompletion}%`,
                }}
              />

            </div>

            <p className="mt-2 text-[9px] font-semibold text-slate-400">
              {profileCompletion}% complete
            </p>

          </div>

        </div>

      </aside>
    </>
  );
}
