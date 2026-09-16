import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Building2, Search, Filter, ShieldCheck, ArrowRight, Trophy, TrendingUp } from 'lucide-react';
import { getAllStudents } from '../api/api';
import Spinner from '../components/Spinner';

const SCORE_COLORS = { python:'#6366f1', problemSolving:'#22d3ee', machineLearning:'#f59e0b', codeQuality:'#10b981' };

const LEVELS = ['All Levels','Novice','Beginner','Intermediate','Advanced','Expert'];
const SORT_OPTIONS = [
  { value:'overall',  label:'Overall Score' },
  { value:'python',   label:'Python Score' },
  { value:'ml',       label:'ML Score' },
  { value:'growth',   label:'Growth Rate' },
];

function CandidateCard({ student, onClick }) {
  const dna = student.skillDNA;
  if (!dna) return null;
  const badges = student.badges || [];
  return (
    <div className="candidate-card" onClick={onClick}>
      <div className="candidate-card-header">
        <div className="candidate-avatar">{student.name.charAt(0).toUpperCase()}</div>
        <div style={{flex:1,minWidth:0}}>
          <div className="candidate-name">{student.name}</div>
          <div className="candidate-course">{student.course}</div>
        </div>
        {student.blockchainVerified && <span className="badge badge--green" style={{fontSize:'0.65rem'}}>✓ Verified</span>}
      </div>

      <div className="candidate-scores">
        {[
          {label:'Py',  val:dna.scores.python,          color:SCORE_COLORS.python},
          {label:'PS',  val:dna.scores.problemSolving,  color:SCORE_COLORS.problemSolving},
          {label:'ML',  val:dna.scores.machineLearning, color:SCORE_COLORS.machineLearning},
          {label:'CQ',  val:dna.scores.codeQuality,     color:SCORE_COLORS.codeQuality},
        ].map(s=>(
          <div key={s.label} className="cand-score-pill">
            <span style={{color:s.color,fontSize:'0.65rem',fontWeight:700}}>{s.label}</span>
            <strong style={{color:s.color}}>{s.val}</strong>
          </div>
        ))}
      </div>

      <div className="candidate-footer">
        <div style={{display:'flex',gap:'0.3rem',alignItems:'center'}}>
          <span className="badge badge--blue" style={{fontSize:'0.65rem'}}>{dna.profileLevel}</span>
          <span style={{fontSize:'0.75rem',color:'var(--green2)',fontWeight:600}}>📈 {dna.growthRate}%</span>
        </div>
        <div style={{display:'flex',gap:'0.2rem'}}>
          {badges.slice(0,4).map(b=>(
            <span key={b.id} title={b.name} style={{fontSize:'0.9rem'}}>{b.emoji}</span>
          ))}
          {badges.length>4 && <span style={{fontSize:'0.72rem',color:'var(--muted)'}}>+{badges.length-4}</span>}
        </div>
      </div>
    </div>
  );
}

export default function CompanyDashboard() {
  const navigate = useNavigate();
  const [students,  setStudents]  = useState([]);
  const [filtered,  setFiltered]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [levelFilter, setLevel]   = useState('All Levels');
  const [sortBy,    setSortBy]    = useState('overall');
  const [verifiedOnly, setVerified] = useState(false);

  useEffect(()=>{
    getAllStudents()
      .then(({data})=>{
        const analyzed = (data.students||[]).filter(s=>s.analyzed && s.skillDNA);
        setStudents(analyzed);
      })
      .catch(()=>toast.error('Could not load candidates'))
      .finally(()=>setLoading(false));
  },[]);

  useEffect(()=>{
    let list = [...students];
    // search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.course?.toLowerCase().includes(q) ||
        s.college?.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q)
      );
    }
    // level filter
    if (levelFilter !== 'All Levels') list = list.filter(s=>s.skillDNA?.profileLevel===levelFilter);
    // verified only
    if (verifiedOnly) list = list.filter(s=>s.blockchainHash);
    // sort
    list.sort((a,b)=>{
      if (sortBy==='overall')  return (b.skillDNA.scores.overall||0)-(a.skillDNA.scores.overall||0);
      if (sortBy==='python')   return (b.skillDNA.scores.python||0)-(a.skillDNA.scores.python||0);
      if (sortBy==='ml')       return (b.skillDNA.scores.machineLearning||0)-(a.skillDNA.scores.machineLearning||0);
      if (sortBy==='growth')   return (b.skillDNA.growthRate||0)-(a.skillDNA.growthRate||0);
      return 0;
    });
    setFiltered(list);
  },[students, search, levelFilter, sortBy, verifiedOnly]);

  if (loading) return (
    <div className="dna-spinner">
      <div className="dna-helix">{Array.from({length:8}).map((_,i)=><span key={i}/>)}</div>
      <p className="text-muted">Loading candidates…</p>
    </div>
  );

  return (
    <div className="page">
      <div className="company-header">
        <div style={{display:'flex',alignItems:'center',gap:'0.85rem',marginBottom:'0.5rem'}}>
          <div style={{width:44,height:44,borderRadius:12,background:'linear-gradient(135deg,#6366f1,#22d3ee)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 20px rgba(99,102,241,0.4)'}}>
            <Building2 size={22} color="white"/>
          </div>
          <div>
            <h1>Company Dashboard</h1>
            <p className="text-muted" style={{fontSize:'0.85rem'}}>{filtered.length} verified candidates found</p>
          </div>
        </div>

        <div className="search-bar">
          <div style={{position:'relative',flex:1,minWidth:200}}>
            <Search size={15} style={{position:'absolute',left:'0.85rem',top:'50%',transform:'translateY(-50%)',color:'var(--muted)',pointerEvents:'none'}}/>
            <input className="search-input" style={{paddingLeft:'2.4rem'}}
              placeholder="Search by name, course, college, ID…"
              value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <select className="filter-select" value={levelFilter} onChange={e=>setLevel(e.target.value)}>
            {LEVELS.map(l=><option key={l}>{l}</option>)}
          </select>
          <select className="filter-select" value={sortBy} onChange={e=>setSortBy(e.target.value)}>
            {SORT_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <label style={{display:'flex',alignItems:'center',gap:'0.4rem',fontSize:'0.85rem',color:'var(--muted)',cursor:'pointer',whiteSpace:'nowrap'}}>
            <input type="checkbox" checked={verifiedOnly} onChange={e=>setVerified(e.target.checked)}
              style={{accentColor:'var(--green)'}}/>
            Verified only
          </label>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Building2 size={40} className="text-muted"/>
          <p>{students.length===0 ? 'No analyzed students yet.' : 'No candidates match your filters.'}</p>
          <p className="text-muted" style={{fontSize:'0.85rem'}}>Students must register, upload code, and run AI analysis to appear here.</p>
        </div>
      ) : (
        <div className="candidates-grid">
          {filtered.map(s=>(
            <CandidateCard
              key={s.studentId}
              student={{...s, blockchainVerified:!!s.blockchainHash}}
              onClick={()=>navigate(`/verify?id=${s.studentId}`)}
            />
          ))}
        </div>
      )}

      <div className="trust-note" style={{marginTop:'2rem'}}>
        <ShieldCheck size={15} style={{flexShrink:0,color:'var(--green2)'}}/>
        <p>All skill data is AI-analyzed from real code — not self-reported. Click any candidate to verify their blockchain record.</p>
      </div>
    </div>
  );
}
