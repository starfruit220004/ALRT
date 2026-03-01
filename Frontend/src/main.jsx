// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
// import './index.css'
// import App from './App.jsx'
// import { GoogleOAuthProvider } from '@react-oauth/google'


// const Client_ID = "738442222410-ge7b5pttaa9p5bf62h8f96ivo9murbhl.apps.googleusercontent.com"

// createRoot(document.getElementById('root')).render(
//   <StrictMode>
//     <GoogleOAuthProvider clientId = {Client_ID}>
//       <App />
//     </GoogleOAuthProvider>
    
//   </StrictMode>,
// )

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google'


const Client_ID = "738442222410-ge7b5pttaa9p5bf62h8f96ivo9murbhl.apps.googleusercontent.com"

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId = {Client_ID}>
      <App />
    </GoogleOAuthProvider>
    
  </StrictMode>,
)