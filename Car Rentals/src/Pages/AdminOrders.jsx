import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import BackgroundVideo from "../components/BackgroundVideo";
import { useAuth } from "../Context/AuthContext";
import { api } from "../lib/api";

export default function AdminOrders() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    const [bookingData, messageData] = await Promise.all([
      api.getBookings(),
      api.getMessages(),
    ]);

    setBookings(bookingData);
    setMessages(messageData);
  };

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    setError("");

    loadData()
      .catch((err) => setError(err.message || "Unable to load admin orders."))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user || !isAdmin) return undefined;

    const interval = setInterval(() => {
      loadData().catch(() => {});
    }, 5000);

    return () => clearInterval(interval);
  }, [user, isAdmin]);

  const paymentAlerts = useMemo(() => {
    return messages.filter((item) =>
      /bank transfer sent|payment|confirm payment|approved|completed|active/i.test(
        item.message || "",
      ),
    );
  }, [messages]);

  const customerThreads = useMemo(() => {
    const map = new Map();

    messages.forEach((item) => {
      if (!item.email) return;
      if (!map.has(item.email)) {
        map.set(item.email, {
          email: item.email,
          name: item.name || item.email.split("@")[0],
          lastMessage: item.message,
          createdAt: item.createdAt,
        });
      }
    });

    return Array.from(map.values());
  }, [messages]);

  const activeEmail = selectedEmail || customerThreads[0]?.email || "";

  const activeConversation = useMemo(() => {
    return messages
      .filter((item) => item.email === activeEmail)
      .slice()
      .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  }, [messages, activeEmail]);

  const pendingPayments = useMemo(() => {
    return bookings.filter((item) => item.paymentStatus !== "paid").length;
  }, [bookings]);

  const approvePayment = async (booking) => {
    setUpdatingId(booking.id);
    setError("");
    setSuccess("");

    try {
      const updated = await api.updatePaymentStatus(booking.id, "paid");
      setBookings((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      await loadData();
      setSuccess(
        `Payment approved for ${updated.fullName}. The order is now active and the customer has been notified.`,
      );
    } catch (err) {
      setError(err.message || "Unable to approve payment.");
    } finally {
      setUpdatingId("");
    }
  };

  const markCompleted = async (booking) => {
    setUpdatingId(booking.id);
    setError("");
    setSuccess("");

    try {
      const updated = await api.updateBookingStatus(booking.id, "completed");
      setBookings((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      await loadData();
      setSuccess(
        `Order marked as completed for ${updated.fullName}. The customer has been updated.`,
      );
    } catch (err) {
      setError(err.message || "Unable to mark the order as completed.");
    } finally {
      setUpdatingId("");
    }
  };

  const sendAdminReply = async (event) => {
    event.preventDefault();

    if (!activeEmail || !replyText.trim()) {
      setError("Select a customer and enter a reply message.");
      return;
    }

    setSendingReply(true);
    setError("");
    setSuccess("");

    try {
      await api.createMessage({
        name: "Scoopers Rentals Admin",
        email: activeEmail,
        from: "agent",
        type: "admin-reply",
        message: replyText.trim(),
      });

      setReplyText("");
      await loadData();
      setSuccess(`Reply sent to ${activeEmail}.`);
    } catch (err) {
      setError(err.message || "Unable to send admin reply.");
    } finally {
      setSendingReply(false);
    }
  };

  if (!user || !isAdmin) {
    return (
      <div className="video-page">
        <div className="video-overlay" />
        <section className="center-panel">
          <div className="glass-card auth-card">
            <h1>Admin access required</h1>
            <p className="helper-text">
              Please sign in with the admin staff page to view admin orders.
            </p>
            <button
              className="primary-btn full-width"
              onClick={() => navigate("/admin-login")}
            >
              Go to Admin Login
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
            <span className="eyebrow">Admin Orders</span>
            <h1>Customer orders and payment notifications</h1>
            <p className="helper-text">
              Review bookings, transfer alerts and approve payments here.
            </p>
          </div>
          <button className="primary-btn" onClick={() => loadData()}>
            Refresh Data
          </button>
        </div>

        {success && <p className="success-text">{success}</p>}
        {error && <p className="error-text">{error}</p>}

        <div className="stats-strip">
          <div className="glass-card stat-box">
            <span className="stat-label">Total Orders</span>
            <span className="stat-value">{bookings.length}</span>
          </div>
          <div className="glass-card stat-box">
            <span className="stat-label">Pending Payments</span>
            <span className="stat-value">{pendingPayments}</span>
          </div>
          <div className="glass-card stat-box">
            <span className="stat-label">Paid Orders</span>
            <span className="stat-value">
              {bookings.filter((item) => item.paymentStatus === "paid").length}
            </span>
          </div>
          <div className="glass-card stat-box">
            <span className="stat-label">Payment Alerts</span>
            <span className="stat-value">{paymentAlerts.length}</span>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="glass-card support-card">
            <span className="eyebrow">Orders</span>
            <h2>All customer bookings</h2>

            {loading ? (
              <p className="helper-text">Loading orders...</p>
            ) : bookings.length === 0 ? (
              <p className="helper-text">No customer orders yet.</p>
            ) : (
              <div className="stack-form">
                {bookings.map((booking) => (
                  <article key={booking.id} className="lux-card booking-card">
                    <div className="booking-top">
                      <div>
                        <h3>{booking.car?.name || "Reserved car"}</h3>
                        <p className="muted-text">
                          {booking.fullName} · {booking.phone}
                        </p>
                      </div>
                      <span className="status-tag">
                        {booking.status || "upcoming"}
                      </span>
                    </div>

                    <div className="info-list">
                      <div className="info-line">
                        <span>Email</span>
                        <strong>{booking.customerEmail}</strong>
                      </div>
                      <div className="info-line">
                        <span>Dates</span>
                        <strong>
                          {booking.startDate} → {booking.endDate}
                        </strong>
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

                    {booking.paymentStatus !== "paid" ? (
                      <button
                        className="primary-btn full-width"
                        type="button"
                        disabled={updatingId === booking.id}
                        onClick={() => approvePayment(booking)}
                      >
                        {updatingId === booking.id
                          ? "Approving..."
                          : "Approve Payment & Move to Active"}
                      </button>
                    ) : booking.status !== "completed" ? (
                      <button
                        className="secondary-btn full-width"
                        type="button"
                        disabled={updatingId === booking.id}
                        onClick={() => markCompleted(booking)}
                      >
                        {updatingId === booking.id
                          ? "Updating..."
                          : "Mark Order Completed"}
                      </button>
                    ) : (
                      <p className="helper-text">
                        This order has been completed.
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card support-card">
            <span className="eyebrow">Admin Chat Desk</span>
            <h2>Reply to customer service messages</h2>
            <p className="helper-text">
              Select a customer conversation below and send a direct reply from
              the admin page.
            </p>

            <div className="filter-row">
              {customerThreads.length === 0 ? (
                <div className="chat-bubble agent-msg">
                  No customer conversations yet.
                </div>
              ) : (
                customerThreads.map((thread) => (
                  <button
                    key={thread.email}
                    className={`filter-chip ${activeEmail === thread.email ? "active" : ""}`}
                    type="button"
                    onClick={() => setSelectedEmail(thread.email)}
                  >
                    {thread.name}
                  </button>
                ))
              )}
            </div>

            <div className="chat-window">
              {activeConversation.length === 0 ? (
                <div className="chat-bubble agent-msg">
                  Open a customer chat to reply here.
                </div>
              ) : (
                activeConversation.map((message) => (
                  <div
                    key={message.id}
                    className={`chat-bubble ${message.from === "agent" ? "agent-msg" : "user-msg"}`}
                  >
                    <strong>{message.name}</strong>
                    <br />
                    {message.message}
                    <br />
                    <small>
                      {new Date(message.createdAt).toLocaleString()}
                    </small>
                  </div>
                ))
              )}
            </div>

            <form className="chat-form" onSubmit={sendAdminReply}>
              <input
                className="classic-input"
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={
                  activeEmail
                    ? `Reply to ${activeEmail}`
                    : "Select a customer conversation first"
                }
                disabled={!activeEmail || sendingReply}
              />
              <button
                className="primary-btn"
                type="submit"
                disabled={!activeEmail || sendingReply}
              >
                {sendingReply ? "Sending..." : "Reply"}
              </button>
            </form>

            <div className="support-contact-box">
              <p>
                <strong>Payment alerts:</strong> {paymentAlerts.length}
              </p>
              <p>
                Customer replies will appear here automatically every few
                seconds.
              </p>
            </div>

            <button
              className="secondary-btn full-width"
              type="button"
              onClick={() => navigate("/dashboard")}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
