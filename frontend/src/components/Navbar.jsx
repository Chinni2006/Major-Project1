import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Dna, Menu, X, ShieldCheck, LayoutDashboard,
  Building2, Blocks, Trophy, LogIn, LogOut,
  User, ChevronDown, BookOpen, GraduationCap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTeacherAuth } from '../context/TeacherAuthContext';
import { toast } from 'react-hot-toast';

const PUBLIC_LINKS = [
  { to:'/',            label:'Home',        icon:<LayoutDashboard size={15}/> },
  { to:'/verify',      label:'Verify',      icon:<ShieldCheck size={15}/> },
  { to:'/companies',   label:'Companies',   icon:<Building2 size={15}/> },
  { to:'/leaderboard', label:'Leaderboard', icon:<Trophy size={15}/> },
  { to:'/explorer',    label:'Blockchain',  icon:<Blocks size={15}/> },
];

export default function Navbar() {
  const { pathname }          = useLocation();
  const navigate              = useNavigate();
  const { student, logout }   = useAuth();
  const { teacher, logoutTeacher } = useTeacherAuth();
  const [menuOpen, setMenu]   = useState(false);
  const [dropOpen, setDrop]   = useState(false);

  const handleLogout = () => {
    logout(); logoutTeacher();
    setDrop(false); setMenu(false);
    toast.success('Logged out');
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">

        {/* Brand */}
        <Link to="/" className="brand" onClick={() => setMenu(false)}>
          <div className="brand-icon"><Dna size={20} /></div>
          <span className="brand-name">
            SkillGenome<span className="brand-accent"> Ledger</span>
          </span>
        </Link>

        {/* Desktop links */}
        <ul className="nav-links">
          {PUBLIC_LINKS.map((l) => (
            <li key={l.to}>
              <Link
                to={l.to}
                className={`nav-link ${pathname === l.to ? 'nav-link--active' : ''}`}
              >
                {l.icon}{l.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Auth area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
          {student ? (
            /* ── Logged in ── */
            <div style={{ position: 'relative' }}>
              <button
                className="btn btn-outline btn-sm"
                style={{ gap: '0.5rem' }}
                onClick={() => setDrop((v) => !v)}
              >
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#6366f1,#22d3ee)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.72rem', fontWeight: 800, color: 'white', flexShrink: 0,
                }}>
                  {student.name.charAt(0).toUpperCase()}
                </div>
                <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {student.name.split(' ')[0]}
                </span>
                <ChevronDown size={13} />
              </button>

              {dropOpen && (
                <>
                  {/* click-away backdrop */}
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 98 }}
                    onClick={() => setDrop(false)}
                  />
                  <div style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                    background: '#0a1628', border: '1px solid rgba(99,102,241,0.25)',
                    borderRadius: 12, padding: '0.5rem', minWidth: 200,
                    zIndex: 99, boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                  }}>
                    {/* User info */}
                    <div style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '0.4rem' }}>
                      <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>{student.name}</p>
                      <p style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '0.1rem' }}>{student.email}</p>
                      <code style={{
                        display: 'inline-block', marginTop: '0.35rem',
                        background: 'rgba(99,102,241,0.1)', color: 'var(--indigo2)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        padding: '0.1rem 0.5rem', borderRadius: 5,
                        fontSize: '0.72rem', fontFamily: 'monospace',
                      }}>
                        {student.studentId}
                      </code>
                    </div>

                    <Link to={`/dashboard/${student.studentId}`} className="nav-link"
                      style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: 8 }}
                      onClick={() => setDrop(false)}>
                      <User size={14} /> My Dashboard
                    </Link>
                    <Link to={`/skill-dna/${student.studentId}`} className="nav-link"
                      style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: 8 }}
                      onClick={() => setDrop(false)}>
                      <Dna size={14} /> My Skill DNA
                    </Link>
                    <Link to="/quizzes" className="nav-link"
                      style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: 8 }}
                      onClick={() => setDrop(false)}>
                      <BookOpen size={14} /> My Quizzes
                    </Link>
                    <Link to={`/profile/${student.studentId}`} className="nav-link"
                      style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: 8 }}
                      onClick={() => setDrop(false)}>
                      <ShieldCheck size={14} /> Public Profile
                    </Link>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '0.4rem', paddingTop: '0.4rem' }}>
                      <button
                        className="btn btn-ghost btn-sm btn-full"
                        style={{ justifyContent: 'flex-start', gap: '0.5rem', color: 'var(--red)', padding: '0.5rem 0.75rem' }}
                        onClick={handleLogout}
                      >
                        <LogOut size={14} /> Log Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* ── Logged out ── */
            <>
              <Link to="/login"    className="btn btn-ghost btn-sm nav-cta">
                <LogIn size={14} /> Log In
              </Link>
              <Link to="/register" className="btn btn-glow btn-sm nav-cta">
                Get Started
              </Link>
              <Link to="/teacher/login" className="btn btn-outline btn-sm nav-cta" style={{borderColor:'rgba(34,211,238,0.3)',color:'var(--cyan)'}}>
                <GraduationCap size={14}/> Teacher
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="mobile-toggle"
          onClick={() => setMenu((v) => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="mobile-menu">
          {PUBLIC_LINKS.map((l) => (
            <Link
              key={l.to} to={l.to}
              className={`mobile-link ${pathname === l.to ? 'mobile-link--active' : ''}`}
              onClick={() => setMenu(false)}
            >
              {l.icon}{l.label}
            </Link>
          ))}

          {student ? (
            <>
              <Link to={`/dashboard/${student.studentId}`} className="mobile-link" onClick={() => setMenu(false)}>
                <User size={15} /> My Dashboard
              </Link>
              <button
                className="mobile-link"
                style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'inherit', fontSize: '0.95rem' }}
                onClick={handleLogout}
              >
                <LogOut size={15} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login"    className="mobile-link" onClick={() => setMenu(false)}><LogIn  size={15} /> Log In</Link>
              <Link to="/register" className="mobile-link" onClick={() => setMenu(false)}><User   size={15} /> Create Account</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
