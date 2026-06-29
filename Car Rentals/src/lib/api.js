const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

async function request(path, options = {}) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const candidates = [];

  if (API_BASE) {
    candidates.push(`${API_BASE}${normalizedPath}`);
  }
  candidates.push(normalizedPath);
  if (API_BASE === "/api") {
    candidates.push(normalizedPath.replace(/^\/api/, "") || "/");
  }

  let lastError;

  for (const url of candidates) {
    let response;

    try {
      response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
        ...options,
      });
    } catch (error) {
      lastError = error;
      continue;
    }

    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const data = isJson
      ? await response.json().catch(() => ({}))
      : await response.text().catch(() => "");

    if (response.ok) {
      if (!isJson) {
        throw new Error(
          "Unexpected server response. Please refresh and try again.",
        );
      }
      return data;
    }

    if (response.status !== 404 && response.status !== 405) {
      const message =
        (isJson && data.message) ||
        (typeof data === "string" && data.trim()) ||
        "Request failed";
      throw new Error(message);
    }

    lastError = new Error(
      (isJson && data.message) ||
        (typeof data === "string" && data.trim()) ||
        "Request failed",
    );
  }

  if (lastError) {
    throw lastError;
  }

  throw new Error(
    "Unable to reach the server right now. Please try again in a moment.",
  );
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
