import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "data");
const bookingsFile = path.join(dataDir, "bookings.json");
const messagesFile = path.join(dataDir, "messages.json");
const staffFile = path.join(dataDir, "admin-staff.json");
const BOOKINGS_KEY = "scoopers:bookings";
const MESSAGES_KEY = "scoopers:messages";
const STAFF_KEY = "scoopers:admin-staff";
const ADMIN_STAFF_PASSCODE = process.env.ADMIN_STAFF_PASSCODE || "1980";
const IS_VERCEL = Boolean(process.env.VERCEL);
const STORAGE_URL =
  process.env.KV_REST_API_URL ||
  process.env.KV_URL ||
  process.env.STORAGE_REST_API_URL ||
  process.env.STORAGE_URL ||
  process.env.UPSTASH_REDIS_REST_URL;
const STORAGE_TOKEN =
  process.env.KV_REST_API_TOKEN ||
  process.env.STORAGE_REST_API_TOKEN ||
  process.env.STORAGE_TOKEN ||
  process.env.UPSTASH_REDIS_REST_TOKEN;
const USE_KV_STORAGE = Boolean(STORAGE_URL && STORAGE_TOKEN);
let storageMode = IS_VERCEL ? "memory-fallback" : "local-json";
let kvStore = null;

if (USE_KV_STORAGE) {
  try {
    const { createClient } = await import("@vercel/kv");
    kvStore = createClient({
      url: STORAGE_URL,
      token: STORAGE_TOKEN,
    });
    storageMode = "vercel-kv";
  } catch (error) {
    console.warn(
      "KV storage unavailable, using fallback storage instead.",
      error?.message || error,
    );
  }
}

const memoryStore = new Map([
  [BOOKINGS_KEY, []],
  [MESSAGES_KEY, []],
  [STAFF_KEY, []],
]);

app.use(cors());
app.use(express.json());

async function ensureFile(filePath) {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, "[]", "utf8");
  }
}

async function readCollection(storageKey, filePath) {
  if (kvStore) {
    try {
      const data = await kvStore.get(storageKey);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn(
        `KV read failed for ${storageKey}. Falling back to ${IS_VERCEL ? "memory" : "local"} storage.`,
        error?.message || error,
      );
      kvStore = null;
      storageMode = IS_VERCEL ? "memory-fallback" : "local-json";
    }
  }

  if (IS_VERCEL) {
    return memoryStore.get(storageKey) || [];
  }

  try {
    await ensureFile(filePath);
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn(
      `Local read failed for ${storageKey}. Returning an empty collection.`,
      error?.message || error,
    );
    return [];
  }
}

async function writeCollection(storageKey, filePath, data) {
  if (kvStore) {
    try {
      await kvStore.set(storageKey, data);
      return;
    } catch (error) {
      console.warn(
        `KV write failed for ${storageKey}. Falling back to ${IS_VERCEL ? "memory" : "local"} storage.`,
        error?.message || error,
      );
      kvStore = null;
      storageMode = IS_VERCEL ? "memory-fallback" : "local-json";
    }
  }

  if (IS_VERCEL) {
    memoryStore.set(storageKey, data);
    return;
  }

  await ensureFile(filePath);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "Scoopers Rentals API",
    storage: storageMode,
  });
});

app.get("/api/payments/config", (_req, res) => {
  res.json({
    provider: "paystack",
    enabled: Boolean(process.env.PAYSTACK_SECRET_KEY),
    message: process.env.PAYSTACK_SECRET_KEY
      ? "Paystack is configured."
      : "Add PAYSTACK_SECRET_KEY to enable live payments.",
  });
});

app.get("/api/bookings", async (_req, res) => {
  const bookings = await readCollection(BOOKINGS_KEY, bookingsFile);
  res.json(bookings);
});

