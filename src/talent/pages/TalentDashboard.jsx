import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  DollarSign,
  FileText,
  FolderKanban,
  MapPin,
  MoreHorizontal,
  Plus,
  Sparkles,
  Star,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

export default function TalentDashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] =
    useState(true);

  const [profile, setProfile] =
    useState(null);

  const [opportunities, setOpportunities] =
    useState([]);

  const [projects, setProjects] =
    useState([]);

  const [applications, setApplications] =
    useState([]);

  const [transactions, setTransactions] =
    useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const {
        data: {
          user,
        },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      const [
        profileResult,
        opportunitiesResult,
        projectsResult,
        applicationsResult,
        transactionsResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single(),

        supabase
          .from("opportunities")
          .select("*")
          .in("status", [
            "open",
            "active",
          ])
          .order("created_at", {
            ascending: false,
          })
          .limit(5),

        supabase
          .from("projects")
          .select("*")
          .order("created_at", {
            ascending: false,
          })
          .limit(5),

        supabase
          .from("applications")
          .select("*")
          .eq(
            "talent_id",
            user.id
          )
          .order("created_at", {
            ascending: false,
          })
          .limit(10),

        supabase
          .from("transactions")
          .select("*")
          .eq(
            "user_id",
            user.id
          )
          .order("created_at", {
            ascending: false,
          })
          .limit(10),
      ]);

      if (
        profileResult.error &&
        profileResult.error.code !==
          "PGRST116"
      ) {
        console.error(
          profileResult.error
        );
      }

      if (
        opportunitiesResult.error
      ) {
        console.error(
          opportunitiesResult.error
        );
      }

      if (projectsResult.error) {
        console.error(
          projectsResult.error
        );
      }

      if (
        applicationsResult.error
      ) {
        console.error(
          applicationsResult.error
        );
      }

      if (
        transactionsResult.error
      ) {
        console.error(
          transactionsResult.error
        );
      }

      setProfile(
        profileResult.data || null
      );

      setOpportunities(
        opportunitiesResult.data || []
      );

      setProjects(
        projectsResult.data || []
      );

      setApplications(
        applicationsResult.data || []
      );

      setTransactions(
        transactionsResult.data || []
      );
    } catch (error) {
      console.error(
        "Talent dashboard error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };


  /* =====================================
     STATISTICS
  ===================================== */

  const stats = useMemo(() => {
    const activeProjects =
      projects.filter(
        (project) =>
          project.status ===
            "active" ||
          project.status ===
            "in_progress"
      );

    const completedProjects =
      projects.filter(
        (project) =>
          project.status ===
          "completed"
      );

    const pendingApplications =
      applications.filter(
        (application) =>
          application.status ===
            "pending" ||
          application.status ===
            "submitted"
      );

    const successfulTransactions =
      transactions.filter(
        (transaction) =>
          transaction.status ===
          "successful"
      );

    const earnings =
      successfulTransactions.reduce(
        (total, transaction) =>
          total +
          Number(
            transaction.amount || 0
          ),
        0
      );

    return {
      opportunities:
        opportunities.length,

      applications:
        applications.length,

      pendingApplications:
        pendingApplications.length,

      activeProjects:
        activeProjects.length,

      completedProjects:
        completedProjects.length,

      earnings,
    };
  }, [
    opportunities,
    applications,
    projects,
    transactions,
  ]);


  /* =====================================
     PROFILE
  ===================================== */

  const firstName =
    profile?.full_name
      ?.split(" ")[0] ||
    profile?.name
      ?.split(" ")[0] ||
    "Talent";

  const profileCompletion =
    calculateProfileCompletion(
      profile
    );


  /* =====================================
     FORMATTERS
  ===================================== */

  const formatCurrency = (
    amount
  ) => {
    return new Intl.NumberFormat(
      "en-NG",
      {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0,
      }
    ).format(
      Number(amount || 0)
    );
  };

  const formatDate = (
    date
  ) => {
    if (!date) return "—";

    return new Date(
      date
    ).toLocaleDateString(
      "en-NG",
      {
        day: "numeric",
        month: "short",
      }
    );
  };


  /* =====================================
     LOADING
  ===================================== */

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">

        <div className="space-y-3">

          <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />

          <div className="h-9 w-80 animate-pulse rounded bg-slate-200" />

          <div className="h-4 w-96 max-w-full animate-pulse rounded bg-slate-200" />

        </div>


        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {[1, 2, 3, 4].map(
            (item) => (
              <div
                key={item}
                className="h-36 animate-pulse rounded-2xl bg-slate-200"
              />
            )
          )}

        </div>


        <div className="grid gap-6 lg:grid-cols-3">

          <div className="h-96 animate-pulse rounded-2xl bg-slate-200 lg:col-span-2" />

          <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />

        </div>

      </div>
    );
  }


  return (
    <div className="mx-auto max-w-7xl space-y-7">

      {/* =====================================
          WELCOME
      ===================================== */}

      <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">

        <div>

          <p className="mb-1 flex items-center gap-2 text-xs font-semibold text-navy-600">

            <Sparkles size={14} />

            Welcome back

          </p>

          <h1 className="font-['Space_Grotesk'] text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Good afternoon,{" "}
            {firstName} 👋
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Here's what's happening with
            your work, opportunities and
            earnings today.
          </p>

        </div>


        <button
          onClick={() =>
            navigate(
              "/talent/opportunities"
            )
          }
          className="flex w-fit items-center gap-2 rounded-xl bg-navy-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-navy-600/20 transition hover:bg-navy-700"
        >

          <BriefcaseBusiness
            size={16}
          />

          Find Opportunities

        </button>

      </section>


      {/* =====================================
          STATS
      ===================================== */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <DashboardStat
          icon={CompassIcon}
          label="Available Opportunities"
          value={
            stats.opportunities
          }
          description="Open opportunities"
          onClick={() =>
            navigate(
              "/talent/opportunities"
            )
          }
        />

        <DashboardStat
          icon={FileText}
          label="Applications"
          value={
            stats.applications
          }
          description={
            `${stats.pendingApplications} awaiting response`
          }
          onClick={() =>
            navigate(
              "/talent/applications"
            )
          }
        />

        <DashboardStat
          icon={FolderKanban}
          label="Active Projects"
          value={
            stats.activeProjects
          }
          description={
            `${stats.completedProjects} completed`
          }
          onClick={() =>
            navigate(
              "/talent/projects"
            )
          }
        />

        <DashboardStat
          icon={Wallet}
          label="Total Earnings"
          value={formatCurrency(
            stats.earnings
          )}
          description="Successful transactions"
          onClick={() =>
            navigate(
              "/talent/earnings"
            )
          }
        />

      </section>


      {/* =====================================
          OPPORTUNITIES + PROFILE
      ===================================== */}

      <section className="grid gap-6 lg:grid-cols-3">

        {/* Opportunities */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">

          <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">

            <div>

              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Discover
              </p>

              <h2 className="mt-1 font-['Space_Grotesk'] text-xl font-bold text-slate-950">
                Recommended Opportunities
              </h2>

            </div>

            <button
              onClick={() =>
                navigate(
                  "/talent/opportunities"
                )
              }
              className="flex items-center gap-1 text-xs font-bold text-navy-600 hover:text-navy-700"
            >
              View all
              <ArrowRight
                size={13}
              />
            </button>

          </div>


          <div className="divide-y divide-slate-100">

            {opportunities.length ===
            0 ? (

              <EmptyState
                icon={BriefcaseBusiness}
                title="No opportunities yet"
                description="New opportunities will appear here when clients post them."
                button="Explore opportunities"
                onClick={() =>
                  navigate(
                    "/talent/opportunities"
                  )
                }
              />

            ) : (

              opportunities.map(
                (opportunity) => (

                  <button
                    key={
                      opportunity.id
                    }
                    onClick={() =>
                      navigate(
                        `/talent/opportunities/${opportunity.id}`
                      )
                    }
                    className="group flex w-full flex-col gap-4 p-5 text-left transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:p-6"
                  >

                    <div className="flex min-w-0 gap-4">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-600">
                        <BriefcaseBusiness
                          size={19}
                        />
                      </div>

                      <div className="min-w-0">

                        <h3 className="truncate text-sm font-bold text-slate-800 group-hover:text-navy-600">
                          {
                            opportunity.title ||
                            "Untitled Opportunity"
                          }
                        </h3>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-400">

                          {opportunity.location && (
                            <span className="flex items-center gap-1">
                              <MapPin
                                size={11}
                              />
                              {
                                opportunity.location
                              }
                            </span>
                          )}

                          <span>
                            Posted{" "}
                            {formatDate(
                              opportunity.created_at
                            )}
                          </span>

                        </div>

                      </div>

                    </div>


                    <div className="flex shrink-0 items-center justify-between gap-5 sm:justify-end">

                      <div className="text-left sm:text-right">

                        <p className="text-sm font-bold text-slate-900">
                          {formatCurrency(
                            opportunity.budget ||
                              opportunity.price ||
                              0
                          )}
                        </p>

                        <p className="mt-1 text-[9px] text-slate-400">
                          Budget
                        </p>

                      </div>

                      <ArrowUpRight
                        size={17}
                        className="text-slate-300 transition group-hover:text-navy-600"
                      />

                    </div>

                  </button>

                )
              )

            )}

          </div>

        </div>


        {/* Profile Card */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Your profile
              </p>

              <h2 className="mt-1 font-['Space_Grotesk'] text-xl font-bold text-slate-950">
                Profile Strength
              </h2>

            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-600">
              <Star size={18} />
            </div>

          </div>


          <div className="mt-7 flex items-center justify-center">

            <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-[10px] border-slate-100">

              <div
                className="absolute inset-[-10px] rounded-full border-[10px] border-transparent border-t-navy-600 border-r-navy-600"
                style={{
                  transform: `rotate(${
                    profileCompletion *
                    3.6
                  }deg)`,
                }}
              />

              <div className="text-center">

                <p className="font-['Space_Grotesk'] text-3xl font-bold text-slate-950">
                  {
                    profileCompletion
                  }%
                </p>

                <p className="text-[9px] font-semibold text-slate-400">
                  Complete
                </p>

              </div>

            </div>

          </div>


          <p className="mt-6 text-center text-xs leading-5 text-slate-400">
            Complete your profile to help
            clients discover and trust your
            work.
          </p>


          <button
            onClick={() =>
              navigate(
                "/talent/profile"
              )
            }
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-700 transition hover:border-navy-200 hover:bg-navy-50 hover:text-navy-600"
          >

            Improve Profile

            <ArrowRight
              size={14}
            />

          </button>

        </div>

      </section>


      {/* =====================================
          PROJECTS + EARNINGS
      ===================================== */}

      <section className="grid gap-6 lg:grid-cols-3">

        {/* Active Projects */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">

          <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">

            <div>

              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Work
              </p>

              <h2 className="mt-1 font-['Space_Grotesk'] text-xl font-bold text-slate-950">
                Active Projects
              </h2>

            </div>

            <button
              onClick={() =>
                navigate(
                  "/talent/projects"
                )
              }
              className="flex items-center gap-1 text-xs font-bold text-navy-600"
            >
              View all
              <ArrowRight
                size={13}
              />
            </button>

          </div>


          <div className="divide-y divide-slate-100">

            {projects.length ===
            0 ? (

              <EmptyState
                icon={FolderKanban}
                title="No projects yet"
                description="Projects you are hired for will appear here."
                button="Find work"
                onClick={() =>
                  navigate(
                    "/talent/opportunities"
                  )
                }
              />

            ) : (

              projects
                .filter(
                  (project) =>
                    project.status !==
                    "completed"
                )
                .slice(0, 4)
                .map(
                  (project) => {

                    const progress =
                      Number(
                        project.progress ||
                          0
                      );

                    return (
                      <div
                        key={
                          project.id
                        }
                        className="p-5 sm:p-6"
                      >

                        <div className="flex items-start justify-between gap-4">

                          <div className="flex min-w-0 items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                              <FolderKanban
                                size={17}
                              />
                            </div>

                            <div className="min-w-0">

                              <h3 className="truncate text-sm font-bold text-slate-800">
                                {
                                  project.title ||
                                  "Untitled Project"
                                }
                              </h3>

                              <p className="mt-1 text-[10px] text-slate-400">
                                {
                                  project.status ||
                                  "In progress"
                                }
                              </p>

                            </div>

                          </div>


                          <button className="rounded-lg p-1 text-slate-300 hover:bg-slate-50 hover:text-slate-600">
                            <MoreHorizontal
                              size={17}
                            />
                          </button>

                        </div>


                        <div className="mt-5">

                          <div className="mb-2 flex items-center justify-between">

                            <span className="text-[10px] font-semibold text-slate-400">
                              Progress
                            </span>

                            <span className="text-[10px] font-bold text-slate-700">
                              {
                                progress
                              }%
                            </span>

                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">

                            <div
                              className="h-full rounded-full bg-navy-500 transition-all"
                              style={{
                                width: `${progress}%`,
                              }}
                            />

                          </div>

                        </div>

                      </div>
                    );
                  }
                )

            )}

          </div>

        </div>


        {/* Earnings */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Earnings
              </p>

              <h2 className="mt-1 font-['Space_Grotesk'] text-xl font-bold text-slate-950">
                Your Money
              </h2>

            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <TrendingUp
                size={18}
              />
            </div>

          </div>


          <div className="mt-7">

            <p className="font-['Space_Grotesk'] text-3xl font-bold text-slate-950">
              {formatCurrency(
                stats.earnings
              )}
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              Total successful earnings
            </p>

          </div>


          <div className="mt-7 space-y-4">

            <div className="flex items-center justify-between">

              <span className="flex items-center gap-2 text-xs font-semibold text-slate-500">

                <CheckCircle2
                  size={14}
                  className="text-green-500"
                />

                Completed

              </span>

              <span className="text-xs font-bold text-slate-800">
                {
                  stats.completedProjects
                }
              </span>

            </div>


            <div className="flex items-center justify-between">

              <span className="flex items-center gap-2 text-xs font-semibold text-slate-500">

                <Clock3
                  size={14}
                  className="text-amber-500"
                />

                Pending

              </span>

              <span className="text-xs font-bold text-slate-800">
                {
                  stats.pendingApplications
                }
              </span>

            </div>

          </div>


          <button
            onClick={() =>
              navigate(
                "/talent/earnings"
              )
            }
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-xs font-bold text-white transition hover:bg-slate-800"
          >

            View Earnings

            <ArrowRight
              size={14}
            />

          </button>

        </div>

      </section>


      {/* =====================================
          RECENT ACTIVITY
      ===================================== */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">

          <div>

            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Timeline
            </p>

            <h2 className="mt-1 font-['Space_Grotesk'] text-xl font-bold text-slate-950">
              Recent Activity
            </h2>

          </div>

        </div>


        {applications.length ===
        0 ? (

          <div className="p-10 text-center">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-300">
              <Clock3 size={20} />
            </div>

            <p className="mt-4 text-sm font-bold text-slate-600">
              Your activity will appear here
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Apply for an opportunity to get
              started.
            </p>

          </div>

        ) : (

          <div className="divide-y divide-slate-100">

            {applications
              .slice(0, 5)
              .map(
                (application) => (

                  <div
                    key={
                      application.id
                    }
                    className="flex items-center gap-4 p-5"
                  >

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-50 text-navy-600">
                      <FileText
                        size={15}
                      />
                    </div>

                    <div className="min-w-0 flex-1">

                      <p className="truncate text-xs font-bold text-slate-700">
                        Application submitted
                      </p>

                      <p className="mt-1 text-[10px] text-slate-400">
                        {
                          application.status ||
                          "Pending"
                        }
                      </p>

                    </div>

                    <span className="shrink-0 text-[10px] text-slate-400">
                      {formatDate(
                        application.created_at
                      )}
                    </span>

                  </div>

                )
              )}

          </div>

        )}

      </section>


      {/* =====================================
          QUICK ACTIONS
      ===================================== */}

      <section className="grid gap-4 sm:grid-cols-3">

        <QuickAction
          icon={Plus}
          title="Build your portfolio"
          description="Show clients what you can do."
          onClick={() =>
            navigate(
              "/talent/portfolio"
            )
          }
        />

        <QuickAction
          icon={CompassIcon}
          title="Find opportunities"
          description="Discover work that matches your skills."
          onClick={() =>
            navigate(
              "/talent/opportunities"
            )
          }
        />

        <QuickAction
          icon={UserRoundIcon}
          title="Improve your profile"
          description="Stand out and get discovered."
          onClick={() =>
            navigate(
              "/talent/profile"
            )
          }
        />

      </section>

    </div>
  );
}


/* =========================================
   STAT COMPONENT
========================================= */

function DashboardStat({
  icon: Icon,
  label,
  value,
  description,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-md"
    >

      <div className="flex items-center justify-between">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-600 transition group-hover:bg-navy-600 group-hover:text-white">

          <Icon size={18} />

        </div>

        <ArrowUpRight
          size={15}
          className="text-slate-300 transition group-hover:text-navy-500"
        />

      </div>

      <p className="mt-5 text-xs font-semibold text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words font-['Space_Grotesk'] text-2xl font-bold text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-[10px] text-slate-400">
        {description}
      </p>

    </button>
  );
}


/* =========================================
   EMPTY STATE
========================================= */

function EmptyState({
  icon: Icon,
  title,
  description,
  button,
  onClick,
}) {
  return (
    <div className="p-10 text-center">

      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-300">

        <Icon size={20} />

      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-700">
        {title}
      </h3>

      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-400">
        {description}
      </p>

      {button && (
        <button
          onClick={onClick}
          className="mt-4 rounded-xl bg-navy-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-navy-700"
        >
          {button}
        </button>
      )}

    </div>
  );
}


/* =========================================
   QUICK ACTION
========================================= */

function QuickAction({
  icon: Icon,
  title,
  description,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-navy-200 hover:shadow-sm"
    >

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition group-hover:bg-navy-50 group-hover:text-navy-600">

        <Icon size={18} />

      </div>

      <div className="min-w-0 flex-1">

        <p className="text-sm font-bold text-slate-800">
          {title}
        </p>

        <p className="mt-1 text-[10px] leading-4 text-slate-400">
          {description}
        </p>

      </div>

      <ArrowRight
        size={15}
        className="shrink-0 text-slate-300 transition group-hover:text-navy-600"
      />

    </button>
  );
}


/* =========================================
   PROFILE COMPLETION
========================================= */

function calculateProfileCompletion(
  profile
) {
  if (!profile) {
    return 0;
  }

  const fields = [
    profile.full_name ||
      profile.name,

    profile.avatar_url,

    profile.bio,

    profile.location,

    profile.skills,

    profile.phone,

    profile.website,

  ];

  const completed =
    fields.filter(
      (field) => {
        if (
          Array.isArray(field)
        ) {
          return field.length > 0;
        }

        return Boolean(field);
      }
    ).length;

  return Math.round(
    (completed /
      fields.length) *
      100
  );
}


/* =========================================
   ICON ALIASES
========================================= */

function CompassIcon(
  props
) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
      />

      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}


function UserRoundIcon(
  props
) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle
        cx="12"
        cy="8"
        r="5"
      />

      <path d="M20 21a8 8 0 0 0-16 0" />
    </svg>
  );
}

