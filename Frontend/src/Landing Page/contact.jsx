// src/Landing Page/contact.jsx
import { useState, useEffect } from "react";

const BASE = "http://localhost:5000";

export default function Contact() {
  const [cms, setCms] = useState(null);

  useEffect(() => {
    fetch(`${BASE}/api/cms?section=contact`)
      .then(r => r.json())
      .then(data => setCms(data))
      .catch(() => {});
  }, []);

  const cards = [
    { icon: "📍", label: "Location", val: cms?.location ?? "Zamboanga City, PH"     },
    { icon: "📧", label: "Email",    val: cms?.email    ?? "smartalert@wmsu.edu.ph" },
    { icon: "📱", label: "Contact",  val: cms?.phone    ?? "+63 9XX XXX XXXX"       },
  ];

  return (
    <section id="contact" className="relative min-h-screen bg-[#070d1a] py-16 md:py-24 px-6 md:px-12 overflow-hidden">

      <div className="absolute w-125 h-125 rounded-full bg-blue-700 blur-[140px] opacity-8 -bottom-24 -left-24 pointer-events-none" />

      <div className="relative max-w-4xl mx-auto">

        <div className="text-center mb-10 md:mb-14">
          <span className="inline-block text-xs font-bold tracking-[0.18em] uppercase text-blue-400 border border-blue-400/30 rounded-full px-4 py-1 mb-4">
            Get in Touch
          </span>
          <h2 className="font-extrabold text-white tracking-tight leading-[1.15] mb-4" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>
            Have questions?<br />We're here.
          </h2>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-md mx-auto font-normal">
            Reach out about the Smart Alert system — whether you're interested in deploying it, contributing, or just want to learn more.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
          {cards.map(({ icon, label, val }) => (
            <div key={label} className="bg-white/3 border border-white/[0.07] rounded-2xl p-4 md:p-5 flex gap-4 items-center flex-1">
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="text-xs text-slate-300 uppercase tracking-widest font-semibold mb-0.5">{label}</p>
                <p className="text-sm text-slate-300 font-normal">{val}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}