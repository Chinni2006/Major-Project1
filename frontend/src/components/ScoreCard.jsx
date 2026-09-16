export default function ScoreCard({ label, score, color, icon, description }) {
  const pct = Math.min(100, Math.max(0, score));
  return (
    <div className="score-card">
      <div className="score-card-header">
        <span className="score-icon">{icon}</span>
        <span className="score-label">{label}</span>
      </div>
      <div className="score-value" style={{ color }}>
        {pct}<span className="score-unit">/100</span>
      </div>
      <div className="score-bar-track">
        <div
          className="score-bar-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      {description && <p className="score-desc">{description}</p>}
    </div>
  );
}
