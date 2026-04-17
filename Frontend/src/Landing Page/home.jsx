// src/Landing Page/home.jsx
import { useState, useEffect } from "react";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const DEFAULT_WORDS = ["smarter.", "faster.", "safer.", "reliable."];

function useTyping(words) {
  const [text, setText] = useState("");
  const [wi, setWi] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!words || words.length === 0) return;
    const word = words[wi % words.length];
    let timeout;
    if (!deleting) {
      if (text.length < word.length) timeout = setTimeout(() => setText(word.slice(0, text.length + 1)), 95);
      else timeout = setTimeout(() => setDeleting(true), 1600);
    } else {
      if (text.length > 0) timeout = setTimeout(() => setText(text.slice(0, -1)), 55);
      else { setDeleting(false); setWi((wi + 1) % words.length); }
    }
    return () => clearTimeout(timeout);
  }, [text, wi, deleting, words]);

  return text;
}

export default function Home() {
  const [cms, setCms] = useState(null);

  useEffect(() => {
    fetch(`${BASE}/api/cms?section=hero`)
      .then(r => r.json())
      .then(data => setCms(data))
      .catch(() => {});
  }, []);

  // ✅ Parse typing words from CMS — stored as comma-separated string
  // e.g. "smarter.,faster.,safer.,reliable."
  const typingWords = cms?.typingWords
    ? cms.typingWords.split(",").map(w => w.trim()).filter(Boolean)
    : DEFAULT_WORDS;

  const typed = useTyping(typingWords);

  const stats = [
    { val: cms?.stat0Val   ?? "99.9%", label: cms?.stat0Label ?? "Uptime"        },
    { val: cms?.stat1Val   ?? "<2s",   label: cms?.stat1Label ?? "Alert Latency" },
    { val: cms?.stat2Val   ?? "24/7",  label: cms?.stat2Label ?? "Monitoring"    },
    { val: cms?.stat3Val   ?? "100+",  label: cms?.stat3Label ?? "Sensor Types"  },
  ];

  return (
    <section id="home" className="relative min-h-screen bg-[#060f1e] flex items-center overflow-hidden pt-16">

      <div className="absolute w-100 md:w-150 h-100 md:h-150 rounded-full bg-blue-700 blur-[120px] opacity-15 -top-40 -left-48 pointer-events-none" />
      <div className="absolute w-75 md:w-100 h-75 md:h-100 rounded-full bg-[#0c2340] blur-[120px] opacity-15 -bottom-20 -right-24 pointer-events-none" />

      <div className="w-full max-w-6xl mx-auto px-6 md:px-12 py-12 md:py-16 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">

        {/* Left */}
        <div className="flex flex-col gap-5 md:gap-6 text-center md:text-left">
          <span className="inline-block text-xs font-bold tracking-[0.18em] uppercase text-blue-400 border border-blue-400/30 rounded-full px-4 py-1 w-fit mx-auto md:mx-0">
            IoT Alert System
          </span>

          <h1 className="font-extrabold text-white leading-[1.1] tracking-tight" style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}>
            Stay ALERT.<br />
            Stay{" "}
            <span className="text-blue-400">
              {typed}
              <span className="inline-block w-0.75 h-[0.85em] bg-blue-400 ml-1 align-middle animate-[blink_0.6s_step-end_infinite]" />
            </span>
          </h1>

          <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-md font-normal mx-auto md:mx-0">
            {cms?.subheadline ?? "ALRT is a real-time IoT monitoring system that detects environmental and safety threats — and notifies you instantly before they escalate."}
          </p>
        </div>

        {/* Right — stats */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {stats.map(({ val, label }) => (
            <div key={label} className="bg-white/4 border border-white/8 rounded-2xl p-5 md:p-7 flex flex-col gap-1">
              <span className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{val}</span>
              <span className="text-xs font-medium text-slate-300 uppercase tracking-widest">{label}</span>
            </div>
          ))}
        </div>

      </div>

      <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
    </section>
  );
}