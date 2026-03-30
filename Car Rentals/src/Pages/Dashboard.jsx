import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";

const VIDEO_URL =
  "https://cdn.coverr.co/videos/coverr-yellow-lamborghini-driving-on-open-road-5171/1080p.mp4";
const STORAGE_KEY = "scoopers_bookings";

function getStatus(booking) {
  const today = new Date();
  const start = new Date(booking.startDate);
  const end = new Date(booking.endDate);

  if (start > today) return "upcoming";
  if (start <= today && end >= today) return "active";
  return "completed";
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");
  const [bookings, setBookings] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem(STORAGE_KEY) ||
          localStorage.getItem("bookings") ||
          "[]",
      );
    } catch {
      return [];
    }
  });

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      return filter === "all" ? true : getStatus(booking) === filter;
    });
  }, [bookings, filter]);

  const totalSpent = bookings.reduce(
    (sum, booking) => sum + Number(booking.totalCost || 0),
    0,
  );

  const cancelBooking = (id) => {
    const updated = bookings.filter((booking) => booking.id !== id);
    setBookings(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem("bookings", JSON.stringify(updated));
  };

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
      <video className="bg-video" autoPlay muted loop playsInline>
        <source src={VIDEO_URL} type="video/mp4" />
      </video>
      <div className="video-overlay" />

      <section className="page-panel">
        <div className="glass-card dashboard-hero">
          <div>
            <span className="eyebrow">Member dashboard</span>
            <h1>Your reservations</h1>
            <p className="helper-text">Welcome back, {user.email}</p>
          </div>
          <button className="primary-btn" onClick={() => navigate("/")}>
            Book a Car
          </button>
        </div>

        <div className="stats-strip">
          <div className="glass-card stat-box">
            <span className="stat-label">Total Bookings</span>
            <span className="stat-value">{bookings.length}</span>
          </div>
          <div className="glass-card stat-box">
            <span className="stat-label">Upcoming</span>
            <span className="stat-value">
              {
                bookings.filter((booking) => getStatus(booking) === "upcoming")
                  .length
              }
            </span>
          </div>
          <div className="glass-card stat-box">
            <span className="stat-label">Active / Completed</span>
            <span className="stat-value">
              {
                bookings.filter((booking) => getStatus(booking) !== "upcoming")
                  .length
              }
            </span>
          </div>
          <div className="glass-card stat-box">
            <span className="stat-label">Total Spent</span>
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
          {filteredBookings.length === 0 ? (
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
                      <span>Total</span>
                      <strong>${booking.totalCost}</strong>
                    </div>
                  </div>

                  {status === "upcoming" && (
                    <button
                      className="secondary-btn full-width"
                      onClick={() => cancelBooking(booking.id)}
                    >
                      Cancel Booking
                    </button>
                  )}
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
