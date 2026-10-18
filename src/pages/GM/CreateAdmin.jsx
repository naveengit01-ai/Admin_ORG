import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  UserPlus,
  User,
  Mail,
  Phone,
  LockKeyhole,
  Eye,
  EyeOff,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  AtSign,
  RotateCcw,
  UserRound,
  KeyRound,
  Building2,
  Sparkles,
} from "lucide-react";

import { createAdminAccount } from "../../api.js";

// --------------------------------------------------
// ALLOWED ADMIN ROLES
// These values must match the backend Mongoose enum.
// --------------------------------------------------
const roles = [
  {
    value: "gm",
    label: "General Manager",
    description: "General management and business oversight.",
  },
  {
    value: "customersupport",
    label: "Customer Support",
    description: "Customer queries and support operations.",
  },
  {
    value: "marketing",
    label: "Marketing",
    description: "Marketing campaigns and brand activities.",
  },
  {
    value: "finance",
    label: "Finance",
    description: "Financial operations and reporting.",
  },
  {
    value: "operations",
    label: "Operations",
    description: "Daily business and operational activities.",
  },
  {
    value: "hr",
    label: "Human Resources",
    description: "Human resources and employee management.",
  },
  {
    value: "admin",
    label: "Administrator",
    description: "Administrative responsibilities.",
  },
];

const initialForm = {
  first_name: "",
  last_name: "",
  username: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  roles: ["customersupport"],
};

const initialErrors = {
  first_name: "",
  last_name: "",
  username: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  role: "",
};

const pageVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
    },
  },
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10";

const labelClass = "mb-2 block text-sm font-semibold text-slate-700";

const iconClass =
  "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400";

function FieldError({ children }) {
  if (!children) return null;

  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
      <AlertCircle size={13} />
      {children}
    </p>
  );
}

function SectionHeading({ icon: Icon, title, description }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
        <Icon size={21} />
      </div>

      <div>
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>
    </div>
  );
}

