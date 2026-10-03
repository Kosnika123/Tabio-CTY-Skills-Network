import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Search,
  ArrowUpRight,
  User,
  LayoutDashboard,
  FileText,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Loader2,
} from "lucide-react";
import Logo from "./Logo";
import { supabase } from "../lib/supabase";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const profileRef = useRef(null);
  const navigate = useNavigate();

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

  /* ---------------------------------------------
     Load authenticated user
  --------------------------------------------- */

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      try {
        setLoadingUser(true);

        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (!mounted) return;

        setUser(currentUser || null);

        if (currentUser) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select(`
              id,
              full_name,
              username,
              avatar_url,
              role
            `)
            .eq("id", currentUser.id)
            .maybeSingle();

          if (mounted) {
            setProfile(profileData || null);
          }
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Failed to load navbar user:", error);

        if (mounted) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mounted) {
          setLoadingUser(false);
        }
      }
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      const currentUser = session?.user || null;

      setUser(currentUser);

      if (!currentUser) {
        setProfile(null);
        setProfileOpen(false);
        setMobileProfileOpen(false);
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          username,
          avatar_url,
          role
        `)
        .eq("id", currentUser.id)
        .maybeSingle();

      if (mounted) {
        setProfile(profileData || null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /* ---------------------------------------------
     Close profile dropdown when clicking outside
  --------------------------------------------- */

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /* ---------------------------------------------
     User information
  --------------------------------------------- */

  const displayName =
    profile?.full_name ||
    profile?.username ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Account";

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name[0]?.toUpperCase())
    .join("");

  const role = profile?.role || "talent";

  const isAdmin = role === "admin";

  const dashboardPath = isAdmin ? "/admin" : "/talent";

  /* ---------------------------------------------
     Logout
  --------------------------------------------- */

  const handleLogout = async () => {
    try {
      setLoggingOut(true);

      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      setProfileOpen(false);
      setMobileProfileOpen(false);
      setMobileOpen(false);

      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      alert(error?.message || "Unable to sign out.");
    } finally {
      setLoggingOut(false);
    }
  };

  /* ---------------------------------------------
     Close mobile menu
  --------------------------------------------- */

  const closeMobileMenu = () => {
    setMobileOpen(false);
    setMobileProfileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
        {/* Logo */}

        <Link
          to="/"
          className="flex items-center gap-2"
          onClick={closeMobileMenu}
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
          {/* Search */}

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            aria-label="Search"
          >
            <Search size={19} />
          </button>

          {/* Loading User */}

          {loadingUser ? (
            <div className="flex h-10 items-center px-3">
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            </div>
          ) : !user ? (
            <>
              {/* Logged Out */}

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
            </>
          ) : (
            <>
              {/* Logged In */}

              <div ref={profileRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((current) => !current)}
                  className="group flex items-center gap-2.5 rounded-xl border border-transparent px-2 py-1.5 transition hover:border-slate-200 hover:bg-slate-50"
                  aria-expanded={profileOpen}
                  aria-haspopup="menu"
                >
                  {/* Avatar */}

                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={displayName}
                      className="h-9 w-9 rounded-full object-cover ring-2 ring-slate-100"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white ring-2 ring-slate-100">
                      {initials || "U"}
                    </div>
                  )}

                  <div className="hidden text-left xl:block">
                    <p className="max-w-[130px] truncate text-sm font-semibold text-slate-900">
                      {displayName}
                    </p>

                    <p className="text-[11px] capitalize text-slate-400">
                      {role}
                    </p>
                  </div>

                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 transition-transform ${
                      profileOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Desktop Dropdown */}

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-3 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
                    {/* Profile Header */}

                    <div className="border-b border-slate-100 bg-slate-50/80 p-4">
                      <div className="flex items-center gap-3">
                        {profile?.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt={displayName}
                            className="h-11 w-11 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                            {initials || "U"}
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900">
                            {displayName}
                          </p>

                          {profile?.username && (
                            <p className="truncate text-xs text-slate-500">
                              @{profile.username}
                            </p>
                          )}

                          {!profile?.username && user?.email && (
                            <p className="truncate text-xs text-slate-500">
                              {user.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Menu */}

                    <div className="p-2">
                      <Link
                        to={dashboardPath}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                          <LayoutDashboard className="h-4 w-4" />
                        </div>

                        <div>
                          <p className="font-semibold">
                            {isAdmin ? "Admin Dashboard" : "My Dashboard"}
                          </p>
                          <p className="text-xs text-slate-400">
                            {isAdmin
                              ? "Manage SkillForge"
                              : "Manage your account"}
                          </p>
                        </div>
                      </Link>

                      {!isAdmin && (
                        <Link
                          to="/talent/applications"
                          onClick={() => setProfileOpen(false)}
                          className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-50 text-navy-600">
                            <FileText className="h-4 w-4" />
                          </div>

                          <div>
                            <p className="font-semibold">
                              My Applications
                            </p>
                            <p className="text-xs text-slate-400">
                              Track your applications
                            </p>
                          </div>
                        </Link>
                      )}

                      {isAdmin && (
                        <Link
                          to="/admin/applications"
                          onClick={() => setProfileOpen(false)}
                          className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-50 text-navy-600">
                            <ShieldCheck className="h-4 w-4" />
                          </div>

                          <div>
                            <p className="font-semibold">
                              Applications
                            </p>
                            <p className="text-xs text-slate-400">
                              Review talent applications
                            </p>
                          </div>
                        </Link>
                      )}

                      <Link
                        to="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                          <User className="h-4 w-4" />
                        </div>

                        <div>
                          <p className="font-semibold">My Profile</p>
                          <p className="text-xs text-slate-400">
                            View and edit your profile
                          </p>
                        </div>
                      </Link>
                    </div>

                    {/* Logout */}

                    <div className="border-t border-slate-100 p-2">
                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
                          {loggingOut ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <LogOut className="h-4 w-4" />
                          )}
                        </div>

                        {loggingOut ? "Signing out..." : "Sign out"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100 lg:hidden"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Navigation */}

      <div
        className={`overflow-hidden border-t border-slate-200 bg-white transition-all duration-300 lg:hidden ${
          mobileOpen
            ? "max-h-[700px] opacity-100"
            : "max-h-0 opacity-0"
        }`}
      >
        <div className="mx-auto max-w-7xl px-5 py-6 sm:px-6">
          {/* Navigation */}

          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={closeMobileMenu}
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

          {/* Mobile User Actions */}

          <div className="mt-5">
            {loadingUser ? (
              <div className="flex items-center justify-center rounded-xl border border-slate-200 py-3">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            ) : !user ? (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Sign in
                </Link>

                <Link
                  to="/register"
                  onClick={closeMobileMenu}
                  className="rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-navy-600"
                >
                  Join
                </Link>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {/* Mobile User Header */}

                <button
                  type="button"
                  onClick={() =>
                    setMobileProfileOpen((current) => !current)
                  }
                  className="flex w-full items-center justify-between bg-slate-50/80 p-4"
                  aria-expanded={mobileProfileOpen}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={displayName}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                        {initials || "U"}
                      </div>
                    )}

                    <div className="min-w-0 text-left">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {displayName}
                      </p>

                      <p className="text-xs capitalize text-slate-400">
                        {role}
                      </p>
                    </div>
                  </div>

                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${
                      mobileProfileOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {mobileProfileOpen && (
                  <div className="border-t border-slate-100 p-2">
                    <Link
                      to={dashboardPath}
                      onClick={closeMobileMenu}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <LayoutDashboard className="h-4 w-4 text-slate-500" />
                      {isAdmin ? "Admin Dashboard" : "My Dashboard"}
                    </Link>

                    {!isAdmin && (
                      <Link
                        to="/talent/applications"
                        onClick={closeMobileMenu}
                        className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <FileText className="h-4 w-4 text-navy-600" />
                        My Applications
                      </Link>
                    )}

                    {isAdmin && (
                      <Link
                        to="/admin/applications"
                        onClick={closeMobileMenu}
                        className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <ShieldCheck className="h-4 w-4 text-navy-600" />
                        Applications
                      </Link>
                    )}

                    <Link
                      to="/profile"
                      onClick={closeMobileMenu}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <User className="h-4 w-4 text-slate-500" />
                      My Profile
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      {loggingOut ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <LogOut className="h-4 w-4" />
                      )}

                      {loggingOut ? "Signing out..." : "Sign out"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}