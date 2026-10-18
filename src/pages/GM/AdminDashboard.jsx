import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../../api.js";

const StatIcon = ({ type }) => {
  const icons = {
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="10" cy="7" r="4" />
        <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    riders: (
      <>
        <circle cx="5.5" cy="17.5" r="3.5" />
        <circle cx="18.5" cy="17.5" r="3.5" />
        <path d="M15 6h3l3 5h-5l-3 6H9l-3-6h6l3-5Z" />
      </>
    ),
    donations: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
    ),
    requests: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M7 9h10M7 13h7M7 17h4" />
      </>
    ),
    jobs: (
      <>
        <rect x="3" y="7" width="18" height="14" rx="2" />
        <path d="M8 7V4h8v3M3 12h18M10 12v2h4v-2" />
      </>
    ),
    ads: (
      <>
        <path d="m3 11 18-5v12L3 13v-2Z" />
        <path d="m7 14 2 7h4l-2-6M21 10l2-2M21 16l2 2" />
      </>
    ),
  };

  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[type] || icons.users}
    </svg>
  );
};

const formatNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? new Intl.NumberFormat("en-IN").format(number)
    : String(value);
};

const getAdminFromStorage = () => {
  try {
    const storedAdmin = localStorage.getItem("admin");

    return storedAdmin ? JSON.parse(storedAdmin) : null;
  } catch {
    return null;
  }
};

const DIRECTORY_ENDPOINT = "/admin/dashboard/directory";

const extractRecords = (result, key) => {
  if (Array.isArray(result?.[key])) return result[key];
  if (Array.isArray(result?.data?.[key])) return result.data[key];
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.results)) return result.results;
  return [];
};

const personName = (person) => {
  const first = person?.first_name || person?.firstName || "";
  const last = person?.last_name || person?.lastName || "";
  return (
    `${first} ${last}`.trim() ||
    person?.name ||
    person?.full_name ||
    person?.fullName ||
    person?.username ||
    "Unnamed"
  );
};

const personEmail = (person) =>
  person?.email || person?.email_address || "—";

const personPhone = (person) =>
  person?.phone ||
  person?.phone_number ||
  person?.phoneNumber ||
  person?.mobile ||
  person?.mobile_number ||
  "—";

