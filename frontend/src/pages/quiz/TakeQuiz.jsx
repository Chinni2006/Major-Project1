import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Clock, AlertTriangle, ChevronLeft, ChevronRight, Send, Maximize } from 'lucide-react';
import {
  getAvailableQuizzes, startAttempt, saveAnswer,
  submitAttempt as submitAttemptApi
} from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import ProctoringSystem from '../../components/proctor/ProctoringSystem';

export default function TakeQuiz() {
  const { quizId }   = useParams();
  const navigate     = useNavigate();
  const { student }  = useAuth();

  const [quiz,       setQuiz]       = useState(null);
  const [attempt,    setAttempt]    = useState(null);
  const [questions,  setQuestions]  = useState([]);
  const [answers,    setAnswers]    = useState({});
  const [current,    setCurrent]    = useState(0);
  const [timeLeft,   setTimeLeft]   = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [violations, setViolations] = useState([]);
  const [showAlert,  setShowAlert]  = useState(null);
  const [started,    setStarted]    = useState(false); // fullscreen gate
  const timerRef    = useRef(null);
  const autoSaveRef = useRef(null);

  // ── Load & start attempt ──────────────────────────────────────────────────
  useEffect(() => {
    if (!student) { navigate('/login'); return; }

    // Get quiz metadata first
    getAvailableQuizzes()
      .then(({ data }) => {
        const q = data.quizzes?.find(x => x.quizId === quizId);
        if (!q) { toast.error('Quiz not found'); navigate('/quizzes'); return; }
        setQuiz(q);
      })
      .catch(() => { toast.error('Could not load quiz'); navigate('/quizzes'); });
  }, [quizId]);

  const beginAttempt = async () => {
    try {
      setLoading(true);
      const { data } = await startAttempt(quizId);
      if (!data.success) { toast.error(data.message); return; }

      // If already submitted redirect to result
      if (data.attempt?.status === 'submitted') { navigate(`/quiz/result/${quizId}`); return; }

      setAttempt(data.attempt);
      setQuestions(data.questions || []);
      setAnswers(data.attempt.answers || {});
      setTimeLeft((quiz?.durationMinutes || 30) * 60);
      setStarted(true);

      // Enter fullscreen
      document.documentElement.requestFullscreen?.().catch(() => {});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start quiz');
    } finally { setLoading(false); }
  };

  // ── Countdown timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!started || !attempt) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleSubmit(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [started, attempt]);

  // ── Auto-save answer every 10s ────────────────────────────────────────────
  useEffect(() => {
    if (!started || !attempt) return;
    autoSaveRef.current = setInterval(() => {
      Object.entries(answers).forEach(([qid, ans]) => {
        saveAnswer(attempt.attemptId, { questionId:qid, answer:ans }).catch(()=>{});
      });
    }, 10000);
    return () => clearInterval(autoSaveRef.current);
  }, [started, attempt, answers]);

  // ── Proctoring violation callback ─────────────────────────────────────────
  const onViolation = useCallback((type, detail) => {
    const msg = {
      tab_switch:       '⚠️ Tab switch detected!',
      face_not_detected:'⚠️ Face not visible — keep looking at the screen',
      look_away:        '⚠️ Please look at the screen',
      sound_detected:   '⚠️ Sound/voice detected!',
      fullscreen_exit:  '⚠️ Please stay in fullscreen',
      copy_paste:       '⚠️ Copy/paste is not allowed',
    }[type] || '⚠️ Violation detected';

    setViolations(v => [...v, { type, detail, time: new Date().toLocaleTimeString() }]);
    setShowAlert(msg);
    setTimeout(() => setShowAlert(null), 4000);
  }, []);

  const handleAnswer = (questionId, value) => {
    setAnswers(a => ({ ...a, [questionId]: value }));
    saveAnswer(attempt.attemptId, { questionId, answer:value }).catch(()=>{});
  };

  const handleSubmit = async (auto = false) => {
    if (submitting) return;
    if (!auto && !window.confirm('Submit quiz? You cannot change answers after submission.')) return;
    try {
      setSubmitting(true);
      clearInterval(timerRef.current);
      clearInterval(autoSaveRef.current);
      const { data } = await submitAttemptApi(attempt.attemptId, { answers });
      if (data.success) {
        toast.success(`Quiz submitted! Score: ${data.result.scorePercent}%`);
        document.exitFullscreen?.().catch(()=>{});
        navigate(`/quiz/result/${quizId}`, { state:{ result: data.result } });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submit failed');
    } finally { setSubmitting(false); }
  };

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const answered = Object.keys(answers).filter(k => answers[k] !== '' && answers[k] !== undefined).length;
  const q = questions[current];
  const urgent = timeLeft < 120;

  // ── Pre-quiz gate ─────────────────────────────────────────────────────────
  if (!started) return (
    <div className="page page--centered" style={{paddingTop:'3rem'}}>
      <div className="card" style={{maxWidth:520,textAlign:'center',borderColor:'rgba(99,102,241,0.3)',boxShadow:'0 0 60px rgba(99,102,241,0.15)'}}>
        <div style={{fontSize:'3rem',marginBottom:'1rem'}}>📝</div>
        <h2 style={{fontSize:'1.4rem',fontWeight:800,marginBottom:'0.5rem'}}>{quiz?.title}</h2>
        <p className="text-muted" style={{marginBottom:'1.5rem'}}>{quiz?.description}</p>
        <div style={{display:'flex',gap:'0.75rem',justifyContent:'center',flexWrap:'wrap',marginBottom:'1.5rem'}}>
          <span className="badge badge--blue"><Clock size={11}/> {quiz?.durationMinutes} min</span>
          <span className="badge badge--purple">{quiz?.questionCount} questions</span>
          <span className="badge badge--amber">{quiz?.totalMarks} marks</span>
        </div>

        <div style={{background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:10,padding:'1rem',marginBottom:'1.5rem',textAlign:'left'}}>
          <p style={{fontWeight:700,fontSize:'0.875rem',color:'var(--red)',marginBottom:'0.5rem'}}>⚠️ Proctoring Requirements</p>
          <ul style={{fontSize:'0.82rem',color:'var(--muted)',lineHeight:1.8,paddingLeft:'1.1rem'}}>
            <li>Camera and microphone will be active throughout the quiz</li>
            <li>Eye movements and face visibility will be monitored</li>
            <li>Tab switching is not allowed — violations are logged</li>
            <li>Quiz will run in fullscreen mode</li>
            <li>Copy/paste is disabled during the quiz</li>
            <li>Sound/voice detection is active</li>
          </ul>
        </div>

        <button className="btn btn-glow btn-full" onClick={()=>{ setLoading(true); beginAttempt(); }} disabled={loading || !quiz}>
          {loading ? 'Starting…' : <><Maximize size={15}/> Enter Fullscreen & Start Quiz</>}
        </button>
      </div>
    </div>
  );

  if (loading || !q) return <div className="dna-spinner"><div className="dna-helix">{Array.from({length:8}).map((_,i)=><span key={i}/>)}</div><p className="text-muted">Loading quiz…</p></div>;

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',padding:'0 0 5rem'}}>

      {/* Proctoring */}
      <ProctoringSystem attemptId={attempt?.attemptId} onViolation={onViolation} active={started}/>

      {/* Violation alert banner */}
      {showAlert && (
        <div style={{position:'fixed',top:0,left:0,right:0,zIndex:9998,background:'rgba(239,68,68,0.95)',color:'white',padding:'0.75rem 1.5rem',textAlign:'center',fontWeight:700,fontSize:'0.9rem',animation:'fadeSlideIn 0.3s ease'}}>
          {showAlert}
        </div>
      )}

      {/* Top bar */}
      <div style={{position:'sticky',top:0,zIndex:100,background:'rgba(5,11,24,0.95)',backdropFilter:'blur(16px)',borderBottom:'1px solid var(--border)',padding:'0.75rem 1.5rem',display:'flex',alignItems:'center',gap:'1rem',flexWrap:'wrap'}}>
        <div style={{flex:1,fontWeight:700,fontSize:'0.95rem'}}>{quiz?.title}</div>

        {/* Progress */}
        <div style={{fontSize:'0.82rem',color:'var(--muted)'}}>
          {answered}/{questions.length} answered
        </div>

        {/* Timer */}
        <div style={{display:'flex',alignItems:'center',gap:'0.5rem',background:urgent?'rgba(239,68,68,0.15)':'rgba(99,102,241,0.1)',border:`1px solid ${urgent?'rgba(239,68,68,0.3)':'rgba(99,102,241,0.2)'}`,borderRadius:8,padding:'0.4rem 0.85rem'}}>
          <Clock size={14} style={{color:urgent?'var(--red)':'var(--indigo2)'}}/>
          <span style={{fontFamily:'monospace',fontWeight:800,color:urgent?'var(--red)':'var(--indigo2)',fontSize:'1rem'}}>{fmt(timeLeft)}</span>
        </div>

        {/* Violations badge */}
        {violations.length > 0 && (
          <div style={{display:'flex',alignItems:'center',gap:'0.35rem',background:'rgba(239,68,68,0.12)',border:'1px solid rgba(239,68,68,0.25)',borderRadius:8,padding:'0.4rem 0.75rem',fontSize:'0.78rem',color:'var(--red)',fontWeight:700}}>
            <AlertTriangle size={13}/> {violations.length} violation{violations.length!==1?'s':''}
          </div>
        )}

        <button className="btn btn-sm" style={{background:'linear-gradient(135deg,#6366f1,#22d3ee)',color:'white'}} onClick={()=>handleSubmit(false)} disabled={submitting}>
          <Send size={13}/> {submitting?'Submitting…':'Submit Quiz'}
        </button>
      </div>

      <div style={{maxWidth:860,margin:'0 auto',padding:'2rem 1.5rem',display:'grid',gridTemplateColumns:'1fr 220px',gap:'1.5rem'}}>

        {/* Question card */}
        <div>
          <div className="card card--glow">
            {/* Question header */}
            <div style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'1.25rem'}}>
              <span style={{background:'linear-gradient(135deg,#6366f1,#22d3ee)',color:'white',borderRadius:8,padding:'0.3rem 0.75rem',fontSize:'0.78rem',fontWeight:800}}>
                Q{current+1} / {questions.length}
              </span>
              <span className={`badge badge--${q.type==='mcq'?'blue':q.type==='truefalse'?'green':'amber'}`} style={{fontSize:'0.68rem'}}>
                {q.type==='mcq'?'Multiple Choice':q.type==='truefalse'?'True / False':'Short Answer'}
              </span>
              <span className="badge badge--purple" style={{fontSize:'0.68rem',marginLeft:'auto'}}>{q.marks} mark{q.marks!==1?'s':''}</span>
            </div>

            <p style={{fontSize:'1.05rem',fontWeight:600,lineHeight:1.6,marginBottom:'1.5rem'}}>{q.text}</p>

            {/* MCQ options */}
            {q.type === 'mcq' && (
              <div style={{display:'flex',flexDirection:'column',gap:'0.6rem'}}>
                {q.options.map(opt => {
                  const selected = answers[q.questionId] === opt.id;
                  return (
                    <button key={opt.id} onClick={()=>handleAnswer(q.questionId, opt.id)}
                      style={{display:'flex',alignItems:'center',gap:'1rem',padding:'0.85rem 1.1rem',borderRadius:10,border:`1px solid ${selected?'var(--indigo)':'var(--border2)'}`,background:selected?'rgba(99,102,241,0.12)':'rgba(255,255,255,0.02)',cursor:'pointer',textAlign:'left',transition:'all 0.2s',fontFamily:'inherit',color:'var(--text)',fontSize:'0.9rem'}}>
                      <span style={{width:30,height:30,borderRadius:'50%',background:selected?'linear-gradient(135deg,#6366f1,#22d3ee)':'rgba(255,255,255,0.06)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:'0.8rem',flexShrink:0,color:selected?'white':'var(--muted)'}}>
                        {opt.id}
                      </span>
                      {opt.text}
                    </button>
                  );
                })}
              </div>
            )}

            {/* True/False */}
            {q.type === 'truefalse' && (
              <div style={{display:'flex',gap:'1rem'}}>
                {['True','False'].map(v => {
                  const sel = answers[q.questionId] === v;
                  return (
                    <button key={v} onClick={()=>handleAnswer(q.questionId,v)}
                      style={{flex:1,padding:'1rem',borderRadius:12,border:`1px solid ${sel?'var(--indigo)':'var(--border2)'}`,background:sel?'rgba(99,102,241,0.12)':'rgba(255,255,255,0.02)',cursor:'pointer',fontFamily:'inherit',fontWeight:700,fontSize:'1rem',color:sel?'var(--indigo2)':'var(--muted)',transition:'all 0.2s'}}>
                      {v==='True'?'✅':'❌'} {v}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Short answer */}
            {q.type === 'short' && (
              <textarea rows={4} placeholder="Type your answer here…"
                value={answers[q.questionId]||''}
                onChange={e=>handleAnswer(q.questionId, e.target.value)}
                style={{width:'100%',background:'rgba(255,255,255,0.04)',border:'1px solid var(--border2)',borderRadius:10,color:'var(--text)',padding:'0.85rem 1rem',fontSize:'0.9rem',fontFamily:'inherit',outline:'none',resize:'vertical',lineHeight:1.6}}/>
            )}
          </div>

          {/* Navigation */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:'1rem'}}>
            <button className="btn btn-outline btn-sm" onClick={()=>setCurrent(c=>Math.max(0,c-1))} disabled={current===0}>
              <ChevronLeft size={15}/> Previous
            </button>
            <span style={{fontSize:'0.82rem',color:'var(--muted)'}}>{current+1} of {questions.length}</span>
            <button className="btn btn-outline btn-sm" onClick={()=>setCurrent(c=>Math.min(questions.length-1,c+1))} disabled={current===questions.length-1}>
              Next <ChevronRight size={15}/>
            </button>
          </div>
        </div>

        {/* Right panel: question grid + violation log */}
        <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
          {/* Question palette */}
          <div className="card">
            <p style={{fontSize:'0.75rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--muted)',marginBottom:'0.75rem'}}>Questions</p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'0.35rem'}}>
              {questions.map((qq,i)=>{
                const ans = answers[qq.questionId];
                const done = ans !== undefined && ans !== '';
                const isCur = i === current;
                return (
                  <button key={qq.questionId} onClick={()=>setCurrent(i)}
                    style={{width:32,height:32,borderRadius:6,border:`1px solid ${isCur?'var(--indigo)':done?'rgba(16,185,129,0.4)':'var(--border2)'}`,background:isCur?'rgba(99,102,241,0.2)':done?'rgba(16,185,129,0.1)':'transparent',color:isCur?'var(--indigo2)':done?'var(--green2)':'var(--muted)',fontWeight:700,fontSize:'0.72rem',cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s'}}>
                    {i+1}
                  </button>
                );
              })}
            </div>
            <div style={{display:'flex',gap:'0.5rem',marginTop:'0.75rem',flexWrap:'wrap'}}>
              <span style={{fontSize:'0.65rem',color:'var(--green2)'}}>■ Answered ({answered})</span>
              <span style={{fontSize:'0.65rem',color:'var(--muted)'}}>□ Unanswered ({questions.length-answered})</span>
            </div>
          </div>

          {/* Violations */}
          {violations.length > 0 && (
            <div className="card" style={{borderColor:'rgba(239,68,68,0.2)'}}>
              <p style={{fontSize:'0.72rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'var(--red)',marginBottom:'0.5rem'}}>
                Violations ({violations.length})
              </p>
              <div style={{display:'flex',flexDirection:'column',gap:'0.35rem',maxHeight:180,overflowY:'auto'}}>
                {violations.map((v,i)=>(
                  <div key={i} style={{fontSize:'0.7rem',color:'var(--muted)',borderLeft:'2px solid var(--red)',paddingLeft:'0.5rem'}}>
                    <span style={{color:'var(--red)',fontWeight:600}}>{v.type.replace(/_/g,' ')}</span>
                    <span style={{display:'block',opacity:0.6}}>{v.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
