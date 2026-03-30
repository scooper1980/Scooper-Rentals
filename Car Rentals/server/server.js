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

async function readCollection(filePath) {
  await ensureFile(filePath);
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw || "[]");
}

async function writeCollection(filePath, data) {
  await ensureFile(filePath);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "Scoopers Rentals API" });
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
  const bookings = await readCollection(bookingsFile);
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

  const bookings = await readCollection(bookingsFile);
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
  await writeCollection(bookingsFile, bookings);
  res.status(201).json(booking);
});

app.patch("/api/bookings/:id/payment-status", async (req, res) => {
  const { id } = req.params;
  const { paymentStatus } = req.body;
  const bookings = await readCollection(bookingsFile);
  const booking = bookings.find((item) => item.id === id);

  if (!booking) {
    return res.status(404).json({ message: "Booking not found." });
  }

  booking.paymentStatus = paymentStatus || booking.paymentStatus;
  await writeCollection(bookingsFile, bookings);
  res.json(booking);
});

app.get("/api/messages", async (_req, res) => {
  const messages = await readCollection(messagesFile);
  res.json(messages);
});

app.post("/api/messages", async (req, res) => {
  const { name, email, message } = req.body;

  if (!message) {
    return res.status(400).json({ message: "Message is required." });
  }

  const messages = await readCollection(messagesFile);
  const payload = {
    id: Date.now().toString(),
    name: name || "Website visitor",
    email: email || "not-provided@scoopersrentals.com",
    message,
    createdAt: new Date().toISOString(),
  };

  messages.unshift(payload);
  await writeCollection(messagesFile, messages);
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
      const bookings = await readCollection(bookingsFile);
      const booking = bookings.find((item) => item.id === bookingId);
      if (booking && payment.status === "success") {
        booking.paymentStatus = "paid";
        await writeCollection(bookingsFile, bookings);
      }
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({
      message: error.response?.data?.message || "Unable to verify payment.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Scoopers Rentals API running on http://localhost:${PORT}`);
});
