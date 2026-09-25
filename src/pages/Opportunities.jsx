import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  MapPin,
  CalendarDays,
  BriefcaseBusiness,
  ArrowRight,
  SlidersHorizontal,
  X,
  Image as ImageIcon,
} from "lucide-react";

import { supabase } from "../lib/supabase";

const categories = [
  { value: "all", label: "All Categories" },
  { value: "development", label: "Development" },
  { value: "design", label: "Design" },
  { value: "uiux", label: "UI/UX" },
  { value: "video", label: "Video" },
  { value: "photography", label: "Photography" },
  { value: "writing", label: "Writing" },
  { value: "marketing", label: "Marketing" },
];

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
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function getOpportunityImage(opportunity) {
  if (!opportunity.images) return null;

  if (Array.isArray(opportunity.images) && opportunity.images.length > 0) {
    const firstImage = opportunity.images[0];

    if (typeof firstImage === "string") {
      return firstImage;
    }

    if (firstImage?.url) {
      return firstImage.url;
    }
  }

  return null;
}

export default function Opportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  async function loadOpportunities() {
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
          created_at,
          client_id
        `)
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setOpportunities(data || []);
    } catch (err) {
      console.error("Error loading opportunities:", err);

      setError(
        err?.message ||
          "We couldn't load opportunities right now. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOpportunities();

    const channel = supabase
      .channel("public-opportunities")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "opportunities",
        },
        () => {
          loadOpportunities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredOpportunities = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return opportunities.filter((opportunity) => {
      const matchesCategory =
        category === "all" || opportunity.category === category;

      if (!matchesCategory) return false;

      if (!searchTerm) return true;

      const searchableText = [
        opportunity.title,
        opportunity.short_description,
        opportunity.description,
        opportunity.category,
        opportunity.location,
        opportunity.project_type,
        ...(Array.isArray(opportunity.skills) ? opportunity.skills : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(searchTerm);
    });
  }, [opportunities, search, category]);

  function clearFilters() {
    setSearch("");
    setCategory("all");
  }

  const hasFilters = search.trim() !== "" || category !== "all";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* HERO SECTION WITH CLEARER BACKGROUND IMAGE */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-slate-950 text-white">
        {/* Background Image Container */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=2000&q=80"
            alt="Hero background"
            className="h-full w-full object-cover object-center opacity-65"
          />
          {/* Lighter Gradient Overlay to keep image clear while keeping text legible */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/60 to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-600/80 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-200 backdrop-blur-md">
              <BriefcaseBusiness className="h-4 w-4 text-slate-400" />
              TCSN Opportunities
            </div>

            <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-sm sm:text-5xl lg:text-6xl">
              Find work.
              <span className="block text-slate-200">Build your future.</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-slate-200 drop-shadow-sm sm:text-lg">
              Discover real projects and opportunities posted by clients and
              the TCSN team. Find work that matches your skills and
              submit an application.
            </p>
          </div>

          {/* SEARCH BAR */}
          <div className="mt-10 max-w-4xl">
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-600/60 bg-slate-950/80 p-3 shadow-2xl backdrop-blur-md sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search opportunities, skills, categories..."
                  className="w-full rounded-xl border border-slate-700/60 bg-slate-900/90 py-3.5 pl-12 pr-4 text-sm text-white placeholder:text-slate-400 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                />
              </div>

              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-900/90 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* MARKETPLACE */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* CATEGORY FILTERS */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
          {categories.map((item) => {
            const active = category === item.value;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setCategory(item.value)}
                className={`whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "bg-slate-900 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* HEADER */}
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-950">
              Available Opportunities
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {loading
                ? "Finding available opportunities..."
                : `${filteredOpportunities.length} ${
                    filteredOpportunities.length === 1
                      ? "opportunity"
                      : "opportunities"
                  } available`}
            </p>
          </div>

          {hasFilters && !loading && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-2 self-start text-sm font-semibold text-slate-700 hover:text-slate-950 sm:self-auto"
            >
              <X className="h-4 w-4" />
              Clear filters
            </button>
          )}
        </div>

        {/* LOADING */}
        {loading && (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <div className="h-52 animate-pulse bg-slate-200" />

                <div className="space-y-4 p-6">
                  <div className="h-5 w-24 animate-pulse rounded bg-slate-200" />
                  <div className="h-7 w-3/4 animate-pulse rounded bg-slate-200" />
                  <div className="h-12 animate-pulse rounded bg-slate-200" />
                  <div className="h-5 w-1/2 animate-pulse rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <h3 className="text-lg font-bold text-red-800">
              Couldn't load opportunities
            </h3>

            <p className="mx-auto mt-2 max-w-xl text-sm text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={loadOpportunities}
              className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Try again
            </button>
          </div>
        )}

        {/* EMPTY */}
        {!loading && !error && filteredOpportunities.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <BriefcaseBusiness className="h-7 w-7 text-slate-400" />
            </div>

            <h3 className="mt-5 text-xl font-bold text-slate-900">
              No opportunities found
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {hasFilters
                ? "Try changing your search or category filters."
                : "There are no open opportunities at the moment. Check back soon for new projects."}
            </p>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* OPPORTUNITY CARDS */}
        {!loading && !error && filteredOpportunities.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredOpportunities.map((opportunity) => {
              const image = getOpportunityImage(opportunity);

              return (
                <article
                  key={opportunity.id}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl"
                >
                  {/* IMAGE */}
                  <div className="relative h-52 overflow-hidden bg-slate-100">
                    {image ? (
                      <img
                        src={image}
                        alt={opportunity.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                        <ImageIcon className="h-12 w-12 text-slate-300" />
                      </div>
                    )}

                    <div className="absolute left-4 top-4">
                      <span className="rounded-full border border-slate-200 bg-white/95 px-3 py-1.5 text-xs font-bold capitalize text-slate-700 shadow-sm backdrop-blur">
                        {opportunity.category || "General"}
                      </span>
                    </div>
                  </div>

                  {/* CONTENT */}
                  <div className="p-6">
                    <div className="mb-3">
                      <span className="text-lg font-black text-slate-900">
                        {formatCurrency(opportunity.budget)}
                      </span>
                    </div>

                    <h3 className="line-clamp-2 text-xl font-bold text-slate-950">
                      {opportunity.title}
                    </h3>

                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">
                      {opportunity.short_description ||
                        opportunity.description ||
                        "No description provided."}
                    </p>

                    {/* META */}
                    <div className="mt-5 space-y-2.5 border-t border-slate-100 pt-5">
                      {opportunity.location && (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <MapPin className="h-4 w-4 shrink-0 text-slate-400" />

                          <span className="truncate">
                            {opportunity.location}
                          </span>
                        </div>
                      )}

                      {opportunity.deadline && (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />

                          <span>
                            Deadline: {formatDate(opportunity.deadline)}
                          </span>
                        </div>
                      )}

                      {opportunity.project_type && (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <BriefcaseBusiness className="h-4 w-4 shrink-0 text-slate-400" />

                          <span className="capitalize">
                            {opportunity.project_type}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* SKILLS */}
                    {Array.isArray(opportunity.skills) &&
                      opportunity.skills.length > 0 && (
                        <div className="mt-5 flex flex-wrap gap-2">
                          {opportunity.skills
                            .slice(0, 4)
                            .map((skill, index) => (
                              <span
                                key={`${skill}-${index}`}
                                className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600"
                              >
                                {skill}
                              </span>
                            ))}

                          {opportunity.skills.length > 4 && (
                            <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-500">
                              +{opportunity.skills.length - 4}
                            </span>
                          )}
                        </div>
                      )}

                    {/* ACTION */}
                    <Link
                      to={`/opportunities/${opportunity.id}`}
                      className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800"
                    >
                      View Opportunity
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}