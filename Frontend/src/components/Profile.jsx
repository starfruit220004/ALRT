import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Camera, Save, X } from 'lucide-react';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [editing, setEditing]   = useState(false);
  const [name, setName]         = useState(user?.name || '');
  const [avatar, setAvatar]     = useState(user?.avatar || null);
  const [preview, setPreview]   = useState(user?.avatar || null);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const fileRef = useRef();

  // Convert image file to base64 for preview + storage
  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      setAvatar(reader.result); // base64 string saved to DB
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

      if (!res.ok) {
        setError(data.message || 'Update failed');
        return;
      }

      // Update context + localStorage
      const updatedUser = { ...user, ...data.user };
      setUser(updatedUser);
      localStorage.setItem('name',   data.user.name);
      localStorage.setItem('avatar', data.user.avatar || '');

      setSuccess('Profile updated!');
      setEditing(false);
    } catch (err) {
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
    <div className="max-w-xl mx-auto mt-10">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

        {/* Header banner */}
        <div className="h-28 bg-linear-to-r from-slate-800 to-blue-700" />

        <div className="px-8 pb-8">

          {/* Avatar */}
          <div className="relative -mt-12 mb-4 w-fit">
            <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center ring-4 ring-white overflow-hidden">
              {preview
                ? <img src={preview} alt="avatar" className="w-full h-full object-cover" />
                : <User size={40} className="text-white" />
              }
            </div>

            {/* Camera button — only clickable when editing */}
            {editing && (
              <>
                <button
                  onClick={() => fileRef.current.click()}
                  className="absolute bottom-0 right-0 w-7 h-7 bg-slate-800 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors"
                >
                  <Camera size={13} className="text-white" />
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </>
            )}
          </div>

          {/* Role badge */}
          <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide mb-4 ${user?.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
            {user?.role || 'user'}
          </span>

          {/* Fields */}
          <div className="space-y-4">

            {/* Name — auto-filled from signup, editable */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <User size={12} /> Name
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

            {/* Email — read only */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Mail size={12} /> Email
              </label>
              <p className="text-sm text-slate-800 font-medium">{user?.email || '—'}</p>
              <p className="text-xs text-slate-400">Email cannot be changed</p>
            </div>

            {/* Role — read only */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Shield size={12} /> Role
              </label>
              <p className="text-sm text-slate-800 font-medium capitalize">{user?.role || '—'}</p>
            </div>
          </div>

          {/* Feedback */}
          {error   && <p className="mt-4 text-sm text-red-500">{error}</p>}
          {success && <p className="mt-4 text-sm text-green-500">{success}</p>}

          {/* Buttons */}
          <div className="mt-6 flex gap-3">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  <Save size={15} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
                >
                  <X size={15} /> Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}