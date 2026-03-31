const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:5000/api" : "/api");

async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });
  } catch {
    throw new Error(
      "Unable to reach the server right now. Please try again in a moment.",
    );
  }

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson
    ? await response.json().catch(() => ({}))
    : await response.text().catch(() => "");

  if (!response.ok) {
    const message =
      (isJson && data.message) ||
      (typeof data === "string" && data.trim()) ||
      "Request failed";
    throw new Error(message);
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
  registerAdminStaff: (payload) =>
    request("/admin-staff/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  loginAdminStaff: (payload) =>
    request("/admin-staff/login", {
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
