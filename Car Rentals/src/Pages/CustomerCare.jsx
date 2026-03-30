import React, { useEffect, useState } from "react";
import BackgroundVideo from "../components/BackgroundVideo";
import { useAuth } from "../Context/AuthContext";
import { api } from "../lib/api";

const starterMessages = [
  {
    id: 1,
    from: "agent",
    text: "Hello and welcome to Scoopers Rentals support. How can we help you today?",
  },
  {
    id: 2,
    from: "agent",
    text: "You can ask about bookings, payments, pickup details, or car availability.",
  },
];

export default function CustomerCare() {
  const { user } = useAuth();
  const [messages, setMessages] = useState(starterMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getMessages()
      .then((items) => {
        const ownMessages = items
          .filter((item) => !user?.email || item.email === user.email)
          .slice(0, 6)
          .reverse()
          .map((item) => ({
            id: item.id,
            from: "user",
            text: item.message,
          }));

        if (ownMessages.length) {
          setMessages([...starterMessages, ...ownMessages]);
        }
      })
      .catch(() => {
        // keep starter messages if backend is unavailable
      });
  }, [user]);

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!input.trim()) return;

    const messageText = input.trim();
    setError("");
    setSending(true);

    const userMessage = {
      id: Date.now(),
      from: "user",
      text: messageText,
    };

    const replyMessage = {
      id: Date.now() + 1,
      from: "agent",
      text: "Thanks for reaching out. Your message has been saved for the Scoopers Rentals team and they will respond shortly. You can also contact us via oluwaseyifapohunda@gmail.com or 07039971401.",
    };

    try {
      await api.createMessage({
        name: user?.email?.split("@")[0] || "Website visitor",
        email: user?.email || "guest@scoopersrentals.com",
        message: messageText,
      });

      setMessages((prev) => [...prev, userMessage, replyMessage]);
      setInput("");
    } catch (err) {
      setError(err.message || "Unable to send your message right now.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="video-page">
      <BackgroundVideo />
      <div className="video-overlay" />

      <section className="center-panel">
        <div className="glass-card support-card">
          <span className="eyebrow">Customer Care</span>
          <h1>Live Support Chat</h1>
          <p className="helper-text">
            Reach our support team for quick help with bookings, payments and
            delivery.
          </p>

          <div className="chat-window">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chat-bubble ${message.from === "user" ? "user-msg" : "agent-msg"}`}
              >
                {message.text}
              </div>
            ))}
          </div>

          <form className="chat-form" onSubmit={sendMessage}>
            <input
              className="classic-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
            />
            <button className="primary-btn" type="submit" disabled={sending}>
              {sending ? "Sending..." : "Send"}
            </button>
          </form>

          {error && <p className="error-text">{error}</p>}

          <div className="support-contact-box">
            <p>
              <strong>Email:</strong> oluwaseyifapohunda@gmail.com
            </p>
            <p>
              <strong>Phone:</strong> 07039971401
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
