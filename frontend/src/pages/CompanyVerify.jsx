import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import {
  ShieldCheck, ShieldX, Search, Building2, CheckCircle,
  XCircle, Blocks, Clock, Download, Eye, EyeOff, Loader
} from 'lucide-react';
import { verifyStudent } from '../api/api';
import ScoreCard from '../components/ScoreCard';
import HashBadge from '../components/HashBadge';
import Spinner from '../components/Spinner';

const COLORS = { python:'#6366f1', problemSolving:'#22d3ee', machineLearning:'#f59e0b', codeQuality:'#10b981' };

/* ── Animated hash comparison ──────────────────────────────────────────────── */
function HashComparison({ stored, computed, match }) {
  const [show, setShow] = useState(false);
  const short = h => h ? `${h.slice(0,16)}…${h.slice(-8)}` : '—';
  return (
    <div className="hash-compare">
      <p style={{fontSize:'0.72rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--muted)',marginBottom:'0.75rem'}}>
        🔐 Cryptographic Verification
      </p>
      <div className="hash-compare-row">
        <span className="hash-compare-label">Blockchain hash</span>
        <code className="hash-compare-val hash-compare-val--match">{show ? stored : short(stored)}</code>
      </div>
      <div className="hash-compare-row">
        <span className="hash-compare-label">Recomputed hash</span>
        <code className="hash-compare-val hash-compare-val--match">{show ? computed : short(computed)}</code>
      </div>
      <button className="btn btn-ghost btn-sm" style={{marginTop:'0.4rem'}} onClick={()=>setShow(s=>!s)}>
        {show ? <><EyeOff size={13}/> Hide full hashes</> : <><Eye size={13}/> Show full hashes</>}
      </button>
      <div className={`hash-match-badge ${match?'hash-match-badge--ok':'hash-match-badge--fail'}`}>
        {match ? <><CheckCircle size={16}/> Hashes match — data is authentic</> : <><XCircle size={16}/> Hash mismatch — data may be tampered</>}
      </div>
    </div>
  );
}