export default function CreateAdmin() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState(initialErrors);
  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const selectedRoles = roles.filter((role) => form.roles.includes(role.value));

  // --------------------------------------------------
  // MULTIPLE ROLE SELECTION
  // --------------------------------------------------
  const handleRoleToggle = (roleValue) => {
    setForm((previous) => {
      const alreadySelected = previous.roles.includes(roleValue);
      return {
        ...previous,
        roles: alreadySelected
          ? previous.roles.filter((role) => role !== roleValue)
          : [...previous.roles, roleValue],
      };
    });
    setErrors((previous) => ({ ...previous, role: "" }));
    setMessage({ type: "", text: "" });
  };

  // --------------------------------------------------
  // FORM FIELD UPDATE
  // --------------------------------------------------
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
      ...(name === "password" ? { confirmPassword: "" } : {}),
    }));

    setMessage({
      type: "",
      text: "",
    });
  };

  // --------------------------------------------------
  // VALIDATION
  // --------------------------------------------------
  const validateForm = () => {
    const nextErrors = { ...initialErrors };

    const firstName = form.first_name.trim();
    const lastName = form.last_name.trim();
    const username = form.username.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();

    if (!firstName) {
      nextErrors.first_name = "First name is required.";
    } else if (firstName.length < 2) {
      nextErrors.first_name = "First name must contain at least 2 characters.";
    }

    if (!lastName) {
      nextErrors.last_name = "Last name is required.";
    } else if (lastName.length < 2) {
      nextErrors.last_name = "Last name must contain at least 2 characters.";
    }

    if (!username) {
      nextErrors.username = "Username is required.";
    } else if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(username)) {
      nextErrors.username =
        "Use 3–30 letters, numbers, dots, underscores, or hyphens.";
    }

    if (!email) {
      nextErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    const normalizedPhone = phone.replace(/[\s()-]/g, "");

    if (!phone) {
      nextErrors.phone = "Phone number is required.";
    } else if (!/^\+?\d{10,15}$/.test(normalizedPhone)) {
      nextErrors.phone =
        "Enter a valid phone number containing 10–15 digits.";
    }

    if (!form.password) {
      nextErrors.password = "Password is required.";
    } else if (form.password.length < 8) {
      nextErrors.password = "Password must contain at least 8 characters.";
    } else if (
      !/[A-Za-z]/.test(form.password) ||
      !/\d/.test(form.password)
    ) {
      nextErrors.password =
        "Password must contain at least one letter and one number.";
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your password.";
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    // Require at least one valid role from the allowed list.
    if (!Array.isArray(form.roles) || form.roles.length === 0) {
      nextErrors.role = "Please select at least one role.";
    } else if (
      !form.roles.every((selectedRole) =>
        roles.some((role) => role.value === selectedRole)
      )
    ) {
      nextErrors.role = "One or more selected roles are invalid.";
    }

    setErrors(nextErrors);

    return !Object.values(nextErrors).some(Boolean);
  };

  // --------------------------------------------------
  // CREATE ADMIN
  // --------------------------------------------------
  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage({
      type: "",
      text: "",
    });

    if (!validateForm()) {
      setMessage({
        type: "error",
        text: "Please correct the highlighted fields.",
      });

      return;
    }

    const adminToken = localStorage.getItem("adminToken");

    if (!adminToken) {
      setMessage({
        type: "error",
        text: "Your session has expired. Please log in again.",
      });

      return;
    }

    setLoading(true);

    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        username: form.username.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        user_type: "admin",
        roles: form.roles,
        profile_image: "",
      };

      const result = await createAdminAccount(payload);

      if (result?.ok) {
        setMessage({
          type: "success",
          text: result.message || "Admin account created successfully!",
        });

        setForm(initialForm);
        setErrors(initialErrors);

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } else {
        setMessage({
          type: "error",
          text:
            result?.message ||
            result?.error ||
            "Unable to create the admin account. Please try again.",
        });
      }
    } catch (error) {
      console.error("Create admin error:", error);

      setMessage({
        type: "error",
        text: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // RESET FORM
  // --------------------------------------------------
  const handleReset = () => {
    if (loading) return;

    setForm(initialForm);
    setErrors(initialErrors);

    setMessage({
      type: "",
      text: "",
    });
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-6xl"
      >
        {/* HEADER */}
        <motion.div
          variants={itemVariants}
          className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center"
        >
          <div>
            <button
              type="button"
              onClick={() => navigate("/admin/dashboard")}
              className="mb-5 inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-slate-500 transition hover:text-violet-700"
            >
              <ArrowLeft size={17} />
              Back to Dashboard
            </button>

            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20">
                <UserPlus size={27} />
              </div>

              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  Create Admin Account
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Create an administrator account and assign a role.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 sm:self-center">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />

            <span className="text-xs font-bold text-emerald-700">
              Admin Management
            </span>
          </div>
        </motion.div>

        {/* MESSAGE */}
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            role="status"
            aria-live="polite"
            className={`mb-6 flex items-start gap-3 rounded-2xl border p-4 ${
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="mt-0.5 shrink-0" size={20} />
            ) : (
              <AlertCircle className="mt-0.5 shrink-0" size={20} />
            )}

            <div className="flex-1 text-sm font-medium">{message.text}</div>

            <button
              type="button"
              aria-label="Dismiss message"
              onClick={() => setMessage({ type: "", text: "" })}
              className="text-lg leading-none opacity-60 hover:opacity-100"
            >
              ×
            </button>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 gap-7 lg:grid-cols-3">
            {/* MAIN FORM */}
            <motion.div
              variants={itemVariants}
              className="space-y-7 lg:col-span-2"
            >
              {/* PERSONAL INFORMATION */}
              <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-8">
                <SectionHeading
                  icon={UserRound}
                  title="Personal Information"
                  description="Enter the administrator's basic information."
                />

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* FIRST NAME */}
                  <div>
                    <label htmlFor="first_name" className={labelClass}>
                      First Name <span className="text-red-500">*</span>
                    </label>

                    <div className="relative">
                      <User size={18} className={iconClass} />

                      <input
                        id="first_name"
                        name="first_name"
                        type="text"
                        autoComplete="given-name"
                        placeholder="Enter first name"
                        value={form.first_name}
                        onChange={handleChange}
                        className={`${inputClass} pl-11 ${
                          errors.first_name ? "border-red-400" : ""
                        }`}
                        aria-invalid={Boolean(errors.first_name)}
                      />
                    </div>

                    <FieldError>{errors.first_name}</FieldError>
                  </div>

                  {/* LAST NAME */}
                  <div>
                    <label htmlFor="last_name" className={labelClass}>
                      Last Name <span className="text-red-500">*</span>
                    </label>

                    <div className="relative">
                      <User size={18} className={iconClass} />

                      <input
                        id="last_name"
                        name="last_name"
                        type="text"
                        autoComplete="family-name"
                        placeholder="Enter last name"
                        value={form.last_name}
                        onChange={handleChange}
                        className={`${inputClass} pl-11 ${
                          errors.last_name ? "border-red-400" : ""
                        }`}
                        aria-invalid={Boolean(errors.last_name)}
                      />
                    </div>

                    <FieldError>{errors.last_name}</FieldError>
                  </div>

                  {/* USERNAME */}
                  <div>
                    <label htmlFor="username" className={labelClass}>
                      Username <span className="text-red-500">*</span>
                    </label>

                    <div className="relative">
                      <AtSign size={18} className={iconClass} />

                      <input
                        id="username"
                        name="username"
                        type="text"
                        autoComplete="username"
                        placeholder="Choose a username"
                        value={form.username}
                        onChange={handleChange}
                        className={`${inputClass} pl-11 ${
                          errors.username ? "border-red-400" : ""
                        }`}
                        aria-invalid={Boolean(errors.username)}
                      />
                    </div>

                    <FieldError>{errors.username}</FieldError>
                  </div>

                  {/* EMAIL */}
                  <div>
                    <label htmlFor="email" className={labelClass}>
                      Email Address <span className="text-red-500">*</span>
                    </label>

                    <div className="relative">
                      <Mail size={18} className={iconClass} />

                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="admin@example.com"
                        value={form.email}
                        onChange={handleChange}
                        className={`${inputClass} pl-11 ${
                          errors.email ? "border-red-400" : ""
                        }`}
                        aria-invalid={Boolean(errors.email)}
                      />
                    </div>

                    <FieldError>{errors.email}</FieldError>
                  </div>

                  {/* PHONE */}
                  <div className="sm:col-span-2">
                    <label htmlFor="phone" className={labelClass}>
                      Phone Number <span className="text-red-500">*</span>
                    </label>

                    <div className="relative">
                      <Phone size={18} className={iconClass} />

                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        placeholder="Enter phone number"
                        value={form.phone}
                        onChange={handleChange}
                        className={`${inputClass} pl-11 ${
                          errors.phone ? "border-red-400" : ""
                        }`}
                        aria-invalid={Boolean(errors.phone)}
                      />
                    </div>

                    <FieldError>{errors.phone}</FieldError>
                  </div>
                </div>
              </section>

              {/* ROLE AND PERMISSIONS */}
              <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-8">
                <SectionHeading
                  icon={ShieldCheck}
                  title="Role & Permissions"
                  description="Select one or more roles for this administrator."
                />

                <div className="mb-5 rounded-2xl border border-violet-100 bg-violet-50/70 p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles size={20} className="mt-0.5 shrink-0 text-violet-600" />
                    <div>
                      <p className="text-sm font-bold text-violet-950">Multiple Role Assignment</p>
                      <p className="mt-1 text-xs leading-5 text-violet-800">
                        Select every role this administrator needs. Click a selected role again to remove it.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-slate-700">Available Roles</h3>
                  <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
                    {form.roles.length} Selected
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {roles.map((role) => {
                    const selected = form.roles.includes(role.value);
                    return (
                      <motion.button
                        key={role.value}
                        type="button"
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleRoleToggle(role.value)}
                        aria-pressed={selected}
                        className={`relative flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all ${
                          selected
                            ? "border-violet-500 bg-violet-50 shadow-md shadow-violet-500/10"
                            : "border-slate-200 bg-white hover:border-violet-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          selected ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-500"
                        }`}>
                          <ShieldCheck size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-900">{role.label}</p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">{role.description}</p>
                          <span className={`mt-3 inline-block rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            selected ? "bg-violet-200 text-violet-800" : "bg-slate-100 text-slate-500"
                          }`}>
                            {selected ? "SELECTED" : "CLICK TO SELECT"}
                          </span>
                        </div>
                        <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                          selected ? "border-violet-600 bg-violet-600 text-white" : "border-slate-300 bg-white"
                        }`}>
                          {selected && <CheckCircle2 size={15} />}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                <FieldError>{errors.role}</FieldError>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="mb-3 text-sm font-bold text-slate-800">Selected Roles</h3>
                  {selectedRoles.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedRoles.map((role) => (
                        <span key={role.value} className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-3 py-2 text-xs font-bold text-violet-800">
                          <CheckCircle2 size={14} />
                          {role.label}
                          <button
                            type="button"
                            onClick={() => handleRoleToggle(role.value)}
                            aria-label={`Remove ${role.label}`}
                            className="ml-1 text-violet-500 hover:text-red-600"
                          >×</button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-red-600">Please select at least one role.</p>
                  )}
                </div>

                <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
                  <p className="text-xs leading-5 text-amber-800">
                    The backend must validate every assigned role and enforce the appropriate permissions. Frontend selection alone does not provide access control.
                  </p>
                </div>
              </section>

              {/* PASSWORD */}
              <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-8">
                <SectionHeading
                  icon={KeyRound}
                  title="Account Security"
                  description="Create secure login credentials for this account."
                />

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* PASSWORD */}
                  <div>
                    <label htmlFor="password" className={labelClass}>
                      Password <span className="text-red-500">*</span>
                    </label>

                    <div className="relative">
                      <LockKeyhole size={18} className={iconClass} />

                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Create a password"
                        value={form.password}
                        onChange={handleChange}
                        className={`${inputClass} pl-11 pr-11 ${
                          errors.password ? "border-red-400" : ""
                        }`}
                        aria-invalid={Boolean(errors.password)}
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((previous) => !previous)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-violet-600"
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>

                    <FieldError>{errors.password}</FieldError>

                    <p className="mt-2 text-xs text-slate-400">
                      Minimum 8 characters, including a letter and a number.
                    </p>
                  </div>

                  {/* CONFIRM PASSWORD */}
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className={labelClass}
                    >
                      Confirm Password{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <div className="relative">
                      <LockKeyhole size={18} className={iconClass} />

                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Re-enter password"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        className={`${inputClass} pl-11 pr-11 ${
                          errors.confirmPassword ? "border-red-400" : ""
                        }`}
                        aria-invalid={Boolean(errors.confirmPassword)}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword((previous) => !previous)
                        }
                        aria-label={
                          showConfirmPassword
                            ? "Hide confirm password"
                            : "Show confirm password"
                        }
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-violet-600"
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>

                    <FieldError>{errors.confirmPassword}</FieldError>
                  </div>
                </div>
              </section>
            </motion.div>

            {/* RIGHT SIDEBAR */}
            <motion.aside
              variants={itemVariants}
              className="space-y-6 lg:col-span-1"
            >
              {/* ACCOUNT SUMMARY */}
              <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
                <div className="bg-gradient-to-br from-violet-700 via-violet-600 to-indigo-600 p-6 text-white">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/15">
                      <UserPlus size={24} />
                    </div>

                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider">
                      New Account
                    </span>
                  </div>

                  <h2 className="text-xl font-black">Account Preview</h2>

                  <p className="mt-1 text-sm leading-6 text-violet-100">
                    Review the administrator details before submitting.
                  </p>
                </div>

                <div className="space-y-5 p-6">
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Administrator Name
                    </p>

                    <p className="break-words font-bold text-slate-900">
                      {[form.first_name.trim(), form.last_name.trim()]
                        .filter(Boolean)
                        .join(" ") || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Username
                    </p>

                    <p className="break-all text-sm font-medium text-slate-700">
                      {form.username.trim() || "Not provided"}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Email Address
                    </p>

                    <p className="break-all text-sm font-medium text-slate-700">
                      {form.email.trim() || "Not provided"}
                    </p>
                  </div>

                  <div className="border-t border-slate-100 pt-5">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Assigned Roles
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedRoles.length > 0 ? (
                        selectedRoles.map((role) => (
                          <span key={role.value} className="rounded-full bg-violet-100 px-3 py-2 text-xs font-bold text-violet-800">
                            {role.label}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-400">No roles selected</span>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-5">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Form Completion
                    </p>

                    {(() => {
                      const requiredFields = [
                        form.first_name,
                        form.last_name,
                        form.username,
                        form.email,
                        form.phone,
                        form.password,
                        form.confirmPassword,
                        form.roles.length > 0 ? "selected" : "",
                      ];

                      const completed = requiredFields.filter((value) =>
                        String(value).trim()
                      ).length;

                      const percentage = Math.round(
                        (completed / requiredFields.length) * 100
                      );

                      return (
                        <>
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-700">
                              {percentage}%
                            </span>

                            <span className="text-xs text-slate-400">
                              {completed} of {requiredFields.length} fields
                            </span>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <motion.div
                              className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500"
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </section>

              {/* ROLE INFORMATION */}
              <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Building2 size={20} />
                  </div>

                  <h3 className="font-bold text-slate-900">
                    Available Roles
                  </h3>
                </div>

                <div className="space-y-3">
                  {roles.map((role) => {
                    const selected = form.roles.includes(role.value);

                    return (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => handleRoleToggle(role.value)}
                        className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                          selected
                            ? "border-violet-300 bg-violet-50"
                            : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            selected
                              ? "bg-violet-600 text-white"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <ShieldCheck size={16} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm font-bold ${
                              selected ? "text-violet-900" : "text-slate-700"
                            }`}
                          >
                            {role.label}
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {role.description}
                          </p>
                        </div>

                        {selected && (
                          <CheckCircle2
                            size={17}
                            className="mt-1 shrink-0 text-violet-600"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* SECURITY NOTICE */}
              <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <div className="mb-2 flex items-center gap-2 text-amber-800">
                  <ShieldCheck size={19} />

                  <h3 className="text-sm font-bold">Security Reminder</h3>
                </div>

                <p className="text-xs leading-6 text-amber-800">
                  Only authorized administrators should create new accounts.
                  The server must verify authorization and securely hash
                  passwords before storing them.
                </p>
              </section>
            </motion.aside>
          </div>

          {/* FORM ACTIONS */}
          <motion.div
            variants={itemVariants}
            className="mt-8 flex flex-col-reverse gap-3 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6"
          >
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw size={17} />
              Reset Form
            </button>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate("/admin/dashboard")}
                disabled={loading}
                className="rounded-xl px-5 py-3 text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <motion.button
                type="submit"
                whileHover={loading ? undefined : { y: -2 }}
                whileTap={loading ? undefined : { scale: 0.98 }}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-violet-600/20 transition hover:from-violet-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <LoaderCircle size={18} className="animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    Create Admin Account
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}