app.post("/api/bookings", async (req, res) => {
  const {
    customerEmail,
    fullName,
    phone,
    startDate,
    endDate,
    insurance,
    totalCost,
    days,
    car,
  } = req.body;

  if (!customerEmail || !fullName || !phone || !startDate || !endDate || !car) {
    return res
      .status(400)
      .json({ message: "Missing required booking details." });
  }

  const bookings = await readCollection(BOOKINGS_KEY, bookingsFile);
  const booking = {
    id: Date.now().toString(),
    customerEmail,
    fullName,
    phone,
    startDate,
    endDate,
    insurance: Boolean(insurance),
    totalCost: Number(totalCost || 0),
    days: Number(days || 0),
    car,
    status: "upcoming",
    paymentStatus: "pending",
    createdAt: new Date().toISOString(),
  };

  bookings.unshift(booking);
  await writeCollection(BOOKINGS_KEY, bookingsFile, bookings);
  res.status(201).json(booking);
});

app.patch("/api/bookings/:id/payment-status", async (req, res) => {
  const { id } = req.params;
  const { paymentStatus } = req.body;
  const bookings = await readCollection(BOOKINGS_KEY, bookingsFile);
  const booking = bookings.find((item) => item.id === id);

  if (!booking) {
    return res.status(404).json({ message: "Booking not found." });
  }

  const previousPaymentStatus = booking.paymentStatus;
  booking.paymentStatus = paymentStatus || booking.paymentStatus;

  if (booking.paymentStatus === "paid") {
    booking.status = "active";
    booking.approvedAt = new Date().toISOString();
  }

  await writeCollection(BOOKINGS_KEY, bookingsFile, bookings);

  if (previousPaymentStatus !== "paid" && booking.paymentStatus === "paid") {
    const messages = await readCollection(MESSAGES_KEY, messagesFile);
    messages.unshift({
      id: `${Date.now()}-approval`,
      name: "Scoopers Rentals",
      email: booking.customerEmail,
      from: "agent",
      type: "payment-approval",
      message: `Hello ${booking.fullName}, your payment for ${booking.car?.name || "your booking"} has been approved. Your order is now active and your reservation is confirmed by Scoopers Rentals.`,
      createdAt: new Date().toISOString(),
    });
    await writeCollection(MESSAGES_KEY, messagesFile, messages);
  }

  res.json(booking);
});

app.patch("/api/bookings/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowedStatuses = ["upcoming", "active", "completed"];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid booking status." });
  }

  const bookings = await readCollection(BOOKINGS_KEY, bookingsFile);
  const booking = bookings.find((item) => item.id === id);

  if (!booking) {
    return res.status(404).json({ message: "Booking not found." });
  }

  const previousStatus = booking.status;
  booking.status = status;

  if (status === "completed") {
    booking.completedAt = new Date().toISOString();
  }

  await writeCollection(BOOKINGS_KEY, bookingsFile, bookings);

  if (previousStatus !== status && status === "completed") {
    const messages = await readCollection(MESSAGES_KEY, messagesFile);
    messages.unshift({
      id: `${Date.now()}-completed`,
      name: "Scoopers Rentals",
      email: booking.customerEmail,
      from: "agent",
      type: "booking-completed",
      message: `Hello ${booking.fullName}, your ${booking.car?.name || "booking"} order has been marked as completed. Thank you for choosing Scoopers Rentals.`,
      createdAt: new Date().toISOString(),
    });
    await writeCollection(MESSAGES_KEY, messagesFile, messages);
  }

  res.json(booking);
});

app.post("/api/admin-staff/register", async (req, res) => {
  const { name, email, password, passcode } = req.body;

  if (!name || !email || !password || !passcode) {
    return res
      .status(400)
      .json({ message: "Please complete all admin fields." });
  }

  if (passcode !== ADMIN_STAFF_PASSCODE) {
    return res.status(401).json({ message: "Invalid staff passcode." });
  }

  const staffAccounts = await readCollection(STAFF_KEY, staffFile);
  const existing = staffAccounts.find(
    (item) => item.email.toLowerCase() === email.toLowerCase(),
  );

  if (existing) {
    return res.status(409).json({
      message: "This admin email already exists. Please login instead.",
    });
  }

  const staffMember = {
    id: Date.now().toString(),
    name,
    email: email.toLowerCase(),
    password,
    createdAt: new Date().toISOString(),
  };

  staffAccounts.unshift(staffMember);
  await writeCollection(STAFF_KEY, staffFile, staffAccounts);

  res.status(201).json({
    id: staffMember.id,
    name: staffMember.name,
    email: staffMember.email,
  });
});

