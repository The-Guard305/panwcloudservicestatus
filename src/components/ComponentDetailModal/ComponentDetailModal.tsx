import type { Component, Incident } from '../../types/api';
import { getComponentStatusColor, formatRelativeTime } from '../../utils/statusHelpers';
import { extractRegion, getRegionColor } from '../../types/regions';
import './ComponentDetailModal.css';

interface ComponentDetailModalProps {
  component: Component;
  incidents: Incident[];
  onClose: () => void;
}

export function ComponentDetailModal({ component, incidents, onClose }: ComponentDetailModalProps) {
  const region = extractRegion(component.name, component.description);
  const relatedIncidents = incidents.filter(incident =>
    incident.components?.some(c => c.id === component.id)
  );

  const historicalIncidents = relatedIncidents.filter(i => i.status === 'resolved' || i.status === 'postmortem');
  const activeIncidents = relatedIncidents.filter(i => i.status !== 'resolved' && i.status !== 'postmortem');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-section">
            <h2 className="modal-title">{component.name}</h2>
            <div className="modal-badges">
              <span
                className="status-badge"
                style={{ backgroundColor: getComponentStatusColor(component.status) }}
              >
                {component.status.replace(/_/g, ' ').toUpperCase()}
              </span>
              <span
                className="region-badge"
                style={{
                  backgroundColor: `${getRegionColor(region)}20`,
                  borderColor: getRegionColor(region),
                }}
              >
                {region}
              </span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {component.description && (
            <div className="detail-section">
              <h3>Description</h3>
              <p>{component.description}</p>
            </div>
          )}

          <div className="detail-section">
            <h3>Status Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Current Status:</span>
                <span className="detail-value">{component.status.replace(/_/g, ' ')}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Last Updated:</span>
                <span className="detail-value">{formatRelativeTime(component.updated_at)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Component ID:</span>
                <span className="detail-value">{component.id}</span>
              </div>
              {component.start_date && (
                <div className="detail-item">
                  <span className="detail-label">Start Date:</span>
                  <span className="detail-value">{new Date(component.start_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {activeIncidents.length > 0 && (
            <div className="detail-section">
              <h3>Active Incidents ({activeIncidents.length})</h3>
              <div className="incidents-list">
                {activeIncidents.map(incident => (
                  <div key={incident.id} className="incident-card">
                    <div className="incident-header">
                      <span className="incident-name">{incident.name}</span>
                      <span className={`incident-impact impact-${incident.impact}`}>
                        {incident.impact}
                      </span>
                    </div>
                    <div className="incident-meta">
                      <span>{incident.status.replace(/_/g, ' ')}</span>
                      <span>•</span>
                      <span>{formatRelativeTime(incident.created_at)}</span>
                    </div>
                    {incident.incident_updates[0] && (
                      <div className="incident-update">
                        {incident.incident_updates[0].body}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {historicalIncidents.length > 0 && (
            <div className="detail-section">
              <h3>Recent History ({historicalIncidents.length} resolved)</h3>
              <div className="history-timeline">
                {historicalIncidents.slice(0, 5).map(incident => (
                  <div key={incident.id} className="history-item">
                    <div className="history-marker" />
                    <div className="history-content">
                      <div className="history-title">{incident.name}</div>
                      <div className="history-meta">
                        <span className={`incident-impact impact-${incident.impact}`}>
                          {incident.impact}
                        </span>
                        <span>•</span>
                        <span>{formatRelativeTime(incident.created_at)}</span>
                        {incident.resolved_at && (
                          <>
                            <span>→</span>
                            <span>{formatRelativeTime(incident.resolved_at)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {relatedIncidents.length === 0 && (
            <div className="detail-section no-incidents">
              <div className="no-incidents-icon">✓</div>
              <p>No incidents recorded for this component</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
