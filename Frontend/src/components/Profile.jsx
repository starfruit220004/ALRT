import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Camera, Save, X } from 'lucide-react';

export default function Profile({ onClose }) {
  const { user, setUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName]       = useState(user?.name || '');
  const [avatar, setAvatar]   = useState(user?.avatar || null);
  const [preview, setPreview] = useState(user?.avatar || null);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const fileRef = useRef();

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      setAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, avatar }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Update failed'); return; }
      setUser({ ...user, ...data.user });
      setSuccess('Profile updated!');
      setEditing(false);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setName(user?.name || '');
    setPreview(user?.avatar || null);
    setAvatar(user?.avatar || null);
    setEditing(false);
    setError('');
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-24 bg-gradient-to-r from-slate-800 to-blue-700 relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
          >
            <X size={14} className="text-white" />
          </button>
        </div>

        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="relative -mt-10 mb-4 w-fit">
            <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center ring-4 ring-white overflow-hidden">
              {preview
                ? <img src={preview} alt="avatar" className="w-full h-full object-cover" />
                : <User size={34} className="text-white" />
              }
            </div>
            {editing && (
              <>
                <button
                  onClick={() => fileRef.current.click()}
                  className="absolute bottom-0 right-0 w-6 h-6 bg-slate-800 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors"
                >
                  <Camera size={11} className="text-white" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </>
            )}
          </div>

          <div className="space-y-3">
            {/* Name */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <User size={11} /> Name
              </label>
              {editing ? (
                <input
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              ) : (
                <p className="text-sm text-slate-800 font-medium">{user?.name || '—'}</p>
              )}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Mail size={11} /> Email
              </label>
              <p className="text-sm text-slate-800 font-medium">{user?.email || '—'}</p>
            </div>
          </div>

          {error   && <p className="mt-3 text-sm text-red-500">{error}</p>}
          {success && <p className="mt-3 text-sm text-green-500">{success}</p>}

          {/* Actions */}
          <div className="mt-5 flex gap-3">
            {editing ? (
              <>
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
                  <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors">
                  <X size={14} /> Cancel
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors">
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}