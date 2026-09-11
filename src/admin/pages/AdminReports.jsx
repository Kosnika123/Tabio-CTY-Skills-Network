import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  BarChart3,
  Users,
  BriefcaseBusiness,
  FolderKanban,
  Wallet,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock3,
  XCircle,
  Download,
  CalendarDays,
  UserRound,
  Palette,
  Code2,
  DollarSign,
  Activity,
  AlertCircle,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

export default function AdminReports() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [users, setUsers] = useState([]);
  const [talent, setTalent] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [projects, setProjects] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [period, setPeriod] = useState("all");

  /*
   * ==========================================
   * LOAD REPORT DATA
   * ==========================================
   */

  const loadReports = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [
        usersResult,
        talentResult,
        opportunitiesResult,
        projectsResult,
        transactionsResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("*"),

        supabase
          .from("profiles")
          .select("*")
          .eq("role", "talent"),

        supabase
          .from("opportunities")
          .select("*"),

        supabase
          .from("projects")
          .select("*"),

        supabase
          .from("transactions")
          .select("*")
          .order("created_at", {
            ascending: false,
          }),
      ]);

      if (usersResult.error) {
        throw usersResult.error;
      }

      if (talentResult.error) {
        throw talentResult.error;
      }

      if (opportunitiesResult.error) {
        throw opportunitiesResult.error;
      }

      if (projectsResult.error) {
        throw projectsResult.error;
      }

      if (transactionsResult.error) {
        throw transactionsResult.error;
      }

      setUsers(usersResult.data || []);
      setTalent(talentResult.data || []);
      setOpportunities(
        opportunitiesResult.data || []
      );
      setProjects(
        projectsResult.data || []
      );
      setTransactions(
        transactionsResult.data || []
      );
    } catch (err) {
      console.error(
        "Failed to load reports:",
        err
      );

      setError(
        err.message ||
          "Unable to load report data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  /*
   * ==========================================
   * PERIOD FILTER
   * ==========================================
   */

  const getStartDate = () => {
    if (period === "all") {
      return null;
    }

    const date = new Date();

    if (period === "7d") {
      date.setDate(date.getDate() - 7);
    }

    if (period === "30d") {
      date.setDate(date.getDate() - 30);
    }

    if (period === "90d") {
      date.setDate(date.getDate() - 90);
    }

    return date;
  };

  const filterByPeriod = (items) => {
    const startDate = getStartDate();

    if (!startDate) {
      return items;
    }

    return items.filter((item) => {
      if (!item.created_at) {
        return false;
      }

      return (
        new Date(item.created_at) >=
        startDate
      );
    });
  };

  const filteredUsers = useMemo(
    () => filterByPeriod(users),
    [users, period]
  );

  const filteredTalent = useMemo(
    () => filterByPeriod(talent),
    [talent, period]
  );

  const filteredOpportunities = useMemo(
    () =>
      filterByPeriod(opportunities),
    [opportunities, period]
  );

  const filteredProjects = useMemo(
    () => filterByPeriod(projects),
    [projects, period]
  );

  const filteredTransactions = useMemo(
    () =>
      filterByPeriod(transactions),
    [transactions, period]
  );

  /*
   * ==========================================
   * REPORT STATISTICS
   * ==========================================
   */

  const report = useMemo(() => {
    const successfulTransactions =
      filteredTransactions.filter(
        (transaction) =>
          transaction.status ===
          "successful"
      );

    const pendingTransactions =
      filteredTransactions.filter(
        (transaction) =>
          transaction.status ===
            "pending" ||
          transaction.status ===
            "processing"
      );

    const failedTransactions =
      filteredTransactions.filter(
        (transaction) =>
          transaction.status ===
            "failed" ||
          transaction.status ===
            "cancelled"
      );

    const payments =
      successfulTransactions.filter(
        (transaction) =>
          transaction.type === "payment"
      );

    const platformFees =
      successfulTransactions.filter(
        (transaction) =>
          transaction.type ===
          "platform_fee"
      );

    const payouts =
      successfulTransactions.filter(
        (transaction) =>
          transaction.type ===
            "payout" ||
          transaction.type ===
            "withdrawal"
      );

    const refunds =
      successfulTransactions.filter(
        (transaction) =>
          transaction.type ===
          "refund"
      );

    const totalPayments =
      payments.reduce(
        (total, transaction) =>
          total +
          Number(transaction.amount || 0),
        0
      );

    const totalFees =
      platformFees.reduce(
        (total, transaction) =>
          total +
          Number(transaction.amount || 0),
        0
      );

    const totalPayouts =
      payouts.reduce(
        (total, transaction) =>
          total +
          Number(transaction.amount || 0),
        0
      );

    const totalRefunds =
      refunds.reduce(
        (total, transaction) =>
          total +
          Number(transaction.amount || 0),
        0
      );

    const completedProjects =
      filteredProjects.filter(
        (project) =>
          project.status ===
          "completed"
      );

    const activeProjects =
      filteredProjects.filter(
        (project) =>
          project.status ===
            "active" ||
          project.status ===
            "in_progress"
      );

    const cancelledProjects =
      filteredProjects.filter(
        (project) =>
          project.status ===
          "cancelled"
      );

    const openOpportunities =
      filteredOpportunities.filter(
        (opportunity) => {
          return (
            opportunity.status ===
              "open" ||
            opportunity.status ===
              "active"
          );
        }
      );

    return {
      totalUsers:
        filteredUsers.length,

      totalTalent:
        filteredTalent.length,

      totalOpportunities:
        filteredOpportunities.length,

      openOpportunities:
        openOpportunities.length,

      totalProjects:
        filteredProjects.length,

      completedProjects:
        completedProjects.length,

      activeProjects:
        activeProjects.length,

      cancelledProjects:
        cancelledProjects.length,

      totalTransactions:
        filteredTransactions.length,

      successfulTransactions:
        successfulTransactions.length,

      pendingTransactions:
        pendingTransactions.length,

      failedTransactions:
        failedTransactions.length,

      totalPayments,

      totalFees,

      totalPayouts,

      totalRefunds,

      platformBalance:
        totalPayments +
        totalFees -
        totalPayouts -
        totalRefunds,

      successRate:
        filteredTransactions.length
          ? (
              (successfulTransactions.length /
                filteredTransactions.length) *
              100
            ).toFixed(1)
          : "0.0",

      projectCompletionRate:
        filteredProjects.length
          ? (
              (completedProjects.length /
                filteredProjects.length) *
              100
            ).toFixed(1)
          : "0.0",
    };
  }, [
    filteredUsers,
    filteredTalent,
    filteredOpportunities,
    filteredProjects,
    filteredTransactions,
  ]);

  /*
   * ==========================================
   * TRANSACTION BREAKDOWN
   * ==========================================
   */

  const transactionBreakdown = useMemo(() => {
    const types = [
      "payment",
      "payout",
      "platform_fee",
      "refund",
      "withdrawal",
    ];

    return types.map((type) => {
      const items =
        filteredTransactions.filter(
          (transaction) =>
            transaction.type === type
        );

      const amount = items.reduce(
        (total, transaction) =>
          total +
          Number(transaction.amount || 0),
        0
      );

      return {
        type,
        count: items.length,
        amount,
      };
    });
  }, [filteredTransactions]);

  /*
   * ==========================================
   * RECENT ACTIVITY
   * ==========================================
   */

  const recentTransactions = useMemo(() => {
    return filteredTransactions
      .slice(0, 6);
  }, [filteredTransactions]);

  /*
   * ==========================================
   * FORMATTERS
   * ==========================================
   */

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(
      "en-NG",
      {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0,
      }
    ).format(Number(amount || 0));
  };

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    return new Date(
      date
    ).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  /*
   * ==========================================
   * CSV EXPORT
   * ==========================================
   */

  const exportTransactions = () => {
    if (!filteredTransactions.length) {
      return;
    }

    const headers = [
      "ID",
      "Type",
      "Status",
      "Amount",
      "Currency",
      "Payment Method",
      "Payment Reference",
      "Created At",
    ];

    const rows =
      filteredTransactions.map(
        (transaction) => [
          transaction.id,
          transaction.type,
          transaction.status,
          transaction.amount,
          transaction.currency,
          transaction.payment_method ||
            "",
          transaction.payment_reference ||
            "",
          transaction.created_at,
        ]
      );

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) =>
            `"${String(value ?? "").replace(
              /"/g,
              '""'
            )}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob(
      [csv],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      `tcsn-network-transactions-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  /*
   * ==========================================
   * LOADING
   * ==========================================
   */

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-7">

        <div className="space-y-3">

          <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />

          <div className="h-9 w-64 animate-pulse rounded bg-slate-100" />

          <div className="h-4 w-96 max-w-full animate-pulse rounded bg-slate-100" />

        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {[1, 2, 3, 4].map(
            (item) => (
              <div
                key={item}
                className="h-36 animate-pulse rounded-2xl bg-slate-100"
              />
            )
          )}

        </div>

        <div className="grid gap-5 lg:grid-cols-2">

          {[1, 2].map(
            (item) => (
              <div
                key={item}
                className="h-80 animate-pulse rounded-2xl bg-slate-100"
              />
            )
          )}

        </div>

      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7">

      {/* ========================================== */}
      {/* HEADER */}
      {/* ========================================== */}

      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">

        <div>

          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">

            <Link
              to="/admin"
              className="transition hover:text-navy-600"
            >
              Dashboard
            </Link>

            <span>/</span>

            <span>
              Reports
            </span>

          </div>

          <h1 className="font-['Space_Grotesk'] text-3xl font-bold tracking-tight text-slate-950">
            Reports & Analytics
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Get a complete overview of TCSN Network's
            users, talent, opportunities, projects and
            financial activity.
          </p>

        </div>


        <div className="flex flex-col gap-3 sm:flex-row">

          {/* Period */}

          <div className="relative">

            <CalendarDays
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <select
              value={period}
              onChange={(e) =>
                setPeriod(e.target.value)
              }
              className="appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-9 text-sm font-semibold text-slate-700 outline-none transition focus:border-navy-500 focus:ring-4 focus:ring-navy-500/10"
            >

              <option value="all">
                All time
              </option>

              <option value="7d">
                Last 7 days
              </option>

              <option value="30d">
                Last 30 days
              </option>

              <option value="90d">
                Last 90 days
              </option>

            </select>

          </div>


          <button
            type="button"
            onClick={() =>
              loadReports(true)
            }
            disabled={refreshing}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
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
            onClick={exportTransactions}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >

            <Download size={16} />

            Export CSV

          </button>

        </div>

      </div>


      {/* ========================================== */}
      {/* ERROR */}
      {/* ========================================== */}

      {error && (

        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">

          <AlertCircle
            size={19}
            className="mt-0.5 shrink-0"
          />

          <div>

            <p className="text-sm font-bold">
              Couldn't load reports
            </p>

            <p className="mt-1 text-xs leading-5">
              {error}
            </p>

            <button
              onClick={() =>
                loadReports()
              }
              className="mt-3 text-xs font-bold underline"
            >
              Try again
            </button>

          </div>

        </div>

      )}


      {/* ========================================== */}
      {/* PLATFORM OVERVIEW */}
      {/* ========================================== */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <ReportStat
          icon={Users}
          label="Total Users"
          value={report.totalUsers}
          description={`${report.totalTalent} talent members`}
        />

        <ReportStat
          icon={BriefcaseBusiness}
          label="Opportunities"
          value={report.totalOpportunities}
          description={`${report.openOpportunities} currently open`}
        />

        <ReportStat
          icon={FolderKanban}
          label="Projects"
          value={report.totalProjects}
          description={`${report.completedProjects} completed`}
        />

        <ReportStat
          icon={Wallet}
          label="Platform Balance"
          value={formatCurrency(
            report.platformBalance
          )}
          description="Based on successful transactions"
          currency
        />

      </div>


      {/* ========================================== */}
      {/* FINANCIAL PERFORMANCE */}
      {/* ========================================== */}

      <div className="grid gap-5 lg:grid-cols-3">

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">

            <div>

              <p className="text-xs font-semibold text-slate-400">
                Financial Performance
              </p>

              <h2 className="mt-1 font-['Space_Grotesk'] text-xl font-bold text-slate-950">
                Money Flow
              </h2>

            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">

              <DollarSign size={19} />

            </div>

          </div>


          <div className="mt-7 grid gap-4 sm:grid-cols-2">

            <FinancialMetric
              label="Client Payments"
              value={formatCurrency(
                report.totalPayments
              )}
              icon={ArrowDownRight}
              positive
            />

            <FinancialMetric
              label="Platform Fees"
              value={formatCurrency(
                report.totalFees
              )}
              icon={TrendingUp}
              positive
            />

            <FinancialMetric
              label="Talent Payouts"
              value={formatCurrency(
                report.totalPayouts
              )}
              icon={ArrowUpRight}
              negative
            />

            <FinancialMetric
              label="Refunds"
              value={formatCurrency(
                report.totalRefunds
              )}
              icon={TrendingDown}
              negative
            />

          </div>

        </div>


        {/* Transaction Health */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-xs font-semibold text-slate-400">
                Transaction Health
              </p>

              <h2 className="mt-1 font-['Space_Grotesk'] text-xl font-bold text-slate-950">
                {report.successRate}%
              </h2>

            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-600">

              <Activity size={18} />

            </div>

          </div>


          <div className="mt-7 space-y-4">

            <HealthRow
              icon={CheckCircle2}
              label="Successful"
              value={
                report.successfulTransactions
              }
              className="text-green-600"
            />

            <HealthRow
              icon={Clock3}
              label="Pending"
              value={
                report.pendingTransactions
              }
              className="text-amber-600"
            />

            <HealthRow
              icon={XCircle}
              label="Failed"
              value={
                report.failedTransactions
              }
              className="text-red-500"
            />

          </div>

        </div>

      </div>


      {/* ========================================== */}
      {/* PLATFORM ACTIVITY */}
      {/* ========================================== */}

      <div className="grid gap-5 lg:grid-cols-2">

        {/* Projects */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-xs font-semibold text-slate-400">
                Project Performance
              </p>

              <h2 className="mt-1 font-['Space_Grotesk'] text-xl font-bold text-slate-950">
                Project Overview
              </h2>

            </div>

            <FolderKanban
              size={20}
              className="text-slate-300"
            />

          </div>


          <div className="mt-7 space-y-5">

            <ProgressRow
              label="Completed"
              value={
                report.completedProjects
              }
              total={
                report.totalProjects
              }
            />

            <ProgressRow
              label="Active / In Progress"
              value={
                report.activeProjects
              }
              total={
                report.totalProjects
              }
            />

            <ProgressRow
              label="Cancelled"
              value={
                report.cancelledProjects
              }
              total={
                report.totalProjects
              }
            />

          </div>


          <div className="mt-7 rounded-xl bg-slate-50 p-4">

            <div className="flex items-center justify-between">

              <span className="text-xs font-semibold text-slate-500">
                Completion rate
              </span>

              <span className="text-sm font-bold text-slate-900">
                {
                  report.projectCompletionRate
                }%
              </span>

            </div>

          </div>

        </div>


        {/* Transaction Types */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-xs font-semibold text-slate-400">
                Transaction Breakdown
              </p>

              <h2 className="mt-1 font-['Space_Grotesk'] text-xl font-bold text-slate-950">
                Financial Activity
              </h2>

            </div>

            <BarChart3
              size={20}
              className="text-slate-300"
            />

          </div>


          <div className="mt-6 space-y-3">

            {transactionBreakdown.map(
              (item) => (

                <div
                  key={item.type}
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-3"
                >

                  <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-500">

                      {getTransactionIcon(
                        item.type
                      )}

                    </div>

                    <div>

                      <p className="text-xs font-bold capitalize text-slate-700">
                        {formatTransactionType(
                          item.type
                        )}
                      </p>

                      <p className="mt-0.5 text-[10px] text-slate-400">
                        {item.count} transactions
                      </p>

                    </div>

                  </div>


                  <p className="text-xs font-bold text-slate-900">
                    {formatCurrency(
                      item.amount
                    )}
                  </p>

                </div>

              )
            )}

          </div>

        </div>

      </div>


      {/* ========================================== */}
      {/* USER & TALENT OVERVIEW */}
      {/* ========================================== */}

      <div className="grid gap-5 lg:grid-cols-3">

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

              <Users size={18} />

            </div>

            <div>

              <p className="text-xs font-semibold text-slate-400">
                User Growth
              </p>

              <p className="font-['Space_Grotesk'] text-xl font-bold text-slate-950">
                {report.totalUsers}
              </p>

            </div>

          </div>

          <p className="mt-5 text-xs leading-5 text-slate-400">
            Total users registered within the
            selected reporting period.
          </p>

        </div>


        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-600">

              <Palette size={18} />

            </div>

            <div>

              <p className="text-xs font-semibold text-slate-400">
                Talent Pool
              </p>

              <p className="font-['Space_Grotesk'] text-xl font-bold text-slate-950">
                {report.totalTalent}
              </p>

            </div>

          </div>

          <p className="mt-5 text-xs leading-5 text-slate-400">
            Designers, developers and other creative
            professionals available on the platform.
          </p>

        </div>


        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">

              <BriefcaseBusiness size={18} />

            </div>

            <div>

              <p className="text-xs font-semibold text-slate-400">
                Open Opportunities
              </p>

              <p className="font-['Space_Grotesk'] text-xl font-bold text-slate-950">
                {report.openOpportunities}
              </p>

            </div>

          </div>

          <p className="mt-5 text-xs leading-5 text-slate-400">
            Opportunities currently available for
            talent to apply for.
          </p>

        </div>

      </div>


      {/* ========================================== */}
      {/* RECENT TRANSACTIONS */}
      {/* ========================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center">

          <div>

            <p className="text-xs font-semibold text-slate-400">
              Latest Activity
            </p>

            <h2 className="mt-1 font-['Space_Grotesk'] text-lg font-bold text-slate-950">
              Recent Transactions
            </h2>

          </div>

          <Link
            to="/admin/transactions"
            className="flex items-center gap-1 text-xs font-bold text-navy-600 transition hover:text-navy-700"
          >
            View all
            <ArrowUpRight size={13} />
          </Link>

        </div>


        {recentTransactions.length ===
        0 ? (

          <div className="px-6 py-14 text-center">

            <Wallet
              size={25}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 text-sm font-semibold text-slate-500">
              No transaction activity
            </p>

          </div>

        ) : (

          <div className="divide-y divide-slate-100">

            {recentTransactions.map(
              (transaction) => (

                <div
                  key={transaction.id}
                  className="flex flex-col gap-3 p-5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500">

                      {getTransactionIcon(
                        transaction.type
                      )}

                    </div>

                    <div>

                      <p className="text-sm font-bold text-slate-700">
                        {formatTransactionType(
                          transaction.type
                        )}
                      </p>

                      <p className="mt-1 font-mono text-[10px] text-slate-400">
                        {
                          transaction.payment_reference ||
                          transaction.id
                        }
                      </p>

                    </div>

                  </div>


                  <div className="flex items-center justify-between gap-6 sm:justify-end">

                    <div className="text-left sm:text-right">

                      <p className="text-sm font-bold text-slate-900">
                        {formatCurrency(
                          transaction.amount
                        )}
                      </p>

                      <p className="mt-1 text-[10px] text-slate-400">
                        {formatDate(
                          transaction.created_at
                        )}
                      </p>

                    </div>


                    <TransactionStatus
                      status={
                        transaction.status
                      }
                    />

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>

    </div>
  );
}


/* ========================================== */
/* REPORT STAT */
/* ========================================== */

function ReportStat({
  icon: Icon,
  label,
  value,
  description,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-600">

          <Icon size={19} />

        </div>

        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
          Live
        </span>

      </div>

      <p className="mt-5 text-xs font-semibold text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words font-['Space_Grotesk'] text-2xl font-bold text-slate-950">
        {value}
      </p>

      <p className="mt-2 text-[10px] leading-4 text-slate-400">
        {description}
      </p>

    </div>
  );
}


/* ========================================== */
/* FINANCIAL METRIC */
/* ========================================== */

function FinancialMetric({
  label,
  value,
  icon: Icon,
  positive,
  negative,
}) {
  return (
    <div className="rounded-xl border border-slate-100 p-4">

      <div className="flex items-center justify-between">

        <p className="text-xs font-semibold text-slate-400">
          {label}
        </p>

        <Icon
          size={15}
          className={
            positive
              ? "text-green-500"
              : negative
              ? "text-red-500"
              : "text-slate-400"
          }
        />

      </div>

      <p className="mt-2 text-lg font-bold text-slate-900">
        {value}
      </p>

    </div>
  );
}


/* ========================================== */
/* HEALTH ROW */
/* ========================================== */

function HealthRow({
  icon: Icon,
  label,
  value,
  className,
}) {
  return (
    <div className="flex items-center justify-between">

      <div className="flex items-center gap-3">

        <Icon
          size={16}
          className={className}
        />

        <span className="text-xs font-semibold text-slate-600">
          {label}
        </span>

      </div>

      <span className="text-sm font-bold text-slate-900">
        {value}
      </span>

    </div>
  );
}


/* ========================================== */
/* PROGRESS ROW */
/* ========================================== */

function ProgressRow({
  label,
  value,
  total,
}) {
  const percentage =
    total > 0
      ? Math.round(
          (value / total) * 100
        )
      : 0;

  return (
    <div>

      <div className="mb-2 flex items-center justify-between">

        <span className="text-xs font-semibold text-slate-500">
          {label}
        </span>

        <span className="text-xs font-bold text-slate-700">
          {value}
        </span>

      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">

        <div
          className="h-full rounded-full bg-navy-500 transition-all"
          style={{
            width: `${percentage}%`,
          }}
        />

      </div>

      <p className="mt-1 text-right text-[9px] text-slate-400">
        {percentage}%
      </p>

    </div>
  );
}


/* ========================================== */
/* TRANSACTION ICON */
/* ========================================== */

function getTransactionIcon(type) {
  if (type === "payment") {
    return (
      <ArrowDownRight
        size={17}
        className="text-green-600"
      />
    );
  }

  if (type === "payout") {
    return (
      <ArrowUpRight
        size={17}
        className="text-blue-600"
      />
    );
  }

  if (type === "platform_fee") {
    return (
      <Wallet
        size={17}
        className="text-navy-600"
      />
    );
  }

  if (type === "refund") {
    return (
      <TrendingDown
        size={17}
        className="text-amber-600"
      />
    );
  }

  if (type === "withdrawal") {
    return (
      <ArrowUpRight
        size={17}
        className="text-orange-600"
      />
    );
  }

  return (
    <ReceiptIcon />
  );
}


/* ========================================== */
/* FALLBACK RECEIPT ICON */
/* ========================================== */

function ReceiptIcon() {
  return (
    <BarChart3
      size={17}
      className="text-slate-500"
    />
  );
}


/* ========================================== */
/* TRANSACTION TYPE */
/* ========================================== */

function formatTransactionType(type) {
  const labels = {
    payment: "Client Payment",
    payout: "Talent Payout",
    platform_fee: "Platform Fee",
    refund: "Refund",
    withdrawal: "Talent Withdrawal",
  };

  return (
    labels[type] ||
    "Transaction"
  );
}


/* ========================================== */
/* TRANSACTION STATUS */
/* ========================================== */

function TransactionStatus({
  status,
}) {
  const styles = {
    pending:
      "bg-amber-50 text-amber-600",

    processing:
      "bg-blue-50 text-blue-600",

    successful:
      "bg-green-50 text-green-600",

    failed:
      "bg-red-50 text-red-600",

    cancelled:
      "bg-slate-100 text-slate-500",

    refunded:
      "bg-navy-50 text-navy-600",
  };

  const labels = {
    pending: "Pending",
    processing: "Processing",
    successful: "Successful",
    failed: "Failed",
    cancelled: "Cancelled",
    refunded: "Refunded",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
        styles[status] ||
        "bg-slate-100 text-slate-500"
      }`}
    >
      {labels[status] ||
        "Unknown"}
    </span>
  );
}

