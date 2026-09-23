import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import { AuthProvider } from './context/AuthContext.jsx'
import { registerSW } from 'virtual:pwa-register'

// Automatically register the service worker
const updateSW = registerSW({
  onNeedRefresh() {
    // Optional: show a prompt to user to refresh for new content
  },
  onOfflineReady() {
    // Optional: show a prompt to user that app is ready for offline use
  },
})

// Prevent mouse scroll from changing number input values globally
document.addEventListener('wheel', () => {
  if (document.activeElement && document.activeElement.type === 'number') {
    document.activeElement.blur();
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)

