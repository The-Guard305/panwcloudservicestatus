import { useMemo } from 'react';
import type { ScheduledMaintenance } from '../../types';
import {
  getStatusColor,
  formatIncidentStatus,
  sortMaintenancesByTime,
} from '../../utils';
import './MaintenanceRadar.css';

interface MaintenanceRadarProps {
  upcomingMaintenances: ScheduledMaintenance[];
  activeMaintenances: ScheduledMaintenance[];
  allMaintenances: ScheduledMaintenance[];
  loading: boolean;
  error: Error | null;
}

export function MaintenanceRadar({
  upcomingMaintenances,
  activeMaintenances,
  allMaintenances,
  loading,
  error,
}: MaintenanceRadarProps) {
  const sortedUpcoming = useMemo(
    () => sortMaintenancesByTime(upcomingMaintenances),
    [upcomingMaintenances]
  );

  const sortedActive = useMemo(
    () => sortMaintenancesByTime(activeMaintenances),
    [activeMaintenances]
  );

  const recentCompleted = useMemo(
    () =>
      allMaintenances
        .filter((m) => m.status === 'completed')
        .slice(0, 5),
    [allMaintenances]
  );

  // Create timeline data for next 30 days
  const timelineData = useMemo(() => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    return [...sortedUpcoming, ...sortedActive]
      .filter((m) => {
        const scheduledDate = new Date(m.scheduled_for);
        return scheduledDate <= thirtyDaysFromNow;
      })
      .map((m) => {
        const scheduledDate = new Date(m.scheduled_for);
        const daysFromNow = Math.ceil(
          (scheduledDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
        );
        const position = Math.max(0, Math.min(100, (daysFromNow / 30) * 100));
        return { ...m, daysFromNow, position };
      });
  }, [sortedUpcoming, sortedActive]);

  if (error) {
    return (
      <div className="maintenance-radar maintenance-radar--error">
        <h2 className="maintenance-radar__title">Maintenance Radar</h2>
        <div className="maintenance-radar__error">
          <p>Failed to load maintenances: {error.message}</p>
        </div>
      </div>
    );
  }

  const totalActive = sortedActive.length + sortedUpcoming.length;

  return (
    <div className="maintenance-radar">
      <h2 className="maintenance-radar__title">
        Maintenance Radar
        {totalActive > 0 && (
          <span className="maintenance-radar__badge">
            {totalActive} Scheduled
          </span>
        )}
      </h2>

      {loading && upcomingMaintenances.length === 0 ? (
        <div className="maintenance-radar__loading">
          <p>Loading maintenance schedule...</p>
        </div>
      ) : (
        <>
          {/* Timeline visualization */}
          <div className="maintenance-radar__timeline">
            <div className="maintenance-radar__timeline-header">
              <span>Today</span>
              <span>30 days</span>
            </div>
            <div className="maintenance-radar__timeline-track">
              {timelineData.map((m) => (
                <div
                  key={m.id}
                  className={`maintenance-radar__timeline-marker ${m.status === 'in_progress' ? 'maintenance-radar__timeline-marker--active' : ''}`}
                  style={{
                    left: `${m.position}%`,
                    backgroundColor: getStatusColor(m.impact),
                  }}
                  title={`${m.name} - ${m.daysFromNow <= 0 ? 'Active' : `In ${m.daysFromNow} days`}`}
                />
              ))}
            </div>
          </div>

          {/* Active Maintenances */}
          {sortedActive.length > 0 && (
            <div className="maintenance-radar__section">
              <h3 className="maintenance-radar__section-title">
                <span className="maintenance-radar__pulse" />
                In Progress
              </h3>
              <div className="maintenance-radar__list">
                {sortedActive.map((maintenance) => (
                  <MaintenanceCard key={maintenance.id} maintenance={maintenance} />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Maintenances */}
          <div className="maintenance-radar__section">
            <h3 className="maintenance-radar__section-title">Upcoming</h3>
            {sortedUpcoming.length === 0 ? (
              <div className="maintenance-radar__empty">
                <p>No scheduled maintenances</p>
              </div>
            ) : (
              <div className="maintenance-radar__list">
                {sortedUpcoming.slice(0, 5).map((maintenance) => (
                  <MaintenanceCard key={maintenance.id} maintenance={maintenance} />
                ))}
                {sortedUpcoming.length > 5 && (
                  <div className="maintenance-radar__more">
                    +{sortedUpcoming.length - 5} more scheduled
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recent Completed */}
          {recentCompleted.length > 0 && (
            <div className="maintenance-radar__section">
              <h3 className="maintenance-radar__section-title">Recently Completed</h3>
              <div className="maintenance-radar__list maintenance-radar__list--compact">
                {recentCompleted.map((maintenance) => (
                  <MaintenanceCardCompact key={maintenance.id} maintenance={maintenance} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MaintenanceCard({ maintenance }: { maintenance: ScheduledMaintenance }) {
  const scheduledFor = new Date(maintenance.scheduled_for);
  const scheduledUntil = new Date(maintenance.scheduled_until);
  
  const formatDateTime = (date: Date) => {
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`maintenance-card ${maintenance.status === 'in_progress' ? 'maintenance-card--active' : ''}`}>
      <div className="maintenance-card__header">
        <span
          className="maintenance-card__impact"
          style={{ backgroundColor: getStatusColor(maintenance.impact) }}
        >
          {maintenance.impact}
        </span>
        <span className="maintenance-card__status">
          {formatIncidentStatus(maintenance.status)}
        </span>
      </div>
      <h4 className="maintenance-card__title">{maintenance.name}</h4>
      <div className="maintenance-card__window">
        <span className="maintenance-card__window-label">Window:</span>
        <span className="maintenance-card__window-time">
          {formatDateTime(scheduledFor)} - {formatDateTime(scheduledUntil)}
        </span>
      </div>
      {maintenance.components && maintenance.components.length > 0 && (
        <div className="maintenance-card__components">
          {maintenance.components.slice(0, 3).map((comp) => (
            <span key={comp.id} className="maintenance-card__component">
              {comp.name}
            </span>
          ))}
          {maintenance.components.length > 3 && (
            <span className="maintenance-card__component maintenance-card__component--more">
              +{maintenance.components.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function MaintenanceCardCompact({ maintenance }: { maintenance: ScheduledMaintenance }) {
  const completedAt = maintenance.resolved_at
    ? new Date(maintenance.resolved_at).toLocaleDateString()
    : 'N/A';

  return (
    <div className="maintenance-card-compact">
      <span
        className="maintenance-card-compact__dot"
        style={{ backgroundColor: getStatusColor(maintenance.impact) }}
      />
      <span className="maintenance-card-compact__title">{maintenance.name}</span>
      <span className="maintenance-card-compact__date">{completedAt}</span>
    </div>
  );
}

export default MaintenanceRadar;
