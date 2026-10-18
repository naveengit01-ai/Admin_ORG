import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import {
  getRiderRequests,
  reviewRiderRequest,
  createRiderFromRequest,
} from "../../api.js";

const STATUS_STYLES = {
  pending:
    "border-amber-400/20 bg-amber-400/10 text-amber-300",

  under_review:
    "border-blue-400/20 bg-blue-400/10 text-blue-300",

  approved:
    "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",

  rejected:
    "border-red-400/20 bg-red-400/10 text-red-300",

  account_created:
    "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
};

const formatStatus = (status = "pending") =>
  status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function CreateRider() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [processingId, setProcessingId] = useState(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getRiderRequests();

      if (!result.ok) {
        throw new Error(
          result.message || "Unable to retrieve rider requests."
        );
      }

      setRequests(result.requests);
    } catch (err) {
      console.error("Rider requests error:", err);

      setError(
        err.message || "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleReview = async (request, status) => {
    let rejectionReason = "";

    if (status === "rejected") {
      rejectionReason = window.prompt(
        "Enter the reason for rejecting this application:"
      );

      if (rejectionReason === null) {
        return;
      }

      if (!rejectionReason.trim()) {
        setError("A rejection reason is required.");
        return;
      }
    }

    const confirmed = window.confirm(
      status === "approved"
        ? `Approve the rider application for ${request.first_name} ${request.last_name}?`
        : `Reject the rider application for ${request.first_name} ${request.last_name}?`
    );

    if (!confirmed) {
      return;
    }

    setProcessingId(request._id);
    setError("");
    setNotice("");

    try {
      const result = await reviewRiderRequest(
        request._id,
        status,
        rejectionReason
      );

      if (!result.ok) {
        throw new Error(
          result.message || "Unable to update the application."
        );
      }

      setNotice(result.message);
      await loadRequests();
    } catch (err) {
      setError(err.message || "Unable to update the application.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCreateRider = async (request) => {
    const confirmed = window.confirm(
      `Create a rider account for ${request.first_name} ${request.last_name} (${request.email})?`
    );

    if (!confirmed) {
      return;
    }

    setProcessingId(request._id);
    setError("");
    setNotice("");

    try {
      const result = await createRiderFromRequest(request._id);

      if (!result.ok) {
        throw new Error(
          result.message || "Unable to create the rider account."
        );
      }

      setNotice(result.message);
      await loadRequests();
    } catch (err) {
      setError(err.message || "Unable to create the rider account.");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = requests.filter((request) => {
    const fullName =
      `${request.first_name || ""} ${request.last_name || ""}`
        .trim()
        .toLowerCase();

    const searchValue = search.toLowerCase();

    const matchesSearch =
      fullName.includes(searchValue) ||
      (request.email || "").toLowerCase().includes(searchValue) ||
      (request.phone || "").includes(searchValue);

    const matchesStatus =
      selectedStatus === "all" ||
      request.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const counts = {
    total: requests.length,

    pending: requests.filter(
      (request) => request.status === "pending"
    ).length,

    underReview: requests.filter(
      (request) => request.status === "under_review"
    ).length,

    approved: requests.filter(
      (request) => request.status === "approved"
    ).length,

    rejected: requests.filter(
      (request) => request.status === "rejected"
    ).length,

    accountCreated: requests.filter(
      (request) => request.status === "account_created"
    ).length,
  };

  const summaryCards = [
    {
      title: "Total Requests",
      value: counts.total,
      icon: "📋",
    },
    {
      title: "Pending",
      value: counts.pending,
      icon: "⏳",
    },
    {
      title: "Approved",
      value: counts.approved,
      icon: "✅",
    },
    {
      title: "Accounts Created",
      value: counts.accountCreated,
      icon: "🚴",
    },
  ];

  return (
    <div className="min-h-screen bg-[#080d19] px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">

        {/* BACK BUTTON */}
        <div className="mb-5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2.5 text-sm font-semibold text-slate-200 shadow-lg shadow-black/10 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
            aria-label="Go back to the previous page"
          >
            <span className="text-lg transition-transform group-hover:-translate-x-1" aria-hidden="true">←</span>
            Back
          </button>
        </div>

        {/* HEADER */}
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-400">
              DWJD Responsibilities
            </p>

            <h1 className="mt-3 text-3xl font-black sm:text-4xl">
              Rider Management
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Review applications and create approved rider accounts.
            </p>
          </div>

          <button
            type="button"
            onClick={loadRequests}
            disabled={loading || Boolean(processingId)}
            className="rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50"
          >
            {loading ? "Loading..." : "↻ Refresh Requests"}
          </button>
        </header>

        {/* NOTICES */}
        {notice && (
          <div
            role="status"
            className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-300"
          >
            {notice}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300"
          >
            {error}

            <button
              type="button"
              onClick={loadRequests}
              className="ml-3 font-bold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* SUMMARY CARDS */}
        <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.07 }}
              className="rounded-2xl border border-white/[0.08] bg-slate-900/70 p-5"
            >
              <span className="text-3xl">{card.icon}</span>

              <p className="mt-5 text-sm text-slate-400">
                {card.title}
              </p>

              <p className="mt-2 text-3xl font-black text-cyan-400">
                {loading ? "..." : card.value}
              </p>
            </motion.div>
          ))}
        </section>

        {/* SEARCH AND FILTER */}
        <section className="mt-8 rounded-2xl border border-white/[0.08] bg-slate-900/60 p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_240px]">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email or phone..."
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none placeholder:text-slate-500 focus:border-cyan-400/50"
            />

            <select
              value={selectedStatus}
              onChange={(event) =>
                setSelectedStatus(event.target.value)
              }
              className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-cyan-400/50"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="account_created">Account Created</option>
            </select>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            Showing {filteredRequests.length} of {requests.length} requests
          </p>
        </section>

        {/* REQUEST TABLE */}
        <section className="mt-7 overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-900/60">
          <div className="border-b border-white/[0.08] p-5">
            <h2 className="text-lg font-bold">
              Rider Applications
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Review applications before creating rider accounts.
            </p>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400">
              Loading rider applications...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-4xl">📭</p>

              <h3 className="mt-4 font-bold">
                No rider requests found
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                Applications will appear here when submitted.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-5 py-4">Applicant</th>
                    <th className="px-5 py-4">Contact</th>
                    <th className="px-5 py-4">Submitted</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Review</th>
                    <th className="px-5 py-4">Account</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.06]">
                  {filteredRequests.map((request) => {
                    const processing =
                      processingId === request._id;

                    return (
                      <tr
                        key={request._id}
                        className="transition hover:bg-white/[0.025]"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold">
                            {request.first_name} {request.last_name}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            ID: {request._id}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p>{request.email}</p>

                          <p className="mt-1 text-xs text-slate-400">
                            {request.phone}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-slate-300">
                          {formatDate(request.createdAt)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                              STATUS_STYLES[request.status] ||
                              "border-white/10 bg-white/5 text-slate-300"
                            }`}
                          >
                            {formatStatus(request.status)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          {["pending", "under_review"].includes(
                            request.status
                          ) ? (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={
                                  processing ||
                                  Boolean(processingId)
                                }
                                onClick={() =>
                                  handleReview(request, "approved")
                                }
                                className="rounded-lg bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-400/20 disabled:opacity-40"
                              >
                                {processing ? "Working..." : "Approve"}
                              </button>

                              <button
                                type="button"
                                disabled={
                                  processing ||
                                  Boolean(processingId)
                                }
                                onClick={() =>
                                  handleReview(request, "rejected")
                                }
                                className="rounded-lg bg-red-400/10 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-400/20 disabled:opacity-40"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">
                              {request.status === "account_created"
                                ? "Completed"
                                : "Reviewed"}
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          {request.status === "approved" ? (
                            <button
                              type="button"
                              disabled={
                                processing ||
                                Boolean(processingId)
                              }
                              onClick={() =>
                                handleCreateRider(request)
                              }
                              className="rounded-lg bg-cyan-400 px-3 py-2 text-xs font-bold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-40"
                            >
                              {processing
                                ? "Creating..."
                                : "Create Rider"}
                            </button>
                          ) : request.status === "account_created" ? (
                            <span className="text-xs font-semibold text-cyan-300">
                              Rider Created
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">
                              Not available
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="mt-10 border-t border-white/[0.08] pt-6 text-center text-xs text-slate-500">
          DWJD Administration Portal · Rider Management
        </footer>
      </div>
    </div>
  );
}