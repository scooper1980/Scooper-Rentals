import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import BackgroundVideo from "../components/BackgroundVideo";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please provide both email and password.");
      return;
    }

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    login(email);
    setLoading(false);
    navigate("/dashboard");
  };

  const handleDemo = () => {
    login("guest@scoopersrentals.com");
    navigate("/dashboard");
  };

  return (
    <div className="video-page">
      <BackgroundVideo />
      <div className="video-overlay" />

      <section className="center-panel">
        <div className="glass-card auth-card">
          <span className="eyebrow">Member sign in</span>
          <h1>Welcome back.</h1>
          <p className="helper-text">
            Access your reservations, premium offers and quick re-booking.
          </p>

          <form className="stack-form" onSubmit={handleLogin}>
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
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          <button className="secondary-btn full-width" onClick={handleDemo}>
            Use Demo Account
          </button>
        </div>
      </section>
    </div>
  );
}
