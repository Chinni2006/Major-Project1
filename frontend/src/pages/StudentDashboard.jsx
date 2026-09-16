import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Upload, Dna, Blocks, ShieldCheck, FileCode,
  Clock, CheckCircle, Circle, ArrowRight, RefreshCw,
  Share2, Copy, Check, Trophy, TrendingUp, Star
} from 'lucide-react';
import { getStudent } from '../api/api';
import { useApp } from '../context/AppContext';
import Spinner from '../components/Spinner';
import HashBadge from '../components/HashBadge';
import StepIndicator from '../components/StepIndicator';

const STEPS = ['Register', 'Upload Files', 'AI Analysis', 'Blockchain', 'Verified'];

function getStepIndex(student) {
  if (!student) return 0;
  if (student.blockchainHash) return 4;
  if (student.analyzed)       return 3;
  if (student.files?.length)  return 2;
  return 1;
}

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const target = typeof value === 'number' ? value : 0;
    let start = 0;
    const step = Math.ceil(target / 30);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setDisplay(target); clearInterval(timer); }
      else setDisplay(start);
    }, 30);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{display}</span>;
}

export default function StudentDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setCurrentStudent } = useApp();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const profileUrl = `${window.location.origin}/profile/${id}`;

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await getStudent(id);
      if (data.success) { setStudent(data.student); setCurrentStudent(data.student); }
      else navigate('/register');
    } catch {
      toast.error('Student not found'); navigate('/register');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const copyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true); toast.success('Profile link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="dna-spinner">
      <div className="dna-helix">
        {Array.from({length:8}).map((_,i) => <span key={i}/>)}
      </div>
      <p className="text-muted">Loading dashboard...</p>
    </div>
  );
  if (!student) return null;

  const stepIdx = getStepIndex(student);
  const dna = student.skillDNA;
  const badges = student.badges || [];

  const actions = [
    { to: `/upload/${id}`,    icon: <Upload size={20}/>,    label: 'Upload Projects',   desc: `${student.files?.length||0} files uploaded`,              done: (student.files?.length||0)>0, color:'#6366f1' },
    { to: `/skill-dna/${id}`, icon: <Dna size={20}/>,       label: 'Skill DNA & Badges',desc: student.analyzed ? `${badges.length} badges earned` : 'Not yet analyzed', done: student.analyzed,             color:'#22d3ee' },
  ];

  return (
    <div className="page">
      {/* Header */}
      <div className="dashboard-header">
        <div className="student-avatar student-avatar--lg">{student.name.charAt(0).toUpperCase()}</div>
        <div style={{flex:1}}>
          <h1 className="dashboard-name">{student.name}</h1>
          <p className="text-muted" style={{fontSize:'0.9rem'}}>{student.course} · {student.college}</p>
          <code className="student-id-badge">{student.studentId}</code>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load} title="Refresh">
          <RefreshCw size={15}/>
        </button>
      </div>

      {/* Progress */}
      <div className="card card--glow mb-6">
        <h3 className="card-title">Your Journey</h3>
        <StepIndicator steps={STEPS} current={stepIdx}/>
        {stepIdx === 4 && (
          <div style={{marginTop:'0.85rem',display:'flex',alignItems:'center',gap:'0.5rem',color:'var(--green2)',fontSize:'0.875rem',fontWeight:600}}>
            <CheckCircle size={16}/> Profile fully verified on blockchain!
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { icon:<FileCode size={20} style={{color:'#6366f1'}}/>,  value: student.files?.length||0,                  label:'Files Uploaded' },
          { icon:<Star size={20} style={{color:'#f59e0b'}}/>,      value: dna?.scores?.overall??'—',                 label:'Overall Score',  isScore:true },
          { icon:<TrendingUp size={20} style={{color:'#10b981'}}/>,value: dna?.growthRate ? `${dna.growthRate}%`:'—',label:'Growth Rate',    raw:true },
          { icon:<Trophy size={20} style={{color:'#a855f7'}}/>,    value: badges.length,                             label:'Badges Earned' },
        ].map((s,i) => (
          <div className="stat-card" key={i}>
            {s.icon}
            <div className="stat-value">
              {s.raw ? s.value : typeof s.value==='number' ? <AnimatedNumber value={s.value}/> : s.value}
            </div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Badges showcase */}
      {badges.length > 0 && (
        <div className="card mb-6">
          <div className="card-title-row">
            <Trophy size={16} style={{color:'var(--amber2)'}}/>
            <h3 className="card-title" style={{margin:0}}>Earned Badges</h3>
            <span className="badge badge--amber">{badges.length}</span>
          </div>
          <div className="badges-grid">
            {badges.map(b => (
              <div key={b.id} className="skill-badge skill-badge--earned" title={b.desc}>
                <span className="skill-badge-icon">{b.emoji}</span>
                <span className="skill-badge-name">{b.name}</span>
                <span className="skill-badge-earned-label">Earned</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="action-grid">
        {actions.map(a => (
          <Link key={a.to} to={a.to} className="action-card">
            <div className="action-icon" style={{color:a.color, background:`${a.color}18`}}>{a.icon}</div>
            <div className="action-info">
              <h4>{a.label}</h4>
              <p className="text-muted" style={{fontSize:'0.82rem'}}>{a.desc}</p>
            </div>
            <div className="action-status">
              {a.done ? <CheckCircle size={17} className="text-green"/> : <Circle size={17} className="text-muted"/>}
              <ArrowRight size={15}/>
            </div>
          </Link>
        ))}
      </div>

      {/* Blockchain record */}
      {student.blockchainHash && (
        <div className="card card--blockchain mb-6">
          <div className="card-title-row">
            <Blocks size={17}/><h3 className="card-title" style={{margin:0}}>Blockchain Record</h3>
            <span className="badge badge--green">Immutable</span>
          </div>
          <HashBadge hash={student.blockchainHash} label="Skill Hash"/>
          <div className="blockchain-meta">
            <span><Clock size={12}/> {new Date(student.blockchainTimestamp).toLocaleString()}</span>
            <span>Block #{student.blockNumber}</span>
            <span style={{fontFamily:'monospace',fontSize:'0.75rem'}}>Tx: {student.blockchainTxId?.slice(0,18)}...</span>
          </div>
        </div>
      )}

      {/* Shareable profile link */}
      {student.analyzed && (
        <div className="share-card">
          <Share2 size={18} style={{color:'var(--cyan2)',flexShrink:0}}/>
          <div style={{flex:1,minWidth:0}}>
            <p style={{fontSize:'0.85rem',fontWeight:700,marginBottom:'0.3rem'}}>Share your verified profile</p>
            <p className="text-muted" style={{fontSize:'0.78rem'}}>Anyone with this link can view your skill profile</p>
          </div>
          <div className="share-url">{profileUrl}</div>
          <button className="btn btn-outline btn-sm" onClick={copyLink}>
            {copied ? <><Check size={13}/> Copied!</> : <><Copy size={13}/> Copy Link</>}
          </button>
          <Link to={`/profile/${id}`} className="btn btn-glow btn-sm">
            View <ArrowRight size={13}/>
          </Link>
        </div>
      )}

      {/* Next step nudge */}
      {stepIdx < 4 && (
        <div className="nudge-card">
          <span>👉 Next: </span>
          {stepIdx===1 && <Link to={`/upload/${id}`}>Upload your code files →</Link>}
          {stepIdx===2 && <Link to={`/skill-dna/${id}`}>Run AI Analysis →</Link>}
          {stepIdx===3 && <Link to={`/skill-dna/${id}`}>Store on Blockchain →</Link>}
        </div>
      )}
    </div>
  );
}
