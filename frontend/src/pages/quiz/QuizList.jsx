import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { BookOpen, Clock, CheckCircle, PlayCircle, BarChart2, Lock } from 'lucide-react';
import { getAvailableQuizzes, getMyAttempts } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/Spinner';

const STATUS_CONFIG = {
  not_started: { label:'Start Quiz',  color:'var(--indigo2)', bg:'rgba(99,102,241,0.12)', icon:<PlayCircle size={14}/> },
  in_progress:  { label:'Resume',     color:'var(--amber2)',  bg:'rgba(245,158,11,0.12)', icon:<Clock size={14}/> },
  submitted:    { label:'View Result',color:'var(--green2)',  bg:'rgba(16,185,129,0.12)', icon:<CheckCircle size={14}/> },
};

const SKILL_COLOR = { python:'#6366f1', dsa:'#22d3ee', ml:'#f59e0b', general:'#a855f7' };

export default function QuizList() {
  const navigate = useNavigate();
  const { student } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student) { navigate('/login'); return; }
    getAvailableQuizzes()
      .then(({ data }) => { if(data.success) setQuizzes(data.quizzes); })
      .catch(err => {
        if (err.response?.status === 401) navigate('/login');
        else toast.error('Could not load quizzes');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="dna-spinner">
      <div className="dna-helix">{Array.from({length:8}).map((_,i)=><span key={i}/>)}</div>
      <p className="text-muted">Loading your quizzes…</p>
    </div>
  );

  return (
    <div className="page">
      {/* Header */}
      <div style={{background:'linear-gradient(135deg,rgba(99,102,241,0.07),rgba(34,211,238,0.04))',border:'1px solid rgba(99,102,241,0.15)',borderRadius:20,padding:'1.75rem',marginBottom:'2rem'}}>
        <h1 style={{fontSize:'1.6rem',fontWeight:800,letterSpacing:'-0.02em',marginBottom:'0.3rem'}}>
          📝 My Quizzes
        </h1>
        <p className="text-muted" style={{fontSize:'0.9rem'}}>
          Quizzes assigned to {student?.branch} · Section {student?.section}
        </p>
        {student && (
          <div style={{display:'flex',gap:'0.5rem',marginTop:'0.75rem',flexWrap:'wrap'}}>
            <span className="badge badge--blue">{student.branch}</span>
            <span className="badge badge--cyan">Section {student.section}</span>
            <span className="badge badge--purple">{student.rollNo}</span>
          </div>
        )}
      </div>

      {quizzes.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={44} className="text-muted"/>
          <p style={{fontWeight:700}}>No quizzes assigned yet</p>
          <p className="text-muted" style={{fontSize:'0.875rem'}}>Your teacher hasn't published any quizzes for your branch/section yet.</p>
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:'1.1rem'}}>
          {quizzes.map(q => {
            const cfg   = STATUS_CONFIG[q.attemptStatus] || STATUS_CONFIG.not_started;
            const color = SKILL_COLOR[q.skillCategory] || SKILL_COLOR.general;
            const done  = q.attemptStatus === 'submitted';

            return (
              <div key={q.quizId} className="card" style={{borderColor:done?'rgba(16,185,129,0.2)':'var(--border2)',position:'relative',overflow:'hidden',transition:'all 0.3s'}}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor=color; e.currentTarget.style.transform='translateY(-4px)'; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor=done?'rgba(16,185,129,0.2)':'var(--border2)'; e.currentTarget.style.transform='translateY(0)'; }}>

                {/* Top accent */}
                <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:color,boxShadow:`0 0 8px ${color}`}}/>

                <div style={{display:'flex',alignItems:'flex-start',gap:'0.75rem',marginBottom:'0.85rem',paddingTop:'0.3rem'}}>
                  <div style={{width:40,height:40,borderRadius:10,background:`${color}18`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <BookOpen size={18} style={{color}}/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <h3 style={{fontSize:'1rem',fontWeight:700,letterSpacing:'-0.01em',marginBottom:'0.15rem'}}>{q.title}</h3>
                    <p style={{fontSize:'0.78rem',color:'var(--muted)'}}>{q.subject || 'General'} · By {q.teacherName}</p>
                  </div>
                  {done && <CheckCircle size={18} style={{color:'var(--green2)',flexShrink:0}}/>}
                </div>

                {q.description && <p style={{fontSize:'0.82rem',color:'var(--muted)',marginBottom:'0.85rem',lineHeight:1.5}}>{q.description}</p>}

                {/* Meta */}
                <div style={{display:'flex',gap:'0.6rem',flexWrap:'wrap',marginBottom:'1rem'}}>
                  <span className="badge badge--blue" style={{fontSize:'0.68rem'}}><Clock size={10}/> {q.durationMinutes} min</span>
                  <span className="badge" style={{fontSize:'0.68rem',background:`${color}18`,color,border:`1px solid ${color}30`}}>{q.skillCategory?.toUpperCase()}</span>
                  <span className="badge badge--purple" style={{fontSize:'0.68rem'}}>{q.questionCount} questions</span>
                  <span className="badge badge--amber" style={{fontSize:'0.68rem'}}>{q.totalMarks} marks</span>
                </div>

                {/* Score if submitted */}
                {done && q.scorePercent !== null && (
                  <div style={{background:`rgba(16,185,129,0.08)`,border:'1px solid rgba(16,185,129,0.2)',borderRadius:8,padding:'0.5rem 0.75rem',marginBottom:'0.85rem',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <span style={{fontSize:'0.78rem',color:'var(--muted)'}}>Your Score</span>
                    <span style={{fontSize:'1.1rem',fontWeight:900,color:q.scorePercent>=75?'var(--green2)':q.scorePercent>=50?'var(--amber2)':'var(--red)'}}>{q.scorePercent}%</span>
                  </div>
                )}

                {/* CTA */}
                <button
                  onClick={() => navigate(done ? `/quiz/result/${q.quizId}` : `/quiz/take/${q.quizId}`)}
                  className="btn btn-full btn-sm"
                  style={{background:cfg.bg,color:cfg.color,border:`1px solid ${cfg.color}40`,fontWeight:700}}>
                  {cfg.icon} {cfg.label}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