app.post("/api/admin-staff/login", async (req, res) => {
  const { email, password, passcode } = req.body;

  if (!email || !password || !passcode) {
    return res
      .status(400)
      .json({ message: "Please complete all admin fields." });
  }

  if (passcode !== ADMIN_STAFF_PASSCODE) {
    return res.status(401).json({ message: "Invalid staff passcode." });
  }

  const staffAccounts = await readCollection(STAFF_KEY, staffFile);
  const staffMember = staffAccounts.find(
    (item) =>
      item.email.toLowerCase() === email.toLowerCase() &&
      item.password === password,
  );

  if (!staffMember) {
    return res.status(401).json({ message: "Invalid admin login details." });
  }

  res.json({
    id: staffMember.id,
    name: staffMember.name,
    email: staffMember.email,
  });
});

app.get("/api/messages", async (_req, res) => {
  const messages = await readCollection(MESSAGES_KEY, messagesFile);
  res.json(messages);
});

app.post("/api/messages", async (req, res) => {
  const { name, email, message, from, type } = req.body;

  if (!message) {
    return res.status(400).json({ message: "Message is required." });
  }

  const messages = await readCollection(MESSAGES_KEY, messagesFile);
  const payload = {
    id: Date.now().toString(),
    name: name || "Website visitor",
    email: email || "not-provided@scoopersrentals.com",
    from: from || "user",
    type: type || "general",
    message,
    createdAt: new Date().toISOString(),
  };

  messages.unshift(payload);
  await writeCollection(MESSAGES_KEY, messagesFile, messages);
  res.status(201).json(payload);
});

app.post("/api/payments/paystack/initialize", async (req, res) => {
  const { email, amount, bookingId } = req.body;

  if (!process.env.PAYSTACK_SECRET_KEY) {
    return res.status(500).json({
      message:
        "Paystack is not configured yet. Add PAYSTACK_SECRET_KEY in your .env file.",
    });
  }

  if (!email || !amount) {
    return res.status(400).json({ message: "Email and amount are required." });
  }

  try {
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: Math.round(Number(amount) * 100),
        callback_url: `${process.env.APP_URL || "http://localhost:5173"}/dashboard`,
        metadata: {
          bookingId,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    res.json(response.data.data);
  } catch (error) {
    res.status(500).json({
      message:
        error.response?.data?.message ||
        "Unable to initialize Paystack payment.",
    });
  }
});

app.get("/api/payments/paystack/verify/:reference", async (req, res) => {
  const { reference } = req.params;

  if (!process.env.PAYSTACK_SECRET_KEY) {
    return res.status(500).json({ message: "Paystack is not configured yet." });
  }

  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      },
    );

    const payment = response.data.data;
    const bookingId = payment.metadata?.bookingId;

    if (bookingId) {
      const bookings = await readCollection(BOOKINGS_KEY, bookingsFile);
      const booking = bookings.find((item) => item.id === bookingId);
      if (booking && payment.status === "success") {
        const wasPaid = booking.paymentStatus === "paid";
        booking.paymentStatus = "paid";
        booking.status = "active";
        booking.approvedAt = new Date().toISOString();
        await writeCollection(BOOKINGS_KEY, bookingsFile, bookings);

        if (!wasPaid) {
          const messages = await readCollection(MESSAGES_KEY, messagesFile);
          messages.unshift({
            id: `${Date.now()}-paystack-approval`,
            name: "Scoopers Rentals",
            email: booking.customerEmail,
            from: "agent",
            type: "payment-approval",
            message: `Hello ${booking.fullName}, your payment for ${booking.car?.name || "your booking"} has been confirmed. Your order is now active.`,
            createdAt: new Date().toISOString(),
          });
          await writeCollection(MESSAGES_KEY, messagesFile, messages);
        }
      }
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({
      message: error.response?.data?.message || "Unable to verify payment.",
    });
  }
});

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  app.listen(PORT, () => {
    console.log(`Scoopers Rentals API running on http://localhost:${PORT}`);
  });
}

export default app;
