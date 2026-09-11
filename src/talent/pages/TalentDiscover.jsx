import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Clock3,
  Bookmark,
  BookmarkCheck,
  ArrowUpRight,
  BriefcaseBusiness,
  Palette,
  Code2,
  PenTool,
  Megaphone,
  Camera,
  X,
  ChevronDown,
  RefreshCw,
} from "lucide-react";

import { supabase } from "../../lib/supabase";


// ============================================================
// CATEGORY CONFIG
// ============================================================

const categories = [
  {
    name: "All",
    icon: BriefcaseBusiness,
  },
  {
    name: "Web Development",
    icon: Code2,
  },
  {
    name: "Graphic Design",
    icon: Palette,
  },
  {
    name: "UI/UX Design",
    icon: PenTool,
  },
  {
    name: "Content & Writing",
    icon: PenTool,
  },
  {
    name: "Marketing",
    icon: Megaphone,
  },
  {
    name: "Photography",
    icon: Camera,
  },
];


// ============================================================
// HELPERS
// ============================================================

function formatBudget(min, max) {
  if (!min && !max) {
    return "Budget not specified";
  }

  const formatter = new Intl.NumberFormat(
    "en-NG",
    {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }
  );

  if (min && max) {
    return `${formatter.format(min)} - ${formatter.format(max)}`;
  }

  if (min) {
    return `From ${formatter.format(min)}`;
  }

  return `Up to ${formatter.format(max)}`;
}


