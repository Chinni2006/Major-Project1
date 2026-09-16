import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { GraduationCap, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { registerTeacher } from '../../api/api';
import { useTeacherAuth } from '../../context/TeacherAuthContext';
import Spinner from '../../components/Spinner';

export default function TeacherRegister() {
  const navigate = useNavigate();
  const { loginTeacher } = useTeacherAuth();
  const [form, setForm] = useState({ name:'', email:'', department:'', employeeId:'', password:'', confirm:'' });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);
  const [showCf,  setShowCf]  = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim())       e.name       = 'Name is required';
    if (!form.email.trim())      e.email      = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.department.trim()) e.department = 'Department is required';
    if (!form.password)          e.password   = 'Password is required';
    else if (form.password.length < 6) e.password = 'Minimum 6 characters';
    if (form.confirm !== form.password) e.confirm = 'Passwords do not match';
    return e;
  };

  const onChange = e => { setForm(f=>({...f,[e.target.name]:e.target.value})); setErrors(er=>({...er,[e.target.name]:''})); };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    try {
      setLoading(true);
      const { data } = await registerTeacher({ name:form.name.trim(), email:form.email.trim().toLowerCase(), department:form.department.trim(), employeeId:form.employeeId.trim(), password:form.password });
      if (data.success) {
        loginTeacher(data.teacher, data.token);
        toast.success(`Welcome, ${data.teacher.name}!`);
        navigate('/teacher/dashboard');
      }
    } catch(err) {
      const msg = err.response?.data?.message || 'Registration failed';
      if (err.response?.status === 409) { toast.error('Email already registered.'); navigate('/teacher/login'); }
      else toast.error(msg);
    } finally { setLoading(false); }
  };

  const eyeBtn = (show, toggle) => (
    <button type="button" onClick={()=>toggle(v=>!v)} style={{position:'absolute',right:'0.75rem',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'var(--muted)',cursor:'pointer',display:'flex'}}>
      {show ? <EyeOff size={16}/> : <Eye size={16}/>}
    </button>
  );

  return (
    <div className="page page--centered" style={{paddingTop:'2rem'}}>
      <div className="form-card" style={{maxWidth:520}}>
        <div className="form-card-header">
          <div className="form-card-icon" style={{background:'linear-gradient(135deg,rgba(34,211,238,0.15),rgba(99,102,241,0.1))',borderColor:'rgba(34,211,238,0.3)',color:'var(--cyan)'}}><GraduationCap size={24}/></div>
          <h1>Teacher Registration</h1>
          <p className="text-muted">Create your teacher account to start building quizzes</p>
        </div>
        <form onSubmit={handleSubmit} className="form" noValidate>
          {[
            {id:'name',      label:'Full Name',    type:'text'},
            {id:'email',     label:'Email Address',type:'email'},
            {id:'department',label:'Department',   type:'text'},
            {id:'employeeId',label:'Employee ID',  type:'text', opt:true},
          ].map(f=>(
            <div className="field" key={f.id}>
              <label htmlFor={f.id}>{f.label}{f.opt&&<span className="text-muted"> (optional)</span>}</label>
              <input id={f.id} name={f.id} type={f.type} value={form[f.id]} onChange={onChange} disabled={loading} className={errors[f.id]?'input--error':''}/>
              {errors[f.id]&&<span className="field-error">{errors[f.id]}</span>}
            </div>
          ))}

          {[['password','Password',showPw,setShowPw],['confirm','Confirm Password',showCf,setShowCf]].map(([id,label,show,toggle])=>(
            <div className="field" key={id}>
              <label htmlFor={id}>{label}</label>
              <div style={{position:'relative'}}>
                <input id={id} name={id} type={show?'text':'password'} autoComplete="new-password"
                  value={form[id]} onChange={onChange} disabled={loading}
                  className={errors[id]?'input--error':''} style={{paddingRight:'2.8rem'}}/>
                {eyeBtn(show, toggle)}
              </div>
              {errors[id]&&<span className="field-error">{errors[id]}</span>}
            </div>
          ))}

          <button type="submit" className="btn btn-full" style={{background:'linear-gradient(135deg,#22d3ee,#6366f1)',color:'white',boxShadow:'0 4px 20px rgba(34,211,238,0.3)'}} disabled={loading}>
            {loading ? <Spinner text=""/> : <>Create Teacher Account <ArrowRight size={16}/></>}
          </button>
        </form>
        <p style={{textAlign:'center',marginTop:'1.25rem',fontSize:'0.875rem',color:'var(--muted)'}}>
          Already have an account?{' '}<Link to="/teacher/login" style={{color:'var(--cyan)',fontWeight:600}}>Log in</Link>
        </p>
        <p style={{textAlign:'center',marginTop:'0.5rem',fontSize:'0.875rem',color:'var(--muted)'}}>
          Are you a student?{' '}<Link to="/register" style={{color:'var(--indigo2)',fontWeight:600}}>Student sign up →</Link>
        </p>
      </div>
    </div>
  );
}
