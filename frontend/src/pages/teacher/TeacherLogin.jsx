import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { GraduationCap, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { loginTeacher as loginTeacherApi } from '../../api/api';
import { useTeacherAuth } from '../../context/TeacherAuthContext';
import Spinner from '../../components/Spinner';

export default function TeacherLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginTeacher } = useTeacherAuth();
  const from = location.state?.from || '/teacher/dashboard';

  const [form,    setForm]    = useState({ email:'', password:'' });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);

  const onChange = e => { setForm(f=>({...f,[e.target.name]:e.target.value})); setErrors(er=>({...er,[e.target.name]:''})); };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = {};
    if (!form.email.trim())  errs.email    = 'Email is required';
    if (!form.password)      errs.password = 'Password is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    try {
      setLoading(true);
      const { data } = await loginTeacherApi({ email:form.email.trim().toLowerCase(), password:form.password });
      if (data.success) {
        loginTeacher(data.teacher, data.token);
        toast.success(`Welcome back, ${data.teacher.name}!`);
        navigate(from, { replace:true });
      }
    } catch(err) {
      const msg = err.response?.data?.message || 'Login failed';
      if (err.response?.status === 401) {
        if (msg.toLowerCase().includes('password')) setErrors({ password:'Incorrect password' });
        else setErrors({ email:'No account found with this email' });
      } else toast.error(msg);
    } finally { setLoading(false); }
  };

  return (
    <div className="page page--centered" style={{paddingTop:'3rem'}}>
      <div className="form-card">
        <div className="form-card-header">
          <div className="form-card-icon" style={{background:'linear-gradient(135deg,rgba(34,211,238,0.15),rgba(99,102,241,0.1))',borderColor:'rgba(34,211,238,0.3)',color:'var(--cyan)'}}><GraduationCap size={24}/></div>
          <h1>Teacher Login</h1>
          <p className="text-muted">Log in to manage your quizzes and students</p>
        </div>
        <form onSubmit={handleSubmit} className="form" noValidate>
          <div className="field">
            <label htmlFor="email">Email Address</label>
            <input id="email" name="email" type="email" autoComplete="email"
              value={form.email} onChange={onChange} disabled={loading}
              className={errors.email?'input--error':''}/>
            {errors.email&&<span className="field-error">{errors.email}</span>}
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <div style={{position:'relative'}}>
              <input id="password" name="password" type={showPw?'text':'password'} autoComplete="current-password"
                value={form.password} onChange={onChange} disabled={loading}
                className={errors.password?'input--error':''} style={{paddingRight:'2.8rem'}}/>
              <button type="button" onClick={()=>setShowPw(v=>!v)} style={{position:'absolute',right:'0.75rem',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'var(--muted)',cursor:'pointer',display:'flex'}}>
                {showPw?<EyeOff size={16}/>:<Eye size={16}/>}
              </button>
            </div>
            {errors.password&&<span className="field-error">{errors.password}</span>}
          </div>
          <button type="submit" className="btn btn-full" style={{background:'linear-gradient(135deg,#22d3ee,#6366f1)',color:'white',boxShadow:'0 4px 20px rgba(34,211,238,0.3)'}} disabled={loading}>
            {loading?<Spinner text=""/>:<>Log In <ArrowRight size={16}/></>}
          </button>
        </form>
        <p style={{textAlign:'center',marginTop:'1.25rem',fontSize:'0.875rem',color:'var(--muted)'}}>
          No account?{' '}<Link to="/teacher/register" style={{color:'var(--cyan)',fontWeight:600}}>Register as teacher</Link>
        </p>
        <p style={{textAlign:'center',marginTop:'0.5rem',fontSize:'0.875rem',color:'var(--muted)'}}>
          Are you a student?{' '}<Link to="/login" style={{color:'var(--indigo2)',fontWeight:600}}>Student login →</Link>
        </p>
      </div>
    </div>
  );
}
