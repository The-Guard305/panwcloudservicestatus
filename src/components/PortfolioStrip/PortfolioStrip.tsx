import { useMemo } from 'react';
import type { Status, Component, Incident, ScheduledMaintenance } from '../../types';
import { getStatusColor, formatRelativeTime, isComponentImpacted } from '../../utils';
import './PortfolioStrip.css';

interface PortfolioStripProps {
  status: Status | null;
  components: Component[];
  incidents: Incident[];
  maintenances: ScheduledMaintenance[];
  updatedAt: string | null;
  loading: boolean;
  error: Error | null;
}

export function PortfolioStrip({
  status,
  components,
  incidents,
  maintenances,
  updatedAt,
  loading,
  error,
}: PortfolioStripProps) {
  const stats = useMemo(() => {
    const impactedComponents = components.filter(
      (c) => isComponentImpacted(c) && !c.group
    ).length;
    const unresolvedIncidents = incidents.filter(
      (i) => i.status !== 'resolved' && i.status !== 'postmortem'
    ).length;
    const activeMaintenances = maintenances.filter(
      (m) => m.status === 'in_progress' || m.status === 'scheduled'
    ).length;

    return {
      impactedComponents,
      unresolvedIncidents,
      activeMaintenances,
    };
  }, [components, incidents, maintenances]);

  if (error) {
    return (
      <div className="portfolio-strip portfolio-strip--error">
        <div className="portfolio-strip__status">
          <div
            className="portfolio-strip__indicator"
            style={{ backgroundColor: '#ef4444' }}
          />
          <div className="portfolio-strip__info">
            <h1 className="portfolio-strip__title">Error Loading Status</h1>
            <p className="portfolio-strip__description">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !status) {
    return (
      <div className="portfolio-strip portfolio-strip--loading">
        <div className="portfolio-strip__status">
          <div className="portfolio-strip__indicator portfolio-strip__indicator--loading" />
          <div className="portfolio-strip__info">
            <h1 className="portfolio-strip__title">Loading Status...</h1>
            <p className="portfolio-strip__description">
              Fetching data from Palo Alto Networks Status API
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <header className="portfolio-strip">
      <div className="portfolio-strip__status">
        <div
          className="portfolio-strip__indicator"
          style={{ backgroundColor: getStatusColor(status?.indicator || 'none') }}
          title={status?.indicator || 'unknown'}
        />
        <div className="portfolio-strip__info">
          <h1 className="portfolio-strip__title">
            Palo Alto Networks Cloud Services
          </h1>
          <p className="portfolio-strip__description">
            {status?.description || 'Status unavailable'}
          </p>
        </div>
      </div>

      <div className="portfolio-strip__metrics">
        <div className="portfolio-strip__metric">
          <span className="portfolio-strip__metric-value">
            {stats.impactedComponents}
          </span>
          <span className="portfolio-strip__metric-label">
            Impacted Components
          </span>
        </div>
        <div className="portfolio-strip__metric">
          <span className="portfolio-strip__metric-value">
            {stats.unresolvedIncidents}
          </span>
          <span className="portfolio-strip__metric-label">
            Active Incidents
          </span>
        </div>
        <div className="portfolio-strip__metric">
          <span className="portfolio-strip__metric-value">
            {stats.activeMaintenances}
          </span>
          <span className="portfolio-strip__metric-label">
            Scheduled Maintenance
          </span>
        </div>
      </div>

      <div className="portfolio-strip__timestamp">
        {updatedAt && (
          <span title={new Date(updatedAt).toLocaleString()}>
            Updated {formatRelativeTime(updatedAt)}
          </span>
        )}
        {loading && <span className="portfolio-strip__refreshing">Refreshing...</span>}
      </div>
    </header>
  );
}

export default PortfolioStrip;
