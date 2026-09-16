import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Trophy, Users, BarChart2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { getQuizResults } from '../../api/api';
import { useTeacherAuth } from '../../context/TeacherAuthContext';

export default function QuizResults() {
  const { quizId }  = useParams();
  const navigate    = useNavigate();
  const { logoutTeacher } = useTeacherAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [sort,    setSort]    = useState('score');

  useEffect(() => {
    getQuizResults(quizId)
      .then(({ data: d }) => { if(d.success) setData(d); })
      .catch(err => { if(err.response?.status===401){logoutTeacher();navigate('/teacher/login');} else toast.error('Failed to load results'); })
      .finally(() => setLoading(false));
  }, [quizId]);

  if (loading) return <div className="dna-spinner"><div className="dna-helix">{Array.from({length:8}).map((_,i)=><span key={i}/>)}</div><p className="text-muted">Loading results…</p></div>;

  const results = [...(data?.results||[])].sort((a,b) => sort==='score'?(b.scorePercent-a.scorePercent):(a.studentName.localeCompare(b.studentName)));
  const avg = results.length ? Math.round(results.reduce((s,r)=>s+r.scorePercent,0)/results.length) : 0;
  const passed = results.filter(r=>r.scorePercent>=50).length;

  return (
    <div className="page">
      <div style={{display:'flex',alignItems:'center',gap:'1rem',marginBottom:'1.5rem',flexWrap:'wrap'}}>
        <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/teacher/dashboard')}><ArrowLeft size={14}/> Back</button>
        <h1 style={{fontSize:'1.5rem',fontWeight:800,flex:1}}>{data?.quiz?.title} — Results</h1>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{marginBottom:'1.75rem'}}>
        {[
          {icon:<Users size={19} style={{color:'#6366f1'}}/>,  value:results.length,  label:'Submissions'},
          {icon:<BarChart2 size={19} style={{color:'#22d3ee'}}/>,value:`${avg}%`,      label:'Average Score'},
          {icon:<CheckCircle size={19} style={{color:'#10b981'}}/>,value:passed,       label:'Passed (≥50%)'},
          {icon:<XCircle size={19} style={{color:'#ef4444'}}/>,value:results.length-passed, label:'Failed'},
        ].map((s,i)=>(
          <div className="stat-card" key={i}>{s.icon}<div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
        ))}
      </div>

      <div className="card">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1rem',flexWrap:'wrap',gap:'0.5rem'}}>
          <h3 className="card-title" style={{margin:0}}>Student Results</h3>
          <div style={{display:'flex',gap:'0.5rem'}}>
            <button className={`btn btn-sm ${sort==='score'?'btn-primary':'btn-outline'}`} onClick={()=>setSort('score')}>Sort by Score</button>
            <button className={`btn btn-sm ${sort==='name'?'btn-primary':'btn-outline'}`}  onClick={()=>setSort('name')}>Sort by Name</button>
          </div>
        </div>

        {results.length===0 ? (
          <div className="empty-state"><Users size={36} className="text-muted"/><p>No submissions yet.</p></div>
        ) : (
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.875rem'}}>
              <thead>
                <tr style={{borderBottom:'1px solid var(--border2)',color:'var(--muted)',fontSize:'0.75rem',textTransform:'uppercase',letterSpacing:'0.05em'}}>
                  {['#','Name','USN','Branch','Sec','Score','%','Violations','Submitted At'].map(h=>(
                    <th key={h} style={{padding:'0.6rem 0.75rem',textAlign:'left',fontWeight:700}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((r,i)=>(
                  <tr key={r.attemptId} style={{borderBottom:'1px solid rgba(255,255,255,0.04)',transition:'background 0.15s'}}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(99,102,241,0.04)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{padding:'0.65rem 0.75rem',color:'var(--muted)'}}>{i+1}</td>
                    <td style={{padding:'0.65rem 0.75rem',fontWeight:600}}>{r.studentName}</td>
                    <td style={{padding:'0.65rem 0.75rem',fontFamily:'monospace',fontSize:'0.78rem',color:'var(--muted)'}}>{r.usn||'—'}</td>
                    <td style={{padding:'0.65rem 0.75rem'}}><span className="badge badge--blue" style={{fontSize:'0.62rem'}}>{r.branch||'—'}</span></td>
                    <td style={{padding:'0.65rem 0.75rem'}}>{r.section||'—'}</td>
                    <td style={{padding:'0.65rem 0.75rem'}}>{r.score}/{r.totalMarks}</td>
                    <td style={{padding:'0.65rem 0.75rem'}}>
                      <span style={{fontWeight:800,color:r.scorePercent>=75?'var(--green2)':r.scorePercent>=50?'var(--amber2)':'var(--red)'}}>{r.scorePercent}%</span>
                    </td>
                    <td style={{padding:'0.65rem 0.75rem'}}>
                      {(r.violations||[]).length>0 ? (
                        <span style={{color:'var(--red)',display:'flex',alignItems:'center',gap:'0.3rem',fontSize:'0.78rem'}}>
                          <AlertTriangle size={12}/>{r.violations.length}
                        </span>
                      ) : <span className="text-muted">—</span>}
                    </td>
                    <td style={{padding:'0.65rem 0.75rem',color:'var(--muted)',fontSize:'0.78rem'}}>{r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
