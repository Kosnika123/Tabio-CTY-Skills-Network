import { useEffect, useMemo, useState } from "react";
import {
  Users,
  BriefcaseBusiness,
  FolderKanban,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  UserPlus,
  Clock3,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Loader2,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [users, setUsers] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [transactions, setTransactions] = useState([]);

  /*
   * ---------------------------------------------------------
   * LOAD DASHBOARD DATA
   * ---------------------------------------------------------
   */

  const loadDashboard = async (isRefresh = false) => {
    try {
      setError("");

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      /*
       * Users
       *
       * We use the admin RPC we created earlier so the dashboard
       * can display the real authentication email from auth.users.
       */
      const usersPromise = supabase.rpc("get_admin_users");

      /*
       * Opportunities
       */
      const opportunitiesPromise = supabase
        .from("opportunities")
        .select(`
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
          images,
          status,
          client_id,
          created_at,
          updated_at
        `)
        .order("created_at", {
          ascending: false,
        });

      /*
       * Transactions
       *
       * The dashboard is designed to work with the transactions
       * table we created for the platform.
       */
      const transactionsPromise = supabase
        .from("transactions")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      const [
        { data: usersData, error: usersError },
        {
          data: opportunitiesData,
          error: opportunitiesError,
        },
        {
          data: transactionsData,
          error: transactionsError,
        },
      ] = await Promise.all([
        usersPromise,
        opportunitiesPromise,
        transactionsPromise,
      ]);

      if (usersError) {
        throw new Error(`Users: ${usersError.message}`);
      }

      if (opportunitiesError) {
        throw new Error(
          `Opportunities: ${opportunitiesError.message}`
        );
      }

      /*
       * Transactions are handled separately because the dashboard
       * can still function if the transactions table has not been
       * populated yet.
       */
      if (transactionsError) {
        console.warn(
          "Could not load transactions:",
          transactionsError.message
        );
      }

      setUsers(usersData || []);
      setOpportunities(opportunitiesData || []);
      setTransactions(transactionsData || []);
    } catch (err) {
      console.error("Dashboard error:", err);

      setError(
        err?.message ||
          "Something went wrong while loading the dashboard."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  /*
   * ---------------------------------------------------------
   * REAL-TIME SUBSCRIPTIONS
   * ---------------------------------------------------------
   *
   * Whenever something changes in Supabase, reload the dashboard.
   */

  useEffect(() => {
    const usersChannel = supabase
      .channel("admin-dashboard-users")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        () => {
          loadDashboard(true);
        }
      )
      .subscribe();

    const opportunitiesChannel = supabase
      .channel("admin-dashboard-opportunities")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "opportunities",
        },
        () => {
          loadDashboard(true);
        }
      )
      .subscribe();

    const transactionsChannel = supabase
      .channel("admin-dashboard-transactions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
        },
        () => {
          loadDashboard(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(usersChannel);
      supabase.removeChannel(opportunitiesChannel);
      supabase.removeChannel(transactionsChannel);
    };
  }, []);

  /*
   * ---------------------------------------------------------
   * HELPERS
   * ---------------------------------------------------------
   */

  const formatCurrency = (amount) => {
    const value = Number(amount || 0);

    if (value >= 1000000) {
      return `₦${(value / 1000000).toFixed(2)}M`;
    }

    if (value >= 1000) {
      return `₦${(value / 1000).toFixed(1)}K`;
    }

    return `₦${value.toLocaleString("en-NG")}`;
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Intl.DateTimeFormat("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  };

  const formatRelativeTime = (date) => {
    if (!date) return "";

    const now = new Date();
    const created = new Date(date);

    const difference =
      now.getTime() - created.getTime();

    const seconds = Math.floor(difference / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes} ${
        minutes === 1 ? "minute" : "minutes"
      } ago`;
    }

    if (hours < 24) {
      return `${hours} ${
        hours === 1 ? "hour" : "hours"
      } ago`;
    }

    if (days < 7) {
      return `${days} ${
        days === 1 ? "day" : "days"
      } ago`;
    }

    return formatDate(date);
  };

  const getInitials = (name, email) => {
    if (name) {
      return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0])
        .join("")
        .toUpperCase();
    }

    if (email) {
      return email.substring(0, 2).toUpperCase();
    }

    return "U";
  };

  const getRoleLabel = (role) => {
    if (!role) return "User";

    return role
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  /*
   * ---------------------------------------------------------
   * CURRENT DATE
   * ---------------------------------------------------------
   */

  const currentDate = useMemo(() => {
    return new Intl.DateTimeFormat("en-NG", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date());
  }, []);

  /*
   * ---------------------------------------------------------
   * LIVE STATISTICS
   * ---------------------------------------------------------
   */

  const totalUsers = users.length;

  const activeOpportunities = opportunities.filter(
    (opportunity) =>
      opportunity.status === "open" ||
      opportunity.status === "approved"
  ).length;

  const completedProjects = opportunities.filter(
    (opportunity) =>
      opportunity.status === "completed"
  ).length;

  /*
   * Revenue
   *
   * Supports several common transaction amount fields.
   */
  const platformRevenue = transactions.reduce(
    (total, transaction) => {
      const amount =
        transaction.amount ??
        transaction.total_amount ??
        transaction.platform_fee ??
        transaction.value ??
        0;

      /*
       * If a transaction has a status field, only count
       * successful/completed transactions.
       */
      if (transaction.status) {
        const status = String(
          transaction.status
        ).toLowerCase();

        if (
          ![
            "success",
            "successful",
            "completed",
            "complete",
            "paid",
            "settled",
          ].includes(status)
        ) {
          return total;
        }
      }

      return total + Number(amount || 0);
    },
    0
  );

  /*
   * Talent count
   */
  const totalTalent = users.filter(
    (user) => user.role === "talent"
  ).length;

  /*
   * New talent this month
   */
  const now = new Date();

  const newTalentThisMonth = users.filter((user) => {
    if (user.role !== "talent" || !user.created_at) {
      return false;
    }

    const created = new Date(user.created_at);

    return (
      created.getMonth() === now.getMonth() &&
      created.getFullYear() === now.getFullYear()
    );
  }).length;

  /*
   * Projects considered for success rate
   */
  const completedCount = opportunities.filter(
    (opportunity) =>
      opportunity.status === "completed"
  ).length;

  const projectCount = opportunities.filter(
    (opportunity) =>
      [
        "in_progress",
        "completed",
        "cancelled",
        "rejected",
      ].includes(opportunity.status)
  ).length;

  const successRate =
    projectCount > 0
      ? ((completedCount / projectCount) * 100).toFixed(1)
      : "0.0";

  /*
   * ---------------------------------------------------------
   * RECENT USERS
   * ---------------------------------------------------------
   */

  const recentUsers = [...users]
    .sort(
      (a, b) =>
        new Date(b.created_at || 0) -
        new Date(a.created_at || 0)
    )
    .slice(0, 4);

  /*
   * ---------------------------------------------------------
   * LIVE ACTIVITY
   * ---------------------------------------------------------
   */

  const activities = useMemo(() => {
    const generated = [];

    /*
     * Recent registrations
     */
    users.slice(0, 10).forEach((user) => {
      generated.push({
        id: `user-${user.id}`,
        title:
          user.role === "talent"
            ? "New talent registered"
            : "New user registered",
        description: `${
          user.full_name ||
          user.username ||
          user.email ||
          "A new user"
        } joined TCSN Network.`,
        time: user.created_at,
        icon: UserPlus,
      });
    });

    /*
     * Recent opportunities
     */
    opportunities.slice(0, 10).forEach(
      (opportunity) => {
        let title = "New opportunity created";
        let Icon = BriefcaseBusiness;

        if (opportunity.status === "completed") {
          title = "Project completed";
          Icon = CheckCircle2;
        } else if (
          opportunity.status === "pending"
        ) {
          title = "Opportunity needs review";
          Icon = Clock3;
        } else if (
          opportunity.status === "rejected"
        ) {
          title = "Opportunity rejected";
          Icon = AlertCircle;
        }

        generated.push({
          id: `opportunity-${opportunity.id}`,
          title,
          description:
            opportunity.title ||
            "An opportunity was updated.",
          time:
            opportunity.updated_at ||
            opportunity.created_at,
          icon: Icon,
        });
      }
    );

    /*
     * Recent transactions
     */
    transactions.slice(0, 10).forEach(
      (transaction) => {
        generated.push({
          id: `transaction-${transaction.id}`,
          title: "Transaction recorded",
          description: `A transaction of ${formatCurrency(
            transaction.amount ??
              transaction.total_amount ??
              transaction.value ??
              0
          )} was recorded.`,
          time: transaction.created_at,
          icon: CreditCard,
        });
      }
    );

    return generated
      .filter((item) => item.time)
      .sort(
        (a, b) =>
          new Date(b.time) -
          new Date(a.time)
      )
      .slice(0, 4);
  }, [users, opportunities, transactions]);

  /*
   * ---------------------------------------------------------
   * LOADING STATE
   * ---------------------------------------------------------
   */

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2
            size={32}
            className="animate-spin text-navy-600"
          />

          <p className="text-sm font-medium text-slate-500">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * ERROR STATE
   * ---------------------------------------------------------
   */

  if (error) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <AlertCircle size={20} />
            </div>

            <div className="flex-1">
              <h3 className="font-bold text-red-900">
                Couldn't load dashboard
              </h3>

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>

              <button
                type="button"
                onClick={() => loadDashboard()}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
              >
                <RefreshCw size={15} />
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * STATS
   * ---------------------------------------------------------
   */

  const stats = [
    {
      title: "Total Users",
      value: totalUsers.toLocaleString(),
      change: null,
      positive: true,
      icon: Users,
    },
    {
      title: "Active Opportunities",
      value: activeOpportunities.toLocaleString(),
      change: null,
      positive: true,
      icon: BriefcaseBusiness,
    },
    {
      title: "Projects Completed",
      value: completedProjects.toLocaleString(),
      change: null,
      positive: true,
      icon: FolderKanban,
    },
    {
      title: "Platform Revenue",
      value: formatCurrency(platformRevenue),
      change: null,
      positive: true,
      icon: CreditCard,
    },
  ];

  /*
   * ---------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------
   */

  return (
    <div className="mx-auto max-w-7xl space-y-8">

      {/* PAGE HEADING */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {currentDate}
          </p>

          <h2 className="mt-1 font-['Space_Grotesk'] text-3xl font-bold tracking-tight text-slate-950">
            Good afternoon, Admin.
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Here's what's happening across TCSN Network today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>

          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-navy-600/20 transition hover:bg-navy-700"
          >
            <TrendingUp size={17} />
            View Analytics
          </button>
        </div>
      </div>

      {/* LIVE INDICATOR */}

      <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
        </span>

        Live data · Automatically updates when platform data changes
      </div>

      {/* STATS */}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-50 text-navy-600">
                  <Icon size={20} />
                </div>

                <button
                  type="button"
                  className="text-slate-300 transition hover:text-slate-600"
                >
                  <MoreHorizontal size={19} />
                </button>
              </div>

              <p className="mt-5 text-sm font-medium text-slate-500">
                {stat.title}
              </p>

              <div className="mt-1 flex items-end justify-between gap-3">
                <h3 className="font-['Space_Grotesk'] text-2xl font-bold text-slate-950">
                  {stat.value}
                </h3>

                {stat.change && (
                  <span
                    className={`mb-1 flex items-center gap-1 text-xs font-bold ${
                      stat.positive
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {stat.positive ? (
                      <ArrowUpRight size={14} />
                    ) : (
                      <ArrowDownRight size={14} />
                    )}

                    {stat.change}
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs text-slate-400">
                Live platform data
              </p>
            </div>
          );
        })}
      </div>

      {/* MAIN GRID */}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_.6fr]">

        {/* RECENT USERS */}

        <div className="rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div>
              <h3 className="font-['Space_Grotesk'] text-lg font-bold">
                Recent users
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                Latest people joining the platform
              </p>
            </div>

            <a
              href="/admin/users"
              className="text-xs font-bold text-navy-600 hover:text-navy-700"
            >
              View all
            </a>
          </div>

          <div className="divide-y divide-slate-100">
            {recentUsers.length === 0 ? (
              <div className="p-8 text-center">
                <Users
                  size={28}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 text-sm font-semibold text-slate-500">
                  No users yet
                </p>
              </div>
            ) : (
              recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-4 p-5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={
                          user.full_name ||
                          user.username ||
                          "User"
                        }
                        className="h-10 w-10 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                        {getInitials(
                          user.full_name ||
                            user.username,
                          user.email
                        )}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {user.full_name ||
                          user.username ||
                          "Unnamed User"}
                      </p>

                      <p className="truncate text-xs text-slate-400">
                        {user.email || "No email"}
                      </p>
                    </div>
                  </div>

                  <div className="hidden text-right sm:block">
                    <p className="text-xs font-semibold text-slate-600">
                      {getRoleLabel(user.role)}
                    </p>

                    <span className="mt-1 inline-flex rounded-full bg-green-50 px-2 py-1 text-[10px] font-bold text-green-600">
                      Active
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ACTIVITY */}

        <div className="rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-5">
            <h3 className="font-['Space_Grotesk'] text-lg font-bold">
              Recent activity
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              What's happening on the platform
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {activities.length === 0 ? (
              <div className="p-8 text-center">
                <Clock3
                  size={28}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 text-sm font-semibold text-slate-500">
                  No recent activity
                </p>
              </div>
            ) : (
              activities.map((activity) => {
                const Icon = activity.icon;

                return (
                  <div
                    key={activity.id}
                    className="flex gap-3 p-5"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-600">
                      <Icon size={17} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">
                        {activity.title}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        {activity.description}
                      </p>

                      <p className="mt-2 text-[10px] font-medium text-slate-400">
                        {formatRelativeTime(
                          activity.time
                        )}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* PLATFORM OVERVIEW */}

      <div className="grid gap-6 md:grid-cols-3">

        {/* TALENT GROWTH */}

        <div className="rounded-2xl bg-navy-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-navy-100">
              Talent growth
            </p>

            <Users size={19} />
          </div>

          <p className="mt-5 font-['Space_Grotesk'] text-3xl font-bold">
            +{newTalentThisMonth}
          </p>

          <p className="mt-2 text-xs text-navy-200">
            New talent profiles this month
          </p>

          <p className="mt-4 text-xs text-navy-200">
            {totalTalent.toLocaleString()} total talents
          </p>
        </div>

        {/* OPPORTUNITIES */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500">
              Opportunities
            </p>

            <BriefcaseBusiness
              size={19}
              className="text-navy-600"
            />
          </div>

          <p className="mt-5 font-['Space_Grotesk'] text-3xl font-bold text-slate-950">
            {activeOpportunities.toLocaleString()}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            Active opportunities available
          </p>

          <p className="mt-4 text-xs font-semibold text-slate-500">
            {opportunities.length.toLocaleString()} total opportunities
          </p>
        </div>

        {/* SUCCESS RATE */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500">
              Success rate
            </p>

            <CheckCircle2
              size={19}
              className="text-green-500"
            />
          </div>

          <p className="mt-5 font-['Space_Grotesk'] text-3xl font-bold text-slate-950">
            {successRate}%
          </p>

          <p className="mt-2 text-xs text-slate-400">
            Projects successfully completed
          </p>

          <p className="mt-4 text-xs font-semibold text-slate-500">
            {completedCount} completed projects
          </p>
        </div>
      </div>
    </div>
  );
}