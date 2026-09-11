import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  Search,
  ReceiptText,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  Clock3,
  XCircle,
  RefreshCw,
  MoreHorizontal,
  ChevronDown,
  Wallet,
  User,
  FolderKanban,
  Eye,
  RotateCcw,
  AlertCircle,
  CreditCard,
  TrendingUp,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const [openMenu, setOpenMenu] = useState(null);

  /*
   * ==========================================
   * FETCH TRANSACTIONS
   * ==========================================
   */

  const fetchTransactions = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const { data, error: fetchError } = await supabase
        .from("transactions")
        .select(
          `
            id,
            client_id,
            talent_id,
            project_id,
            opportunity_id,
            type,
            status,
            amount,
            currency,
            payment_method,
            payment_reference,
            provider,
            description,
            metadata,
            created_at,
            updated_at,

            client:client_id (
              id,
              full_name,
              username,
              email,
              avatar_url
            ),

            talent:talent_id (
              id,
              full_name,
              username,
              email,
              avatar_url
            ),

            project:project_id (
              id,
              title
            )
          `
        )
        .order("created_at", {
          ascending: false,
        });

      if (fetchError) {
        throw fetchError;
      }

      setTransactions(data || []);
    } catch (err) {
      console.error(
        "Failed to load transactions:",
        err
      );

      setError(
        err.message ||
          "Unable to load transactions."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  /*
   * ==========================================
   * FILTER TRANSACTIONS
   * ==========================================
   */

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const matchesSearch =
        !query ||
        transaction.payment_reference
          ?.toLowerCase()
          .includes(query) ||
        transaction.type
          ?.toLowerCase()
          .includes(query) ||
        transaction.status
          ?.toLowerCase()
          .includes(query) ||
        transaction.description
          ?.toLowerCase()
          .includes(query) ||
        transaction.client?.full_name
          ?.toLowerCase()
          .includes(query) ||
        transaction.client?.username
          ?.toLowerCase()
          .includes(query) ||
        transaction.talent?.full_name
          ?.toLowerCase()
          .includes(query) ||
        transaction.talent?.username
          ?.toLowerCase()
          .includes(query) ||
        transaction.project?.title
          ?.toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        transaction.status === statusFilter;

      const matchesType =
        typeFilter === "all" ||
        transaction.type === typeFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType
      );
    });
  }, [
    transactions,
    search,
    statusFilter,
    typeFilter,
  ]);

  /*
   * ==========================================
   * STATS
   * ==========================================
   */

  const stats = useMemo(() => {
    const successful = transactions.filter(
      (transaction) =>
        transaction.status === "successful"
    );

    const pending = transactions.filter(
      (transaction) =>
        transaction.status === "pending" ||
        transaction.status === "processing"
    );

    const failed = transactions.filter(
      (transaction) =>
        transaction.status === "failed" ||
        transaction.status === "cancelled"
    );

    const totalRevenue = transactions
      .filter(
        (transaction) =>
          transaction.status ===
            "successful" &&
          (
            transaction.type ===
              "payment" ||
            transaction.type ===
              "platform_fee"
          )
      )
      .reduce(
        (total, transaction) =>
          total + Number(transaction.amount || 0),
        0
      );

    const totalPayouts = transactions
      .filter(
        (transaction) =>
          transaction.status ===
            "successful" &&
          (
            transaction.type ===
              "payout" ||
            transaction.type ===
              "withdrawal"
          )
      )
      .reduce(
        (total, transaction) =>
          total + Number(transaction.amount || 0),
        0
      );

    return {
      total: transactions.length,
      successful: successful.length,
      pending: pending.length,
      failed: failed.length,
      totalRevenue,
      totalPayouts,
    };
  }, [transactions]);

  /*
   * ==========================================
   * HELPERS
   * ==========================================
   */

  const formatCurrency = (
    amount,
    currency = "NGN"
  ) => {
    if (
      amount === null ||
      amount === undefined
    ) {
      return "—";
    }

    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString(
      "en-NG",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  const formatTime = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleTimeString(
      "en-NG",
      {
        hour: "numeric",
        minute: "2-digit",
      }
    );
  };

  const getInitials = (
    name,
    username
  ) => {
    const value =
      name ||
      username ||
      "US";

    const parts = value
      .trim()
      .split(" ")
      .filter(Boolean);

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return value
      .substring(0, 2)
      .toUpperCase();
  };

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
              Transactions
            </span>

          </div>

          <h1 className="font-['Space_Grotesk'] text-3xl font-bold tracking-tight text-slate-950">
            Transactions
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Monitor payments, payouts, platform fees,
            refunds and withdrawals across TCSN Network.
          </p>

        </div>


        <button
          type="button"
          onClick={() =>
            fetchTransactions(true)
          }
          disabled={refreshing}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
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

      </div>


      {/* ========================================== */}
      {/* FINANCIAL STATS */}
      {/* ========================================== */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <TransactionStat
          icon={ReceiptText}
          label="Total Transactions"
          value={stats.total}
          type="number"
        />

        <TransactionStat
          icon={CheckCircle2}
          label="Successful"
          value={stats.successful}
          type="number"
        />

        <TransactionStat
          icon={Clock3}
          label="Pending"
          value={stats.pending}
          type="number"
        />

        <TransactionStat
          icon={XCircle}
          label="Failed / Cancelled"
          value={stats.failed}
          type="number"
        />

      </div>


      {/* ========================================== */}
      {/* REVENUE OVERVIEW */}
      {/* ========================================== */}

      <div className="grid gap-4 md:grid-cols-2">

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-xs font-semibold text-slate-400">
                Successful Revenue
              </p>

              <h2 className="mt-2 font-['Space_Grotesk'] text-2xl font-bold text-slate-950">
                {formatCurrency(
                  stats.totalRevenue
                )}
              </h2>

            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">

              <TrendingUp size={19} />

            </div>

          </div>

          <p className="mt-3 text-xs text-slate-400">
            Successful client payments and platform fees
          </p>

        </div>


        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-xs font-semibold text-slate-400">
                Successful Payouts
              </p>

              <h2 className="mt-2 font-['Space_Grotesk'] text-2xl font-bold text-slate-950">
                {formatCurrency(
                  stats.totalPayouts
                )}
              </h2>

            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

              <ArrowUpFromLine size={19} />

            </div>

          </div>

          <p className="mt-3 text-xs text-slate-400">
            Money successfully paid out to talent
          </p>

        </div>

      </div>


      {/* ========================================== */}
      {/* TRANSACTIONS CARD */}
      {/* ========================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* ======================================== */}
        {/* TOOLBAR */}
        {/* ======================================== */}

        <div className="border-b border-slate-100 p-4 sm:p-5">

          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

            {/* Search */}

            <div className="relative w-full xl:max-w-md">

              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search transactions..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-navy-500 focus:bg-white focus:ring-4 focus:ring-navy-500/10"
              />

            </div>


            {/* Filters */}

            <div className="flex flex-col gap-3 sm:flex-row">

              <FilterSelect
                value={typeFilter}
                onChange={setTypeFilter}
                options={[
                  ["all", "All types"],
                  ["payment", "Payment"],
                  ["payout", "Payout"],
                  ["platform_fee", "Platform Fee"],
                  ["refund", "Refund"],
                  ["withdrawal", "Withdrawal"],
                ]}
              />

              <FilterSelect
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  ["all", "All status"],
                  ["pending", "Pending"],
                  ["processing", "Processing"],
                  ["successful", "Successful"],
                  ["failed", "Failed"],
                  ["cancelled", "Cancelled"],
                  ["refunded", "Refunded"],
                ]}
              />

            </div>

          </div>

        </div>


        {/* ======================================== */}
        {/* ERROR */}
        {/* ======================================== */}

        {error && (

          <div className="m-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <div>

              <p className="font-semibold">
                Couldn't load transactions
              </p>

              <p className="mt-1 text-xs leading-5">
                {error}
              </p>

              <button
                onClick={() =>
                  fetchTransactions()
                }
                className="mt-3 text-xs font-bold underline"
              >
                Try again
              </button>

            </div>

          </div>

        )}


        {/* ======================================== */}
        {/* LOADING */}
        {/* ======================================== */}

        {loading && !error && (

          <div className="divide-y divide-slate-100">

            {[1, 2, 3, 4, 5].map(
              (item) => (

                <div
                  key={item}
                  className="flex gap-4 p-5"
                >

                  <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-100" />

                  <div className="flex-1">

                    <div className="h-4 w-56 animate-pulse rounded bg-slate-100" />

                    <div className="mt-2 h-3 w-36 animate-pulse rounded bg-slate-100" />

                  </div>

                  <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />

                </div>

              )
            )}

          </div>

        )}


        {/* ======================================== */}
        {/* EMPTY */}
        {/* ======================================== */}

        {!loading &&
          !error &&
          filteredTransactions.length ===
            0 && (

            <div className="px-6 py-20 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-50 text-navy-500">

                <ReceiptText
                  size={25}
                />

              </div>

              <h3 className="mt-5 text-base font-bold text-slate-900">
                No transactions found
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">
                There are no transactions matching
                your current search and filters.
              </p>

            </div>

          )}


        {/* ======================================== */}
        {/* TABLE */}
        {/* ======================================== */}

        {!loading &&
          !error &&
          filteredTransactions.length >
            0 && (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1250px]">

                <thead>

                  <tr className="border-b border-slate-100 bg-slate-50/70">

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Transaction
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Client
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Talent
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Project
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Amount
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Date
                    </th>

                    <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Status
                    </th>

                    <th className="px-5 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody className="divide-y divide-slate-100">

                  {filteredTransactions.map(
                    (transaction) => (

                      <tr
                        key={transaction.id}
                        className="transition hover:bg-slate-50/70"
                      >

                        {/* ================================= */}
                        {/* TRANSACTION */}
                        {/* ================================= */}

                        <td className="px-5 py-5">

                          <div className="flex items-start gap-3">

                            <TransactionIcon
                              type={
                                transaction.type
                              }
                            />

                            <div className="min-w-0">

                              <p className="text-sm font-bold text-slate-900">
                                {
                                  getTransactionLabel(
                                    transaction.type
                                  )
                                }
                              </p>

                              <p className="mt-1 max-w-[220px] truncate font-mono text-[10px] text-slate-400">
                                {
                                  transaction.payment_reference ||
                                  transaction.id
                                }
                              </p>

                            </div>

                          </div>

                        </td>


                        {/* ================================= */}
                        {/* CLIENT */}
                        {/* ================================= */}

                        <td className="px-5 py-5">

                          <PersonCell
                            person={
                              transaction.client
                            }
                            fallback="Client"
                            getInitials={
                              getInitials
                            }
                          />

                        </td>


                        {/* ================================= */}
                        {/* TALENT */}
                        {/* ================================= */}

                        <td className="px-5 py-5">

                          <PersonCell
                            person={
                              transaction.talent
                            }
                            fallback="Talent"
                            getInitials={
                              getInitials
                            }
                          />

                        </td>


                        {/* ================================= */}
                        {/* PROJECT */}
                        {/* ================================= */}

                        <td className="px-5 py-5">

                          {transaction.project ? (

                            <div className="flex items-center gap-2">

                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">

                                <FolderKanban
                                  size={14}
                                />

                              </div>

                              <span className="max-w-[160px] truncate text-xs font-semibold text-slate-600">
                                {
                                  transaction
                                    .project
                                    .title
                                }
                              </span>

                            </div>

                          ) : (

                            <span className="text-xs text-slate-400">
                              No project
                            </span>

                          )}

                        </td>


                        {/* ================================= */}
                        {/* AMOUNT */}
                        {/* ================================= */}

                        <td className="px-5 py-5">

                          <div>

                            <p
                              className={`text-sm font-bold ${
                                transaction.type ===
                                  "payout" ||
                                transaction.type ===
                                  "withdrawal" ||
                                transaction.type ===
                                  "refund"
                                  ? "text-red-500"
                                  : "text-slate-900"
                              }`}
                            >

                              {transaction.type ===
                                "payout" ||
                              transaction.type ===
                                "withdrawal" ||
                              transaction.type ===
                                "refund"
                                ? "-"
                                : "+"}

                              {formatCurrency(
                                transaction.amount,
                                transaction.currency
                              )}

                            </p>

                            {transaction.payment_method && (

                              <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">

                                <CreditCard
                                  size={11}
                                />

                                {
                                  transaction
                                    .payment_method
                                }

                              </div>

                            )}

                          </div>

                        </td>


                        {/* ================================= */}
                        {/* DATE */}
                        {/* ================================= */}

                        <td className="px-5 py-5">

                          <div>

                            <p className="text-xs font-semibold text-slate-600">
                              {formatDate(
                                transaction.created_at
                              )}
                            </p>

                            <p className="mt-0.5 text-[10px] text-slate-400">
                              {formatTime(
                                transaction.created_at
                              )}
                            </p>

                          </div>

                        </td>


                        {/* ================================= */}
                        {/* STATUS */}
                        {/* ================================= */}

                        <td className="px-5 py-5">

                          <TransactionStatus
                            status={
                              transaction.status
                            }
                          />

                        </td>


                        {/* ================================= */}
                        {/* ACTIONS */}
                        {/* ================================= */}

                        <td className="relative px-5 py-5 text-right">

                          <button
                            onClick={() =>
                              setOpenMenu(
                                openMenu ===
                                  transaction.id
                                  ? null
                                  : transaction.id
                              )
                            }
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          >

                            <MoreHorizontal
                              size={18}
                            />

                          </button>


                          {openMenu ===
                            transaction.id && (

                            <div className="absolute right-5 top-14 z-30 w-52 rounded-xl border border-slate-200 bg-white p-1.5 text-left shadow-xl">

                              <button
                                onClick={() =>
                                  setOpenMenu(
                                    null
                                  )
                                }
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                              >

                                <Eye size={14} />

                                View transaction

                              </button>


                              {transaction.status ===
                                "pending" && (

                                <button
                                  onClick={() =>
                                    setOpenMenu(
                                      null
                                    )
                                  }
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-green-600 transition hover:bg-green-50"
                                >

                                  <CheckCircle2
                                    size={14}
                                  />

                                  Process transaction

                                </button>

                              )}


                              {transaction.status ===
                                "successful" && (
                                <button
                                  onClick={() =>
                                    setOpenMenu(
                                      null
                                    )
                                  }
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-amber-600 transition hover:bg-amber-50"
                                >

                                  <RotateCcw
                                    size={14}
                                  />

                                  Refund

                                </button>
                              )}

                            </div>

                          )}

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}


        {/* ======================================== */}
        {/* FOOTER */}
        {/* ======================================== */}

        {!loading &&
          !error &&
          filteredTransactions.length >
            0 && (

            <div className="border-t border-slate-100 px-5 py-4">

              <p className="text-xs text-slate-400">

                Showing{" "}

                <span className="font-bold text-slate-600">
                  {
                    filteredTransactions.length
                  }
                </span>{" "}

                of{" "}

                <span className="font-bold text-slate-600">
                  {transactions.length}
                </span>{" "}

                transactions

              </p>

            </div>

          )}

      </div>

    </div>
  );
}


/* ========================================== */
/* STAT CARD */
/* ========================================== */

function TransactionStat({
  icon: Icon,
  label,
  value,
  type,
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

      <p className="mt-1 font-['Space_Grotesk'] text-2xl font-bold text-slate-950">
        {type === "number"
          ? value.toLocaleString()
          : value}
      </p>

    </div>
  );
}


/* ========================================== */
/* TRANSACTION ICON */
/* ========================================== */

function TransactionIcon({
  type,
}) {
  const config = {
    payment: {
      icon: ArrowDownToLine,
      classes:
        "bg-green-50 text-green-600",
    },

    payout: {
      icon: ArrowUpFromLine,
      classes:
        "bg-blue-50 text-blue-600",
    },

    platform_fee: {
      icon: Wallet,
      classes:
        "bg-navy-50 text-navy-600",
    },

    refund: {
      icon: RotateCcw,
      classes:
        "bg-amber-50 text-amber-600",
    },

    withdrawal: {
      icon: ArrowUpFromLine,
      classes:
        "bg-orange-50 text-orange-600",
    },
  };

  const current =
    config[type] || {
      icon: ReceiptText,
      classes:
        "bg-slate-100 text-slate-500",
    };

  const Icon = current.icon;

  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${current.classes}`}
    >
      <Icon size={17} />
    </div>
  );
}


/* ========================================== */
/* PERSON CELL */
/* ========================================== */

function PersonCell({
  person,
  fallback,
  getInitials,
}) {
  if (!person) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400">

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
          <User size={13} />
        </div>

        <span>
          No {fallback.toLowerCase()}
        </span>

      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">

      {person.avatar_url ? (

        <img
          src={person.avatar_url}
          alt={
            person.full_name ||
            fallback
          }
          className="h-8 w-8 rounded-full object-cover"
        />

      ) : (

        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[9px] font-bold text-slate-600">

          {getInitials(
            person.full_name,
            person.username
          )}

        </div>

      )}

      <div className="min-w-0">

        <p className="max-w-[130px] truncate text-xs font-bold text-slate-700">
          {person.full_name ||
            person.username ||
            fallback}
        </p>

        <p className="mt-0.5 text-[10px] text-slate-400">
          {fallback}
        </p>

      </div>

    </div>
  );
}


/* ========================================== */
/* FILTER SELECT */
/* ========================================== */

function FilterSelect({
  value,
  onChange,
  options,
}) {
  return (
    <div className="relative">

      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-10 text-sm font-semibold text-slate-700 outline-none transition focus:border-navy-500 focus:ring-4 focus:ring-navy-500/10 sm:w-48"
      >

        {options.map(
          ([optionValue, label]) => (

            <option
              key={optionValue}
              value={optionValue}
            >
              {label}
            </option>

          )
        )}

      </select>

      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />

    </div>
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


/* ========================================== */
/* TRANSACTION LABEL */
/* ========================================== */

function getTransactionLabel(type) {
  const labels = {
    payment: "Client Payment",
    payout: "Talent Payout",
    platform_fee: "Platform Fee",
    refund: "Refund",
    withdrawal: "Talent Withdrawal",
  };

  return labels[type] || "Transaction";
}

