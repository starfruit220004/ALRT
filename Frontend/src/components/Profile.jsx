import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Camera, Save, X, Phone, AtSign, MapPin } from 'lucide-react';

export default function Profile({ onClose }) {
  const { user, setUser } = useAuth();
  const [editing, setEditing]       = useState(false);
  const [firstName, setFirstName]   = useState(user?.firstName  || '');
  const [lastName, setLastName]     = useState(user?.lastName   || '');
  const [middleName, setMiddleName] = useState(user?.middleName || '');
  const [name, setName]             = useState(user?.name       || '');
  const [username, setUsername]     = useState(user?.username   || '');
  const [email, setEmail]           = useState(user?.email      || '');
  const [phone, setPhone]           = useState(user?.phone      || '');
  const [address, setAddress]       = useState(user?.address    || '');
  const [avatar, setAvatar]         = useState(user?.avatar     || null);
  const [preview, setPreview]       = useState(user?.avatar     || null);
  const [saving, setSaving]         = useState(false);
  const [errors, setErrors]         = useState({});
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const fileRef = useRef();

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => { setPreview(reader.result); setAvatar(reader.result); };
    reader.readAsDataURL(file);
  }

  function validate() {
    const newErrors = {};
    if (!firstName.trim())  newErrors.firstName  = 'First name is required.';
    if (!lastName.trim())   newErrors.lastName   = 'Last name is required.';
    if (!username.trim())   newErrors.username   = 'Username is required.';
    if (!email.trim())      newErrors.email      = 'Email is required.';
    if (!phone.trim())      newErrors.phone      = 'Phone number is required.';
    if (!address.trim())    newErrors.address    = 'Address is required.';
    // middleName is optional — intentionally excluded
    return newErrors;
  }

  async function handleSave() {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    setSaving(true); setError(''); setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/auth/profile', {
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

      setFirstName(firstName);
      setLastName(lastName);
      setMiddleName(middleName);
      setName(`${firstName} ${lastName}`.trim() || name);
      setUsername(username);
      setEmail(email);
      setPhone(phone);
      setAddress(address);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>

        {/* Header with avatar inside */}
        <div className="h-36 bg-gradient-to-r from-slate-800 to-blue-700 relative rounded-t-xl flex items-end px-6 pb-4">
          <button onClick={onClose} className="absolute top-3 right-3 w-7 h-7 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors">
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
                <button onClick={() => fileRef.current.click()} className="absolute bottom-0 right-0 w-6 h-6 bg-slate-800 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors">
                  <Camera size={11} className="text-white" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </>
            )}
          </div>
        </div>

        <div className="px-6 pb-6 max-h-[70vh] overflow-y-auto pt-4">
          <div className="space-y-3">

            {/* First + Last */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                  <User size={11}/> First Name
                </label>
                {editing
                  ? <>
                      <input className={inputClass('firstName')} value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Juan" />
                      {errors.firstName && <span className="text-red-500 text-xs">{errors.firstName}</span>}
                    </>
                  : <p className="text-sm text-slate-800 font-medium">{firstName || '—'}</p>
                }
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                  <User size={11}/> Last Name
                </label>
                {editing
                  ? <>
                      <input className={inputClass('lastName')} value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Dela Cruz" />
                      {errors.lastName && <span className="text-red-500 text-xs">{errors.lastName}</span>}
                    </>
                  : <p className="text-sm text-slate-800 font-medium">{lastName || '—'}</p>
                }
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <User size={11}/> Middle Name <span className="text-slate-300 normal-case font-normal">(optional)</span>
              </label>
              {editing
                ? <input className="border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={middleName} onChange={e => setMiddleName(e.target.value)} placeholder="Santos" />
                : <p className="text-sm text-slate-800 font-medium">{middleName || '—'}</p>
              }
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <AtSign size={11}/> Username
              </label>
              {editing
                ? <>
                    <input className={inputClass('username')} value={username} onChange={e => setUsername(e.target.value)} placeholder="juandelacruz" />
                    {errors.username && <span className="text-red-500 text-xs">{errors.username}</span>}
                  </>
                : <p className="text-sm text-slate-800 font-medium">{username || '—'}</p>
              }
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Mail size={11}/> Email
              </label>
              {editing
                ? <>
                    <input type="email" className={inputClass('email')} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                    {errors.email && <span className="text-red-500 text-xs">{errors.email}</span>}
                  </>
                : <p className="text-sm text-slate-800 font-medium">{email || '—'}</p>
              }
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Phone size={11}/> Phone Number
              </label>
              {editing
                ? <>
                    <input className={inputClass('phone')} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+639XXXXXXXXX" />
                    {errors.phone && <span className="text-red-500 text-xs">{errors.phone}</span>}
                  </>
                : <p className="text-sm text-slate-800 font-medium">{phone || '—'}</p>
              }
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <MapPin size={11}/> Address
              </label>
              {editing
                ? <>
                    <textarea className={`${inputClass('address')} resize-none`} value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Rizal St, Zamboanga City" rows={2} />
                    {errors.address && <span className="text-red-500 text-xs">{errors.address}</span>}
                  </>
                : <p className="text-sm text-slate-800 font-medium">{address || '—'}</p>
              }
            </div>

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