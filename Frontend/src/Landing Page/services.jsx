// src/Landing Page/services.jsx
import { useState, useEffect } from "react";

const BASE = "http://localhost:5000";

export default function Services() {
  const [cms, setCms] = useState(null);

  useEffect(() => {
    fetch(`${BASE}/api/cms?section=services`)
      .then(r => r.json())
      .then(data => setCms(data))
      .catch(() => {});
  }, []);

  const services = [
    {
      icon:  cms?.service0Icon  ?? "🔔",
      title: cms?.service0Title ?? "Real-Time Alerts",
      desc:  cms?.service0Desc  ?? "Instant SMS notifications the moment a sensor threshold is breached.",
    },
    {
      icon:  cms?.service1Icon  ?? "📊",
      title: cms?.service1Title ?? "Live Dashboard",
      desc:  cms?.service1Desc  ?? "Monitor all connected devices and sensor readings from dashboard.",
    },
    {
      icon:  cms?.service2Icon  ?? "📁",
      title: cms?.service2Title ?? "Event Logging",
      desc:  cms?.service2Desc  ?? "Every alert and sensor event is automatically logged with timestamps for audit reporting.",
    },
  ];

  return (
    <section id="services" className="relative min-h-screen bg-[#070d1a] py-16 md:py-24 px-6 md:px-12 overflow-hidden">

      <div className="absolute w-125 h-125 rounded-full bg-blue-700 blur-[140px] opacity-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      <div className="relative max-w-5xl mx-auto">

        <div className="text-center mb-10 md:mb-16">
          <span className="inline-block text-xs font-bold tracking-[0.18em] uppercase text-blue-400 border border-blue-400/30 rounded-full px-4 py-1 mb-4">
            What We Offer
          </span>
          <h2 className="font-extrabold text-white tracking-tight leading-[1.15] mb-4" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>
            Built for real-world<br />safety needs.
          </h2>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-lg mx-auto font-normal">
            Every feature in Alert is designed around one goal — getting the right information to the right people as fast as possible.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
          {services.map(({ icon, title, desc }) => (
            <div
              key={title}
              className="bg-white/3 border border-white/[0.07] rounded-2xl p-6 md:p-8 flex flex-col gap-3 hover:bg-white/6 hover:border-white/12 transition-all duration-200"
            >
              <span className="text-3xl leading-none">{icon}</span>
              <h3 className="text-slate-100 font-bold text-base">{title}</h3>
              <p className="text-slate-300 text-sm leading-relaxed font-normal">{desc}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}