import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "738442222410-ge7b5pttaa9p5bf62h8f96ivo9murbhl.apps.googleusercontent.com";

// Initialize Google OAuth once outside the React tree so StrictMode's
// double-invoke does not call google.accounts.id.initialize() twice.
const root = createRoot(document.getElementById('root'));

root.render(
  <GoogleOAuthProvider clientId={CLIENT_ID}>
    <StrictMode>
      <App />
    </StrictMode>
  </GoogleOAuthProvider>,
);