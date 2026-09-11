
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
} from "lucide-react";

export default function AdminNavbar({
  setSidebarOpen,
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl">

      <div className="flex h-20 items-center justify-between px-5 sm:px-6 lg:px-8">

        {/* Left */}

        <div className="flex items-center gap-4">

          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <Menu size={21} />
          </button>

          <div className="hidden sm:block">

            <p className="text-xs font-medium text-slate-400">
              Administration
            </p>

            <h1 className="text-lg font-bold text-slate-950">
              Overview
            </h1>

          </div>

        </div>


        {/* Right */}

        <div className="flex items-center gap-2 sm:gap-4">

          {/* Search */}

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <Search size={19} />
          </button>


          {/* Notifications */}

          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >

            <Bell size={19} />

            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-navy-600 ring-2 ring-white" />

          </button>


          {/* Profile */}

          <div className="ml-1 flex items-center gap-3 border-l border-slate-200 pl-3 sm:ml-2 sm:pl-4">

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-100 text-sm font-bold text-navy-700">
              A
            </div>

            <div className="hidden sm:block">

              <p className="text-sm font-bold text-slate-900">
                Administrator
              </p>

              <p className="text-xs text-slate-400">
                Super Admin
              </p>

            </div>

            <ChevronDown
              size={16}
              className="hidden text-slate-400 sm:block"
            />

          </div>

        </div>

      </div>

    </header>
  );
}

