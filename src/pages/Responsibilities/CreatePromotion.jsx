import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BASE_URL } from "../../api.js";

const INITIAL_FORM = {
  brand_name: "",
  company_name: "",
  contact_person: "",
  contact_email: "",
  contact_phone: "",
  company_website: "",
  title: "",
  description: "",
  promotion_type: "banner",
  image_url: "",
  video_url: "",
  target_url: "",
  placement: "home_page",
  start_date: "",
  end_date: "",
  amount_paid: "",
  currency: "INR",
  payment_status: "pending",
  payment_reference: "",
  collaboration_type: "paid_promotion",
};

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50";

const labelClass = "block text-sm font-semibold text-slate-700";

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const money = (amount, currency = "INR") => {
  const value = Number(amount);

  if (!Number.isFinite(value)) return "—";

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString("en-IN")}`;
  }
};

const readResponse = async (response) => {
  const text = await response.text();

  let result = {};

  try {
    result = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      `The server returned a non-JSON response (HTTP ${response.status}).`
    );
  }

  if (!response.ok) {
    throw new Error(
      result.message ||
        result.error ||
        `Request failed (HTTP ${response.status}).`
    );
  }

  return result;
};

const getItems = (result) => {
  if (Array.isArray(result.advertisements)) {
    return result.advertisements;
  }

  if (Array.isArray(result.ads)) {
    return result.ads;
  }

  if (Array.isArray(result.data?.advertisements)) {
    return result.data.advertisements;
  }

  if (Array.isArray(result.data?.ads)) {
    return result.data.ads;
  }

  if (Array.isArray(result.data)) {
    return result.data;
  }

  if (Array.isArray(result.results)) {
    return result.results;
  }

  return [];
};

const statusStyle = (status) => {
  switch (status) {
    case "approved":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";

    case "rejected":
      return "bg-rose-50 text-rose-700 ring-rose-200";

    case "completed":
      return "bg-slate-100 text-slate-600 ring-slate-200";

    default:
      return "bg-amber-50 text-amber-700 ring-amber-200";
  }
};

function Field({ label, required, children, className = "" }) {
  return (
    <label className={`${labelClass} ${className}`}>
      {label}

      {required && <span className="ml-1 text-rose-500">*</span>}

      {children}
    </label>
  );
}

function Metric({ label, value, hint, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            {label}
          </p>

          <p className="mt-3 text-2xl font-black tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">{hint}</p>
        </div>

        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-xl text-indigo-600">
          {icon}
        </span>
      </div>
    </div>
  );
}

export default function CreatePromotion() {
  const token = localStorage.getItem("adminToken");

  const [form, setForm] = useState(INITIAL_FORM);
  const [ads, setAds] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Rejection modal state
  const [selectedAd, setSelectedAd] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [reviewingId, setReviewingId] = useState(null);

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token || ""}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    }),
    [token]
  );

  // --------------------------------------------------
  // LOAD PROMOTIONS
  // --------------------------------------------------

  const loadAds = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      if (!token) {
        throw new Error(
          "Your admin session is missing. Please sign in again."
        );
      }

      const response = await fetch(
        `${BASE_URL}/admin/advertisements`,
        {
          method: "GET",
          headers: authHeaders,
        }
      );

      const result = await readResponse(response);

      setAds(getItems(result));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, token]);

  useEffect(() => {
    loadAds();
  }, [loadAds]);

  // --------------------------------------------------
  // FORM HANDLING
  // --------------------------------------------------

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
  };

  // --------------------------------------------------
  // CREATE PROMOTION
  // --------------------------------------------------

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setNotice("");

    const start = new Date(form.start_date);
    const end = new Date(form.end_date);
    const amount = Number(form.amount_paid);

    if (
      !form.start_date ||
      !form.end_date ||
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      setError("Please enter valid campaign dates.");
      return;
    }

    if (end <= start) {
      setError("End date must be after the start date.");
      return;
    }

    if (form.amount_paid === "" || !Number.isFinite(amount) || amount < 0) {
      setError("Enter a valid campaign amount.");
      return;
    }

    if (!token) {
      setError("Your admin session is missing. Please sign in again.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...form,
        amount_paid: amount,

        start_date: start.toISOString(),
        end_date: end.toISOString(),

        // All new campaigns require approval.
        status: "pending",
        rejection_reason: "",
        is_active: false,

        // Do not trust a client-submitted paid status.
        payment_status: "pending",
      };

      const response = await fetch(
        `${BASE_URL}/admin/advertisements`,
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify(payload),
        }
      );

      const result = await readResponse(response);

      setNotice(
        result.message || "Promotion created successfully."
      );

      resetForm();
      setShowForm(false);

      await loadAds();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // ACCEPT PROMOTION
  // --------------------------------------------------

  const approvePromotion = async (ad) => {
    const id = ad._id || ad.id;

    if (!id) {
      setError("Promotion database ID is missing.");
      return;
    }

    if (ad.status === "completed") {
      setError("Completed promotions cannot be approved again.");
      return;
    }

    const defaultAmount = ad.approved_amount ?? ad.amount_paid ?? "";
    const amountInput = window.prompt(
      `Enter the approved campaign amount in INR for "${ad.title || ad.brand_name}":`,
      String(defaultAmount)
    );
    if (amountInput === null) return;
    const approvedAmount = Number(amountInput);
    if (!Number.isFinite(approvedAmount) || approvedAmount <= 0) {
      setError("Approved amount must be a number greater than zero.");
      return;
    }
    const confirmed = window.confirm(
      `Approve this promotion for ${money(approvedAmount, "INR")} and require payment before activation?`
    );
    if (!confirmed) return;

    setError("");
    setNotice("");
    setReviewingId(id);

    try {
      const response = await fetch(
        `${BASE_URL}/admin/advertisements/${encodeURIComponent(id)}/approve`,
        {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({ approved_amount: approvedAmount, currency: "INR" }),
        }
      );

      const result = await readResponse(response);

      setNotice(
        result.message || "Promotion approved. Generate a payment link next."
      );

      await loadAds();
    } catch (err) {
      setError(
        `${err.message} Confirm that PATCH /admin/advertisements/:id/approve exists in your backend.`
      );
    } finally {
      setReviewingId(null);
    }
  };

  // --------------------------------------------------
  // OPEN REJECTION MODAL
  // --------------------------------------------------

  const openRejectModal = (ad) => {
    setError("");
    setNotice("");

    setSelectedAd(ad);
    setRejectionReason(ad.rejection_reason || "");
  };

  const closeRejectModal = () => {
    if (reviewingId) return;

    setSelectedAd(null);
    setRejectionReason("");
  };

  // --------------------------------------------------
  // REJECT PROMOTION WITH REASON
  // --------------------------------------------------

  const rejectPromotion = async (event) => {
    event.preventDefault();

    if (!selectedAd) return;

    const id = selectedAd._id || selectedAd.id;

    if (!id) {
      setError("Promotion database ID is missing.");
      return;
    }

    const reason = rejectionReason.trim();

    if (!reason) {
      setError("Please provide a rejection reason.");
      return;
    }

    if (reason.length < 5) {
      setError("The rejection reason must contain at least 5 characters.");
      return;
    }

    if (selectedAd.status === "completed") {
      setError("Completed promotions cannot be rejected.");
      return;
    }

    setError("");
    setNotice("");
    setReviewingId(id);

    try {
      const response = await fetch(
        `${BASE_URL}/admin/advertisements/${encodeURIComponent(id)}/reject`,
        {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({
            rejection_reason: reason,
          }),
        }
      );

      const result = await readResponse(response);

      setNotice(
        result.message || "Promotion rejected successfully."
      );

      setSelectedAd(null);
      setRejectionReason("");

      await loadAds();
    } catch (err) {
      setError(
        `${err.message} Confirm that PATCH /admin/advertisements/:id/reject exists in your backend.`
      );
    } finally {
      setReviewingId(null);
    }
  };

  // --------------------------------------------------
  // GENERATE RAZORPAY PAYMENT LINK
  // --------------------------------------------------

  const generatePaymentLink = async (ad) => {
    const id = ad._id || ad.id;
    if (!id) {
      setError("Promotion database ID is missing.");
      return;
    }
    if (ad.status !== "approved") {
      setError("Approve the promotion before generating a payment link.");
      return;
    }
    if (ad.payment_status === "paid") {
      setError("This promotion is already marked as paid.");
      return;
    }
    if (!window.confirm(`Generate/send a Razorpay payment link for ${ad.brand_name || ad.title}?`)) return;

    setError("");
    setNotice("");
    setReviewingId(id);
    try {
      const response = await fetch(
        `${BASE_URL}/admin/advertisements/${encodeURIComponent(id)}/payment-link`,
        { method: "POST", headers: authHeaders }
      );
      const result = await readResponse(response);
      const link = result.payment_link_url || result.payment_link?.short_url || result.advertisement?.payment_link_url;
      setNotice(result.message || "Payment link generated successfully.");
      if (link) window.prompt("Razorpay payment link (copy it if needed):", link);
      await loadAds();
    } catch (err) {
      setError(err.message);
    } finally {
      setReviewingId(null);
    }
  };

  // --------------------------------------------------
  // ACTIVATE / DEACTIVATE
  // --------------------------------------------------

  const changeActive = async (ad) => {
    const id = ad._id || ad.id;
    if (!id) {
      setError("Promotion database ID is missing.");
      return;
    }
    if (ad.is_active) {
      setError("This backend currently exposes activation only. Deactivation requires a dedicated backend route.");
      return;
    }
    if (ad.status !== "approved" || ad.payment_status !== "paid") {
      setError("Only approved promotions with verified payment can be activated.");
      return;
    }
    if (!window.confirm(`Activate "${ad.title || ad.brand_name}" now? The campaign must be within its scheduled dates.`)) return;

    setError("");
    setNotice("");
    setReviewingId(id);
    try {
      const response = await fetch(
        `${BASE_URL}/admin/advertisements/${encodeURIComponent(id)}/activate`,
        { method: "PATCH", headers: authHeaders }
      );
      const result = await readResponse(response);
      setNotice(result.message || "Promotion activated successfully.");
      await loadAds();
    } catch (err) {
      setError(err.message);
    } finally {
      setReviewingId(null);
    }
  };

  // --------------------------------------------------
  // SEARCH AND FILTER
  // --------------------------------------------------

  const filteredAds = useMemo(() => {
    const query = search.trim().toLowerCase();
    const now = new Date();

    return ads.filter((ad) => {
      const matchesSearch = [
        ad.brand_name,
        ad.company_name,
        ad.title,
        ad.description,
        ad.promotion_type,
      ].some((value) =>
        String(value || "").toLowerCase().includes(query)
      );

      const status = String(ad.status || "pending").toLowerCase();

      const matchesStatus =
        statusFilter === "all" || status === statusFilter;

      const start = ad.start_date
        ? new Date(ad.start_date)
        : null;

      const end = ad.end_date
        ? new Date(ad.end_date)
        : null;

      let matchesDate = true;

      if (dateFilter === "active") {
        matchesDate = Boolean(
          start &&
            end &&
            start <= now &&
            end >= now &&
            ad.status === "approved" &&
            ad.payment_status === "paid" &&
            ad.is_active
        );
      } else if (dateFilter === "scheduled") {
        matchesDate = Boolean(start && start > now);
      } else if (dateFilter === "expired") {
        matchesDate = Boolean(end && end < now);
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [ads, search, statusFilter, dateFilter]);

  const approvedCount = ads.filter(
    (ad) => ad.status === "approved"
  ).length;

  const pendingCount = ads.filter(
    (ad) => !ad.status || ad.status === "pending"
  ).length;

  const rejectedCount = ads.filter(
    (ad) => ad.status === "rejected"
  ).length;

  const activeCount = ads.filter(
    (ad) => ad.is_active
  ).length;

  const totalPaid = ads
    .filter((ad) => ad.payment_status === "paid")
    .reduce(
      (sum, ad) => sum + Number(ad.approved_amount ?? ad.amount_paid ?? 0),
      0
    );

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-7 lg:px-10">

        {/* HEADER */}

        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-7 flex flex-col justify-between gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center"
        >
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-indigo-700">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              DWJD · Brand partnerships
            </div>

            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              Promotion Manager
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Create campaigns, review brand submissions, manage
              payments, and control promotional placements.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadAds}
              disabled={loading}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {loading ? "Refreshing…" : "↻ Refresh"}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowForm((value) => !value);
                setError("");
                setNotice("");
              }}
              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
            >
              {showForm ? "× Close form" : "+ Create promotion"}
            </button>
          </div>
        </motion.header>

        {/* ERROR / SUCCESS MESSAGES */}

        {(error || notice) && (
          <div
            role={error ? "alert" : "status"}
            className={`mb-6 rounded-2xl border p-4 text-sm ${
              error
                ? "border-rose-200 bg-rose-50 text-rose-800"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <p className="leading-6">{error || notice}</p>

              <button
                type="button"
                onClick={() => {
                  setError("");
                  setNotice("");
                }}
                className="shrink-0 font-bold"
                aria-label="Dismiss message"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* DASHBOARD METRICS */}

        <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Metric
            label="Campaigns"
            value={ads.length}
            hint="All saved promotions"
            icon="▤"
          />

          <Metric
            label="Pending"
            value={pendingCount}
            hint="Awaiting review"
            icon="◷"
          />

          <Metric
            label="Approved"
            value={approvedCount}
            hint="Approved campaigns"
            icon="✓"
          />

          <Metric
            label="Rejected"
            value={rejectedCount}
            hint="Rejected campaigns"
            icon="×"
          />

          <Metric
            label="Paid amount"
            value={money(totalPaid)}
            hint={`${activeCount} active campaigns`}
            icon="₹"
          />
        </section>

        {/* CREATE PROMOTION FORM */}

        {showForm && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 via-white to-violet-50 px-6 py-5 sm:px-8">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-indigo-600">
                New campaign
              </p>

              <h2 className="mt-1 text-xl font-black">
                Brand & promotion details
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Required fields are marked with an asterisk.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-8 p-6 sm:p-8"
            >
              {/* BRAND CONTACT */}

              <section>
                <h3 className="mb-4 text-sm font-extrabold">
                  1. Brand contact
                </h3>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  <Field label="Brand name" required>
                    <input
                      name="brand_name"
                      value={form.brand_name}
                      onChange={updateField}
                      required
                      className={inputClass}
                      placeholder="Brand name"
                    />
                  </Field>

                  <Field label="Registered company name" required>
                    <input
                      name="company_name"
                      value={form.company_name}
                      onChange={updateField}
                      required
                      className={inputClass}
                      placeholder="Company legal name"
                    />
                  </Field>

                  <Field label="Contact person" required>
                    <input
                      name="contact_person"
                      value={form.contact_person}
                      onChange={updateField}
                      required
                      className={inputClass}
                      placeholder="Marketing manager"
                    />
                  </Field>

                  <Field label="Business email" required>
                    <input
                      type="email"
                      name="contact_email"
                      value={form.contact_email}
                      onChange={updateField}
                      required
                      className={inputClass}
                      placeholder="name@company.com"
                    />
                  </Field>

                  <Field label="Contact phone" required>
                    <input
                      type="tel"
                      name="contact_phone"
                      value={form.contact_phone}
                      onChange={updateField}
                      required
                      className={inputClass}
                      placeholder="+91..."
                    />
                  </Field>

                  <Field label="Company website">
                    <input
                      type="url"
                      name="company_website"
                      value={form.company_website}
                      onChange={updateField}
                      className={inputClass}
                      placeholder="https://company.com"
                    />
                  </Field>
                </div>
              </section>

              {/* CREATIVE DETAILS */}

              <section>
                <h3 className="mb-4 text-sm font-extrabold">
                  2. Creative & placement
                </h3>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field label="Campaign title" required>
                    <input
                      name="title"
                      value={form.title}
                      onChange={updateField}
                      required
                      className={inputClass}
                      placeholder="Summer campaign"
                    />
                  </Field>

                  <Field label="Promotion type" required>
                    <select
                      name="promotion_type"
                      value={form.promotion_type}
                      onChange={updateField}
                      className={inputClass}
                    >
                      <option value="banner">Banner</option>
                      <option value="sponsored_post">Sponsored post</option>
                      <option value="video">Video promotion</option>
                      <option value="product_promotion">
                        Product promotion
                      </option>
                      <option value="brand_awareness">
                        Brand awareness
                      </option>
                    </select>
                  </Field>

                  <Field
                    label="Description"
                    required
                    className="md:col-span-2"
                  >
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={updateField}
                      required
                      rows={3}
                      className={inputClass}
                      placeholder="Describe the campaign..."
                    />
                  </Field>

                  <Field label="Banner / image URL">
                    <input
                      type="url"
                      name="image_url"
                      value={form.image_url}
                      onChange={updateField}
                      className={inputClass}
                      placeholder="https://..."
                    />
                  </Field>

                  <Field label="Video URL">
                    <input
                      type="url"
                      name="video_url"
                      value={form.video_url}
                      onChange={updateField}
                      className={inputClass}
                      placeholder="https://..."
                    />
                  </Field>

                  <Field label="Destination URL">
                    <input
                      type="url"
                      name="target_url"
                      value={form.target_url}
                      onChange={updateField}
                      className={inputClass}
                      placeholder="https://brand.com/offer"
                    />
                  </Field>

                  <Field label="Placement" required>
                    <select
                      name="placement"
                      value={form.placement}
                      onChange={updateField}
                      className={inputClass}
                    >
                      <option value="home_page">Home page</option>
                      <option value="donation_page">Donation page</option>
                      <option value="pickup_page">Pickup page</option>
                      <option value="rider_dashboard">
                        Rider dashboard
                      </option>
                      <option value="all_pages">All pages</option>
                    </select>
                  </Field>
                </div>
              </section>

              {/* COMMERCIAL TERMS */}

              <section>
                <h3 className="mb-4 text-sm font-extrabold">
                  3. Schedule & commercial terms
                </h3>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  <Field label="Start date and time" required>
                    <input
                      type="datetime-local"
                      name="start_date"
                      value={form.start_date}
                      onChange={updateField}
                      required
                      className={inputClass}
                    />
                  </Field>

                  <Field label="End date and time" required>
                    <input
                      type="datetime-local"
                      name="end_date"
                      value={form.end_date}
                      onChange={updateField}
                      required
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Campaign amount" required>
                    <input
                      type="number"
                      name="amount_paid"
                      value={form.amount_paid}
                      onChange={updateField}
                      required
                      min="0"
                      step="0.01"
                      className={inputClass}
                      placeholder="25000"
                    />
                  </Field>

                  <Field label="Currency">
                    <select
                      name="currency"
                      value="INR"
                      onChange={updateField}
                      disabled
                      className={inputClass}
                    >
                      <option value="INR">INR — Indian Rupee (currently supported)</option>
                    </select>
                  </Field>

                  <Field label="Collaboration type">
                    <select
                      name="collaboration_type"
                      value={form.collaboration_type}
                      onChange={updateField}
                      className={inputClass}
                    >
                      <option value="paid_promotion">
                        Paid promotion
                      </option>
                      <option value="sponsorship">Sponsorship</option>
                      <option value="brand_partnership">
                        Brand partnership
                      </option>
                    </select>
                  </Field>

                  <Field label="Payment reference">
                    <input
                      name="payment_reference"
                      value={form.payment_reference}
                      onChange={updateField}
                      className={inputClass}
                      placeholder="Invoice / transaction reference"
                    />
                  </Field>
                </div>

                <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
                  New campaigns are submitted as pending and inactive.
                  The amount is a requested amount. An administrator sets the final approved amount in INR. Payment must be verified by Razorpay webhook before activation.
                </p>
              </section>

              {/* BANNER PREVIEW */}

              {form.image_url && (
                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Banner preview
                  </p>

                  <img
                    src={form.image_url}
                    alt="Promotion banner preview"
                    className="max-h-56 max-w-full rounded-xl object-contain"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                </section>
              )}

              <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-6 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-extrabold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving ? "Saving promotion…" : "Create promotion"}
                </button>
              </div>
            </form>
          </motion.section>
        )}

        {/* CAMPAIGN DIRECTORY */}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
              <div>
                <h2 className="text-lg font-black">
                  Campaign directory
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Review submissions and manage campaign activation.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[620px]">
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search brand or campaign..."
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400"
                />

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
                >
                  <option value="all">All review statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                </select>

                <select
                  value={dateFilter}
                  onChange={(event) => setDateFilter(event.target.value)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
                >
                  <option value="all">Any schedule</option>
                  <option value="active">Running and active</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-100 border-t-indigo-600" />
              Loading campaigns...
            </div>
          ) : filteredAds.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl text-indigo-600">
                ✦
              </div>

              <h3 className="mt-4 font-bold text-slate-800">
                {ads.length
                  ? "No matching promotions"
                  : "No promotions yet"}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {ads.length
                  ? "Try changing your search or filters."
                  : "Create your first brand promotion to get started."}
              </p>

              {!ads.length && (
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white"
                >
                  + Create first promotion
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1250px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    {[
                      "Brand / campaign",
                      "Format",
                      "Placement",
                      "Schedule",
                      "Amount",
                      "Payment",
                      "Review",
                      "Controls",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-5 py-4 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredAds.map((ad, index) => {
                    const id =
                      ad._id || ad.id || `${ad.title}-${index}`;

                    const isReviewing = reviewingId === id;

                    return (
                      <tr
                        key={id}
                        className="transition hover:bg-slate-50/70"
                      >
                        {/* BRAND */}

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {ad.image_url ? (
                              <img
                                src={ad.image_url}
                                alt=""
                                className="h-12 w-16 rounded-lg border border-slate-200 object-cover"
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-indigo-50 text-xl text-indigo-600">
                                ▧
                              </div>
                            )}

                            <div>
                              <p className="font-bold text-slate-800">
                                {ad.brand_name || ad.company_name || "Brand"}
                              </p>

                              <p className="mt-1 max-w-[250px] truncate text-xs text-slate-500">
                                {ad.title || "Untitled campaign"}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                {ad.contact_email || ""}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* FORMAT */}

                        <td className="px-5 py-4 text-sm capitalize text-slate-600">
                          {String(ad.promotion_type || "—").replaceAll("_", " ")}
                        </td>

                        {/* PLACEMENT */}

                        <td className="px-5 py-4 text-sm capitalize text-slate-600">
                          {String(ad.placement || "—").replaceAll("_", " ")}
                        </td>

                        {/* SCHEDULE */}

                        <td className="px-5 py-4 text-sm text-slate-600">
                          <p>{formatDate(ad.start_date)}</p>

                          <p className="mt-1 text-xs text-slate-400">
                            To {formatDate(ad.end_date)}
                          </p>
                        </td>

                        {/* AMOUNT */}

                        <td className="px-5 py-4 text-sm font-bold text-slate-800">
                          {money(ad.approved_amount ?? ad.amount_paid, ad.currency || "INR")}
                        </td>

                        {/* PAYMENT */}

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                              ad.payment_status === "paid"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {ad.payment_status || "pending"}
                          </span>
                        </td>

                        {/* REVIEW STATUS */}

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${statusStyle(
                              ad.status || "pending"
                            )}`}
                          >
                            {ad.status || "pending"}
                          </span>

                          {ad.status === "rejected" &&
                            ad.rejection_reason && (
                              <div className="mt-3 max-w-[250px] rounded-xl border border-rose-200 bg-rose-50 p-3">
                                <p className="text-xs font-extrabold text-rose-700">
                                  Rejection reason
                                </p>

                                <p className="mt-1 break-words text-xs leading-5 text-rose-800">
                                  {ad.rejection_reason}
                                </p>
                              </div>
                            )}

                          {ad.reviewed_at && (
                            <p className="mt-2 text-xs text-slate-400">
                              Reviewed: {formatDate(ad.reviewed_at)}
                            </p>
                          )}
                        </td>

                        {/* CONTROLS */}

                        <td className="px-5 py-4">
                          <div className="flex min-w-[210px] flex-col gap-3">

                            {/* ACCEPT AND REJECT */}

                            {ad.status === "pending" && (
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  disabled={isReviewing}
                                  onClick={() => approvePromotion(ad)}
                                  className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                                >
                                  {isReviewing
                                    ? "Processing..."
                                    : "✓ Accept"}
                                </button>

                                <button
                                  type="button"
                                  disabled={isReviewing}
                                  onClick={() => openRejectModal(ad)}
                                  className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-rose-700 disabled:opacity-50"
                                >
                                  ✕ Reject
                                </button>
                              </div>
                            )}



                            {/* PAYMENT LINK */}
                            {ad.status === "approved" && ad.payment_status !== "paid" && (
                              <button
                                type="button"
                                disabled={isReviewing}
                                onClick={() => generatePaymentLink(ad)}
                                className="w-fit rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                              >
                                {isReviewing ? "Processing..." : ad.payment_link_url ? "Generate new payment link" : "Generate payment link"}
                              </button>
                            )}
                            {ad.payment_link_url && ad.payment_status !== "paid" && (
                              <a
                                href={ad.payment_link_url}
                                target="_blank"
                                rel="noreferrer"
                                className="w-fit text-xs font-semibold text-indigo-600 underline"
                              >
                                Open payment link
                              </a>
                            )}

                            {/* ACTIVATION */}

                            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
                              <input
                                type="checkbox"
                                checked={Boolean(ad.is_active)}
                                disabled={
                                  isReviewing ||
                                  ad.is_active ||
                                  ad.status !== "approved" ||
                                  ad.payment_status !== "paid"
                                }
                                onChange={() => changeActive(ad)}
                                className="h-4 w-4 accent-indigo-600"
                                title="Only approved and paid campaigns can be activated"
                              />

                              Active
                            </label>


                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-col justify-between gap-2 border-t border-slate-100 px-5 py-4 text-xs text-slate-400 sm:flex-row">
            <span>
              Showing {filteredAds.length} of {ads.length} promotions
            </span>

            <span>
Only approved, paid, active campaigns should be shown publicly. Deactivation and deletion are omitted until matching backend routes are added.
            </span>
          </div>
        </section>
      </div>

      {/* REJECTION REASON MODAL */}

      {selectedAd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeRejectModal();
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <div className="border-b border-rose-100 bg-gradient-to-r from-rose-50 to-white p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-widest text-rose-600">
                    Promotion review
                  </p>

                  <h2 className="mt-2 text-xl font-black text-slate-900">
                    Reject promotion
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    {selectedAd.title || selectedAd.brand_name}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeRejectModal}
                  disabled={reviewingId !== null}
                  className="rounded-xl border border-slate-200 px-3 py-2 font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                  aria-label="Close rejection modal"
                >
                  ×
                </button>
              </div>
            </div>

            <form onSubmit={rejectPromotion} className="space-y-5 p-6">
              <div>
                <label
                  htmlFor="rejection_reason"
                  className="block text-sm font-bold text-slate-700"
                >
                  Rejection reason
                  <span className="ml-1 text-rose-500">*</span>
                </label>

                <textarea
                  id="rejection_reason"
                  value={rejectionReason}
                  onChange={(event) =>
                    setRejectionReason(event.target.value)
                  }
                  required
                  minLength={5}
                  maxLength={1000}
                  rows={5}
                  autoFocus
                  placeholder="Explain why this promotion is being rejected..."
                  className={inputClass}
                />

                <div className="mt-2 flex justify-between gap-3 text-xs text-slate-400">
                  <span>
                    Provide a clear reason for the decision.
                  </span>

                  <span>{rejectionReason.length}/1000</span>
                </div>
              </div>

              <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row">
                <button
                  type="button"
                  onClick={closeRejectModal}
                  disabled={reviewingId !== null}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    reviewingId !== null ||
                    rejectionReason.trim().length < 5
                  }
                  className="rounded-xl bg-rose-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {reviewingId !== null
                    ? "Submitting..."
                    : "Confirm rejection"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}