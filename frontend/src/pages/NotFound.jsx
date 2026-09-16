import { Link } from 'react-router-dom';
import { Dna } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="page page--centered" style={{ textAlign: 'center', paddingTop: '4rem' }}>
      <Dna size={60} style={{ color: '#6366f1', marginBottom: '1rem' }} />
      <h1 style={{ fontSize: '4rem', fontWeight: 800, color: '#f1f5f9' }}>404</h1>
      <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>This page doesn't exist in the ledger.</p>
      <Link to="/" className="btn btn-primary">Go Home</Link>
    </div>
  );
}
