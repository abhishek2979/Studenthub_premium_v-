import { useState } from 'react';

const C = {
  bg:     '#EDECEA',
  card:   '#FFFFFF',
  dark:   '#1C1C1A',
  text:   '#1C1C1A',
  text2:  '#6B6860',
  text3:  '#9C9890',
  border: '#DDDBD8',
  green:  '#7DBF8E',
};

/* ── Logo: dark rounded square + book icon (SVG) ── */
function Logo({ size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.22,
      background: C.dark, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none" stroke="#F2EEE9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    </div>
  );
}

const features = [
  { emoji: '', title: 'Students',    desc: 'Add students with their info. Each one gets a login to check their own attendance and grades.' },
  { emoji: '', title: 'Attendance',  desc: 'Mark present or absent quickly. See monthly stats and percentage automatically.' },
  { emoji: '', title: 'Results',     desc: 'Enter marks for each student. They see their results the moment you publish.' },
  { emoji: '', title: 'Analytics',   desc: 'Simple charts showing how each student is doing over time.' },
  { emoji: '', title: 'Quizzes',     desc: 'Make a quick quiz. Students take it online and scores are saved automatically.' },
  { emoji: '', title: 'Notes',       desc: 'Post study notes or assignments for your class. Students see them on their dashboard.' },
];

const steps = [
  { n: '1', title: 'Create your account', desc: 'Sign up with email. Your account is your own private space.' },
  { n: '2', title: 'Add your students',   desc: 'Enter student details. Each one gets a login automatically.' },
  { n: '3', title: 'Start using it',      desc: 'Mark attendance, share notes, upload results, create quizzes.' },
];

