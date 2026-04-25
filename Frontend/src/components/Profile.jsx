/*
  ═══════════════════════════════════════════════════════
  src/components/Profile.jsx
  ───────────────────────────────────────────────────────
  FIXES:
  1. DeviceIdCard now reads userId from the `user` object
     passed via useAuth() context instead of calling
     localStorage.getItem('userId') directly.
     The old code could return null if your auth flow
     stores the user differently, causing the whole
     DeviceIdCard to silently disappear.
  2. Install note updated: pin qrcode.react to v3 or higher,
     since v2 and below use a default export and the named
     import { QRCodeSVG } would silently fail.
     Run: npm install qrcode.react@3
  ═══════════════════════════════════════════════════════
*/

import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  User, Mail, Camera, Save, X, Phone,
  AtSign, MapPin, Cpu, Copy, CheckCheck, Wifi,
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ── Device ID card with QR code ──────────────────────
// ✅ FIX: Accepts userId as a prop from the parent component,
//    which reads it from useAuth(). The old version called
//    localStorage.getItem('userId') independently — if the key
//    name ever changed or the value wasn't stored there, the
//    card would silently return null with no error shown.
function DeviceIdCard({ userId }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(String(userId));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!userId) return null;

  return (
    <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4 space-y-3 mt-2">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
          <Cpu size={16} className="text-blue-600" />
        </div>
        <div>
          <p className="text-xs font-bold text-blue-900">Device Setup ID</p>
          <p className="text-[11px] text-blue-500">Use this ID to link your physical device to your account</p>
        </div>
      </div>

      {/* Manual entry */}
      <div>
        <div className="flex items-center justify-between bg-white border border-blue-200 rounded-lg px-3 py-2">
          <span className="text-2xl font-black text-blue-700 tracking-widest">{userId}</span>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              copied
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200'
            }`}
          >
            {copied ? <><CheckCheck size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
          </button>
        </div>
      </div>

      {/* Steps */}
      <ol className="space-y-1.5">
        {[
          'Power on your ALRT device',
          'Connect phone to "ALRT_Setup_Portal" hotspot',
          'Enter the Setup ID above into the device configuration page',
          'Enter your WiFi password and tap Save',
        ].map((step, i) => (
          <li key={i} className="flex items-start gap-2 text-[11px] text-blue-700">
            <span className="w-4 h-4 rounded-full bg-blue-200 text-blue-800 font-bold flex items-center justify-center shrink-0 text-[9px] mt-0.5">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>

      {/* Warning */}
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        <Wifi size={12} className="text-amber-600 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-700">
          Make sure to enter the correct Setup ID to receive alerts.
        </p>
      </div>
    </div>
  );
}

// ── Main Profile component ────────────────────────────
export default function Profile({ onClose }) {
  const { user, setUser } = useAuth();
  const [editing,    setEditing]    = useState(false);
  const [firstName,  setFirstName]  = useState(user?.firstName  || '');
  const [lastName,   setLastName]   = useState(user?.lastName   || '');
  const [middleName, setMiddleName] = useState(user?.middleName || '');
  const [name,       setName]       = useState(user?.name       || '');
  const [username,   setUsername]   = useState(user?.username   || '');
  const [email,      setEmail]      = useState(user?.email      || '');
  const [phone,      setPhone]      = useState(user?.phone      || '');
  const [address,    setAddress]    = useState(user?.address    || '');
  const [avatar,     setAvatar]     = useState(user?.avatar     || null);
  const [preview,    setPreview]    = useState(user?.avatar     || null);
  const [saving,     setSaving]     = useState(false);
  const [errors,     setErrors]     = useState({});
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');
  const fileRef = useRef();

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => { setPreview(reader.result); setAvatar(reader.result); };
    reader.readAsDataURL(file);
  }

  function validate() {
    const errs = {};
    if (!firstName.trim()) errs.firstName = 'First name is required.';
    if (!lastName.trim())  errs.lastName  = 'Last name is required.';
    if (!username.trim())  errs.username  = 'Username is required.';
    if (!email.trim())     errs.email     = 'Email is required.';
    if (!phone.trim()) errs.phone = 'Phone number is required.';
    else if (!/^\+?\d{10,15}$/.test(phone.trim().replace(/[\s-]/g, ""))) errs.phone = 'Invalid phone number (10-15 digits).';
    if (!address.trim())   errs.address   = 'Address is required.';
    return errs;
  }

  async function handleSave() {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    setErrors({});
    setSaving(true); setError(''); setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: `${firstName} ${lastName}`.trim() || name,
          avatar, phone, username,
          firstName, lastName, middleName,
          address, email,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Update failed'); return; }

      const u = data.user;
      const updated = {
        ...user,
        name:       `${firstName} ${lastName}`.trim() || name,
        email,
        avatar:     u.avatar     || avatar  || null,
        mqttTopic:  u.mqttTopic  || user?.mqttTopic || null,
        phone:      phone        || null,
        username:   username     || null,
        firstName:  firstName    || null,
        lastName:   lastName     || null,
        middleName: middleName   || null,
        address:    address      || null,
      };
      setUser(updated);
      setPreview(u.avatar || avatar || null);
      setAvatar(u.avatar  || avatar || null);
      setSuccess('Profile updated!');
      setEditing(false);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setFirstName(user?.firstName   || '');
    setLastName(user?.lastName     || '');
    setMiddleName(user?.middleName || '');
    setName(user?.name             || '');
    setUsername(user?.username     || '');
    setEmail(user?.email           || '');
    setPhone(user?.phone           || '');
    setAddress(user?.address       || '');
    setPreview(user?.avatar        || null);
    setAvatar(user?.avatar         || null);
    setEditing(false);
    setErrors({});
    setError('');
  }

  const inputClass = (field) =>
    `border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full ${
      errors[field] ? 'border-red-400' : 'border-slate-300'
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-36 bg-gradient-to-r from-slate-800 to-blue-700 relative rounded-t-xl flex items-end px-6 pb-4">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors"
          >
            <X size={14} className="text-white" />
          </button>
          <div className="relative">
            <div className="w-20 h-20 rounded-full ring-4 ring-white bg-blue-600 flex items-center justify-center">
              <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                {preview
                  ? <img src={preview} alt="avatar" className="w-full h-full object-cover object-center" />
                  : <User size={30} className="text-white" />
                }
              </div>
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
          <div className="ml-4 mb-1">
            <h2 className="text-xl font-bold text-white leading-tight">{username || user?.username || 'User'}</h2>
            <p className="text-xs text-blue-200">{user?.role === 'admin' ? 'Administrator' : 'Smart Alert User'}</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 max-h-[70vh] overflow-y-auto pt-4">
          <div className="space-y-3">

            {/* First + Last */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                  <User size={11}/> First Name
                </label>
                {editing
                  ? <><input className={inputClass('firstName')} value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Juan" />
                      {errors.firstName && <span className="text-red-500 text-xs">{errors.firstName}</span>}</>
                  : <p className="text-sm text-slate-800 font-medium">{firstName || '—'}</p>
                }
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                  <User size={11}/> Last Name
                </label>
                {editing
                  ? <><input className={inputClass('lastName')} value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Dela Cruz" />
                      {errors.lastName && <span className="text-red-500 text-xs">{errors.lastName}</span>}</>
                  : <p className="text-sm text-slate-800 font-medium">{lastName || '—'}</p>
                }
              </div>
            </div>

            {/* Middle Name */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <User size={11}/> Middle Name <span className="text-slate-300 normal-case font-normal">(optional)</span>
              </label>
              {editing
                ? <input className="border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={middleName} onChange={e => setMiddleName(e.target.value)} placeholder="Santos" />
                : <p className="text-sm text-slate-800 font-medium">{middleName || '—'}</p>
              }
            </div>

            {/* Username */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <AtSign size={11}/> Username
              </label>
              {editing
                ? <><input className={inputClass('username')} value={username} onChange={e => setUsername(e.target.value)} placeholder="juandelacruz" />
                    {errors.username && <span className="text-red-500 text-xs">{errors.username}</span>}</>
                : <p className="text-sm text-slate-800 font-medium">{username || '—'}</p>
              }
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Mail size={11}/> Email
              </label>
              {editing
                ? <><input type="email" className={inputClass('email')} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                    {errors.email && <span className="text-red-500 text-xs">{errors.email}</span>}</>
                : <p className="text-sm text-slate-800 font-medium">{email || '—'}</p>
              }
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Phone size={11}/> Phone Number
              </label>
              {editing
                ? <><input className={inputClass('phone')} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+639XXXXXXXXX" />
                    {errors.phone && <span className="text-red-500 text-xs">{errors.phone}</span>}</>
                : <p className="text-sm text-slate-800 font-medium">{phone || '—'}</p>
              }
            </div>

            {/* Address */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <MapPin size={11}/> Address
              </label>
              {editing
                ? <><textarea className={`${inputClass('address')} resize-none`} value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Rizal St, Zamboanga City" rows={2} />
                    {errors.address && <span className="text-red-500 text-xs">{errors.address}</span>}</>
                : <p className="text-sm text-slate-800 font-medium">{address || '—'}</p>
              }
            </div>

            {/* ── Device Setup ID card — always visible ── */}
            {/* ✅ FIX: Pass userId from auth context, not localStorage */}
            <DeviceIdCard userId={user?.id} />

          </div>

          {error   && <p className="mt-3 text-sm text-red-500">{error}</p>}
          {success && <p className="mt-3 text-sm text-green-500">{success}</p>}

          <div className="mt-5 flex gap-3">
            {editing ? (
              <>
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50">
                  <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors">
                  <X size={14} /> Cancel
                </button>
              </>
            ) : (
              <button onClick={() => { setEditing(true); setSuccess(''); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-xl transition-colors">
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}