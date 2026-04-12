import { useState, useRef } from 'react';
import { Lock, Mail, User, BookOpen, Eye, EyeOff, AtSign, ArrowLeft, CheckCircle } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { C, Btn } from '../components/UI';
import { authAPI } from '../utils/api';

function Field({ label, icon: Icon, type = 'text', value, onChange, placeholder, autoComplete, rightEl }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text3, marginBottom: 6, letterSpacing: '0.4px' }}>{label}</label>}
      <div style={{ position: 'relative' }}>
        {Icon && <Icon size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: C.text4, pointerEvents: 'none' }} />}
        <input
          type={type} value={value} onChange={onChange}
          placeholder={placeholder} autoComplete={autoComplete}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: `11px 14px 11px ${Icon ? 38 : 14}px`,
            paddingRight: rightEl ? 44 : 14,
            color: C.text, fontSize: 14, outline: 'none',
            fontFamily: "'DM Sans', sans-serif", transition: 'border-color .15s',
          }}
          onFocus={e => e.target.style.borderColor = C.accent}
          onBlur={e  => e.target.style.borderColor = C.border}
        />
        {rightEl}
      </div>
    </div>
  );
}

function EyeBtn({ show, toggle }) {
  return (
    <button type="button" onClick={toggle}
      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.text4 }}>
      {show ? <EyeOff size={15}/> : <Eye size={15}/>}
    </button>
  );
}

function Divider({ label = 'OR' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
      <div style={{ flex: 1, height: 1, background: C.border }}/>
      <span style={{ fontSize: 11, fontWeight: 600, color: C.text4, letterSpacing: '1px' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: C.border }}/>
    </div>
  );
}

function ForgotPasswordScreen({ onBack, showNotif }) {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  const submit = async e => {
    e.preventDefault();
    if (!email) return showNotif('Please enter your email', 'error');
    setLoading(true);
    try {
      await authAPI.forgotPassword({ email });
      setSent(true);
    } catch {
      showNotif('Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (sent) return (
    <div style={{ textAlign: 'center', padding: '10px 0 4px' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <CheckCircle size={28} color="#3B6D11"/>
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 600, color: C.text, margin: '0 0 8px' }}>Check your email</h3>
      <p style={{ fontSize: 13, color: C.text3, margin: '0 0 24px', lineHeight: 1.6 }}>
        If <strong>{email}</strong> is registered, we've sent a password reset link. Check your inbox (and spam folder).
      </p>
      <p style={{ fontSize: 12, color: C.text4, margin: '0 0 20px' }}>Link expires in 1 hour.</p>
      <button onClick={onBack}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: C.accent, fontSize: 13, fontWeight: 600, margin: '0 auto', fontFamily: "'DM Sans',sans-serif" }}>
        <ArrowLeft size={14}/> Back to Sign In
      </button>
    </div>
  );

  return (
    <div>
      <button onClick={onBack}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: C.text3, fontSize: 13, fontWeight: 500, marginBottom: 20, padding: 0, fontFamily: "'DM Sans',sans-serif" }}>
        <ArrowLeft size={14}/> Back to Sign In
      </button>

      <h3 style={{ fontSize: 18, fontWeight: 600, color: C.text, margin: '0 0 6px' }}>Reset your password</h3>
      <p style={{ fontSize: 13, color: C.text3, margin: '0 0 22px', lineHeight: 1.6 }}>
        Enter your teacher email address and we'll send you a link to reset your password.
      </p>

      <form onSubmit={submit}>
        <Field label="TEACHER EMAIL" icon={Mail} type="email" value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="teacher@school.edu" autoComplete="email" />
        <div style={{ marginTop: 6 }}/>
        <Btn type="submit" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Sending…' : 'Send Reset Link'}
        </Btn>
      </form>

      <p style={{ fontSize: 12, color: C.text4, textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
        Only works for email/password accounts.<br/>Google sign-in accounts don't need a password.
      </p>
    </div>
  );
}