const checks = ['Free to start', 'No credit card', 'Works on any device', 'Students get their own login', 'Your data stays private'];

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; }
  .lp { background: ${C.bg}; color: ${C.text}; min-height: 100vh; font-family: Arial, sans-serif; }
  a { text-decoration: none; color: inherit; }

  /* Nav */
  .nav { background: ${C.bg}; border-bottom: 1px solid ${C.border}; padding: 0 28px; height: 56px;
         display: flex; align-items: center; justify-content: space-between;
         position: sticky; top: 0; z-index: 100; }
  .nav-brand { display: flex; align-items: center; gap: 10px; }
  .nav-brand-name { font-weight: bold; font-size: 17px; color: ${C.text}; }
  .nav-links { display: flex; gap: 20px; align-items: center; }
  .nav-links a { color: ${C.text2}; font-size: 13px; font-weight: 500; }
  .nav-actions { display: flex; gap: 8px; align-items: center; }
  .hamburger { display: none; background: none; border: none; cursor: pointer; padding: 4px; }
  .mobile-menu { display: none; flex-direction: column; background: ${C.card}; border-bottom: 1px solid ${C.border}; }
  .mobile-menu.open { display: flex; }
  .mobile-menu a, .mobile-menu button {
    display: block; padding: 14px 24px; font-size: 15px; font-weight: 500;
    color: ${C.text2}; border: none; background: none; cursor: pointer;
    text-align: left; font-family: Arial, sans-serif; border-bottom: 1px solid ${C.border}; width: 100%;
  }

  /* Buttons */
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px;
         border-radius: 8px; cursor: pointer; font-family: Arial, sans-serif; font-weight: 500; border: none; }
  .btn-dark { background: ${C.dark}; color: #fff; }
  .btn-ghost { background: ${C.card}; color: ${C.text2}; border: 1px solid ${C.border} !important; }
  .btn-sm { padding: 7px 16px; font-size: 13px; }
  .btn-lg { padding: 12px 26px; font-size: 15px; font-weight: bold; border-radius: 9px; }

  /* Sections */
  .inner { max-width: 860px; margin: 0 auto; padding: 0 24px; }
  .section { padding: 64px 0; }
  .section-dark { background: ${C.dark}; padding: 64px 0; }
  hr.div { border: none; border-top: 1px solid ${C.border}; }

  /* Hero */
  .hero { text-align: center; padding: 72px 24px 56px; max-width: 860px; margin: 0 auto; }
  .hero h1 { font-size: 36px; font-weight: bold; line-height: 1.2; margin-bottom: 16px; }
  .hero p.sub { font-size: 16px; color: ${C.text2}; max-width: 480px; margin: 0 auto 32px; line-height: 1.7; }
  .hero-actions { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
  .hero-note { font-size: 12px; color: ${C.text3}; }

  /* Preview */
  .preview { background: ${C.dark}; border-radius: 16px; padding: 24px; max-width: 560px; margin: 48px auto 0; text-align: left; }
  .preview-dots { display: flex; gap: 6px; align-items: center; margin-bottom: 16px; }
  .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
  .preview-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
  .stat { background: rgba(255,255,255,0.07); border-radius: 10px; padding: 12px 10px; }
  .stat-n { color: #fff; font-size: 22px; font-weight: bold; }
  .stat-l { color: #888; font-size: 11px; margin-top: 3px; }
  .preview-list { border-top: 1px solid rgba(255,255,255,0.08); padding-top: 14px; }
  .preview-item { color: #aaa; font-size: 13px; margin-bottom: 7px; }

  /* Feature cards */
  .feat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .feat-card { background: ${C.card}; border: 1px solid ${C.border}; border-radius: 14px; padding: 22px; }
  .feat-emoji { font-size: 26px; margin-bottom: 12px; }
  .feat-title { font-size: 15px; font-weight: 600; margin-bottom: 6px; }
  .feat-desc { font-size: 13px; color: ${C.text2}; line-height: 1.65; }

  /* Steps */
  .steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
  .step-num { font-size: 40px; color: rgba(255,255,255,0.15); font-weight: bold; margin-bottom: 12px; }
  .step-title { color: #fff; font-size: 16px; font-weight: 600; margin-bottom: 8px; }
  .step-desc { color: #888; font-size: 14px; line-height: 1.65; }

  /* CTA checks */
  .checks { display: flex; justify-content: center; gap: 10px 20px; flex-wrap: wrap; margin-bottom: 20px; }
  .check { font-size: 13px; color: ${C.text2}; }
  .cta-actions { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; }

  /* Footer */
  .footer { background: ${C.dark}; padding: 28px; text-align: center; }
  .footer-brand { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 8px; }

  /* ── Responsive ── */
  @media (max-width: 700px) {
    .nav-links { display: none; }
    .nav-actions { display: none; }
    .hamburger { display: block; }
    .hero h1 { font-size: 26px; }
    .hero p.sub { font-size: 14px; }
    .feat-grid { grid-template-columns: 1fr; }
    .steps-grid { grid-template-columns: 1fr; gap: 24px; }
    .preview-stats { grid-template-columns: repeat(2, 1fr); }
    .hero { padding: 48px 20px 40px; }
    .section, .section-dark { padding: 48px 0; }
  }
  @media (max-width: 480px) {
    .btn-lg { width: 100%; }
    .hero-actions { flex-direction: column; align-items: stretch; padding: 0 20px; }
  }
`;

export default function LandingPage({ onGetStarted, onSignIn }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="lp">
      <style>{css}</style>

      {/* ── Navbar ── */}
      <nav className="nav">
        <div className="nav-brand">
          <Logo size={34} />
          <span className="nav-brand-name">StudentHub</span>
        </div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
        </div>
        <div className="nav-actions">
          <button className="btn btn-ghost btn-sm" onClick={onSignIn}>Sign In</button>
          <button className="btn btn-dark btn-sm" onClick={onGetStarted}>Get Started</button>
        </div>
        {/* Hamburger for mobile */}
        <button className="hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
          {menuOpen
            ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="2"><line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/></svg>
          }
        </button>
      </nav>

      {/* Mobile menu */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
        <a href="#how" onClick={() => setMenuOpen(false)}>How it works</a>
        <button onClick={() => { setMenuOpen(false); onSignIn?.(); }}>Sign In</button>
        <button onClick={() => { setMenuOpen(false); onGetStarted?.(); }} style={{ color: C.dark, fontWeight: 700 }}>Get Started — Free</button>
      </div>

      {/* ── Hero ── */}
      <section className="hero">
        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: C.text3, marginBottom: 16 }}>
          For teachers &amp; schools
        </p>
        <h1>Manage your class without the mess</h1>
        <p className="sub">
          StudentHub helps teachers track attendance, grades, and assignments — while giving every student their own login.
        </p>
        <div className="hero-actions">
          <button className="btn btn-dark btn-lg" onClick={onGetStarted}>Start for free →</button>
          <button className="btn btn-ghost btn-lg" onClick={onSignIn}>Sign In</button>
        </div>
        <p className="hero-note">✓ Free to start &nbsp;·&nbsp; No credit card &nbsp;·&nbsp; Works on any device</p>

        {/* Dashboard preview */}
        <div className="preview">
          <div className="preview-dots">
            <span className="dot" style={{ background: '#ff5f57' }}/>
            <span className="dot" style={{ background: '#ffbd2e' }}/>
            <span className="dot" style={{ background: '#28c840' }}/>
            <span style={{ color: '#888', fontSize: 11, marginLeft: 8 }}>Teacher Dashboard</span>
          </div>
          <div className="preview-stats">
            {[['34','Students'],['91%','Attendance'],['B+','Avg Grade'],['6','Quizzes']].map(([n,l]) => (
              <div key={l} className="stat">
                <div className="stat-n">{n}</div>
                <div className="stat-l">{l}</div>
              </div>
            ))}
          </div>
          <div className="preview-list">
            {['Students can check their own results','Mark attendance in under a minute','Quizzes are auto-graded','Share notes by class or subject'].map(t => (
              <div key={t} className="preview-item">
                <span style={{ color: C.green }}>• </span>{t}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="inner"><hr className="div"/></div>

      {/* ── Features ── */}
      <section className="section" id="features">
        <div className="inner">
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: C.text3, marginBottom: 10 }}>What's included</p>
          <h2 style={{ fontSize: 26, fontWeight: 'bold', marginBottom: 10 }}>Everything you need, nothing you don't</h2>
          <p style={{ fontSize: 14, color: C.text2, marginBottom: 36, lineHeight: 1.7 }}>Six tools that cover the full cycle of managing a class.</p>
          <div className="feat-grid">
            {features.map(f => (
              <div key={f.title} className="feat-card">
                <div className="feat-emoji">{f.emoji}</div>
                <div className="feat-title">{f.title}</div>
                <div className="feat-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="inner"><hr className="div"/></div>

      {/* ── How it works ── */}
      <section className="section-dark" id="how">
        <div className="inner">
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: '#555', marginBottom: 10 }}>Setup takes minutes</p>
          <h2 style={{ fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 10 }}>Three steps and you're done</h2>
          <p style={{ fontSize: 14, color: '#888', marginBottom: 40, lineHeight: 1.7 }}>No installation. Sign up and start the same day.</p>
          <div className="steps-grid">
            {steps.map(s => (
              <div key={s.n}>
                <div className="step-num">{s.n}.</div>
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="section" style={{ textAlign: 'center' }}>
        <div className="inner">
          <h2 style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 12 }}>Give it a try — it's free</h2>
          <p style={{ fontSize: 15, color: C.text2, maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.7 }}>
            No commitment. Create your account in two minutes and start managing your class today.
          </p>
          <div className="checks">
            {checks.map(c => <span key={c} className="check">✓ {c}</span>)}
          </div>
          <div className="cta-actions">
            <button className="btn btn-dark btn-lg" onClick={onGetStarted}>Create Free Account →</button>
            <button className="btn btn-ghost btn-lg" onClick={onSignIn}>Sign In</button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="footer-brand">
          <Logo size={28} />
          <span style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>StudentHub</span>
        </div>
        <p style={{ color: '#555', fontSize: 12 }}>A simple tool for teachers who just want things to work. © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
