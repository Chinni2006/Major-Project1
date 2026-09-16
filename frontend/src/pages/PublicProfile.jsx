import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Dna, Blocks, ShieldCheck, Trophy, TrendingUp, Star, Copy, Check, ExternalLink } from 'lucide-react';
import { getPublicProfile } from '../api/api';
import ScoreCard from '../components/ScoreCard';
import HashBadge from '../components/HashBadge';

const COLORS = { python:'#6366f1', problemSolving:'#22d3ee', machineLearning:'#f59e0b', codeQuality:'#10b981' };

export default function PublicProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState(false);

  useEffect(()=>{
    getPublicProfile(id)
      .then(({data})=>{ if(data.success) setProfile(data.profile); })
      .catch(()=>toast.error('Profile not found'))
      .finally(()=>setLoading(false));
  },[id]);

  const copy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true); setTimeout(()=>setCopied(false),2000);
    toast.success('Link copied!');
  };

  if (loading) return (
    <div className="dna-spinner">
      <div className="dna-helix">{Array.from({length:8}).map((_,i)=><span key={i}/>)}</div>
      <p className="text-muted">Loading profile…</p>
    </div>
  );

  if (!profile) return (
    <div className="empty-state" style={{paddingTop:'5rem'}}>
      <Dna size={48} className="text-muted"/>
      <p>Profile not found.</p>
      <Link to="/" className="btn btn-primary btn-sm">Go Home</Link>
    </div>
  );

  const dna = profile.skillDNA;
  const badges = profile.badges || [];

  return (
    <div className="page">
      {/* Hero */}
      <div className="public-profile-hero">
        <div className="student-avatar student-avatar--lg" style={{margin:'0 auto 0.75rem'}}>
          {profile.name.charAt(0).toUpperCase()}
        </div>
        <h1>{profile.name}</h1>
        <p className="text-muted">{profile.course} · {profile.college}</p>
        <code className="student-id-badge" style={{marginTop:'0.5rem'}}>{profile.studentId}</code>

        <div style={{display:'flex',gap:'0.6rem',justifyContent:'center',flexWrap:'wrap',marginTop:'1rem'}}>
          {profile.blockchainVerified && <span className="badge badge--green"><ShieldCheck size={11}/> Blockchain Verified</span>}
          {dna && <span className="badge badge--blue">{dna.profileLevel}</span>}
          {dna && <span className="badge badge--cyan">📈 {dna.growthRate}% growth</span>}
          <span className="badge badge--purple"><Trophy size={10}/> {badges.length} Badges</span>
        </div>

        <div style={{display:'flex',gap:'0.75rem',justifyContent:'center',marginTop:'1.25rem',flexWrap:'wrap'}}>
          <button className="btn btn-outline btn-sm" onClick={copy}>
            {copied ? <><Check size={13}/> Copied!</> : <><Copy size={13}/> Copy Link</>}
          </button>
          <Link to="/verify" className="btn btn-glow btn-sm">
            <ShieldCheck size={13}/> Verify This Profile
          </Link>
        </div>
      </div>

      {!dna ? (
        <div className="empty-state">
          <Dna size={36} className="text-muted"/>
          <p>This student hasn't run AI analysis yet.</p>
        </div>
      ) : (
        <>
          {/* Scores */}
          <div className="score-grid" style={{marginBottom:'1.5rem'}}>
            <ScoreCard label="Python"          score={dna.scores.python}          color={COLORS.python}          icon="🐍"/>
            <ScoreCard label="Problem Solving" score={dna.scores.problemSolving}  color={COLORS.problemSolving}  icon="🧩"/>
            <ScoreCard label="Machine Learning"score={dna.scores.machineLearning} color={COLORS.machineLearning} icon="🤖"/>
            <ScoreCard label="Code Quality"    score={dna.scores.codeQuality}     color={COLORS.codeQuality}     icon="✨"/>
          </div>

          {/* Overall stats */}
          <div className="overall-row" style={{marginBottom:'1.5rem'}}>
            <div className="overall-card">
              <Star size={17} className="text-amber" style={{margin:'0 auto 0.4rem',display:'block'}}/>
              <div className="overall-score gradient-text-gold">{dna.scores.overall}</div>
              <div className="overall-label">Overall Score</div>
              <div className="level-badge">{dna.profileLevel}</div>
            </div>
            <div className="overall-card">
              <TrendingUp size={17} className="text-green" style={{margin:'0 auto 0.4rem',display:'block'}}/>
              <div className="overall-score" style={{color:'var(--green2)'}}>{dna.growthRate}%</div>
              <div className="overall-label">Growth Rate</div>
              <div className="level-badge">Per 6 months</div>
            </div>
            <div className="overall-card">
              <Dna size={17} className="text-indigo" style={{margin:'0 auto 0.4rem',display:'block'}}/>
              <div className="overall-score" style={{color:'var(--indigo2)'}}>{dna.totalLinesOfCode}</div>
              <div className="overall-label">Lines of Code</div>
              <div className="level-badge">{dna.totalFilesAnalyzed} files</div>
            </div>
          </div>

          {/* Badges */}
          {badges.length > 0 && (
            <div className="card card--glow mb-6">
              <div className="card-title-row">
                <Trophy size={15} style={{color:'var(--amber2)'}}/>
                <h3 className="card-title" style={{margin:0}}>Earned Badges</h3>
                <span className="badge badge--amber">{badges.length}</span>
              </div>
              <div className="badges-grid">
                {badges.map(b=>(
                  <div key={b.id} className="skill-badge skill-badge--earned" title={b.desc}>
                    <span className="skill-badge-icon">{b.emoji}</span>
                    <span className="skill-badge-name">{b.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detected skills */}
          {dna.detectedSkills && (
            <div className="card mb-6">
              <h3 className="card-title">Skills Detected in Code</h3>
              <div className="detected-skills">
                {dna.detectedSkills.algorithms?.length>0 && (
                  <div className="skill-group">
                    <span className="skill-group-label">Algorithms</span>
                    {dna.detectedSkills.algorithms.map(a=><span key={a} className="skill-tag skill-tag--algo">{a.replace('_',' ')}</span>)}
                  </div>
                )}
                {dna.detectedSkills.dataStructures?.length>0 && (
                  <div className="skill-group">
                    <span className="skill-group-label">Data Structures</span>
                    {dna.detectedSkills.dataStructures.map(d=><span key={d} className="skill-tag skill-tag--ds">{d}</span>)}
                  </div>
                )}
                {dna.detectedSkills.mlLibraries?.length>0 && (
                  <div className="skill-group">
                    <span className="skill-group-label">ML Libraries</span>
                    {dna.detectedSkills.mlLibraries.map(l=><span key={l} className="skill-tag skill-tag--ml">{l}</span>)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Blockchain record */}
          {profile.blockchainVerified && (
            <div className="card card--blockchain">
              <div className="card-title-row">
                <Blocks size={16}/><h3 className="card-title" style={{margin:0}}>Blockchain Record</h3>
                <span className="badge badge--green">Immutable</span>
              </div>
              <HashBadge hash={profile.blockchainHash} label="Skill Hash"/>
              <div className="blockchain-meta">
                <span>Block #{profile.blockNumber}</span>
                <span style={{fontFamily:'monospace',fontSize:'0.72rem'}}>Tx: {profile.blockchainTxId?.slice(0,20)}…</span>
                <span>{profile.blockchainTimestamp && new Date(profile.blockchainTimestamp).toLocaleString()}</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer CTA */}
      <div style={{textAlign:'center',marginTop:'2.5rem',padding:'2rem',background:'rgba(99,102,241,0.04)',border:'1px solid rgba(99,102,241,0.1)',borderRadius:16}}>
        <p className="text-muted" style={{marginBottom:'1rem',fontSize:'0.9rem'}}>Are you a company looking to verify this profile?</p>
        <Link to="/verify" className="btn btn-glow btn-sm">
          <ShieldCheck size={14}/> Verify on Blockchain <ExternalLink size={12}/>
        </Link>
      </div>
    </div>
  );
}
