import { useMemo, useState } from 'react';
import type { Incident } from '../../types';
import {
  getStatusColor,
  formatIncidentStatus,
  formatRelativeTime,
  formatDuration,
} from '../../utils';
import { IncidentDetailModal } from '../IncidentDetailModal/IncidentDetailModal';
import './IncidentStream.css';

interface IncidentStreamProps {
  unresolvedIncidents: Incident[];
  recentIncidents: Incident[];
  loading: boolean;
  error: Error | null;
}

export function IncidentStream({
  unresolvedIncidents,
  recentIncidents,
  loading,
  error,
}: IncidentStreamProps) {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const sortedUnresolved = useMemo(
    () =>
      [...unresolvedIncidents].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      ),
    [unresolvedIncidents]
  );

  const recentResolved = useMemo(
    () =>
      recentIncidents
        .filter((i) => i.status === 'resolved' || i.status === 'postmortem')
        .slice(0, 10),
    [recentIncidents]
  );

  if (error) {
    return (
      <div className="incident-stream incident-stream--error">
        <h2 className="incident-stream__title">Incidents</h2>
        <div className="incident-stream__error">
          <p>Failed to load incidents: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="incident-stream">
      <h2 className="incident-stream__title">
        Incidents
        {sortedUnresolved.length > 0 && (
          <span className="incident-stream__badge incident-stream__badge--active">
            {sortedUnresolved.length} Active
          </span>
        )}
      </h2>

      {loading && unresolvedIncidents.length === 0 ? (
        <div className="incident-stream__loading">
          <p>Loading incidents...</p>
        </div>
      ) : (
        <>
          {/* Unresolved Incidents */}
          <div className="incident-stream__section">
            <h3 className="incident-stream__section-title">Active Incidents</h3>
            {sortedUnresolved.length === 0 ? (
              <div className="incident-stream__empty">
                <span className="incident-stream__empty-icon">✓</span>
                <p>No active incidents</p>
              </div>
            ) : (
              <div className="incident-stream__list">
                {sortedUnresolved.map((incident) => (
                  <IncidentCard
                    key={incident.id}
                    incident={incident}
                    onClick={() => setSelectedIncident(incident)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Recent Resolved Incidents */}
          <div className="incident-stream__section">
            <h3 className="incident-stream__section-title">Recent History</h3>
            {recentResolved.length === 0 ? (
              <div className="incident-stream__empty incident-stream__empty--small">
                <p>No recent resolved incidents</p>
              </div>
            ) : (
              <div className="incident-stream__list incident-stream__list--compact">
                {recentResolved.map((incident) => (
                  <IncidentCardCompact
                    key={incident.id}
                    incident={incident}
                    onClick={() => setSelectedIncident(incident)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {selectedIncident && (
        <IncidentDetailModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
        />
      )}
    </div>
  );
}

function IncidentCard({ incident, onClick }: { incident: Incident; onClick?: () => void }) {
  const latestUpdate = incident.incident_updates[0];
  const duration = formatDuration(incident.created_at, incident.resolved_at);

  return (
    <div 
      className="incident-card"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <div className="incident-card__header">
        <span
          className="incident-card__impact"
          style={{ backgroundColor: getStatusColor(incident.impact) }}
        >
          {incident.impact}
        </span>
        <span className="incident-card__status">
          {formatIncidentStatus(incident.status)}
        </span>
      </div>
      <h4 className="incident-card__title">{incident.name}</h4>
      {latestUpdate && (
        <p className="incident-card__update">
          {latestUpdate.body.slice(0, 200)}
          {latestUpdate.body.length > 200 && '...'}
        </p>
      )}
      <div className="incident-card__meta">
        <span>Started {formatRelativeTime(incident.created_at)}</span>
        <span>Duration: {duration}</span>
        <span>Updated {formatRelativeTime(incident.updated_at)}</span>
      </div>
      {incident.components && incident.components.length > 0 && (
        <div className="incident-card__components">
          {incident.components.slice(0, 3).map((comp) => (
            <span key={comp.id} className="incident-card__component">
              {comp.name}
            </span>
          ))}
          {incident.components.length > 3 && (
            <span className="incident-card__component incident-card__component--more">
              +{incident.components.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function IncidentCardCompact({ incident, onClick }: { incident: Incident; onClick?: () => void }) {
  return (
    <div
      className="incident-card-compact"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <span
        className="incident-card-compact__dot"
        style={{ backgroundColor: getStatusColor(incident.impact) }}
      />
      <span className="incident-card-compact__title">{incident.name}</span>
      <span className="incident-card-compact__date">
        {incident.resolved_at
          ? formatRelativeTime(incident.resolved_at)
          : formatRelativeTime(incident.updated_at)}
      </span>
    </div>
  );
}

export default IncidentStream;
