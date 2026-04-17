// src/hooks/useCms.js
import { useState, useEffect } from "react";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function useCms(section) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`${BASE}/api/cms?section=${section}`)
      .then(r => r.json())
      .then(d => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [section]);

  return { data, loading };
}