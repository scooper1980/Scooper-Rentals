import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./Context/AuthContext";
import Home from "./Pages/Home";
import Login from "./Pages/Login";
import Dashboard from "./Pages/Dashboard";
import Booking from "./Pages/Booking";
import CustomerCare from "./Pages/CustomerCare";
import "./App.css";

function Shell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const hideChrome = location.pathname === "/login";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      {!hideChrome && (
        <header className="site-header">
          <div className="site-bar">
            <Link to="/" className="brand">
              🚗 Scoopers Rentals
            </Link>

            <nav className="site-nav">
              <Link to="/" className="nav-link">
                Home
              </Link>
              <Link to="/dashboard" className="nav-link">
                Dashboard
              </Link>
              <Link to="/customer-care" className="nav-link">
                Customer Care
              </Link>
              {user ? (
                <>
                  <span className="user-chip">{user.email}</span>
                  <button className="nav-button" onClick={handleLogout}>
                    Logout
                  </button>
                </>
              ) : (
                <Link to="/login" className="nav-button">
                  Login
                </Link>
              )}
            </nav>
          </div>
        </header>
      )}

      <main className={hideChrome ? "site-main no-pad" : "site-main"}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/booking/:carId" element={<Booking />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customer-care" element={<CustomerCare />} />
        </Routes>
      </main>

      {!hideChrome && (
        <footer className="site-footer">
          <div className="footer-inner">
            <div>
              <strong>Scoopers Rentals</strong>
              <p>Luxury rides with a refined digital experience.</p>
            </div>
            <p>© 2026 Scoopers Rentals</p>
          </div>
        </footer>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </Router>
  );
}
