import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import BackgroundVideo from "../components/BackgroundVideo";
import { api } from "../lib/api";
import { useAuth } from "../Context/AuthContext";

export default function Payment() {
  const { bookingId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState(location.state?.booking || null);
  const [config, setConfig] = useState({
    enabled: false,
    message: "Loading...",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .getPaymentConfig()
      .then(setConfig)
      .catch((err) => setConfig({ enabled: false, message: err.message }));
  }, []);

  useEffect(() => {
    if (booking) return;

    api
      .getBookings()
      .then((items) => {
        const found = items.find(
          (item) => String(item.id) === String(bookingId),
        );
        setBooking(found || null);
      })
      .catch((err) => setError(err.message));
  }, [booking, bookingId]);

  const amount = useMemo(() => Number(booking?.totalCost || 0), [booking]);

  const handlePaystack = async () => {
    if (!booking || !user) return;

    setLoading(true);
    setError("");

    try {
      const response = await api.initializePaystack({
        email: user.email,
        amount,
        bookingId: booking.id,
      });

      if (response?.authorization_url) {
        window.location.href = response.authorization_url;
        return;
      }

      setError("Unable to open Paystack checkout.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!booking) {
    return (
      <div className="video-page">
        <BackgroundVideo />
        <div className="video-overlay" />
        <section className="center-panel">
          <div className="glass-card auth-card">
            <h1>Payment details unavailable</h1>
            <p className="helper-text">
              We could not find that booking record.
            </p>
            <button
              className="primary-btn full-width"
              onClick={() => navigate("/")}
            >
              Back Home
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="video-page">
      <BackgroundVideo />
      <div className="video-overlay" />

      <section className="center-panel">
        <div className="glass-card support-card">
          <span className="eyebrow">Secure Payment</span>
          <h1>Pay for your reservation</h1>
          <p className="helper-text">
            We recommend <strong>Paystack</strong> for secure card, bank and
            transfer payments.
          </p>

          <div className="info-list">
            <div className="info-line">
              <span>Car</span>
              <strong>{booking.car?.name}</strong>
            </div>
            <div className="info-line">
              <span>Customer</span>
              <strong>{booking.fullName}</strong>
            </div>
            <div className="info-line">
              <span>Rental Period</span>
              <strong>
                {booking.startDate} → {booking.endDate}
              </strong>
            </div>
            <div className="info-line">
              <span>Total Due</span>
              <strong>${amount}</strong>
            </div>
          </div>

          <p className="helper-text" style={{ marginTop: "1rem" }}>
            {config.message}
          </p>
          {error && <p className="error-text">{error}</p>}

          <div className="stack-form">
            <button
              className="primary-btn full-width"
              type="button"
              disabled={!config.enabled || loading}
              onClick={handlePaystack}
            >
              {loading ? "Opening Paystack..." : "Pay with Paystack"}
            </button>
            <button
              className="secondary-btn full-width"
              type="button"
              onClick={() => navigate("/dashboard")}
            >
              View Dashboard
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
