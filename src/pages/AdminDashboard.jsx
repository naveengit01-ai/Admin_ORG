import { useNavigate } from "react-router-dom";

function AdminDashboard() {
  const navigate = useNavigate();

  // Get logged-in admin
  const adminData = localStorage.getItem("admin");

  // If admin data doesn't exist, go back to login
  if (!adminData) {
    navigate("/admin/login");
    return null;
  }

  const admin = JSON.parse(adminData);

  const role = admin.user_type;

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");

    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-slate-100">

      {/* =====================================================
          TOP NAVBAR
      ===================================================== */}

      <header className="fixed left-0 right-0 top-0 z-50 h-16 border-b border-slate-200 bg-white">

        <div className="flex h-full items-center justify-between px-6">

          {/* Logo */}

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
              DW
            </div>

            <div>
              <h1 className="text-lg font-bold text-slate-900">
                DWJD
              </h1>

              <p className="text-xs text-slate-500">
                Administration Portal
              </p>
            </div>

          </div>

          {/* Admin Information */}

          <div className="flex items-center gap-4">

            <div className="hidden text-right sm:block">

              <p className="text-sm font-semibold text-slate-900">
                {admin.first_name} {admin.last_name}
              </p>

              <p className="text-xs font-medium uppercase text-slate-500">
                {role}
              </p>

            </div>

            {/* Profile */}

            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-900 text-sm font-bold text-white">

              {admin.profile_image ? (
                <img
                  src={admin.profile_image}
                  alt="Admin"
                  className="h-full w-full object-cover"
                />
              ) : (
                admin.first_name?.charAt(0)?.toUpperCase()
              )}

            </div>

          </div>

        </div>

      </header>


      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="fixed bottom-0 left-0 top-16 hidden w-64 border-r border-slate-200 bg-white lg:block">

        <div className="flex h-full flex-col">

          {/* Navigation */}

          <nav className="flex-1 space-y-1 p-4">

            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Main
            </p>

            {/* Dashboard */}

            <button
              className="flex w-full items-center gap-3 rounded-lg bg-slate-900 px-3 py-3 text-left text-sm font-medium text-white"
            >
              <span>▦</span>
              Dashboard
            </button>


            {/* =================================================
                GM ONLY
            ================================================= */}

            {role === "gm" && (
              <>
                <p className="mb-3 mt-7 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Management
                </p>

                <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-slate-700 hover:bg-slate-100">
                  <span>👥</span>
                  Admin Management
                </button>

                <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-slate-700 hover:bg-slate-100">
                  <span>⚙️</span>
                  System Settings
                </button>
              </>
            )}


            {/* =================================================
                ADMIN
            ================================================= */}

            {role === "admin" && (
              <>
                <p className="mb-3 mt-7 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Management
                </p>

                <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-slate-700 hover:bg-slate-100">
                  <span>👥</span>
                  Users
                </button>

                <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-slate-700 hover:bg-slate-100">
                  <span>🚴</span>
                  Riders
                </button>

                <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-slate-700 hover:bg-slate-100">
                  <span>📦</span>
                  Donations
                </button>
              </>
            )}


            {/* =================================================
                OTHER ROLES
            ================================================= */}

            {role !== "gm" && role !== "admin" && (
              <>
                <p className="mb-3 mt-7 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Assigned Access
                </p>

                <button className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-slate-700 hover:bg-slate-100">
                  <span>📋</span>
                  My Operations
                </button>
              </>
            )}

          </nav>


          {/* Logout */}

          <div className="border-t border-slate-200 p-4">

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <span>↪</span>
              Logout
            </button>

          </div>

        </div>

      </aside>


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="pt-16 lg:pl-64">

        <div className="p-6 lg:p-8">

          {/* Welcome */}

          <div className="mb-8">

            <p className="text-sm font-medium text-slate-500">
              Administration Dashboard
            </p>

            <h2 className="mt-1 text-3xl font-bold text-slate-900">
              Welcome, {admin.first_name}
            </h2>

            <p className="mt-2 text-slate-500">
              Manage and monitor the DWJD platform from your
              administration workspace.
            </p>

          </div>


          {/* =================================================
              ROLE CARD
          ================================================= */}

          <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

              <div>

                <p className="text-sm text-slate-500">
                  Signed in as
                </p>

                <h3 className="mt-1 text-xl font-bold text-slate-900">
                  {admin.first_name} {admin.last_name}
                </h3>

              </div>

              <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold uppercase text-slate-700">
                {role}
              </div>
            </div>
          </div>
          {/* =================================================
              DASHBOARD CONTENT
          ================================================= */}

          {role === "gm" && (
  <>
    <p className="mb-3 mt-7 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
      Management
    </p>

    {/* Account Creation */}
    <button
      onClick={() => navigate("/admin/accounts/create")}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-slate-700 hover:bg-slate-100"
    >
      <span>➕</span>
      Account Creation
    </button>

    {/* Admin Management */}
    <button
      onClick={() => navigate("/admin/admin-management")}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-slate-700 hover:bg-slate-100"
    >
      <span>👥</span>
      Admin Management
    </button>

    {/* System Settings */}
    <button
      onClick={() => navigate("/admin/system-settings")}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm text-slate-700 hover:bg-slate-100"
    >
      <span>⚙️</span>
      System Settings
    </button>
  </>
)}

          {role === "admin" && (

            <section>

              <h3 className="mb-4 text-lg font-bold text-slate-900">
                Administration
              </h3>

              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

                <DashboardCard
                  title="Users"
                  description="Manage platform users."
                  icon="👥"
                />

                <DashboardCard
                  title="Riders"
                  description="Manage rider operations."
                  icon="🚴"
                />

                <DashboardCard
                  title="Donations"
                  description="Manage donation activities."
                  icon="📦"
                />

                <DashboardCard
                  title="Requests"
                  description="Manage platform requests."
                  icon="📋"
                />

              </div>

            </section>

          )}


          {role !== "gm" && role !== "admin" && (

            <section>

              <h3 className="mb-4 text-lg font-bold text-slate-900">
                Assigned Operations
              </h3>

              <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">

                <p className="text-slate-600">
                  Your assigned administrative operations will
                  appear here.
                </p>

              </div>

            </section>

          )}

        </div>

      </main>

    </div>
  );
}


/* =========================================================
   DASHBOARD CARD
========================================================= */

function DashboardCard({
  title,
  description,
  icon
}) {

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">

      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-xl">
        {icon}
      </div>

      <h4 className="font-bold text-slate-900">
        {title}
      </h4>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>

    </div>
  );
}

export default AdminDashboard;