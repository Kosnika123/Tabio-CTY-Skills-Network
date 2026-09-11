import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  Clock3,
  CreditCard,
  DollarSign,
  Eye,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  TrendingUp,
  Users,
  X,
  XCircle,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
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

const earningStatusConfig = {
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
    icon: XCircle,
  },
};

const withdrawalStatusConfig = {
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
    icon: XCircle,
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
      ? withdrawalStatusConfig[status]
      : earningStatusConfig[status];

  if (!config) {
    return (
      <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
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
          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>

          <h3 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
            {value}
          </h3>

          {description && (
            <p className="mt-1 text-xs text-gray-500">
              {description}
            </p>
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

export default function AdminEarnings() {
  const [earnings, setEarnings] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const [activeTab, setActiveTab] = useState("earnings");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedWithdrawal, setSelectedWithdrawal] =
    useState(null);

  const [selectedEarning, setSelectedEarning] =
    useState(null);

  const [processingId, setProcessingId] = useState(null);

  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const loadData = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [
        { data: earningsData, error: earningsError },
        { data: withdrawalsData, error: withdrawalsError },
      ] = await Promise.all([
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
            talent:talent_id (
              id,
              full_name,
              username,
              avatar_url,
              location
            ),
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
          .order("created_at", {
            ascending: false,
          }),

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
            processed_by,
            created_at,
            updated_at,
            talent:talent_id (
              id,
              full_name,
              username,
              avatar_url,
              location
            )
          `)
          .order("created_at", {
            ascending: false,
          }),
      ]);

      if (earningsError) throw earningsError;
      if (withdrawalsError) throw withdrawalsError;

      setEarnings(earningsData || []);
      setWithdrawals(withdrawalsData || []);
    } catch (err) {
      console.error("Admin earnings error:", err);

      setError(
        err?.message ||
          "Unable to load earnings and withdrawals."
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
    const channel = supabase
      .channel("admin-earnings-management")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "talent_earnings",
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
        },
        () => {
          loadData(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const stats = useMemo(() => {
    const totalEarnings = earnings.reduce(
      (sum, item) => sum + Number(item.net_amount || 0),
      0
    );

    const pendingEarnings = earnings
      .filter((item) => item.status === "pending")
      .reduce(
        (sum, item) => sum + Number(item.net_amount || 0),
        0
      );

    const availableEarnings = earnings
      .filter((item) => item.status === "available")
      .reduce(
        (sum, item) => sum + Number(item.net_amount || 0),
        0
      );

    const paidEarnings = earnings
      .filter((item) => item.status === "paid")
      .reduce(
        (sum, item) => sum + Number(item.net_amount || 0),
        0
      );

    const pendingWithdrawals = withdrawals
      .filter((item) =>
        ["pending", "processing"].includes(item.status)
      )
      .reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      );

    const completedWithdrawals = withdrawals
      .filter((item) => item.status === "completed")
      .reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      );

    const platformFees = earnings.reduce(
      (sum, item) => sum + Number(item.platform_fee || 0),
      0
    );

    const uniqueTalents = new Set(
      earnings.map((item) => item.talent_id)
    ).size;

    return {
      totalEarnings,
      pendingEarnings,
      availableEarnings,
      paidEarnings,
      pendingWithdrawals,
      completedWithdrawals,
      platformFees,
      uniqueTalents,
    };
  }, [earnings, withdrawals]);

  const filteredEarnings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return earnings.filter((earning) => {
      const searchable = [
        earning.talent?.full_name,
        earning.talent?.username,
        earning.project?.title,
        earning.opportunity?.title,
        earning.description,
        earning.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchable.includes(query);

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
        withdrawal.talent?.full_name,
        withdrawal.talent?.username,
        withdrawal.bank_name,
        withdrawal.account_name,
        withdrawal.account_number,
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

  const releaseEarning = async (earningId) => {
    try {
      setProcessingId(earningId);
      setActionError("");

      const { error: rpcError } = await supabase.rpc(
        "release_talent_earning",
        {
          p_earning_id: earningId,
        }
      );

      if (rpcError) throw rpcError;

      await loadData(true);
    } catch (err) {
      console.error(err);

      setActionError(
        err?.message ||
          "Unable to release this earning."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const markEarningPaid = async (earningId) => {
    try {
      setProcessingId(earningId);
      setActionError("");

      const { error: updateError } = await supabase
        .from("talent_earnings")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", earningId)
        .eq("status", "available");

      if (updateError) throw updateError;

      await loadData(true);
    } catch (err) {
      console.error(err);

      setActionError(
        err?.message ||
          "Unable to mark earning as paid."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const processWithdrawal = async (withdrawal) => {
    try {
      setProcessingId(withdrawal.id);
      setActionError("");

      const {
        data: {
          user: currentUser,
        },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        throw new Error("You are not authenticated.");
      }

      const { error: updateError } = await supabase
        .from("withdrawal_requests")
        .update({
          status: "processing",
          processed_by: currentUser.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", withdrawal.id)
        .eq("status", "pending");

      if (updateError) throw updateError;

      await loadData(true);

      setSelectedWithdrawal(null);
    } catch (err) {
      console.error(err);

      setActionError(
        err?.message ||
          "Unable to process this withdrawal."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const completeWithdrawal = async (withdrawal) => {
    try {
      setProcessingId(withdrawal.id);
      setActionError("");

      const {
        data: {
          user: currentUser,
        },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        throw new Error("You are not authenticated.");
      }

      const { error: updateError } = await supabase
        .from("withdrawal_requests")
        .update({
          status: "completed",
          processed_at: new Date().toISOString(),
          processed_by: currentUser.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", withdrawal.id)
        .eq("status", "processing");

      if (updateError) throw updateError;

      await loadData(true);

      setSelectedWithdrawal(null);
    } catch (err) {
      console.error(err);

      setActionError(
        err?.message ||
          "Unable to complete this withdrawal."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const rejectWithdrawal = async () => {
    if (!selectedWithdrawal) return;

    if (!rejectReason.trim()) {
      setActionError(
        "Please provide a reason for rejecting the withdrawal."
      );
      return;
    }

    try {
      setProcessingId(selectedWithdrawal.id);
      setActionError("");

      const {
        data: {
          user: currentUser,
        },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        throw new Error("You are not authenticated.");
      }

      const { error: updateError } = await supabase
        .from("withdrawal_requests")
        .update({
          status: "rejected",
          admin_note: rejectReason.trim(),
          processed_at: new Date().toISOString(),
          processed_by: currentUser.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedWithdrawal.id)
        .in("status", ["pending", "processing"]);

      if (updateError) throw updateError;

      setRejectReason("");
      setRejectModal(false);
      setSelectedWithdrawal(null);

      await loadData(true);
    } catch (err) {
      console.error(err);

      setActionError(
        err?.message ||
          "Unable to reject this withdrawal."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">
            Loading financial management...
          </p>
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
              <Banknote className="h-4 w-4" />
              Financial Management
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Earnings & Withdrawals
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Manage talent earnings, release payments and
              process withdrawal requests.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-60 md:self-auto"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div className="flex-1">
              <p className="font-semibold">
                Unable to load financial data
              </p>

              <p className="mt-1 text-sm">{error}</p>
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

        {/* ACTION ERROR */}
        {actionError && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div className="flex-1">
              <p className="font-semibold">
                Action failed
              </p>

              <p className="mt-1 text-sm">
                {actionError}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActionError("")}
              className="text-gray-400 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* STATS */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total earnings"
            value={formatCurrency(stats.totalEarnings)}
            description="Gross talent earnings"
            icon={TrendingUp}
            iconClassName="bg-green-500/10 text-green-600"
          />

          <StatCard
            title="Pending earnings"
            value={formatCurrency(stats.pendingEarnings)}
            description="Awaiting release"
            icon={Clock3}
            iconClassName="bg-amber-500/10 text-amber-600"
          />

          <StatCard
            title="Pending withdrawals"
            value={formatCurrency(
              stats.pendingWithdrawals
            )}
            description="Requires processing"
            icon={ArrowDownToLine}
            iconClassName="bg-blue-500/10 text-blue-600"
          />

          <StatCard
            title="Platform fees"
            value={formatCurrency(stats.platformFees)}
            description="Fees generated"
            icon={DollarSign}
            iconClassName="bg-purple-500/10 text-purple-600"
          />
        </div>

        {/* SECONDARY STATS */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                <CheckCircle2 className="h-5 w-5 text-gray-600" />
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Available
                </p>

                <p className="font-bold text-gray-900">
                  {formatCurrency(
                    stats.availableEarnings
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                <CreditCard className="h-5 w-5 text-gray-600" />
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Paid to talents
                </p>

                <p className="font-bold text-gray-900">
                  {formatCurrency(stats.paidEarnings)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                <ArrowDownToLine className="h-5 w-5 text-gray-600" />
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Withdrawn
                </p>

                <p className="font-bold text-gray-900">
                  {formatCurrency(
                    stats.completedWithdrawals
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                <Users className="h-5 w-5 text-gray-600" />
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Earning talents
                </p>

                <p className="font-bold text-gray-900">
                  {stats.uniqueTalents}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* TOP BAR */}
          <div className="border-b border-gray-200 px-5 pt-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              {/* TABS */}
              <div className="flex gap-6">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("earnings");
                    setStatusFilter("all");
                  }}
                  className={`border-b-2 pb-4 text-sm font-semibold ${
                    activeTab === "earnings"
                      ? "border-gray-900 text-gray-900"
                      : "border-transparent text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Talent Earnings
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
                  className={`border-b-2 pb-4 text-sm font-semibold ${
                    activeTab === "withdrawals"
                      ? "border-gray-900 text-gray-900"
                      : "border-transparent text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Withdrawals

                  {withdrawals.filter(
                    (item) =>
                      item.status === "pending"
                  ).length > 0 && (
                    <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">
                      {
                        withdrawals.filter(
                          (item) =>
                            item.status === "pending"
                        ).length
                      }
                    </span>
                  )}
                </button>
              </div>

              {/* SEARCH / FILTER */}
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
                        ? "Search talent or project..."
                        : "Search talent or bank..."
                    }
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-gray-400 focus:bg-white sm:w-72"
                  />
                </div>

                <div className="relative">
                  <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value)
                    }
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-9 text-sm font-medium text-gray-700 outline-none focus:border-gray-400 sm:w-44"
                  >
                    <option value="all">
                      All statuses
                    </option>

                    {activeTab === "earnings" ? (
                      <>
                        <option value="pending">
                          Pending
                        </option>
                        <option value="available">
                          Available
                        </option>
                        <option value="paid">
                          Paid
                        </option>
                        <option value="cancelled">
                          Cancelled
                        </option>
                      </>
                    ) : (
                      <>
                        <option value="pending">
                          Pending
                        </option>
                        <option value="processing">
                          Processing
                        </option>
                        <option value="completed">
                          Completed
                        </option>
                        <option value="rejected">
                          Rejected
                        </option>
                      </>
                    )}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* EARNINGS TABLE */}
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

                  <p className="mt-2 text-sm text-gray-500">
                    Try changing your search or filters.
                  </p>

                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-4 text-sm font-semibold text-gray-900 underline"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[950px]">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50 text-left">
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Talent
                        </th>

                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Project
                        </th>

                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Amount
                        </th>

                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Fee
                        </th>

                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Net
                        </th>

                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Status
                        </th>

                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {filteredEarnings.map((earning) => {
                        const talent =
                          earning.talent?.full_name ||
                          earning.talent?.username ||
                          "Unknown talent";

                        const project =
                          earning.project?.title ||
                          earning.opportunity?.title ||
                          "Project";

                        return (
                          <tr
                            key={earning.id}
                            className="transition hover:bg-gray-50"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                {earning.talent?.avatar_url ? (
                                  <img
                                    src={
                                      earning.talent.avatar_url
                                    }
                                    alt={talent}
                                    className="h-9 w-9 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                                    {talent
                                      .slice(0, 2)
                                      .toUpperCase()}
                                  </div>
                                )}

                                <div>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {talent}
                                  </p>

                                  {earning.talent?.username && (
                                    <p className="text-xs text-gray-400">
                                      @{earning.talent.username}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <div>
                                <p className="max-w-[220px] truncate text-sm font-medium text-gray-900">
                                  {project}
                                </p>

                                <p className="mt-1 text-xs capitalize text-gray-400">
                                  {earning.project?.category ||
                                    earning.opportunity?.category ||
                                    "—"}
                                </p>
                              </div>
                            </td>

                            <td className="px-5 py-4 text-sm font-medium text-gray-700">
                              {formatCurrency(
                                earning.amount
                              )}
                            </td>

                            <td className="px-5 py-4 text-sm text-gray-500">
                              {formatCurrency(
                                earning.platform_fee
                              )}
                            </td>

                            <td className="px-5 py-4 text-sm font-bold text-gray-900">
                              {formatCurrency(
                                earning.net_amount
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <StatusBadge
                                status={earning.status}
                              />
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedEarning(
                                      earning
                                    )
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                  title="View"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>

                                {earning.status ===
                                  "pending" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      releaseEarning(
                                        earning.id
                                      )
                                    }
                                    disabled={
                                      processingId ===
                                      earning.id
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                                  >
                                    {processingId ===
                                    earning.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                    )}
                                    Release
                                  </button>
                                )}

                                {earning.status ===
                                  "available" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      markEarningPaid(
                                        earning.id
                                      )
                                    }
                                    disabled={
                                      processingId ===
                                      earning.id
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                                  >
                                    {processingId ===
                                    earning.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <ArrowUpRight className="h-3.5 w-3.5" />
                                    )}
                                    Mark paid
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* WITHDRAWAL TABLE */}
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

                  <p className="mt-2 text-sm text-gray-500">
                    There are no withdrawal requests matching
                    your filters.
                  </p>

                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-4 text-sm font-semibold text-gray-900 underline"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[950px]">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50 text-left">
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Talent
                        </th>

                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Bank
                        </th>

                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Amount
                        </th>

                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Requested
                        </th>

                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Status
                        </th>

                        <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {filteredWithdrawals.map(
                        (withdrawal) => {
                          const talent =
                            withdrawal.talent?.full_name ||
                            withdrawal.talent?.username ||
                            "Unknown talent";

                          return (
                            <tr
                              key={withdrawal.id}
                              className="transition hover:bg-gray-50"
                            >
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  {withdrawal.talent
                                    ?.avatar_url ? (
                                    <img
                                      src={
                                        withdrawal.talent
                                          .avatar_url
                                      }
                                      alt={talent}
                                      className="h-9 w-9 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                                      {talent
                                        .slice(0, 2)
                                        .toUpperCase()}
                                    </div>
                                  )}

                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">
                                      {talent}
                                    </p>

                                    {withdrawal.talent
                                      ?.username && (
                                      <p className="text-xs text-gray-400">
                                        @
                                        {
                                          withdrawal
                                            .talent
                                            .username
                                        }
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>

                              <td className="px-5 py-4">
                                <p className="text-sm font-medium text-gray-900">
                                  {withdrawal.bank_name ||
                                    "Bank transfer"}
                                </p>

                                <p className="mt-1 text-xs text-gray-500">
                                  {withdrawal.account_name ||
                                    "—"}
                                </p>

                                {withdrawal.account_number && (
                                  <p className="mt-1 text-xs text-gray-400">
                                    ••••{" "}
                                    {withdrawal.account_number.slice(
                                      -4
                                    )}
                                  </p>
                                )}
                              </td>

                              <td className="px-5 py-4 text-sm font-bold text-gray-900">
                                {formatCurrency(
                                  withdrawal.amount
                                )}
                              </td>

                              <td className="px-5 py-4 text-sm text-gray-500">
                                {formatDate(
                                  withdrawal.created_at
                                )}
                              </td>

                              <td className="px-5 py-4">
                                <StatusBadge
                                  status={
                                    withdrawal.status
                                  }
                                  type="withdrawal"
                                />
                              </td>

                              <td className="px-5 py-4">
                                <div className="flex justify-end">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedWithdrawal(
                                        withdrawal
                                      )
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                    Review
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* EARNING DETAILS MODAL */}
      {selectedEarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Earning details
                </p>

                <h2 className="mt-1 text-xl font-bold text-gray-900">
                  {selectedEarning.project?.title ||
                    selectedEarning.opportunity?.title ||
                    "Project earning"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedEarning(null)
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="flex items-center gap-4">
                {selectedEarning.talent
                  ?.avatar_url ? (
                  <img
                    src={
                      selectedEarning.talent.avatar_url
                    }
                    alt={
                      selectedEarning.talent.full_name ||
                      "Talent"
                    }
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 font-bold text-gray-600">
                    {(
                      selectedEarning.talent
                        ?.full_name ||
                      selectedEarning.talent?.username ||
                      "T"
                    )
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                )}

                <div>
                  <p className="font-bold text-gray-900">
                    {selectedEarning.talent
                      ?.full_name ||
                      selectedEarning.talent?.username ||
                      "Unknown talent"}
                  </p>

                  <p className="text-sm text-gray-500">
                    {selectedEarning.talent?.username
                      ? `@${selectedEarning.talent.username}`
                      : "Talent"}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-gray-50 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Gross amount
                  </span>

                  <span className="font-semibold text-gray-900">
                    {formatCurrency(
                      selectedEarning.amount
                    )}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Platform fee
                  </span>

                  <span className="text-sm text-red-500">
                    -
                    {formatCurrency(
                      selectedEarning.platform_fee
                    )}
                  </span>
                </div>

                <div className="my-4 border-t border-gray-200" />

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">
                    Talent receives
                  </span>

                  <span className="text-xl font-bold text-gray-900">
                    {formatCurrency(
                      selectedEarning.net_amount
                    )}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-400">
                    Status
                  </p>

                  <div className="mt-1">
                    <StatusBadge
                      status={selectedEarning.status}
                    />
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-400">
                    Created
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {formatDateTime(
                      selectedEarning.created_at
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-400">
                    Available
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {formatDate(
                      selectedEarning.available_at
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-400">
                    Paid
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {formatDate(
                      selectedEarning.paid_at
                    )}
                  </p>
                </div>
              </div>

              {selectedEarning.description && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Description
                  </p>

                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    {selectedEarning.description}
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedEarning(null)
                  }
                  className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WITHDRAWAL REVIEW MODAL */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Withdrawal request
                </p>

                <h2 className="mt-1 text-xl font-bold text-gray-900">
                  Review payout
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedWithdrawal(null)
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              {/* TALENT */}
              <div className="flex items-center gap-4">
                {selectedWithdrawal.talent
                  ?.avatar_url ? (
                  <img
                    src={
                      selectedWithdrawal.talent
                        .avatar_url
                    }
                    alt={
                      selectedWithdrawal.talent
                        .full_name || "Talent"
                    }
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 font-bold text-gray-600">
                    {(
                      selectedWithdrawal.talent
                        ?.full_name ||
                      selectedWithdrawal.talent
                        ?.username ||
                      "T"
                    )
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                )}

                <div>
                  <p className="font-bold text-gray-900">
                    {selectedWithdrawal.talent
                      ?.full_name ||
                      selectedWithdrawal.talent
                        ?.username ||
                      "Unknown talent"}
                  </p>

                  <p className="text-sm text-gray-500">
                    {selectedWithdrawal.talent?.username
                      ? `@${selectedWithdrawal.talent.username}`
                      : "Talent"}
                  </p>
                </div>
              </div>

              {/* AMOUNT */}
              <div className="rounded-2xl bg-gray-900 p-5 text-white">
                <p className="text-xs text-gray-400">
                  Requested amount
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {formatCurrency(
                    selectedWithdrawal.amount
                  )}
                </p>

                <div className="mt-3">
                  <StatusBadge
                    status={selectedWithdrawal.status}
                    type="withdrawal"
                  />
                </div>
              </div>

              {/* BANK DETAILS */}
              <div className="rounded-2xl border border-gray-200 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-gray-500" />

                  <h3 className="font-bold text-gray-900">
                    Payment details
                  </h3>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between gap-4">
                    <span className="text-sm text-gray-500">
                      Bank
                    </span>

                    <span className="text-right text-sm font-semibold text-gray-900">
                      {selectedWithdrawal.bank_name ||
                        "—"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-sm text-gray-500">
                      Account name
                    </span>

                    <span className="text-right text-sm font-semibold text-gray-900">
                      {selectedWithdrawal.account_name ||
                        "—"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-sm text-gray-500">
                      Account number
                    </span>

                    <span className="text-right text-sm font-semibold text-gray-900">
                      {selectedWithdrawal.account_number ||
                        "—"}
                    </span>
                  </div>

                  {selectedWithdrawal.bank_code && (
                    <div className="flex justify-between gap-4">
                      <span className="text-sm text-gray-500">
                        Bank code
                      </span>

                      <span className="text-right text-sm font-semibold text-gray-900">
                        {selectedWithdrawal.bank_code}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between gap-4">
                    <span className="text-sm text-gray-500">
                      Requested
                    </span>

                    <span className="text-right text-sm font-semibold text-gray-900">
                      {formatDateTime(
                        selectedWithdrawal.created_at
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {selectedWithdrawal.admin_note && (
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Admin note
                  </p>

                  <p className="mt-2 text-sm text-gray-600">
                    {selectedWithdrawal.admin_note}
                  </p>
                </div>
              )}

              {/* ACTIONS */}
              <div className="flex flex-col gap-3">
                {selectedWithdrawal.status ===
                  "pending" && (
                  <button
                    type="button"
                    onClick={() =>
                      processWithdrawal(
                        selectedWithdrawal
                      )
                    }
                    disabled={
                      processingId ===
                      selectedWithdrawal.id
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {processingId ===
                    selectedWithdrawal.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Clock3 className="h-4 w-4" />
                    )}
                    Mark as processing
                  </button>
                )}

                {selectedWithdrawal.status ===
                  "processing" && (
                  <button
                    type="button"
                    onClick={() =>
                      completeWithdrawal(
                        selectedWithdrawal
                      )
                    }
                    disabled={
                      processingId ===
                      selectedWithdrawal.id
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {processingId ===
                    selectedWithdrawal.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Mark withdrawal completed
                  </button>
                )}

                {["pending", "processing"].includes(
                  selectedWithdrawal.status
                ) && (
                  <button
                    type="button"
                    onClick={() => {
                      setRejectReason("");
                      setRejectModal(true);
                    }}
                    disabled={
                      processingId ===
                      selectedWithdrawal.id
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject withdrawal
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    setSelectedWithdrawal(null)
                  }
                  className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Reject withdrawal
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Tell the talent why this withdrawal was
                  rejected.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setRejectModal(false)
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <textarea
              value={rejectReason}
              onChange={(event) =>
                setRejectReason(event.target.value)
              }
              rows={5}
              placeholder="Enter rejection reason..."
              className="mt-5 w-full resize-none rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-gray-400"
            />

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setRejectModal(false)
                }
                className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={rejectWithdrawal}
                disabled={
                  !rejectReason.trim() ||
                  processingId ===
                    selectedWithdrawal?.id
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processingId ===
                selectedWithdrawal?.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                Reject withdrawal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

