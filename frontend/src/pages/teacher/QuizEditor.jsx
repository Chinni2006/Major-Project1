import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, Save, ArrowLeft, CheckCircle } from 'lucide-react';
import {
  createQuiz, getTeacherQuiz, updateQuizMeta,
  addQuestion, updateQuestion, deleteQuestion, togglePublish
} from '../../api/api';
import { useTeacherAuth } from '../../context/TeacherAuthContext';
import Spinner from '../../components/Spinner';

const BRANCHES = ['ALL','AIML','CSE','CSE-AI','CSE-DS','ECE','EEE','Civil','Mechanical'];
const SECTIONS = ['ALL','A','B','C'];
const SKILL_CATS = ['general','python','dsa','ml'];

const EMPTY_Q = { type:'mcq', text:'', options:[{id:'A',text:''},{id:'B',text:''},{id:'C',text:''},{id:'D',text:''}], correctAnswer:'A', marks:1, explanation:'' };

export default function QuizEditor() {
  const { quizId } = useParams();   // 'new' for creating
  const navigate   = useNavigate();
  const { logoutTeacher } = useTeacherAuth();
  const isNew = quizId === 'new';

  const [quiz,    setQuiz]    = useState(null);
  const [meta,    setMeta]    = useState({ title:'', description:'', subject:'', skillCategory:'general', durationMinutes:30, targetBranches:['ALL'], targetSections:['ALL'] });
  const [qForm,   setQForm]   = useState({ ...EMPTY_Q });
  const [editQId, setEditQId] = useState(null);   // null = adding new
  const [loading, setLoading] = useState(!isNew);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    if (!isNew) {
      getTeacherQuiz(quizId)
        .then(({ data }) => { if(data.success){ setQuiz(data.quiz); setMeta({ title:data.quiz.title, description:data.quiz.description, subject:data.quiz.subject, skillCategory:data.quiz.skillCategory, durationMinutes:data.quiz.durationMinutes, targetBranches:data.quiz.targetBranches, targetSections:data.quiz.targetSections }); } })
        .catch(err => { if(err.response?.status===401){logoutTeacher();navigate('/teacher/login');} else toast.error('Failed to load quiz'); })
        .finally(() => setLoading(false));
    }
  }, [quizId]);

  const saveMeta = async () => {
    if (!meta.title.trim()) { toast.error('Quiz title is required'); return; }
    try {
      setSaving(true);
      if (isNew) {
        const { data } = await createQuiz(meta);
        toast.success('Quiz created!');
        navigate(`/teacher/quiz/${data.quiz.quizId}`, { replace:true });
      } else {
        await updateQuizMeta(quizId, meta);
        toast.success('Quiz saved');
        setQuiz(q => ({ ...q, ...meta }));
      }
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const handleBranchToggle = b => setMeta(m => ({ ...m, targetBranches: m.targetBranches.includes(b) ? m.targetBranches.filter(x=>x!==b) : [...m.targetBranches, b] }));
  const handleSectionToggle= s => setMeta(m => ({ ...m, targetSections: m.targetSections.includes(s) ? m.targetSections.filter(x=>x!==s) : [...m.targetSections, s] }));

  const startEdit = q => { setEditQId(q.questionId); setQForm({ type:q.type, text:q.text, options:q.options||[{id:'A',text:''},{id:'B',text:''},{id:'C',text:''},{id:'D',text:''}], correctAnswer:q.correctAnswer, marks:q.marks, explanation:q.explanation||'' }); };
  const cancelEdit = () => { setEditQId(null); setQForm({...EMPTY_Q}); };

  const submitQuestion = async () => {
    if (!qForm.text.trim()) { toast.error('Question text is required'); return; }
    if (qForm.type==='mcq' && !qForm.options.every(o=>o.text.trim())) { toast.error('Fill all option texts'); return; }
    try {
      setSaving(true);
      const payload = { ...qForm, marks: Number(qForm.marks)||1 };
      if (editQId) {
        await updateQuestion(quizId, editQId, payload);
        toast.success('Question updated');
      } else {
        await addQuestion(quizId, payload);
        toast.success('Question added');
      }
      cancelEdit();
      const { data } = await getTeacherQuiz(quizId);
      if(data.success) setQuiz(data.quiz);
    } catch { toast.error('Failed to save question'); }
    finally { setSaving(false); }
  };

  const removeQuestion = async qid => {
    if (!window.confirm('Delete this question?')) return;
    try { await deleteQuestion(quizId, qid); const { data } = await getTeacherQuiz(quizId); if(data.success) setQuiz(data.quiz); toast.success('Deleted'); }
    catch { toast.error('Failed'); }
  };

  const handlePublish = async () => {
    try { const { data } = await togglePublish(quizId); toast.success(data.message); setQuiz(q=>({...q, isPublished:data.isPublished})); }
    catch(err) { toast.error(err.response?.data?.message||'Failed'); }
  };

  if (loading) return <div className="dna-spinner"><div className="dna-helix">{Array.from({length:8}).map((_,i)=><span key={i}/>)}</div><p className="text-muted">Loading…</p></div>;

  const inputStyle = { background:'rgba(255,255,255,0.04)', border:'1px solid var(--border2)', borderRadius:8, color:'var(--text)', padding:'0.6rem 0.9rem', fontSize:'0.9rem', fontFamily:'inherit', outline:'none', width:'100%' };
  const sectionTitle = txt => <p style={{fontSize:'0.72rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--cyan)',marginTop:'1rem',marginBottom:'0.5rem'}}>{txt}</p>;

  return (
    <div className="page">
      <div style={{display:'flex',alignItems:'center',gap:'1rem',marginBottom:'1.5rem',flexWrap:'wrap'}}>
        <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/teacher/dashboard')}><ArrowLeft size={14}/> Back</button>
        <h1 style={{fontSize:'1.5rem',fontWeight:800,letterSpacing:'-0.02em',flex:1}}>{isNew?'Create New Quiz':(quiz?.title||'Edit Quiz')}</h1>
        {!isNew && <span className={`badge ${quiz?.isPublished?'badge--green':'badge--amber'}`}>{quiz?.isPublished?'Published':'Draft'}</span>}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.5rem'}}>
        {/* LEFT: Meta */}
        <div>
          <div className="card" style={{marginBottom:'1.25rem'}}>
            <h3 className="card-title">Quiz Details</h3>
            {sectionTitle('Basic')}
            <div className="form" style={{gap:'0.85rem'}}>
              {[['title','Quiz Title','text'],['subject','Subject / Topic','text'],['description','Description (optional)','text']].map(([k,lbl,tp])=>(
                <div className="field" key={k}>
                  <label>{lbl}</label>
                  <input type={tp} style={inputStyle} value={meta[k]||''} onChange={e=>setMeta(m=>({...m,[k]:e.target.value}))}/>
                </div>
              ))}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
                <div className="field">
                  <label>Duration (minutes)</label>
                  <input type="number" min="1" style={inputStyle} value={meta.durationMinutes} onChange={e=>setMeta(m=>({...m,durationMinutes:e.target.value}))}/>
                </div>
                <div className="field">
                  <label>Skill Category</label>
                  <select style={inputStyle} value={meta.skillCategory} onChange={e=>setMeta(m=>({...m,skillCategory:e.target.value}))}>
                    {SKILL_CATS.map(c=><option key={c} value={c}>{c.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {sectionTitle('Target Audience')}
            <div style={{marginBottom:'0.75rem'}}>
              <label style={{fontSize:'0.82rem',color:'var(--muted)',fontWeight:600,display:'block',marginBottom:'0.4rem'}}>Branches</label>
              <div style={{display:'flex',flexWrap:'wrap',gap:'0.4rem'}}>
                {BRANCHES.map(b=>(
                  <button key={b} type="button" onClick={()=>handleBranchToggle(b)}
                    className={`badge ${meta.targetBranches.includes(b)?'badge--cyan':'badge--blue'}`}
                    style={{cursor:'pointer',border:'none',fontFamily:'inherit',fontSize:'0.72rem'}}>
                    {b}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{fontSize:'0.82rem',color:'var(--muted)',fontWeight:600,display:'block',marginBottom:'0.4rem'}}>Sections</label>
              <div style={{display:'flex',gap:'0.4rem'}}>
                {SECTIONS.map(s=>(
                  <button key={s} type="button" onClick={()=>handleSectionToggle(s)}
                    className={`badge ${meta.targetSections.includes(s)?'badge--cyan':'badge--blue'}`}
                    style={{cursor:'pointer',border:'none',fontFamily:'inherit',fontSize:'0.72rem'}}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div style={{display:'flex',gap:'0.75rem',marginTop:'1.25rem',flexWrap:'wrap'}}>
              <button className="btn btn-sm" style={{background:'linear-gradient(135deg,#22d3ee,#6366f1)',color:'white'}} onClick={saveMeta} disabled={saving}>
                {saving?<Spinner text=""/>:<><Save size={13}/> {isNew?'Create Quiz':'Save Changes'}</>}
              </button>
              {!isNew && (
                <button className="btn btn-sm btn-outline" onClick={handlePublish}>
                  {quiz?.isPublished ? 'Unpublish' : '🚀 Publish Quiz'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Questions */}
        {!isNew && (
          <div>
            <div className="card">
              <h3 className="card-title">Questions ({quiz?.questions?.length||0})</h3>

              {/* Existing questions */}
              <div style={{display:'flex',flexDirection:'column',gap:'0.6rem',marginBottom:'1.25rem'}}>
                {(quiz?.questions||[]).map((q,i)=>(
                  <div key={q.questionId} style={{background:'rgba(255,255,255,0.03)',border:'1px solid var(--border2)',borderRadius:10,padding:'0.75rem 1rem'}}>
                    <div style={{display:'flex',gap:'0.75rem',alignItems:'flex-start'}}>
                      <span style={{background:'rgba(99,102,241,0.15)',color:'var(--indigo2)',borderRadius:6,padding:'0.15rem 0.5rem',fontSize:'0.72rem',fontWeight:700,flexShrink:0}}>Q{i+1}</span>
                      <div style={{flex:1,fontSize:'0.875rem'}}>{q.text}</div>
                      <div style={{display:'flex',gap:'0.4rem',flexShrink:0}}>
                        <span className={`badge badge--${q.type==='mcq'?'blue':q.type==='truefalse'?'green':'amber'}`} style={{fontSize:'0.62rem'}}>{q.type}</span>
                        <span className="badge badge--purple" style={{fontSize:'0.62rem'}}>{q.marks}pt</span>
                        <button className="icon-btn" onClick={()=>startEdit(q)}><Plus size={13}/></button>
                        <button className="icon-btn" onClick={()=>removeQuestion(q.questionId)}><Trash2 size={13} style={{color:'var(--red)'}}/></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add/Edit question form */}
              <div style={{borderTop:'1px solid var(--border2)',paddingTop:'1rem'}}>
                <h4 style={{fontSize:'0.875rem',fontWeight:700,marginBottom:'0.85rem',color:'var(--cyan)'}}>{editQId?'Edit Question':'Add New Question'}</h4>
                <div style={{display:'flex',gap:'0.6rem',marginBottom:'0.75rem',flexWrap:'wrap'}}>
                  {['mcq','truefalse','short'].map(t=>(
                    <button key={t} type="button" onClick={()=>setQForm(f=>({...f,type:t}))}
                      className={`badge ${qForm.type===t?'badge--cyan':'badge--blue'}`}
                      style={{cursor:'pointer',border:'none',fontFamily:'inherit',fontSize:'0.75rem',padding:'0.3rem 0.75rem'}}>
                      {t==='mcq'?'Multiple Choice':t==='truefalse'?'True / False':'Short Answer'}
                    </button>
                  ))}
                </div>

                <div className="field" style={{marginBottom:'0.75rem'}}>
                  <label style={{fontSize:'0.82rem',fontWeight:600}}>Question Text</label>
                  <textarea rows={3} style={{...inputStyle,resize:'vertical'}} value={qForm.text} onChange={e=>setQForm(f=>({...f,text:e.target.value}))}/>
                </div>

                {qForm.type==='mcq' && (
                  <div style={{marginBottom:'0.75rem'}}>
                    <label style={{fontSize:'0.82rem',fontWeight:600,display:'block',marginBottom:'0.4rem'}}>Options</label>
                    {qForm.options.map((opt,oi)=>(
                      <div key={opt.id} style={{display:'flex',gap:'0.5rem',marginBottom:'0.4rem',alignItems:'center'}}>
                        <span style={{background:qForm.correctAnswer===opt.id?'rgba(16,185,129,0.2)':'rgba(99,102,241,0.1)',color:qForm.correctAnswer===opt.id?'var(--green2)':'var(--indigo2)',borderRadius:6,padding:'0.2rem 0.55rem',fontSize:'0.75rem',fontWeight:700,cursor:'pointer',flexShrink:0,border:`1px solid ${qForm.correctAnswer===opt.id?'rgba(16,185,129,0.3)':'transparent'}`}}
                          onClick={()=>setQForm(f=>({...f,correctAnswer:opt.id}))}>
                          {opt.id} {qForm.correctAnswer===opt.id?'✓':''}
                        </span>
                        <input style={{...inputStyle,flex:1}} placeholder={`Option ${opt.id}`} value={opt.text}
                          onChange={e=>setQForm(f=>({...f,options:f.options.map((o,i)=>i===oi?{...o,text:e.target.value}:o)}))}/>
                      </div>
                    ))}
                    <p style={{fontSize:'0.72rem',color:'var(--muted)',marginTop:'0.3rem'}}>Click option letter to mark as correct answer</p>
                  </div>
                )}

                {qForm.type==='truefalse' && (
                  <div style={{marginBottom:'0.75rem'}}>
                    <label style={{fontSize:'0.82rem',fontWeight:600,display:'block',marginBottom:'0.4rem'}}>Correct Answer</label>
                    <div style={{display:'flex',gap:'0.5rem'}}>
                      {['True','False'].map(v=>(
                        <button key={v} type="button" onClick={()=>setQForm(f=>({...f,correctAnswer:v}))}
                          className={`badge ${qForm.correctAnswer===v?'badge--green':'badge--blue'}`}
                          style={{cursor:'pointer',border:'none',fontFamily:'inherit',fontSize:'0.78rem',padding:'0.35rem 1rem'}}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {qForm.type==='short' && (
                  <div className="field" style={{marginBottom:'0.75rem'}}>
                    <label style={{fontSize:'0.82rem',fontWeight:600}}>Expected keyword / answer</label>
                    <input style={inputStyle} value={qForm.correctAnswer} onChange={e=>setQForm(f=>({...f,correctAnswer:e.target.value}))}/>
                    <span style={{fontSize:'0.72rem',color:'var(--muted)'}}>Student answer must contain this keyword</span>
                  </div>
                )}

                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.6rem',marginBottom:'0.75rem'}}>
                  <div className="field">
                    <label style={{fontSize:'0.82rem',fontWeight:600}}>Marks</label>
                    <input type="number" min="1" style={inputStyle} value={qForm.marks} onChange={e=>setQForm(f=>({...f,marks:e.target.value}))}/>
                  </div>
                  <div className="field">
                    <label style={{fontSize:'0.82rem',fontWeight:600}}>Explanation (optional)</label>
                    <input style={inputStyle} value={qForm.explanation} onChange={e=>setQForm(f=>({...f,explanation:e.target.value}))}/>
                  </div>
                </div>

                <div style={{display:'flex',gap:'0.6rem'}}>
                  <button className="btn btn-sm" style={{background:'linear-gradient(135deg,#22d3ee,#6366f1)',color:'white'}} onClick={submitQuestion} disabled={saving}>
                    {saving?<Spinner text=""/>:<><CheckCircle size={13}/> {editQId?'Update':'Add Question'}</>}
                  </button>
                  {editQId && <button className="btn btn-outline btn-sm" onClick={cancelEdit}>Cancel</button>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
