import React, { useEffect, useRef, useState } from "react";

const VIDEO_URL =
  "https://cdn.coverr.co/videos/coverr-yellow-lamborghini-driving-on-open-road-5171/1080p.mp4";
const POSTER_URL =
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80";

export default function BackgroundVideo() {
  const videoRef = useRef(null);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;

    const tryPlay = async () => {
      try {
        await video.play();
      } catch {
        setShowFallback(true);
      }
    };

    tryPlay();
  }, []);

  if (showFallback) {
    return <div className="bg-video fallback-bg" aria-hidden="true" />;
  }

  return (
    <video
      ref={videoRef}
      className="bg-video"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      poster={POSTER_URL}
      aria-hidden="true"
      onError={() => setShowFallback(true)}
    >
      <source src={VIDEO_URL} type="video/mp4" />
    </video>
  );
}
