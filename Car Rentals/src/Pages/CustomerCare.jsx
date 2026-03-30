import React, { useState } from "react";

const VIDEO_URL =
  "https://cdn.coverr.co/videos/coverr-yellow-lamborghini-driving-on-open-road-5171/1080p.mp4";

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
  const [messages, setMessages] = useState(starterMessages);
  const [input, setInput] = useState("");

  const sendMessage = (event) => {
    event.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      from: "user",
      text: input.trim(),
    };

    const replyMessage = {
      id: Date.now() + 1,
      from: "agent",
      text: "Thanks for reaching out. Our customer care team will respond shortly. You can also contact us directly via oluwaseyifapohunda@gmail.com or 07039971401.",
    };

    setMessages((prev) => [...prev, userMessage, replyMessage]);
    setInput("");
  };

  return (
    <div className="video-page">
      <video className="bg-video" autoPlay muted loop playsInline>
        <source src={VIDEO_URL} type="video/mp4" />
      </video>
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
            <button className="primary-btn" type="submit">
              Send
            </button>
          </form>

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
