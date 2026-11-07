
import React from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

import {
  LayoutDashboard,
  Bike,
  Megaphone,
  ShieldCheck,
  LogOut,
  ChevronRight,
  LockKeyhole,
} from "lucide-react";

import { motion } from "framer-motion";

// ==========================================
// OPENING PAGE
// ==========================================

import OpeningPage from "./opening_page.jsx";

// ==========================================
// LOGIN
// ==========================================

import GMLogin from "./pages/GMLogin.jsx";

// ==========================================
// GM PAGES
// ==========================================

import AdminDashboard from "./pages/GM/AdminDashboard.jsx";
import AdminManagement from "./pages/GM/AdminsManagement.jsx";
import Reports from "./pages/GM/Reports.jsx";
import CreateAdmin from "./pages/GM/CreateAdmin.jsx";

// ==========================================
// RESPONSIBILITY PAGES
// ==========================================

import CreateRider from "./pages/Responsibilities/CreateRider.jsx";
import CreatePromotion from "./pages/Responsibilities/CreatePromotion";

// ==========================================
// SESSION HELPER
// ==========================================

function getAdminSession() {
  try {
    const token = localStorage.getItem("adminToken");

    const storedAdmin = JSON.parse(
      localStorage.getItem("admin") || "null"
    );

    if (!token || !storedAdmin) {
      return null;
    }

    const adminId = storedAdmin.id || storedAdmin._id;

    if (!adminId) {
      return null;
    }

    return {
      token,
      admin: {
        ...storedAdmin,
        id: String(adminId),
        responsibilities: Array.isArray(
          storedAdmin.responsibilities
        )
          ? storedAdmin.responsibilities
          : [],
      },
    };
  } catch (error) {
    console.error("Session reading error:", error);
    return null;
  }
}

// ==========================================
// LOGOUT
// ==========================================

function logoutAdmin(navigate) {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("admin");
  localStorage.removeItem("adminVerifyEmail");

  navigate("/admin/login", {
    replace: true,
  });
}

// ==========================================
// ACCESS DENIED
// ==========================================

function AccessDenied({ message }) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-white">

      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-8 text-center shadow-2xl">

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
          <LockKeyhole size={30} className="text-red-400" />
        </div>

        <h2 className="mt-6 text-2xl font-bold">
          Access Restricted
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-400">
          {message}
        </p>

        <button
          onClick={() => logoutAdmin(navigate)}
          className="mt-7 w-full rounded-xl bg-violet-600 px-6 py-3 font-bold text-white transition hover:bg-violet-700"
        >
          Go to Login
        </button>

        <button
          onClick={() => navigate("/", { replace: true })}
          className="mt-4 text-sm text-slate-400 hover:text-white"
        >
          Back to Home
        </button>

      </div>
    </div>
  );
}

// ==========================================
// AUTHENTICATION GUARD
// ==========================================

function RequireAdmin({ children }) {
  const session = getAdminSession();

  if (!session) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!["gm", "admin"].includes(session.admin.role)) {
    return (
      <AccessDenied
        message="Your account does not contain a valid administrator role. Please log in again."
      />
    );
  }

  return children;
}

// ==========================================
// GM ONLY GUARD
// ==========================================

function GMOnly({ children }) {
  const session = getAdminSession();

  if (!session) {
    return <Navigate to="/admin/login" replace />;
  }

  if (session.admin.role !== "gm") {
    return (
      <AccessDenied
        message="Only General Managers can access this section."
      />
    );
  }

  return children;
}

// ==========================================
// RESPONSIBILITY GUARD
// ==========================================

function ResponsibilityRoute({
  responsibility,
  children,
}) {
  const session = getAdminSession();

  if (!session) {
    return <Navigate to="/admin/login" replace />;
  }

  const admin = session.admin;

  // GM automatically has all responsibilities.
  if (admin.role === "gm") {
    return children;
  }

  if (admin.role !== "admin") {
    return (
      <AccessDenied
        message="Your account does not have a valid administrator role."
      />
    );
  }

  const responsibilities = admin.responsibilities || [];

  if (!responsibilities.includes(responsibility)) {
    return (
      <AccessDenied
        message="This responsibility has not been assigned to your account. Contact your General Manager."
      />
    );
  }

  return children;
}

// ==========================================
// ADMIN WORKSPACE
// ==========================================