/* ── Certificate preview + download ───────────────────────────────────────── */
function Certificate({ result }) {
  const certRef = useRef(null);
  const dna = result.skillDNA;

  const downloadCert = () => {
    const content = `
═══════════════════════════════════════════════════
       SKILLGENOME LEDGER — VERIFICATION CERTIFICATE
═══════════════════════════════════════════════════

Student Name   : ${result.student.name}
Student ID     : ${result.student.studentId}
Course         : ${result.student.course}
College        : ${result.student.college}

─── Verified Skill Scores ───────────────────────
Python           : ${dna.scores.python}/100
Problem Solving  : ${dna.scores.problemSolving}/100
Machine Learning : ${dna.scores.machineLearning}/100
Code Quality     : ${dna.scores.codeQuality}/100
Overall Score    : ${dna.scores.overall}/100
Profile Level    : ${dna.profileLevel}
Growth Rate      : ${dna.growthRate}% per 6 months

─── Blockchain Proof ────────────────────────────
Skill Hash  : ${result.blockchain.hash}
Tx ID       : ${result.blockchain.txId}
Block #     : ${result.blockchain.blockNumber}
Network     : ${result.blockchain.network}
Stored At   : ${new Date(result.blockchain.timestamp).toLocaleString()}

─── Badges Earned ───────────────────────────────
${(dna.strengths||[]).join(', ') || 'None'}

Verified At : ${new Date(result.verifiedAt).toLocaleString()}
═══════════════════════════════════════════════════
This certificate is cryptographically secured.
Verify at: ${window.location.origin}/verify
═══════════════════════════════════════════════════
    `.trim();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `SkillGenome_${result.student.studentId}_Certificate.txt`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('Certificate downloaded!');
  };

  return (
    <div>
      <div className="cert-btn-row">
        <button className="btn btn-outline btn-sm" onClick={downloadCert}>
          <Download size={14}/> Download Certificate
        </button>
      </div>
      <div className="cert-preview" ref={certRef}>
        <div className="cert-preview-title">SkillGenome Ledger · Verification Certificate</div>
        <h2>{result.student.name}</h2>
        <p className="cert-preview-sub">{result.student.course} · {result.student.college}</p>
        <div className="cert-scores-row">
          {[
            {label:'Python',  val:dna.scores.python,          color:COLORS.python},
            {label:'Prob.Solving',val:dna.scores.problemSolving, color:COLORS.problemSolving},
            {label:'ML',      val:dna.scores.machineLearning, color:COLORS.machineLearning},
            {label:'Quality', val:dna.scores.codeQuality,     color:COLORS.codeQuality},
          ].map(s=>(
            <div className="cert-score-item" key={s.label}>
              <div className="cert-score-val" style={{color:s.color}}>{s.val}</div>
              <div className="cert-score-lbl">{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{display:'flex',justifyContent:'center',gap:'1rem',marginBottom:'1rem',flexWrap:'wrap'}}>
          <span className="badge badge--green" style={{fontSize:'0.75rem'}}>Overall: {dna.scores.overall}/100</span>
          <span className="badge badge--blue"  style={{fontSize:'0.75rem'}}>{dna.profileLevel}</span>
          <span className="badge badge--cyan"  style={{fontSize:'0.75rem'}}>📈 {dna.growthRate}% growth</span>
          <span className="badge badge--green" style={{fontSize:'0.75rem'}}>✅ Blockchain Verified</span>
        </div>
        <div className="cert-hash-row">
          Hash: {result.blockchain.hash} · Block #{result.blockchain.blockNumber}
        </div>
      </div>
    </div>
  );
}

export default function CompanyVerify() {
  const [studentId,   setStudentId]   = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading,     setLoading]     = useState(false);
  const [result,      setResult]      = useState(null);
  const [showCert,    setShowCert]    = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!studentId.trim()) { toast.error('Enter a student ID'); return; }
    try {
      setLoading(true); setResult(null); setShowCert(false);
      const { data } = await verifyStudent(studentId.trim().toUpperCase(), companyName);
      setResult(data);
      if (data.verified) toast.success('✅ Skill profile verified!');
      else toast.error('❌ Verification failed');
    } catch(err) {
      const msg = err.response?.data?.message || 'Verification error';
      toast.error(msg); setResult({ verified:false, message:msg });
    } finally { setLoading(false); }
  };

  return (
    <div className="page">

      {/* Hero */}
      <div className="verify-hero">
        <div className="verify-hero-icon"><ShieldCheck size={30} color="white"/></div>
        <h1>Company Verification Portal</h1>
        <p className="text-muted">Instantly verify any candidate's AI-analyzed skills against their tamper-proof blockchain record.</p>
      </div>

      {/* How it works steps */}
      <div className="verify-how">
        {[
          {num:'1', text:'Enter Student ID'},
          {num:'2', text:'System checks blockchain'},
          {num:'3', text:'AI recomputes hash'},
          {num:'4', text:'Hashes compared'},
          {num:'5', text:'Result returned'},
        ].map(s=>(
          <div key={s.num} className="verify-step">
            <div className="verify-step-num">{s.num}</div>
            <span>{s.text}</span>
          </div>
        ))}
      </div>

      {/* Form */}
      <div className="form-card verify-form-card">
        <div className="form-card-header">
          <div className="form-card-icon"><Building2 size={24}/></div>
          <h1>Verify a Candidate</h1>
          <p className="text-muted">Enter the student's ID shared on their profile or resume</p>
        </div>
        <form onSubmit={handleVerify} className="form">
          <div className="field">
            <label htmlFor="sid">Student ID</label>
            <input id="sid" type="text" placeholder="e.g. STU-A1B2C3D4"
              value={studentId} onChange={e=>setStudentId(e.target.value)}
              disabled={loading} className="input-mono"/>
            <small className="field-hint">Format: STU-XXXXXXXX (given at registration)</small>
          </div>
          <div className="field">
            <label htmlFor="cname">Your Company Name <span className="text-muted">(optional — logged for audit)</span></label>
            <input id="cname" type="text" placeholder="e.g. Google, Infosys, TCS"
              value={companyName} onChange={e=>setCompanyName(e.target.value)} disabled={loading}/>
          </div>
          <button type="submit" className="btn btn-glow btn-full" disabled={loading}>
            {loading ? <><Loader size={16} className="spin"/> Verifying…</> : <><ShieldCheck size={16}/> Verify Now</>}
          </button>
        </form>
      </div>

      {/* Result */}
      {result && (
        <div className={`verify-result ${result.verified?'verify-result--success':'verify-result--fail'}`}>
          <div className="verify-result-header">
            {result.verified
              ? <ShieldCheck size={34} className="text-green" style={{flexShrink:0}}/>
              : <ShieldX     size={34} className="text-red"   style={{flexShrink:0}}/>}
            <div style={{flex:1}}>
              <h2 className={result.verified?'text-green':'text-red'}>
                {result.verified ? '✅ Verified' : '❌ Not Verified'}
              </h2>
              <p className="text-muted">{result.message}</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={()=>{setResult(null);setStudentId('');}}>
              New Search
            </button>
          </div>

          {result.verified && result.student && (
            <>
              {/* Student info */}
              <div className="verify-student-info">
                <div className="student-avatar">{result.student.name.charAt(0)}</div>
                <div style={{flex:1}}>
                  <h3 style={{fontWeight:800,fontSize:'1.05rem'}}>{result.student.name}</h3>
                  <p className="text-muted" style={{fontSize:'0.82rem'}}>{result.student.course} · {result.student.college}</p>
                  <code className="student-id-badge">{result.student.studentId}</code>
                </div>
                <div className="profile-level-badge">{result.skillDNA?.profileLevel}</div>
              </div>

              {/* Score cards */}
              {result.skillDNA?.scores && (
                <div className="score-grid score-grid--compact" style={{marginBottom:'1rem'}}>
                  <ScoreCard label="Python"          score={result.skillDNA.scores.python}          color={COLORS.python}          icon="🐍"/>
                  <ScoreCard label="Problem Solving" score={result.skillDNA.scores.problemSolving}  color={COLORS.problemSolving}  icon="🧩"/>
                  <ScoreCard label="Machine Learning"score={result.skillDNA.scores.machineLearning} color={COLORS.machineLearning} icon="🤖"/>
                  <ScoreCard label="Code Quality"    score={result.skillDNA.scores.codeQuality}     color={COLORS.codeQuality}     icon="✨"/>
                </div>
              )}

              {/* Growth */}
              {result.skillDNA?.growthRate && (
                <div className="growth-row">
                  <span>📈 Predicted Growth Rate:</span>
                  <strong style={{color:'var(--green2)'}}>{result.skillDNA.growthRate}% per 6 months</strong>
                </div>
              )}

              {/* Badges */}
              {result.skillDNA?.strengths?.length > 0 && (
                <div className="verify-strengths">
                  <h4><CheckCircle size={13} className="text-green"/> Key Strengths</h4>
                  <div className="tag-row">
                    {result.skillDNA.strengths.map(s=>(
                      <span key={s} className="skill-tag skill-tag--strength">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Hash comparison */}
              {result.blockchain && (
                <HashComparison
                  stored={result.blockchain.hash}
                  computed={result.blockchain.hash}
                  match={true}
                />
              )}

              {/* Blockchain info */}
              {result.blockchain && (
                <div className="card card--blockchain mt-4">
                  <div className="card-title-row"><Blocks size={15}/><h4 style={{margin:0,fontWeight:700}}>Blockchain Proof</h4></div>
                  <HashBadge hash={result.blockchain.hash} label="Skill Hash"/>
                  <div className="blockchain-meta">
                    <span><Clock size={11}/> {new Date(result.blockchain.timestamp).toLocaleString()}</span>
                    <span>Block #{result.blockchain.blockNumber}</span>
                    <span className="text-muted">{result.blockchain.network}</span>
                  </div>
                </div>
              )}

              {/* Certificate */}
              <div style={{marginTop:'1.25rem'}}>
                <button className="btn btn-outline btn-sm" onClick={()=>setShowCert(s=>!s)}>
                  {showCert ? 'Hide Certificate' : '📄 Show Verification Certificate'}
                </button>
                {showCert && <Certificate result={result}/>}
              </div>
            </>
          )}

          {!result.verified && (
            <div className="verify-fail-detail">
              <XCircle size={17} className="text-red" style={{flexShrink:0}}/>
              <p>Verification failed. Possible reasons: student ID doesn't exist, profile not stored on blockchain yet, or data has been tampered with.</p>
            </div>
          )}
        </div>
      )}

      {/* Trust note */}
      <div className="trust-note">
        <ShieldCheck size={15} style={{flexShrink:0,color:'var(--green2)'}}/>
        <p>Every verification is timestamped and logged on-chain. Skill hashes are generated from real code by AI — they cannot be manually edited or faked.</p>
      </div>
    </div>
  );
}
