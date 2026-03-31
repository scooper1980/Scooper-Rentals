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
  const [notifying, setNotifying] = useState(false);
  const [notice, setNotice] = useState("");

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
    setNotice("");

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

  const handleTransferNotice = async () => {
    if (!booking) return;

    setNotifying(true);
    setError("");
    setNotice("");

    try {
      await api.createMessage({
        name: booking.fullName,
        email: user?.email || "guest@scoopersrentals.com",
        message: `Bank transfer sent for booking ${booking.id} (${booking.car?.name}). Please confirm payment of $${amount}.`,
      });

      setNotice(
        "Your payment notice has been sent to Scoopers Rentals. The company will verify the transfer and approve your booking once confirmed.",
      );
    } catch (err) {
      setError(err.message || "Unable to notify the receiver right now.");
    } finally {
      setNotifying(false);
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
            You can pay securely with <strong>Paystack</strong> or use the
            direct <strong>bank transfer</strong> option below.
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

          <div
            className="info-list"
            style={{
              marginTop: "1rem",
              paddingTop: "1rem",
              borderTop: "1px solid rgba(255,255,255,0.14)",
            }}
          >
            <div className="info-line">
              <span>Bank Transfer Option</span>
              <strong>Available</strong>
            </div>
            <div className="info-line">
              <span>Bank</span>
              <strong>Guaranty Trust Bank (GTBank)</strong>
            </div>
            <div className="info-line">
              <span>Account Number</span>
              <strong>0685937791</strong>
            </div>
          </div>

          <div
            className="support-contact-box"
            style={{ marginTop: "1rem", textAlign: "left" }}
          >
            <p>
              <strong>How payment approval works:</strong>
            </p>
            <p>1. Make the transfer to the account above.</p>
            <p>
              2. Send your payment proof through <strong>Customer Care</strong>.
            </p>
            <p>
              3. Scoopers Rentals will confirm the transfer and approve your
              booking manually.
            </p>
            <p>
              4. Once confirmed, the company updates your reservation as{" "}
              <strong>paid/approved</strong>.
            </p>
          </div>

          <p className="helper-text" style={{ marginTop: "1rem" }}>
            {config.message}
          </p>
          {notice && <p className="success-text">{notice}</p>}
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
              disabled={notifying}
              onClick={handleTransferNotice}
            >
              {notifying ? "Sending notice..." : "I've sent the money"}
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
