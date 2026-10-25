
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { adminLogin } from "../api.js";

function GMLogin() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Reuse an existing admin session.
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const savedAdmin = localStorage.getItem("admin");

    if (token && savedAdmin) {
      try {
        const admin = JSON.parse(savedAdmin);

        if (admin && typeof admin === "object") {
          navigate("/admin/dashboard", { replace: true });
        } else {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("admin");
        }
      } catch {
        // Clear invalid stored session data.
        localStorage.removeItem("adminToken");
        localStorage.removeItem("admin");
      }
    }
  }, [navigate]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Please enter your username and password.");
      return;
    }

    setLoading(true);

    try {
      const result = await adminLogin({
        username: username.trim(),
        password,
      });

      switch (result.status) {
        case "login_success": {
          if (!result.token || !result.admin) {
            setError(
              "The server returned an incomplete login response."
            );
            return;
          }

          // Store session information, never the password.
          localStorage.setItem("adminToken", result.token);
          localStorage.setItem(
            "admin",
            JSON.stringify(result.admin)
          );

          navigate("/admin/dashboard", { replace: true });
          break;
        }

        case "otp_required": {
          if (result.email) {
            localStorage.setItem(
              "adminVerifyEmail",
              result.email
            );
          }

          navigate("/admin/verify-otp");
          break;
        }

        case "invalid_credentials":
          setError("Invalid username or password.");
          break;

        case "account_inactive":
          setError(
            result.message ||
              "Your administrator account is inactive. Contact the GM."
          );
          break;

        case "missing_fields":
          setError("Please enter both username and password.");
          break;

        case "error":
          setError(
            result.message ||
              "A server error occurred. Please try again later."
          );
          break;

        case "network_error":
          setError(
            result.message ||
              "Unable to connect to the server. Please try again."
          );
          break;

        default:
          setError(
            result.message ||
              "Login failed. Please check your credentials and try again."
          );
      }
    } catch (err) {
      console.error("Admin login error:", err);
      setError("Unable to complete login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 text-white">
      {/* Background effects */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />

      {/* Login card */}
      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-7 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-10">
          {/* Logo */}
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-400/20 bg-cyan-400/10 text-4xl shadow-lg shadow-cyan-900/10">
              🛡️
            </div>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-cyan-400">
              DWJD Administration
            </p>

            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Welcome Back
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Sign in to access your authorized administration dashboard.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              role="alert"
              className="mt-6 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm leading-6 text-red-300"
            >
              <div className="flex items-start gap-3">
                <span className="text-lg">⚠️</span>
                <span>{error}</span>
              </div>
            </motion.div>
          )}

          {/* Login form */}
          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-sm font-semibold text-slate-300"
              >
                Username
              </label>

              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="Enter your username"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                disabled={loading}
                required
                className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-60"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-300"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  disabled={loading}
                  required
                  className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3.5 pr-20 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-cyan-400 transition hover:bg-white/5 hover:text-cyan-300"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-4 font-bold text-white shadow-lg shadow-blue-950/30 transition duration-300 hover:-translate-y-0.5 hover:shadow-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Footer actions */}
          <div className="mt-7 border-t border-white/10 pt-6">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="w-full rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-400 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
            >
              ← Back to Home
            </button>

            <p className="mt-6 text-center text-xs text-slate-600">
              © {new Date().getFullYear()} DWJD Administration Portal
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default GMLogin;