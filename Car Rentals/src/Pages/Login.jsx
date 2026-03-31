import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import BackgroundVideo from "../components/BackgroundVideo";

const MEMBER_STORAGE_KEY = "scoopers_member_accounts";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);

  const readMembers = () => {
    try {
      return JSON.parse(localStorage.getItem(MEMBER_STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");

    if (!email || !password || (mode === "signup" && !name)) {
      setError("Please complete all required fields.");
      return;
    }

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 400));

    const members = readMembers();

    if (mode === "signup") {
      const existing = members.find(
        (item) => item.email.toLowerCase() === email.toLowerCase(),
      );

      if (existing) {
        setLoading(false);
        setError("This email already has an account. Please login instead.");
        return;
      }

      const newMember = { name, email, password };
      localStorage.setItem(
        MEMBER_STORAGE_KEY,
        JSON.stringify([newMember, ...members]),
      );
      login(email, "member", name);
      setLoading(false);
      navigate("/dashboard");
      return;
    }

    const member = members.find(
      (item) =>
        item.email.toLowerCase() === email.toLowerCase() &&
        item.password === password,
    );

    if (members.length && !member) {
      setLoading(false);
      setError("Account not found. Please sign up or use the correct details.");
      return;
    }

    login(email, "member", member?.name || "Customer");
    setLoading(false);
    navigate("/dashboard");
  };

  const handleDemo = () => {
    login("guest@scoopersrentals.com", "member", "Guest");
    navigate("/dashboard");
  };

  return (
    <div className="video-page">
      <BackgroundVideo />
      <div className="video-overlay" />

      <section className="center-panel">
        <div className="auth-shell">
          <div className="admin-menu-wrap">
            <button
              type="button"
              className="admin-dot-btn"
              onClick={() => setShowAdminMenu((prev) => !prev)}
              aria-label="Open admin options"
            >
              ⋮
            </button>

            {showAdminMenu && (
              <div className="admin-menu-panel">
                <button
                  type="button"
                  className="secondary-btn full-width"
                  onClick={() => navigate("/admin-login")}
                >
                  Admin Page
                </button>
              </div>
            )}
          </div>

          <div className="glass-card auth-card">
            <span className="eyebrow">Member access</span>
            <h1>
              {mode === "login" ? "Welcome back." : "Create your account"}
            </h1>
            <p className="helper-text">
              Access your reservations, premium offers and quick re-booking.
            </p>
            <p className="helper-text">
              Admin staff can use the 3-dot menu above.
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

            <form className="stack-form" onSubmit={handleLogin}>
              {mode === "signup" && (
                <input
                  className="classic-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                />
              )}

              <input
                className="classic-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
              />
              <input
                className="classic-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
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
                    : "Creating account..."
                  : mode === "login"
                    ? "Login"
                    : "Sign Up"}
              </button>
            </form>

            <button className="secondary-btn full-width" onClick={handleDemo}>
              Use Demo Account
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
