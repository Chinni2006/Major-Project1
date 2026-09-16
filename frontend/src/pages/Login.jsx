import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { LogIn, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { loginStudent } from '../api/api';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

export default function Login() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login } = useAuth();

  const from = location.state?.from || null;

  const [form,    setForm]    = useState({ email: '', password: '' });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email.trim())               e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password)                   e.password = 'Password is required';
    return e;
  };

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((err) => ({ ...err, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    try {
      setLoading(true);
      const { data } = await loginStudent({
        email:    form.email.trim().toLowerCase(),
        password: form.password,
      });

      if (data.success) {
        login(data.student, data.token);
        toast.success(`Welcome back, ${data.student.name}!`);
        // Go to where they came from, or their dashboard
        navigate(from || `/dashboard/${data.student.studentId}`, { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      if (err.response?.status === 401) {
        if (msg.toLowerCase().includes('password')) {
          setErrors({ password: 'Incorrect password' });
        } else {
          setErrors({ email: 'No account found with this email' });
        }
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page page--centered" style={{ paddingTop: '3rem' }}>
      <div className="form-card">
        <div className="form-card-header">
          <div className="form-card-icon"><LogIn size={24} /></div>
          <h1>Welcome Back</h1>
          <p className="text-muted">Log in to access your Skill DNA profile</p>
        </div>

        <form onSubmit={handleSubmit} className="form" noValidate>

          {/* Email */}
          <div className="field">
            <label htmlFor="email">Email Address</label>
            <input
              id="email" name="email" type="email"
              autoComplete="email"
              value={form.email} onChange={handleChange}
              disabled={loading}
              className={errors.email ? 'input--error' : ''}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          {/* Password */}
          <div className="field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="password">Password</label>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="password" name="password"
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                value={form.password} onChange={handleChange}
                disabled={loading}
                className={errors.password ? 'input--error' : ''}
                style={{ paddingRight: '2.8rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                style={{
                  position: 'absolute', right: '0.75rem', top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex',
                }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <button type="submit" className="btn btn-glow btn-full" disabled={loading}>
            {loading ? <Spinner text="" /> : <>Log In <ArrowRight size={16} /></>}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--indigo2)', fontWeight: 600 }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
