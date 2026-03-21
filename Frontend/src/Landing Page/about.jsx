// src/Landing Page/about.jsx
import { useState, useEffect } from "react";

const BASE = "http://localhost:5000";

export default function About() {
  const [cms, setCms] = useState(null);

  useEffect(() => {
    fetch(`${BASE}/api/cms?section=about`)
      .then(r => r.json())
      .then(data => setCms(data))
      .catch(() => {});
  }, []);

  const stats = [
    { n: cms?.stat0Val ?? "2026",  l: cms?.stat0Label ?? "Year Built"      },
    { n: cms?.stat1Val ?? "IoT",   l: cms?.stat1Label ?? "Core Technology" },
    { n: cms?.stat2Val ?? "MQTT",  l: cms?.stat2Label ?? "Protocol"        },
    { n: cms?.stat3Val ?? "React", l: cms?.stat3Label ?? "Frontend Stack"  },
  ];

  return (
    <section id="about" className="relative min-h-screen bg-[#060f1e] py-16 md:py-24 px-6 md:px-12 overflow-hidden">

      <div className="absolute w-112.5 h-112.5 rounded-full bg-blue-700 blur-[130px] opacity-10 -top-24 -right-24 pointer-events-none" />

      <div className="relative max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">

          <div className="flex flex-col gap-5 text-center md:text-left">
            <span className="inline-block text-xs font-bold tracking-[0.18em] uppercase text-blue-400 border border-blue-400/30 rounded-full px-4 py-1 w-fit mx-auto md:mx-0">
              About the Project
            </span>
            <h2 className="font-extrabold text-white tracking-tight leading-[1.15]" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>
              {cms?.headline ?? "Smart Alert — why it exists."}
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              {cms?.body1 ?? "Smart Alert was built to solve a simple but critical problem: people don't find out about dangers until it's too late. Whether it's a gas leak, a fire, or flooding — seconds matter."}
            </p>
            <p className="text-slate-300 text-sm leading-relaxed">
              {cms?.body2 ?? "This IoT system bridges the gap between physical sensors and human response, delivering real-time alerts through a reliable, low-latency notification pipeline."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {stats.map(({ n, l }) => (
              <div key={l} className="bg-white/4 border border-white/8 rounded-2xl p-5 md:p-6 flex flex-col gap-1">
                <strong className="text-xl md:text-2xl font-extrabold text-white tracking-tight">{n}</strong>
                <span className="text-xs text-slate-300 uppercase tracking-widest font-medium">{l}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}