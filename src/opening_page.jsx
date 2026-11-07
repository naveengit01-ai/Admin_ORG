
import React from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  LockKeyhole,
  Users,
  BarChart3,
} from "lucide-react";

function getAdminSession() {
  try {
    const token = localStorage.getItem("adminToken");
    const admin = JSON.parse(localStorage.getItem("admin") || "null");

    return token && admin?.id && admin?.role
      ? { token, admin }
      : null;
  } catch {
    return null;
  }
}

function OpeningPage() {
  const navigate = useNavigate();
  const session = getAdminSession();

  // Already logged in: go to the correct dashboard.
  if (session) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-6 lg:px-12">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-xl font-black text-white shadow-lg">
            D
          </div>

          <div>
            <h1 className="text-xl font-black">DWJD</h1>
            <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400">
              ADMINISTRATION
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate("/admin/login")}
          className="rounded-xl bg-violet-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-violet-700"
        >
          Admin Login
        </button>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-150px)] max-w-7xl items-center gap-16 px-6 py-16 lg:grid-cols-2 lg:px-12">

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex rounded-full bg-violet-100 px-4 py-2 text-xs font-bold tracking-widest text-violet-700">
            WELCOME TO DWJD
          </div>

          <h1 className="mt-7 text-5xl font-black leading-tight sm:text-6xl">
            DWJD
            <span className="block text-violet-600">
              Administration Portal
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-500">
            A centralized administration platform for managing
            DWJD operations with secure, responsibility-based access.
          </p>

          <button
            onClick={() => navigate("/admin/login")}
            className="mt-9 rounded-xl bg-violet-600 px-8 py-4 font-bold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-1 hover:bg-violet-700"
          >
            Access Administration →
          </button>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
            <ShieldCheck size={34} />
          </div>

          <h2 className="mt-7 text-2xl font-black">
            Secure Admin Workspace
          </h2>

          <p className="mt-3 leading-7 text-slate-500">
            Every administrator receives access according to
            their assigned responsibilities.
          </p>

          <div className="mt-8 space-y-4">
            {[
              {
                icon: LockKeyhole,
                title: "Secure Administrator Access",
              },
              {
                icon: Users,
                title: "Role-Based Management",
              },
              {
                icon: BarChart3,
                title: "Controlled Platform Operations",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="flex items-center gap-4 rounded-xl bg-slate-50 p-4"
                >
                  <Icon className="text-violet-600" size={22} />
                  <span className="font-semibold">{item.title}</span>
                </div>
              );
            })}
          </div>
        </motion.section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-5 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} DWJD Administration Portal
      </footer>
    </div>
  );
}

export default OpeningPage;
