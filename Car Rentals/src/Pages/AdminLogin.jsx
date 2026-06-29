import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import BackgroundVideo from "../components/BackgroundVideo";
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

    if (!email || !password || !passcode) {
      setError("Please complete all admin fields.");
      return;
    }

    if (mode === "signup" && !name) {
      setError("Please enter your name.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        const response = await api.registerAdminStaff({
          name,
          email,
          password,
          passcode,
        });
        login(response.email, "admin", response.name);
        navigate("/admin-orders");
      } else {
        const response = await api.loginAdminStaff({
          email,
          password,
          passcode,
        });
        login(response.email, "admin", response.name);
        navigate("/admin-orders");
      }
    } catch (err) {
      setError(err.message || "Authentication failed. Please try again.");
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
          <h1>Admin login</h1>
          <p className="helper-text">
            This page is for Scoopers Rentals staff only. Use the shared staff
            passcode to continue.
          </p>

          <form onSubmit={handleSubmit} className="stack-form">
            {mode === "signup" && (
              <input
                className="classic-input"
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}

            <input
              className="classic-input"
              type="email"
              placeholder="Staff email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              className="classic-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <input
              className="classic-input"
              type="password"
              placeholder="Staff passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
            />

            {error && <p className="error-text">{error}</p>}

            <button type="submit" className="primary-btn full-width" disabled={loading}>
              {loading ? (mode === "signup" ? "Registering..." : "Logging in...") : mode === "login" ? "Login" : "Sign Up"}
            </button>

            <div className="help-text-row">
              {mode === "login" ? (
                <>
                  <p>No account yet?</p>
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => {
                      setMode("signup");
                      setError("");
                    }}
                  >
                    Create an admin account
                  </button>
                </>
              ) : (
                <>
                  <p>Already have an account?</p>
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => {
                      setMode("login");
                      setError("");
                    }}
                  >
                    Login instead
                  </button>
                </>
              )}
            </div>
          </form>

          <button
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