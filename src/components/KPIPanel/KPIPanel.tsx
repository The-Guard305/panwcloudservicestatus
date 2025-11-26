import type { SREKPIs } from '../../types';
import './KPIPanel.css';

interface KPIPanelProps {
  kpis: SREKPIs | null;
  loading: boolean;
}

export function KPIPanel({ kpis, loading }: KPIPanelProps) {
  if (loading && !kpis) {
    return (
      <div className="kpi-panel kpi-panel--loading">
        <h2 className="kpi-panel__title">SRE KPIs</h2>
        <div className="kpi-panel__loading">Loading metrics...</div>
      </div>
    );
  }

  if (!kpis) {
    return (
      <div className="kpi-panel">
        <h2 className="kpi-panel__title">SRE KPIs</h2>
        <div className="kpi-panel__empty">No data available</div>
      </div>
    );
  }

  const getStabilityColor = (index: number) => {
    if (index >= 90) return '#10b981';
    if (index >= 70) return '#f59e0b';
    if (index >= 50) return '#f97316';
    return '#ef4444';
  };

  return (
    <div className="kpi-panel">
      <h2 className="kpi-panel__title">SRE KPIs</h2>

      <div className="kpi-panel__grid">
        {/* Stability Index */}
        <div className="kpi-card kpi-card--large">
          <div className="kpi-card__label">Stability Index</div>
          <div className="kpi-card__value-container">
            <span
              className="kpi-card__value kpi-card__value--large"
              style={{ color: getStabilityColor(kpis.stabilityIndex) }}
            >
              {kpis.stabilityIndex}%
            </span>
            <div
              className="kpi-card__gauge"
              style={{
                background: `conic-gradient(${getStabilityColor(kpis.stabilityIndex)} ${kpis.stabilityIndex * 3.6}deg, #334155 0deg)`,
              }}
            >
              <div className="kpi-card__gauge-inner" />
            </div>
          </div>
        </div>

        {/* Days Since Last Critical */}
        <div className="kpi-card">
          <div className="kpi-card__label">Days Since Critical</div>
          <span className="kpi-card__value">
            {kpis.daysSinceLastCritical !== null ? kpis.daysSinceLastCritical : '—'}
          </span>
          <span className="kpi-card__unit">days</span>
        </div>

        {/* Approximate MTTR */}
        <div className="kpi-card">
          <div className="kpi-card__label">Avg. Resolution Time</div>
          <span className="kpi-card__value">
            {kpis.approximateMTTR !== null ? kpis.approximateMTTR : '—'}
          </span>
          <span className="kpi-card__unit">hours</span>
        </div>

        {/* Incidents Last 30 Days */}
        <div className="kpi-card">
          <div className="kpi-card__label">Incidents (30d)</div>
          <span className="kpi-card__value">{kpis.totalIncidentsLast30Days}</span>
        </div>
      </div>

      {/* Severity Mix */}
      <div className="kpi-panel__severity">
        <div className="kpi-panel__severity-title">Incident Severity Mix (30d)</div>
        <div className="kpi-panel__severity-bars">
          <SeverityBar
            label="Critical"
            count={kpis.incidentSeverityMix.critical}
            color="#ef4444"
            total={kpis.totalIncidentsLast30Days}
          />
          <SeverityBar
            label="Major"
            count={kpis.incidentSeverityMix.major}
            color="#f97316"
            total={kpis.totalIncidentsLast30Days}
          />
          <SeverityBar
            label="Minor"
            count={kpis.incidentSeverityMix.minor}
            color="#f59e0b"
            total={kpis.totalIncidentsLast30Days}
          />
          <SeverityBar
            label="None"
            count={kpis.incidentSeverityMix.none}
            color="#10b981"
            total={kpis.totalIncidentsLast30Days}
          />
        </div>
      </div>
    </div>
  );
}

function SeverityBar({
  label,
  count,
  color,
  total,
}: {
  label: string;
  count: number;
  color: string;
  total: number;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="severity-bar">
      <div className="severity-bar__header">
        <span className="severity-bar__label">{label}</span>
        <span className="severity-bar__count">{count}</span>
      </div>
      <div className="severity-bar__track">
        <div
          className="severity-bar__fill"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default KPIPanel;
