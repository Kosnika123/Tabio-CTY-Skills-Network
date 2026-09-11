import { NavLink, Link } from "react-router-dom";
import { LogoMark } from "../components/Logo";

import {
  LayoutDashboard,
  Users,
  Palette,
  BriefcaseBusiness,
  FolderKanban,
  CreditCard,
  Flag,
  Settings,
  X,
  LogOut,
  Sparkles,
} from "lucide-react";

const navigation = [
  {
    section: "Overview",
    items: [
      {
        name: "Dashboard",
        path: "/admin",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    section: "Management",
    items: [
      {
        name: "Users",
        path: "/admin/users",
        icon: Users,
      },
      {
        name: "Talent",
        path: "/admin/talent",
        icon: Palette,
      },
      {
        name: "Opportunities",
        path: "/admin/jobs",
        icon: BriefcaseBusiness,
      },
      {
        name: "Projects",
        path: "/admin/projects",
        icon: FolderKanban,
      },
    ],
  },
  {
    section: "Finance",
    items: [
      {
        name: "Transactions",
        path: "/admin/transactions",
        icon: CreditCard,
      },
    ],
  },
  {
    section: "Moderation",
    items: [
      {
        name: "Reports",
        path: "/admin/reports",
        icon: Flag,
      },
    ],
  },
  {
    section: "System",
    items: [
      {
        name: "Settings",
        path: "/admin/settings",
        icon: Settings,
      },
    ],
  },
];

export default function AdminSidebar({ open, setOpen }) {
  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-72 flex-col bg-slate-950 text-white transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header / Logo */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 px-6">
          <Link
            to="/admin"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2"
          >
            <LogoMark className="h-8 w-8" />

            <div>
              <p className="font-[var(--font-display)] text-base font-bold leading-none">
                TCS<span className="text-green-500">N</span>
              </p>
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Admin Panel
              </p>
            </div>
          </Link>

          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="min-h-0 flex-1 overflow-y-auto px-4 py-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {navigation.map((group) => (
            <div key={group.section} className="mb-4 last:mb-0">
              <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                {group.section}
              </p>

              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === "/admin"}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        `group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                          isActive
                            ? "bg-navy-600 text-white shadow-lg shadow-navy-600/10"
                            : "text-slate-400 hover:bg-slate-900 hover:text-white"
                        }`
                      }
                    >
                      <Icon size={18} />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="shrink-0 border-t border-slate-800 p-3">
          <Link
            to="/"
            className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-400 transition hover:bg-slate-900 hover:text-white"
          >
            <Sparkles size={18} />
            View Platform
          </Link>

          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}