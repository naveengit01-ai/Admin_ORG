
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

// Map existing components to their assigned roles.
// Add your other existing components here.
const RESPONSIBILITIES = [
  {
    id: "create-promotion",
    title: "Create Promotion",
    description: "Create and manage promotional campaigns.",
    icon: "📢",
    route: "/admin/create-promotion",
    roles: ["marketing"],
  },
  {
    id: "create-rider",
    title: "Create Rider",
    description: "Manage rider account creation.",
    icon: "🛵",
    route: "/admin/create-rider",
    roles: ["operations"],
  },
];

function OpeningPage() {
  const navigate = useNavigate();

  let admin = null;
  let token = null;

  try {
    token = localStorage.getItem("adminToken");
    admin = JSON.parse(localStorage.getItem("admin") || "null");
  } catch {
    admin = null;
  }

  const isLoggedIn = Boolean(token && admin?.id);

  const roles = Array.isArray(admin?.roles)
    ? admin.roles
    : [];

  const isGM = roles.includes("gm");

  // GM sees all responsibilities.
  // Other admins see only responsibilities matching their roles.
  const visibleResponsibilities = RESPONSIBILITIES.filter(
    (item) =>
      isGM ||
      item.roles.some((role) => roles.includes(role))
  );

  const handleLogin = () => {
    navigate("/admin/login");
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    localStorage.removeItem("adminVerifyEmail");

    navigate("/admin/login", { replace: true });
  };

  // Logged-in administrator view
  if (isLoggedIn) {
    if (admin.must_change_password) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
          <div className="text-center">
            <h2 className="text-xl font-bold">
              Password change required
            </h2>

            <button
              onClick={() =>
                navigate("/admin/change-password", {
                  replace: true,
                })
              }
              className="mt-5 rounded-xl bg-cyan-500 px-6 py-3 font-bold"
            >
              Change Password
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-950 text-white">

        {/* Navbar */}
        <header className="border-b border-white/10 bg-slate-900">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">

            <h1 className="text-2xl font-extrabold tracking-wide">
              DWJD
            </h1>

            <div className="flex items-center gap-4">
              <div className="hidden text-right sm:block">
                <p className="font-semibold">
                  {admin.first_name} {admin.last_name}
                </p>

                <p className="text-xs uppercase text-cyan-400">
                  {isGM ? "General Manager" : roles.join(" / ")}
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="rounded-lg border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/10"
              >
                Logout
              </button>
            </div>

          </div>
        </header>

        {/* Main */}
        <main className="mx-auto max-w-7xl px-6 py-12">

          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-sm font-bold uppercase tracking-widest text-cyan-400">
              DWJD Administration
            </p>

            <h2 className="mt-3 text-4xl font-extrabold">
              Welcome, {admin.first_name}
            </h2>

            <p className="mt-3 text-slate-400">
              Access the responsibilities assigned to your account.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {roles.map((role) => (
                <span
                  key={role}
                  className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-bold uppercase text-cyan-400"
                >
                  {role}
                </span>
              ))}
            </div>
          </motion.section>

          {/* Responsibilities */}
          <section className="mt-12">

            <div className="mb-7">
              <h3 className="text-2xl font-bold">
                Responsibilities
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                {isGM
                  ? "You have access to all administration responsibilities."
                  : "These responsibilities are available based on your assigned roles."}
              </p>
            </div>

            {visibleResponsibilities.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-slate-900 p-8 text-center">
                <p className="text-slate-300">
                  No responsibilities have been assigned to your account.
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Contact the General Manager for access.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

                {visibleResponsibilities.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="rounded-2xl border border-white/10 bg-slate-900 p-6 transition hover:-translate-y-1 hover:border-cyan-400/40"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-cyan-500/10 text-3xl">
                      {item.icon}
                    </div>

                    <h4 className="mt-5 text-xl font-bold">
                      {item.title}
                    </h4>

                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {item.description}
                    </p>

                    <button
                      onClick={() => navigate(item.route)}
                      className="mt-6 w-full rounded-xl bg-cyan-500 px-4 py-3 font-bold text-white transition hover:bg-cyan-400"
                    >
                      Open Responsibility →
                    </button>
                  </motion.div>
                ))}

              </div>
            )}

          </section>
        </main>
      </div>
    );
  }

  // Public opening page for users who are not logged in.
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
          <div className="text-2xl font-extrabold tracking-wide">
            DWJD
          </div>

          <button
            onClick={handleLogin}
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Admin Login
          </button>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-144px)] max-w-7xl items-center px-6 py-16 lg:px-10">
        <div className="grid w-full items-center gap-16 lg:grid-cols-2">

          <section>
            <div className="mb-6 inline-flex rounded-full bg-slate-200 px-4 py-2 text-xs font-bold tracking-widest text-slate-700">
              WELCOME TO DWJD
            </div>

            <h1 className="text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl">
              DWJD
              <span className="block text-slate-600">
                Administration Portal
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Welcome to the DWJD administration portal.
              This platform provides authorized administrators
              with secure access to manage and monitor the system.
            </p>

            <button
              onClick={handleLogin}
              className="mt-8 rounded-xl bg-slate-900 px-7 py-3.5 text-base font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-700"
            >
              Admin Login →
            </button>
          </section>

          <section className="mx-auto w-full max-w-md">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">

              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
                🛡️
              </div>

              <h2 className="text-2xl font-bold">
                Admin Portal
              </h2>

              <p className="mt-3 leading-7 text-slate-500">
                Secure administration access for authorized
                DWJD administrators.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  ["🔐", "Secure Access"],
                  ["👥", "Role-Based Management"],
                  ["📊", "Administration"],
                ].map(([icon, label]) => (
                  <div
                    key={label}
                    className="flex items-center gap-4 rounded-xl bg-slate-50 p-4"
                  >
                    <span className="text-xl">{icon}</span>
                    <span className="font-medium">{label}</span>
                  </div>
                ))}
              </div>

            </div>
          </section>

        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-5 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} DWJD Admin Portal
      </footer>

    </div>
  );
}

export default OpeningPage;
