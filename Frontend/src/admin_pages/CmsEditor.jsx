// src/components/CmsEditor.jsx
import { useState, useEffect, useCallback } from "react";

const BASE = "http://localhost:5000";

const SECTIONS = [
  { key: "hero",     label: "🏠 Hero" },
  { key: "services", label: "⚡ Services" },
  { key: "about",    label: "📖 About" },
  { key: "contact",  label: "📬 Contact" },
];

const KEY_LABELS = {
  headline:      "Headline",
  subheadline:   "Subheadline",
  stat0Val:      "Stat 1 — Value",   stat0Label: "Stat 1 — Label",
  stat1Val:      "Stat 2 — Value",   stat1Label: "Stat 2 — Label",
  stat2Val:      "Stat 3 — Value",   stat2Label: "Stat 3 — Label",
  stat3Val:      "Stat 4 — Value",   stat3Label: "Stat 4 — Label",
  service0Icon:  "Service 1 — Icon", service0Title: "Service 1 — Title", service0Desc: "Service 1 — Description",
  service1Icon:  "Service 2 — Icon", service1Title: "Service 2 — Title", service1Desc: "Service 2 — Description",
  service2Icon:  "Service 3 — Icon", service2Title: "Service 3 — Title", service2Desc: "Service 3 — Description",
  body1:    "Body Paragraph 1",
  body2:    "Body Paragraph 2",
  location: "Location",
  email:    "Email",
  phone:    "Phone",
};

const TEXTAREA_KEYS = new Set([
  "subheadline", "body1", "body2",
  "service0Desc", "service1Desc", "service2Desc",
]);

export default function CmsEditor({ getHeaders, notify }) {
  const [activeSection, setActiveSection] = useState("hero");
  const [fields, setFields]   = useState({});
  const [draft, setDraft]     = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [dirty, setDirty]     = useState(false);

  const loadSection = useCallback(async (section) => {
    setLoading(true);
    setDirty(false);
    try {
      const res  = await fetch(`${BASE}/api/cms?section=${section}`);
      const data = await res.json();
      setFields(data);
      setDraft({ ...data });
    } catch {
      notify("❌ Failed to load CMS content");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { loadSection(activeSection); }, [activeSection, loadSection]);

  const handleChange  = (key, value) => { setDraft(d => ({ ...d, [key]: value })); setDirty(true); };
  const handleDiscard = () => { setDraft({ ...fields }); setDirty(false); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res  = await fetch(`${BASE}/api/cms`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ section: activeSection, updates: draft }),
      });
      const data = await res.json();
      if (!res.ok) return notify(`❌ ${data.message}`);
      notify("✅ CMS updated!");
      setFields({ ...draft });
      setDirty(false);
    } catch {
      notify("❌ Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h2 className="font-semibold text-gray-800">Landing Page CMS</h2>
          <p className="text-xs text-gray-400 mt-0.5">Edit content shown on the public landing page</p>
        </div>
        {dirty && (
          <div className="flex gap-2">
            <button onClick={handleDiscard} className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors">Discard</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-60">
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 px-5 pt-3 border-b border-gray-100">
        {SECTIONS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 -mb-px ${
              activeSection === key
                ? "border-blue-600 text-blue-600 bg-blue-50"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Fields */}
      <div className="p-5">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400 text-sm gap-2">
            <span className="animate-spin">⏳</span> Loading…
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(draft).map(key => (
              <div key={key} className={TEXTAREA_KEYS.has(key) ? "md:col-span-2" : ""}>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  {KEY_LABELS[key] ?? key}
                </label>
                {TEXTAREA_KEYS.has(key) ? (
                  <textarea rows={3} value={draft[key] ?? ""} onChange={e => handleChange(key, e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-y" />
                ) : (
                  <input type="text" value={draft[key] ?? ""} onChange={e => handleChange(key, e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sticky save bar */}
      {dirty && !loading && (
        <div className="flex items-center justify-between px-5 py-3 bg-amber-50 border-t border-amber-200">
          <p className="text-xs text-amber-700 font-medium">⚠ You have unsaved changes</p>
          <div className="flex gap-2">
            <button onClick={handleDiscard} className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors">Discard</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-60">
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}