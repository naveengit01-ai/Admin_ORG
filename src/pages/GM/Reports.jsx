import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import {
  getAdminReportsOverview,
  downloadAdminReportCSV,
} from "../../api.js";

const INITIAL_REPORT = {
  users: 0,
  riders: 0,
  donations: 0,
  riderRequests: 0,
  admins: 0,
  activeAdmins: 0,
};

const CSV_REPORTS = [
  {
    type: "users",
    title: "Registered Users",
    description: "Export registered user records.",
    icon: "👥",
    filename: "dwjd-registered-users.csv",
  },
  {
    type: "donations",
    title: "Donations",
    description: "Export complete donation records.",
    icon: "❤️",
    filename: "dwjd-donations.csv",
  },
  {
    type: "riders",
    title: "Riders",
    description: "Export rider account records.",
    icon: "🚴",
    filename: "dwjd-riders.csv",
  },
  {
    type: "rider-requests",
    title: "Rider Requests",
    description: "Export rider application records.",
    icon: "📦",
    filename: "dwjd-rider-requests.csv",
  },
  {
    type: "admins",
    title: "Administrators",
    description: "Export administrator account records.",
    icon: "🛡️",
    filename: "dwjd-administrators.csv",
  },
];

const SUMMARY_CARDS = [
  {
    key: "users",
    title: "Registered Users",
    icon: "👥",
    description: "Total registered user accounts",
  },
  {
    key: "riders",
    title: "Riders",
    icon: "🚴",
    description: "Total rider accounts",
  },
  {
    key: "donations",
    title: "Donations",
    icon: "❤️",
    description: "Total donation records",
  },
  {
    key: "riderRequests",
    title: "Rider Requests",
    icon: "📦",
    description: "Total rider applications",
  },
  {
    key: "admins",
    title: "Administrators",
    icon: "🛡️",
    description: "Total administrator accounts",
  },
  {
    key: "activeAdmins",
    title: "Active Administrators",
    icon: "✅",
    description: "Currently active administrator accounts",
  },
];

