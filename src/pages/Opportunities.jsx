import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  MapPin,
  CalendarDays,
  BriefcaseBusiness,
  ArrowUpRight,
  SlidersHorizontal,
  X,
  Image as ImageIcon,
  ChevronDown,
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

const sortOptions = [
  { value: "newest", label: "Newest first" },
  { value: "budget-high", label: "Highest budget" },
  { value: "budget-low", label: "Lowest budget" },
  { value: "deadline", label: "Closing soon" },
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

/* Animations live here so no extra config or library is needed */
const animationStyles = `
  @keyframes tcsn-rise {
    from { transform: translateY(18px); }
    to   { transform: translateY(0); }
  }
  @keyframes tcsn-hero {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes tcsn-shimmer {
    from { transform: translateX(-100%); }
    to   { transform: translateX(100%); }
  }

  .tcsn-rise { opacity: 1; animation: tcsn-rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .tcsn-hero { opacity: 0; animation: tcsn-hero 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards; }

  .tcsn-skeleton { position: relative; overflow: hidden; }
  .tcsn-skeleton::after {
    content: "";
    position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent);
    animation: tcsn-shimmer 1.4s infinite;
  }

  /* Card interactions */
  .tcsn-card { transition: transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s ease, border-color .35s ease; }
  .tcsn-card:hover { transform: translateY(-6px); }
  .tcsn-card-img { transition: transform .8s cubic-bezier(.22,1,.36,1); }
  .tcsn-card:hover .tcsn-card-img { transform: scale(1.07); }

  .tcsn-card-bar {
    transform: scaleX(0);
    transform-origin: left;
    transition: transform .5s cubic-bezier(.22,1,.36,1);
  }
  .tcsn-card:hover .tcsn-card-bar { transform: scaleX(1); }

  .tcsn-arrow-btn { transition: background-color .3s ease, color .3s ease, transform .3s ease; }
  .tcsn-card:hover .tcsn-arrow-btn { transform: rotate(0deg); }
  .tcsn-arrow-icon { transition: transform .35s cubic-bezier(.22,1,.36,1); }
  .tcsn-card:hover .tcsn-arrow-icon { transform: translate(2px, -2px); }

  .tcsn-chip { transition: transform .25s ease, background-color .25s ease, color .25s ease, border-color .25s ease; }
  .tcsn-chip:active { transform: scale(0.96); }

  @media (prefers-reduced-motion: reduce) {
    .tcsn-rise, .tcsn-hero { animation: none; opacity: 1; }
    .tcsn-skeleton::after { animation: none; }
    .tcsn-card, .tcsn-card-img, .tcsn-card-bar, .tcsn-arrow-icon { transition: none; }
    .tcsn-card:hover, .tcsn-card:hover .tcsn-card-img { transform: none; }
  }
`;

export default function Opportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("newest");

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

    const list = opportunities.filter((opportunity) => {
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

    const sorted = [...list];

    if (sort === "budget-high") {
      sorted.sort((a, b) => Number(b.budget || 0) - Number(a.budget || 0));
    } else if (sort === "budget-low") {
      sorted.sort(
        (a, b) =>
          Number(a.budget ?? Infinity) - Number(b.budget ?? Infinity)
      );
    } else if (sort === "deadline") {
      sorted.sort((a, b) => {
        const aTime = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const bTime = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        return aTime - bTime;
      });
    }

    return sorted;
  }, [opportunities, search, category, sort]);

  function clearFilters() {
    setSearch("");
    setCategory("all");
    setSort("newest");
  }

  function scrollToMarketplace() {
    document
      .getElementById("marketplace")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const hasFilters =
    search.trim() !== "" || category !== "all" || sort !== "newest";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <style>{animationStyles}</style>

      {/* HERO SECTION WITH YOUTH LEARNING / COLLABORATION BACKGROUND */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-slate-950 text-white">
        {/* Background Image Container */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=2000&q=80"
            alt="Students and young adults learning and working together"
            className="h-full w-full object-cover object-center opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/60 to-slate-950/30" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <div
              className="tcsn-hero mb-4 inline-flex items-center gap-2 rounded-full border border-slate-600/80 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-200 backdrop-blur-md"
              style={{ animationDelay: "0ms" }}
            >
              <BriefcaseBusiness className="h-4 w-4 text-slate-400" />
              TCSN Opportunities
            </div>

            <h1
              className="tcsn-hero text-4xl font-black tracking-tight text-white drop-shadow-sm sm:text-5xl lg:text-6xl"
              style={{ animationDelay: "100ms" }}
            >
              Find work.
              <span className="block text-slate-200">Build your future.</span>
            </h1>

            <p
              className="tcsn-hero mt-5 max-w-2xl text-base font-medium leading-7 text-slate-200 drop-shadow-sm sm:text-lg"
              style={{ animationDelay: "200ms" }}
            >
              Discover real projects and opportunities posted by clients and
              the TCSN team. Find work that matches your skills and submit an
              application.
            </p>
          </div>

          {/* SEARCH BAR */}
          <div
            className="tcsn-hero mt-10 max-w-4xl"
            style={{ animationDelay: "300ms" }}
          >
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-600/60 bg-slate-950/80 p-3 shadow-2xl backdrop-blur-md sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search opportunities, skills, categories..."
                  className="w-full rounded-xl border border-slate-700/60 bg-slate-900/90 py-3.5 pl-12 pr-10 text-sm text-white placeholder:text-slate-400 transition focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={scrollToMarketplace}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-900/90 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* STICKY CATEGORY BAR */}
      <div
        id="marketplace"
        className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50/90 backdrop-blur-md"
      >
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto py-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((item) => {
              const active = category === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setCategory(item.value)}
                  aria-pressed={active}
                  className={`tcsn-chip whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold ${
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
        </div>
      </div>

      {/* MARKETPLACE */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-black text-slate-950 sm:text-3xl">
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

          <div className="flex items-center gap-4">
            {hasFilters && !loading && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-slate-950"
              >
                <X className="h-4 w-4" />
                Clear filters
              </button>
            )}

            <div className="relative">
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                aria-label="Sort opportunities"
                className="cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-10 text-sm font-semibold text-slate-700 transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <div className="tcsn-skeleton h-52 bg-slate-200" />

                <div className="space-y-4 p-6">
                  <div className="tcsn-skeleton h-5 w-24 rounded bg-slate-200" />
                  <div className="tcsn-skeleton h-7 w-3/4 rounded bg-slate-200" />
                  <div className="tcsn-skeleton h-12 rounded bg-slate-200" />
                  <div className="tcsn-skeleton h-5 w-1/2 rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="tcsn-rise rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
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
          <div className="tcsn-rise rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
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
          <div
            key={`${category}-${sort}`}
            className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
          >
            {filteredOpportunities.map((opportunity, index) => {
              const image = getOpportunityImage(opportunity);
              const skills = Array.isArray(opportunity.skills)
                ? opportunity.skills
                : [];

              return (
                <article
                  key={opportunity.id}
                  className="tcsn-rise tcsn-card group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:border-slate-300 hover:shadow-xl"
                  style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}
                >
                  {/* IMAGE */}
                  <div className="relative h-52 shrink-0 overflow-hidden bg-slate-100">
                    {image ? (
                      <img
                        src={image}
                        alt={opportunity.title}
                        loading="lazy"
                        className="tcsn-card-img h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                        <ImageIcon className="h-12 w-12 text-slate-300" />
                      </div>
                    )}

                    {/* Soft fade so the budget stays readable */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/70 to-transparent" />

                    {/* Category */}
                    <span className="absolute left-4 top-4 rounded-full border border-slate-200 bg-white/95 px-3 py-1.5 text-xs font-bold capitalize text-slate-700 shadow-sm backdrop-blur">
                      {opportunity.category || "General"}
                    </span>

                    {/* Budget sits on the image */}
                    <span className="absolute bottom-4 left-4 text-lg font-black text-white drop-shadow">
                      {formatCurrency(opportunity.budget)}
                    </span>
                  </div>

                  {/* CONTENT */}
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="line-clamp-2 text-xl font-bold leading-snug text-slate-950">
                      {opportunity.title}
                    </h3>

                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">
                      {opportunity.short_description ||
                        opportunity.description ||
                        "No description provided."}
                    </p>

                    {/* META: compact inline row */}
                    {(opportunity.location || opportunity.project_type) && (
                      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                        {opportunity.location && (
                          <div className="flex min-w-0 items-center gap-2">
                            <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                            <span className="truncate">
                              {opportunity.location}
                            </span>
                          </div>
                        )}

                        {opportunity.project_type && (
                          <div className="flex items-center gap-2">
                            <BriefcaseBusiness className="h-4 w-4 shrink-0 text-slate-400" />
                            <span className="capitalize">
                              {opportunity.project_type}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SKILLS */}
                    {skills.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {skills.slice(0, 4).map((skill, skillIndex) => (
                          <span
                            key={`${skill}-${skillIndex}`}
                            className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600"
                          >
                            {skill}
                          </span>
                        ))}

                        {skills.length > 4 && (
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-500">
                            +{skills.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    {/* FOOTER: always pinned to the bottom so cards line up */}
                    <div className="mt-auto flex items-center justify-between gap-4 border-t border-slate-100 pt-5">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
                        <span>
                          {opportunity.deadline
                            ? `Due ${formatDate(opportunity.deadline)}`
                            : "No deadline"}
                        </span>
                      </div>

                      <span className="tcsn-arrow-btn inline-flex items-center gap-2 rounded-full bg-slate-100 py-2 pl-4 pr-3 text-sm font-bold text-slate-900 group-hover:bg-slate-900 group-hover:text-white">
                        View
                        <ArrowUpRight className="tcsn-arrow-icon h-4 w-4" />
                      </span>
                    </div>
                  </div>

                  {/* Bottom progress bar draws in on hover */}
                  <div className="tcsn-card-bar absolute inset-x-0 bottom-0 h-1 bg-slate-900" />

                  {/* Whole card is clickable */}
                  <Link
                    to={`/opportunities/${opportunity.id}`}
                    aria-label={`View ${opportunity.title}`}
                    className="absolute inset-0 z-10 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                  />
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}