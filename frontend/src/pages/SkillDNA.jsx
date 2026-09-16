import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell
} from 'recharts';
import { Dna, Blocks, Brain, TrendingUp, Star, AlertTriangle, Lightbulb, CheckCircle, Loader, Trophy, Lock } from 'lucide-react';
import { analyzeStudent, storeOnBlockchain, getStudent, getAllBadges } from '../api/api';
import ScoreCard from '../components/ScoreCard';
import HashBadge from '../components/HashBadge';
import Spinner from '../components/Spinner';

const COLORS = { python:'#6366f1', problemSolving:'#22d3ee', machineLearning:'#f59e0b', codeQuality:'#10b981' };

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) return (
    <div style={{background:'#0a1628',border:'1px solid rgba(99,102,241,0.3)',borderRadius:8,padding:'0.6rem 0.9rem',fontSize:'0.8rem'}}>
      <p style={{color:'var(--text)',fontWeight:700}}>{label}</p>
      <p style={{color:'var(--indigo2)'}}>{payload[0].value}/100</p>
    </div>
  );
  return null;
};

export default function SkillDNA() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [skillDNA, setSkillDNA] = useState(null);
  const [allBadges, setAllBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [storing, setStoring] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [stuRes, badgeRes] = await Promise.all([getStudent(id), getAllBadges()]);
      if (stuRes.data.success) {
        setStudent(stuRes.data.student);
        if (stuRes.data.student.skillDNA) { setSkillDNA(stuRes.data.student.skillDNA); setTimeout(()=>setRevealed(true),200); }
      }
      if (badgeRes.data.success) setAllBadges(badgeRes.data.badges);
    } catch { toast.error('Could not load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true); setRevealed(false);
      toast.loading('AI is analysing your code…', {id:'analyze'});
      const { data } = await analyzeStudent(id);
      if (data.success) {
        setSkillDNA(data.skillDNA);
        toast.success(`Skill DNA generated! ${data.skillDNA.scores.overall}/100 overall`, {id:'analyze'});
        setTimeout(()=>setRevealed(true), 200);
        load();
      }
    } catch(err) { toast.error(err.response?.data?.message||'Analysis failed',{id:'analyze'}); }
    finally { setAnalyzing(false); }
  };

  const handleStore = async () => {
    try {
      setStoring(true);
      toast.loading('Mining block on blockchain…',{id:'store'});
      const { data } = await storeOnBlockchain(id);
      if (data.success) { toast.success(`Block #${data.blockNumber} mined! Hash stored.`,{id:'store'}); load(); }
    } catch(err) {
      if (err.response?.status===409) toast.success('Already on blockchain!',{id:'store'});
      else toast.error(err.response?.data?.message||'Failed',{id:'store'});
    } finally { setStoring(false); }
  };

  if (loading) return (
    <div className="dna-spinner">
      <div className="dna-helix">{Array.from({length:8}).map((_,i)=><span key={i}/>)}</div>
      <p className="text-muted">Loading Skill DNA…</p>
    </div>
  );

  const dna = skillDNA || student?.skillDNA;
  const earnedBadges = student?.badges || [];
  const hasFiles = (student?.files?.length||0) > 0;

  const radarData = dna ? [
    {skill:'Python',      score:dna.scores.python},
    {skill:'Prob. Solving',score:dna.scores.problemSolving},
    {skill:'ML',          score:dna.scores.machineLearning},
    {skill:'Code Quality',score:dna.scores.codeQuality},
  ] : [];

  const barData = dna ? [
    {name:'Python',        score:dna.scores.python,          color:COLORS.python},
    {name:'Prob. Solving', score:dna.scores.problemSolving,  color:COLORS.problemSolving},
    {name:'ML',            score:dna.scores.machineLearning, color:COLORS.machineLearning},
    {name:'Code Quality',  score:dna.scores.codeQuality,     color:COLORS.codeQuality},
  ] : [];

  return (
    <div className="page">
      <div className="page-header">
        <h1><Dna size={24} style={{verticalAlign:'middle',marginRight:8}}/>Skill DNA Profile</h1>
        {student && <p className="text-muted">{student.name} · {student.course}</p>}
      </div>

      {!hasFiles && (
        <div className="info-banner info-banner--warn">
          <AlertTriangle size={17}/>
          <span>No files uploaded yet. <Link to={`/upload/${id}`}>Upload your code</Link> first.</span>
        </div>
      )}

      {hasFiles && !dna && (
        <div className="analyze-cta">
          <div style={{width:72,height:72,borderRadius:'50%',background:'linear-gradient(135deg,#6366f1,#22d3ee)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 30px rgba(99,102,241,0.5)'}}>
            <Brain size={32} color="white"/>
          </div>
          <h3>Ready for AI Analysis</h3>
          <p className="text-muted">{student?.files?.length} file(s) ready. AI will score your skills across 4 dimensions.</p>
          <button className="btn btn-glow btn-xl" onClick={handleAnalyze} disabled={analyzing}>
            {analyzing ? <><Loader size={16} className="spin"/> Analysing…</> : <><Brain size={16}/> Generate Skill DNA</>}
          </button>
        </div>
      )}

      {dna && (
        <>
          <div className="dna-toolbar">
            <button className="btn btn-outline btn-sm" onClick={handleAnalyze} disabled={analyzing}>
              {analyzing ? 'Analysing…' : '↻ Re-Analyse'}
            </button>
            {!student?.blockchainHash ? (
              <button className="btn btn-glow btn-sm" onClick={handleStore} disabled={storing}>
                {storing ? <><Loader size={13} className="spin"/> Mining…</> : <><Blocks size={13}/> Store on Blockchain</>}
              </button>
            ) : (
              <span className="badge badge--green"><CheckCircle size={12}/> On Blockchain</span>
            )}
            <div style={{marginLeft:'auto'}}>
              <span className="badge badge--blue" style={{fontSize:'0.8rem',padding:'0.3rem 0.8rem'}}>{dna.profileLevel}</span>
            </div>
          </div>

          {/* Score cards with reveal animation */}
          <div className="score-grid">
            {[
              {label:'Python',          score:dna.scores.python,          color:COLORS.python,          icon:'🐍'},
              {label:'Problem Solving', score:dna.scores.problemSolving,  color:COLORS.problemSolving,  icon:'🧩'},
              {label:'Machine Learning',score:dna.scores.machineLearning, color:COLORS.machineLearning, icon:'🤖'},
              {label:'Code Quality',    score:dna.scores.codeQuality,     color:COLORS.codeQuality,     icon:'✨'},
            ].map((s,i) => (
              <div key={s.label} style={{opacity:revealed?1:0,transform:revealed?'translateY(0)':'translateY(20px)',transition:`all 0.5s ${i*0.1}s`}}>
                <ScoreCard {...s}/>
              </div>
            ))}
          </div>

          {/* Overall stats */}
          <div className="overall-row">
            <div className="overall-card">
              <Star size={18} className="text-amber" style={{margin:'0 auto 0.4rem',display:'block'}}/>
              <div className="overall-score gradient-text-gold">{dna.scores.overall}</div>
              <div className="overall-label">Overall Score</div>
              <div className="level-badge">{dna.profileLevel}</div>
            </div>
            <div className="overall-card">
              <TrendingUp size={18} className="text-green" style={{margin:'0 auto 0.4rem',display:'block'}}/>
              <div className="overall-score" style={{color:'var(--green2)'}}>{dna.growthRate}%</div>
              <div className="overall-label">Growth Rate</div>
              <div className="level-badge">Per 6 months</div>
            </div>
            <div className="overall-card">
              <Brain size={18} className="text-indigo" style={{margin:'0 auto 0.4rem',display:'block'}}/>
              <div className="overall-score" style={{color:'var(--indigo2)'}}>{dna.totalLinesOfCode}</div>
              <div className="overall-label">Lines of Code</div>
              <div className="level-badge">{dna.totalFilesAnalyzed} files</div>
            </div>
          </div>

          {/* Charts */}
          <div className="charts-grid">
            <div className="card">
              <h3 className="card-title">Skill Radar</h3>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(99,102,241,0.15)"/>
                  <PolarAngleAxis dataKey="skill" tick={{fill:'#64748b',fontSize:11}}/>
                  <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2}/>
                  <Tooltip content={<CustomTooltip/>}/>
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h3 className="card-title">Score Breakdown</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={barData} margin={{top:5,right:10,left:-20,bottom:5}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
                  <XAxis dataKey="name" tick={{fill:'#64748b',fontSize:10}}/>
                  <YAxis domain={[0,100]} tick={{fill:'#64748b',fontSize:10}}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Bar dataKey="score" radius={[6,6,0,0]}>
                    {barData.map((entry,i) => <Cell key={i} fill={entry.color}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Badge showcase */}
          <div className="card mb-6">
            <div className="card-title-row">
              <Trophy size={16} style={{color:'var(--amber2)'}}/>
              <h3 className="card-title" style={{margin:0}}>Achievement Badges</h3>
              <span className="badge badge--amber">{earnedBadges.length} / {allBadges.length} earned</span>
            </div>
            <div className="badges-grid">
              {allBadges.map(b => {
                const earned = earnedBadges.some(e => e.id === b.id);
                return (
                  <div key={b.id} className={`skill-badge ${earned?'skill-badge--earned':'skill-badge--locked'}`} title={b.desc}>
                    <span className="skill-badge-icon">{earned ? b.emoji : <Lock size={18}/>}</span>
                    <span className="skill-badge-name">{b.name}</span>
                    {earned && <span className="skill-badge-earned-label">✓ Earned</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detected skills */}
          {dna.detectedSkills && (
            <div className="card mb-6">
              <h3 className="card-title">Detected in Your Code</h3>
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

          {/* Strengths & Recommendations */}
          <div className="sw-grid">
            {(dna.strengths?.length>0) && (
              <div className="card">
                <h3 className="card-title text-green">💪 Strengths</h3>
                <ul className="sw-list">
                  {dna.strengths.map(s=><li key={s}><CheckCircle size={13} className="text-green"/>{s}</li>)}
                </ul>
              </div>
            )}
            {(dna.recommendations?.length>0) && (
              <div className="card">
                <h3 className="card-title"><Lightbulb size={15} className="text-amber"/> Recommendations</h3>
                <ul className="sw-list">
                  {dna.recommendations.map((r,i)=><li key={i}><span className="rec-dot">→</span>{r}</li>)}
                </ul>
              </div>
            )}
          </div>

          {/* Blockchain */}
          {student?.blockchainHash && (
            <div className="card card--blockchain">
              <div className="card-title-row"><Blocks size={17}/><h3 className="card-title" style={{margin:0}}>Blockchain Record</h3><span className="badge badge--green">Immutable</span></div>
              <HashBadge hash={student.blockchainHash} label="Skill Hash"/>
              <div className="blockchain-meta">
                <span>Block #{student.blockNumber}</span>
                <span style={{fontFamily:'monospace',fontSize:'0.72rem'}}>Tx: {student.blockchainTxId?.slice(0,22)}…</span>
                <span>{new Date(student.blockchainTimestamp).toLocaleString()}</span>
              </div>
              <div className="skill-string"><code>{dna.skillString}</code></div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
