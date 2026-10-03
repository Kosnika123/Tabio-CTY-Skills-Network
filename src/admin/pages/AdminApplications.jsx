import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
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
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "T";
}

function getAvatar(profile) {
  return (
    profile?.avatar_url ||
    profile?.avatar ||
    profile?.image_url ||
    ""
  );
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

function StatusBadge({ status }) {
  const config =
    STATUS_STYLES[status] || STATUS_STYLES.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${config.className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${config.dot}`}
      />
      {config.label}
    </span>
  );
}

function ApplicantAvatar({ profile }) {
  const name =
    profile?.full_name ||
    profile?.username ||
    "Talent";

  const avatar = getAvatar(profile);

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className="h-12 w-12 rounded-full object-cover ring-2 ring-white"
      />
    );
  }

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-black text-white ring-2 ring-white">
      {getInitials(name)}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  description,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {label}
          </p>

          <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            {value}
          </p>

          {description && (
            <p className="mt-1 text-xs text-slate-400">
              {description}
            </p>
          )}
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
          <Icon className="h-5 w-5 text-slate-700" />
        </div>
      </div>
    </div>
  );
}

function ApplicantCard({
  application,
  onStatusChange,
  updatingId,
}) {
  const profile = application.profile || {};

  const name =
    profile.full_name ||
    profile.username ||
    "Unnamed Talent";

  const username = profile.username
    ? `@${profile.username}`
    : "";

  const skills = normalizeSkills(profile.skills);

  const isUpdating = updatingId === application.id;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
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
              <p className="mt-0.5 text-sm text-slate-400">
                {username}
              </p>
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
        <div className="shrink-0 text-left lg:text-right">
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
      <div className="mt-5 flex flex-wrap gap-2">
        {profile.portfolio_url && (
          <a
            href={profile.portfolio_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
          >
            Portfolio
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}

        {profile.github_url && (
          <a
            href={profile.github_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
          >
            GitHub
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}

        {profile.linkedin_url && (
          <a
            href={profile.linkedin_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
          >
            LinkedIn
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      {/* Actions */}
      <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
        <Link
          to={`/admin/talent/${application.talent_id}`}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          <User className="h-4 w-4" />
          View Profile
        </Link>

        {application.status !== "accepted" &&
          application.status !== "rejected" &&
          application.status !== "withdrawn" && (
            <>
              {application.status !== "shortlisted" && (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() =>
                    onStatusChange(
                      application.id,
                      "shortlisted"
                    )
                  }
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
                onClick={() =>
                  onStatusChange(
                    application.id,
                    "accepted"
                  )
                }
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
                onClick={() =>
                  onStatusChange(
                    application.id,
                    "rejected"
                  )
                }
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

function OpportunityCard({
  opportunity,
  applications,
  expanded,
  onToggle,
  onStatusChange,
  updatingId,
  statusFilter,
}) {
  const visibleApplications =
    statusFilter === "all"
      ? applications
      : applications.filter(
          (application) =>
            application.status === statusFilter
        );

  const pendingCount = applications.filter(
    (application) => application.status === "pending"
  ).length;

  const shortlistedCount = applications.filter(
    (application) => application.status === "shortlisted"
  ).length;

  const acceptedCount = applications.filter(
    (application) => application.status === "accepted"
  ).length;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      {/* Opportunity header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left transition hover:bg-slate-50"
      >
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900">
                <BriefcaseBusiness className="h-5 w-5 text-white" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-lg font-black text-slate-950">
                    {opportunity.title}
                  </h3>

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

                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-400">
                  <span className="capitalize">
                    {opportunity.category || "General"}
                  </span>

                  <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />

                  <span>
                    {formatCurrency(opportunity.budget)}
                  </span>

                  <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />

                  <span>
                    {applications.length}{" "}
                    {applications.length === 1
                      ? "Applicant"
                      : "Applicants"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 lg:justify-end">
              <div className="flex flex-wrap gap-2">
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

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                {expanded ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </div>
            </div>
          </div>
        </div>
      </button>

      {/* Applicant list */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/60 p-4 sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-sm font-black text-slate-950">
                Applicants
              </h4>

              <p className="mt-1 text-xs text-slate-400">
                {visibleApplications.length}{" "}
                {visibleApplications.length === 1
                  ? "application"
                  : "applications"}{" "}
                shown
              </p>
            </div>

            <Link
              to={`/opportunities/${opportunity.id}`}
              target="_blank"
              className="inline-flex w-fit items-center gap-1.5 text-xs font-bold text-slate-500 transition hover:text-slate-950"
            >
              View Opportunity
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>

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
      )}
    </div>
  );
}

export default function AdminApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [expandedOpportunities, setExpandedOpportunities] =
    useState({});

  const [updatingId, setUpdatingId] = useState(null);

  async function loadApplications() {
    try {
      setLoading(true);
      setError("");

      const { data, error: fetchError } = await supabase
        .from("applications")
        .select(`
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
        `)
        .order("created_at", {
          ascending: false,
        });

      if (fetchError) {
        throw fetchError;
      }

      const cleanedApplications = (data || []).map(
        (application) => ({
          ...application,
          opportunity: Array.isArray(
            application.opportunity
          )
            ? application.opportunity[0] || null
            : application.opportunity,
          profile: Array.isArray(application.profile)
            ? application.profile[0] || null
            : application.profile,
        })
      );

      setApplications(cleanedApplications);

      // Automatically expand opportunities with applications
      const opportunityIds = {};

      cleanedApplications.forEach((application) => {
        if (application.opportunity_id) {
          opportunityIds[application.opportunity_id] = true;
        }
      });

      setExpandedOpportunities((current) => {
        if (Object.keys(current).length > 0) {
          return current;
        }

        return opportunityIds;
      });
    } catch (err) {
      console.error(
        "Failed to load applications:",
        err
      );

      setError(
        err?.message ||
          "We couldn't load applications right now."
      );
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

  const filteredApplications = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return applications.filter((application) => {
      const opportunity =
        application.opportunity || {};

      const profile = application.profile || {};

      const matchesStatus =
        statusFilter === "all" ||
        application.status === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!searchTerm) {
        return true;
      }

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
  }, [applications, search, statusFilter]);

  const groupedOpportunities = useMemo(() => {
    const groups = new Map();

    filteredApplications.forEach((application) => {
      const opportunity = application.opportunity;

      if (!opportunity) {
        return;
      }

      if (!groups.has(opportunity.id)) {
        groups.set(opportunity.id, {
          opportunity,
          applications: [],
        });
      }

      groups
        .get(opportunity.id)
        .applications.push(application);
    });

    return Array.from(groups.values());
  }, [filteredApplications]);

  const stats = useMemo(() => {
    return {
      total: applications.length,

      pending: applications.filter(
        (application) =>
          application.status === "pending"
      ).length,

      shortlisted: applications.filter(
        (application) =>
          application.status === "shortlisted"
      ).length,

      accepted: applications.filter(
        (application) =>
          application.status === "accepted"
      ).length,

      rejected: applications.filter(
        (application) =>
          application.status === "rejected"
      ).length,
    };
  }, [applications]);

  async function handleStatusChange(
    applicationId,
    newStatus
  ) {
    try {
      setUpdatingId(applicationId);
      setError("");

      const { data, error: updateError } =
        await supabase
          .from("applications")
          .update({
            status: newStatus,
          })
          .eq("id", applicationId)
          .select(`
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
          `)
          .single();

      if (updateError) {
        throw updateError;
      }

      const updatedApplication = {
        ...data,
        opportunity: Array.isArray(data.opportunity)
          ? data.opportunity[0] || null
          : data.opportunity,
        profile: Array.isArray(data.profile)
          ? data.profile[0] || null
          : data.profile,
      };

      setApplications((current) =>
        current.map((application) =>
          application.id === applicationId
            ? updatedApplication
            : application
        )
      );
    } catch (err) {
      console.error(
        "Failed to update application:",
        err
      );

      setError(
        err?.message ||
          "We couldn't update this application."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function toggleOpportunity(opportunityId) {
    setExpandedOpportunities((current) => ({
      ...current,
      [opportunityId]:
        !current[opportunityId],
    }));
  }

  function expandAll() {
    const next = {};

    groupedOpportunities.forEach((group) => {
      next[group.opportunity.id] = true;
    });

    setExpandedOpportunities(next);
  }

  function collapseAll() {
    const next = {};

    groupedOpportunities.forEach((group) => {
      next[group.opportunity.id] = false;
    });

    setExpandedOpportunities(next);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200" />

          <div className="mt-2 h-4 w-80 animate-pulse rounded bg-slate-200" />

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-32 animate-pulse rounded-2xl bg-slate-200"
                />
              )
            )}
          </div>

          <div className="mt-8 space-y-4">
            {Array.from({ length: 3 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-28 animate-pulse rounded-3xl bg-slate-200"
                />
              )
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
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
              Review talents who applied for your
              opportunities and manage their
              application status.
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

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
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
          />

          <StatCard
            icon={Clock3}
            label="Pending"
            value={stats.pending}
            description="Waiting for review"
          />

          <StatCard
            icon={CheckCircle2}
            label="Shortlisted"
            value={stats.shortlisted}
            description="Talents selected for review"
          />

          <StatCard
            icon={Check}
            label="Accepted"
            value={stats.accepted}
            description="Applications accepted"
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
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search opportunities or talents..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-900/5"
              />
            </div>

            {/* Status filters */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {STATUS_OPTIONS.map((option) => {
                const active =
                  statusFilter === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setStatusFilter(option.value)
                    }
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

          {/* Expand/collapse */}
          {groupedOpportunities.length > 0 && (
            <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={expandAll}
                className="text-xs font-bold text-slate-500 transition hover:text-slate-950"
              >
                Expand all
              </button>

              <span className="h-1 w-1 rounded-full bg-slate-300" />

              <button
                type="button"
                onClick={collapseAll}
                className="text-xs font-bold text-slate-500 transition hover:text-slate-950"
              >
                Collapse all
              </button>

              <span className="ml-auto text-xs text-slate-400">
                {groupedOpportunities.length}{" "}
                {groupedOpportunities.length === 1
                  ? "opportunity"
                  : "opportunities"}
              </span>
            </div>
          )}
        </div>

        {/* Opportunities */}
        <section className="mt-6">
          {groupedOpportunities.length === 0 ? (
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
            <div className="space-y-4">
              {groupedOpportunities.map(
                (group) => (
                  <OpportunityCard
                    key={group.opportunity.id}
                    opportunity={group.opportunity}
                    applications={group.applications}
                    expanded={
                      Boolean(
                        expandedOpportunities[
                          group.opportunity.id
                        ]
                      )
                    }
                    onToggle={() =>
                      toggleOpportunity(
                        group.opportunity.id
                      )
                    }
                    onStatusChange={
                      handleStatusChange
                    }
                    updatingId={updatingId}
                    statusFilter={statusFilter}
                  />
                )
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}