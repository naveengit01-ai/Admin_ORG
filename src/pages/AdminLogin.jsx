import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../api";

function AdminLogin() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username || !formData.password) {
      alert("Please enter username and password");
      return;
    }

    try {
      setLoading(true);

      const result = await adminLogin({
        username: formData.username,
        password: formData.password,
      });

      console.log("Admin Login Response:", result);

      // ==============================
      // INVALID CREDENTIALS
      // ==============================

      if (result?.status === "invalid_credentials") {
        alert(result.message || "Invalid username or password");
        return;
      }

      // ==============================
      // ACCOUNT INACTIVE
      // ==============================

      if (result?.status === "account_inactive") {
        alert(result.message || "Admin account is inactive");
        return;
      }

      // ==============================
      // OTP REQUIRED
      // ==============================

      if (result?.status === "otp_required") {
        localStorage.setItem(
          "adminVerifyEmail",
          result.email
        );

        navigate("/admin/verify-otp");
        return;
      }

      // ==============================
      // LOGIN SUCCESS
      // ==============================

      if (result?.status === "login_success") {
        localStorage.setItem(
          "adminToken",
          result.token
        );

        localStorage.setItem(
          "admin",
          JSON.stringify(result.admin)
        );

        navigate("/admin/dashboard");
        return;
      }

      // ==============================
      // SERVER / UNKNOWN ERROR
      // ==============================

      alert(
        result?.message ||
        "Admin login failed"
      );

    } catch (error) {
      console.error("Admin Login Error:", error);

      alert("Something went wrong during login");

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">

      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">

        <h1 className="text-3xl font-bold text-center text-slate-900">
          Admin Login
        </h1>

        <p className="mt-2 text-center text-slate-500">
          DWJD Administration Portal
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5"
        >

          {/* Username */}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Username
            </label>

            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter admin username"
              autoComplete="username"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>

          {/* Password */}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>

            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>

          {/* Button */}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Admin Login"}
          </button>

        </form>

      </div>

    </div>
  );
}

export default AdminLogin;