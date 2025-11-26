import { useMemo } from 'react';
import { apiClient } from './api';
import { useApi } from './hooks';
import { calculateKPIs } from './utils';
import {
  PortfolioStrip,
  ComponentsGrid,
  IncidentStream,
  MaintenanceRadar,
  KPIPanel,
} from './components';
import './App.css';

const REFRESH_INTERVAL = 60000; // 60 seconds

function App() {
  // Fetch all data from the API
  const {
    data: summaryData,
    loading: summaryLoading,
    error: summaryError,
  } = useApi(() => apiClient.getSummary(), {
    refreshInterval: REFRESH_INTERVAL,
  });

  const {
    data: unresolvedData,
    loading: unresolvedLoading,
    error: unresolvedError,
  } = useApi(() => apiClient.getUnresolvedIncidents(), {
    refreshInterval: REFRESH_INTERVAL,
  });

  const {
    data: recentIncidentsData,
    loading: recentLoading,
    error: recentError,
  } = useApi(() => apiClient.getRecentIncidents(), {
    refreshInterval: REFRESH_INTERVAL,
  });

  const {
    data: upcomingData,
    loading: upcomingLoading,
    error: upcomingError,
  } = useApi(() => apiClient.getUpcomingMaintenances(), {
    refreshInterval: REFRESH_INTERVAL,
  });

  const {
    data: activeMaintenanceData,
    loading: activeLoading,
    error: activeError,
  } = useApi(() => apiClient.getActiveMaintenances(), {
    refreshInterval: REFRESH_INTERVAL,
  });

  const {
    data: allMaintenanceData,
    loading: allMaintenanceLoading,
    error: allMaintenanceError,
  } = useApi(() => apiClient.getAllMaintenances(), {
    refreshInterval: REFRESH_INTERVAL,
  });

  // Derive data
  const status = summaryData?.status ?? null;
  const components = summaryData?.components ?? [];
  const summaryIncidents = summaryData?.incidents ?? [];
  const summaryMaintenances = summaryData?.scheduled_maintenances ?? [];
  const unresolvedIncidents = unresolvedData?.incidents ?? [];
  const recentIncidents = recentIncidentsData?.incidents ?? [];
  const upcomingMaintenances = upcomingData?.scheduled_maintenances ?? [];
  const activeMaintenances = activeMaintenanceData?.scheduled_maintenances ?? [];
  const allMaintenances = allMaintenanceData?.scheduled_maintenances ?? [];

  // Calculate KPIs
  const kpis = useMemo(() => {
    if (recentIncidents.length === 0 && components.length === 0) {
      return null;
    }
    const baseKpis = calculateKPIs(recentIncidents, components);
    return {
      ...baseKpis,
      totalMaintenancesLast30Days: allMaintenances.length,
    };
  }, [recentIncidents, components, allMaintenances]);

  // Aggregate loading and error states
  const isLoading =
    summaryLoading ||
    unresolvedLoading ||
    recentLoading ||
    upcomingLoading ||
    activeLoading ||
    allMaintenanceLoading;

  const hasError =
    summaryError ||
    unresolvedError ||
    recentError ||
    upcomingError ||
    activeError ||
    allMaintenanceError;

  return (
    <div className="app">
      <PortfolioStrip
        status={status}
        components={components}
        incidents={summaryIncidents}
        maintenances={summaryMaintenances}
        updatedAt={summaryData?.page?.updated_at ?? null}
        loading={summaryLoading}
        error={summaryError}
      />

      <main className="app__main">
        <div className="app__left">
          <ComponentsGrid
            components={components}
            incidents={recentIncidents}
            loading={summaryLoading}
            error={summaryError}
          />
          <KPIPanel kpis={kpis} loading={isLoading} />
        </div>

        <div className="app__right">
          <IncidentStream
            unresolvedIncidents={unresolvedIncidents}
            recentIncidents={recentIncidents}
            loading={unresolvedLoading || recentLoading}
            error={unresolvedError || recentError}
          />
          <MaintenanceRadar
            upcomingMaintenances={upcomingMaintenances}
            activeMaintenances={activeMaintenances}
            allMaintenances={allMaintenances}
            loading={upcomingLoading || activeLoading || allMaintenanceLoading}
            error={upcomingError || activeError || allMaintenanceError}
          />
        </div>
      </main>

      <footer className="app__footer">
        <p>
          PANW Service Status Cockpit • Data from{' '}
          <a
            href="https://status.paloaltonetworks.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            status.paloaltonetworks.com
          </a>
        </p>
        {hasError && (
          <p className="app__footer-error">
            ⚠️ Some data may be unavailable due to API errors
          </p>
        )}
      </footer>
    </div>
  );
}

export default App;
