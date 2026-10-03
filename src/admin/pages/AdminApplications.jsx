import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Loader2,
  Search,
  User,
  Users,
  X,
  XCircle,
} from "lucide-react";

import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";

const STATUS_OPTIONS = [
  { value: "all", label: "All Applications" },
  { value: "pending", label: "Pending" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
];

const STATUS_STYLES = {
  pending: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  shortlisted: {
    label: "Shortlisted",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  accepted: {
    label: "Accepted",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
  withdrawn: {
    label: "Withdrawn",
    className: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  },
};

const APPLICATION_SELECT = `
  id,
  opportunity_id,
  talent_id,
  cover_message,
  status,
  created_at,
  updated_at,

  opportunity:opportunity_id (
    id,
    title,
    category,
    budget,
    deadline,
    status
  ),

  profile:talent_id (
    id,
    full_name,
    username,
    avatar_url,
    bio,
    location,
    phone,
    github_url,
    linkedin_url,
    portfolio_url
  )
`;

const animationStyles = `
  @keyframes adm-rise {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes adm-fade {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes adm-modal {
    from { opacity: 0; transform: translateY(24px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .adm-rise  { opacity: 0; animation: adm-rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
  .adm-fade  { animation: adm-fade 0.25s ease forwards; }
  .adm-modal { animation: adm-modal 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards; }

  .adm-card { transition: transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s ease, border-color .35s ease; }
  .adm-card:hover { transform: translateY(-4px); }
  .adm-card-bar {
    transform: scaleX(0);
    transform-origin: left;
    transition: transform .5s cubic-bezier(.22,1,.36,1);
  }
  .adm-card:hover .adm-card-bar { transform: scaleX(1); }
  .adm-arrow { transition: transform .3s cubic-bezier(.22,1,.36,1); }
  .adm-card:hover .adm-arrow { transform: translate(2px, -2px); }

  @media (prefers-reduced-motion: reduce) {
    .adm-rise, .adm-fade, .adm-modal { animation: none; opacity: 1; }
    .adm-card, .adm-card-bar, .adm-arrow { transition: none; }
    .adm-card:hover { transform: none; }
  }
`;

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") {
    return "Budget not specified";
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatDate(value) {
  if (!value) return "Unknown date";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getInitials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "T"
  );
}

function getAvatar(profile) {
  return profile?.avatar_url || profile?.avatar || profile?.image_url || "";
}

function normalizeSkills(skills) {
  if (!skills) return [];

  if (Array.isArray(skills)) {
    return skills.filter(Boolean);
  }

  if (typeof skills === "string") {
    return skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
  }

  return [];
}

function cleanApplication(application) {
  return {
    ...application,
    opportunity: Array.isArray(application.opportunity)
      ? application.opportunity[0] || null
      : application.opportunity,
    profile: Array.isArray(application.profile)
      ? application.profile[0] || null
      : application.profile,
  };
}

function StatusBadge({ status }) {
  const config = STATUS_STYLES[status] || STATUS_STYLES.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${config.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

function ApplicantAvatar({ profile, size = "h-12 w-12", ring = true }) {
  const name = profile?.full_name || profile?.username || "Talent";
  const avatar = getAvatar(profile);
  const ringClass = ring ? "ring-2 ring-white" : "";

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className={`${size} shrink-0 rounded-full object-cover ${ringClass}`}
      />
    );
  }

  return (
    <div
      className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white ${ringClass}`}
    >
      {getInitials(name)}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, description, delay = 0 }) {
  return (
    <div
      className="adm-rise rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {label}
          </p>

          <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            {value}
          </p>

          {description && (
            <p className="mt-1 text-xs text-slate-400">{description}</p>
          )}
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
          <Icon className="h-5 w-5 text-slate-700" />
        </div>
      </div>
    </div>
  );
}

function ApplicantCard({ application, onStatusChange, updatingId }) {
  const profile = application.profile || {};

  const name = profile.full_name || profile.username || "Unnamed Talent";
  const username = profile.username ? `@${profile.username}` : "";
  const skills = normalizeSkills(profile.skills);
  const isUpdating = updatingId === application.id;

  const isFinal =
    application.status === "accepted" ||
    application.status === "rejected" ||
    application.status === "withdrawn";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        {/* Applicant information */}
        <div className="flex min-w-0 gap-4">
          <ApplicantAvatar profile={profile} />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="truncate text-base font-black text-slate-950">
                {name}
              </h4>

              <StatusBadge status={application.status} />
            </div>

            {username && (
              <p className="mt-0.5 text-sm text-slate-400">{username}</p>
            )}

            {profile.bio && (
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
                {profile.bio}
              </p>
            )}

            {skills.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {skills.slice(0, 6).map((skill, index) => (
                  <span
                    key={`${skill}-${index}`}
                    className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                  >
                    {skill}
                  </span>
                ))}

                {skills.length > 6 && (
                  <span className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-400">
                    +{skills.length - 6} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Application date */}
        <div className="shrink-0 text-left sm:text-right">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Applied
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            {formatDate(application.created_at)}
          </p>
        </div>
      </div>

      {/* Cover message */}
      {application.cover_message && (
        <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Application Message
          </p>

          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
            {application.cover_message}
          </p>
        </div>
      )}

      {/* Profile links */}
      {(profile.portfolio_url ||
        profile.github_url ||
        profile.linkedin_url) && (
        <div className="mt-5 flex flex-wrap gap-2">
          {[
            { label: "Portfolio", url: profile.portfolio_url },
            { label: "GitHub", url: profile.github_url },
            { label: "LinkedIn", url: profile.linkedin_url },
          ]
            .filter((link) => link.url)
            .map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
              >
                {link.label}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ))}
        </div>
      )}

      {/* Actions */}
      <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
        <Link
          to={`/admin/talent/${application.talent_id}`}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          <User className="h-4 w-4" />
          View Profile
        </Link>

        {!isFinal && (
          <>
            {application.status !== "shortlisted" && (
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => onStatusChange(application.id, "shortlisted")}
                className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Shortlist
              </button>
            )}

            <button
              type="button"
              disabled={isUpdating}
              onClick={() => onStatusChange(application.id, "accepted")}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Accept
            </button>

            <button
              type="button"
              disabled={isUpdating}
              onClick={() => onStatusChange(application.id, "rejected")}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
              Reject
            </button>
          </>
        )}

        {application.status === "accepted" && (
          <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            Applicant Accepted
          </span>
        )}

        {application.status === "rejected" && (
          <span className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700">
            <XCircle className="h-4 w-4" />
            Application Rejected
          </span>
        )}

        {application.status === "withdrawn" && (
          <span className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-500">
            <XCircle className="h-4 w-4" />
            Application Withdrawn
          </span>
        )}
      </div>
    </div>
  );
}

/* Compact card shown in the side-by-side grid */
function OpportunityCard({ opportunity, applications, onOpen, index }) {
  const countBy = (status) =>
    applications.filter((application) => application.status === status)
      .length;

  const pendingCount = countBy("pending");
  const shortlistedCount = countBy("shortlisted");
  const acceptedCount = countBy("accepted");

  const previewProfiles = applications.slice(0, 4).map((a) => ({
    id: a.id,
    profile: a.profile,
  }));
  const extra = applications.length - previewProfiles.length;

  return (
    <article
      className="adm-rise adm-card group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:shadow-xl"
      style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}
    >
      <div className="flex flex-1 flex-col p-6">
        {/* Top: icon + status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900">
            <BriefcaseBusiness className="h-5 w-5 text-white" />
          </div>

          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${
              opportunity.status === "open"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {opportunity.status}
          </span>
        </div>

        {/* Title + meta */}
        <h3 className="mt-5 line-clamp-2 text-lg font-black leading-snug text-slate-950">
          {opportunity.title}
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-400">
          <span className="capitalize">{opportunity.category || "General"}</span>
          <span className="h-1 w-1 rounded-full bg-slate-300" />
          <span>{formatCurrency(opportunity.budget)}</span>
        </div>

        {opportunity.deadline && (
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">
            <CalendarDays className="h-4 w-4 shrink-0" />
            Due {formatDate(opportunity.deadline)}
          </div>
        )}

        {/* Status chips */}
        <div className="mt-5 flex min-h-[28px] flex-wrap gap-2">
          {pendingCount > 0 && (
            <span className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-700">
              {pendingCount} Pending
            </span>
          )}

          {shortlistedCount > 0 && (
            <span className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700">
              {shortlistedCount} Shortlisted
            </span>
          )}

          {acceptedCount > 0 && (
            <span className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700">
              {acceptedCount} Accepted
            </span>
          )}
        </div>

        {/* Footer: avatars + view link, pinned to the bottom */}
        <div className="mt-auto flex items-center justify-between gap-4 border-t border-slate-100 pt-5">
          <div className="flex items-center">
            <div className="flex -space-x-2.5">
              {previewProfiles.map((item) => (
                <ApplicantAvatar
                  key={item.id}
                  profile={item.profile}
                  size="h-9 w-9"
                />
              ))}
            </div>

            <span className="ml-3 text-sm font-semibold text-slate-600">
              {extra > 0
                ? `+${extra} more`
                : `${applications.length} ${
                    applications.length === 1 ? "applicant" : "applicants"
                  }`}
            </span>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 py-2 pl-4 pr-3 text-sm font-bold text-slate-900 transition-colors group-hover:bg-slate-900 group-hover:text-white">
            View
            <ArrowUpRight className="adm-arrow h-4 w-4" />
          </span>
        </div>
      </div>

      <div className="adm-card-bar absolute inset-x-0 bottom-0 h-1 bg-slate-900" />

      {/* Whole card opens the modal */}
      <button
        type="button"
        onClick={onOpen}
        aria-label={`View applicants for ${opportunity.title}`}
        className="absolute inset-0 z-10 rounded-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
      />
    </article>
  );
}

/* Modal listing every applicant for one opportunity */
function ApplicantsModal({
  opportunity,
  applications,
  onClose,
  onStatusChange,
  updatingId,
  initialStatus,
}) {
  const [modalStatus, setModalStatus] = useState(initialStatus);

  // Close on Escape and lock background scroll while open
  useEffect(() => {
    function handleKey(event) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const visibleApplications =
    modalStatus === "all"
      ? applications
      : applications.filter((application) => application.status === modalStatus);

  const countFor = (status) =>
    status === "all"
      ? applications.length
      : applications.filter((application) => application.status === status)
          .length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Applicants for ${opportunity.title}`}
    >
      {/* Backdrop */}
      <div
        className="adm-fade absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="adm-modal relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-slate-50 shadow-2xl sm:max-w-3xl sm:rounded-3xl">
        {/* Header */}
        <div className="shrink-0 border-b border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900">
                <BriefcaseBusiness className="h-5 w-5 text-white" />
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-lg font-black text-slate-950 sm:text-xl">
                  {opportunity.title}
                </h2>

                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-400">
                  <span className="capitalize">
                    {opportunity.category || "General"}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  <span>{formatCurrency(opportunity.budget)}</span>
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  <span>
                    {applications.length}{" "}
                    {applications.length === 1 ? "Applicant" : "Applicants"}
                  </span>
                </div>

                <Link
                  to={`/opportunities/${opportunity.id}`}
                  target="_blank"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 transition hover:text-slate-950"
                >
                  View Opportunity
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-950"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Status filters inside the modal */}
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {STATUS_OPTIONS.map((option) => {
              const active = modalStatus === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setModalStatus(option.value)}
                  className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                    active
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                  }`}
                >
                  {option.value === "all" ? "All" : option.label}
                  <span
                    className={`ml-1.5 ${
                      active ? "text-slate-300" : "text-slate-400"
                    }`}
                  >
                    {countFor(option.value)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable applicant list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {visibleApplications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
              <Users className="mx-auto h-8 w-8 text-slate-300" />

              <p className="mt-3 text-sm font-bold text-slate-700">
                No applications match this filter
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Try selecting another application status.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleApplications.map((application) => (
                <ApplicantCard
                  key={application.id}
                  application={application}
                  onStatusChange={onStatusChange}
                  updatingId={updatingId}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedOpportunityId, setSelectedOpportunityId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  async function loadApplications() {
    try {
      setError("");

      const { data, error: fetchError } = await supabase
        .from("applications")
        .select(APPLICATION_SELECT)
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setApplications((data || []).map(cleanApplication));
    } catch (err) {
      console.error("Failed to load applications:", err);

      setError(err?.message || "We couldn't load applications right now.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApplications();

    const channel = supabase
      .channel("admin-applications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "applications",
        },
        () => {
          loadApplications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* Every application grouped by opportunity (unfiltered, used for counts and the modal) */
  const allGroups = useMemo(() => {
    const groups = new Map();

    applications.forEach((application) => {
      const opportunity = application.opportunity;

      if (!opportunity) return;

      if (!groups.has(opportunity.id)) {
        groups.set(opportunity.id, { opportunity, applications: [] });
      }

      groups.get(opportunity.id).applications.push(application);
    });

    return groups;
  }, [applications]);

  /* Which opportunity cards to show, based on search and status filter */
  const visibleGroups = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return Array.from(allGroups.values()).filter((group) => {
      const { opportunity } = group;

      return group.applications.some((application) => {
        const profile = application.profile || {};

        if (statusFilter !== "all" && application.status !== statusFilter) {
          return false;
        }

        if (!searchTerm) return true;

        const searchableText = [
          opportunity.title,
          opportunity.category,
          profile.full_name,
          profile.username,
          profile.bio,
          application.cover_message,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(searchTerm);
      });
    });
  }, [allGroups, search, statusFilter]);

  const stats = useMemo(() => {
    const count = (status) =>
      applications.filter((application) => application.status === status)
        .length;

    return {
      total: applications.length,
      pending: count("pending"),
      shortlisted: count("shortlisted"),
      accepted: count("accepted"),
    };
  }, [applications]);

  const selectedGroup = selectedOpportunityId
    ? allGroups.get(selectedOpportunityId)
    : null;

  async function handleStatusChange(applicationId, newStatus) {
    try {
      setUpdatingId(applicationId);
      setError("");

      const { data, error: updateError } = await supabase
        .from("applications")
        .update({ status: newStatus })
        .eq("id", applicationId)
        .select(APPLICATION_SELECT)
        .single();

      if (updateError) {
        throw updateError;
      }

      const updatedApplication = cleanApplication(data);

      setApplications((current) =>
        current.map((application) =>
          application.id === applicationId ? updatedApplication : application
        )
      );
    } catch (err) {
      console.error("Failed to update application:", err);

      setError(err?.message || "We couldn't update this application.");
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200" />

          <div className="mt-2 h-4 w-80 animate-pulse rounded bg-slate-200" />

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-2xl bg-slate-200"
              />
            ))}
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-64 animate-pulse rounded-3xl bg-slate-200"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <style>{animationStyles}</style>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Header */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Talent Management
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Applications
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Pick an opportunity to review the talents who applied and manage
              their application status.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-500 shadow-sm ring-1 ring-slate-200">
              {applications.length} Total Applications
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

            <div>
              <p className="text-sm font-bold text-red-800">
                Something went wrong
              </p>

              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
              className="ml-auto text-red-500 transition hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Statistics */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Users}
            label="Total Applications"
            value={stats.total}
            description="All submitted applications"
            delay={0}
          />

          <StatCard
            icon={Clock3}
            label="Pending"
            value={stats.pending}
            description="Waiting for review"
            delay={70}
          />

          <StatCard
            icon={CheckCircle2}
            label="Shortlisted"
            value={stats.shortlisted}
            description="Talents selected for review"
            delay={140}
          />

          <StatCard
            icon={Check}
            label="Accepted"
            value={stats.accepted}
            description="Applications accepted"
            delay={210}
          />
        </div>

        {/* Controls */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Search */}
            <div className="relative w-full lg:max-w-md">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search opportunities or talents..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-900/5"
              />
            </div>

            {/* Status filters */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {STATUS_OPTIONS.map((option) => {
                const active = statusFilter === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatusFilter(option.value)}
                    className={`shrink-0 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                      active
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {visibleGroups.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-4 text-right text-xs text-slate-400">
              {visibleGroups.length}{" "}
              {visibleGroups.length === 1 ? "opportunity" : "opportunities"}
            </div>
          )}
        </div>

        {/* Opportunities: side-by-side grid */}
        <section className="mt-6">
          {visibleGroups.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                <Users className="h-7 w-7 text-slate-400" />
              </div>

              <h2 className="mt-5 text-xl font-black text-slate-950">
                No applications found
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {applications.length === 0
                  ? "When talents apply for your opportunities, their applications will appear here."
                  : "Try changing your search or application status filter."}
              </p>
            </div>
          ) : (
            <div
              key={`${statusFilter}-${search}`}
              className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
            >
              {visibleGroups.map((group, index) => (
                <OpportunityCard
                  key={group.opportunity.id}
                  index={index}
                  opportunity={group.opportunity}
                  applications={group.applications}
                  onOpen={() => setSelectedOpportunityId(group.opportunity.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Applicants modal */}
      {selectedGroup && (
        <ApplicantsModal
          key={selectedGroup.opportunity.id}
          opportunity={selectedGroup.opportunity}
          applications={selectedGroup.applications}
          initialStatus={statusFilter}
          updatingId={updatingId}
          onStatusChange={handleStatusChange}
          onClose={() => setSelectedOpportunityId(null)}
        />
      )}
    </main>
  );
}