import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Blocks, RefreshCw, Shield, Clock, Hash, ChevronDown, ChevronUp } from 'lucide-react';
import { getBlockchainRecords, getNetworkStatus } from '../api/api';
import Spinner from '../components/Spinner';

function BlockRow({ block }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`block-row ${expanded ? 'block-row--expanded' : ''}`}>
      <div className="block-row-main" onClick={() => setExpanded(!expanded)}>
        <div className="block-number">#{block.blockNumber}</div>
        <div className="block-info">
          <span className="block-student">{block.studentName || block.studentId}</span>
          <span className="text-muted" style={{ fontSize: '0.8rem' }}>
            {new Date(block.timestamp).toLocaleString()}
          </span>
        </div>
        <code className="block-hash-short">{block.skillHash?.slice(0, 16)}...</code>
        <button className="icon-btn">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      {expanded && (
        <div className="block-detail">
          <div className="block-detail-row">
            <span className="detail-key">Student ID</span>
            <code className="detail-val">{block.studentId}</code>
          </div>
          <div className="block-detail-row">
            <span className="detail-key">Skill Hash</span>
            <code className="detail-val break-all">{block.skillHash}</code>
          </div>
          <div className="block-detail-row">
            <span className="detail-key">Block Hash</span>
            <code className="detail-val break-all">{block.blockHash}</code>
          </div>
          <div className="block-detail-row">
            <span className="detail-key">Prev Hash</span>
            <code className="detail-val break-all">{block.previousHash}</code>
          </div>
          <div className="block-detail-row">
            <span className="detail-key">Tx ID</span>
            <code className="detail-val break-all">{block.txId}</code>
          </div>
          <div className="block-detail-row">
            <span className="detail-key">Nonce</span>
            <code className="detail-val">{block.nonce}</code>
          </div>
          <div className="block-detail-row">
            <span className="detail-key">Timestamp</span>
            <code className="detail-val">{block.timestamp}</code>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BlockchainExplorer() {
  const [records, setRecords]   = useState([]);
  const [status, setStatus]     = useState(null);
  const [loading, setLoading]   = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const [recRes, statRes] = await Promise.all([getBlockchainRecords(), getNetworkStatus()]);
      setRecords(recRes.data.records || []);
      setStatus(statRes.data);
    } catch {
      toast.error('Could not load blockchain data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <Spinner text="Loading blockchain..." />;

  return (
    <div className="page">
      <div className="page-header">
        <h1><Blocks size={26} style={{ verticalAlign: 'middle' }} /> Blockchain Explorer</h1>
        <p className="text-muted">All skill hashes stored on the SkillGenome ledger</p>
      </div>

      {/* Network status */}
      {status && (
        <div className="network-status">
          <div className="network-stat">
            <Shield size={16} className={status.chainIntegrity === 'VALID' ? 'text-green' : 'text-red'} />
            <span>Chain: <strong className={status.chainIntegrity === 'VALID' ? 'text-green' : 'text-red'}>{status.chainIntegrity}</strong></span>
          </div>
          <div className="network-stat">
            <Blocks size={16} />
            <span>Blocks: <strong>{status.totalBlocks}</strong></span>
          </div>
          <div className="network-stat">
            <Hash size={16} />
            <span>Records: <strong>{records.length}</strong></span>
          </div>
          <div className="network-stat">
            <span className={`dot ${status.mode === 'live' ? 'dot--green' : 'dot--yellow'}`} />
            <span>{status.mode === 'live' ? 'Live Node' : 'Simulation'}</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={load}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      )}

      {/* Records */}
      {records.length === 0 ? (
        <div className="empty-state">
          <Blocks size={40} className="text-muted" />
          <p>No blockchain records yet.</p>
          <p className="text-muted">Register a student, run analysis, and store on blockchain to see records here.</p>
        </div>
      ) : (
        <div className="block-list">
          <div className="block-list-header">
            <span>Block</span>
            <span>Student</span>
            <span>Skill Hash</span>
            <span />
          </div>
          {[...records].reverse().map((b, i) => (
            <BlockRow key={i} block={b} />
          ))}
        </div>
      )}

      {/* Contract info */}
      {status && (
        <div className="card card--dark mt-6">
          <h3 className="card-title">Network Info</h3>
          <div className="network-info-grid">
            <div><span className="detail-key">Network</span><span>{status.network}</span></div>
            <div><span className="detail-key">Chain ID</span><span>{status.chainId}</span></div>
            <div><span className="detail-key">RPC URL</span><code>{status.rpcUrl}</code></div>
            <div><span className="detail-key">Contract</span><code>{status.contractAddress}</code></div>
            <div><span className="detail-key">Mode</span><span className="badge badge--blue">{status.mode}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