function AdminWorkspace() {
  const navigate = useNavigate();

  const session = getAdminSession();

  if (!session || session.admin.role !== "admin") {
    return (
      <AccessDenied
        message="This workspace is available only to administrators."
      />
    );
  }

  const admin = session.admin;

  const firstName =
    admin.first_name || admin.username || "Administrator";

  const fullName =
    `${admin.first_name || ""} ${admin.last_name || ""}`.trim() ||
    admin.username;

  const responsibilities = admin.responsibilities || [];

  // ----------------------------------------
  // RESPONSIBILITY CONFIGURATION
  // ----------------------------------------

  const responsibilityConfig = [
    {
      id: "create_rider",
      title: "Rider Management",
      description:
        "Review and manage rider account requests and rider operations.",
      icon: Bike,
      route: "/admin/create-rider",
    },
    {
      id: "create_promotion",
      title: "Promotion Management",
      description:
        "Create and manage promotional campaigns for DWJD.",
      icon: Megaphone,
      route: "/admin/create-promotion",
    },
  ];

  const availableTools = responsibilityConfig.filter(
    (item) => responsibilities.includes(item.id)
  );

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">

      {/* ================================== */}
      {/* SIDEBAR */}
      {/* ================================== */}

      <aside className="hidden w-72 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">

        {/* BRAND */}

        <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-7">

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-xl font-black text-white shadow-lg">
            D
          </div>

          <div>
            <h1 className="text-xl font-black">
              DWJD
            </h1>

            <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400">
              ADMINISTRATION
            </p>
          </div>

        </div>

        {/* NAVIGATION */}

        <div className="flex-1 px-5 py-8">

          <p className="mb-5 px-3 text-xs font-bold tracking-[0.18em] text-slate-400">
            WORKSPACE
          </p>

          <button
            onClick={() => navigate("/admin/dashboard")}
            className="flex w-full items-center gap-4 rounded-xl bg-violet-50 px-4 py-3.5 text-left font-bold text-violet-700"
          >
            <LayoutDashboard size={19} />
            Dashboard
          </button>

          <p className="mb-5 mt-10 px-3 text-xs font-bold tracking-[0.18em] text-slate-400">
            MY RESPONSIBILITIES
          </p>

          <div className="space-y-2">

            {availableTools.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.route)}
                  className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left font-semibold text-slate-600 transition hover:bg-violet-50 hover:text-violet-700"
                >
                  <Icon size={19} />

                  <span>{item.title}</span>

                  <ChevronRight
                    size={15}
                    className="ml-auto"
                  />
                </button>
              );
            })}

            {availableTools.length === 0 && (
              <p className="px-4 text-sm text-slate-400">
                No responsibilities assigned.
              </p>
            )}

          </div>

        </div>

        {/* SIDEBAR FOOTER */}

        <div className="p-5">

          <div className="rounded-2xl bg-slate-950 p-5 text-white">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <ShieldCheck size={20} />
            </div>

            <h3 className="mt-4 font-bold">
              DWJD Admin Workspace
            </h3>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              Your workspace contains only the responsibilities
              assigned by your General Manager.
            </p>

            <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Active Workspace
            </div>

          </div>

          <button
            onClick={() => logoutAdmin(navigate)}
            className="mt-5 flex w-full items-center gap-3 rounded-xl px-4 py-3 font-semibold text-red-500 transition hover:bg-red-50"
          >
            <LogOut size={19} />
            Sign out
          </button>

        </div>

      </aside>

      {/* ================================== */}
      {/* MAIN CONTENT */}
      {/* ================================== */}

      <main className="min-w-0 flex-1">

        {/* HEADER */}

        <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">

          <div>
            <h2 className="font-bold text-slate-800">
              DWJD Workspace
            </h2>

            <p className="text-sm text-slate-400">
              Administration / My Dashboard
            </p>
          </div>

          <div className="flex items-center gap-3">

            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold uppercase">
                {admin.username}
              </p>

              <p className="text-xs font-semibold uppercase text-violet-600">
                Administrator
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 font-bold text-white shadow-md">
              {firstName.charAt(0).toUpperCase()}
            </div>

            <button
              onClick={() => logoutAdmin(navigate)}
              className="ml-2 rounded-lg p-2 text-red-500 hover:bg-red-50"
              title="Sign out"
            >
              <LogOut size={19} />
            </button>

          </div>

        </header>

        {/* DASHBOARD BODY */}

        <div className="p-5 sm:p-8">

          {/* WELCOME BANNER */}

          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-700 to-purple-700 p-7 text-white shadow-xl shadow-violet-200 sm:p-11"
          >

            <div className="absolute -right-10 -top-20 h-64 w-64 rounded-full border-[35px] border-white/10" />

            <div className="relative z-10">

              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold tracking-widest">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                ADMINISTRATOR WORKSPACE
              </div>

              <h1 className="mt-7 text-3xl font-black sm:text-5xl">
                Welcome back, {firstName}!
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-violet-100 sm:text-base">
                Manage your assigned DWJD responsibilities
                from one centralized workspace.
              </p>

              <p className="mt-6 text-sm font-medium text-violet-200">
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>

            </div>

          </motion.section>

          {/* ASSIGNED RESPONSIBILITIES */}

          <section className="mt-10">

            <div className="mb-6">

              <p className="text-xs font-black tracking-[0.2em] text-violet-600">
                YOUR WORK
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Assigned Responsibilities
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                These are the tools your General Manager has
                authorized for your account.
              </p>

            </div>

            {availableTools.length === 0 ? (

              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">

                <LockKeyhole
                  size={40}
                  className="mx-auto text-slate-300"
                />

                <h3 className="mt-4 font-bold text-slate-700">
                  No Responsibilities Assigned
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Contact your General Manager to request access.
                </p>

              </div>

            ) : (

              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">

                {availableTools.map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.08 }}
                      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-violet-300 hover:shadow-lg"
                    >

                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                        <Icon size={26} />
                      </div>

                      <h3 className="mt-5 text-lg font-bold">
                        {item.title}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {item.description}
                      </p>

                      <button
                        onClick={() => navigate(item.route)}
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 font-bold text-white transition hover:bg-violet-700"
                      >
                        Open Workspace
                        <ChevronRight size={17} />
                      </button>

                    </motion.div>
                  );
                })}

              </div>

            )}

          </section>

          {/* ACCOUNT INFORMATION */}

          <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">

            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                <ShieldCheck size={23} />
              </div>

              <div>
                <h3 className="font-bold">
                  Account Information
                </h3>

                <p className="text-sm text-slate-500">
                  Your administrator account details.
                </p>
              </div>

            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

              <div>
                <p className="text-xs font-bold uppercase text-slate-400">
                  Name
                </p>

                <p className="mt-2 font-semibold">
                  {fullName}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-slate-400">
                  Email
                </p>

                <p className="mt-2 break-all font-semibold">
                  {admin.email}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-slate-400">
                  Account Role
                </p>

                <p className="mt-2 font-semibold text-violet-700">
                  Administrator
                </p>
              </div>

            </div>

          </section>

        </div>

      </main>

    </div>
  );
}

