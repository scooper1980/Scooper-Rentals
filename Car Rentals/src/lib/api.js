const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:5000/api" : "/api");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson
    ? await response.json().catch(() => ({}))
    : await response.text().catch(() => "");

  if (!response.ok) {
    throw new Error((isJson && data.message) || "Request failed");
  }

  if (!isJson) {
    throw new Error(
      "Unexpected server response. Please refresh and try again.",
    );
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
  updatePaymentStatus: (bookingId, paymentStatus) =>
    request(`/bookings/${bookingId}/payment-status`, {
      method: "PATCH",
      body: JSON.stringify({ paymentStatus }),
    }),
  updateBookingStatus: (bookingId, status) =>
    request(`/bookings/${bookingId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};
