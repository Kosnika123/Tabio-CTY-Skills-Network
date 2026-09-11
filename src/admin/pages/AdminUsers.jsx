import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Users,
  UserPlus,
  MoreHorizontal,
  ChevronDown,
  ShieldCheck,
  Palette,
  BriefcaseBusiness,
  Clock3,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [openMenu, setOpenMenu] = useState(null);

  const fetchUsers = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select(
          "id, full_name, username,  role, avatar_url,  created_at"
        )
        .order("created_at", {
          ascending: false,
        });

      if (fetchError) {
        throw fetchError;
      }

      setUsers(data || []);
    } catch (err) {
      console.error("Failed to load users:", err);

      setError(
        err.message ||
          "Unable to load users. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.full_name?.toLowerCase().includes(query) ||
        user.username?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query);

      const matchesRole =
        roleFilter === "all" ||
        user.role === roleFilter;

      const matchesStatus =
        statusFilter === "all" ||
        user.status === statusFilter;

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      );
    });
  }, [
    users,
    search,
    roleFilter,
    statusFilter,
  ]);

  const getInitials = (name, username) => {
    const value = name || username || "U";

    const parts = value
      .trim()
      .split(" ")
      .filter(Boolean);

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return value.substring(0, 2).toUpperCase();
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString(
      "en-NG",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "student":
        return "Talent";

      case "client":
        return "Client";

      case "admin":
        return "Admin";

      default:
        return role || "Unknown";
    }
  };

  const getRoleIcon = (role) => {
    if (role === "admin") {
      return ShieldCheck;
    }

    if (role === "client") {
      return BriefcaseBusiness;
    }

    return Palette;
  };

  const stats = useMemo(() => {
    return {
      total: users.length,

      talent: users.filter(
        (user) => user.role === "student"
      ).length,

      clients: users.filter(
        (user) => user.role === "client"
      ).length,

      admins: users.filter(
        (user) => user.role === "admin"
      ).length,
    };
  }, [users]);

  return (
    <div className="mx-auto max-w-7xl space-y-7">

      {/* Header */}

      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">

        <div>

          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">

            <Link
              to="/admin"
              className="hover:text-navy-600"
            >
              Dashboard
            </Link>

            <span>/</span>

            <span>Users</span>

          </div>

          <h1 className="font-['Space_Grotesk'] text-3xl font-bold tracking-tight text-slate-950">
            Users
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Manage everyone using TCSN Network, from talented
            creators to clients looking for great people.
          </p>

        </div>

        <div className="flex items-center gap-3">

          <button
            onClick={() => fetchUsers(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >

            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh

          </button>

          <button
            type="button"
            className="flex items-center gap-2 rounded-xl bg-navy-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-navy-600/20 transition hover:bg-navy-700"
          >

            <UserPlus size={17} />

            Add User

          </button>

        </div>

      </div>


      {/* Stats */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          icon={Users}
          label="Total Users"
          value={stats.total}
        />

        <StatCard
          icon={Palette}
          label="Talent"
          value={stats.talent}
        />

        <StatCard
          icon={BriefcaseBusiness}
          label="Clients"
          value={stats.clients}
        />

        <StatCard
          icon={ShieldCheck}
          label="Administrators"
          value={stats.admins}
        />

      </div>


      {/* Main card */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* Toolbar */}

        <div className="border-b border-slate-100 p-4 sm:p-5">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            {/* Search */}

            <div className="relative w-full lg:max-w-md">

              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search by name, username or email..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-navy-500 focus:bg-white focus:ring-4 focus:ring-navy-500/10"
              />

            </div>


            {/* Filters */}

            <div className="flex flex-col gap-3 sm:flex-row">

              <FilterSelect
                value={roleFilter}
                onChange={setRoleFilter}
                options={[
                  ["all", "All roles"],
                  ["student", "Talent"],
                  ["client", "Clients"],
                  ["admin", "Admins"],
                ]}
              />

              <FilterSelect
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  ["all", "All status"],
                  ["active", "Active"],
                  ["pending", "Pending"],
                  ["suspended", "Suspended"],
                ]}
              />

            </div>

          </div>

        </div>


        {/* Error */}

        {error && (

          <div className="m-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <div>

              <p className="font-semibold">
                Couldn't load users
              </p>

              <p className="mt-1 text-xs leading-5">
                {error}
              </p>

              <button
                onClick={() => fetchUsers()}
                className="mt-3 text-xs font-bold underline"
              >
                Try again
              </button>

            </div>

          </div>

        )}


        {/* Loading */}

        {loading && !error && (

          <div className="divide-y divide-slate-100">

            {[1, 2, 3, 4, 5].map((item) => (

              <div
                key={item}
                className="flex items-center gap-4 p-5"
              >

                <div className="h-11 w-11 animate-pulse rounded-full bg-slate-100" />

                <div className="flex-1">

                  <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />

                  <div className="mt-2 h-3 w-56 animate-pulse rounded bg-slate-100" />

                </div>

                <div className="hidden h-7 w-20 animate-pulse rounded-full bg-slate-100 sm:block" />

              </div>

            ))}

          </div>

        )}


        {/* Empty */}

        {!loading &&
          !error &&
          filteredUsers.length === 0 && (

            <div className="px-6 py-20 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Users size={24} />
              </div>

              <h3 className="mt-5 text-base font-bold text-slate-900">
                No users found
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">
                Try changing your search or filters.
              </p>

            </div>
          )}


        {/* Desktop table */}

        {!loading &&
          !error &&
          filteredUsers.length > 0 && (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[850px]">

                <thead>

                  <tr className="border-b border-slate-100 bg-slate-50/70">

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      User
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Role
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Status
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Joined
                    </th>

                    <th className="px-5 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-100">

                  {filteredUsers.map((user) => {

                    const RoleIcon =
                      getRoleIcon(user.role);

                    return (

                      <tr
                        key={user.id}
                        className="transition hover:bg-slate-50/70"
                      >

                        {/* User */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            {user.avatar_url ? (

                              <img
                                src={user.avatar_url}
                                alt={user.full_name || "User"}
                                className="h-11 w-11 rounded-full object-cover"
                              />

                            ) : (

                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy-100 text-xs font-bold text-navy-700">
                                {getInitials(
                                  user.full_name,
                                  user.username
                                )}
                              </div>

                            )}

                            <div className="min-w-0">

                              <p className="truncate text-sm font-bold text-slate-900">
                                {user.full_name ||
                                  user.username ||
                                  "Unnamed user"}
                              </p>

                              <p className="mt-0.5 truncate text-xs text-slate-400">
                                {user.email || "No email"}
                              </p>

                            </div>

                          </div>

                        </td>


                        {/* Role */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-2">

                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                              <RoleIcon size={15} />
                            </div>

                            <span className="text-sm font-semibold text-slate-700">
                              {getRoleLabel(
                                user.role
                              )}
                            </span>

                          </div>

                        </td>


                        {/* Status */}

                        <td className="px-5 py-4">

                          <StatusBadge
                            status={user.status}
                          />

                        </td>


                        {/* Joined */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-2 text-sm text-slate-500">

                            <Clock3
                              size={15}
                              className="text-slate-400"
                            />

                            {formatDate(
                              user.created_at
                            )}

                          </div>

                        </td>


                        {/* Actions */}

                        <td className="relative px-5 py-4 text-right">

                          <button
                            onClick={() =>
                              setOpenMenu(
                                openMenu === user.id
                                  ? null
                                  : user.id
                              )
                            }
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          >

                            <MoreHorizontal
                              size={18}
                            />

                          </button>


                          {openMenu === user.id && (

                            <div className="absolute right-5 top-14 z-20 w-44 rounded-xl border border-slate-200 bg-white p-1.5 text-left shadow-xl">

                              <button
                                className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                onClick={() =>
                                  setOpenMenu(null)
                                }
                              >
                                View profile
                              </button>

                              <button
                                className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                onClick={() =>
                                  setOpenMenu(null)
                                }
                              >
                                Edit user
                              </button>

                              <button
                                className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50"
                                onClick={() =>
                                  setOpenMenu(null)
                                }
                              >
                                Suspend user
                              </button>

                            </div>

                          )}

                        </td>

                      </tr>

                    );

                  })}

                </tbody>

              </table>

            </div>

          )}

        {/* Result footer */}

        {!loading &&
          !error &&
          filteredUsers.length > 0 && (

            <div className="border-t border-slate-100 px-5 py-4">

              <p className="text-xs text-slate-400">

                Showing{" "}

                <span className="font-bold text-slate-600">
                  {filteredUsers.length}
                </span>{" "}

                of{" "}

                <span className="font-bold text-slate-600">
                  {users.length}
                </span>{" "}

                users

              </p>

            </div>

          )}

      </div>

    </div>
  );
}


/* -------------------------------- */
/* Stat Card */
/* -------------------------------- */

function StatCard({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-600">
          <Icon size={19} />
        </div>

        <span className="text-xs font-semibold text-slate-300">
          Live
        </span>

      </div>

      <p className="mt-5 text-xs font-semibold text-slate-400">
        {label}
      </p>

      <p className="mt-1 font-['Space_Grotesk'] text-2xl font-bold text-slate-950">
        {value.toLocaleString()}
      </p>

    </div>
  );
}


/* -------------------------------- */
/* Filter */
/* -------------------------------- */

function FilterSelect({
  value,
  onChange,
  options,
}) {
  return (
    <div className="relative">

      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-10 text-sm font-semibold text-slate-700 outline-none transition focus:border-navy-500 focus:ring-4 focus:ring-navy-500/10 sm:w-40"
      >

        {options.map(([optionValue, label]) => (

          <option
            key={optionValue}
            value={optionValue}
          >
            {label}
          </option>

        ))}

      </select>

      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />

    </div>
  );
}


/* -------------------------------- */
/* Status Badge */
/* -------------------------------- */

function StatusBadge({ status }) {
  const styles = {
    active:
      "bg-green-50 text-green-600",
    pending:
      "bg-amber-50 text-amber-600",
    suspended:
      "bg-red-50 text-red-600",
  };

  const labels = {
    active: "Active",
    pending: "Pending",
    suspended: "Suspended",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
        styles[status] ||
        "bg-slate-100 text-slate-500"
      }`}
    >
      {labels[status] || status || "Unknown"}
    </span>
  );
}
