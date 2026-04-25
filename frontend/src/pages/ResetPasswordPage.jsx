import { useState } from 'react';
import { Lock, Eye, EyeOff, BookOpen, CheckCircle, ArrowLeft } from 'lucide-react';
import { C, Btn } from '../components/UI';
import { authAPI } from '../utils/api';

export default function ResetPasswordPage({ showNotif, onDone }) {
  // Read token + email from URL query params
  const params   = new URLSearchParams(window.location.search);
  const token    = params.get('token') || '';
  const email    = params.get('email') || '';

  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [done,      setDone]      = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!password)              return showNotif('Please enter a new password', 'error');
    if (password.length < 6)   return showNotif('Password must be at least 6 characters', 'error');
    if (password !== confirm)   return showNotif('Passwords do not match', 'error');

    setLoading(true);
    try {
      await authAPI.resetPassword({ token, email, password });
      setDone(true);
    } catch (err) {
      showNotif(err.response?.data?.message || 'Reset failed — link may have expired', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: C.sidebar, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 4px 16px rgba(0,0,0,.15)' }}>
            <BookOpen size={24} color="#F0EDE9"/>
          </div>
          <h1 style={{ fontFamily: "'Instrument Serif',serif", fontWeight: 400, fontSize: 26, color: C.text, letterSpacing: '-0.5px' }}>StudentHub</h1>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 28, boxShadow: '0 2px 16px rgba(0,0,0,.06)' }}>

          {done ? (
            /* ── Success state ── */
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle size={28} color="#3B6D11"/>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: C.text, margin: '0 0 10px' }}>Password updated!</h2>
              <p style={{ fontSize: 14, color: C.text3, margin: '0 0 28px', lineHeight: 1.6 }}>
                Your password has been reset successfully. You can now sign in with your new password.
              </p>
              <Btn onClick={onDone} style={{ width: '100%' }}>
                Go to Sign In
              </Btn>
            </div>
          ) : (
            /* ── Form ── */
            <>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: C.text, margin: '0 0 6px' }}>Set new password</h2>
              <p style={{ fontSize: 13, color: C.text3, margin: '0 0 22px', lineHeight: 1.6 }}>
                Enter a new password for <strong style={{ color: C.text2 }}>{email}</strong>
              </p>

              {(!token || !email) && (
                <div style={{ background: '#FAEAEA', border: '1px solid #F0C4C4', borderRadius: 10, padding: '12px 14px', marginBottom: 18 }}>
                  <p style={{ fontSize: 13, color: '#9B2020', margin: 0 }}>
                     Invalid or missing reset link. Please request a new one.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* New password */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text3, marginBottom: 6, letterSpacing: '0.4px' }}>NEW PASSWORD</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: C.text4, pointerEvents: 'none' }}/>
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      autoComplete="new-password"
                      style={{ width: '100%', boxSizing: 'border-box', background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '11px 44px 11px 38px', color: C.text, fontSize: 14, outline: 'none', fontFamily: "'DM Sans',sans-serif", transition: 'border-color .15s' }}
                      onFocus={e => e.target.style.borderColor = C.accent}
                      onBlur={e  => e.target.style.borderColor = C.border}
                    />
                    <button type="button" onClick={() => setShowPw(p => !p)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.text4 }}>
                      {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div style={{ marginBottom: 22 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text3, marginBottom: 6, letterSpacing: '0.4px' }}>CONFIRM PASSWORD</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: C.text4, pointerEvents: 'none' }}/>
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="Re-enter new password"
                      autoComplete="new-password"
                      style={{ width: '100%', boxSizing: 'border-box', background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '11px 44px 11px 38px', color: C.text, fontSize: 14, outline: 'none', fontFamily: "'DM Sans',sans-serif", transition: 'border-color .15s' }}
                      onFocus={e => e.target.style.borderColor = C.accent}
                      onBlur={e  => e.target.style.borderColor = C.border}
                    />
                  </div>
                  {/* Live match indicator */}
                  {confirm && (
                    <p style={{ fontSize: 11, margin: '5px 0 0', color: password === confirm ? '#3B6D11' : '#9B2020', fontWeight: 500 }}>
                      {password === confirm ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </p>
                  )}
                </div>

                <Btn type="submit" disabled={loading || !token} style={{ width: '100%' }}>
                  {loading ? 'Updating…' : 'Set New Password'}
                </Btn>
              </form>

              <button onClick={onDone}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: C.text4, fontSize: 12, fontWeight: 500, margin: '18px auto 0', fontFamily: "'DM Sans',sans-serif" }}>
                <ArrowLeft size={13}/> Back to Sign In
              </button>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, color: C.text4, fontSize: 12 }}>
          StudentHub © {new Date().getFullYear()} — Secure Academic Management
        </p>
      </div>
    </div>
  );
}
