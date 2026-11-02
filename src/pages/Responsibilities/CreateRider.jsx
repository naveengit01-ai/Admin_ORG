
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

import {
  getRiderRequests,
  reviewRiderRequest,
  createRiderFromRequest,
} from "../../api.js";

// ------------------------------------------------------
// STATUS CONFIGURATION
// ------------------------------------------------------

const STATUS_STYLES = {
  pending: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  under_review: "border-blue-400/20 bg-blue-400/10 text-blue-300",
  approved: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  rejected: "border-red-400/20 bg-red-400/10 text-red-300",
  account_created: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
};

const formatStatus = (status = "pending") =>
  status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ------------------------------------------------------
// PROFILE IMAGE URL HANDLER
// ------------------------------------------------------

const getProfileImageUrl = (value) => {
  if (typeof value !== "string" || !value.trim()) return "";

  const raw = value.trim();

  if (raw.startsWith("data:image/")) return raw;

  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();

    if (
      host === "drive.google.com" ||
      host.endsWith(".drive.google.com")
    ) {
      const fileId =
        url.searchParams.get("id") ||
        url.pathname.match(/\/file\/d\/([^/]+)/)?.[1];

      if (fileId) {
        return `https://drive.google.com/thumbnail?id=${encodeURIComponent(
          fileId
        )}&sz=w1000`;
      }
    }

    return raw;
  } catch {
    return "";
  }
};

// ------------------------------------------------------
// MAIN COMPONENT
// ------------------------------------------------------

