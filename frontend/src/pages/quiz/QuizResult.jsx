import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  CheckCircle, XCircle, Trophy, TrendingUp, Dna,
  AlertTriangle, BookOpen, ArrowLeft, Star
} from 'lucide-react';
import { getAvailableQuizzes, getAttemptResult } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const ScoreRing = ({ pct }) => {
  const r = 52, c = 2*Math.PI*r;
  const color = pct>=75?'var(--green2)':pct>=50?'var(--amber2)':'var(--red)';
  return (
    <svg width="130" height="130" style={{transform:'rotate(-90deg)'}}>
      <circle cx="65" cy="65" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10"/>
      <circle cx="65" cy="65" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={c} strokeDashoffset={c - (pct/100)*c}
        strokeLinecap="round" style={{transition:'stroke-dashoffset 1.5s ease',filter:`drop-shadow(0 0 8px ${color})`}}/>
      <text x="65" y="65" textAnchor="middle" dominantBaseline="middle"
        style={{fill:color,fontSize:22,fontWeight:900,transform:'rotate(90deg)',transformOrigin:'65px 65px',fontFamily:'Space Grotesk,sans-serif'}}>
        {pct}%
      </text>
    </svg>
  );
};

export default function QuizResult() {
  const { quizId }  = useParams();
  const location    = useLocation();
  const navigate    = useNavigate();
  const { student } = useAuth();

  // Result might come from navigation state (fresh submit) or API
  const [result,  setResult]  = useState(location.state?.result || null);
  const [quiz,    setQuiz]    = useState(null);
  const [loading, setLoading] = useState(!result);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!student) { navigate('/login'); return; }
    // Get quiz title
    getAvailableQuizzes()
      .then(({ data }) => { const q = data.quizzes?.find(x=>x.quizId===quizId); if(q) setQuiz(q); })
      .catch(()=>{});

    if (!result) {
      // Need to fetch - find latest submitted attempt for this quiz
      // We get it from the quiz list (attemptStatus submitted with scorePercent)
      setLoading(false);
    }
  }, [quizId]);

  if (loading) return <div className="dna-spinner"><div className="dna-helix">{Array.from({length:8}).map((_,i)=><span key={i}/>)}</div><p className="text-muted">Loading result…</p></div>;

  if (!result) return (
    <div className="empty-state" style={{paddingTop:'4rem'}}>
      <BookOpen size={40} className="text-muted"/>
      <p>No result found for this quiz.</p>
      <Link to="/quizzes" className="btn btn-primary btn-sm" style={{marginTop:'0.5rem'}}>Back to Quizzes</Link>
    </div>
  );

  const pct      = result.scorePercent;
  const passed   = pct >= 50;
  const breakdown= result.breakdown || [];
  const shown    = showAll ? breakdown : breakdown.slice(0,5);

  return (
    <div className="page">
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:'1rem',marginBottom:'1.5rem',flexWrap:'wrap'}}>
        <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/quizzes')}><ArrowLeft size={14}/> My Quizzes</button>
        <h1 style={{fontSize:'1.5rem',fontWeight:800,flex:1,letterSpacing:'-0.02em'}}>Quiz Result</h1>
        {quiz && <span style={{fontSize:'0.875rem',color:'var(--muted)'}}>{quiz.title}</span>}
      </div>

      {/* Score hero */}
      <div style={{background:passed?'linear-gradient(135deg,rgba(16,185,129,0.07),rgba(34,211,238,0.04))':'linear-gradient(135deg,rgba(239,68,68,0.07),rgba(245,158,11,0.04))',border:`1px solid ${passed?'rgba(16,185,129,0.2)':'rgba(239,68,68,0.2)'}`,borderRadius:20,padding:'2rem',marginBottom:'2rem',textAlign:'center'}}>
        <div style={{display:'flex',justifyContent:'center',marginBottom:'1rem'}}>
          <ScoreRing pct={pct}/>
        </div>
        <h2 style={{fontSize:'1.75rem',fontWeight:900,letterSpacing:'-0.02em',marginBottom:'0.3rem'}}>
          {passed ? '🎉 Passed!' : '😔 Better luck next time'}
        </h2>
        <p className="text-muted">{result.score} / {result.totalMarks} marks · {pct}%</p>

        <div style={{display:'flex',gap:'1rem',justifyContent:'center',marginTop:'1.25rem',flexWrap:'wrap'}}>
          <span className="badge badge--blue">{breakdown.filter(b=>b.isCorrect).length} correct</span>
          <span className="badge badge--red">{breakdown.filter(b=>!b.isCorrect).length} wrong</span>
          {result.violations?.length > 0 && <span className="badge badge--amber"><AlertTriangle size={10}/> {result.violations.length} violations</span>}
        </div>

        {/* Skill DNA update notice */}
        {student?.skillDNA && (
          <div style={{marginTop:'1.25rem',background:'rgba(99,102,241,0.08)',border:'1px solid rgba(99,102,241,0.2)',borderRadius:10,padding:'0.75rem 1.25rem',display:'inline-flex',alignItems:'center',gap:'0.6rem',fontSize:'0.875rem'}}>
            <Dna size={15} style={{color:'var(--indigo2)'}}/>
            <span>Your <strong style={{color:'var(--indigo2)'}}>Skill DNA</strong> has been updated with this quiz score!</span>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="overall-row" style={{marginBottom:'2rem'}}>
        <div className="overall-card">
          <Trophy size={17} className="text-amber" style={{margin:'0 auto 0.4rem',display:'block'}}/>
          <div className="overall-score" style={{color:pct>=75?'var(--green2)':pct>=50?'var(--amber2)':'var(--red)'}}>{pct}%</div>
          <div className="overall-label">Score</div>
        </div>
        <div className="overall-card">
          <CheckCircle size={17} className="text-green" style={{margin:'0 auto 0.4rem',display:'block'}}/>
          <div className="overall-score" style={{color:'var(--green2)'}}>{breakdown.filter(b=>b.isCorrect).length}</div>
          <div className="overall-label">Correct</div>
        </div>
        <div className="overall-card">
          <XCircle size={17} className="text-red" style={{margin:'0 auto 0.4rem',display:'block'}}/>
          <div className="overall-score" style={{color:'var(--red)'}}>{breakdown.filter(b=>!b.isCorrect).length}</div>
          <div className="overall-label">Incorrect</div>
        </div>
      </div>

      {/* Answer breakdown */}
      {breakdown.length > 0 && (
        <div className="card">
          <h3 className="card-title">Answer Review</h3>
          <div style={{display:'flex',flexDirection:'column',gap:'0.85rem'}}>
            {shown.map((b,i)=>(
              <div key={b.questionId} style={{background:'rgba(255,255,255,0.02)',border:`1px solid ${b.isCorrect?'rgba(16,185,129,0.2)':'rgba(239,68,68,0.15)'}`,borderRadius:12,padding:'1rem 1.1rem',borderLeft:`3px solid ${b.isCorrect?'var(--green2)':'var(--red)'}`}}>
                <div style={{display:'flex',alignItems:'flex-start',gap:'0.75rem'}}>
                  {b.isCorrect ? <CheckCircle size={16} style={{color:'var(--green2)',flexShrink:0,marginTop:2}}/> : <XCircle size={16} style={{color:'var(--red)',flexShrink:0,marginTop:2}}/>}
                  <div style={{flex:1}}>
                    <p style={{fontSize:'0.875rem',fontWeight:600,marginBottom:'0.5rem'}}>Q{i+1}. {b.questionText}</p>
                    <div style={{display:'flex',gap:'1rem',flexWrap:'wrap',fontSize:'0.8rem'}}>
                      <span style={{color:'var(--muted)'}}>Your answer: <strong style={{color:b.isCorrect?'var(--green2)':'var(--red)'}}>{b.studentAnswer||'(no answer)'}</strong></span>
                      {!b.isCorrect && <span style={{color:'var(--muted)'}}>Correct: <strong style={{color:'var(--green2)'}}>{b.correctAnswer}</strong></span>}
                    </div>
                    {b.explanation && <p style={{fontSize:'0.78rem',color:'var(--muted)',marginTop:'0.35rem',fontStyle:'italic'}}>💡 {b.explanation}</p>}
                  </div>
                  <span className="badge badge--purple" style={{fontSize:'0.65rem',flexShrink:0}}>{b.marksEarned}/{b.marks}pt</span>
                </div>
              </div>
            ))}
          </div>
          {breakdown.length > 5 && (
            <button className="btn btn-outline btn-sm" style={{marginTop:'1rem',width:'100%'}} onClick={()=>setShowAll(v=>!v)}>
              {showAll ? 'Show less' : `Show all ${breakdown.length} questions`}
            </button>
          )}
        </div>
      )}

      {/* Proctoring summary */}
      {result.violations?.length > 0 && (
        <div className="card" style={{marginTop:'1.25rem',borderColor:'rgba(239,68,68,0.2)'}}>
          <h3 className="card-title" style={{color:'var(--red)'}}><AlertTriangle size={15}/> Proctoring Violations ({result.violations.length})</h3>
          <div style={{display:'flex',flexDirection:'column',gap:'0.4rem'}}>
            {result.violations.map((v,i)=>(
              <div key={i} style={{display:'flex',gap:'0.75rem',fontSize:'0.8rem',borderLeft:'2px solid var(--red)',paddingLeft:'0.75rem'}}>
                <span style={{color:'var(--red)',fontWeight:600,minWidth:140}}>{v.type.replace(/_/g,' ')}</span>
                <span className="text-muted">{v.detail}</span>
                <span className="text-muted" style={{marginLeft:'auto'}}>{new Date(v.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div style={{display:'flex',gap:'0.75rem',marginTop:'1.75rem',flexWrap:'wrap'}}>
        <Link to="/quizzes" className="btn btn-outline btn-sm"><ArrowLeft size={13}/> All Quizzes</Link>
        <Link to={`/skill-dna/${student?.studentId}`} className="btn btn-sm" style={{background:'linear-gradient(135deg,#6366f1,#22d3ee)',color:'white'}}>
          <Dna size={13}/> View Updated Skill DNA
        </Link>
      </div>
    </div>
  );
}