function TeacherEmailPanel({ onLoginSuccess, showNotif, onForgotPassword }) {
  const [mode,     setMode]     = useState('signin');
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const submitting = useRef(false);

  const eyeBtn = <EyeBtn show={showPw} toggle={() => setShowPw(p => !p)} />;

  const handleSubmit = async e => {
    e.preventDefault();
    if (submitting.current) return;
    if (!email || !password) return showNotif('Email and password are required', 'error');
    if (mode === 'signup') {
      if (!name.trim())        return showNotif('Name is required', 'error');
      if (password.length < 6) return showNotif('Password must be at least 6 characters', 'error');
      if (password !== confirm) return showNotif('Passwords do not match', 'error');
    }
    submitting.current = true;
    setLoading(true);
    try {
      const fn   = mode === 'signup' ? authAPI.teacherRegister : authAPI.teacherLogin;
      const body = mode === 'signup' ? { name: name.trim(), email, password } : { email, password };
      const res  = await fn(body);
      onLoginSuccess(res.data.token, res.data.user);
    } catch (err) {
      showNotif(err.response?.data?.message || (mode === 'signup' ? 'Registration failed' : 'Invalid email or password'), 'error');
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Sign in / Create account toggle */}
      <div style={{ display: 'flex', background: C.card2, borderRadius: 8, padding: 3, marginBottom: 22 }}>
        {[['signin', 'Sign In'], ['signup', 'Create Account']].map(([v, l]) => (
          <button key={v} onClick={() => setMode(v)}
            style={{ flex: 1, padding: '8px 0', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12, fontFamily: "'DM Sans',sans-serif", background: mode === v ? C.text : 'transparent', color: mode === v ? '#fff' : C.text3, transition: 'all .2s' }}>
            {l}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {mode === 'signup' && (
          <Field label="FULL NAME" icon={User} value={name} onChange={e => setName(e.target.value)} placeholder="Dr. Anita Sharma" autoComplete="name" />
        )}
        <Field label="EMAIL ADDRESS" icon={Mail} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="teacher@school.edu" autoComplete="email" />
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.text3, letterSpacing: '0.4px' }}>PASSWORD</label>
            {mode === 'signin' && (
              <button type="button" onClick={onForgotPassword}
                style={{ background: 'none', border: 'none', color: C.accent, fontSize: 12, cursor: 'pointer', fontWeight: 500, padding: 0, fontFamily: "'DM Sans',sans-serif" }}>
                Forgot password?
              </button>
            )}
          </div>
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <Lock size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: C.text4, pointerEvents: 'none' }}/>
            <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              style={{ width: '100%', boxSizing: 'border-box', background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '11px 44px 11px 38px', color: C.text, fontSize: 14, outline: 'none', fontFamily: "'DM Sans',sans-serif", transition: 'border-color .15s' }}
              onFocus={e => e.target.style.borderColor = C.accent}
              onBlur={e  => e.target.style.borderColor = C.border}
            />
            {eyeBtn}
          </div>
        </div>

        {mode === 'signup' && (
          <Field label="CONFIRM PASSWORD" icon={Lock} type={showPw ? 'text' : 'password'} value={confirm}
            onChange={e => setConfirm(e.target.value)} placeholder="••••••••" autoComplete="new-password" rightEl={eyeBtn} />
        )}

        <Btn type="submit" disabled={loading} style={{ width: '100%', marginTop: 4 }}>
          {loading ? (mode === 'signup' ? 'Creating account…' : 'Signing in…')
                   : (mode === 'signup' ? 'Create Teacher Account' : 'Sign In')}
        </Btn>
      </form>

      <p style={{ fontSize: 12, color: C.text4, textAlign: 'center', marginTop: 14 }}>
        {mode === 'signin' ? <>No account? <button onClick={() => setMode('signup')} style={{ background: 'none', border: 'none', color: C.accent, cursor: 'pointer', fontWeight: 600, fontSize: 12, fontFamily: "'DM Sans',sans-serif" }}>Create one</button></> 
                           : <>Already have an account? <button onClick={() => setMode('signin')} style={{ background: 'none', border: 'none', color: C.accent, cursor: 'pointer', fontWeight: 600, fontSize: 12, fontFamily: "'DM Sans',sans-serif" }}>Sign in</button></>}
      </p>
    </div>
  );
}

