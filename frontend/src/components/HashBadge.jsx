import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function HashBadge({ hash, label = 'Hash' }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const short = hash ? `${hash.slice(0, 10)}...${hash.slice(-8)}` : '—';

  return (
    <div className="hash-badge">
      <span className="hash-label">{label}</span>
      <code className="hash-value" title={hash}>{short}</code>
      <button className="hash-copy" onClick={copy} aria-label="Copy hash">
        {copied ? <Check size={14} className="text-green" /> : <Copy size={14} />}
      </button>
    </div>
  );
}
