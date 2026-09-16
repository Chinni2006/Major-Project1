import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Dna, ShieldCheck, Brain, Building2, ArrowRight, Blocks, CheckCircle, XCircle, Zap, Trophy, Users } from 'lucide-react';

/* ── Particle canvas ─────────────────────────────────────────────────────── */
function ParticleCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    let raf;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      o: Math.random() * 0.5 + 0.1,
      color: Math.random() > 0.5 ? '99,102,241' : '34,211,238',
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.o})`;
        ctx.fill();
      });
      // draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(99,102,241,${0.08 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}

/* ── DNA Helix SVG animation ─────────────────────────────────────────────── */
function DNAHelix() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '2rem 0' }}>
      <svg width="80" height="120" viewBox="0 0 80 120">
        <style>{`
          .dna-l { animation: dnaL 2s ease-in-out infinite; }
          .dna-r { animation: dnaR 2s ease-in-out infinite; }
          .dna-bar { animation: dnaFade 2s ease-in-out infinite; }
          @keyframes dnaL {
            0%,100% { transform: translateX(0); }
            50%      { transform: translateX(20px); }
          }
          @keyframes dnaR {
            0%,100% { transform: translateX(0); }
            50%      { transform: translateX(-20px); }
          }
          @keyframes dnaFade {
            0%,100% { opacity:0.3; } 50% { opacity:1; }
          }
        `}</style>
        {[0,1,2,3,4,5].map((i) => {
          const y = 10 + i * 20;
          const delay = i * 0.15;
          return (
            <g key={i}>
              <circle cx="15" cy={y} r="5" fill="#6366f1" opacity="0.8"
                style={{ animation: `dnaL 2s ${delay}s ease-in-out infinite` }} />
              <circle cx="65" cy={y} r="5" fill="#22d3ee" opacity="0.8"
                style={{ animation: `dnaR 2s ${delay}s ease-in-out infinite` }} />
              <line x1="20" y1={y} x2="60" y2={y} stroke="rgba(99,102,241,0.3)"
                strokeWidth="1.5" style={{ animation: `dnaFade 2s ${delay}s ease-in-out infinite` }} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

const FEATURES = [
  { icon: <Brain size={26} />, title: 'AI Code Analysis', desc: 'Uploads real projects. AI scores Python, algorithms, ML usage, error handling, and code quality with deep static analysis.', color: '#6366f1', fc: '#6366f1' },
  { icon: <Dna size={26} />, title: 'Skill DNA Profile', desc: 'A unique cryptographic fingerprint of your real skills — not what you claim. Includes growth rate predictions and badges.', color: '#22d3ee', fc: '#22d3ee' },
  { icon: <Blocks size={26} />, title: 'Blockchain Storage', desc: 'Skill DNA hash is stored on Ethereum — immutable, timestamped, permanent. No one can alter it after the fact.', color: '#f59e0b', fc: '#f59e0b' },
  { icon: <ShieldCheck size={26} />, title: 'Instant Verification', desc: 'Companies enter a student ID and get cryptographic proof in seconds. No calls, no paperwork, no trust required.', color: '#10b981', fc: '#10b981' },
  { icon: <Trophy size={26} />, title: 'Skill Badges', desc: 'Earn achievement badges like "Algorithm Pro", "ML Practitioner", "Clean Coder" based on your actual AI-analyzed code.', color: '#a855f7', fc: '#a855f7' },
  { icon: <Users size={26} />, title: 'Company Dashboard', desc: 'HR teams search, filter, and compare verified candidates side-by-side — no fake resumes, just real AI-scored data.', color: '#ec4899', fc: '#ec4899' },
];

const STEPS = [
  { num: '01', title: 'Register in seconds', desc: 'Create your student profile. Get a unique Student ID instantly.' },
  { num: '02', title: 'Upload your code', desc: 'Drop Python projects, solved problems, ML notebooks — any real work.' },
  { num: '03', title: 'AI generates Skill DNA', desc: 'Our engine scores 12+ metrics across 4 dimensions and predicts your growth rate.' },
  { num: '04', title: 'Blockchain seals it', desc: 'A SHA-256 hash of your Skill DNA is mined into a block — permanent and tamper-proof.' },
  { num: '05', title: 'Share & get verified', desc: 'Share your ID or public profile link. Any company can verify your skills in one click.' },
];

const STATS = [
  { value: '12+', label: 'Metrics Analyzed', color: '#6366f1' },
  { value: '4', label: 'Skill Dimensions', color: '#22d3ee' },
  { value: '100%', label: 'Tamper-Proof', color: '#10b981' },
  { value: '∞', label: 'Students Supported', color: '#f59e0b' },
];

export default function Home() {
  return (
    <div className="page home-page">

      {/* ── Hero ── */}
      <section className="hero" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="hero-orbs">
          <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
        </div>
        <ParticleCanvas />

        <div className="hero-eyebrow">
          <span className="hero-eyebrow-dot" />
          AI · Blockchain · Skills · Trust
        </div>

        <h1 className="hero-title">
          Your Code Is Your<br />
          <span className="gradient-text">Proof of Skill</span>
        </h1>

        <DNAHelix />

        <p className="hero-sub">
          SkillGenome Ledger analyzes your real code with AI, generates a tamper-proof
          Skill DNA profile, stores it on the Ethereum blockchain, and lets any company
          verify your skills instantly — no fake resumes, ever.
        </p>

        <div className="hero-actions">
          <Link to="/register" className="btn btn-glow btn-xl">
            Generate My Skill DNA <Dna size={18} />
          </Link>
          <Link to="/verify" className="btn btn-outline btn-xl">
            <Building2 size={18} /> Verify a Candidate
          </Link>
        </div>

        <div className="comparison">
          <div className="comparison-item comparison-item--bad">
            <XCircle size={15} /> Resume — Anyone can write fake skills
          </div>
          <div className="comparison-item comparison-item--good">
            <CheckCircle size={15} /> SkillGenome — AI-analyzed + blockchain proof
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <div className="stats-bar">
        {STATS.map(s => (
          <div className="stat-item" key={s.label}>
            <div className="stat-item-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-item-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Features ── */}
      <section className="section">
        <div style={{ textAlign: 'center' }}>
          <span className="section-eyebrow">What Makes Us Different</span>
        </div>
        <h2 className="section-title">Six layers of trust</h2>
        <p className="section-sub">Every feature exists to make your skills impossible to fake and easy to verify.</p>
        <div className="feature-grid">
          {FEATURES.map(f => (
            <div key={f.title} className="feature-card" style={{ '--fc-color': f.fc }}>
              <div className="feature-icon" style={{ color: f.color, background: `${f.color}18` }}>
                {f.icon}
              </div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="section--alt">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span className="section-eyebrow">The Process</span>
          <h2 className="section-title" style={{ marginBottom: 0 }}>From code to verified in 5 steps</h2>
        </div>
        <div className="steps-timeline">
          {STEPS.map((s, i) => (
            <div key={i} className="step-tl-item">
              <div className="step-tl-num">{s.num}</div>
              <div className="step-tl-content">
                <h4 className="step-tl-title">{s.title}</h4>
                <p className="step-tl-desc">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Sample profile ── */}
      <section className="section">
        <div style={{ textAlign: 'center' }}>
          <span className="section-eyebrow">What You Get</span>
        </div>
        <h2 className="section-title">Your Skill DNA Profile</h2>
        <p className="section-sub">Every student gets a unique, AI-generated, blockchain-anchored skill profile.</p>
        <div className="example-card">
          <div className="example-header">
            <div className="example-avatar">S</div>
            <div>
              <h3 style={{ fontWeight: 800, letterSpacing: '-0.01em' }}>Any Student</h3>
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>B.Tech CS · 3 Projects · 20 Problems · 1 ML Project</p>
            </div>
            <div className="example-badge">✅ Blockchain Verified</div>
          </div>
          <div className="example-scores">
            {[
              { label: 'Python',           score: 80, color: '#6366f1' },
              { label: 'Problem Solving',  score: 75, color: '#22d3ee' },
              { label: 'Machine Learning', score: 60, color: '#f59e0b' },
              { label: 'Code Quality',     score: 85, color: '#10b981' },
            ].map(s => (
              <div key={s.label} className="example-score-row">
                <span className="example-score-label">{s.label}</span>
                <div className="example-bar-track">
                  <div className="example-bar-fill" style={{ width: `${s.score}%`, background: s.color }} />
                </div>
                <span className="example-score-val" style={{ color: s.color }}>{s.score}/100</span>
              </div>
            ))}
          </div>
          {/* Badges */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.1rem' }}>
            {['🏆 Top Coder','🤖 ML Practitioner','✨ Clean Code','🧩 Algorithm Pro'].map(b => (
              <span key={b} className="badge badge--amber" style={{ fontSize: '0.72rem' }}>{b}</span>
            ))}
          </div>
          <div className="example-footer">
            <span className="growth-pill"><Zap size={11} style={{ verticalAlign: 'middle' }} /> Growth: 15% / 6 months</span>
            <code className="hash-preview">0xA9F7...890P</code>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <span className="section-eyebrow">Ready?</span>
        <h2>Prove your skills. Own your future.</h2>
        <p>Join the students who are ahead of the game with blockchain-verified skill profiles.</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register" className="btn btn-glow btn-xl">
            Get Started Free <ArrowRight size={18} />
          </Link>
          <Link to="/leaderboard" className="btn btn-outline btn-xl">
            <Trophy size={18} /> View Leaderboard
          </Link>
        </div>
      </section>

    </div>
  );
}
