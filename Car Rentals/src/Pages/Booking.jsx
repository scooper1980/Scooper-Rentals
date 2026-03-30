import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCarById } from "../Data/Car";
import { useAuth } from "../Context/AuthContext";
import BackgroundVideo from "../components/BackgroundVideo";
import { api } from "../lib/api";

export default function Booking() {
  const { carId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const car = getCarById(carId);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [insurance, setInsurance] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const days = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  }, [startDate, endDate]);

  const totalCost = useMemo(() => {
    if (!car || !days) return 0;
    return days * car.pricePerDay + (insurance ? days * 20 : 0);
  }, [car, days, insurance]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!user) {
      setError("Please login before completing a booking.");
      return;
    }

    if (!fullName || !phone || !startDate || !endDate) {
      setError("Please complete all booking fields.");
      return;
    }

    if (days <= 0) {
      setError("Please choose a valid rental period.");
      return;
    }

    try {
      setLoading(true);

      const booking = await api.createBooking({
        customerEmail: user.email,
        car,
        fullName,
        phone,
        startDate,
        endDate,
        insurance,
        totalCost,
        days,
      });

      navigate(`/payment/${booking.id}`, { state: { booking } });
    } catch (err) {
      setError(err.message || "Unable to save booking.");
    } finally {
      setLoading(false);
    }
  };

  if (!car) {
    return (
      <div className="video-page">
        <div className="video-overlay" />
        <section className="center-panel">
          <div className="glass-card auth-card">
            <h1>Car not found</h1>
            <button
              className="primary-btn full-width"
              onClick={() => navigate("/")}
            >
              Return Home
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

      <section className="page-panel booking-layout">
        <div className="lux-card booking-card">
          <img className="summary-image" src={car.image} alt={car.name} />
          <h2>{car.name}</h2>
          <p className="muted-text">{car.description}</p>

          <div className="info-list">
            <div className="info-line">
              <span>Category</span>
              <strong>{car.category}</strong>
            </div>
            <div className="info-line">
              <span>Location</span>
              <strong>{car.location}</strong>
            </div>
            <div className="info-line">
              <span>Transmission</span>
              <strong>{car.transmission}</strong>
            </div>
            <div className="info-line">
              <span>Rate</span>
              <strong>${car.pricePerDay} / day</strong>
            </div>
            <div className="info-line">
              <span>Estimated total</span>
              <strong>${totalCost || car.pricePerDay}</strong>
            </div>
          </div>
        </div>

        <div className="glass-card form-card">
          <span className="eyebrow">Reserve this ride</span>
          <h2>Complete your booking</h2>
          <p className="form-note">
            Your reservation will be saved to the live dashboard and sent to
            payment.
          </p>

          <form className="stack-form" onSubmit={handleSubmit}>
            <input
              className="classic-input"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name"
            />
            <input
              className="classic-input"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
            />
            <input
              className="classic-input"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={today}
            />
            <input
              className="classic-input"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || today}
            />

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={insurance}
                onChange={(e) => setInsurance(e.target.checked)}
              />
              <span>Add premium cover (+$20/day)</span>
            </label>

            {error && <p className="error-text">{error}</p>}

            <button
              className="primary-btn full-width"
              type="submit"
              disabled={loading}
            >
              {loading ? "Saving booking..." : "Continue to Payment"}
            </button>
            <button
              className="secondary-btn full-width"
              type="button"
              onClick={() => navigate("/")}
            >
              Back to cars
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
