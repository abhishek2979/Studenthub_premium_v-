import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GlobalStyle, Notification } from './components/UI';
import { useNotification } from './hooks/useNotification';

import LandingPage      from './pages/LandingPage';
import LoginPage        from './pages/LoginPage';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ResetPasswordPage from './pages/ResetPasswordPage';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function AppInner() {
  const { user, loading, saveSession, logout } = useAuth();
  const { notif, show: showNotif } = useNotification();
  // 'landing' | 'login-signin' | 'login-signup' | 'reset-password'
  const [screen, setScreen] = useState(() => {
    // Detect reset-password link: /reset-password?token=...&email=...
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('token') && params.get('email')) return 'reset-password';
    }
    return 'landing';
  });

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EFECEA' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid #E2DDD8', borderTop: '2px solid #2C2C27', animation: 'spin .8s linear infinite', margin: '0 auto 16px' }}/>
        <p style={{ fontSize: 13, color: '#A09891', fontFamily: "'DM Sans', sans-serif" }}>Loading StudentHub…</p>
      </div>
    </div>
  );

  // Reset password screen (from email link) — show even if logged in
  if (screen === 'reset-password') {
    return (
      <>
        <Notification notif={notif}/>
        <ResetPasswordPage
          showNotif={showNotif}
          onDone={() => {
            // Clear query params from URL
            window.history.replaceState({}, '', '/');
            setScreen('login-signin');
          }}
        />
      </>
    );
  }

  // Logged-in → show dashboard
  if (user) {
    return (
      <>
        <Notification notif={notif}/>
        {user.role === 'teacher'
          ? <TeacherDashboard user={user} onLogout={() => { logout(); setScreen('landing'); }} showNotif={showNotif}/>
          : <StudentDashboard user={user} onLogout={() => { logout(); setScreen('landing'); }} showNotif={showNotif}/>
        }
      </>
    );
  }

  return (
    <>
      <Notification notif={notif}/>
      {screen === 'landing'
        ? <LandingPage
            onGetStarted={() => setScreen('login-signup')}
            onSignIn={() => setScreen('login-signin')}
          />
        : <LoginPage
            defaultMode={screen === 'login-signup' ? 'signup' : 'signin'}
            onBack={() => setScreen('landing')}
            showNotif={showNotif}
            onLoginSuccess={(token, userData) => saveSession(token, userData)}
          />
      }
    </>
  );
}

export default function App() {
  if (!GOOGLE_CLIENT_ID) {
    console.warn('VITE_GOOGLE_CLIENT_ID is not set — Google login will not work.');
  }
  return (
    <AuthProvider>
      <GlobalStyle/>
      <AppInner/>
    </AuthProvider>
  );
}