const personStatus = (person) => {
  if (typeof person?.is_active === "boolean") {
    return person.is_active ? "Active" : "Inactive";
  }
  if (typeof person?.is_verified === "boolean") {
    return person.is_verified ? "Verified" : "Unverified";
  }
  return "Registered";
};

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(() => getAdminFromStorage());
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [directoryTab, setDirectoryTab] = useState("users");
  const [directorySearch, setDirectorySearch] = useState("");
  const [directoryData, setDirectoryData] = useState({
    users: [],
    admins: [],
    riders: [],
  });
  const [directoryLoading, setDirectoryLoading] = useState({
    users: false,
    admins: false,
    riders: false,
  });
  const [directoryErrors, setDirectoryErrors] = useState({
    users: "",
    admins: "",
    riders: "",
  });

  const adminToken = localStorage.getItem("adminToken");

  const role = String(admin?.user_type || "").toLowerCase();

  const displayName =
    admin?.name ||
    admin?.full_name ||
    admin?.username ||
    admin?.email ||
    "Administrator";

  const initials = displayName
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  useEffect(() => {
    if (!admin || !adminToken) {
      navigate("/admin/login", { replace: true });
      return;
    }

    if (role !== "gm" && role !== "admin") {
      navigate("/admin/login", { replace: true });
    }
  }, [admin, adminToken, navigate, role]);

  const fetchDashboardStats = useCallback(async () => {
    if (!adminToken) {
      setLoading(false);
      setError("Your session has expired. Please log in again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${BASE_URL}/admin/dashboard/overview`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${adminToken}`,
            Accept: "application/json",
          },
        }
      );

      // Read the response as text first.
      // This prevents JSON.parse from crashing when the server
      // returns an HTML error page.
      const responseText = await response.text();

      let result;

      try {
        result = JSON.parse(responseText);
      } catch {
        if (response.status === 401) {
          throw new Error("Your session has expired. Please log in again.");
        }

        if (response.status === 403) {
          throw new Error("You don't have permission to view these reports.");
        }

        if (response.status === 404) {
          throw new Error(
            "Dashboard API endpoint not found. Check whether GET /admin/reports/overview exists in your backend."
          );
        }

        throw new Error(
          `The backend returned a non-JSON response (HTTP ${response.status}). Check the backend URL and API route.`
        );
      }

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Your session has expired. Please log in again.");
        }

        if (response.status === 403) {
          throw new Error("You don't have permission to view these reports.");
        }

        throw new Error(
          result.message ||
            result.error ||
            `Unable to load dashboard data (HTTP ${response.status}).`
        );
      }

      // Support common response structures without assuming
      // a particular database schema.
      const dashboardData =
        result.data ||
        result.stats ||
        result.overview ||
        result;

      setStats(dashboardData);
    } catch (err) {
      console.error("Admin Dashboard Error:", err);
      setError(err.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [adminToken]);

const fetchDirectory = useCallback(async () => {
  setDirectoryLoading({
    users: true,
    admins: true,
    riders: true,
  });

  setDirectoryErrors({
    users: "",
    admins: "",
    riders: "",
  });

  try {
    if (!adminToken) {
      throw new Error("Your session has expired. Please log in again.");
    }

    const response = await fetch(
      `${BASE_URL}/admin/dashboard/directory`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          Accept: "application/json",
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message ||
          `Unable to load directory (HTTP ${response.status}).`
      );
    }

    if (
      result.status !== "success" ||
      !Array.isArray(result.data?.users) ||
      !Array.isArray(result.data?.admins) ||
      !Array.isArray(result.data?.riders)
    ) {
      throw new Error(
        "The backend must return users, admins, and riders arrays."
      );
    }

    // Update all three lists from one API request.
    setDirectoryData({
      users: result.data.users,
      admins: result.data.admins,
      riders: result.data.riders,
    });

    console.log("Directory loaded successfully:", {
      users: result.data.users.length,
      admins: result.data.admins.length,
      riders: result.data.riders.length,
    });
  } catch (error) {
    console.error("Directory API Error:", error);

    const message =
      error.message || "Unable to load directory.";

    setDirectoryErrors({
      users: message,
      admins: message,
      riders: message,
    });
  } finally {
    setDirectoryLoading({
      users: false,
      admins: false,
      riders: false,
    });
  }
}, [adminToken]);

  useEffect(() => {
  if (
    admin &&
    adminToken &&
    (role === "gm" || role === "admin")
  ) {
    fetchDirectory();
  }
}, [admin, adminToken, role, fetchDirectory]);

  useEffect(() => {
    if (admin && adminToken && (role === "gm" || role === "admin")) {
      fetchDirectory(directoryTab);
    }
  }, [admin, adminToken, role, directoryTab, fetchDirectory]);

  useEffect(() => {
    setDirectorySearch("");
  }, [directoryTab]);

  const statCards = useMemo(
    () => [
      
    ],
    [stats]
  );

  const actions = [
    {
      title: "Admin Management",
      description: "Manage existing administrator accounts.",
      icon: "♙",
      route: "/admin/admin-management",
      color: "blue",
    },
    {
      title: "Create Admin",
      description: "Create an administrator account.",
      icon: "✚",
      route: "/admin/accounts/create",
      color: "violet",
    },
    {
      title: "Create Rider",
      description: "Register a new delivery rider.",
      icon: "↗",
      route: "/admin/create-rider",
      color: "emerald",
    },
    {
      title: "View Reports",
      description: "Review available system reports.",
      icon: "▤",
      route: "/admin/reports",
      color: "amber",
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    setAdmin(null);
    navigate("/admin/login", { replace: true });
  };

  const today = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <style>{`
        .dashboard-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .dashboard-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 20px;
        }

        .dashboard-card {
          transition:
            transform 220ms ease,
            box-shadow 220ms ease,
            border-color 220ms ease;
        }

        .dashboard-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.07);
          border-color: #cbd5e1;
        }
      `}</style>

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="dashboard-scrollbar fixed inset-y-0 left-0 z-30 hidden w-[255px] flex-col overflow-y-auto border-r border-slate-200 bg-white lg:flex">
          <div className="flex h-[88px] items-center gap-3 border-b border-slate-100 px-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-lg font-black text-white shadow-lg shadow-indigo-200">
              D
            </div>

            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                DWJD
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Administration
              </p>
            </div>
          </div>

          <div className="px-4 py-7">
            <p className="mb-3 px-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">
              Workspace
            </p>

            <button
              onClick={() => navigate("/admin/dashboard")}
              className="flex w-full items-center gap-3 rounded-xl bg-indigo-50 px-4 py-3.5 text-left text-sm font-bold text-indigo-700"
            >
              <span className="text-lg">▦</span>
              Dashboard
              <span className="ml-auto h-2 w-2 rounded-full bg-indigo-600" />
            </button>

            <p className="mb-3 mt-8 px-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">
              Management
            </p>

            {actions.map((action) => (
              <button
                key={action.title}
                onClick={() => navigate(action.route)}
                className="mb-1.5 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-sm">
                  {action.icon}
                </span>
                {action.title}
              </button>
            ))}
          </div>

          <div className="mt-auto p-4">
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 p-5 text-white">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-lg">
                ✦
              </div>

              <p className="text-sm font-bold">DWJD Control Center</p>

              <p className="mt-1 text-xs leading-5 text-slate-300">
                Manage your platform from one place.
              </p>

              <div className="mt-4 flex items-center gap-2 text-[10px] font-semibold text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Admin workspace
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="mt-4 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
            >
              <span>↪</span>
              Sign out
            </button>
          </div>
        </aside>

        {/* Main area */}
        <main className="min-w-0 flex-1 lg:ml-[255px]">
          {/* Top navigation */}
          <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur-xl sm:px-8 lg:px-10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-xl text-indigo-700 lg:hidden">
                D
              </div>

              <div>
                <p className="text-sm font-bold text-slate-800">
                  DWJD Workspace
                </p>
                <p className="hidden text-xs text-slate-400 sm:block">
                  Administration / Dashboard
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-5">
              <div className="hidden text-right sm:block">
                <p className="text-xs font-bold text-slate-700">
                  {displayName}
                </p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-600">
                  {role === "gm" ? "General Manager" : "Administrator"}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-extrabold text-white ring-4 ring-indigo-50">
                {initials || "AD"}
              </div>

              <button
                onClick={handleLogout}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 sm:hidden"
              >
                Exit
              </button>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
            {/* Welcome banner */}
            <motion.section
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-indigo-700 via-indigo-700 to-violet-800 p-6 text-white shadow-xl shadow-indigo-200/50 sm:p-9 lg:p-10"
            >
              <div className="pointer-events-none absolute -right-12 -top-24 h-72 w-72 rounded-full border-[45px] border-white/[0.06]" />

              <div className="pointer-events-none absolute -bottom-28 right-36 h-60 w-60 rounded-full bg-violet-400/10 blur-3xl" />

              <div className="relative z-10 flex flex-col justify-between gap-8 md:flex-row md:items-center">
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-100">
                    <span className="h-2 w-2 rounded-full bg-emerald-300" />
                    Admin control panel
                  </div>

                  <h2 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-[42px]">
                    Welcome back, {displayName.split(" ")[0]}!
                  </h2>

                  <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100 sm:text-base">
                    Manage your platform, monitor activity, and access your
                    administrative tools from one place.
                  </p>

                  <p className="mt-5 text-xs font-medium text-indigo-200">
                    {today}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <button
                    onClick={fetchDashboardStats}
                    disabled={loading}
                    className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Refreshing..." : "↻ Refresh"}
                  </button>

                  <button
                    onClick={() => navigate("/admin/reports")}
                    className="rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-indigo-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-50"
                  >
                    View Reports ↗
                  </button>
                </div>
              </div>
            </motion.section>

            {/* Stats heading */}
            <section className="mt-9">
              <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-indigo-600">
                    Platform overview
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {loading ? "Updating data..." : "Overview"}
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mb-5 flex flex-col justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="text-sm font-bold text-amber-900">
                      Unable to load dashboard statistics
                    </p>
                    <p className="mt-1 break-words text-xs leading-5 text-amber-800">
                      {error}
                    </p>
                  </div>

                  <button
                    onClick={fetchDashboardStats}
                    className="shrink-0 rounded-xl bg-amber-100 px-4 py-2.5 text-xs font-bold text-amber-900 transition hover:bg-amber-200"
                  >
                    Try again
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {statCards.map((card, index) => (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.35,
                      delay: index * 0.06,
                    }}
                    className="dashboard-card rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-500">
                          {card.title}
                        </p>

                        <div className="mt-4 text-3xl font-black tracking-tight text-slate-900">
                          {loading && card.value === undefined ? (
                            <div className="h-9 w-24 animate-pulse rounded-lg bg-slate-100" />
                          ) : (
                            formatNumber(card.value)
                          )}
                        </div>

                        <p className="mt-2 text-xs text-slate-400">
                          {card.description}
                        </p>
                      </div>

                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                          {
                            blue: "bg-blue-50 text-blue-600",
                            violet: "bg-violet-50 text-violet-600",
                            rose: "bg-rose-50 text-rose-600",
                            amber: "bg-amber-50 text-amber-600",
                            emerald: "bg-emerald-50 text-emerald-600",
                            cyan: "bg-cyan-50 text-cyan-600",
                          }[card.color]
                        }`}
                      >
                        <StatIcon type={card.icon} />
                      </div>
                    </div>

                    <div className="mt-5 h-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full w-2/3 rounded-full ${
                          {
                            blue: "bg-blue-500",
                            violet: "bg-violet-500",
                            rose: "bg-rose-500",
                            amber: "bg-amber-500",
                            emerald: "bg-emerald-500",
                            cyan: "bg-cyan-500",
                          }[card.color]
                        }`}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

           
            {/* People directory: users, administrators, and riders */}
            <section className="mt-10">
              <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-indigo-600">
                    Directory
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                    People & Accounts
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    View names, email addresses, phone numbers, and account status.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fetchDirectory}
                  disabled={directoryLoading[directoryTab]}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {directoryLoading[directoryTab] ? "Loading..." : "↻ Refresh list"}
                </button>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
                <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: "users", label: "Users", icon: "♙" },
                      { key: "admins", label: "Administrators", icon: "🛡" },
                      { key: "riders", label: "Riders", icon: "🚴" },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setDirectoryTab(tab.key)}
                        className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                          directoryTab === tab.key
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                            : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                        }`}
                      >
                        <span className="mr-2">{tab.icon}</span>
                        {tab.label}
                        <span className={`ml-2 rounded-lg px-2 py-0.5 text-xs ${
                          directoryTab === tab.key
                            ? "bg-white/20 text-white"
                            : "bg-white text-slate-500"
                        }`}>
                          {directoryData[tab.key].length}
                        </span>
                      </button>
                    ))}
                  </div>

                  <label className="relative block w-full lg:max-w-sm">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-slate-400">
                      ⌕
                    </span>
                    <input
                      type="search"
                      value={directorySearch}
                      onChange={(event) => setDirectorySearch(event.target.value)}
                      placeholder="Search name, email, phone..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                    />
                  </label>
                </div>

                {directoryErrors[directoryTab] ? (
                  <div role="alert" className="m-5 rounded-xl border border-rose-200 bg-rose-50 p-5">
                    <p className="text-sm font-bold text-rose-800">
                      Unable to load {directoryTab}
                    </p>
                    <p className="mt-1 break-words text-sm text-rose-700">
                      {directoryErrors[directoryTab]}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-rose-600">
                      Confirm that GET {DIRECTORY_ENDPOINTS[directoryTab]} exists in your backend and returns a JSON array.
                    </p>
                    <button
                      type="button"
                      onClick={() => fetchDirectory(directoryTab)}
                      className="mt-4 rounded-lg bg-rose-100 px-3 py-2 text-xs font-bold text-rose-800 hover:bg-rose-200"
                    >
                      Try again
                    </button>
                  </div>
                ) : directoryLoading[directoryTab] ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="h-9 w-9 animate-spin rounded-full border-2 border-indigo-100 border-t-indigo-600" />
                    <p className="mt-4 text-sm text-slate-500">
                      Loading {directoryTab}...
                    </p>
                  </div>
                ) : (
                  (() => {
                    const query = directorySearch.trim().toLowerCase();
                    const records = directoryData[directoryTab].filter((person) =>
                      [
                        personName(person),
                        personEmail(person),
                        personPhone(person),
                        person?.username,
                      ].some((value) => String(value || "").toLowerCase().includes(query))
                    );

                    return records.length === 0 ? (
                      <div className="px-5 py-16 text-center">
                        <div className="text-4xl">
                          {directoryTab === "users" ? "♙" : directoryTab === "admins" ? "🛡" : "🚴"}
                        </div>
                        <h3 className="mt-3 font-bold text-slate-800">
                          {query ? "No matching records" : `No ${directoryTab} found`}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {query
                            ? "Try a different name, email address, or phone number."
                            : "If you expect records here, verify the backend endpoint and response format."}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[760px] text-left">
                            <thead>
                              <tr className="border-b border-slate-100 bg-slate-50/80">
                                {["Name", "Email", "Phone Number", "Status", "Account ID"].map((heading) => (
                                  <th key={heading} className="px-5 py-4 text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400">
                                    {heading}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {records.map((person, index) => {
                                const id = person?._id || person?.id || person?.userId || person?.adminId;
                                const name = personName(person);
                                const status = personStatus(person);
                                const badgeClass =
                                  status === "Active" || status === "Verified"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : status === "Inactive" || status === "Unverified"
                                      ? "bg-rose-50 text-rose-700"
                                      : "bg-slate-100 text-slate-600";

                                return (
                                  <tr key={id || `${personEmail(person)}-${index}`} className="transition hover:bg-slate-50/80">
                                    <td className="px-5 py-4">
                                      <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 font-extrabold text-indigo-700">
                                          {name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                          <p className="text-sm font-bold text-slate-800">{name}</p>
                                          {person?.username && (
                                            <p className="mt-1 text-xs text-slate-400">@{person.username}</p>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-slate-600">{personEmail(person)}</td>
                                    <td className="px-5 py-4 text-sm text-slate-600">{personPhone(person)}</td>
                                    <td className="px-5 py-4">
                                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${badgeClass}`}>
                                        {status}
                                      </span>
                                    </td>
                                    <td className="px-5 py-4 font-mono text-xs text-slate-400">
                                      {id ? String(id).slice(-8) : "—"}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-400">
                          Showing {records.length} of {directoryData[directoryTab].length} records
                        </div>
                      </>
                    );
                  })()
                )}
              </div>
            </section>

            {/* Footer */}
            <footer className="mt-12 flex flex-col justify-between gap-2 border-t border-slate-200 py-6 text-xs text-slate-400 sm:flex-row">
              <p>
                © {new Date().getFullYear()} DWJD. All rights reserved.
              </p>

              <p>
                Logged in as{" "}
                <span className="font-bold text-slate-600">
                  {role === "gm" ? "General Manager" : "Administrator"}
                </span>
              </p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
