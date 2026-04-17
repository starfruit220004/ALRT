// src/admin_pages/HomeCms.jsx
import { useState, useEffect, useCallback } from "react";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const FIELDS = [
  { key: "typingWords",  label: "Typing Words (comma-separated)", textarea: false,
    hint: 'e.g. smarter.,faster.,safer.,reliable.' },
  { key: "subheadline", label: "Subheadline",    textarea: true  },
  { key: "stat0Val",    label: "Stat 1 — Value", textarea: false },
  { key: "stat0Label",  label: "Stat 1 — Label", textarea: false },
  { key: "stat1Val",    label: "Stat 2 — Value", textarea: false },
  { key: "stat1Label",  label: "Stat 2 — Label", textarea: false },
  { key: "stat2Val",    label: "Stat 3 — Value", textarea: false },
  { key: "stat2Label",  label: "Stat 3 — Label", textarea: false },
  { key: "stat3Val",    label: "Stat 4 — Value", textarea: false },
  { key: "stat3Label",  label: "Stat 4 — Label", textarea: false },
];

export default function HomeCms({ getHeaders, notify }) {
  const [fields, setFields] = useState({});
  const [draft, setDraft] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setDirty(false);
    try {
      const res = await fetch(`${BASE}/api/cms?section=hero`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFields(data); 
      setDraft({ ...data });
    } catch { 
      notify("❌ Failed to load Home content"); 
    } finally { 
      setLoading(false); 
    }
  }, [notify]);

  useEffect(() => { load(); }, [load]);

  const handleChange = (key, val) => { 
    setDraft(d => ({ ...d, [key]: val })); 
    setDirty(true); 
  };

  const handleDiscard = () => { 
    setDraft({ ...fields }); 
    setDirty(false); 
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/api/cms`, {
        method: "PUT", 
        headers: getHeaders(),
        body: JSON.stringify({ section: "hero", updates: draft }),
      });
      const resData = await res.json();
      
      if (!res.ok) return notify(`❌ ${resData.message}`);

      notify("✅ Home section updated!");
      // FIX: Sync state with server response (resData.data) 
      // instead of just local draft to ensure data integrity
      const updatedValue = resData.data || draft;
      setFields(updatedValue); 
      setDraft({ ...updatedValue });
      setDirty(false);
    } catch { 
      notify("❌ Failed to save changes"); 
    } finally { 
      setSaving(false); 
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h2 className="font-semibold text-gray-800">🏠 Home Section</h2>
          <p className="text-xs text-gray-400 mt-0.5">Edit typing words, subheadline and stats</p>
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

      <div className="p-5">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400 text-sm gap-2">
            <span className="animate-spin">⏳</span> Loading…
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FIELDS.map(({ key, label, textarea, hint }) => (
              <div key={key} className={textarea || key === "typingWords" ? "md:col-span-2" : ""}>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
                {textarea ? (
                  <textarea rows={3} value={draft[key] ?? ""} onChange={e => handleChange(key, e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-y" />
                ) : (
                  <input type="text" value={draft[key] ?? ""} onChange={e => handleChange(key, e.target.value)}
                    placeholder={hint ?? ""}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300" />
                )}
                {hint && (
                  <p className="text-xs text-gray-400 mt-1">💡 {hint}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

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