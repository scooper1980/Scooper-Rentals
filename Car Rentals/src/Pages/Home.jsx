import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { carsData } from "../Data/Car";
import { useAuth } from "../Context/AuthContext";
import BackgroundVideo from "../components/BackgroundVideo";

export default function Home() {
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  const filteredCars = useMemo(() => {
    return carsData.filter((car) => {
      const term = search.toLowerCase();
      return (
        car.name.toLowerCase().includes(term) ||
        car.category.toLowerCase().includes(term) ||
        car.location.toLowerCase().includes(term)
      );
    });
  }, [search]);

  const handleReserve = (carId) => {
    navigate(user ? `/booking/${carId}` : "/login");
  };

  return (
    <div className="video-page">
      <BackgroundVideo />
      <div className="video-overlay" />

      <section className="page-panel home-panel">
        <div className="glass-card hero-card">
          <span className="eyebrow">
            Premium fleet · Fast booking · Elegant service
          </span>
          <h1>Classy car rentals with a luxury feel.</h1>
          <p>
            Reserve refined city cruisers, executive SUVs and weekend-ready
            rides inside a polished Scoopers Rentals experience.
          </p>

          <div className="hero-tools">
            <input
              className="classic-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by model, category or city"
            />
            <button
              className="secondary-btn"
              onClick={() => navigate(user ? "/dashboard" : "/login")}
            >
              {user ? "Open Dashboard" : "Login to Book"}
            </button>
          </div>
        </div>

        <div className="stats-strip">
          <div className="glass-card stat-box">
            <span className="stat-label">Cars Available</span>
            <span className="stat-value">{carsData.length}+</span>
          </div>
          <div className="glass-card stat-box">
            <span className="stat-label">Top Tier Support</span>
            <span className="stat-value">24/7</span>
          </div>
          <div className="glass-card stat-box">
            <span className="stat-label">Instant Approval</span>
            <span className="stat-value">Under 2 min</span>
          </div>
        </div>

        <div className="catalog-grid">
          {filteredCars.map((car) => (
            <article key={car.id} className="lux-card car-tile">
              <img src={car.image} alt={car.name} />
              <div className="car-meta">
                <h2>{car.name}</h2>
                <p className="muted-text">{car.description}</p>
                <div className="detail-row">
                  <span>{car.category}</span>
                  <span>•</span>
                  <span>{car.location}</span>
                  <span>•</span>
                  <span>{car.transmission}</span>
                </div>
                <p className="price-text">${car.pricePerDay} / day</p>
                <button
                  className="primary-btn"
                  onClick={() => handleReserve(car.id)}
                >
                  Reserve Now
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="home-footer">
          <small>
            {user
              ? `Signed in as ${user.email}`
              : "Please sign in to complete a booking."}
          </small>
          <p className="contact-note">
            Contact us via <strong>oluwaseyifapohunda@gmail.com</strong> or{" "}
            <strong>07039971401</strong>
          </p>
        </div>
      </section>
    </div>
  );
}
