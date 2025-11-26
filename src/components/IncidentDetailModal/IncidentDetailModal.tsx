import type { Incident } from '../../types/api';
import { formatRelativeTime, formatDuration, getStatusColor } from '../../utils/statusHelpers';
import './IncidentDetailModal.css';

interface IncidentDetailModalProps {
  incident: Incident;
  onClose: () => void;
}

export function IncidentDetailModal({ incident, onClose }: IncidentDetailModalProps) {
  const sortedUpdates = [...incident.incident_updates].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const duration = incident.resolved_at
    ? formatDuration(incident.created_at, incident.resolved_at)
    : formatDuration(incident.created_at);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-section">
            <h2 className="modal-title">{incident.name}</h2>
            <div className="modal-badges">
              <span
                className="status-badge"
                style={{ backgroundColor: getStatusColor(incident.impact) }}
              >
                {incident.impact.toUpperCase()}
              </span>
              <span className={`incident-status-badge status-${incident.status}`}>
                {incident.status.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="detail-section">
            <h3>Incident Details</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Started:</span>
                <span className="detail-value">{formatRelativeTime(incident.created_at)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Duration:</span>
                <span className="detail-value">{duration}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Last Updated:</span>
                <span className="detail-value">{formatRelativeTime(incident.updated_at)}</span>
              </div>
              {incident.resolved_at && (
                <div className="detail-item">
                  <span className="detail-label">Resolved:</span>
                  <span className="detail-value">{formatRelativeTime(incident.resolved_at)}</span>
                </div>
              )}
              {incident.monitoring_at && (
                <div className="detail-item">
                  <span className="detail-label">Monitoring Since:</span>
                  <span className="detail-value">{formatRelativeTime(incident.monitoring_at)}</span>
                </div>
              )}
              {incident.shortlink && (
                <div className="detail-item">
                  <span className="detail-label">Status Page:</span>
                  <a href={incident.shortlink} target="_blank" rel="noopener noreferrer" className="detail-link">
                    View on Status Page →
                  </a>
                </div>
              )}
            </div>
          </div>

          {incident.components && incident.components.length > 0 && (
            <div className="detail-section">
              <h3>Affected Components ({incident.components.length})</h3>
              <div className="affected-components">
                {incident.components.map((component) => (
                  <div key={component.id} className="component-chip">
                    <span className="component-name">{component.name}</span>
                    <span className="component-status">{component.status.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="detail-section">
            <h3>Incident Timeline ({sortedUpdates.length} updates)</h3>
            <div className="incident-timeline">
              {sortedUpdates.map((update) => (
                <div key={update.id} className="timeline-item">
                  <div className="timeline-marker">
                    <div className={`timeline-dot status-${update.status}`} />
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <span className={`timeline-status status-${update.status}`}>
                        {update.status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <span className="timeline-time">{formatRelativeTime(update.created_at)}</span>
                    </div>
                    <div className="timeline-body">{update.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
