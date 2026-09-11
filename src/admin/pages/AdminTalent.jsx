import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Palette,
  Code2,
  Video,
  Camera,
  PenTool,
  Megaphone,
  MoreHorizontal,
  RefreshCw,
  Star,
  MapPin,
  CheckCircle2,
  Clock3,
  AlertCircle,
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

export default function AdminTalent() {
  const [talent, setTalent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [error, setError] = useState("");
  const [openMenu, setOpenMenu] = useState(null);

  const fetchTalent = async (isRefresh = false) => {
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
          `
            id,
            full_name,
            username,
            role,
            avatar_url,
            bio,
            location,
            created_at
          `
        )
        .eq("role", "student")
        .order("created_at", {
          ascending: false,
        });

      if (fetchError) {
        throw fetchError;
      }

      setTalent(data || []);
    } catch (err) {
      console.error("Failed to load talent:", err);

      setError(
        err.message ||
          "Unable to load talent. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTalent();
  }, []);

  const filteredTalent = useMemo(() => {
    const query = search.trim().toLowerCase();

    return talent.filter((person) => {
      const matchesSearch =
        !query ||
        person.full_name
          ?.toLowerCase()
          .includes(query) ||
        person.username
          ?.toLowerCase()
          .includes(query) ||
        person.email
          ?.toLowerCase()
          .includes(query) ||
        person.bio
          ?.toLowerCase()
          .includes(query) ||
        person.location
          ?.toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        person.status === statusFilter;

      /*
       * Skill filtering will become fully dynamic
       * when we create the talent_skills table.
       *
       * For now the filter remains ready for that
       * database connection.
       */
      const matchesSkill =
        skillFilter === "all" ||
        true;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesSkill
      );
    });
  }, [
    talent,
    search,
    skillFilter,
    statusFilter,
  ]);

  const stats = useMemo(() => {
    return {
      total: talent.length,

      active: talent.filter(
        (person) => person.status === "active"
      ).length,

      pending: talent.filter(
        (person) => person.status === "pending"
      ).length,

      suspended: talent.filter(
        (person) => person.status === "suspended"
      ).length,
    };
  }, [talent]);

  const getInitials = (name, username) => {
    const value = name || username || "TA";

    const parts = value
      .trim()
      .split(" ")
      .filter(Boolean);

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return value
      .substring(0, 2)
      .toUpperCase();
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

  return (
    <div className="mx-auto max-w-7xl space-y-7">

      {/* ================================= */}
      {/* HEADER */}
      {/* ================================= */}

      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">

        <div>

          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">

            <Link
              to="/admin"
              className="transition hover:text-navy-600"
            >
              Dashboard
            </Link>

            <span>/</span>

            <span>Talent</span>

          </div>

          <h1 className="font-['Space_Grotesk'] text-3xl font-bold tracking-tight text-slate-950">
            Talent
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Manage the talented people showcasing their
            skills and finding opportunities on TCSN Network.
          </p>

        </div>

        <button
          type="button"
          onClick={() => fetchTalent(true)}
          disabled={refreshing}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
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

      </div>


      {/* ================================= */}
      {/* STATS */}
      {/* ================================= */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <TalentStat
          icon={Users}
          label="Total Talent"
          value={stats.total}
        />

        <TalentStat
          icon={UserCheck}
          label="Active"
          value={stats.active}
        />

        <TalentStat
          icon={Clock3}
          label="Pending Review"
          value={stats.pending}
        />

        <TalentStat
          icon={UserX}
          label="Suspended"
          value={stats.suspended}
        />

      </div>


      {/* ================================= */}
      {/* TALENT MANAGEMENT */}
      {/* ================================= */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* Toolbar */}

        <div className="border-b border-slate-100 p-4 sm:p-5">

          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

            {/* Search */}

            <div className="relative w-full xl:max-w-md">

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
                placeholder="Search talent..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-navy-500 focus:bg-white focus:ring-4 focus:ring-navy-500/10"
              />

            </div>


            {/* Filters */}

            <div className="flex flex-col gap-3 sm:flex-row">

              <FilterSelect
                value={skillFilter}
                onChange={setSkillFilter}
                options={[
                  ["all", "All skills"],
                  ["development", "Development"],
                  ["design", "Graphic Design"],
                  ["uiux", "UI / UX"],
                  ["video", "Video Editing"],
                  ["photography", "Photography"],
                  ["writing", "Writing"],
                  ["marketing", "Marketing"],
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


        {/* ================================= */}
        {/* ERROR */}
        {/* ================================= */}

        {error && (

          <div className="m-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <div>

              <p className="font-semibold">
                Couldn't load talent
              </p>

              <p className="mt-1 text-xs leading-5">
                {error}
              </p>

              <button
                onClick={() => fetchTalent()}
                className="mt-3 text-xs font-bold underline"
              >
                Try again
              </button>

            </div>

          </div>

        )}


        {/* ================================= */}
        {/* LOADING */}
        {/* ================================= */}

        {loading && !error && (

          <div className="divide-y divide-slate-100">

            {[1, 2, 3, 4, 5].map(
              (item) => (

                <div
                  key={item}
                  className="flex items-center gap-4 p-5"
                >

                  <div className="h-12 w-12 animate-pulse rounded-full bg-slate-100" />

                  <div className="flex-1">

                    <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />

                    <div className="mt-2 h-3 w-64 animate-pulse rounded bg-slate-100" />

                  </div>

                  <div className="hidden h-8 w-24 animate-pulse rounded-full bg-slate-100 sm:block" />

                </div>

              )
            )}

          </div>

        )}


        {/* ================================= */}
        {/* EMPTY */}
        {/* ================================= */}

        {!loading &&
          !error &&
          filteredTalent.length === 0 && (

            <div className="px-6 py-20 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-50 text-navy-500">

                <Palette size={25} />

              </div>

              <h3 className="mt-5 text-base font-bold text-slate-900">
                No talent found
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">
                Try changing your search or filters,
                or wait for new talent to join TCSN Network.
              </p>

            </div>

          )}


        {/* ================================= */}
        {/* TALENT TABLE */}
        {/* ================================= */}

        {!loading &&
          !error &&
          filteredTalent.length > 0 && (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1050px]">

                <thead>

                  <tr className="border-b border-slate-100 bg-slate-50/70">

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Talent
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Specialty
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Location
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Rating
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

                  {filteredTalent.map(
                    (person) => (

                      <tr
                        key={person.id}
                        className="transition hover:bg-slate-50/70"
                      >

                        {/* Talent */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            {person.avatar_url ? (

                              <img
                                src={person.avatar_url}
                                alt={
                                  person.full_name ||
                                  "Talent"
                                }
                                className="h-12 w-12 rounded-full object-cover"
                              />

                            ) : (

                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy-100 text-xs font-bold text-navy-700">
                                {getInitials(
                                  person.full_name,
                                  person.username
                                )}
                              </div>

                            )}

                            <div className="min-w-0">

                              <p className="truncate text-sm font-bold text-slate-900">
                                {person.full_name ||
                                  person.username ||
                                  "Unnamed talent"}
                              </p>

                              <p className="mt-0.5 truncate text-xs text-slate-400">
                                @{person.username ||
                                  "username"}
                              </p>

                            </div>

                          </div>

                        </td>


                        {/* Specialty */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-2">

                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-50 text-navy-600">
                              <Palette size={15} />
                            </div>

                            <span className="text-sm font-semibold text-slate-700">
                              Creative / Tech
                            </span>

                          </div>

                        </td>


                        {/* Location */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-2 text-sm text-slate-500">

                            <MapPin
                              size={15}
                              className="text-slate-400"
                            />

                            <span>
                              {person.location ||
                                "Not specified"}
                            </span>

                          </div>

                        </td>


                        {/* Rating */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-1.5">

                            <Star
                              size={15}
                              className="fill-current text-amber-400"
                            />

                            <span className="text-sm font-bold text-slate-700">
                              —
                            </span>

                            <span className="text-xs text-slate-400">
                              New
                            </span>

                          </div>

                        </td>


                        {/* Status */}

                        <td className="px-5 py-4">

                          <StatusBadge
                            status={person.status}
                          />

                        </td>


                        {/* Joined */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-2 text-sm text-slate-500">

                            <Clock3
                              size={14}
                              className="text-slate-400"
                            />

                            {formatDate(
                              person.created_at
                            )}

                          </div>

                        </td>


                        {/* Actions */}

                        <td className="relative px-5 py-4 text-right">

                          <button
                            onClick={() =>
                              setOpenMenu(
                                openMenu ===
                                  person.id
                                  ? null
                                  : person.id
                              )
                            }
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          >

                            <MoreHorizontal
                              size={18}
                            />

                          </button>


                          {openMenu ===
                            person.id && (

                            <div className="absolute right-5 top-14 z-20 w-48 rounded-xl border border-slate-200 bg-white p-1.5 text-left shadow-xl">

                              <button
                                onClick={() =>
                                  setOpenMenu(null)
                                }
                                className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                              >
                                View talent profile
                              </button>

                              <button
                                onClick={() =>
                                  setOpenMenu(null)
                                }
                                className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                              >
                                Review portfolio
                              </button>

                              <button
                                onClick={() =>
                                  setOpenMenu(null)
                                }
                                className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                              >
                                Verify talent
                              </button>

                              <button
                                onClick={() =>
                                  setOpenMenu(null)
                                }
                                className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-red-600 transition hover:bg-red-50"
                              >
                                Suspend talent
                              </button>

                            </div>

                          )}

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}


        {/* Footer */}

        {!loading &&
          !error &&
          filteredTalent.length > 0 && (

            <div className="border-t border-slate-100 px-5 py-4">

              <p className="text-xs text-slate-400">

                Showing{" "}

                <span className="font-bold text-slate-600">
                  {filteredTalent.length}
                </span>{" "}

                of{" "}

                <span className="font-bold text-slate-600">
                  {talent.length}
                </span>{" "}

                talent profiles

              </p>

            </div>

          )}

      </div>

    </div>
  );
}


/* ================================= */
/* STAT CARD */
/* ================================= */

function TalentStat({
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

        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
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


/* ================================= */
/* FILTER SELECT */
/* ================================= */

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
        className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-10 text-sm font-semibold text-slate-700 outline-none transition focus:border-navy-500 focus:ring-4 focus:ring-navy-500/10 sm:w-44"
      >

        {options.map(
          ([optionValue, label]) => (

            <option
              key={optionValue}
              value={optionValue}
            >
              {label}
            </option>

          )
        )}

      </select>

      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />

    </div>
  );
}


/* ================================= */
/* STATUS BADGE */
/* ================================= */

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
      {labels[status] || "Unknown"}
    </span>
  );
}

