import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import BackgroundVideo from "../components/BackgroundVideo";
import { useAuth } from "../Context/AuthContext";

const ADMIN_STORAGE_KEY = "scoopers_admin_staff_accounts";
const STAFF_PASSCODE = "1980";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const readAdmins = () => {
    try {
      return JSON.parse(localStorage.getItem(ADMIN_STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email || !password || !passcode || (mode === "signup" && !name)) {
      setError("Please complete all admin fields.");
      return;
    }

    if (passcode !== STAFF_PASSCODE) {
      setError("Invalid staff passcode. Use 1980.");
      return;
    }

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 350));

    const admins = readAdmins();

    if (mode === "signup") {
      const existing = admins.find(
        (item) => item.email.toLowerCase() === email.toLowerCase(),
      );

      if (existing) {
        setLoading(false);
        setError("This admin email already exists. Please login instead.");
        return;
      }

      const newAdmin = { name, email, password };
      localStorage.setItem(
        ADMIN_STORAGE_KEY,
        JSON.stringify([newAdmin, ...admins]),
      );
      login(email, "admin", name);
      navigate("/admin-orders");
      return;
    }

    const admin = admins.find(
      (item) =>
        item.email.toLowerCase() === email.toLowerCase() &&
        item.password === password,
    );

    if (!admin) {
      setLoading(false);
      setError("Admin account not found. Please sign up first.");
      return;
    }

    login(admin.email, "admin", admin.name);
    navigate("/admin-orders");
  };

  return (
    <div className="video-page">
      <BackgroundVideo />
      <div className="video-overlay" />

      <section className="center-panel">
        <div className="glass-card auth-card">
          <span className="eyebrow">Admin staff access</span>
          <h1>{mode === "login" ? "Admin login" : "Admin sign up"}</h1>
          <p className="helper-text">
            This page is for Scoopers Rentals staff only. Use the shared staff
            passcode to continue.
          </p>

          <div className="hero-tools" style={{ marginTop: "0.5rem" }}>
            <button
              type="button"
              className={mode === "login" ? "primary-btn" : "secondary-btn"}
              onClick={() => setMode("login")}
            >
              Login
            </button>
            <button
              type="button"
              className={mode === "signup" ? "primary-btn" : "secondary-btn"}
              onClick={() => setMode("signup")}
            >
              Sign Up
            </button>
          </div>

          <form className="stack-form" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <input
                className="classic-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Admin full name"
              />
            )}

            <input
              className="classic-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Admin email"
            />
            <input
              className="classic-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
            <input
              className="classic-input"
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Staff passcode"
            />

            {error && <p className="error-text">{error}</p>}

            <button
              className="primary-btn full-width"
              type="submit"
              disabled={loading}
            >
              {loading
                ? mode === "login"
                  ? "Signing in..."
                  : "Creating admin account..."
                : mode === "login"
                  ? "Admin Login"
                  : "Create Admin Account"}
            </button>
          </form>

          <button
            type="button"
            className="secondary-btn full-width"
            onClick={() => navigate("/login")}
          >
            Back to Member Login
          </button>
        </div>
      </section>
    </div>
  );
}
