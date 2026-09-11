import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Code2,
  Clock3,
  Download,
  ExternalLink,
  FileArchive,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
  X,
  XCircle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

const formatStatus = (value = "") =>
  value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const submissionStyles = {
  pending: "bg-amber-100 text-amber-700",
  verified: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  changes_requested: "bg-orange-100 text-orange-700",
};

export default function AdminProjectVerification() {
  const [submissions, setSubmissions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedSubmission, setSelectedSubmission] =
    useState(null);

  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    loadSubmissions();

    const channel = supabase
      .channel("admin-project-verification-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "project_submissions",
        },
        () => {
          loadSubmissions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadSubmissions() {
    try {
      setLoading(true);
      setError("");

      const { data, error: queryError } = await supabase
        .from("project_submissions")
        .select(`
          id,
          project_id,
          talent_id,
          description,
          additional_notes,
          zip_file_path,
          zip_file_name,
          screenshots,
          project_url,
          repository_url,
          status,
          admin_feedback,
          submitted_at,
          reviewed_at,
          reviewed_by,

          project:project_id (
            id,
            title,
            description,
            category,
            skills,
            status,
            verification_status,
            opportunity_id,
            talent_id,

            opportunity:opportunity_id (
              id,
              title,
              category,
              budget,
              deadline,
              location
            )
          ),

          talent:talent_id (
            id,
            full_name,
            username,
            avatar_url,
            location
          )
        `)
        .order("submitted_at", { ascending: false });

      if (queryError) throw queryError;

      setSubmissions(data || []);
    } catch (err) {
      console.error(err);
      setError(
        err.message || "Could not load project submissions."
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredSubmissions = useMemo(() => {
    const term = search.toLowerCase().trim();

    return submissions.filter((submission) => {
      const matchesStatus =
        statusFilter === "all" ||
        submission.status === statusFilter;

      if (!matchesStatus) return false;

      if (!term) return true;

      const haystack = [
        submission.zip_file_name,
        submission.project?.title,
        submission.project?.category,
        submission.talent?.full_name,
        submission.talent?.username,
        submission.talent?.location,
        submission.project?.opportunity?.title,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [submissions, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: submissions.length,
      pending: submissions.filter(
        (item) => item.status === "pending"
      ).length,
      verified: submissions.filter(
        (item) => item.status === "verified"
      ).length,
      rejected: submissions.filter(
        (item) =>
          item.status === "rejected" ||
          item.status === "changes_requested"
      ).length,
    };
  }, [submissions]);

  function openReview(submission) {
    setSelectedSubmission(submission);
    setFeedback(submission.admin_feedback || "");
  }

  function closeReview() {
    if (processing) return;

    setSelectedSubmission(null);
    setFeedback("");
  }

  async function downloadZip(submission) {
    try {
      setError("");

      if (!submission.zip_file_path) {
        throw new Error("No ZIP file is attached to this submission.");
      }

      const { data, error: signedUrlError } =
        await supabase.storage
          .from("project-submissions")
          .createSignedUrl(submission.zip_file_path, 300);

      if (signedUrlError) throw signedUrlError;

      if (!data?.signedUrl) {
        throw new Error("Could not generate download link.");
      }

      window.open(data.signedUrl, "_blank");
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not download the ZIP file.");
    }
  }

  async function updateSubmission(
    newStatus,
    projectStatus,
    verificationStatus
  ) {
    if (!selectedSubmission) return;

    try {
      setProcessing(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Your admin session has expired.");
      }

      const now = new Date().toISOString();

      const { error: submissionError } = await supabase
        .from("project_submissions")
        .update({
          status: newStatus,
          admin_feedback: feedback.trim() || null,
          reviewed_at: now,
          reviewed_by: user.id,
        })
        .eq("id", selectedSubmission.id);

      if (submissionError) throw submissionError;

      const { error: projectError } = await supabase
        .from("projects")
        .update({
          status: projectStatus,
          verification_status: verificationStatus,
          updated_at: now,
          ...(verificationStatus === "verified"
            ? {
                completed_at:
                  selectedSubmission.project?.completed_at || now,
              }
            : {}),
        })
        .eq("id", selectedSubmission.project_id);

      if (projectError) throw projectError;

      closeReview();
      await loadSubmissions();
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not update submission.");
    } finally {
      setProcessing(false);
    }
  }

  async function verifyProject() {
    await updateSubmission(
      "verified",
      "completed",
      "verified"
    );
  }

  async function rejectProject() {
    await updateSubmission(
      "rejected",
      "in_progress",
      "rejected"
    );
  }

  async function requestChanges() {
    if (!feedback.trim()) {
      setError(
        "Please provide feedback explaining what changes are required."
      );
      return;
    }

    await updateSubmission(
      "changes_requested",
      "in_progress",
      "changes_requested"
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          Loading project submissions...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <ShieldCheck className="h-4 w-4" />
            Project Verification
          </div>

          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Review Submitted Projects
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Review completed work before it becomes part of a
            talent's verified portfolio.
          </p>
        </div>

        <button
          onClick={loadSubmissions}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />

          <span className="flex-1">{error}</span>

          <button
            onClick={() => setError("")}
            className="text-red-500 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Submissions"
          value={stats.total}
          icon={<FileArchive className="h-5 w-5" />}
        />

        <StatCard
          label="Awaiting Review"
          value={stats.pending}
          icon={<Clock3 className="h-5 w-5" />}
        />

        <StatCard
          label="Verified"
          value={stats.verified}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />

        <StatCard
          label="Rejected / Changes"
          value={stats.rejected}
          icon={<XCircle className="h-5 w-5" />}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects, talents, opportunities..."
            className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-slate-400"
        >
          <option value="all">All Submissions</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="changes_requested">
            Changes Requested
          </option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      {filteredSubmissions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <FileArchive className="mx-auto h-12 w-12 text-slate-300" />

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            No submissions found
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            There are no project submissions matching your filters.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px]">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Project
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Talent
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Submitted
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredSubmissions.map((submission) => (
                  <tr
                    key={submission.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                          <FileArchive className="h-5 w-5 text-slate-500" />
                        </div>

                        <div>
                          <p className="font-semibold text-slate-900">
                            {submission.project?.title ||
                              "Untitled Project"}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {submission.project?.opportunity
                              ?.title || "TCSN Network Project"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {submission.talent?.avatar_url ? (
                          <img
                            src={submission.talent.avatar_url}
                            alt=""
                            className="h-9 w-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                            <User className="h-4 w-4 text-slate-400" />
                          </div>
                        )}

                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {submission.talent?.full_name ||
                              "Unknown Talent"}
                          </p>

                          {submission.talent?.username && (
                            <p className="text-xs text-slate-500">
                              @{submission.talent.username}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatDate(submission.submitted_at)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                          submissionStyles[submission.status] ||
                          "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {formatStatus(submission.status)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => openReview(submission)}
                        className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* Modal header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Review Project
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {selectedSubmission.project?.title}
                </p>
              </div>

              <button
                onClick={closeReview}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              {/* Talent */}
              <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4">
                {selectedSubmission.talent?.avatar_url ? (
                  <img
                    src={selectedSubmission.talent.avatar_url}
                    alt=""
                    className="h-14 w-14 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white">
                    <User className="h-6 w-6 text-slate-400" />
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Submitted By
                  </p>

                  <p className="mt-1 font-bold text-slate-900">
                    {selectedSubmission.talent?.full_name ||
                      "Unknown Talent"}
                  </p>

                  {selectedSubmission.talent?.username && (
                    <p className="text-sm text-slate-500">
                      @{selectedSubmission.talent.username}
                    </p>
                  )}
                </div>
              </div>

              {/* Project information */}
              <section>
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">
                  Project Information
                </h3>

                <div className="mt-3 rounded-xl border border-slate-200 p-4">
                  <h4 className="font-bold text-slate-900">
                    {selectedSubmission.project?.title}
                  </h4>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {selectedSubmission.description ||
                      selectedSubmission.project?.description ||
                      "No description provided."}
                  </p>

                  {selectedSubmission.project?.skills?.length >
                    0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {selectedSubmission.project.skills.map(
                        (skill) => (
                          <span
                            key={skill}
                            className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                          >
                            {skill}
                          </span>
                        )
                      )}
                    </div>
                  )}
                </div>
              </section>

              {/* Notes */}
              {selectedSubmission.additional_notes && (
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">
                    Additional Notes
                  </h3>

                  <div className="mt-3 rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-900">
                    {selectedSubmission.additional_notes}
                  </div>
                </section>
              )}

              {/* ZIP */}
              <section>
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">
                  Project Files
                </h3>

                <div className="mt-3 flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                      <FileArchive className="h-5 w-5 text-slate-600" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {selectedSubmission.zip_file_name ||
                          "Project ZIP"}
                      </p>

                      <p className="text-xs text-slate-500">
                        Private TCSN Network submission
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      downloadZip(selectedSubmission)
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    <Download className="h-4 w-4" />
                    Download ZIP
                  </button>
                </div>
              </section>

              {/* Links */}
              {(selectedSubmission.project_url ||
                selectedSubmission.repository_url) && (
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">
                    External Links
                  </h3>

                  <div className="mt-3 flex flex-wrap gap-3">
                    {selectedSubmission.project_url && (
                      <a
                        href={selectedSubmission.project_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Live Project
                      </a>
                    )}

                    {selectedSubmission.repository_url && (
                      <a
                        href={selectedSubmission.repository_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Code2 className="h-4 w-4" />
                        Repository
                      </a>
                    )}
                  </div>
                </section>
              )}

              {/* Feedback */}
              <section>
                <label className="text-sm font-bold uppercase tracking-wide text-slate-400">
                  Admin Feedback
                </label>

                <textarea
                  rows={4}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Write feedback for the talent..."
                  className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </section>

              {/* Actions */}
              <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  onClick={rejectProject}
                  disabled={processing}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </button>

                <button
                  onClick={requestChanges}
                  disabled={processing}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-5 py-3 text-sm font-semibold text-orange-700 hover:bg-orange-100 disabled:opacity-50"
                >
                  <AlertCircle className="h-4 w-4" />
                  Request Changes
                </button>

                <button
                  onClick={verifyProject}
                  disabled={processing}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}

                  {processing ? "Processing..." : "Verify Project"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
        {icon}
      </div>

      <p className="mt-4 text-2xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}
