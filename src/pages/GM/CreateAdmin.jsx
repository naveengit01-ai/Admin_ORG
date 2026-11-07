
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  UserPlus,
  User,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  Megaphone,
  Bike,
  Sparkles,
  KeyRound,
} from "lucide-react";

import { createAdminAccount } from "../../api.js";

// Available responsibilities
const RESPONSIBILITIES = [
  {
    value: "create_promotion",
    label: "Create Promotion",
    description: "Create and manage promotional campaigns.",
    icon: Megaphone,
  },
  {
    value: "create_rider",
    label: "Create Rider",
    description: "Manage rider account creation.",
    icon: Bike,
  },
];

const initialForm = {
  first_name: "",
  last_name: "",
  username: "",
  email: "",
  phone: "",
  role: "admin",
  responsibilities: [],
};

const ACCOUNT_ROLES = [
  {
    value: "gm",
    title: "General Manager",
    description:
      "Full access to all current and future responsibilities.",
  },
  {
    value: "admin",
    title: "Administrator",
    description:
      "Access only to responsibilities assigned by GM.",
  },
];

function CreateAdmin() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  const isGM = form.role === "gm";

  // Common input styling
  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pl-11 text-sm font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10";

  // Input fields
  const fields = [
    {
      name: "first_name",
      label: "First Name",
      icon: User,
      placeholder: "Enter first name",
      type: "text",
    },
    {
      name: "last_name",
      label: "Last Name",
      icon: User,
      placeholder: "Enter last name",
      type: "text",
    },
    {
      name: "username",
      label: "Username",
      icon: User,
      placeholder: "Enter username",
      type: "text",
    },
    {
      name: "email",
      label: "Email Address",
      icon: Mail,
      placeholder: "admin@example.com",
      type: "email",
    },
    {
      name: "phone",
      label: "Phone Number",
      icon: Phone,
      placeholder: "Enter phone number",
      type: "tel",
    },
  ];

  // Handle personal information
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    setMessage({ type: "", text: "" });
  };

  // Handle account role
  const handleRoleChange = (role) => {
    setForm((previous) => ({
      ...previous,
      role,
      responsibilities:
        role === "gm" ? [] : previous.responsibilities,
    }));

    setErrors({});
    setMessage({ type: "", text: "" });
  };

  // Handle responsibility selection
  const handleResponsibilityToggle = (value) => {
    setForm((previous) => ({
      ...previous,
      responsibilities:
        previous.responsibilities.includes(value)
          ? previous.responsibilities.filter(
              (item) => item !== value
            )
          : [...previous.responsibilities, value],
    }));

    setErrors((previous) => ({
      ...previous,
      responsibilities: "",
    }));

    setMessage({ type: "", text: "" });
  };

  // Validate form
  const validateForm = () => {
    const nextErrors = {};

    if (form.first_name.trim().length < 2) {
      nextErrors.first_name = "Enter a valid first name.";
    }

    if (form.last_name.trim().length < 2) {
      nextErrors.last_name = "Enter a valid last name.";
    }

    if (
      !/^[a-zA-Z0-9_.-]{3,30}$/.test(form.username.trim())
    ) {
      nextErrors.username =
        "Username must contain 3–30 valid characters.";
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ) {
      nextErrors.email = "Enter a valid email address.";
    }

    const normalizedPhone = form.phone.replace(
      /[\s()-]/g,
      ""
    );

    if (!/^\+?\d{10,15}$/.test(normalizedPhone)) {
      nextErrors.phone = "Enter a valid phone number.";
    }

    if (!["gm", "admin"].includes(form.role)) {
      nextErrors.role = "Select a valid account role.";
    }

    if (
      form.role === "admin" &&
      form.responsibilities.length === 0
    ) {
      nextErrors.responsibilities =
        "Select at least one responsibility.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  // Submit form
  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage({ type: "", text: "" });

    if (!validateForm()) return;

    const token = localStorage.getItem("adminToken");

    if (!token) {
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

        role: form.role,

        responsibilities: isGM
          ? []
          : form.responsibilities,
      };

      const result = await createAdminAccount(payload);

      if (result?.status === "admin_created") {
        setMessage({
          type: "success",
          text:
            result.message ||
            "Admin account created and credentials sent successfully.",
        });

        setForm({ ...initialForm });
        setErrors({});
      } else {
        setMessage({
          type: "error",
          text:
            result?.message ||
            "Unable to create administrator account.",
        });
      }
    } catch (error) {
      console.error("Create admin error:", error);

      setMessage({
        type: "error",
        text:
          error?.response?.data?.message ||
          error?.message ||
          "Unable to create administrator account.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setForm({ ...initialForm });
    setErrors({});
    setMessage({ type: "", text: "" });
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-8">

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto max-w-5xl"
      >

        {/* Back Button */}
        <button
          type="button"
          onClick={() => navigate("/admin/dashboard")}
          className="mb-7 flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-violet-700"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        {/* Page Heading */}
        <div className="mb-9 flex items-center gap-4">

          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
            <UserPlus size={29} />
          </div>

          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">
              Create Admin Account
            </h1>

            <p className="mt-1 text-sm text-slate-600">
              Create an account and assign responsibilities.
            </p>
          </div>

        </div>

        {/* Notification */}
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            className={`mb-7 flex items-start gap-3 rounded-xl border p-4 text-sm font-medium ${
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-red-200 bg-red-50 text-red-900"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2
                size={20}
                className="shrink-0 text-emerald-600"
              />
            ) : (
              <AlertCircle
                size={20}
                className="shrink-0 text-red-600"
              />
            )}

            <span>{message.text}</span>
          </motion.div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-7"
        >

          {/* =====================================
              PERSONAL INFORMATION
          ===================================== */}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

            <div className="mb-7 flex items-center gap-4">

              <div className="rounded-xl bg-violet-100 p-3 text-violet-700">
                <User size={22} />
              </div>

              <div>
                <h2 className="font-bold text-slate-950">
                  Personal Information
                </h2>

                <p className="mt-1 text-xs text-slate-600">
                  Enter administrator details.
                </p>
              </div>

            </div>

            <div className="grid gap-5 sm:grid-cols-2">

              {fields.map((field) => {
                const Icon = field.icon;

                return (
                  <div key={field.name}>

                    <label
                      htmlFor={field.name}
                      className="mb-2 block text-sm font-semibold text-slate-950"
                    >
                      {field.label} *
                    </label>

                    <div className="relative">

                      <Icon
                        size={18}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                      />

                      <input
                        id={field.name}
                        name={field.name}
                        type={field.type}
                        value={form[field.name]}
                        onChange={handleChange}
                        placeholder={field.placeholder}
                        autoComplete="off"
                        required
                        disabled={loading}
                        className={`${inputClass} ${
                          errors[field.name]
                            ? "border-red-400 focus:border-red-500"
                            : ""
                        }`}
                      />

                    </div>

                    {errors[field.name] && (
                      <p className="mt-1.5 text-xs font-medium text-red-600">
                        {errors[field.name]}
                      </p>
                    )}

                  </div>
                );
              })}

            </div>

          </section>

          {/* =====================================
              ACCOUNT ROLE
          ===================================== */}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

            <div className="mb-7 flex items-center gap-4">

              <div className="rounded-xl bg-violet-100 p-3 text-violet-700">
                <ShieldCheck size={22} />
              </div>

              <div>
                <h2 className="font-bold text-slate-950">
                  Account Role
                </h2>

                <p className="mt-1 text-xs text-slate-600">
                  Select the account type.
                </p>
              </div>

            </div>

            <div className="grid gap-4 sm:grid-cols-2">

              {ACCOUNT_ROLES.map((item) => {
                const selected = form.role === item.value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handleRoleChange(item.value)}
                    disabled={loading}
                    aria-pressed={selected}
                    className={`rounded-2xl border-2 p-5 text-left transition ${
                      selected
                        ? "border-violet-500 bg-violet-50"
                        : "border-slate-200 bg-white hover:border-violet-300"
                    }`}
                  >

                    <div className="flex items-center justify-between">

                      <ShieldCheck
                        size={25}
                        className={
                          selected
                            ? "text-violet-700"
                            : "text-slate-500"
                        }
                      />

                      {selected && (
                        <CheckCircle2
                          size={21}
                          className="text-violet-700"
                        />
                      )}

                    </div>

                    <h3 className="mt-5 font-bold text-slate-950">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {item.description}
                    </p>

                    <span
                      className={`mt-4 inline-block rounded-full px-3 py-1 text-[10px] font-bold ${
                        selected
                          ? "bg-violet-100 text-violet-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {selected ? "SELECTED" : "CLICK TO SELECT"}
                    </span>

                  </button>
                );
              })}

            </div>

            {errors.role && (
              <p className="mt-3 text-xs font-medium text-red-600">
                {errors.role}
              </p>
            )}

          </section>

          {/* =====================================
              RESPONSIBILITIES
          ===================================== */}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

            <div className="mb-7 flex items-center gap-4">

              <div className="rounded-xl bg-violet-100 p-3 text-violet-700">
                <Sparkles size={22} />
              </div>

              <div>
                <h2 className="font-bold text-slate-950">
                  Responsibilities
                </h2>

                <p className="mt-1 text-xs text-slate-600">
                  Assign specific access to this administrator.
                </p>
              </div>

            </div>

            {/* GM automatically gets full access */}
            {isGM ? (

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">

                <div className="flex items-start gap-3">

                  <CheckCircle2
                    size={24}
                    className="shrink-0 text-emerald-700"
                  />

                  <div>

                    <h3 className="font-bold text-emerald-950">
                      Full Access
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-emerald-900">
                      General Manager automatically receives access
                      to all current and future responsibilities.
                      Individual assignment is not required.
                    </p>

                  </div>

                </div>

              </div>

            ) : (

              <>

                <div className="mb-6 rounded-2xl border border-violet-200 bg-violet-50 p-5">

                  <div className="flex items-center gap-2">

                    <Sparkles
                      size={20}
                      className="text-violet-700"
                    />

                    <h3 className="font-bold text-violet-950">
                      Multiple Responsibility Assignment
                    </h3>

                  </div>

                  <p className="mt-2 text-sm leading-6 text-violet-900">
                    Select every responsibility this administrator
                    needs. Click a selected responsibility again
                    to remove it.
                  </p>

                </div>

                <div className="mb-5 flex items-center justify-between">

                  <h3 className="text-sm font-bold text-slate-950">
                    Available Responsibilities
                  </h3>

                  <span className="rounded-full bg-violet-100 px-3 py-1.5 text-xs font-bold text-violet-800">
                    {form.responsibilities.length} Selected
                  </span>

                </div>

                <div className="grid gap-4 sm:grid-cols-2">

                  {RESPONSIBILITIES.map((item) => {
                    const Icon = item.icon;

                    const selected =
                      form.responsibilities.includes(item.value);

                    return (

                      <button
                        key={item.value}
                        type="button"
                        onClick={() =>
                          handleResponsibilityToggle(item.value)
                        }
                        disabled={loading}
                        aria-pressed={selected}
                        className={`flex items-start gap-4 rounded-2xl border-2 p-5 text-left transition ${
                          selected
                            ? "border-violet-500 bg-violet-50"
                            : "border-slate-200 bg-white hover:border-violet-300"
                        }`}
                      >

                        <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
                          <Icon size={23} />
                        </div>

                        <div className="min-w-0 flex-1">

                          <h3 className="font-bold text-slate-950">
                            {item.label}
                          </h3>

                          <p className="mt-2 text-sm leading-5 text-slate-700">
                            {item.description}
                          </p>

                          <span
                            className={`mt-3 inline-block rounded-full px-3 py-1 text-[10px] font-bold ${
                              selected
                                ? "bg-violet-100 text-violet-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {selected
                              ? "SELECTED"
                              : "CLICK TO SELECT"}
                          </span>

                        </div>

                        {selected && (
                          <CheckCircle2
                            size={21}
                            className="shrink-0 text-violet-700"
                          />
                        )}

                      </button>

                    );
                  })}

                </div>

                {errors.responsibilities && (
                  <p className="mt-3 text-sm font-medium text-red-600">
                    {errors.responsibilities}
                  </p>
                )}

              </>

            )}

          </section>

          {/* =====================================
              ACCOUNT SECURITY
          ===================================== */}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

            <div className="mb-6 flex items-center gap-4">

              <div className="rounded-xl bg-violet-100 p-3 text-violet-700">
                <KeyRound size={22} />
              </div>

              <div>
                <h2 className="font-bold text-slate-950">
                  Account Security
                </h2>

                <p className="mt-1 text-xs text-slate-600">
                  Create secure login credentials automatically.
                </p>
              </div>

            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">

              <div className="flex items-start gap-3">

                <CheckCircle2
                  size={23}
                  className="shrink-0 text-emerald-700"
                />

                <div>

                  <h3 className="font-bold text-emerald-950">
                    Automatic Password Generation
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-emerald-900">
                    A secure temporary password will be generated
                    automatically and sent to the administrator's
                    registered email address after account creation.
                  </p>

                  <p className="mt-2 text-xs font-bold text-emerald-800">
                    Password change is mandatory after the first login.
                  </p>

                </div>

              </div>

            </div>

          </section>

          {/* =====================================
              FORM ACTIONS
          ===================================== */}

          <div className="flex flex-col-reverse justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row">

            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-100 disabled:opacity-50"
            >
              Reset Form
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {loading ? (
                <>
                  <LoaderCircle
                    size={19}
                    className="animate-spin"
                  />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus size={19} />
                  Create Admin Account
                </>
              )}

            </button>

          </div>

        </form>

      </motion.div>

    </div>
  );
}

export default CreateAdmin;
