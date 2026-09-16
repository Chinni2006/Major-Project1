import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Trophy, RefreshCw, ShieldCheck, TrendingUp, Medal } from 'lucide-react';
import { getLeaderboard } from '../api/api';

const MEDALS = { 0:'🥇', 1:'🥈', 2:'🥉' };
const ROW_CLASS = { 0:'lb-row--gold', 1:'lb-row--silver', 2:'lb-row--bronze' };

function ScoreBar({ score, color }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
      <div style={{flex:1,height:5,background:'rgba(255,255,255,0.06)',borderRadius:99,overflow:'hidden'}}>
        <div style={{width:`${score}%`,height:'100%',background:color,borderRadius:99,boxShadow:`0 0 6px ${color}`}}/>
      </div>
      <span style={{fontSize:'0.72rem',fontWeight:700,color,minWidth:28}}>{score}</span>
    </div>
  );
}

export default function Leaderboard() {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');

  const load = () => {
    setLoading(true);
    getLeaderboard()
      .then(({data:d})=>setData(d.leaderboard||[]))
      .catch(()=>toast.error('Could not load leaderboard'))
      .finally(()=>setLoading(false));
  };

  useEffect(()=>{ load(); },[]);

  const filtered = filter==='verified' ? data.filter(s=>s.blockchainVerified) : data;

  return (
    <div className="page">
      <div className="leaderboard-header">
        <div style={{fontSize:'2.5rem',marginBottom:'0.5rem'}}>🏆</div>
        <h1><span className="gradient-text-gold">Skill Leaderboard</span></h1>
        <p className="text-muted">Top students ranked by AI-analyzed overall skill score</p>
        <div style={{display:'flex',gap:'0.75rem',justifyContent:'center',marginTop:'1rem',flexWrap:'wrap'}}>
          <button className={`btn btn-sm ${filter==='all'?'btn-primary':'btn-outline'}`} onClick={()=>setFilter('all')}>All Students</button>
          <button className={`btn btn-sm ${filter==='verified'?'btn-glow':'btn-outline'}`} onClick={()=>setFilter('verified')}>
            <ShieldCheck size={13}/> Blockchain Verified
          </button>
          <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={13}/></button>
        </div>
      </div>

      {loading ? (
        <div className="dna-spinner">
          <div className="dna-helix">{Array.from({length:8}).map((_,i)=><span key={i}/>)}</div>
          <p className="text-muted">Loading leaderboard…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Trophy size={40} className="text-muted"/>
          <p>No students on the leaderboard yet.</p>
          <p className="text-muted" style={{fontSize:'0.85rem'}}>Register, upload code, and run AI analysis to appear here.</p>
          <Link to="/register" className="btn btn-glow btn-sm" style={{marginTop:'0.5rem'}}>Register Now</Link>
        </div>
      ) : (
        <div className="lb-list">
          {filtered.map((s, i) => (
            <div key={s.studentId} className={`lb-row ${ROW_CLASS[i]||''}`}>
              {/* Rank */}
              <div className={`lb-rank ${i<3?`lb-rank--${i+1}`:''}`}>
                {i < 3 ? MEDALS[i] : `#${i+1}`}
              </div>

              {/* Avatar */}
              <div className="lb-avatar"
                style={i===0?{background:'linear-gradient(135deg,#f59e0b,#fbbf24)',boxShadow:'0 0 20px rgba(245,158,11,0.5)'}:{}}>
                {s.name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="lb-info" style={{flex:1,minWidth:0}}>
                <div className="lb-name">{s.name}</div>
                <div className="lb-course">{s.course}</div>
                <div style={{display:'flex',gap:'0.4rem',marginTop:'0.3rem',flexWrap:'wrap'}}>
                  {s.blockchainVerified && <span className="badge badge--green" style={{fontSize:'0.62rem'}}>✓ Verified</span>}
                  <span className="badge badge--blue" style={{fontSize:'0.62rem'}}>{s.profileLevel}</span>
                  <span style={{fontSize:'0.72rem',color:'var(--green2)',fontWeight:600}}><TrendingUp size={10} style={{verticalAlign:'middle'}}/> {s.growthRate}%</span>
                </div>
              </div>

              {/* Score bars */}
              <div style={{minWidth:180,display:'none'}}>
                <ScoreBar score={s.scores.python}          color="#6366f1"/>
                <ScoreBar score={s.scores.problemSolving}  color="#22d3ee"/>
                <ScoreBar score={s.scores.machineLearning} color="#f59e0b"/>
              </div>

              {/* Overall score */}
              <div style={{textAlign:'right',flexShrink:0}}>
                <div className="lb-score" style={i===0?{color:'var(--amber2)',textShadow:'0 0 12px rgba(245,158,11,0.5)'}:{}}>
                  {s.scores.overall}
                </div>
                <div className="lb-score-label">Overall</div>
              </div>

              {/* Badges */}
              <div className="lb-badges" style={{flexShrink:0}}>
                {(s.badges||[]).slice(0,3).map(b=>(
                  <span key={b.id} className="lb-mini-badge" title={b.name}>{b.emoji}</span>
                ))}
              </div>

              {/* Verify link */}
              <Link to={`/verify`} className="btn btn-outline btn-sm" style={{flexShrink:0}}
                onClick={e => { sessionStorage.setItem('prefill_id', s.studentId); }}>
                Verify
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
