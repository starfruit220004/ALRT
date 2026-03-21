// src/admin_pages/ContactCms.jsx
import { useState, useEffect, useCallback } from "react";

const BASE = "http://localhost:5000";

const FIELDS = [
  { key: "location", label: "Location" },
  { key: "email",    label: "Email"    },
  { key: "phone",    label: "Phone"    },
];

export default function ContactCms({ getHeaders, notify }) {
  const [fields,  setFields]  = useState({});
  const [draft,   setDraft]   = useState({});
  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [dirty,   setDirty]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setDirty(false);
    try {
      const res  = await fetch(`${BASE}/api/cms?section=contact`);
      const data = await res.json();
      setFields(data); setDraft({ ...data });
    } catch { notify("❌ Failed to load Contact content"); }
    finally  { setLoading(false); }
  }, [notify]);

  useEffect(() => { load(); }, [load]);

  const handleChange  = (key, val) => { setDraft(d => ({ ...d, [key]: val })); setDirty(true); };
  const handleDiscard = () => { setDraft({ ...fields }); setDirty(false); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res  = await fetch(`${BASE}/api/cms`, {
        method: "PUT", headers: getHeaders(),
        body: JSON.stringify({ section: "contact", updates: draft }),
      });
      const data = await res.json();
      if (!res.ok) return notify(`❌ ${data.message}`);
      notify("✅ Contact section updated!");
      setFields({ ...draft }); setDirty(false);
    } catch { notify("❌ Failed to save changes"); }
    finally  { setSaving(false); }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h2 className="font-semibold text-gray-800">📬 Contact Section</h2>
          <p className="text-xs text-gray-400 mt-0.5">Edit the location, email and phone shown on the landing page</p>
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
            {FIELDS.map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
                <input type="text" value={draft[key] ?? ""} onChange={e => handleChange(key, e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300" />
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