export default function LoginPage({ onLoginSuccess, showNotif, defaultMode = 'signin', onBack }) {
  const [role,         setRole]         = useState('teacher');
  const [showEmail,    setShowEmail]    = useState(false);   // teacher: toggle email form below Google
  const [showForgot,   setShowForgot]   = useState(false);
  const [googleLoading,setGoogleLoading]= useState(false);

  // Student state
  const [username, setUsername] = useState('');
  const [stuPass,  setStuPass]  = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [stuLoading,setStuLoading] = useState(false);

  // google login
  const handleGoogleSuccess = async credentialResponse => {
    setGoogleLoading(true);
    try {
      const res = await authAPI.googleAuth({ credential: credentialResponse.credential });
      onLoginSuccess(res.data.token, res.data.user);
    } catch (err) {
      showNotif(err.response?.data?.message || 'Google sign-in failed', 'error');
    } finally {
      setGoogleLoading(false);
    }
  };

  // student login
  const handleStudentLogin = async e => {
    e.preventDefault();
    if (!username || !stuPass) return showNotif('Enter username and password', 'error');
    setStuLoading(true);
    try {
      const res = await authAPI.login({ username: username.trim().toLowerCase(), password: stuPass });
      if (res.data.user.role !== 'student') return showNotif('This is not a student account', 'error');
      onLoginSuccess(res.data.token, res.data.user);
    } catch (err) {
      showNotif(err.response?.data?.message || 'Invalid username or password', 'error');
    } finally {
      setStuLoading(false);
    }
  };

  /* Switch role — reset sub-states */
  const switchRole = r => { setRole(r); setShowEmail(false); setShowForgot(false); };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Back button */}
        {onBack && (
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: C.text3, fontSize: 13, fontWeight: 500, marginBottom: 22, padding: 0, fontFamily: "'DM Sans',sans-serif" }}>
            <ArrowLeft size={14}/> Back to home
          </button>
        )}

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: C.sidebar, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 4px 16px rgba(0,0,0,.15)' }}>
            <BookOpen size={24} color="#F0EDE9"/>
          </div>
          <h1 style={{ fontFamily: "'Instrument Serif',serif", fontWeight: 400, fontSize: 28, color: C.text, marginBottom: 4, letterSpacing: '-0.5px' }}>StudentHub</h1>
          <p style={{ color: C.text4, fontSize: 13 }}>Academic Performance & Attendance Platform</p>
        </div>

        {/* Card */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 22, padding: 28, boxShadow: '0 2px 20px rgba(0,0,0,.07)' }}>

          {/* forgot password */}
          {showForgot ? (
            <ForgotPasswordScreen onBack={() => setShowForgot(false)} showNotif={showNotif}/>
          ) : (
            <>
              {/* Role selector */}
              <div style={{ display: 'flex', background: C.card2, borderRadius: 12, padding: 4, marginBottom: 26 }}>
                {[['teacher', '', 'Teacher'], ['student', '', 'Student']].map(([r, icon, label]) => (
                  <button key={r} onClick={() => switchRole(r)}
                    style={{ flex: 1, padding: '10px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", background: role === r ? C.text : 'transparent', color: role === r ? '#fff' : C.text3, transition: 'all .2s' }}>
                    <div style={{ fontSize: 18, marginBottom: 2 }}>{icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{label}</div>
                  </button>
                ))}
              </div>

              {/* ════ TEACHER ════ */}
              {role === 'teacher' && (
                <div>
                  {/* Heading */}
                  <p style={{ fontSize: 13, color: C.text3, textAlign: 'center', marginBottom: 18, lineHeight: 1.6 }}>
                    Sign in to manage your students, assignments & results.
                  </p>

                  {/* Google button — always visible as primary */}
                  <div style={{ marginBottom: 6 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: C.text4, letterSpacing: '0.7px', textTransform: 'uppercase', marginBottom: 10, textAlign: 'center' }}>
                      Recommended
                    </p>
                    {googleLoading ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '12px', border: `1px solid ${C.border}`, borderRadius: 10, color: C.text3, fontSize: 14 }}>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${C.border}`, borderTop: `2px solid ${C.text}`, animation: 'spin .8s linear infinite' }}/> Signing in…
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <GoogleLogin
                          onSuccess={handleGoogleSuccess}
                          onError={() => showNotif('Google sign-in was cancelled or failed', 'error')}
                          theme="outline" size="large" shape="rectangular"
                          text="signin_with_google" logo_alignment="left" width="340"
                        />
                      </div>
                    )}
                    <p style={{ fontSize: 11, color: C.text4, textAlign: 'center', marginTop: 8 }}>
                      No password needed — your Google account is your key.
                    </p>
                  </div>

                  {/* OR divider */}
                  <Divider/>

                  {/* Email toggle / panel */}
                  {!showEmail ? (
                    <button onClick={() => setShowEmail(true)}
                      style={{ width: '100%', padding: '11px', background: C.card2, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text3, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <Mail size={15}/> Continue with Email & Password
                    </button>
                  ) : (
                    <div>
                      {/* Collapse email */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Email & Password</span>
                        <button onClick={() => setShowEmail(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text4, fontSize: 12, fontFamily: "'DM Sans',sans-serif" }}>✕ Hide</button>
                      </div>
                      <TeacherEmailPanel
                        onLoginSuccess={onLoginSuccess}
                        showNotif={showNotif}
                        onForgotPassword={() => setShowForgot(true)}
                      />
                    </div>
                  )}

                  {/* How it works */}
                  <div style={{ marginTop: 22, padding: '12px 14px', background: C.card2, borderRadius: 10, border: `1px solid ${C.border}` }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: C.text4, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>How it works</p>
                    {['Sign in with your school Google account', ' Account created automatically on first login', 'Manage students, attendance & results'].map((s, i, a) => (
                      <p key={i} style={{ fontSize: 12, color: C.text3, margin: i < a.length - 1 ? '0 0 5px' : 0 }}>{s}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* ════ STUDENT ════ */}
              {role === 'student' && (
                <form onSubmit={handleStudentLogin}>
                  <div style={{ marginBottom: 20, padding: '12px 14px', background: `${C.accent}12`, border: `1px solid ${C.border}`, borderRadius: 10 }}>
                    <p style={{ margin: 0, fontSize: 13, color: C.text3, lineHeight: 1.6 }}>
                      Use the <strong style={{ color: C.text2 }}>username and password</strong> given to you by your teacher.
                    </p>
                  </div>

                  <Field label="USERNAME" icon={AtSign} value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="e.g. arjun.sharma" autoComplete="username" />

                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text3, marginBottom: 6, letterSpacing: '0.4px' }}>PASSWORD</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: C.text4, pointerEvents: 'none' }}/>
                      <input type={showPw ? 'text' : 'password'} value={stuPass} onChange={e => setStuPass(e.target.value)}
                        placeholder="••••••••" autoComplete="current-password"
                        style={{ width: '100%', boxSizing: 'border-box', background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '11px 44px 11px 38px', color: C.text, fontSize: 14, outline: 'none', fontFamily: "'DM Sans',sans-serif", transition: 'border-color .15s' }}
                        onFocus={e => e.target.style.borderColor = C.accent}
                        onBlur={e  => e.target.style.borderColor = C.border}
                      />
                      <EyeBtn show={showPw} toggle={() => setShowPw(p => !p)}/>
                    </div>
                  </div>

                  <Btn type="submit" disabled={stuLoading} style={{ width: '100%' }}>
                    {stuLoading ? 'Signing in…' : 'Sign In as Student'}
                  </Btn>

                
                
                </form>
              )}
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, color: C.text4, fontSize: 12 }}>
          StudentHub © {new Date().getFullYear()} — Secure Academic Management
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