export default function Reports() {
  const navigate = useNavigate();

  const [report, setReport] = useState(INITIAL_REPORT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState("");
  const [exportMessage, setExportMessage] = useState("");
  const [exportError, setExportError] = useState("");

  // ============================================
  // AUTHENTICATION
  // ============================================

  const checkAdminAccess = useCallback(() => {
    const token = localStorage.getItem("adminToken");

    let admin;

    try {
      admin = JSON.parse(
        localStorage.getItem("admin") || "null"
      );
    } catch {
      navigate("/admin/login", { replace: true });
      return false;
    }

    if (!token || !admin) {
      navigate("/admin/login", { replace: true });
      return false;
    }

    if (
      String(admin.user_type || "").toLowerCase() !== "gm"
    ) {
      setError(
        "Only the General Manager can view organization reports."
      );

      setLoading(false);

      return false;
    }

    return true;
  }, [navigate]);

  // ============================================
  // LOAD REPORT SUMMARY
  // ============================================

  const loadReports = useCallback(async () => {
    if (!checkAdminAccess()) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await getAdminReportsOverview();

      if (!result?.ok) {
        if (
          result?.httpStatus === 401 ||
          result?.httpStatus === 403
        ) {
          if (result.httpStatus === 401) {
            localStorage.removeItem("adminToken");
            localStorage.removeItem("admin");

            navigate("/admin/login", {
              replace: true,
            });

            return;
          }

          throw new Error(
            result.message ||
              "You do not have permission to view reports."
          );
        }

        throw new Error(
          result?.message || "Unable to load reports."
        );
      }

      const stats = result.stats || result.data || result;

      setReport({
        users: Number(
          stats.users ?? stats.totalUsers ?? 0
        ),

        riders: Number(
          stats.riders ?? stats.totalRiders ?? 0
        ),

        donations: Number(
          stats.donations ?? stats.totalDonations ?? 0
        ),

        riderRequests: Number(
          stats.riderRequests ?? stats.totalRequests ?? 0
        ),

        admins: Number(
          stats.admins ?? stats.totalAdmins ?? 0
        ),

        activeAdmins: Number(
          stats.activeAdmins ??
            stats.totalActiveAdmins ??
            0
        ),
      });
    } catch (err) {
      console.error("DWJD reports error:", err);

      setError(
        err.message || "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  }, [checkAdminAccess, navigate]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // ============================================
  // DOWNLOAD SUMMARY CSV
  // ============================================

  const downloadSummaryCSV = () => {
    const rows = [
      ["Report", "Value"],
      ...SUMMARY_CARDS.map((card) => [
        card.title,
        report[card.key],
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => {
            const safeValue = String(value ?? "");

            return `"${safeValue.replace(/"/g, '""')}"`;
          })
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob(
      ["\uFEFF" + csv],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "dwjd-admin-summary.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  };

  // ============================================
  // DOWNLOAD COMPLETE DATA CSV
  // ============================================

  const handleDownloadCSV = async (type) => {
    if (!checkAdminAccess()) {
      return;
    }

    setExporting(type);
    setExportMessage("");
    setExportError("");

    try {
      await downloadAdminReportCSV(type);

      const selectedReport = CSV_REPORTS.find(
        (item) => item.type === type
      );

      setExportMessage(
        `${selectedReport?.title || "Report"} downloaded successfully.`
      );
    } catch (err) {
      console.error("CSV download error:", err);

      setExportError(
        err.message || "Unable to download the CSV report."
      );

      if (
        /authentication required|invalid or expired token|session is invalid/i.test(
          err.message || ""
        )
      ) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("admin");

        navigate("/admin/login", {
          replace: true,
        });
      }
    } finally {
      setExporting("");
    }
  };

  // ============================================
  // PAGE UI
  // ============================================

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080d19] px-4 py-8 text-white sm:px-8">

      {/* Background effects */}

      <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-cyan-500/10 blur-[120px]" />

      <div className="pointer-events-none absolute -right-40 top-80 h-96 w-96 rounded-full bg-blue-500/10 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-7xl">

        {/* =====================================
            HEADER
        ===================================== */}

        <motion.header
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-400">
              DWJD Analytics
            </p>

            <h1 className="mt-3 text-3xl font-black sm:text-4xl">
              Administration Reports
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Organization-wide overview of registered users,
              donations, riders, rider applications, and
              administrator accounts.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/dashboard")}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-cyan-400/30 hover:bg-white/[0.07]"
            >
              ← Dashboard
            </button>

            <button
              type="button"
              onClick={downloadSummaryCSV}
              disabled={loading}
              className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ↓ Export Summary
            </button>
          </div>
        </motion.header>

        {/* =====================================
            SUMMARY ERROR
        ===================================== */}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            className="mt-6 flex flex-col justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300 sm:flex-row sm:items-center"
          >
            <span>{error}</span>

            <button
              type="button"
              onClick={loadReports}
              disabled={loading}
              className="font-bold underline disabled:opacity-50"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* =====================================
            ORGANIZATION OVERVIEW
        ===================================== */}

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-8 flex flex-col justify-between gap-4 rounded-2xl border border-white/[0.08] bg-slate-900/60 p-5 sm:flex-row sm:items-center"
        >
          <div>
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.7)]" />

              <p className="font-bold">
                Organization Overview
              </p>
            </div>

            <p className="mt-2 text-sm text-slate-400">
              {loading
                ? "Retrieving the latest report..."
                : error
                  ? "Unable to retrieve the latest report."
                  : "Report data retrieved from the backend."}
            </p>
          </div>

          <button
            type="button"
            onClick={loadReports}
            disabled={loading}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold transition hover:border-cyan-400/30 hover:bg-cyan-400/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Loading..." : "↻ Refresh"}
          </button>
        </motion.section>

        {/* =====================================
            SUMMARY CARDS
        ===================================== */}

        <section className="mt-7">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">
              Summary Statistics
            </p>

            <h2 className="mt-2 text-xl font-black">
              Organization at a Glance
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SUMMARY_CARDS.map((card, index) => (
              <motion.div
                key={card.key}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: index * 0.07,
                  duration: 0.35,
                }}
                whileHover={{ y: -4 }}
                className="group rounded-2xl border border-white/[0.08] bg-slate-900/70 p-6 transition hover:border-cyan-400/25 hover:bg-slate-900"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.04] text-3xl transition group-hover:border-cyan-400/20 group-hover:bg-cyan-400/10">
                    {card.icon}
                  </span>

                  <span className="rounded-full border border-white/[0.06] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Report
                  </span>
                </div>

                <h3 className="mt-6 text-sm font-semibold text-slate-400">
                  {card.title}
                </h3>

                <p className="mt-2 text-4xl font-black tracking-tight text-cyan-400">
                  {loading
                    ? "..."
                    : Number(
                        report[card.key] ?? 0
                      ).toLocaleString("en-IN")}
                </p>

                <p className="mt-3 text-xs text-slate-500">
                  {card.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* =====================================
            COMPLETE CSV EXPORTS
        ===================================== */}

        <section className="mt-12">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-400">
              Complete Data Exports
            </p>

            <h2 className="mt-2 text-2xl font-black sm:text-3xl">
              Download Organization Records
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Download individual CSV files containing the
              records stored in your database. Authentication
              secrets must be excluded by the backend.
            </p>
          </div>

          {/* Export success */}

          {exportMessage && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              role="status"
              className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300"
            >
              ✓ {exportMessage}
            </motion.div>
          )}

          {/* Export error */}

          {exportError && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              role="alert"
              className="mb-5 flex flex-col justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300 sm:flex-row sm:items-center"
            >
              <span>{exportError}</span>

              <button
                type="button"
                onClick={() => setExportError("")}
                className="font-bold underline"
              >
                Dismiss
              </button>
            </motion.div>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CSV_REPORTS.map((item, index) => {
              const isExporting = exporting === item.type;

              return (
                <motion.div
                  key={item.type}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: index * 0.06,
                  }}
                  whileHover={{ y: -3 }}
                  className="group rounded-2xl border border-white/[0.08] bg-slate-900/70 p-5 transition hover:border-cyan-400/30 hover:bg-slate-900"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.04] text-3xl">
                      {item.icon}
                    </span>

                    <span className="rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                      CSV
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-bold">
                    {item.title}
                  </h3>

                  <p className="mt-2 min-h-10 text-sm leading-5 text-slate-400">
                    {item.description}
                  </p>

                  <p className="mt-3 truncate text-xs text-slate-500">
                    {item.filename}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      handleDownloadCSV(item.type)
                    }
                    disabled={Boolean(exporting) || loading}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isExporting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />

                        Preparing CSV...
                      </>
                    ) : (
                      <>
                        <span>↓</span>

                        Download CSV
                      </>
                    )}
                  </button>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* =====================================
            SECURITY NOTICE
        ===================================== */}

        <div className="mt-8 rounded-2xl border border-amber-400/15 bg-amber-400/[0.04] p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">🔒</span>

            <div>
              <p className="text-sm font-bold text-amber-200">
                Secure Data Exports
              </p>

              <p className="mt-1 text-xs leading-6 text-slate-400">
                Exported files may contain personal or donation
                information. Keep them private and share them
                only with authorized personnel. The backend must
                exclude usernames, passwords, OTPs, and
                authentication tokens.
              </p>
            </div>
          </div>
        </div>

        {/* =====================================
            FOOTER
        ===================================== */}

        <footer className="mt-12 border-t border-white/[0.08] pt-6 text-center text-xs text-slate-500">
          DWJD Administration Portal · Reports
          <span className="mx-2">·</span>
          Organization Analytics
        </footer>
      </div>
    </div>
  );
}