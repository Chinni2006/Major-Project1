import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  GraduationCap, Plus, BookOpen, Users, BarChart2,
  Eye, Trash2, ToggleLeft, ToggleRight, RefreshCw,
  CheckCircle, XCircle, Clock, Edit3
} from 'lucide-react';
import {
  getTeacherDashboard, getTeacherQuizzes,
  deleteQuiz, togglePublish
} from '../../api/api';
import { useTeacherAuth } from '../../context/TeacherAuthContext';
import Spinner from '../../components/Spinner';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { teacher, logoutTeacher } = useTeacherAuth();
  const [stats,   setStats]   = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const [dashRes, quizRes] = await Promise.all([
        getTeacherDashboard(), getTeacherQuizzes()
      ]);
      if (dashRes.data.success)  setStats(dashRes.data.stats);
      if (quizRes.data.success)  setQuizzes(quizRes.data.quizzes);
    } catch (err) {
      if (err.response?.status === 401) { logoutTeacher(); navigate('/teacher/login'); }
      else toast.error('Failed to load dashboard');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (quizId, title) => {
    if (!window.confirm(`Delete quiz "${title}"? This cannot be undone.`)) return;
    try {
      await deleteQuiz(quizId);
      toast.success('Quiz deleted');
      load();
    } catch { toast.error('Delete failed'); }
  };

  const handleToggle = async (quizId) => {
    try {
      const { data } = await togglePublish(quizId);
      toast.success(data.message);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  if (loading) return (
    <div className="dna-spinner">
      <div className="dna-helix">{Array.from({length:8}).map((_,i)=><span key={i}/>)}</div>
      <p className="text-muted">Loading teacher dashboard…</p>
    </div>
  );

  return (
    <div className="page">
      {/* Header */}
      <div style={{background:'linear-gradient(135deg,rgba(34,211,238,0.07),rgba(99,102,241,0.05))',border:'1px solid rgba(34,211,238,0.15)',borderRadius:20,padding:'1.75rem',marginBottom:'2rem'}}>
        <div style={{display:'flex',alignItems:'center',gap:'1rem',flexWrap:'wrap'}}>
          <div style={{width:52,height:52,borderRadius:14,background:'linear-gradient(135deg,#22d3ee,#6366f1)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 0 24px rgba(34,211,238,0.4)'}}>
            <GraduationCap size={26} color="white"/>
          </div>
          <div style={{flex:1}}>
            <h1 style={{fontSize:'1.6rem',fontWeight:800,letterSpacing:'-0.02em'}}>Teacher Dashboard</h1>
            <p className="text-muted" style={{fontSize:'0.875rem'}}>{teacher?.name} · {teacher?.department || 'SkillGenome Academy'}</p>
            <code className="student-id-badge" style={{color:'var(--cyan)'}}>{teacher?.teacherId}</code>
          </div>
          <div style={{display:'flex',gap:'0.75rem',flexWrap:'wrap'}}>
            <Link to="/teacher/quiz/new" className="btn btn-sm" style={{background:'linear-gradient(135deg,#22d3ee,#6366f1)',color:'white',boxShadow:'0 4px 16px rgba(34,211,238,0.3)'}}>
              <Plus size={14}/> New Quiz
            </Link>
            <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={14}/></button>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="stats-grid" style={{marginBottom:'2rem'}}>
          {[
            {icon:<BookOpen size={20} style={{color:'#22d3ee'}}/>,  value:stats.totalQuizzes,     label:'Total Quizzes'},
            {icon:<ToggleRight size={20} style={{color:'#10b981'}}/>,value:stats.publishedQuizzes, label:'Published'},
            {icon:<Users size={20} style={{color:'#6366f1'}}/>,      value:stats.totalStudents,    label:'Students'},
            {icon:<BarChart2 size={20} style={{color:'#f59e0b'}}/>,  value:stats.totalAttempts,    label:'Submissions'},
          ].map((s,i)=>(
            <div className="stat-card" key={i}>
              {s.icon}
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Quiz list */}
      <div className="card">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.25rem',flexWrap:'wrap',gap:'0.75rem'}}>
          <h3 className="card-title" style={{margin:0}}>Your Quizzes</h3>
          <Link to="/teacher/quiz/new" className="btn btn-sm btn-outline"><Plus size={13}/> Create Quiz</Link>
        </div>

        {quizzes.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={36} className="text-muted"/>
            <p>No quizzes yet.</p>
            <Link to="/teacher/quiz/new" className="btn btn-sm" style={{background:'linear-gradient(135deg,#22d3ee,#6366f1)',color:'white',marginTop:'0.5rem'}}>
              <Plus size={13}/> Create your first quiz
            </Link>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
            {quizzes.map(q => (
              <div key={q.quizId} style={{background:'rgba(255,255,255,0.03)',border:'1px solid var(--border2)',borderRadius:12,padding:'1rem 1.25rem',display:'flex',alignItems:'center',gap:'1rem',flexWrap:'wrap',transition:'border-color 0.2s'}}
                onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(34,211,238,0.3)'}
                onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border2)'}>
                {/* Status dot */}
                <div style={{width:10,height:10,borderRadius:'50%',background:q.isPublished?'var(--green2)':'var(--muted)',boxShadow:q.isPublished?'0 0 8px var(--green2)':'none',flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:'0.95rem'}}>{q.title}</div>
                  <div style={{fontSize:'0.78rem',color:'var(--muted)',marginTop:'0.2rem',display:'flex',gap:'0.85rem',flexWrap:'wrap'}}>
                    <span><BookOpen size={11} style={{verticalAlign:'middle'}}/> {q.questions?.length||0} questions</span>
                    <span><Clock size={11} style={{verticalAlign:'middle'}}/> {q.durationMinutes} min</span>
                    <span style={{color:q.isPublished?'var(--green2)':'var(--muted)'}}>{q.isPublished?'Published':'Draft'}</span>
                    <span>Targets: {(q.targetBranches||['ALL']).join(', ')} · {(q.targetSections||['ALL']).join(', ')}</span>
                  </div>
                </div>
                <div style={{display:'flex',gap:'0.5rem',flexShrink:0}}>
                  <Link to={`/teacher/quiz/${q.quizId}`} className="btn btn-ghost btn-sm" title="Edit quiz"><Edit3 size={14}/></Link>
                  <Link to={`/teacher/quiz/${q.quizId}/results`} className="btn btn-ghost btn-sm" title="View results"><Eye size={14}/></Link>
                  <button className="btn btn-ghost btn-sm" onClick={()=>handleToggle(q.quizId)} title={q.isPublished?'Unpublish':'Publish'}>
                    {q.isPublished ? <ToggleRight size={16} style={{color:'var(--green2)'}}/> : <ToggleLeft size={16}/>}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={()=>handleDelete(q.quizId,q.title)} title="Delete"><Trash2 size={14} style={{color:'var(--red)'}}/></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
