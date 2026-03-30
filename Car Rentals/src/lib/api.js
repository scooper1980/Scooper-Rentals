const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export const api = {
  getBookings: () => request("/bookings"),
  createBooking: (payload) =>
    request("/bookings", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getMessages: () => request("/messages"),
  createMessage: (payload) =>
    request("/messages", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getPaymentConfig: () => request("/payments/config"),
  initializePaystack: (payload) =>
    request("/payments/paystack/initialize", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  verifyPaystack: (reference) =>
    request(`/payments/paystack/verify/${reference}`),
};