export default function CreateRider() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [processingId, setProcessingId] = useState(null);

  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedPhotoFailed, setSelectedPhotoFailed] = useState(false);

  // ----------------------------------------------------
  // LOAD RIDER APPLICATIONS
  // ----------------------------------------------------

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getRiderRequests();

      if (!result?.ok) {
        throw new Error(
          result?.message || "Unable to retrieve rider applications."
        );
      }

      const requestList = Array.isArray(result.requests)
        ? result.requests
        : Array.isArray(result.data?.requests)
          ? result.data.requests
          : [];

      setRequests(requestList);
    } catch (err) {
      console.error("Rider requests error:", err);
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // ----------------------------------------------------
  // APPROVE / REJECT APPLICATION
  // ----------------------------------------------------

  const handleReview = async (request, status) => {
    let rejectionReason = "";

    if (status === "rejected") {
      rejectionReason = window.prompt(
        "Enter the reason for rejecting this application:"
      );

      if (rejectionReason === null) return;

      if (!rejectionReason.trim()) {
        setError("A rejection reason is required.");
        return;
      }
    }

    const applicantName =
      `${request.first_name || ""} ${request.last_name || ""}`.trim();

    const confirmed = window.confirm(
      status === "approved"
        ? `Approve the rider application for ${applicantName}?`
        : `Reject the rider application for ${applicantName}?`
    );

    if (!confirmed) return;

    setProcessingId(request._id);
    setError("");
    setNotice("");

    try {
      const result = await reviewRiderRequest(
        request._id,
        status,
        rejectionReason
      );

      if (!result?.ok) {
        throw new Error(
          result?.message || "Unable to update the application."
        );
      }

      setNotice(
        result.message || `Application ${status} successfully.`
      );

      await loadRequests();
    } catch (err) {
      console.error("Rider review error:", err);
      setError(err.message || "Unable to update the application.");
    } finally {
      setProcessingId(null);
    }
  };

  // ----------------------------------------------------
  // CREATE RIDER ACCOUNT
  // ----------------------------------------------------

  const handleCreateRider = async (request) => {
    const applicantName =
      `${request.first_name || ""} ${request.last_name || ""}`.trim();

    const confirmed = window.confirm(
      `Create a DWJD Rider account for ${applicantName}?\n\n` +
      `Email: ${request.email}\n\n` +
      "The backend will check the applicant's email:\n\n" +
      "• If a matching verified DWJD User account exists, " +
      "the SAME account will be converted into a Rider.\n\n" +
      "• The existing User ID, username, password, Google login, " +
      "and profile information will be preserved.\n\n" +
      "• If no existing account exists, a new Rider account " +
      "will be created and account instructions will be emailed.\n\n" +
      "• The rider application will remain linked to the account.\n\n" +
      "Do you want to continue?"
    );

    if (!confirmed) return;

    setProcessingId(request._id);
    setError("");
    setNotice("");

    try {
      // Both existing-account conversion and new-account
      // creation are handled by the same backend API.
      const result = await createRiderFromRequest(request._id);

      if (!result?.ok) {
        throw new Error(
          result?.message || "Unable to create the Rider account."
        );
      }

      // Interpret the backend response.
      const responseStatus = result.status;

      let successMessage = result.message;

      if (!successMessage) {
        switch (responseStatus) {
          case "existing_user_converted":
            successMessage =
              `${applicantName}'s existing DWJD account was converted into a Rider.`;
            break;

          case "existing_user_converted_email_failed":
            successMessage =
              "The existing account was converted, but the notification email failed.";
            break;

          case "rider_created":
            successMessage =
              `A new Rider account was created for ${applicantName}.`;
            break;

          case "rider_created_email_failed":
            successMessage =
              "The Rider account was created, but the credentials email failed.";
            break;

          default:
            successMessage =
              "The Rider account operation completed successfully.";
        }
      }

      setNotice(successMessage);

      await loadRequests();
    } catch (err) {
      console.error("Rider account creation error:", err);
      setError(
        err.message || "Unable to create the Rider account."
      );
    } finally {
      setProcessingId(null);
    }
  };

  // ----------------------------------------------------
  // SEARCH AND FILTER
  // ----------------------------------------------------

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const fullName =
        `${request.first_name || ""} ${request.last_name || ""}`
          .trim()
          .toLowerCase();

      const searchValue = search.trim().toLowerCase();

      const matchesSearch =
        fullName.includes(searchValue) ||
        (request.email || "").toLowerCase().includes(searchValue) ||
        (request.phone || "").toLowerCase().includes(searchValue);

      const matchesStatus =
        selectedStatus === "all" ||
        request.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [requests, search, selectedStatus]);

  // ----------------------------------------------------
  // SUMMARY COUNTS
  // ----------------------------------------------------

  const counts = useMemo(() => {
    return {
      total: requests.length,

      pending: requests.filter(
        (r) => r.status === "pending"
      ).length,

      underReview: requests.filter(
        (r) => r.status === "under_review"
      ).length,

      approved: requests.filter(
        (r) => r.status === "approved"
      ).length,

      rejected: requests.filter(
        (r) => r.status === "rejected"
      ).length,

      converted: requests.filter(
        (r) => r.status === "account_created"
      ).length,
    };
  }, [requests]);

  const summaryCards = [
    {
      title: "Total Applications",
      value: counts.total,
      icon: "📋",
      description: "All rider applications",
    },
    {
      title: "Pending Review",
      value: counts.pending,
      icon: "⏳",
      description: "Waiting for review",
    },
    {
      title: "Approved",
      value: counts.approved,
      icon: "✅",
      description: "Ready for account creation",
    },
    {
      title: "Rider Accounts Created",
      value: counts.converted,
      icon: "🚴",
      description: "Existing or new accounts",
    },
  ];

  // ----------------------------------------------------
  // RENDER
  // ----------------------------------------------------

  return (
    <div className="min-h-screen bg-[#080d19] px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">

        {/* BACK BUTTON */}

        <div className="mb-5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2.5 text-sm font-semibold text-slate-200 shadow-lg transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
          >
            <span className="text-lg transition-transform group-hover:-translate-x-1">
              ←
            </span>
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

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Review rider applications and create Rider accounts.
              Existing DWJD accounts are converted without creating duplicates.
            </p>
          </div>

          <button
            type="button"
            onClick={loadRequests}
            disabled={loading || Boolean(processingId)}
            className="rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Loading..." : "↻ Refresh Applications"}
          </button>
        </header>

        {/* PROCESS FLOW */}

        <section className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              number: "01",
              title: "Review Application",
              description: "Check applicant details and profile.",
              icon: "🔍",
            },
            {
              number: "02",
              title: "Approve Applicant",
              description: "Approve or reject the application.",
              icon: "📝",
            },
            {
              number: "03",
              title: "Create Rider Account",
              description: "Convert an existing account or create a new one.",
              icon: "🚴",
            },
          ].map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="rounded-2xl border border-white/[0.08] bg-slate-900/60 p-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{step.icon}</span>

                <div>
                  <p className="text-[10px] font-bold tracking-widest text-cyan-400">
                    STEP {step.number}
                  </p>

                  <h3 className="mt-1 font-bold">{step.title}</h3>
                </div>
              </div>

              <p className="mt-3 text-xs leading-5 text-slate-400">
                {step.description}
              </p>
            </motion.div>
          ))}
        </section>

        {/* SUCCESS NOTICE */}

        <AnimatePresence>
          {notice && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              role="status"
              className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-300"
            >
              <span className="text-lg">✓</span>
              <p>{notice}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ERROR NOTICE */}

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              role="alert"
              className="mt-6 flex items-start justify-between gap-4 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300"
            >
              <p>{error}</p>

              <button
                type="button"
                onClick={loadRequests}
                className="shrink-0 font-bold underline"
              >
                Retry
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SUMMARY CARDS */}

        <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.07 }}
              className="group rounded-2xl border border-white/[0.08] bg-slate-900/70 p-5 transition duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:shadow-xl hover:shadow-cyan-950/20"
            >
              <div className="flex items-start justify-between">
                <span className="text-3xl">{card.icon}</span>

                <span className="rounded-lg bg-white/[0.04] px-2 py-1 text-xs text-slate-500">
                  DWJD
                </span>
              </div>

              <p className="mt-5 text-sm text-slate-400">
                {card.title}
              </p>

              <p className="mt-2 text-3xl font-black text-cyan-400">
                {loading ? "..." : card.value}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                {card.description}
              </p>
            </motion.div>
          ))}
        </section>

        {/* SEARCH AND FILTER */}

        <section className="mt-8 rounded-2xl border border-white/[0.08] bg-slate-900/60 p-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="font-bold">Find Applications</h2>

              <p className="mt-1 text-xs text-slate-500">
                Search by applicant name, email or phone number.
              </p>
            </div>

            <p className="text-sm text-cyan-400">
              {filteredRequests.length} / {requests.length} applications
            </p>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-[1fr_240px]">
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                🔎
              </span>

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, email or phone..."
                className="w-full rounded-xl border border-white/10 bg-slate-950 py-3 pl-11 pr-4 text-sm outline-none placeholder:text-slate-500 transition focus:border-cyan-400/50"
              />
            </div>

            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
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
        </section>

        {/* APPLICATION TABLE */}

        <section className="mt-7 overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-900/60">
          <div className="flex flex-col justify-between gap-2 border-b border-white/[0.08] p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold">Rider Applications</h2>

              <p className="mt-1 text-sm text-slate-400">
                Approve applicants and create their Rider accounts.
              </p>
            </div>

            <span className="w-fit rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
              Existing Account Conversion + New Account Creation
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />

              <p className="mt-4 text-sm text-slate-400">
                Loading rider applications...
              </p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-4xl">📭</p>

              <h3 className="mt-4 font-bold">
                No rider applications found
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                Applications will appear here when applicants submit them.
              </p>

              {(search || selectedStatus !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSelectedStatus("all");
                  }}
                  className="mt-4 rounded-lg bg-cyan-400/10 px-4 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-400/20"
                >
                  Clear Filters
                </button>
              )}
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
                    <th className="px-5 py-4">Rider Account</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.06]">
                  {filteredRequests.map((request) => {
                    const processing = processingId === request._id;

                    const imageUrl = getProfileImageUrl(
                      request.profile_image
                    );

                    const applicantName =
                      `${request.first_name || ""} ${request.last_name || ""}`.trim();

                    return (
                      <tr
                        key={request._id}
                        className="transition hover:bg-white/[0.025]"
                      >
                        {/* APPLICANT */}

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {imageUrl ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPhotoFailed(false);
                                  setSelectedPhoto({
                                    url: imageUrl,
                                    name: applicantName,
                                  });
                                }}
                                className="group h-14 w-14 shrink-0 overflow-hidden rounded-full border border-cyan-400/30 bg-slate-950 shadow-lg shadow-cyan-950/20 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                                aria-label={`View ${request.first_name || "applicant"}'s profile photo`}
                                title="View profile photo"
                              >
                                <img
                                  src={imageUrl}
                                  alt={`${request.first_name || "Applicant"}'s profile`}
                                  loading="lazy"
                                  referrerPolicy="no-referrer"
                                  className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                                  onError={(event) => {
                                    event.currentTarget.style.display = "none";
                                  }}
                                />
                              </button>
                            ) : (
                              <div
                                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/10 bg-slate-800 text-xl font-black text-slate-400"
                                aria-label="No profile photo"
                              >
                                {(request.first_name || "R")
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                            )}

                            <div className="min-w-0">
                              <p className="font-semibold">
                                {applicantName || "Unknown Applicant"}
                              </p>

                              <p className="mt-1 max-w-[180px] truncate text-xs text-slate-500">
                                Application ID: {request._id}
                              </p>

                              <p className="mt-1 text-[11px] text-cyan-400/80">
                                {imageUrl
                                  ? "View profile photo"
                                  : "No photo available"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* CONTACT */}

                        <td className="px-5 py-4">
                          <p>{request.email || "—"}</p>

                          <p className="mt-1 text-xs text-slate-400">
                            {request.phone || "—"}
                          </p>
                        </td>

                        {/* SUBMITTED */}

                        <td className="px-5 py-4 text-slate-300">
                          {formatDate(request.createdAt)}
                        </td>

                        {/* STATUS */}

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

                        {/* REVIEW ACTIONS */}

                        <td className="px-5 py-4">
                          {["pending", "under_review"].includes(
                            request.status
                          ) ? (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={processing || Boolean(processingId)}
                                onClick={() =>
                                  handleReview(request, "approved")
                                }
                                className="rounded-lg bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-300 transition hover:bg-emerald-400/20 disabled:opacity-40"
                              >
                                {processing ? "Working..." : "Approve"}
                              </button>

                              <button
                                type="button"
                                disabled={processing || Boolean(processingId)}
                                onClick={() =>
                                  handleReview(request, "rejected")
                                }
                                className="rounded-lg bg-red-400/10 px-3 py-2 text-xs font-bold text-red-300 transition hover:bg-red-400/20 disabled:opacity-40"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">
                              {request.status === "account_created"
                                ? "Review completed"
                                : "Reviewed"}
                            </span>
                          )}
                        </td>

                        {/* ACCOUNT CREATION */}

                        <td className="px-5 py-4">
                          {request.status === "approved" ? (
                            <button
                              type="button"
                              disabled={processing || Boolean(processingId)}
                              onClick={() => handleCreateRider(request)}
                              className="rounded-lg bg-cyan-400 px-3 py-2 text-xs font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {processing
                                ? "Processing..."
                                : "Create Rider Account"}
                            </button>
                          ) : request.status === "account_created" ? (
                            <div>
                              <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                                <span>✓</span>
                                Rider Account Created
                              </span>

                              <p className="mt-2 text-[11px] text-slate-500">
                                Application linked to account
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">
                              {request.status === "rejected"
                                ? "Application rejected"
                                : "Waiting for approval"}
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

        {/* PROFILE PHOTO VIEWER */}

        <AnimatePresence>
          {selectedPhoto && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
              role="dialog"
              aria-modal="true"
              aria-label="Full-size applicant profile photo"
              onClick={() => setSelectedPhoto(null)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setSelectedPhoto(null);
                }
              }}
              tabIndex={-1}
            >
              <div
                className="relative flex max-h-[92vh] w-full max-w-4xl flex-col items-center"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-4 flex w-full items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">
                      Applicant Profile
                    </p>

                    <h2 className="mt-1 text-lg font-bold text-white">
                      {selectedPhoto.name || "Applicant"}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedPhoto(null)}
                    className="shrink-0 rounded-full border border-white/20 bg-slate-900/90 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white"
                    aria-label="Close photo viewer"
                  >
                    ✕ Close
                  </button>
                </div>

                {selectedPhotoFailed ? (
                  <div className="flex min-h-56 w-full max-w-xl flex-col items-center justify-center rounded-2xl border border-white/10 bg-slate-900 p-8 text-center">
                    <span className="text-4xl">🖼️</span>

                    <p className="mt-4 font-semibold text-white">
                      Unable to load this profile photo
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      The saved image URL may be invalid, or the Google Drive
                      file may not be available for viewing.
                    </p>
                  </div>
                ) : (
                  <img
                    src={selectedPhoto.url}
                    alt={`${selectedPhoto.name || "Applicant"} profile photo enlarged`}
                    referrerPolicy="no-referrer"
                    className="max-h-[78vh] max-w-full rounded-2xl bg-slate-950 object-contain shadow-2xl"
                    onError={() => setSelectedPhotoFailed(true)}
                  />
                )}

                <p className="mt-4 text-center text-xs text-slate-400">
                  Click outside the photo or press Escape to close
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FOOTER */}

        <footer className="mt-10 border-t border-white/[0.08] pt-6 text-center text-xs text-slate-500">
          DWJD Administration Portal · Rider Management
        </footer>
      </div>
    </div>
  );
}
