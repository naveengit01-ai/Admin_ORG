import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getAllAdmins, updateAdminStatus } from "../../api.js";

const RESPONSIBILITIES = [
  {
    value: "customersupport",
    label: "Customer Support",
    color: "border-blue-500/20 bg-blue-500/10 text-blue-400",
  },
  {
    value: "marketing",
    label: "Marketing",
    color: "border-purple-500/20 bg-purple-500/10 text-purple-400",
  },
  {
    value: "finance",
    label: "Finance",
    color: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  },
  {
    value: "operations",
    label: "Operations",
    color: "border-orange-500/20 bg-orange-500/10 text-orange-400",
  },
  {
    value: "hr",
    label: "Human Resources",
    color: "border-pink-500/20 bg-pink-500/10 text-pink-400",
  },
];

const getAdminId = (admin) => admin?._id || admin?.id || "";

const getAdminName = (admin) => {
  const fullName = [admin?.first_name, admin?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || admin?.username || "Unnamed Administrator";
};

const getInitials = (admin) => {
  const first = admin?.first_name?.trim()?.[0] || "";
  const last = admin?.last_name?.trim()?.[0] || "";
  return (
    (first + last).toUpperCase() ||
    admin?.username?.[0]?.toUpperCase() ||
    "A"
  );
};

const getAdminResponsibilities = (admin) => {
  const roles = Array.isArray(admin?.roles) ? admin.roles : [];
  const normalizedRoles = roles
    .map((role) => String(role).toLowerCase())
    .filter(Boolean);

  if (normalizedRoles.length) {
    return normalizedRoles.map((value) => {
      if (value === "gm") return { value, label: "General Manager" };
      if (value === "admin") return { value, label: "Administrator" };
      return (
        RESPONSIBILITIES.find((item) => item.value === value) || {
          value,
          label: value,
        }
      );
    });
  }

  const userType = String(admin?.user_type || "").toLowerCase();
  if (userType === "gm") return [{ value: "gm", label: "General Manager" }];
  if (userType === "admin") return [{ value: "admin", label: "Administrator" }];

  const responsibility = RESPONSIBILITIES.find(
    (item) => item.value === userType
  );

  return responsibility ? [responsibility] : [];
};

const getResponsibilityFilterValues = (admin) => {
  const roles = Array.isArray(admin?.roles) ? admin.roles : [];
  if (roles.length) return roles.map((role) => String(role).toLowerCase());
  return [String(admin?.user_type || "").toLowerCase()];
};

function AdminManagement() {
  const navigate = useNavigate();

  const [admins, setAdmins] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const token = localStorage.getItem("adminToken");

  const currentAdmin = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("admin") || "null");
    } catch {
      return null;
    }
  }, []);

  const isGM = String(currentAdmin?.user_type || "").toLowerCase() === "gm";

  const fetchAdmins = useCallback(
    async (isRefresh = false) => {
      if (!token || !isGM) {
        setLoading(false);
        return;
      }

      setError("");
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const result = await getAllAdmins();

        if (!result?.ok) {
          if (result?.httpStatus === 401 || result?.httpStatus === 403) {
            throw new Error(
              result.message ||
                "Your session is invalid or you are not authorized."
            );
          }
          throw new Error(
            result?.message || "Unable to load administrator accounts."
          );
        }

        const adminList = Array.isArray(result.admins)
          ? result.admins
          : Array.isArray(result.data)
            ? result.data
            : Array.isArray(result)
              ? result
              : null;

        if (!adminList) {
          throw new Error(
            "The server response does not contain an administrators list."
          );
        }

        setAdmins(adminList);
      } catch (err) {
        console.error("Fetch administrators error:", err);
        setError(err.message || "Unable to connect to the server. Please try again.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, isGM]
  );

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  // Activate or deactivate an administrator through the centralized API module.
  const handleStatusToggle = async (admin) => {
    const adminId = getAdminId(admin);

    if (!adminId) {
      setError("This administrator does not have a valid ID.");
      return;
    }

    const currentAdminId = String(currentAdmin?._id || currentAdmin?.id || "");
    if (String(adminId) === currentAdminId) {
      setError("You cannot deactivate your own administrator account.");
      return;
    }

    const nextStatus = admin.is_active !== true;
    const action = nextStatus ? "activate" : "deactivate";
    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${getAdminName(admin)}?`
    );

    if (!confirmed) return;

    setUpdatingId(String(adminId));
    setError("");
    setSuccess("");

    try {
      const result = await updateAdminStatus(adminId, nextStatus);

      if (!result?.ok) {
        throw new Error(result?.message || `Unable to ${action} this administrator.`);
      }

      setAdmins((previous) =>
        previous.map((item) =>
          String(getAdminId(item)) === String(adminId)
            ? { ...item, is_active: nextStatus }
            : item
        )
      );

      setSuccess(
        `${getAdminName(admin)} has been ${nextStatus ? "activated" : "deactivated"} successfully.`
      );
    } catch (err) {
      console.error("Update administrator status error:", err);
      setError(err.message || "Unable to update administrator status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredAdmins = useMemo(() => {
    const query = search.trim().toLowerCase();

    return admins.filter((admin) => {
      const searchableText = [
        admin.first_name,
        admin.last_name,
        admin.username,
        admin.email,
        admin.phone,
        ...(Array.isArray(admin.roles) ? admin.roles : []),
        admin.user_type,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(query);
      const roles = getResponsibilityFilterValues(admin);
      const matchesRole = roleFilter === "all" || roles.includes(roleFilter);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && admin.is_active === true) ||
        (statusFilter === "inactive" && admin.is_active !== true);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [admins, search, roleFilter, statusFilter]);

  const activeCount = admins.filter((admin) => admin.is_active === true).length;
  const inactiveCount = admins.length - activeCount;
  const verifiedCount = admins.filter((admin) => admin.is_verified === true).length;

  if (!token || !isGM) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-white">
        <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-slate-900 p-8 text-center shadow-2xl">
          <div className="text-5xl" aria-hidden="true">🔒</div>
          <h1 className="mt-5 text-2xl font-bold">Access Restricted</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            This page is available only to the General Manager. Please sign in
            using an authorized GM account.
          </p>
          <button
            onClick={() => navigate("/admin/login", { replace: true })}
            className="mt-6 rounded-xl bg-cyan-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-400"
          >
            Go to Admin Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080d19] px-4 py-6 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <motion.header
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center"
        >
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
                General Manager Portal
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Admin Management
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              View administrator accounts, assigned responsibilities, and
              account access status from one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
            >
              ← Dashboard
            </button>
            <button
              onClick={() => fetchAdmins(true)}
              disabled={refreshing}
              className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
            >
              <span className={refreshing ? "animate-spin" : ""}>↻</span>
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </motion.header>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            className="mt-6 flex items-start justify-between gap-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"
          >
            <span>{error}</span>
            <button
              onClick={() => setError("")}
              className="shrink-0 text-lg"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            role="status"
            className="mt-6 flex items-start justify-between gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300"
          >
            <span>✓ {success}</span>
            <button
              onClick={() => setSuccess("")}
              className="shrink-0 text-lg"
              aria-label="Dismiss success message"
            >
              ×
            </button>
          </motion.div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total Administrators", value: admins.length, icon: "👥", color: "text-cyan-400" },
            { label: "Active Accounts", value: activeCount, icon: "✓", color: "text-emerald-400" },
            { label: "Inactive Accounts", value: inactiveCount, icon: "⏸", color: "text-orange-400" },
            { label: "Verified Accounts", value: verifiedCount, icon: "🛡️", color: "text-purple-400" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="rounded-2xl border border-white/[0.08] bg-slate-900/70 p-5 transition hover:border-cyan-500/20"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">{stat.label}</span>
                <span className={`text-xl ${stat.color}`}>{stat.icon}</span>
              </div>
              <p className="mt-4 text-3xl font-black tracking-tight">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <section className="mt-8 rounded-2xl border border-white/[0.08] bg-slate-900/50 p-5 sm:p-6">
          <h2 className="text-lg font-bold">Administrator Responsibilities</h2>
          <p className="mt-1 text-sm text-slate-400">
            Responsibility categories assigned to administrators.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {RESPONSIBILITIES.map((role) => (
              <div
                key={role.value}
                className={`rounded-xl border px-4 py-3 text-sm font-semibold ${role.color}`}
              >
                {role.label}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-900/50">
          <div className="border-b border-white/[0.08] p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-xl font-bold">Administrator Accounts</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {filteredAdmins.length} account{filteredAdmins.length === 1 ? "" : "s"} found
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">⌕</span>
                  <input
                    type="search"
                    placeholder="Search administrators..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-600 focus:border-cyan-400 sm:w-64"
                  />
                </div>

                <select
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value)}
                  className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-300 outline-none focus:border-cyan-400"
                  aria-label="Filter by responsibility"
                >
                  <option value="all">All Responsibilities</option>
                  {RESPONSIBILITIES.map((role) => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                  <option value="gm">General Manager</option>
                  <option value="admin">Administrator</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-300 outline-none focus:border-cyan-400"
                  aria-label="Filter by account status"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-4">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400/20 border-t-cyan-400" />
              <p className="text-sm text-slate-400">Loading administrator accounts...</p>
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-5 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-3xl">👥</div>
              <h3 className="mt-5 text-lg font-bold">No administrators found</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
                {admins.length === 0
                  ? "Administrator accounts will appear here when they are available."
                  : "Try changing your search term or filters."}
              </p>
              {(search || roleFilter !== "all" || statusFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearch("");
                    setRoleFilter("all");
                    setStatusFilter("all");
                  }}
                  className="mt-5 rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/5"
                >
                  Clear Filters
                </button>
              )}
              {error && (
                <button
                  onClick={() => fetchAdmins()}
                  className="mt-3 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-400"
                >
                  Try Again
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead className="bg-slate-950/70 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Administrator</th>
                    <th className="px-6 py-4 font-semibold">Responsibility</th>
                    <th className="px-6 py-4 font-semibold">Verification</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold">Created</th>
                    <th className="px-6 py-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {filteredAdmins.map((admin, index) => {
                    const responsibilities = getAdminResponsibilities(admin);
                    const adminId = getAdminId(admin);
                    return (
                      <motion.tr
                        key={adminId || admin.username || index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: Math.min(index * 0.025, 0.3) }}
                        className="transition hover:bg-white/[0.025]"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-cyan-400/20 bg-cyan-400/10 font-bold text-cyan-300">
                              {admin.profile_image ? (
                                <img
                                  src={admin.profile_image}
                                  alt={getAdminName(admin)}
                                  className="h-full w-full object-cover"
                                />
                              ) : getInitials(admin)}
                            </div>
                            <div>
                              <p className="font-semibold text-white">{getAdminName(admin)}</p>
                              <p className="mt-1 text-xs text-slate-400">{admin.email || "No email available"}</p>
                              <p className="mt-1 text-xs text-slate-500">@{admin.username || "unknown"}</p>
                              {admin.phone && <p className="mt-1 text-xs text-slate-500">{admin.phone}</p>}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex max-w-xs flex-wrap gap-2">
                            {responsibilities.length ? responsibilities.map((role) => {
                              const knownRole = RESPONSIBILITIES.find((item) => item.value === role.value);
                              return (
                                <span
                                  key={role.value}
                                  className={`inline-flex rounded-lg border px-3 py-1.5 text-xs font-semibold ${knownRole?.color || "border-white/10 bg-white/5 text-slate-300"}`}
                                >
                                  {role.label}
                                </span>
                              );
                            }) : (
                              <span className="text-xs text-slate-500">Not assigned</span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center gap-2 text-xs font-semibold ${admin.is_verified ? "text-emerald-400" : "text-amber-400"}`}>
                            <span className={`h-2 w-2 rounded-full ${admin.is_verified ? "bg-emerald-400" : "bg-amber-400"}`} />
                            {admin.is_verified ? "Verified" : "Pending"}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold ${admin.is_active === true ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${admin.is_active === true ? "bg-emerald-400" : "bg-red-400"}`} />
                            {admin.is_active === true ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td className="px-6 py-5 text-xs text-slate-400">
                          {admin.createdAt
                            ? new Date(admin.createdAt).toLocaleDateString()
                            : "—"}
                        </td>

                        <td className="px-6 py-5 text-right">
                          <button
                            type="button"
                            onClick={() => handleStatusToggle(admin)}
                            disabled={
                              Boolean(updatingId) ||
                              String(adminId) === String(currentAdmin?._id || currentAdmin?.id || "")
                            }
                            className={`rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                              admin.is_active === true
                                ? "border border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                                : "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                            }`}
                          >
                            {updatingId === String(adminId)
                              ? "Updating..."
                              : admin.is_active === true
                                ? "Deactivate"
                                : "Activate"}
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="py-8 text-center text-xs text-slate-600">
          DWJD Administration Portal · Administrator Directory
        </footer>
      </div>
    </div>
  );
}

export default AdminManagement;
