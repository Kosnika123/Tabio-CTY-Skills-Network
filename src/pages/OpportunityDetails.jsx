import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Wallet,
  X,
} from "lucide-react";

import { supabase } from "../lib/supabase";

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

function formatDate(date) {
  if (!date) return "No deadline";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

function getImages(images) {
  if (!Array.isArray(images)) return [];

  return images
    .map((image) => {
      if (typeof image === "string") return image;
      if (image?.url) return image.url;
      return null;
    })
    .filter(Boolean);
}

export default function OpportunityDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [opportunity, setOpportunity] = useState(null);

  const [loading, setLoading] = useState(true);
  const [applicationLoading, setApplicationLoading] =
    useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [applicationError, setApplicationError] =
    useState("");

  const [application, setApplication] = useState(null);

  const [activeImage, setActiveImage] = useState(0);

  async function loadOpportunity() {
    try {
      setLoading(true);
      setError("");

      const { data, error: fetchError } = await supabase
        .from("opportunities")
        .select(`
          id,
          title,
          short_description,
          description,
          category,
          budget,
          deadline,
          status,
          images,
          location,
          project_type,
          skills,
          created_at
        `)
        .eq("id", id)
        .eq("status", "open")
        .single();

      if (fetchError) {
        throw fetchError;
      }

      setOpportunity(data);
    } catch (err) {
      console.error(
        "Failed to load opportunity:",
        err
      );

      setError(
        err?.message ||
          "We couldn't load this opportunity right now."
      );
    } finally {
      setLoading(false);
    }
  }

  async function checkApplication() {
    try {
      setApplicationLoading(true);
      setApplicationError("");

      /*
       * Get currently logged-in user.
       */
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      /*
       * User is not logged in.
       * That's okay — they can still view the opportunity.
       */
      if (!user) {
        setApplication(null);
        return;
      }

      /*
       * Check whether this user already applied.
       */
      const { data, error: applicationFetchError } =
        await supabase
          .from("applications")
          .select(`
            id,
            opportunity_id,
            talent_id,
            cover_letter,
            proposed_price,
            status,
            created_at,
            updated_at
          `)
          .eq("opportunity_id", id)
          .eq("talent_id", user.id)
          .maybeSingle();

      if (applicationFetchError) {
        throw applicationFetchError;
      }

      setApplication(data || null);
    } catch (err) {
      console.error(
        "Failed to check application:",
        err
      );

      setApplicationError(
        err?.message ||
          "We couldn't check your application status."
      );
    } finally {
      setApplicationLoading(false);
    }
  }

  useEffect(() => {
    if (!id) return;

    loadOpportunity();
    checkApplication();
  }, [id]);

  async function handleApply() {
    try {
      setSubmitting(true);
      setApplicationError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        navigate(`/login?redirect=/opportunities/${id}`);
        return;
      }

      const { data: existingApplication, error: existingError } =
        await supabase
          .from("applications")
          .select(`
            id,
            opportunity_id,
            talent_id,
            cover_letter,
            proposed_price,
            status,
            created_at,
            updated_at
          `)
          .eq("opportunity_id", id)
          .eq("talent_id", user.id)
          .maybeSingle();

      if (existingError) throw existingError;

      if (existingApplication) {
        setApplication(existingApplication);
        return;
      }

      const { data: newApplication, error: insertError } =
        await supabase
          .from("applications")
          .insert({
            opportunity_id: id,
            talent_id: user.id,
            status: "pending",
            cover_letter: "",
            proposed_price: opportunity?.budget || null,
          })
          .select(`
            id,
            opportunity_id,
            talent_id,
            cover_letter,
            proposed_price,
            status,
            created_at,
            updated_at
          `)
          .single();

      if (insertError) {
        throw insertError;
      }

      setApplication(newApplication);
    } catch (err) {
      console.error(
        "Failed to submit application:",
        err
      );

      if (err?.code === "23505") {
        setApplicationError("You have already applied for this opportunity.");
      } else {
        setApplicationError(
          err?.message ||
            "Unable to submit your application right now."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
            <div>
              <div className="h-[360px] animate-pulse rounded-3xl bg-slate-200 sm:h-[460px]" />

              <div className="mt-8 space-y-4">
                <div className="h-8 w-2/3 animate-pulse rounded bg-slate-200" />

                <div className="h-5 w-full animate-pulse rounded bg-slate-200" />

                <div className="h-5 w-5/6 animate-pulse rounded bg-slate-200" />
              </div>
            </div>

            <div className="h-[420px] animate-pulse rounded-3xl bg-slate-200" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !opportunity) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <BriefcaseBusiness className="h-7 w-7 text-slate-400" />
          </div>

          <h1 className="mt-5 text-2xl font-black text-slate-950">
            Opportunity not found
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {error ||
              "This opportunity may no longer be available or may have been removed."}
          </p>

          <Link
            to="/opportunities"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Opportunities
          </Link>
        </div>
      </main>
    );
  }

  const images = getImages(opportunity.images);

  const skills = Array.isArray(opportunity.skills)
    ? opportunity.skills
    : [];

  const hasDeadline = Boolean(opportunity.deadline);

  const applicationStatus = application?.status;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top bar */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <Link
            to="/opportunities"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Opportunities
          </Link>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          {/* Main content */}
          <div className="min-w-0">
            {/* Images */}
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="relative h-[280px] bg-slate-100 sm:h-[420px]">
                {images.length > 0 ? (
                  <img
                    src={images[activeImage]}
                    alt={opportunity.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                    <ImageIcon className="h-16 w-16 text-slate-300" />
                  </div>
                )}

                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950/50 to-transparent" />

                <div className="absolute left-5 top-5">
                  <span className="rounded-full border border-white/60 bg-white/95 px-3 py-1.5 text-xs font-bold capitalize text-slate-700 shadow-sm backdrop-blur">
                    {opportunity.category || "General"}
                  </span>
                </div>
              </div>

              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto p-4">
                  {images.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setActiveImage(index)}
                      className={`h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                        activeImage === index
                          ? "border-slate-900"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${opportunity.title} ${
                          index + 1
                        }`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Heading */}
            <div className="mt-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Open
                </span>

                {opportunity.project_type && (
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold capitalize text-slate-600">
                    {opportunity.project_type}
                  </span>
                )}
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                {opportunity.title}
              </h1>

              {opportunity.short_description && (
                <p className="mt-4 max-w-3xl text-base leading-7 text-slate-500 sm:text-lg">
                  {opportunity.short_description}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-black text-slate-950">
                About this opportunity
              </h2>

              <div className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-600 sm:text-base">
                {opportunity.description ||
                  "No additional description was provided for this opportunity."}
              </div>
            </div>

            {/* Skills */}
            {skills.length > 0 && (
              <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-xl font-black text-slate-950">
                  Skills needed
                </h2>

                <div className="mt-5 flex flex-wrap gap-2.5">
                  {skills.map((skill, index) => (
                    <span
                      key={`${skill}-${index}`}
                      className="rounded-xl bg-slate-100 px-3.5 py-2 text-sm font-semibold text-slate-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Information */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {opportunity.location && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                    <MapPin className="h-5 w-5 text-slate-600" />
                  </div>

                  <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                    Location
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {opportunity.location}
                  </p>
                </div>
              )}

              {opportunity.project_type && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                    <BriefcaseBusiness className="h-5 w-5 text-slate-600" />
                  </div>

                  <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                    Project Type
                  </p>

                  <p className="mt-1 text-sm font-bold capitalize text-slate-900">
                    {opportunity.project_type}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              {/* Budget */}
              <div className="border-b border-slate-100 p-6 sm:p-7">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Project Budget
                </p>

                <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                  {formatCurrency(opportunity.budget)}
                </p>
              </div>

              {/* Details */}
              <div className="divide-y divide-slate-100">
                <div className="flex items-start gap-4 p-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                    <CalendarDays className="h-5 w-5 text-slate-600" />
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Deadline
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {hasDeadline
                        ? formatDate(
                            opportunity.deadline
                          )
                        : "No deadline specified"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                    <MapPin className="h-5 w-5 text-slate-600" />
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Location
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {opportunity.location ||
                        "Remote"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                    <Wallet className="h-5 w-5 text-slate-600" />
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Payment
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-900">
                      Fixed Project Budget
                    </p>
                  </div>
                </div>
              </div>

              {/* Application area */}
              <div className="border-t border-slate-100 p-6 sm:p-7">
                {applicationLoading ? (
                  <div className="flex h-14 items-center justify-center rounded-xl bg-slate-100">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
                  </div>
                ) : applicationStatus ===
                  "pending" ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
                        <Clock3 className="h-4 w-4 text-amber-700" />
                      </div>

                      <div>
                        <p className="text-sm font-black text-amber-900">
                          Application submitted
                        </p>

                        <p className="mt-1 text-xs leading-5 text-amber-700">
                          Your application is waiting for
                          the admin to review it.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : applicationStatus ===
                  "shortlisted" ? (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100">
                        <CheckCircle2 className="h-4 w-4 text-blue-700" />
                      </div>

                      <div>
                        <p className="text-sm font-black text-blue-900">
                          You've been shortlisted
                        </p>

                        <p className="mt-1 text-xs leading-5 text-blue-700">
                          Your application has been
                          shortlisted for this opportunity.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : applicationStatus ===
                  "accepted" ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                        <Check className="h-4 w-4 text-emerald-700" />
                      </div>

                      <div>
                        <p className="text-sm font-black text-emerald-900">
                          Application accepted
                        </p>

                        <p className="mt-1 text-xs leading-5 text-emerald-700">
                          Congratulations. Your application
                          was accepted for this opportunity.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : applicationStatus ===
                  "rejected" ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100">
                        <X className="h-4 w-4 text-red-700" />
                      </div>

                      <div>
                        <p className="text-sm font-black text-red-900">
                          Application not selected
                        </p>

                        <p className="mt-1 text-xs leading-5 text-red-700">
                          Your application was not selected
                          for this opportunity.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : applicationStatus ===
                  "withdrawn" ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-100 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200">
                        <X className="h-4 w-4 text-slate-600" />
                      </div>

                      <div>
                        <p className="text-sm font-black text-slate-800">
                          Application withdrawn
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          You withdrew your application for
                          this opportunity.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {applicationError && (
                      <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />

                        <p className="text-xs leading-5 text-red-700">
                          {applicationError}
                        </p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleApply}
                      disabled={submitting}
                      className="group flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Applying...
                        </>
                      ) : (
                        <>
                          Apply for this opportunity
                          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        </>
                      )}
                    </button>

                    <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-400">
                      <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />

                      <p>
                        Applying sends your application
                        to the opportunity administrator for
                        review.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}