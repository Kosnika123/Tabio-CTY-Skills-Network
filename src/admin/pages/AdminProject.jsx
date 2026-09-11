import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  Search,
  FolderKanban,
  Clock3,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  MoreHorizontal,
  ChevronDown,
  CalendarDays,
  Wallet,
  User,
  Users,
  Eye,
  PauseCircle,
  XCircle,
  Activity,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

export default function AdminProjects() {
  const [projects, setProjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [openMenu, setOpenMenu] = useState(null);

  /*
   * =========================================
   * FETCH PROJECTS
   * =========================================
   */

  const fetchProjects = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const { data, error: fetchError } = await supabase
        .from("projects")
        .select(
          `
            id,
            title,
            description,
            budget,
            deadline,
            status,
            progress,
            created_at,
            client:client_id (
              id,
              full_name,
              username,
              email,
              avatar_url
            ),
            talent:talent_id (
              id,
              full_name,
              username,
              email,
              avatar_url
            )
          `
        )
        .order("created_at", {
          ascending: false,
        });

      if (fetchError) {
        throw fetchError;
      }

      setProjects(data || []);
    } catch (err) {
      console.error("Failed to load projects:", err);

      setError(
        err.message ||
          "Unable to load projects. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  /*
   * =========================================
   * FILTER PROJECTS
   * =========================================
   */

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesSearch =
        !query ||
        project.title?.toLowerCase().includes(query) ||
        project.description?.toLowerCase().includes(query) ||
        project.client?.full_name
          ?.toLowerCase()
          .includes(query) ||
        project.client?.username
          ?.toLowerCase()
          .includes(query) ||
        project.talent?.full_name
          ?.toLowerCase()
          .includes(query) ||
        project.talent?.username
          ?.toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        project.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  /*
   * =========================================
   * STATS
   * =========================================
   */

  const stats = useMemo(() => {
    return {
      total: projects.length,

      active: projects.filter(
        (project) =>
          project.status === "active" ||
          project.status === "in_progress"
      ).length,

      completed: projects.filter(
        (project) =>
          project.status === "completed"
      ).length,

      paused: projects.filter(
        (project) =>
          project.status === "paused"
      ).length,
    };
  }, [projects]);

  /*
   * =========================================
   * HELPERS
   * =========================================
   */

  const formatCurrency = (amount) => {
    if (
      amount === null ||
      amount === undefined
    ) {
      return "Not specified";
    }

    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return "No deadline";

    return new Date(date).toLocaleDateString(
      "en-NG",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  const getInitials = (name, username) => {
    const value = name || username || "US";

    const parts = value
      .trim()
      .split(" ")
      .filter(Boolean);

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return value.substring(0, 2).toUpperCase();
  };

  const getProgress = (project) => {
    const progress = Number(project.progress);

    if (Number.isNaN(progress)) {
      return project.status === "completed"
        ? 100
        : 0;
    }

    return Math.min(
      Math.max(progress, 0),
      100
    );
  };

  return (
    <div className="mx-auto max-w-7xl space-y-7">

      {/* ========================================= */}
      {/* HEADER */}
      {/* ========================================= */}

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

            <span>Projects</span>

          </div>

          <h1 className="font-['Space_Grotesk'] text-3xl font-bold tracking-tight text-slate-950">
            Projects
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Monitor active work, completed projects,
            deadlines and client-talent engagements
            across TCSN Network.
          </p>

        </div>

        <button
          type="button"
          onClick={() => fetchProjects(true)}
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


      {/* ========================================= */}
      {/* STATS */}
      {/* ========================================= */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <ProjectStat
          icon={FolderKanban}
          label="Total Projects"
          value={stats.total}
        />

        <ProjectStat
          icon={Activity}
          label="Active Projects"
          value={stats.active}
        />

        <ProjectStat
          icon={CheckCircle2}
          label="Completed"
          value={stats.completed}
        />

        <ProjectStat
          icon={PauseCircle}
          label="Paused"
          value={stats.paused}
        />

      </div>


      {/* ========================================= */}
      {/* PROJECT TABLE */}
      {/* ========================================= */}

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
                placeholder="Search projects, clients or talent..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-navy-500 focus:bg-white focus:ring-4 focus:ring-navy-500/10"
              />

            </div>


            {/* Status filter */}

            <FilterSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                ["all", "All status"],
                ["active", "Active"],
                ["in_progress", "In Progress"],
                ["completed", "Completed"],
                ["paused", "Paused"],
                ["cancelled", "Cancelled"],
              ]}
            />

          </div>

        </div>


        {/* ========================================= */}
        {/* ERROR */}
        {/* ========================================= */}

        {error && (

          <div className="m-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <div>

              <p className="font-semibold">
                Couldn't load projects
              </p>

              <p className="mt-1 text-xs leading-5">
                {error}
              </p>

              <button
                onClick={() => fetchProjects()}
                className="mt-3 text-xs font-bold underline"
              >
                Try again
              </button>

            </div>

          </div>

        )}


        {/* ========================================= */}
        {/* LOADING */}
        {/* ========================================= */}

        {loading && !error && (

          <div className="divide-y divide-slate-100">

            {[1, 2, 3, 4, 5].map((item) => (

              <div
                key={item}
                className="flex gap-4 p-5"
              >

                <div className="h-11 w-11 animate-pulse rounded-xl bg-slate-100" />

                <div className="flex-1">

                  <div className="h-4 w-64 animate-pulse rounded bg-slate-100" />

                  <div className="mt-3 h-3 w-40 animate-pulse rounded bg-slate-100" />

                  <div className="mt-4 h-2 w-full max-w-xs animate-pulse rounded-full bg-slate-100" />

                </div>

              </div>

            ))}

          </div>

        )}


        {/* ========================================= */}
        {/* EMPTY */}
        {/* ========================================= */}

        {!loading &&
          !error &&
          filteredProjects.length === 0 && (

            <div className="px-6 py-20 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-50 text-navy-500">

                <FolderKanban size={25} />

              </div>

              <h3 className="mt-5 text-base font-bold text-slate-900">
                No projects found
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">
                There are no projects matching your
                current search and filters.
              </p>

            </div>

          )}


        {/* ========================================= */}
        {/* TABLE */}
        {/* ========================================= */}

        {!loading &&
          !error &&
          filteredProjects.length > 0 && (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1200px]">

                <thead>

                  <tr className="border-b border-slate-100 bg-slate-50/70">

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Project
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Client
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Talent
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Budget
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Progress
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Deadline
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Status
                    </th>

                    <th className="px-5 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody className="divide-y divide-slate-100">

                  {filteredProjects.map(
                    (project) => {

                      const progress =
                        getProgress(project);

                      return (
                        <tr
                          key={project.id}
                          className="transition hover:bg-slate-50/70"
                        >

                          {/* Project */}

                          <td className="px-5 py-5">

                            <div className="flex items-start gap-3">

                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-600">

                                <FolderKanban
                                  size={18}
                                />

                              </div>

                              <div className="min-w-0">

                                <p className="max-w-[260px] truncate text-sm font-bold text-slate-900">
                                  {project.title}
                                </p>

                                <p className="mt-1 max-w-[280px] truncate text-xs text-slate-400">
                                  {project.description ||
                                    "No description"}
                                </p>

                              </div>

                            </div>

                          </td>


                          {/* Client */}

                          <td className="px-5 py-5">

                            <PersonCell
                              person={project.client}
                              fallback="Client"
                              getInitials={
                                getInitials
                              }
                            />

                          </td>


                          {/* Talent */}

                          <td className="px-5 py-5">

                            <PersonCell
                              person={project.talent}
                              fallback="Talent"
                              getInitials={
                                getInitials
                              }
                            />

                          </td>


                          {/* Budget */}

                          <td className="px-5 py-5">

                            <div className="flex items-center gap-2">

                              <Wallet
                                size={15}
                                className="text-slate-400"
                              />

                              <span className="text-sm font-bold text-slate-700">
                                {formatCurrency(
                                  project.budget
                                )}
                              </span>

                            </div>

                          </td>


                          {/* Progress */}

                          <td className="px-5 py-5">

                            <div className="w-36">

                              <div className="mb-2 flex items-center justify-between">

                                <span className="text-[10px] font-bold text-slate-500">
                                  {progress}%
                                </span>

                              </div>

                              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">

                                <div
                                  className="h-full rounded-full bg-navy-500 transition-all"
                                  style={{
                                    width: `${progress}%`,
                                  }}
                                />

                              </div>

                            </div>

                          </td>


                          {/* Deadline */}

                          <td className="px-5 py-5">

                            <div className="flex items-center gap-2 text-sm text-slate-500">

                              <CalendarDays
                                size={15}
                                className="text-slate-400"
                              />

                              {formatDate(
                                project.deadline
                              )}

                            </div>

                          </td>


                          {/* Status */}

                          <td className="px-5 py-5">

                            <ProjectStatus
                              status={
                                project.status
                              }
                            />

                          </td>


                          {/* Actions */}

                          <td className="relative px-5 py-5 text-right">

                            <button
                              onClick={() =>
                                setOpenMenu(
                                  openMenu ===
                                    project.id
                                    ? null
                                    : project.id
                                )
                              }
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >

                              <MoreHorizontal
                                size={18}
                              />

                            </button>


                            {openMenu ===
                              project.id && (

                              <div className="absolute right-5 top-14 z-30 w-52 rounded-xl border border-slate-200 bg-white p-1.5 text-left shadow-xl">

                                <button
                                  onClick={() =>
                                    setOpenMenu(
                                      null
                                    )
                                  }
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                >

                                  <Eye size={14} />

                                  View project

                                </button>

                                <button
                                  onClick={() =>
                                    setOpenMenu(
                                      null
                                    )
                                  }
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                >

                                  <User size={14} />

                                  View client

                                </button>

                                <button
                                  onClick={() =>
                                    setOpenMenu(
                                      null
                                    )
                                  }
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                >

                                  <Users size={14} />

                                  View talent

                                </button>

                                {project.status !==
                                  "paused" && (
                                  <button
                                    onClick={() =>
                                      setOpenMenu(
                                        null
                                      )
                                    }
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-amber-600 transition hover:bg-amber-50"
                                  >

                                    <PauseCircle
                                      size={14}
                                    />

                                    Pause project

                                  </button>
                                )}

                                <button
                                  onClick={() =>
                                    setOpenMenu(
                                      null
                                    )
                                  }
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                >

                                  <XCircle
                                    size={14}
                                  />

                                  Cancel project

                                </button>

                              </div>

                            )}

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

          )}


        {/* ========================================= */}
        {/* FOOTER */}
        {/* ========================================= */}

        {!loading &&
          !error &&
          filteredProjects.length > 0 && (

            <div className="border-t border-slate-100 px-5 py-4">

              <p className="text-xs text-slate-400">

                Showing{" "}

                <span className="font-bold text-slate-600">
                  {filteredProjects.length}
                </span>{" "}

                of{" "}

                <span className="font-bold text-slate-600">
                  {projects.length}
                </span>{" "}

                projects

              </p>

            </div>

          )}

      </div>

    </div>
  );
}


/* ========================================= */
/* STAT CARD */
/* ========================================= */

function ProjectStat({
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


/* ========================================= */
/* PERSON CELL */
/* ========================================= */

function PersonCell({
  person,
  fallback,
  getInitials,
}) {
  if (!person) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400">

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
          <User size={14} />
        </div>

        <span>
          No {fallback.toLowerCase()}
        </span>

      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">

      {person.avatar_url ? (

        <img
          src={person.avatar_url}
          alt={
            person.full_name ||
            fallback
          }
          className="h-9 w-9 rounded-full object-cover"
        />

      ) : (

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">

          {getInitials(
            person.full_name,
            person.username
          )}

        </div>

      )}

      <div className="min-w-0">

        <p className="max-w-[130px] truncate text-xs font-bold text-slate-700">
          {person.full_name ||
            person.username ||
            fallback}
        </p>

        <p className="mt-0.5 text-[10px] text-slate-400">
          {fallback}
        </p>

      </div>

    </div>
  );
}


/* ========================================= */
/* FILTER SELECT */
/* ========================================= */

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


/* ========================================= */
/* STATUS */
/* ========================================= */

function ProjectStatus({
  status,
}) {
  const styles = {
    active:
      "bg-green-50 text-green-600",

    in_progress:
      "bg-navy-50 text-navy-600",

    completed:
      "bg-blue-50 text-blue-600",

    paused:
      "bg-amber-50 text-amber-600",

    cancelled:
      "bg-red-50 text-red-600",
  };

  const labels = {
    active: "Active",
    in_progress: "In Progress",
    completed: "Completed",
    paused: "Paused",
    cancelled: "Cancelled",
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
