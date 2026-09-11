import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Filter,
  Loader2,
  MapPin,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  Timer,
  X,
  XCircle,
  ChevronRight,
  WalletCards,
  AlertCircle,
  RotateCcw,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    description: "Your application is in the queue for review. Hang tight!",
    icon: Clock3,
    className: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    ring: "ring-amber-500/20",
    gradient: "from-amber-500 to-orange-500",
  },
  received: {
    label: "Received",
    description: "The client has received your application.",
    icon: Send,
    className: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
    ring: "ring-blue-500/20",
    gradient: "from-blue-500 to-cyan-500",
  },
  shortlisted: {
    label: "Shortlisted",
    description: "Great news! You've been shortlisted for this opportunity.",
    icon: Sparkles,
    className: "bg-navy-50 text-navy-700 border-navy-200",
    dot: "bg-navy-500",
    ring: "ring-navy-500/20",
    gradient: "from-navy-500 to-navy-700",
  },
  accepted: {
    label: "Accepted",
    description: "Congratulations! Your application has been accepted.",
    icon: CheckCircle2,
    className: "bg-green-50 text-green-700 border-green-200",
    dot: "bg-green-500",
    ring: "ring-green-500/20",
    gradient: "from-green-500 to-green-500",
  },
  rejected: {
    label: "Rejected",
    description: "This application wasn't selected. Keep applying!",
    icon: XCircle,
    className: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
    ring: "ring-red-500/20",
    gradient: "from-red-500 to-rose-500",
  },
  withdrawn: {
    label: "Withdrawn",
    description: "You withdrew this application.",
    icon: RotateCcw,
    className: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-500",
    ring: "ring-slate-500/20",
    gradient: "from-slate-500 to-slate-600",
  },
  completed: {
    label: "Completed",
    description: "This project has been successfully completed.",
    icon: CheckCircle2,
    className: "bg-green-50 text-green-700 border-green-200",
    dot: "bg-green-500",
    ring: "ring-green-500/20",
    gradient: "from-green-500 to-green-500",
  },
};

const WITHDRAWABLE_STATUSES = ["pending", "received"];

const FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "received", label: "Received" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "accepted", label: "Accepted" },
  { key: "rejected", label: "Rejected" },
];

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") {
    return "Not specified";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return String(value);
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(number);
}

