import { useNavigate } from "react-router-dom";

function OpeningPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* Navbar */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
          <div className="text-2xl font-extrabold tracking-wide">
            DWJD
          </div>

          <button
            onClick={() => navigate("/admin/login")}
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Admin Login
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto flex min-h-[calc(100vh-144px)] max-w-7xl items-center px-6 py-16 lg:px-10">
        <div className="grid w-full items-center gap-16 lg:grid-cols-2">

          {/* Left Section */}
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
              onClick={() => navigate("/admin/login")}
              className="mt-8 rounded-xl bg-slate-900 px-7 py-3.5 text-base font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-700"
            >
              Admin Login
              <span className="ml-2">→</span>
            </button>
          </section>

          {/* Right Card */}
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

                {/* Secure Access */}
                <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
                  <span className="text-xl">🔐</span>
                  <span className="font-medium">
                    Secure Access
                  </span>
                </div>

                {/* Management */}
                <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
                  <span className="text-xl">👥</span>
                  <span className="font-medium">
                    Management
                  </span>
                </div>

                {/* Administration */}
                <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
                  <span className="text-xl">📊</span>
                  <span className="font-medium">
                    Administration
                  </span>
                </div>

              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-5 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} DWJD Admin Portal
      </footer>

    </div>
  );
}

export default OpeningPage;