// ==========================================
// ROLE-BASED DASHBOARD
// ==========================================

function DashboardRouter() {
  const session = getAdminSession();

  if (!session) {
    return <Navigate to="/admin/login" replace />;
  }

  const role = session.admin.role;

  if (role === "gm") {
    return <AdminDashboard />;
  }

  if (role === "admin") {
    return <AdminWorkspace />;
  }

  return (
    <AccessDenied
      message="Your administrator role is missing or invalid. Please log in again."
    />
  );
}

// ==========================================
// APPLICATION ROUTES
// ==========================================

function AppRoutes() {
  return (
    <Routes>

      {/* PUBLIC OPENING PAGE */}

      <Route
        path="/"
        element={<OpeningPage />}
      />

      {/* LOGIN */}

      <Route
        path="/admin/login"
        element={<GMLogin />}
      />

      {/* DASHBOARD */}

      <Route
        path="/admin/dashboard"
        element={
          <RequireAdmin>
            <DashboardRouter />
          </RequireAdmin>
        }
      />

      {/* GM: ADMIN MANAGEMENT */}

      <Route
        path="/admin/admin-management"
        element={
          <GMOnly>
            <AdminManagement />
          </GMOnly>
        }
      />

      {/* GM: CREATE ADMIN */}

      <Route
        path="/admin/accounts/create"
        element={
          <GMOnly>
            <CreateAdmin />
          </GMOnly>
        }
      />

      {/* GM: REPORTS */}

      <Route
        path="/admin/reports"
        element={
          <GMOnly>
            <Reports />
          </GMOnly>
        }
      />

      {/* CREATE RIDER */}

      <Route
        path="/admin/create-rider"
        element={
          <ResponsibilityRoute responsibility="create_rider">
            <CreateRider />
          </ResponsibilityRoute>
        }
      />

      {/* CREATE PROMOTION */}

      <Route
        path="/admin/create-promotion"
        element={
          <ResponsibilityRoute responsibility="create_promotion">
            <CreatePromotion />
          </ResponsibilityRoute>
        }
      />

      {/* UNKNOWN ROUTES */}

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>
  );
}

// ==========================================
// ROOT APPLICATION
// ==========================================

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
