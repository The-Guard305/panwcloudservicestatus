// PANW Service Status API v2 Types
// Based on https://status.paloaltonetworks.com/api/v2

export type StatusIndicator = 'none' | 'minor' | 'major' | 'critical';

export type ComponentStatus = 
  | 'operational' 
  | 'degraded_performance' 
  | 'partial_outage' 
  | 'major_outage';

export type IncidentStatus = 
  | 'investigating' 
  | 'identified' 
  | 'monitoring' 
  | 'resolved' 
  | 'postmortem';

export type MaintenanceStatus = 
  | 'scheduled' 
  | 'in_progress' 
  | 'verifying' 
  | 'completed';

export type IncidentUpdateStatus = 
  | 'investigating' 
  | 'identified' 
  | 'monitoring' 
  | 'resolved' 
  | 'postmortem' 
  | 'scheduled' 
  | 'in_progress' 
  | 'verifying';

export interface PageMetadata {
  id: string;
  name: string;
  url: string;
  updated_at: string;
}

export interface Status {
  description: string;
  indicator: StatusIndicator;
}

export interface Component {
  id: string;
  name: string;
  description: string | null;
  status: ComponentStatus;
  group: boolean;
  group_id: string | null;
  only_show_if_degraded: boolean;
  showcase: boolean;
  position: number;
  start_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface IncidentUpdate {
  id: string;
  incident_id: string;
  body: string;
  status: IncidentUpdateStatus;
  created_at: string;
  updated_at: string;
  display_at: string;
}

export interface Incident {
  id: string;
  name: string;
  impact: StatusIndicator;
  status: IncidentStatus;
  incident_updates: IncidentUpdate[];
  shortlink?: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  monitoring_at: string | null;
  page_id?: string;
  components?: AffectedComponent[];
}

export interface AffectedComponent {
  id: string;
  name: string;
  status: ComponentStatus;
}

export interface ScheduledMaintenance {
  id: string;
  name: string;
  impact: StatusIndicator;
  status: MaintenanceStatus;
  incident_updates: IncidentUpdate[];
  scheduled_for: string;
  scheduled_until: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  page_id?: string;
  shortlink?: string;
  components?: AffectedComponent[];
}

// API Response Types
export interface StatusResponse {
  page: PageMetadata;
  status: Status;
}

export interface SummaryResponse {
  page: PageMetadata;
  status: Status;
  components: Component[];
  incidents: Incident[];
  scheduled_maintenances: ScheduledMaintenance[];
}

export interface ComponentsResponse {
  page: PageMetadata;
  components: Component[];
}

export interface IncidentsResponse {
  page: PageMetadata;
  incidents: Incident[];
}

export interface MaintenancesResponse {
  page: PageMetadata;
  scheduled_maintenances: ScheduledMaintenance[];
}

// Error envelope for API failures
export interface ApiError {
  error: {
    message: string;
    details?: unknown;
  };
}

// Product family type for filtering
export type ProductFamily = 'Strata' | 'Prisma' | 'Cortex' | 'Unit 42' | 'Strata Logging Service' | 'DLP' | 'Other';

// KPI Types
export interface SREKPIs {
  stabilityIndex: number; // 0-100 percentage
  daysSinceLastCritical: number | null;
  incidentSeverityMix: {
    none: number;
    minor: number;
    major: number;
    critical: number;
  };
  approximateMTTR: number | null; // in hours
  totalIncidentsLast30Days: number;
  totalMaintenancesLast30Days: number;
}