function formatDate(date) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function formatRelativeTime(date) {
  if (!date) return "—";
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

function getImage(application) {
  const images = application?.opportunity?.images;

  if (!images) return null;

  if (Array.isArray(images)) {
    const first = images[0];

    if (typeof first === "string") {
      return first;
    }

    if (first?.url) {
      return first.url;
    }
  }

  return null;
}

function getStatusConfig(status) {
  return (
    STATUS_CONFIG[status] || {
      label: status || "Unknown",
      description: "Application status",
      icon: AlertCircle,
      className: "bg-slate-100 text-slate-600 border-slate-200",
      dot: "bg-slate-500",
      ring: "ring-slate-500/20",
      gradient: "from-slate-500 to-slate-600",
    }
  );
}

export default function TalentMyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedApplication, setSelectedApplication] = useState(null);
  const [withdrawingId, setWithdrawingId] = useState(null);

  const loadApplications = useCallback(async (showRefresh = false) => {
    try {
      setError("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("You must be logged in to view your applications.");

      const { data, error: applicationsError } = await supabase
        .from("applications")
        .select(
          `
          id,
          talent_id,
          cover_letter,
          proposed_price,
          status,
          created_at,
          updated_at,
          opportunity:opportunity_id (
            id,
            title,
            short_description,
            description,
            category,
            budget,
            deadline,
            location,
            project_type,
            skills,
            images
          )
        `
        )
        .eq("talent_id", user.id)
        .order("created_at", { ascending: false });

      if (applicationsError) throw applicationsError;

      setApplications(data || []);
    } catch (err) {
      console.error("Failed to load applications:", err);
      setError(err?.message || "Something went wrong while loading your applications.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let channel;

    loadApplications();

    const setupRealtime = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || cancelled) return;

      channel = supabase
        .channel(`talent-applications-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "applications",
            filter: `talent_id=eq.${user.id}`,
          },
          () => {
            loadApplications(true);
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      cancelled = true;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [loadApplications]);

  const counts = useMemo(() => {
    const result = {
      all: applications.length,
      pending: 0,
      received: 0,
      shortlisted: 0,
      accepted: 0,
      rejected: 0,
    };

    applications.forEach((application) => {
      if (result[application.status] !== undefined) {
        result[application.status]++;
      }
    });

    return result;
  }, [applications]);

  const successRate = useMemo(() => {
    const decided = counts.accepted + counts.rejected;
    if (decided === 0) return null;
    return Math.round((counts.accepted / decided) * 100);
  }, [counts]);

  const filteredApplications = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return applications.filter((application) => {
      const opportunity = application.opportunity;

      const matchesFilter =
        activeFilter === "all" || application.status === activeFilter;

      if (!matchesFilter) return false;
      if (!query) return true;

      return (
        opportunity?.title?.toLowerCase().includes(query) ||
        opportunity?.category?.toLowerCase().includes(query) ||
        opportunity?.location?.toLowerCase().includes(query) ||
        opportunity?.project_type?.toLowerCase().includes(query)
      );
    });
  }, [applications, activeFilter, searchTerm]);

  const withdrawApplication = useCallback(async (application) => {
    const confirmed = window.confirm(
      "Are you sure you want to withdraw this application?"
    );
    if (!confirmed) return;

    try {
      setWithdrawingId(application.id);

      const { error: updateError } = await supabase
        .from("applications")
        .update({
          status: "withdrawn",
          updated_at: new Date().toISOString(),
        })
        .eq("id", application.id)
        .eq("talent_id", application.talent_id);

      if (updateError) throw updateError;

      setApplications((current) =>
        current.map((item) =>
          item.id === application.id
            ? { ...item, status: "withdrawn", updated_at: new Date().toISOString() }
            : item
        )
      );

      setSelectedApplication(null);
    } catch (err) {
      console.error("Failed to withdraw application:", err);
      alert(err?.message || "Unable to withdraw your application right now.");
    } finally {
      setWithdrawingId(null);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Hero Header */}
      <div className="relative overflow-hidden border-b border-slate-200 bg-white">
        {/* Decorative gradient blobs */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-navy-200/40 to-blue-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-br from-green-200/30 to-cyan-200/30 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <nav className="mb-3 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <BriefcaseBusiness className="h-3.5 w-3.5" />
                <span>Talent Dashboard</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                <span className="text-slate-900">My Applications</span>
              </nav>

              <h1 className="bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
                My Applications
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">
                Track every opportunity you've applied for and stay in the loop
                on your application journey.
              </p>

              {successRate !== null && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {successRate}% success rate
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => loadApplications(true)}
              disabled={refreshing}
              className="group inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 transition-transform ${
                  refreshing ? "animate-spin" : "group-hover:rotate-180"
                }`}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          <SummaryCard
            label="Total"
            value={counts.all}
            icon={FileText}
            active={activeFilter === "all"}
            onClick={() => setActiveFilter("all")}
            accent="slate"
          />
          <SummaryCard
            label="Pending"
            value={counts.pending}
            icon={Clock3}
            active={activeFilter === "pending"}
            onClick={() => setActiveFilter("pending")}
            accent="amber"
          />
          <SummaryCard
            label="Received"
            value={counts.received}
            icon={Send}
            active={activeFilter === "received"}
            onClick={() => setActiveFilter("received")}
            accent="blue"
          />
          <SummaryCard
            label="Shortlisted"
            value={counts.shortlisted}
            icon={Sparkles}
            active={activeFilter === "shortlisted"}
            onClick={() => setActiveFilter("shortlisted")}
            accent="navy"
          />
          <SummaryCard
            label="Accepted"
            value={counts.accepted}
            icon={CheckCircle2}
            active={activeFilter === "accepted"}
            onClick={() => setActiveFilter("accepted")}
            accent="green"
          />
          <SummaryCard
            label="Rejected"
            value={counts.rejected}
            icon={XCircle}
            active={activeFilter === "rejected"}
            onClick={() => setActiveFilter("rejected")}
            accent="red"
          />
        </div>

        {/* Search + Filter Bar */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by title, category, location..."
                aria-label="Search your applications"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              <Filter className="h-4 w-4 shrink-0 text-slate-400" />
              {FILTERS.map((filter) => {
                const count = counts[filter.key];
                return (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setActiveFilter(filter.key)}
                    aria-pressed={activeFilter === filter.key}
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      activeFilter === filter.key
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {filter.label}
                    {count > 0 && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                          activeFilter === filter.key
                            ? "bg-white/20 text-white"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-rose-50 p-4 text-red-700 shadow-sm"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Unable to load applications</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => loadApplications()}
              className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-red-700 shadow-sm ring-1 ring-red-200 transition hover:bg-red-50"
            >
              Try again
            </button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="mt-8 space-y-4">
            {[...Array(3)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredApplications.length === 0 ? (
          <EmptyState
            hasApplications={applications.length > 0}
            activeFilter={activeFilter}
            searchTerm={searchTerm}
            onReset={() => {
              setActiveFilter("all");
              setSearchTerm("");
            }}
          />
        ) : (
          <>
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-900">
                  {filteredApplications.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-900">
                  {applications.length}
                </span>{" "}
                applications
              </p>
            </div>

            <div className="mt-4 space-y-4">
              {filteredApplications.map((application) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  onView={() => setSelectedApplication(application)}
                  onWithdraw={() => withdrawApplication(application)}
                  withdrawing={withdrawingId === application.id}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {selectedApplication && (
        <ApplicationModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onWithdraw={() => withdrawApplication(selectedApplication)}
          withdrawing={withdrawingId === selectedApplication.id}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------
   Summary Card
--------------------------------------------- */

const ACCENT_COLORS = {
  slate: {
    active: "border-slate-900 bg-slate-900 text-white",
    icon: "bg-slate-100 text-slate-700",
    activeIcon: "bg-white/20 text-white",
  },
  amber: {
    active: "border-amber-500 bg-gradient-to-br from-amber-500 to-orange-500 text-white",
    icon: "bg-amber-100 text-amber-700",
    activeIcon: "bg-white/20 text-white",
  },
  blue: {
    active: "border-blue-500 bg-gradient-to-br from-blue-500 to-cyan-500 text-white",
    icon: "bg-blue-100 text-blue-700",
    activeIcon: "bg-white/20 text-white",
  },
  navy: {
    active: "border-navy-500 bg-gradient-to-br from-navy-500 to-navy-700 text-white",
    icon: "bg-navy-100 text-navy-700",
    activeIcon: "bg-white/20 text-white",
  },
  green: {
    active: "border-green-500 bg-gradient-to-br from-green-500 to-green-500 text-white",
    icon: "bg-green-100 text-green-700",
    activeIcon: "bg-white/20 text-white",
  },
  red: {
    active: "border-red-500 bg-gradient-to-br from-red-500 to-rose-500 text-white",
    icon: "bg-red-100 text-red-700",
    activeIcon: "bg-white/20 text-white",
  },
};

function SummaryCard({ label, value, icon: Icon, active, onClick, accent = "slate" }) {
  const colors = ACCENT_COLORS[accent];

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
        active
          ? colors.active + " shadow-lg"
          : "border-slate-200 bg-white shadow-sm hover:border-slate-300"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
            active ? colors.activeIcon : colors.icon
          }`}
        >
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <span className={`text-2xl font-bold ${active ? "text-white" : "text-slate-900"}`}>
          {value}
        </span>
      </div>

      <p
        className={`mt-3 text-xs font-semibold uppercase tracking-wide ${
          active ? "text-white/90" : "text-slate-500"
        }`}
      >
        {label}
      </p>
    </button>
  );
}

/* ---------------------------------------------
   Skeleton Card
--------------------------------------------- */

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col lg:flex-row">
        <div className="h-52 shrink-0 animate-pulse bg-slate-100 lg:h-auto lg:w-64" />
        <div className="flex-1 space-y-4 p-6">
          <div className="flex gap-2">
            <div className="h-6 w-20 animate-pulse rounded bg-slate-100" />
            <div className="h-6 w-16 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="h-6 w-3/4 animate-pulse rounded bg-slate-100" />
          <div className="space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="flex gap-3 pt-4">
            <div className="h-9 flex-1 animate-pulse rounded bg-slate-100" />
            <div className="h-9 flex-1 animate-pulse rounded bg-slate-100" />
            <div className="h-9 flex-1 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------
   Application Card
--------------------------------------------- */

function ApplicationCard({ application, onView, onWithdraw, withdrawing }) {
  const opportunity = application.opportunity;
  const status = getStatusConfig(application.status);
  const image = getImage(application);
  const canWithdraw = WITHDRAWABLE_STATUSES.includes(application.status);

  return (
    <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-xl">
      <div className="flex flex-col lg:flex-row">
        {/* Image with gradient overlay */}
        <div className="relative h-52 shrink-0 overflow-hidden bg-slate-100 lg:h-auto lg:w-64">
          {image ? (
            <>
              <img
                src={image}
                alt={opportunity?.title || "Opportunity"}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-transparent" />
            </>
          ) : (
            <div
              className={`flex h-full min-h-[200px] items-center justify-center bg-gradient-to-br ${status.gradient}`}
            >
              <BriefcaseBusiness className="h-16 w-16 text-white/40" />
            </div>
          )}

          <div className="absolute left-3 top-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold shadow-sm backdrop-blur-md ${status.className}`}
            >
              <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {opportunity?.category && (
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold capitalize text-slate-700">
                    {opportunity.category}
                  </span>
                )}
                {opportunity?.project_type && (
                  <span className="rounded-md bg-slate-50 px-2 py-1 text-xs font-medium capitalize text-slate-500 ring-1 ring-inset ring-slate-200">
                    {opportunity.project_type}
                  </span>
                )}
              </div>

              <h2 className="mt-3 text-lg font-bold text-slate-900 transition group-hover:text-slate-700 sm:text-xl">
                {opportunity?.title || "Untitled Opportunity"}
              </h2>

              <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-slate-500">
                {opportunity?.short_description ||
                  opportunity?.description ||
                  "No description available."}
              </p>
            </div>

            <div className="shrink-0 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-3 text-left sm:text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Your Proposal
              </p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {formatCurrency(application.proposed_price)}
              </p>
            </div>
          </div>

          {/* Meta */}
          <div className="mt-5 grid grid-cols-1 gap-3 border-y border-slate-100 py-4 sm:grid-cols-3">
            <MetaItem
              icon={WalletCards}
              label="Budget"
              value={formatCurrency(opportunity?.budget)}
            />
            <MetaItem
              icon={CalendarDays}
              label="Applied"
              value={formatDate(application.created_at)}
            />
            <MetaItem
              icon={Timer}
              label="Deadline"
              value={formatDate(opportunity?.deadline)}
            />
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              {opportunity?.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {opportunity.location}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5" />
                Updated {formatRelativeTime(application.updated_at)}
              </span>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              {canWithdraw && (
                <button
                  type="button"
                  onClick={onWithdraw}
                  disabled={withdrawing}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {withdrawing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  Withdraw
                </button>
              )}

              <button
                type="button"
                onClick={onView}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-slate-900 to-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md hover:from-slate-800 hover:to-slate-700"
                >
                <Eye className="h-4 w-4" />
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------
   Meta Item
--------------------------------------------- */

function MetaItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className="truncate text-sm font-semibold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

/* ---------------------------------------------
   Empty State
--------------------------------------------- */

function EmptyState({ hasApplications, activeFilter, searchTerm, onReset }) {
  if (hasApplications && (activeFilter !== "all" || searchTerm)) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-gradient-to-b from-white to-slate-50 px-6 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200">
          <Search className="h-7 w-7 text-slate-500" />
        </div>
        <h3 className="mt-5 text-lg font-bold text-slate-900">
          No matching applications
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          We couldn't find any applications matching your search or filter.
          Try adjusting your criteria.
        </p>
        <button
          type="button"
          onClick={onReset}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 hover:shadow-lg"
        >
          <RotateCcw className="h-4 w-4" />
          Clear filters
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-gradient-to-br from-white via-slate-50 to-white px-6 py-20 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-navy-500 to-blue-500 shadow-lg shadow-navy-500/20">
        <BriefcaseBusiness className="h-9 w-9 text-white" />
      </div>
      <h3 className="mt-6 text-2xl font-bold text-slate-900">
        No applications yet
      </h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
        You haven't applied for any opportunities yet. Start exploring
        opportunities that match your skills and grow your portfolio.
      </p>
      <Link
        to="/talent/discover"
        className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition hover:shadow-xl hover:shadow-slate-900/30"
      >
        <Sparkles className="h-4 w-4" />
        Discover Opportunities
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

/* ---------------------------------------------
   Application Modal
--------------------------------------------- */

function ApplicationModal({ application, onClose, onWithdraw, withdrawing }) {
  const opportunity = application.opportunity;
  const status = getStatusConfig(application.status);
  const StatusIcon = status.icon;
  const image = getImage(application);
  const dialogRef = useRef(null);

  const canWithdraw = WITHDRAWABLE_STATUSES.includes(application.status);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    dialogRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md animate-in fade-in duration-200"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="application-modal-title"
        tabIndex={-1}
        className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl outline-none"
      >
        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur-md sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${status.gradient} text-white shadow-md`}
            >
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Application Details
              </p>
              <h2
                id="application-modal-title"
                className="truncate text-base font-bold text-slate-900"
              >
                {opportunity?.title || "Application Details"}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(92vh-73px)] overflow-y-auto">
          {/* Image with overlay */}
          {image ? (
            <div className="relative h-56 w-full overflow-hidden bg-slate-100 sm:h-72">
              <img
                src={image}
                alt={opportunity?.title || "Opportunity"}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <div
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-bold shadow-lg backdrop-blur-md ${status.className}`}
                >
                  <StatusIcon className="h-4 w-4" />
                  {status.label}
                </div>
              </div>
            </div>
          ) : (
            <div
              className={`relative flex h-40 w-full items-center justify-center bg-gradient-to-br ${status.gradient}`}
            >
              <BriefcaseBusiness className="h-16 w-16 text-white/40" />
              <div className="absolute bottom-4 left-4 right-4">
                <div
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-bold shadow-lg backdrop-blur-md ${status.className}`}
                >
                  <StatusIcon className="h-4 w-4" />
                  {status.label}
                </div>
              </div>
            </div>
          )}

          <div className="p-5 sm:p-7">
            {/* Status Callout */}
            <div
              className={`flex gap-3 rounded-2xl border p-4 ${status.className}`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/50">
                <StatusIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{status.label}</p>
                <p className="mt-1 text-sm leading-6 opacity-90">
                  {status.description}
                </p>
                <p className="mt-2 text-xs opacity-75">
                  Updated {formatRelativeTime(application.updated_at)}
                </p>
              </div>
            </div>

            {/* Opportunity */}
            <div className="mt-7">
              <div className="flex flex-wrap items-center gap-2">
                {opportunity?.category && (
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold capitalize text-slate-700">
                    {opportunity.category}
                  </span>
                )}
                {opportunity?.project_type && (
                  <span className="rounded-md bg-slate-50 px-2 py-1 text-xs font-medium capitalize text-slate-500 ring-1 ring-inset ring-slate-200">
                    {opportunity.project_type}
                  </span>
                )}
              </div>
              <h3 className="mt-3 text-2xl font-bold text-slate-900">
                {opportunity?.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {opportunity?.description ||
                  opportunity?.short_description ||
                  "No description available."}
              </p>
            </div>

            {/* Details */}
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DetailBox
                icon={WalletCards}
                label="Opportunity Budget"
                value={formatCurrency(opportunity?.budget)}
                highlight
              />
              <DetailBox
                icon={WalletCards}
                label="Your Proposed Price"
                value={formatCurrency(application.proposed_price)}
                highlight
              />
              <DetailBox
                icon={CalendarDays}
                label="Application Date"
                value={formatDate(application.created_at)}
              />
              <DetailBox
                icon={CalendarDays}
                label="Opportunity Deadline"
                value={formatDate(opportunity?.deadline)}
              />
              {opportunity?.location && (
                <DetailBox
                  icon={MapPin}
                  label="Location"
                  value={opportunity.location}
                />
              )}
              {opportunity?.project_type && (
                <DetailBox
                  icon={BriefcaseBusiness}
                  label="Project Type"
                  value={opportunity.project_type}
                />
              )}
            </div>

            {/* Skills */}
            {Array.isArray(opportunity?.skills) && opportunity.skills.length > 0 && (
              <div className="mt-7">
                <h4 className="text-sm font-bold text-slate-900">
                  Required Skills
                </h4>
                <div className="mt-3 flex flex-wrap gap-2">
                  {opportunity.skills.map((skill, index) => (
                    <span
                      key={`${skill}-${index}`}
                      className="rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Cover Letter */}
            <div className="mt-7">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-slate-500" />
                <h4 className="text-sm font-bold text-slate-900">
                  Your Cover Letter
                </h4>
              </div>
              <div className="mt-3 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {application.cover_letter || (
                    <span className="italic text-slate-400">
                      No cover letter was submitted.
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>

              {canWithdraw && (
                <button
                  type="button"
                  onClick={onWithdraw}
                  disabled={withdrawing}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {withdrawing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  Withdraw Application
                </button>
              )}

              {opportunity?.id && (
                <Link
                  to={`/talent/opportunities/${opportunity.id}`}
                  onClick={onClose}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg"
                >
                  <Eye className="h-4 w-4" />
                  View Opportunity
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------
   Detail Box
--------------------------------------------- */

function DetailBox({ icon: Icon, label, value, highlight }) {
  return (
    <div
      className={`rounded-xl border p-4 transition ${
        highlight
          ? "border-slate-200 bg-gradient-to-br from-slate-50 to-white"
          : "border-slate-100 bg-white"
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-500">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>
      </div>
      <p className="mt-2 text-sm font-bold capitalize text-slate-900">
        {value || "—"}
      </p>
    </div>
  );
}