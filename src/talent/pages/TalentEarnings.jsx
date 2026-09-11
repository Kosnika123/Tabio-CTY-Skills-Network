import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  DollarSign,
  Loader2,
  RefreshCw,
  Search,
  TrendingUp,
  Wallet,
  X,
  AlertCircle,
  BriefcaseBusiness,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

const formatCurrency = (value) => {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date) => {
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

const formatDateTime = (date) => {
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
};

const earningStatus = {
  pending: {
    label: "Pending",
    className: "bg-amber-500/10 text-amber-600",
    icon: Clock3,
  },
  available: {
    label: "Available",
    className: "bg-green-500/10 text-green-600",
    icon: CheckCircle2,
  },
  paid: {
    label: "Paid",
    className: "bg-blue-500/10 text-blue-600",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-500/10 text-red-600",
    icon: X,
  },
};

const withdrawalStatus = {
  pending: {
    label: "Pending",
    className: "bg-amber-500/10 text-amber-600",
    icon: Clock3,
  },
  processing: {
    label: "Processing",
    className: "bg-blue-500/10 text-blue-600",
    icon: Loader2,
  },
  completed: {
    label: "Completed",
    className: "bg-green-500/10 text-green-600",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-500/10 text-red-600",
    icon: X,
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-gray-500/10 text-gray-600",
    icon: X,
  },
};

function StatusBadge({ status, type = "earning" }) {
  const config =
    type === "withdrawal"
      ? withdrawalStatus[status]
      : earningStatus[status];

  if (!config) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
        {status || "Unknown"}
      </span>
    );
  }

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${config.className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconClassName,
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>

          <h3 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
            {value}
          </h3>

          {description && (
            <p className="mt-1 text-xs text-gray-500">{description}</p>
          )}
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function TalentEarnings() {
  const [user, setUser] = useState(null);

  const [summary, setSummary] = useState({
    available_balance: 0,
    total_earnings: 0,
    pending_earnings: 0,
    withdrawn_amount: 0,
    this_month: 0,
    total_projects: 0,
  });

  const [earnings, setEarnings] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState("earnings");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const [withdrawForm, setWithdrawForm] = useState({
    amount: "",
    payment_method: "bank_transfer",
    account_name: "",
    account_number: "",
    bank_name: "",
    bank_code: "",
  });

  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawSuccess, setWithdrawSuccess] = useState("");

  const getUser = async () => {
    const {
      data: { user: currentUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;

    setUser(currentUser);

    return currentUser;
  };

  const loadData = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const currentUser = user || (await getUser());

      if (!currentUser) {
        throw new Error("You must be logged in to view your earnings.");
      }

      const [
        { data: summaryData, error: summaryError },
        { data: earningsData, error: earningsError },
        { data: withdrawalsData, error: withdrawalsError },
      ] = await Promise.all([
        supabase.rpc("get_talent_earnings_summary"),

        supabase
          .from("talent_earnings")
          .select(`
            id,
            talent_id,
            project_id,
            opportunity_id,
            application_id,
            amount,
            platform_fee,
            net_amount,
            status,
            description,
            available_at,
            paid_at,
            created_at,
            updated_at,
            project:project_id (
              id,
              title,
              category,
              status,
              verification_status
            ),
            opportunity:opportunity_id (
              id,
              title,
              category,
              budget
            )
          `)
          .eq("talent_id", currentUser.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("withdrawal_requests")
          .select(`
            id,
            talent_id,
            amount,
            status,
            payment_method,
            account_name,
            account_number,
            bank_name,
            bank_code,
            admin_note,
            processed_at,
            created_at,
            updated_at
          `)
          .eq("talent_id", currentUser.id)
          .order("created_at", { ascending: false }),
      ]);

      if (summaryError) throw summaryError;
      if (earningsError) throw earningsError;
      if (withdrawalsError) throw withdrawalsError;

      const summaryRow = Array.isArray(summaryData)
        ? summaryData[0]
        : summaryData;

      setSummary({
        available_balance: Number(summaryRow?.available_balance || 0),
        total_earnings: Number(summaryRow?.total_earnings || 0),
        pending_earnings: Number(summaryRow?.pending_earnings || 0),
        withdrawn_amount: Number(summaryRow?.withdrawn_amount || 0),
        this_month: Number(summaryRow?.this_month || 0),
        total_projects: Number(summaryRow?.total_projects || 0),
      });

      setEarnings(earningsData || []);
      setWithdrawals(withdrawalsData || []);
    } catch (err) {
      console.error("Talent earnings error:", err);

      setError(
        err?.message ||
          "Unable to load your earnings. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`talent-earnings-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "talent_earnings",
          filter: `talent_id=eq.${user.id}`,
        },
        () => {
          loadData(true);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "withdrawal_requests",
          filter: `talent_id=eq.${user.id}`,
        },
        () => {
          loadData(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const filteredEarnings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return earnings.filter((earning) => {
      const title =
        earning.project?.title ||
        earning.opportunity?.title ||
        earning.description ||
        "";

      const matchesSearch =
        !query ||
        title.toLowerCase().includes(query) ||
        String(earning.category || "").toLowerCase().includes(query) ||
        String(earning.status || "").toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        earning.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [earnings, search, statusFilter]);

  const filteredWithdrawals = useMemo(() => {
    const query = search.trim().toLowerCase();

    return withdrawals.filter((withdrawal) => {
      const searchable = [
        withdrawal.bank_name,
        withdrawal.account_name,
        withdrawal.payment_method,
        withdrawal.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchable.includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        withdrawal.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [withdrawals, search, statusFilter]);

  const handleWithdraw = async (event) => {
    event.preventDefault();

    setWithdrawError("");
    setWithdrawSuccess("");

    const amount = Number(withdrawForm.amount);

    if (!amount || amount <= 0) {
      setWithdrawError("Enter a valid withdrawal amount.");
      return;
    }

    if (amount > Number(summary.available_balance)) {
      setWithdrawError(
        `You can only withdraw up to ${formatCurrency(
          summary.available_balance
        )}.`
      );
      return;
    }

    if (!withdrawForm.account_name.trim()) {
      setWithdrawError("Enter the account name.");
      return;
    }

    if (!withdrawForm.account_number.trim()) {
      setWithdrawError("Enter your account number.");
      return;
    }

    if (!withdrawForm.bank_name.trim()) {
      setWithdrawError("Enter your bank name.");
      return;
    }

    try {
      setWithdrawing(true);

      const { data, error: rpcError } = await supabase.rpc(
        "request_talent_withdrawal",
        {
          p_amount: amount,
          p_payment_method:
            withdrawForm.payment_method || "bank_transfer",
          p_account_name:
            withdrawForm.account_name.trim(),
          p_account_number:
            withdrawForm.account_number.trim(),
          p_bank_name:
            withdrawForm.bank_name.trim(),
          p_bank_code:
            withdrawForm.bank_code.trim() || null,
        }
      );

      if (rpcError) throw rpcError;

      if (!data) {
        throw new Error(
          "The withdrawal request could not be created."
        );
      }

      setWithdrawSuccess(
        "Your withdrawal request has been submitted successfully."
      );

      setWithdrawForm({
        amount: "",
        payment_method: "bank_transfer",
        account_name: "",
        account_number: "",
        bank_name: "",
        bank_code: "",
      });

      await loadData(true);

      setTimeout(() => {
        setShowWithdrawModal(false);
        setWithdrawSuccess("");
      }, 1200);
    } catch (err) {
      console.error("Withdrawal error:", err);

      setWithdrawError(
        err?.message ||
          "Unable to submit your withdrawal request."
      );
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Loading your earnings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-500">
              <Wallet className="h-4 w-4" />
              Talent Wallet
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Earnings
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Track your income, completed work payments and
              withdrawal requests in one place.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing ? "animate-spin" : ""
                }`}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => {
                setWithdrawError("");
                setWithdrawSuccess("");
                setShowWithdrawModal(true);
              }}
              disabled={summary.available_balance <= 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowDownToLine className="h-4 w-4" />
              Withdraw
            </button>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div className="flex-1">
              <p className="font-semibold">
                Unable to load earnings
              </p>

              <p className="mt-1 text-sm">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadData(true)}
              className="text-sm font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* BALANCE HERO */}
        <div className="mb-6 overflow-hidden rounded-3xl bg-gray-900 p-6 text-white shadow-lg sm:p-8">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-medium text-gray-400">
                Available balance
              </p>

              <div className="mt-3 flex flex-wrap items-end gap-3">
                <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
                  {formatCurrency(summary.available_balance)}
                </h2>

                {summary.available_balance > 0 && (
                  <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Available
                  </span>
                )}
              </div>

              <p className="mt-3 max-w-xl text-sm text-gray-400">
                Money available for withdrawal from your
                completed and released earnings.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
              <div>
                <p className="text-xs text-gray-500">
                  This month
                </p>
                <p className="mt-1 text-lg font-bold">
                  {formatCurrency(summary.this_month)}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Pending
                </p>
                <p className="mt-1 text-lg font-bold">
                  {formatCurrency(summary.pending_earnings)}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Projects
                </p>
                <p className="mt-1 text-lg font-bold">
                  {summary.total_projects}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total earnings"
            value={formatCurrency(summary.total_earnings)}
            description="Released earnings"
            icon={TrendingUp}
            iconClassName="bg-green-500/10 text-green-600"
          />

          <StatCard
            title="Pending earnings"
            value={formatCurrency(summary.pending_earnings)}
            description="Waiting to be released"
            icon={Clock3}
            iconClassName="bg-amber-500/10 text-amber-600"
          />

          <StatCard
            title="Withdrawn"
            value={formatCurrency(summary.withdrawn_amount)}
            description="Completed withdrawals"
            icon={ArrowDownToLine}
            iconClassName="bg-blue-500/10 text-blue-600"
          />

          <StatCard
            title="Completed projects"
            value={summary.total_projects}
            description="Projects generating earnings"
            icon={BriefcaseBusiness}
            iconClassName="bg-purple-500/10 text-purple-600"
          />
        </div>

        {/* MAIN CONTENT */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* TABS */}
          <div className="flex flex-col gap-4 border-b border-gray-200 px-5 pt-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("earnings");
                  setStatusFilter("all");
                }}
                className={`border-b-2 pb-4 text-sm font-semibold transition ${
                  activeTab === "earnings"
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                Earnings
                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                  {earnings.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("withdrawals");
                  setStatusFilter("all");
                }}
                className={`border-b-2 pb-4 text-sm font-semibold transition ${
                  activeTab === "withdrawals"
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                Withdrawals
                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                  {withdrawals.length}
                </span>
              </button>
            </div>

            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder={
                    activeTab === "earnings"
                      ? "Search earnings..."
                      : "Search withdrawals..."
                  }
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-gray-400 focus:bg-white sm:w-64"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-700 outline-none focus:border-gray-400"
              >
                <option value="all">All statuses</option>

                {activeTab === "earnings" ? (
                  <>
                    <option value="pending">Pending</option>
                    <option value="available">Available</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                  </>
                ) : (
                  <>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                    <option value="cancelled">Cancelled</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* EARNINGS */}
          {activeTab === "earnings" && (
            <>
              {filteredEarnings.length === 0 ? (
                <div className="px-6 py-20 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                    <Banknote className="h-7 w-7 text-gray-400" />
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-gray-900">
                    No earnings found
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                    {earnings.length === 0
                      ? "Once you complete verified projects and payments are released, your earnings will appear here."
                      : "Try changing your search or status filter."}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredEarnings.map((earning) => {
                    const title =
                      earning.project?.title ||
                      earning.opportunity?.title ||
                      earning.description ||
                      "Project earning";

                    return (
                      <div
                        key={earning.id}
                        className="p-5 transition hover:bg-gray-50 sm:p-6"
                      >
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex min-w-0 gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                              <DollarSign className="h-5 w-5 text-gray-700" />
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="truncate font-bold text-gray-900">
                                  {title}
                                </h3>

                                <StatusBadge
                                  status={earning.status}
                                />
                              </div>

                              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                                {earning.project?.category && (
                                  <span className="capitalize">
                                    {earning.project.category}
                                  </span>
                                )}

                                <span className="inline-flex items-center gap-1">
                                  <CalendarDays className="h-3.5 w-3.5" />
                                  {formatDate(earning.created_at)}
                                </span>
                              </div>

                              {earning.description && (
                                <p className="mt-2 line-clamp-1 text-sm text-gray-500">
                                  {earning.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-6 lg:justify-end">
                            <div className="text-left lg:text-right">
                              <p className="text-lg font-bold text-gray-900">
                                +{formatCurrency(earning.net_amount)}
                              </p>

                              {Number(earning.platform_fee) > 0 && (
                                <p className="mt-1 text-xs text-gray-400">
                                  Fee:{" "}
                                  {formatCurrency(
                                    earning.platform_fee
                                  )}
                                </p>
                              )}
                            </div>

                            <ArrowUpRight className="hidden h-5 w-5 text-gray-300 sm:block" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* WITHDRAWALS */}
          {activeTab === "withdrawals" && (
            <>
              {filteredWithdrawals.length === 0 ? (
                <div className="px-6 py-20 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                    <CreditCard className="h-7 w-7 text-gray-400" />
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-gray-900">
                    No withdrawal requests
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                    Your withdrawal history will appear here
                    once you request a payout.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredWithdrawals.map((withdrawal) => (
                    <div
                      key={withdrawal.id}
                      className="p-5 transition hover:bg-gray-50 sm:p-6"
                    >
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                            <CreditCard className="h-5 w-5 text-gray-700" />
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold text-gray-900">
                                Bank transfer
                              </h3>

                              <StatusBadge
                                status={withdrawal.status}
                                type="withdrawal"
                              />
                            </div>

                            <p className="mt-1 text-sm text-gray-500">
                              {withdrawal.bank_name ||
                                "Bank not specified"}
                              {withdrawal.account_number
                                ? ` •••• ${withdrawal.account_number.slice(
                                    -4
                                  )}`
                                : ""}
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                              Requested{" "}
                              {formatDateTime(
                                withdrawal.created_at
                              )}
                            </p>

                            {withdrawal.admin_note && (
                              <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                                Note: {withdrawal.admin_note}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-left lg:text-right">
                          <p className="text-lg font-bold text-gray-900">
                            -{formatCurrency(withdrawal.amount)}
                          </p>

                          {withdrawal.processed_at && (
                            <p className="mt-1 text-xs text-gray-400">
                              Processed{" "}
                              {formatDate(
                                withdrawal.processed_at
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* WITHDRAW MODAL */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Withdraw earnings
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Available:{" "}
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(
                      summary.available_balance
                    )}
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleWithdraw}
              className="space-y-5 p-6"
            >
              {withdrawError && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{withdrawError}</span>
                </div>
              )}

              {withdrawSuccess && (
                <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{withdrawSuccess}</span>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Amount
                </label>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
                    ₦
                  </span>

                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    max={summary.available_balance}
                    value={withdrawForm.amount}
                    onChange={(event) =>
                      setWithdrawForm((prev) => ({
                        ...prev,
                        amount: event.target.value,
                      }))
                    }
                    placeholder="0.00"
                    className="w-full rounded-xl border border-gray-200 py-3 pl-8 pr-3 text-sm outline-none focus:border-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Payment method
                </label>

                <select
                  value={withdrawForm.payment_method}
                  onChange={(event) =>
                    setWithdrawForm((prev) => ({
                      ...prev,
                      payment_method: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-gray-400"
                >
                  <option value="bank_transfer">
                    Bank Transfer
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Account name
                </label>

                <input
                  type="text"
                  value={withdrawForm.account_name}
                  onChange={(event) =>
                    setWithdrawForm((prev) => ({
                      ...prev,
                      account_name: event.target.value,
                    }))
                  }
                  placeholder="Account holder name"
                  className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-gray-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Account number
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  value={withdrawForm.account_number}
                  onChange={(event) =>
                    setWithdrawForm((prev) => ({
                      ...prev,
                      account_number:
                        event.target.value.replace(
                          /\D/g,
                          ""
                        ),
                    }))
                  }
                  placeholder="0123456789"
                  maxLength={20}
                  className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-gray-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Bank name
                </label>

                <input
                  type="text"
                  value={withdrawForm.bank_name}
                  onChange={(event) =>
                    setWithdrawForm((prev) => ({
                      ...prev,
                      bank_name: event.target.value,
                    }))
                  }
                  placeholder="e.g. GTBank"
                  className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-gray-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Bank code
                  <span className="ml-1 font-normal text-gray-400">
                    optional
                  </span>
                </label>

                <input
                  type="text"
                  value={withdrawForm.bank_code}
                  onChange={(event) =>
                    setWithdrawForm((prev) => ({
                      ...prev,
                      bank_code: event.target.value,
                    }))
                  }
                  placeholder="Optional"
                  className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-gray-400"
                />
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 text-gray-500" />

                  <p className="text-xs leading-5 text-gray-500">
                    Make sure your bank details are correct.
                    Withdrawal requests are reviewed and
                    processed by TCSN Network administrators.
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setShowWithdrawModal(false)
                  }
                  className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={withdrawing}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {withdrawing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <ArrowDownToLine className="h-4 w-4" />
                      Request withdrawal
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

