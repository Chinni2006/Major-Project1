import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider }        from './context/AuthContext';
import { TeacherAuthProvider } from './context/TeacherAuthContext';
import { AppProvider }         from './context/AppContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <TeacherAuthProvider>
          <AppProvider>
            <App/>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: { background:'#0a1628', color:'#e2e8f0', border:'1px solid rgba(99,102,241,0.3)', fontFamily:'Space Grotesk, sans-serif' },
              }}
            />
          </AppProvider>
        </TeacherAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
