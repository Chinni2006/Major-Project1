import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { UserPlus, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { registerStudent } from '../api/api';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

const BRANCHES  = ['AIML','CSE','CSE-AI','CSE-DS','ECE','EEE','Civil','Mechanical'];
const SECTIONS  = ['A','B','C'];

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name:'', email:'', course:'', college:'',
    branch:'', usn:'', section:'', rollNo:'',
    password:'', confirm:'',
  });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);
  const [showCf,  setShowCf]  = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name     = 'Name is required';
    if (!form.email.trim())   e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.course.trim())  e.course   = 'Course is required';
    if (!form.branch)         e.branch   = 'Select your branch';
    if (!form.usn.trim())     e.usn      = 'USN is required';
    if (!form.section)        e.section  = 'Select your section';
    if (!form.rollNo.trim())  e.rollNo   = 'Roll number is required';
    if (!form.password)       e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Minimum 6 characters';
    if (form.confirm !== form.password) e.confirm = 'Passwords do not match';
    return e;
  };

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrors(err => ({ ...err, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    try {
      setLoading(true);
      const { data } = await registerStudent({
        name:    form.name.trim(),
        email:   form.email.trim().toLowerCase(),
        course:  form.course.trim(),
        college: form.college.trim(),
        branch:  form.branch,
        usn:     form.usn.trim().toUpperCase(),
        section: form.section,
        rollNo:  form.rollNo.trim(),
        password: form.password,
      });
      if (data.success) {
        login(data.student, data.token);
        toast.success(`Welcome, ${data.student.name}!`);
        navigate(`/dashboard/${data.student.studentId}`);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      if (err.response?.status === 409) { toast.error('Email already registered.'); navigate('/login'); }
      else toast.error(msg);
    } finally { setLoading(false); }
  };

  const Field = ({ id, label, error, optional, children }) => (
    <div className="field">
      <label htmlFor={id}>{label}{optional && <span className="text-muted"> (optional)</span>}</label>
      {children}
      {error && <span className="field-error">{error}</span>}
    </div>
  );

  const pwToggleStyle = { position:'absolute', right:'0.75rem', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--muted)', cursor:'pointer', display:'flex' };

  return (
    <div className="page page--centered" style={{ paddingTop:'2rem' }}>
      <div className="form-card" style={{ maxWidth:580 }}>
        <div className="form-card-header">
          <div className="form-card-icon"><UserPlus size={24}/></div>
          <h1>Create Student Account</h1>
          <p className="text-muted">Fill all details to register your verified profile</p>
        </div>

        <form onSubmit={handleSubmit} className="form" noValidate>

          {/* ── Personal ── */}
          <p style={{ fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--cyan)', marginBottom:'-0.25rem' }}>Personal Info</p>

          <Field id="name" label="Full Name" error={errors.name}>
            <input id="name" name="name" type="text" autoComplete="name"
              value={form.name} onChange={handleChange} disabled={loading}
              className={errors.name ? 'input--error' : ''}/>
          </Field>

          <Field id="email" label="Email Address" error={errors.email}>
            <input id="email" name="email" type="email" autoComplete="email"
              value={form.email} onChange={handleChange} disabled={loading}
              className={errors.email ? 'input--error' : ''}/>
          </Field>

          {/* ── Academic ── */}
          <p style={{ fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--cyan)', marginTop:'0.5rem', marginBottom:'-0.25rem' }}>Academic Details</p>

          <Field id="course" label="Course / Degree" error={errors.course}>
            <input id="course" name="course" type="text"
              value={form.course} onChange={handleChange} disabled={loading}
              className={errors.course ? 'input--error' : ''}/>
          </Field>

          <Field id="college" label="College / University" optional error={null}>
            <input id="college" name="college" type="text"
              value={form.college} onChange={handleChange} disabled={loading}/>
          </Field>

          {/* Branch + Section row */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
            <Field id="branch" label="Branch" error={errors.branch}>
              <select id="branch" name="branch"
                value={form.branch} onChange={handleChange} disabled={loading}
                className={errors.branch ? 'input--error' : ''}>
                <option value="">Select branch</option>
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </Field>

            <Field id="section" label="Section" error={errors.section}>
              <select id="section" name="section"
                value={form.section} onChange={handleChange} disabled={loading}
                className={errors.section ? 'input--error' : ''}>
                <option value="">Select section</option>
                {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
              </select>
            </Field>
          </div>

          {/* USN + Roll No row */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
            <Field id="usn" label="USN" error={errors.usn}>
              <input id="usn" name="usn" type="text"
                value={form.usn} onChange={handleChange} disabled={loading}
                className={`input-mono ${errors.usn ? 'input--error' : ''}`}/>
            </Field>

            <Field id="rollNo" label="Roll Number" error={errors.rollNo}>
              <input id="rollNo" name="rollNo" type="text"
                value={form.rollNo} onChange={handleChange} disabled={loading}
                className={errors.rollNo ? 'input--error' : ''}/>
            </Field>
          </div>

          {/* ── Security ── */}
          <p style={{ fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--cyan)', marginTop:'0.5rem', marginBottom:'-0.25rem' }}>Security</p>

          <Field id="password" label="Password" error={errors.password}>
            <div style={{ position:'relative' }}>
              <input id="password" name="password"
                type={showPw ? 'text' : 'password'} autoComplete="new-password"
                value={form.password} onChange={handleChange} disabled={loading}
                className={errors.password ? 'input--error' : ''}
                style={{ paddingRight:'2.8rem' }}/>
              <button type="button" onClick={() => setShowPw(v=>!v)} style={pwToggleStyle}>
                {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
            {!errors.password && <span className="field-hint">Minimum 6 characters</span>}
          </Field>

          <Field id="confirm" label="Confirm Password" error={errors.confirm}>
            <div style={{ position:'relative' }}>
              <input id="confirm" name="confirm"
                type={showCf ? 'text' : 'password'} autoComplete="new-password"
                value={form.confirm} onChange={handleChange} disabled={loading}
                className={errors.confirm ? 'input--error' : ''}
                style={{ paddingRight:'2.8rem' }}/>
              <button type="button" onClick={() => setShowCf(v=>!v)} style={pwToggleStyle}>
                {showCf ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </Field>

          <button type="submit" className="btn btn-glow btn-full" disabled={loading}>
            {loading ? <Spinner text=""/> : <>Create Account <ArrowRight size={16}/></>}
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:'1.25rem', fontSize:'0.875rem', color:'var(--muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color:'var(--indigo2)', fontWeight:600 }}>Log in</Link>
        </p>
        <p style={{ textAlign:'center', marginTop:'0.6rem', fontSize:'0.875rem', color:'var(--muted)' }}>
          Are you a teacher?{' '}
          <Link to="/teacher/register" style={{ color:'var(--cyan)', fontWeight:600 }}>Teacher sign up →</Link>
        </p>
      </div>
    </div>
  );
}
