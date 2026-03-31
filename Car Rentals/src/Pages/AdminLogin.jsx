import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import BackgroundVideo from "../components/BackgroundVideo";
import { useAuth } from "../Context/AuthContext";
import { api } from "../lib/api";

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email || !password || !passcode || (mode === "signup" && !name)) {
      setError("Please complete all admin fields.");
      return;
    }

    try {
      setLoading(true);

      const staffMember =
        mode === "signup"
          ? await api.registerAdminStaff({
              name,
              email,
              password,
              passcode,
            })
          : await api.loginAdminStaff({
              email,
              password,
              passcode,
            });

      login(staffMember.email, "admin", staffMember.name || name);
      navigate("/admin-orders");
    } catch (err) {
      setError(err.message || "Unable to complete admin login.");
    } finally {
      setLoading(false);
    }
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
