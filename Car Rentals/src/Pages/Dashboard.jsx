import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import BackgroundVideo from "../components/BackgroundVideo";
import { api } from "../lib/api";

function getStatus(booking) {
  if (booking.status) return booking.status;

  const today = new Date();
  const start = new Date(booking.startDate);
  const end = new Date(booking.endDate);

  if (start > today) return "upcoming";
  if (start <= today && end >= today) return "active";
  return "completed";
}

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  const [filter, setFilter] = useState("all");
  const [bookings, setBookings] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentNotice, setPaymentNotice] = useState("");

  const loadDashboardData = async () => {
    const [bookingData, messageData] = await Promise.all([
      api.getBookings(),
      api.getMessages(),
    ]);

    const visibleBookings = isAdmin
      ? bookingData
      : bookingData.filter((item) => item.customerEmail === user?.email);

    const visibleMessages = isAdmin
      ? messageData
      : messageData.filter((item) => item.email === user?.email);

    setBookings(visibleBookings);
    setMessages(visibleMessages);
  };

  useEffect(() => {
    if (!user) return undefined;

    setLoading(true);
    setError("");

    loadDashboardData()
      .catch((err) => setError(err.message || "Unable to load dashboard data."))
      .finally(() => setLoading(false));

    const interval = setInterval(() => {
      loadDashboardData().catch(() => {});
    }, 5000);

    return () => clearInterval(interval);
  }, [user, isAdmin]);

  useEffect(() => {
    const reference = new URLSearchParams(location.search).get("reference");
    if (!reference || !user) return;

    api
      .verifyPaystack(reference)
      .then((payment) => {
        if (payment.status === "success") {
          setPaymentNotice(
            "Payment verified successfully. Your booking is now marked as paid.",
          );
        } else {
          setPaymentNotice(`Payment status: ${payment.status}`);
        }

        return loadDashboardData();
      })
      .catch((err) => {
        setError(err.message || "Unable to verify the payment.");
      });
  }, [location.search, user]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      return filter === "all" ? true : getStatus(booking) === filter;
    });
  }, [bookings, filter]);

  const totalSpent = bookings.reduce(
    (sum, booking) => sum + Number(booking.totalCost || 0),
    0,
  );

  const paidBookings = bookings.filter(
    (booking) => booking.paymentStatus === "paid",
  ).length;

  if (!user) {
    return (
      <div className="video-page">
        <div className="video-overlay" />
        <section className="center-panel">
          <div className="glass-card auth-card">
            <h1>Login required</h1>
            <p className="helper-text">Please sign in to view your bookings.</p>
            <button
              className="primary-btn full-width"
              onClick={() => navigate("/login")}
            >
              Go to Login
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

      <section className="page-panel">
        <div className="glass-card dashboard-hero">
          <div>
            <span className="eyebrow">Admin & Member Dashboard</span>
            <h1>Live bookings and support activity</h1>
            <p className="helper-text">Welcome back, {user.email}</p>
          </div>
          <button className="primary-btn" onClick={() => navigate("/")}>
            Book a Car
          </button>
        </div>

        {paymentNotice && <p className="success-text">{paymentNotice}</p>}
        {error && <p className="error-text">{error}</p>}

        <div className="stats-strip">
          <div className="glass-card stat-box">
            <span className="stat-label">Total Bookings</span>
            <span className="stat-value">{bookings.length}</span>
          </div>
          <div className="glass-card stat-box">
            <span className="stat-label">Paid Bookings</span>
            <span className="stat-value">{paidBookings}</span>
          </div>
          <div className="glass-card stat-box">
            <span className="stat-label">Customer Messages</span>
            <span className="stat-value">{messages.length}</span>
          </div>
          <div className="glass-card stat-box">
            <span className="stat-label">Total Value</span>
            <span className="stat-value">${totalSpent}</span>
          </div>
        </div>

        <div className="filter-row">
          {[
            ["all", "All"],
            ["upcoming", "Upcoming"],
            ["active", "Active"],
            ["completed", "Completed"],
          ].map(([value, label]) => (
            <button
              key={value}
              className={`filter-chip ${filter === value ? "active" : ""}`}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="dashboard-grid">
          {loading ? (
            <div className="glass-card empty-card">
              <h3>Loading dashboard...</h3>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="glass-card empty-card">
              <h3>No bookings yet</h3>
              <p className="helper-text">
                Start with a premium ride from the homepage.
              </p>
            </div>
          ) : (
            filteredBookings.map((booking) => {
              const status = getStatus(booking);
              return (
                <article key={booking.id} className="lux-card booking-card">
                  <div className="booking-top">
                    <div>
                      <h3>{booking.car?.name || "Reserved car"}</h3>
                      <p className="muted-text">
                        {booking.fullName} · {booking.phone}
                      </p>
                    </div>
                    <span className="status-tag">{status}</span>
                  </div>

                  <div className="info-list">
                    <div className="info-line">
                      <span>Customer</span>
                      <strong>{booking.customerEmail}</strong>
                    </div>
                    <div className="info-line">
                      <span>Dates</span>
                      <strong>
                        {booking.startDate} → {booking.endDate}
                      </strong>
                    </div>
                    <div className="info-line">
                      <span>Duration</span>
                      <strong>{booking.days} day(s)</strong>
                    </div>
                    <div className="info-line">
                      <span>Order Status</span>
                      <strong>{status}</strong>
                    </div>
                    <div className="info-line">
                      <span>Payment</span>
                      <strong>{booking.paymentStatus || "pending"}</strong>
                    </div>
                    <div className="info-line">
                      <span>Total</span>
                      <strong>${booking.totalCost}</strong>
                    </div>
                  </div>

                  {booking.paymentStatus !== "paid" && (
                    <button
                      className="secondary-btn full-width"
                      onClick={() =>
                        navigate(`/payment/${booking.id}`, {
                          state: { booking },
                        })
                      }
                    >
                      Complete Payment
                    </button>
                  )}
                </article>
              );
            })
          )}
        </div>

        <div
          className="glass-card support-card"
          style={{ marginTop: "1.5rem" }}
        >
          <span className="eyebrow">Customer Care Inbox</span>
          <h2>Recent support messages</h2>
          <div className="chat-window">
            {messages.length === 0 ? (
              <div className="chat-bubble agent-msg">
                No customer messages yet.
              </div>
            ) : (
              messages.slice(0, 8).map((message) => (
                <div key={message.id} className="chat-bubble agent-msg">
                  <strong>{message.name}</strong>
                  <br />
                  <span>{message.email}</span>
                  <br />
                  {message.message}
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
