/*
  ═══════════════════════════════════════════════════════
  src/socket.js
  ───────────────────────────────────────────────────────
  Set these in Vercel project → Settings → Environment Variables:
    VITE_API_URL    = https://your-backend.onrender.com
    VITE_SOCKET_URL = https://your-backend.onrender.com
  Both point to the same Render URL.
  ═══════════════════════════════════════════════════════
*/

import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'], // polling fallback for Render
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
});

socket.on('connect',       ()  => console.log('[Socket] Connected:', socket.id));
socket.on('disconnect',    (r) => console.warn('[Socket] Disconnected:', r));
socket.on('connect_error', (e) => console.error('[Socket] Error:', e.message));

export default socket;