import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Menu,
  X,
  Search,
  ArrowUpRight,
} from "lucide-react";
import Logo from "./Logo";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    {
      name: "Talent",
      path: "/talent",
    },
    {
      name: "Projects",
      path: "/projects",
    },
    {
      name: "Opportunities",
      path: "/opportunities",
    },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">

      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">

        {/* Logo */}

        <Link
          to="/"
          className="flex items-center gap-2"
          onClick={() => setMobileOpen(false)}
        >
          <Logo />
        </Link>

        {/* Desktop Navigation */}

        <nav className="hidden items-center gap-8 lg:flex">

          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `relative text-sm font-medium transition-colors ${
                  isActive
                    ? "text-navy-600"
                    : "text-slate-600 hover:text-slate-950"
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}

        </nav>

        {/* Desktop Actions */}

        <div className="hidden items-center gap-3 lg:flex">

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            aria-label="Search"
          >
            <Search size={19} />
          </button>

          <Link
            to="/login"
            className="px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:text-slate-950"
          >
            Sign in
          </Link>

          <Link
            to="/register"
            className="group flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition duration-300 hover:bg-navy-600"
          >
            Join TCSN

            <ArrowUpRight
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>

        </div>

        {/* Mobile Menu Button */}

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100 lg:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

      </div>

      {/* Mobile Navigation */}

      <div
        className={`overflow-hidden border-t border-slate-200 bg-white transition-all duration-300 lg:hidden ${
          mobileOpen
            ? "max-h-[500px] opacity-100"
            : "max-h-0 opacity-0"
        }`}
      >

        <div className="mx-auto max-w-7xl px-5 py-6 sm:px-6">

          <nav className="flex flex-col gap-1">

            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-navy-50 text-navy-600"
                      : "text-slate-700 hover:bg-slate-50"
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}

          </nav>

          <div className="mt-5 grid grid-cols-2 gap-3">

            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700"
            >
              Sign in
            </Link>

            <Link
              to="/register"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white"
            >
              Join
            </Link>

          </div>

        </div>

      </div>

    </header>
  );
}