function formatDate(date) {
  if (!date) return "No deadline";

  const target = new Date(date);
  const now = new Date();

  const difference =
    target.getTime() -
    now.getTime();

  const days = Math.ceil(
    difference /
      (1000 * 60 * 60 * 24)
  );

  if (days < 0) {
    return "Deadline passed";
  }

  if (days === 0) {
    return "Due today";
  }

  if (days === 1) {
    return "1 day left";
  }

  if (days < 7) {
    return `${days} days left`;
  }

  return target.toLocaleDateString(
    "en-NG",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}


function getCategoryIcon(category) {
  const found =
    categories.find(
      (item) =>
        item.name.toLowerCase() ===
        String(category)
          .toLowerCase()
    );

  return (
    found?.icon ||
    BriefcaseBusiness
  );
}


// ============================================================
// COMPONENT
// ============================================================

export default function TalentDiscover() {
  const navigate = useNavigate();


  // ==========================================================
  // STATE
  // ==========================================================

  const [opportunities, setOpportunities] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);

  const [search, setSearch] =
    useState("");

  const [category, setCategory] =
    useState("All");

  const [sort, setSort] =
    useState("newest");

  const [saved, setSaved] =
    useState([]);

  const [showFilters, setShowFilters] =
    useState(false);

  const [location, setLocation] =
    useState("All locations");


  // ==========================================================
  // LOAD OPPORTUNITIES
  // ==========================================================

  const loadOpportunities =
    async () => {
      try {
        setLoading(true);
        setError(null);

        const {
          data,
          error:
            opportunitiesError,
        } =
          await supabase
            .from("opportunities")
            .select("*")
            .eq("status", "open")
            .order(
              "created_at",
              {
                ascending: false,
              }
            );

        if (opportunitiesError) {
          throw opportunitiesError;
        }

        setOpportunities(
          data || []
        );
      } catch (err) {
        console.error(
          "Failed to load opportunities:",
          err
        );

        setError(
          err.message ||
            "Unable to load opportunities."
        );
      } finally {
        setLoading(false);
      }
    };


  useEffect(() => {
    loadOpportunities();
  }, []);


  // ==========================================================
  // LOAD SAVED OPPORTUNITIES
  // ==========================================================

  useEffect(() => {
    const loadSaved =
      async () => {
        const {
          data: {
            user,
          },
        } =
          await supabase.auth.getUser();

        if (!user) return;

        const {
          data,
          error,
        } =
          await supabase
            .from(
              "saved_opportunities"
            )
            .select(
              "opportunity_id"
            )
            .eq(
              "user_id",
              user.id
            );

        if (error) {
          /*
           * The table may not exist yet.
           * We don't want that to break
           * the entire Discover page.
           */
          console.warn(
            "Saved opportunities could not be loaded:",
            error.message
          );

          return;
        }

        setSaved(
          (data || []).map(
            (item) =>
              item.opportunity_id
          )
        );
      };

    loadSaved();
  }, []);


  // ==========================================================
  // FILTER + SEARCH
  // ==========================================================

  const filteredOpportunities =
    useMemo(() => {
      let result = [
        ...opportunities,
      ];


      // Search

      if (search.trim()) {
        const query =
          search
            .toLowerCase()
            .trim();

        result =
          result.filter(
            (item) => {
              const title =
                String(
                  item.title || ""
                ).toLowerCase();

              const description =
                String(
                  item.description ||
                    ""
                ).toLowerCase();

              const itemCategory =
                String(
                  item.category ||
                    ""
                ).toLowerCase();

              const skills =
                Array.isArray(
                  item.skills
                )
                  ? item.skills.join(
                      " "
                    ).toLowerCase()
                  : String(
                      item.skills ||
                        ""
                    ).toLowerCase();

              return (
                title.includes(
                  query
                ) ||
                description.includes(
                  query
                ) ||
                itemCategory.includes(
                  query
                ) ||
                skills.includes(
                  query
                )
              );
            }
          );
      }


      // Category

      if (category !== "All") {
        result =
          result.filter(
            (item) =>
              String(
                item.category || ""
              ).toLowerCase() ===
              category.toLowerCase()
          );
      }


      // Location

      if (
        location !==
        "All locations"
      ) {
        result =
          result.filter(
            (item) =>
              String(
                item.location || ""
              ).toLowerCase() ===
              location.toLowerCase()
          );
      }


      // Sort

      if (sort === "newest") {
        result.sort(
          (a, b) =>
            new Date(
              b.created_at
            ) -
            new Date(
              a.created_at
            )
        );
      }

      if (sort === "budget_high") {
        result.sort(
          (a, b) =>
            Number(
              b.budget_max || 0
            ) -
            Number(
              a.budget_max || 0
            )
        );
      }

      if (sort === "deadline") {
        result.sort(
          (a, b) =>
            new Date(
              a.deadline || "9999-12-31"
            ) -
            new Date(
              b.deadline || "9999-12-31"
            )
        );
      }

      return result;
    }, [
      opportunities,
      search,
      category,
      location,
      sort,
    ]);


  // ==========================================================
  // SAVE / UNSAVE
  // ==========================================================

  const toggleSaved =
    async (opportunityId) => {
      const {
        data: {
          user,
        },
      } =
        await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      const isSaved =
        saved.includes(
          opportunityId
        );

      if (isSaved) {
        const {
          error,
        } =
          await supabase
            .from(
              "saved_opportunities"
            )
            .delete()
            .eq(
              "user_id",
              user.id
            )
            .eq(
              "opportunity_id",
              opportunityId
            );

        if (error) {
          console.error(
            "Unable to remove saved opportunity:",
            error
          );

          return;
        }

        setSaved(
          (current) =>
            current.filter(
              (id) =>
                id !==
                opportunityId
            )
        );

        return;
      }


      const {
        error,
      } =
        await supabase
          .from(
            "saved_opportunities"
          )
          .insert({
            user_id:
              user.id,
            opportunity_id:
              opportunityId,
          });

      if (error) {
        console.error(
          "Unable to save opportunity:",
          error
        );

        return;
      }

      setSaved(
        (current) => [
          ...current,
          opportunityId,
        ]
      );
    };


  // ==========================================================
  // LOCATIONS
  // ==========================================================

  const locations =
    useMemo(() => {
      const values =
        opportunities
          .map(
            (item) =>
              item.location
          )
          .filter(Boolean);

      return [
        "All locations",
        ...new Set(values),
      ];
    }, [opportunities]);


  // ==========================================================
  // CLEAR FILTERS
  // ==========================================================

  const clearFilters = () => {
    setSearch("");
    setCategory("All");
    setLocation(
      "All locations"
    );
    setSort("newest");
  };


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="space-y-6">

        <div>
          <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200" />
          <div className="mt-2 h-4 w-96 max-w-full animate-pulse rounded bg-slate-200" />
        </div>

        <div className="h-12 animate-pulse rounded-xl bg-slate-200" />

        <div className="grid gap-5 lg:grid-cols-2">

          {[1, 2, 3, 4].map(
            (item) => (
              <div
                key={item}
                className="h-64 animate-pulse rounded-2xl bg-slate-200"
              />
            )
          )}

        </div>

      </div>
    );
  }


  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">

        <div className="max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
            !
          </div>

          <h2 className="mt-4 text-lg font-bold text-slate-900">
            Couldn't load opportunities
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error}
          </p>

          <button
            onClick={
              loadOpportunities
            }
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-navy-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-navy-700"
          >
            <RefreshCw size={15} />
            Try again
          </button>

        </div>

      </div>
    );
  }


  return (
    <div className="space-y-7">


      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

        <div>

          <div className="mb-2 flex items-center gap-2">

            <span className="h-2 w-2 rounded-full bg-navy-600" />

            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-navy-600">
              Opportunity marketplace
            </span>

          </div>

          <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Discover opportunities
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Find projects, jobs and creative opportunities
            that match your skills and help you build your career.
          </p>

        </div>


        <button
          onClick={
            loadOpportunities
          }
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:border-navy-200 hover:text-navy-600"
        >
          <RefreshCw size={14} />
          Refresh
        </button>

      </div>


      {/* ====================================================== */}
      {/* SEARCH */}
      {/* ====================================================== */}

      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">

        <div className="flex flex-col gap-3 lg:flex-row">

          <div className="relative flex-1">

            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search opportunities, skills, projects..."
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-navy-400 focus:bg-white focus:ring-4 focus:ring-navy-500/10"
            />

          </div>


          <button
            onClick={() =>
              setShowFilters(
                !showFilters
              )
            }
            className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl border px-5 text-sm font-bold transition lg:hidden ${
              showFilters
                ? "border-navy-200 bg-navy-50 text-navy-700"
                : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            <SlidersHorizontal
              size={17}
            />
            Filters
          </button>


          <div className="hidden lg:flex lg:items-center lg:gap-3">

            <FilterSelect
              value={category}
              onChange={setCategory}
              options={categories.map(
                (item) =>
                  item.name
              )}
            />

            <FilterSelect
              value={location}
              onChange={setLocation}
              options={locations}
            />

            <FilterSelect
              value={sort}
              onChange={setSort}
              options={[
                "newest",
                "budget_high",
                "deadline",
              ]}
              labels={{
                newest:
                  "Newest",
                budget_high:
                  "Highest budget",
                deadline:
                  "Deadline",
              }}
            />

          </div>

        </div>


        {/* Mobile Filters */}

        {showFilters && (
          <div className="mt-3 grid gap-3 border-t border-slate-100 pt-3 lg:hidden">

            <FilterSelect
              value={category}
              onChange={setCategory}
              options={categories.map(
                (item) =>
                  item.name
              )}
            />

            <FilterSelect
              value={location}
              onChange={setLocation}
              options={locations}
            />

            <FilterSelect
              value={sort}
              onChange={setSort}
              options={[
                "newest",
                "budget_high",
                "deadline",
              ]}
              labels={{
                newest:
                  "Newest",
                budget_high:
                  "Highest budget",
                deadline:
                  "Deadline",
              }}
            />

          </div>
        )}

      </div>


      {/* ====================================================== */}
      {/* CATEGORY PILLS */}
      {/* ====================================================== */}

      <div className="flex gap-2 overflow-x-auto pb-1">

        {categories.map(
          ({
            name,
            icon: Icon,
          }) => {

            const active =
              category ===
              name;

            return (
              <button
                key={name}
                onClick={() =>
                  setCategory(
                    name
                  )
                }
                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold transition ${
                  active
                    ? "bg-navy-600 text-white shadow-lg shadow-navy-600/20"
                    : "border border-slate-200 bg-white text-slate-500 hover:border-navy-200 hover:text-navy-600"
                }`}
              >

                <Icon size={14} />

                {name}

              </button>
            );
          }
        )}

      </div>


      {/* ====================================================== */}
      {/* RESULTS HEADER */}
      {/* ====================================================== */}

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm font-bold text-slate-800">
            {filteredOpportunities.length}{" "}
            {filteredOpportunities.length ===
            1
              ? "opportunity"
              : "opportunities"}
          </p>

          {(search ||
            category !== "All" ||
            location !==
              "All locations") && (
            <p className="mt-1 text-xs text-slate-400">
              Showing filtered results
            </p>
          )}

        </div>


        {(search ||
          category !== "All" ||
          location !==
            "All locations") && (
          <button
            onClick={
              clearFilters
            }
            className="inline-flex items-center gap-1.5 text-xs font-bold text-navy-600 hover:text-navy-700"
          >
            <X size={13} />
            Clear filters
          </button>
        )}

      </div>


      {/* ====================================================== */}
      {/* EMPTY STATE */}
      {/* ====================================================== */}

      {filteredOpportunities.length ===
        0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-50 text-navy-600">
            <BriefcaseBusiness
              size={25}
            />
          </div>

          <h2 className="mt-5 text-lg font-bold text-slate-900">
            No opportunities found
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Try changing your search or filters.
            New opportunities will also appear here
            when clients publish them.
          </p>

          <button
            onClick={
              clearFilters
            }
            className="mt-5 rounded-xl bg-navy-600 px-5 py-3 text-xs font-bold text-white hover:bg-navy-700"
          >
            Clear filters
          </button>

        </div>
      )}


      {/* ====================================================== */}
      {/* OPPORTUNITY GRID */}
      {/* ====================================================== */}

      {filteredOpportunities.length >
        0 && (
        <div className="grid gap-5 xl:grid-cols-2">

          {filteredOpportunities.map(
            (opportunity) => (
              <OpportunityCard
                key={
                  opportunity.id
                }
                opportunity={
                  opportunity
                }
                isSaved={saved.includes(
                  opportunity.id
                )}
                onSave={
                  toggleSaved
                }
                onOpen={() =>
                  navigate(
                    `/talent/opportunities/${opportunity.id}`
                  )
                }
              />
            )
          )}

        </div>
      )}

    </div>
  );
}


// ============================================================
// FILTER SELECT
// ============================================================

function FilterSelect({
  value,
  onChange,
  options,
  labels = {},
}) {
  return (
    <div className="relative">

      <select
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        className="h-12 min-w-40 appearance-none rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-xs font-bold text-slate-600 outline-none transition focus:border-navy-400 focus:ring-4 focus:ring-navy-500/10"
      >

        {options.map(
          (option) => (
            <option
              key={option}
              value={option}
            >
              {labels[option] ||
                option}
            </option>
          )
        )}

      </select>

      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />

    </div>
  );
}


// ============================================================
// OPPORTUNITY CARD
// ============================================================

function OpportunityCard({
  opportunity,
  isSaved,
  onSave,
  onOpen,
}) {
  const CategoryIcon =
    getCategoryIcon(
      opportunity.category
    );


  const skills =
    Array.isArray(
      opportunity.skills
    )
      ? opportunity.skills
      : String(
          opportunity.skills ||
            ""
        )
          .split(",")
          .map(
            (skill) =>
              skill.trim()
          )
          .filter(Boolean);


  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-xl hover:shadow-slate-200/50">

      {/* Top */}

      <div className="flex items-start justify-between gap-4">

        <div className="flex min-w-0 gap-3">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-600">
            <CategoryIcon
              size={20}
            />
          </div>

          <div className="min-w-0">

            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-navy-600">
              {opportunity.category ||
                "Opportunity"}
            </p>

            <h2 className="line-clamp-2 text-base font-black text-slate-900 transition group-hover:text-navy-700">
              {opportunity.title}
            </h2>

          </div>

        </div>


        <button
          onClick={() =>
            onSave(
              opportunity.id
            )
          }
          className={`shrink-0 rounded-xl p-2.5 transition ${
            isSaved
              ? "bg-navy-50 text-navy-600"
              : "text-slate-400 hover:bg-slate-50 hover:text-navy-600"
          }`}
          title={
            isSaved
              ? "Remove from saved"
              : "Save opportunity"
          }
        >
          {isSaved ? (
            <BookmarkCheck
              size={18}
            />
          ) : (
            <Bookmark size={18} />
          )}
        </button>

      </div>


      {/* Description */}

      <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-500">
        {opportunity.description ||
          "No description provided."}
      </p>


      {/* Budget */}

      <div className="mt-5 rounded-xl bg-slate-50 p-3.5">

        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
          Project budget
        </p>

        <p className="mt-1 text-sm font-black text-slate-900">
          {formatBudget(
            opportunity.budget_min,
            opportunity.budget_max
          )}
        </p>

      </div>


      {/* Meta */}

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">

        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">

          <MapPin
            size={14}
            className="text-slate-400"
          />

          {opportunity.location ||
            "Remote"}

        </div>


        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">

          <Clock3
            size={14}
            className="text-slate-400"
          />

          {formatDate(
            opportunity.deadline
          )}

        </div>

      </div>


      {/* Skills */}

      {skills.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">

          {skills
            .slice(0, 5)
            .map((skill) => (
              <span
                key={skill}
                className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-bold text-slate-500"
              >
                {skill}
              </span>
            ))}

          {skills.length >
            5 && (
            <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-bold text-slate-400">
              +
              {skills.length -
                5}
            </span>
          )}

        </div>
      )}


      {/* Footer */}

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">

        <div>

          <p className="text-[9px] uppercase tracking-wider text-slate-400">
            Posted
          </p>

          <p className="mt-0.5 text-xs font-semibold text-slate-600">
            {opportunity.created_at
              ? new Date(
                  opportunity.created_at
                ).toLocaleDateString(
                  "en-NG",
                  {
                    day: "numeric",
                    month: "short",
                  }
                )
              : "Recently"}
          </p>

        </div>


        <button
          onClick={onOpen}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-navy-600"
        >
          View opportunity
          <ArrowUpRight
            size={14}
          />
        </button>

      </div>

    </article>
  );
}
