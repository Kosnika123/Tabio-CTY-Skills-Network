import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Upload,
  X,
  AlertCircle,
  FileArchive,
  Loader2,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

const MAX_FILE_SIZE = 100 * 1024 * 1024;

const statusStyles = {
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  submitted: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

const verificationStyles = {
  not_submitted: "bg-slate-100 text-slate-600",
  pending: "bg-amber-100 text-amber-700",
  verified: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  changes_requested: "bg-orange-100 text-orange-700",
};

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

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "—";

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value));
};

export default function TalentMyProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [user, setUser] = useState(null);

  const [selectedProject, setSelectedProject] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const [zipFile, setZipFile] = useState(null);
  const [description, setDescription] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [projectUrl, setProjectUrl] = useState("");

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    initialize();

    const channel = supabase
      .channel("talent-projects-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
        },
        () => {
          loadProjects();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "project_submissions",
        },
        () => {
          loadProjects();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function initialize() {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      setError("You must be logged in to view your projects.");
      setLoading(false);
      return;
    }

    setUser(currentUser);
    await loadProjects(currentUser.id);
  }

  async function loadProjects(userId = user?.id) {
    if (!userId) return;

    try {
      setError("");

      const { data, error: queryError } = await supabase
        .from("projects")
        .select(`
          id,
          application_id,
          opportunity_id,
          client_id,
          talent_id,
          title,
          description,
          category,
          skills,
          project_url,
          images,
          status,
          verification_status,
          started_at,
          completed_at,
          created_at,
          updated_at,
          opportunity:opportunity_id (
            id,
            title,
            short_description,
            category,
            budget,
            deadline,
            location,
            project_type,
            skills,
            images
          ),
          submissions:project_submissions (
            id,
            description,
            additional_notes,
            zip_file_path,
            zip_file_name,
            screenshots,
            project_url,
            status,
            admin_feedback,
            submitted_at,
            reviewed_at
          )
        `)
        .eq("talent_id", userId)
        .order("created_at", { ascending: false });

      if (queryError) throw queryError;

      setProjects(data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not load your projects.");
    } finally {
      setLoading(false);
    }
  }

  function openSubmitModal(project) {
    setSelectedProject(project);

    const latestSubmission =
      project.submissions?.length > 0
        ? [...project.submissions].sort(
            (a, b) =>
              new Date(b.submitted_at) - new Date(a.submitted_at)
          )[0]
        : null;

    setDescription(latestSubmission?.description || "");
    setAdditionalNotes(latestSubmission?.additional_notes || "");
    setProjectUrl(
      latestSubmission?.project_url || project.project_url || ""
    );

    setZipFile(null);
    setShowSubmitModal(true);
  }

  function closeSubmitModal() {
    if (submitting) return;

    setShowSubmitModal(false);
    setSelectedProject(null);
    setZipFile(null);
    setDescription("");
    setAdditionalNotes("");
    setProjectUrl("");
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      setZipFile(null);
      return;
    }

    if (!file.name.toLowerCase().endsWith(".zip")) {
      setError("Please select a ZIP file.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("The ZIP file cannot be larger than 100MB.");
      event.target.value = "";
      return;
    }

    setError("");
    setZipFile(file);
  }

  async function submitProject() {
    if (!selectedProject || !user) return;

    if (!zipFile) {
      setError("Please select the completed project ZIP file.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const extension = zipFile.name.split(".").pop() || "zip";

      const filePath = `${user.id}/${selectedProject.id}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("project-submissions")
        .upload(filePath, zipFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: "application/zip",
        });

      if (uploadError) throw uploadError;

      const { error: submissionError } = await supabase
        .from("project_submissions")
        .insert({
          project_id: selectedProject.id,
          talent_id: user.id,
          description: description.trim() || null,
          additional_notes: additionalNotes.trim() || null,
          zip_file_path: filePath,
          zip_file_name: zipFile.name,
          project_url: projectUrl.trim() || null,
          status: "pending",
        });

      if (submissionError) {
        await supabase.storage
          .from("project-submissions")
          .remove([filePath]);

        throw submissionError;
      }

      const { error: projectError } = await supabase
        .from("projects")
        .update({
          status: "submitted",
          verification_status: "pending",
          project_url: projectUrl.trim() || null,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedProject.id)
        .eq("talent_id", user.id);

      if (projectError) throw projectError;

      closeSubmitModal();
      await loadProjects(user.id);
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not submit your project.");
    } finally {
      setSubmitting(false);
    }
  }

  function getLatestSubmission(project) {
    if (!project.submissions?.length) return null;

    return [...project.submissions].sort(
      (a, b) =>
        new Date(b.submitted_at) - new Date(a.submitted_at)
    )[0];
  }

  function canSubmit(project) {
    return (
      project.verification_status !== "verified" &&
      project.verification_status !== "pending"
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          Loading your projects...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <BriefcaseBusiness className="h-4 w-4" />
            My Projects
          </div>

          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Projects
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage the projects you have been assigned through TCSN Network.
          </p>
        </div>

        <button
          onClick={() => loadProjects()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex-1">{error}</div>

          <button
            onClick={() => setError("")}
            className="text-red-500 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Empty */}
      {projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
            <BriefcaseBusiness className="h-8 w-8 text-slate-400" />
          </div>

          <h2 className="mt-5 text-lg font-semibold text-slate-900">
            No projects yet
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Projects will appear here when one of your applications is
            accepted.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {projects.map((project) => {
            const latestSubmission = getLatestSubmission(project);

            const image =
              project.images?.[0] ||
              project.opportunity?.images?.[0] ||
              null;

            return (
              <div
                key={project.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                {/* Image */}
                <div className="relative h-48 bg-slate-100">
                  {image ? (
                    <img
                      src={image}
                      alt={project.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <BriefcaseBusiness className="h-12 w-12 text-slate-300" />
                    </div>
                  )}

                  <div className="absolute left-4 top-4">
                    <span
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                        statusStyles[project.status] ||
                        "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {formatStatus(project.status)}
                    </span>
                  </div>

                  <div className="absolute right-4 top-4">
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                        verificationStyles[
                          project.verification_status
                        ] || verificationStyles.not_submitted
                      }`}
                    >
                      {formatStatus(project.verification_status)}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {project.title ||
                          project.opportunity?.title ||
                          "Untitled Project"}
                      </h2>

                      {project.category && (
                        <p className="mt-1 text-sm text-slate-500">
                          {formatStatus(project.category)}
                        </p>
                      )}
                    </div>

                    {project.opportunity?.budget && (
                      <span className="shrink-0 text-sm font-bold text-slate-900">
                        {formatCurrency(project.opportunity.budget)}
                      </span>
                    )}
                  </div>

                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
                    {project.description ||
                      project.opportunity?.short_description ||
                      "No project description available."}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <CalendarDays className="h-4 w-4" />
                        Started
                      </div>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {formatDate(project.started_at)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock3 className="h-4 w-4" />
                        Deadline
                      </div>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {formatDate(project.opportunity?.deadline)}
                      </p>
                    </div>
                  </div>

                  {project.opportunity?.location && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                      <MapPin className="h-4 w-4" />
                      {project.opportunity.location}
                    </div>
                  )}

                  {/* Skills */}
                  {project.skills?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {project.skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Verification feedback */}
                  {latestSubmission?.admin_feedback && (
                    <div className="mt-5 rounded-xl border border-orange-200 bg-orange-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
                        Admin Feedback
                      </p>

                      <p className="mt-2 text-sm leading-6 text-orange-900">
                        {latestSubmission.admin_feedback}
                      </p>
                    </div>
                  )}

                  {/* Links */}
                  {project.project_url && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      <a
                        href={project.project_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Live Project
                      </a>
                    </div>
                  )}

                  {/* Action */}
                  <div className="mt-5 border-t border-slate-100 pt-5">
                    {project.verification_status === "verified" ? (
                      <div className="flex items-center gap-2 text-sm font-semibold text-green-600">
                        <CheckCircle2 className="h-5 w-5" />
                        Project verified by TCSN Network
                      </div>
                    ) : project.verification_status === "pending" ? (
                      <div className="flex items-center gap-2 text-sm font-semibold text-amber-600">
                        <Clock3 className="h-5 w-5" />
                        Waiting for admin verification
                      </div>
                    ) : (
                      canSubmit(project) && (
                        <button
                          onClick={() => openSubmitModal(project)}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          <Upload className="h-4 w-4" />
                          {project.verification_status ===
                          "changes_requested"
                            ? "Resubmit Project"
                            : "Submit Completed Work"}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Modal */}
      {showSubmitModal && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Submit Completed Work
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedProject.title}
                </p>
              </div>

              <button
                onClick={closeSubmitModal}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              {/* ZIP */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Project ZIP *
                </label>

                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition hover:border-slate-400">
                  <FileArchive className="h-10 w-10 text-slate-400" />

                  <span className="mt-3 text-sm font-semibold text-slate-800">
                    {zipFile
                      ? zipFile.name
                      : "Choose your project ZIP file"}
                  </span>

                  <span className="mt-1 text-xs text-slate-500">
                    ZIP files only · Maximum 100MB
                  </span>

                  <input
                    type="file"
                    accept=".zip,application/zip"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  What did you build?
                </label>

                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain what you completed and the main features of the project..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Additional Notes
                </label>

                <textarea
                  rows={3}
                  value={additionalNotes}
                  onChange={(e) =>
                    setAdditionalNotes(e.target.value)
                  }
                  placeholder="Anything the admin should know about your submission?"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              {/* URL */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Live Project URL
                </label>

                <input
                  type="url"
                  value={projectUrl}
                  onChange={(e) => setProjectUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <div className="rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-800">
                You don't need to know how to host your project. Uploading
                the ZIP is enough for TCSN Network to review your work.
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  onClick={closeSubmitModal}
                  disabled={submitting}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={submitProject}
                  disabled={submitting || !zipFile}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Submit for Verification
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}