import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#3b342d', color: '#fdfaf5',
            fontFamily: '"DM Sans", sans-serif', fontSize: '14px',
            borderRadius: '10px', padding: '12px 16px',
          },
          success: { iconTheme: { primary: '#74a082', secondary: '#fdfaf5' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fdfaf5' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)