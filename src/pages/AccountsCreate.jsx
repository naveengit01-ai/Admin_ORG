import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRiderAccount } from "../api";

const AccountsCreate = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
    profile_image: "",
    user_type: "rider",
  });

  const [loading, setLoading]     = useState(false);
  const [result,  setResult]      = useState(null); // { type: "success"|"error", msg: "" }
  const [focused, setFocused]     = useState("");

  const showResult = (msg, type = "error") => {
    setResult({ msg, type });
    setTimeout(() => setResult(null), 4000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
    setResult(null);
  };

  const validateForm = () => {
    const { username, email, password, first_name, last_name, phone } = formData;
    const u = username.trim(), em = email.trim(), fn = first_name.trim(),
          ln = last_name.trim(), ph = phone.trim();
    if (!u || !em || !password || !fn || !ln || !ph)
      return showResult("Please fill all required fields.") || false;
    if (u.length < 6)  return showResult("Username must be at least 6 characters.") || false;
    if (u.length > 30) return showResult("Username cannot exceed 30 characters.") || false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em))
      return showResult("Please enter a valid email address.") || false;
    if (password.length < 6)
      return showResult("Password must be at least 6 characters.") || false;
    if (!/^[0-9+\-\s()]{10,15}$/.test(ph))
      return showResult("Please enter a valid phone number.") || false;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const accountData = {
      username:      formData.username.trim(),
      email:         formData.email.trim().toLowerCase(),
      password:      formData.password,
      first_name:    formData.first_name.trim(),
      last_name:     formData.last_name.trim(),
      phone:         formData.phone.trim(),
      profile_image: formData.profile_image.trim(),
      user_type:     formData.user_type,
    };

    try {
      setLoading(true);
      const result = await createRiderAccount(accountData);

      if (!result.ok) {
        const msgs = {
          user_exists:    "Account already exists.",
          rider_exists:   "Rider already exists.",
          admin_exists:   "Admin account already exists.",
          gm_exists:      "GM account already exists.",
          invalid_email:  "Please enter a valid email address.",
          invalid_username: "Username must be at least 6 characters.",
          missing_fields: "Please fill all required fields.",
        };
        showResult(msgs[result.status] || "Failed to create account.");
        return;
      }

      showResult(`${getTypeName(formData.user_type)} account created successfully.`, "success");
      setFormData({
        username: "", email: "", password: "", first_name: "",
        last_name: "", phone: "", profile_image: "", user_type: "rider",
      });
    } catch {
      showResult("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getTypeName = (t) => ({ rider: "Rider", admin: "Admin", gm: "GM" }[t] || "Account");

  const typeColors = {
    rider: { accent: "#34d399", bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.25)" },
    admin: { accent: "#818cf8", bg: "rgba(129,140,248,0.08)", border: "rgba(129,140,248,0.25)" },
    gm:    { accent: "#f9a825", bg: "rgba(249,168,37,0.08)",  border: "rgba(249,168,37,0.25)"  },
  };
  const tc = typeColors[formData.user_type];

  const Field = ({ label, name, type = "text", placeholder, hint, half }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase",
        color: focused === name ? tc.accent : "rgba(238,234,244,0.4)",
        transition: "color 0.2s", fontFamily: "'DM Mono', monospace" }}>
        {label} <span style={{ color: "rgba(248,113,113,0.7)" }}>*</span>
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={type}
          name={name}
          value={formData[name]}
          onChange={handleChange}
          onFocus={() => setFocused(name)}
          onBlur={() => setFocused("")}
          placeholder={placeholder}
          style={{
            width: "100%", background: "rgba(255,255,255,0.03)",
            border: `1px solid ${focused === name ? tc.accent : "rgba(255,255,255,0.08)"}`,
            borderRadius: 12, padding: "11px 14px",
            color: "#eeeaf4", fontSize: 14, fontFamily: "'Syne', sans-serif",
            outline: "none", transition: "border-color 0.2s, box-shadow 0.2s",
            boxShadow: focused === name ? `0 0 0 3px ${tc.bg}` : "none",
          }}
        />
      </div>
      {hint && <span style={{ fontSize: 10, color: "rgba(238,234,244,0.25)",
        fontFamily: "'DM Mono', monospace" }}>{hint}</span>}
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #07080f; }
        input::placeholder { color: rgba(238,234,244,0.2); }
        select option { background: #0d0e1a; color: #eeeaf4; }

        .ac-root {
          min-height: 100vh;
          background: #07080f;
          color: #eeeaf4;
          font-family: 'Syne', sans-serif;
          position: relative;
          overflow-x: hidden;
        }
        .ac-root::before {
          content: '';
          position: fixed; inset: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 70% 50% at 10% 0%, rgba(52,211,153,0.06), transparent 60%),
            radial-gradient(ellipse 50% 40% at 90% 100%, rgba(99,102,241,0.05), transparent 60%);
        }
        .ac-grid {
          position: fixed; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(52,211,153,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(52,211,153,0.025) 1px, transparent 1px);
          background-size: 56px 56px;
        }

        /* ── header ── */
        .ac-header {
          position: sticky; top: 0; z-index: 50;
          background: rgba(7,8,15,0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          padding: 14px 32px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .ac-logo {
          font-size: 18px; font-weight: 800; letter-spacing: -0.03em;
          background: linear-gradient(135deg, #eeeaf4, #a8a0c8);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .ac-logo span {
          background: linear-gradient(135deg, #34d399, #10b981);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .ac-back-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 10px;
          padding: 8px 16px;
          font-family: 'Syne', sans-serif;
          font-size: 13px; font-weight: 600;
          color: rgba(238,234,244,0.6);
          cursor: pointer; transition: all 0.2s;
        }
        .ac-back-btn:hover {
          background: rgba(255,255,255,0.08);
          color: #eeeaf4; border-color: rgba(255,255,255,0.18);
        }

        /* ── main wrapper ── */
        .ac-main {
          position: relative; z-index: 1;
          max-width: 680px; margin: 0 auto;
          padding: 40px 24px 80px;
        }

        /* ── page title ── */
        .ac-page-title {
          font-size: clamp(26px,4vw,36px); font-weight: 800;
          letter-spacing: -0.03em; margin-bottom: 4px;
          background: linear-gradient(135deg, #eeeaf4 0%, rgba(238,234,244,0.7) 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          animation: fadeUp 0.6s ease both;
        }
        .ac-page-sub {
          font-family: 'DM Mono', monospace; font-size: 11px;
          color: rgba(238,234,244,0.3); margin-bottom: 32px;
          animation: fadeUp 0.6s 0.05s ease both;
        }

        /* ── result banner ── */
        .ac-result {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 16px; border-radius: 12px;
          margin-bottom: 24px; font-size: 13px; font-weight: 600;
          animation: slideDown 0.35s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        .ac-result.error {
          background: rgba(248,113,113,0.08);
          border: 1px solid rgba(248,113,113,0.2);
          color: #fca5a5;
        }
        .ac-result.success {
          background: rgba(52,211,153,0.08);
          border: 1px solid rgba(52,211,153,0.2);
          color: #6ee7b7;
        }
        .ac-result-icon { font-size: 16px; flex-shrink: 0; }

        /* ── card ── */
        .ac-card {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          padding: 28px;
          margin-bottom: 16px;
          position: relative;
          animation: fadeUp 0.5s ease both;
        }
        .ac-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 1px;
          border-radius: 20px 20px 0 0;
        }
        .ac-section-label {
          font-family: 'DM Mono', monospace;
          font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase;
          color: rgba(238,234,244,0.25); margin-bottom: 16px;
          display: flex; align-items: center; gap: 8px;
        }
        .ac-section-label::after {
          content: ''; flex: 1; height: 1px;
          background: rgba(255,255,255,0.05);
        }

        /* ── type selector ── */
        .ac-type-row {
          display: grid; grid-template-columns: repeat(3,1fr); gap: 10px;
          margin-bottom: 4px;
        }
        .ac-type-pill {
          padding: 10px 8px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.03);
          cursor: pointer;
          text-align: center;
          transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
          display: flex; flex-direction: column; align-items: center; gap: 4px;
        }
        .ac-type-pill .pill-icon { font-size: 18px; }
        .ac-type-pill .pill-label {
          font-size: 12px; font-weight: 700; letter-spacing: -0.01em;
        }
        .ac-type-pill .pill-sub {
          font-family: 'DM Mono', monospace; font-size: 9px;
          color: rgba(238,234,244,0.3);
        }

        /* ── field grid ── */
        .ac-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 540px) { .ac-grid-2 { grid-template-columns: 1fr; } }

        /* ── info note ── */
        .ac-note {
          display: flex; align-items: flex-start; gap: 10px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px; padding: 12px 14px;
          font-family: 'DM Mono', monospace; font-size: 11px;
          color: rgba(238,234,244,0.35); line-height: 1.6;
        }
        .ac-note-icon { flex-shrink: 0; font-size: 13px; margin-top: 1px; }

        /* ── submit row ── */
        .ac-submit-row {
          display: flex; gap: 12px; justify-content: flex-end;
          margin-top: 24px;
        }
        .ac-cancel-btn {
          padding: 11px 20px; border-radius: 12px;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.09);
          font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 600;
          color: rgba(238,234,244,0.4); cursor: pointer;
          transition: all 0.2s;
        }
        .ac-cancel-btn:hover:not(:disabled) {
          background: rgba(255,255,255,0.05);
          color: rgba(238,234,244,0.7);
        }
        .ac-cancel-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .ac-submit-btn {
          padding: 11px 24px; border-radius: 12px;
          border: none; cursor: pointer;
          font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700;
          transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
          display: flex; align-items: center; gap: 8px;
          position: relative; overflow: hidden;
        }
        .ac-submit-btn:hover:not(:disabled) { transform: translateY(-2px); }
        .ac-submit-btn:active:not(:disabled) { transform: scale(0.97); }
        .ac-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .ac-spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(0,0,0,0.2);
          border-top-color: rgba(0,0,0,0.8);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin     { to { transform: rotate(360deg); } }
        @keyframes fadeUp   { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideDown{ from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div className="ac-root">
        <div className="ac-grid" />

        {/* Header */}
        <header className="ac-header">
          <div className="ac-logo">DW<span>JD</span></div>
          <button className="ac-back-btn" onClick={() => navigate("/afterlogin")}>
            ← Dashboard
          </button>
        </header>

        <main className="ac-main">
          <h1 className="ac-page-title">Create Account</h1>
          <p className="ac-page-sub">DWJD ORGANIZATION · ACCOUNT MANAGEMENT</p>

          {/* Inline result banner */}
          {result && (
            <div className={`ac-result ${result.type}`}>
              <span className="ac-result-icon">
                {result.type === "success" ? "✦" : "⚠"}
              </span>
              {result.msg}
            </div>
          )}

          {/* ── Card 1: Account type ── */}
          <div className="ac-card" style={{ animationDelay: "0.05s",
            "--before-bg": `linear-gradient(90deg, transparent, ${tc.accent}55, transparent)` }}>
            <style>{`.ac-card::before { background: linear-gradient(90deg, transparent, ${tc.accent}55, transparent); }`}</style>
            <div className="ac-section-label">Account Type</div>
            <div className="ac-type-row">
              {[
                { val: "rider", icon: "🏍️", label: "Rider",   sub: "Users table" },
                { val: "admin", icon: "🛡️", label: "Admin",   sub: "Admins table" },
                { val: "gm",    icon: "💼", label: "GM",      sub: "Admins table" },
              ].map(({ val, icon, label, sub }) => {
                const color = typeColors[val];
                const active = formData.user_type === val;
                return (
                  <div
                    key={val}
                    className="ac-type-pill"
                    onClick={() => setFormData(p => ({ ...p, user_type: val }))}
                    style={{
                      border: `1px solid ${active ? color.accent : "rgba(255,255,255,0.07)"}`,
                      background: active ? color.bg : "rgba(255,255,255,0.03)",
                      boxShadow: active ? `0 0 0 3px ${color.bg}` : "none",
                      transform: active ? "scale(1.04)" : "scale(1)",
                    }}
                  >
                    <span className="pill-icon">{icon}</span>
                    <span className="pill-label" style={{ color: active ? color.accent : "#eeeaf4" }}>{label}</span>
                    <span className="pill-sub">{sub}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Card 2: Credentials ── */}
          <div className="ac-card" style={{ animationDelay: "0.1s" }}>
            <div className="ac-section-label">Credentials</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="ac-grid-2">
                <Field label="Username" name="username" placeholder="min. 6 characters" hint="6–30 characters" />
                <Field label="Email"    name="email"    type="email" placeholder="example@gmail.com" />
              </div>
              <Field label="Password" name="password" type="password" placeholder="min. 6 characters" />
            </div>
          </div>

          {/* ── Card 3: Personal info ── */}
          <div className="ac-card" style={{ animationDelay: "0.15s" }}>
            <div className="ac-section-label">Personal Information</div>
            <div className="ac-grid-2">
              <Field label="First Name" name="first_name" placeholder="First name" />
              <Field label="Last Name"  name="last_name"  placeholder="Last name"  />
            </div>
          </div>

          {/* ── Card 4: Contact ── */}
          <div className="ac-card" style={{ animationDelay: "0.2s" }}>
            <div className="ac-section-label">Contact</div>
            <div className="ac-grid-2">
              <Field label="Phone"             name="phone"         type="tel"  placeholder="10–15 digit number" />
              <Field label="Profile Image URL" name="profile_image"             placeholder="Optional" />
            </div>
          </div>

          {/* ── Info note ── */}
          <div className="ac-note" style={{ marginBottom: 8 }}>
            <span className="ac-note-icon">ℹ</span>
            No OTP will be sent. Account is created directly in the appropriate collection without email verification.
          </div>

          {/* ── Actions ── */}
          <div className="ac-submit-row">
            <button
              className="ac-cancel-btn"
              onClick={() => navigate("/afterlogin")}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="ac-submit-btn"
              onClick={handleSubmit}
              disabled={loading}
              style={{
                background: tc.accent,
                color: "#07080f",
                boxShadow: `0 8px 24px ${tc.bg}`,
              }}
            >
              {loading ? (
                <><div className="ac-spinner" /> Creating…</>
              ) : (
                <>✦ Create {getTypeName(formData.user_type)}</>
              )}
            </button>
          </div>
        </main>
      </div>
    </>
  );
};

export default AccountsCreate;