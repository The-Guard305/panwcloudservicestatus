import type { 
  StatusIndicator, 
  ComponentStatus, 
  Component, 
  Incident, 
  ScheduledMaintenance,
  ProductFamily,
  SREKPIs 
} from '../types';

/**
 * Map status indicator to display color
 */
export function getStatusColor(indicator: StatusIndicator): string {
  switch (indicator) {
    case 'none':
      return '#00ff99'; // pure neon green
    case 'minor':
      return '#ffff00'; // pure neon yellow
    case 'major':
      return '#ff6600'; // pure neon orange
    case 'critical':
      return '#ff0066'; // pure neon magenta
    default:
      return '#00ffff'; // pure cyan
  }
}

/**
 * Map component status to display color
 */
export function getComponentStatusColor(status: ComponentStatus): string {
  switch (status) {
    case 'operational':
      return '#00ff99'; // pure neon green
    case 'degraded_performance':
      return '#ffff00'; // pure neon yellow
    case 'partial_outage':
      return '#ff6600'; // pure neon orange
    case 'major_outage':
      return '#ff0066'; // pure neon magenta
    default:
      return '#00ffff'; // pure cyan
  }
}

/**
 * Format component status for display
 */
export function formatComponentStatus(status: ComponentStatus): string {
  switch (status) {
    case 'operational':
      return 'Operational';
    case 'degraded_performance':
      return 'Degraded Performance';
    case 'partial_outage':
      return 'Partial Outage';
    case 'major_outage':
      return 'Major Outage';
    default:
      return status;
  }
}

/**
 * Format incident status for display
 */
export function formatIncidentStatus(status: string): string {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Derive product family from component name
 */
export function getProductFamily(componentName: string): ProductFamily {
  const name = componentName.toLowerCase();
  
  // Check for specific services first (exact matches for specific filters)
  if (name.includes('logging')) {
    return 'Strata Logging Service';
  }
  if (/\bdlp\b/.test(name) || name.includes('data loss prevention')) {
    return 'DLP';
  }
  
  // Then check broader categories (but exclude Strata Logging Service from general Strata)
  if ((name.includes('strata') || name.includes('firewall') || name.includes('panorama') || name.includes('globalprotect') || name.includes('wildfire') || name.includes('threat vault') || name.includes('dns security') || name.includes('url filtering') || name.includes('threat prevention') || name.includes('advanced threat prevention')) 
      && !name.includes('logging')) {
    return 'Strata';
  }
  if (name.includes('prisma') || name.includes('sase') || name.includes('cloud') || name.includes('access') || name.includes('sd-wan')) {
    return 'Prisma';
  }
  if (name.includes('cortex') || name.includes('xdr') || name.includes('xsoar') || name.includes('xpanse') || name.includes('data lake') || name.includes('expander') || name.includes('xiam')) {
    return 'Cortex';
  }
  if (name.includes('unit 42') || name.includes('unit42')) {
    return 'Unit 42';
  }
  
  return 'Other';
}

/**
 * Check if component is impacted (not operational)
 */
export function isComponentImpacted(component: Component): boolean {
  return component.status !== 'operational';
}

/**
 * Format relative time
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  
  return d.toLocaleDateString();
}

/**
 * Format duration between two dates
 */
export function formatDuration(start: Date | string, end?: Date | string | null): string {
  const startDate = typeof start === 'string' ? new Date(start) : start;
  const endDate = end ? (typeof end === 'string' ? new Date(end) : end) : new Date();
  
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m`;
  return `${diffDays}d ${diffHours % 24}h`;
}

/**
 * Calculate SRE KPIs from incidents and components
 */
export function calculateKPIs(
  incidents: Incident[],
  components: Component[]
): SREKPIs {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Filter incidents from last 30 days
  const recentIncidents = incidents.filter(
    (i) => new Date(i.created_at) >= thirtyDaysAgo
  );

  // Severity mix
  const severityMix = {
    none: 0,
    minor: 0,
    major: 0,
    critical: 0,
  };
  
  recentIncidents.forEach((i) => {
    severityMix[i.impact]++;
  });

  // Days since last critical
  const criticalIncidents = incidents
    .filter((i) => i.impact === 'critical')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
  const daysSinceLastCritical = criticalIncidents.length > 0
    ? Math.floor((now.getTime() - new Date(criticalIncidents[0].created_at).getTime()) / (24 * 60 * 60 * 1000))
    : null;

  // Approximate MTTR from resolved incidents
  const resolvedIncidents = incidents.filter((i) => i.resolved_at);
  let totalResolutionTime = 0;
  let resolvedCount = 0;

  resolvedIncidents.forEach((i) => {
    if (i.resolved_at) {
      const resolutionTime = new Date(i.resolved_at).getTime() - new Date(i.created_at).getTime();
      totalResolutionTime += resolutionTime;
      resolvedCount++;
    }
  });

  const approximateMTTR = resolvedCount > 0
    ? Math.round((totalResolutionTime / resolvedCount) / (60 * 60 * 1000) * 10) / 10 // hours with 1 decimal
    : null;

  // Stability index: percentage of operational components weighted by incident severity
  const operationalCount = components.filter((c) => c.status === 'operational' && !c.group).length;
  const totalComponents = components.filter((c) => !c.group).length;
  const baseStability = totalComponents > 0 ? (operationalCount / totalComponents) * 100 : 100;
  
  // Reduce stability based on recent incidents
  const severityPenalty = 
    (severityMix.critical * 10) + 
    (severityMix.major * 5) + 
    (severityMix.minor * 2);
  
  const stabilityIndex = Math.max(0, Math.min(100, Math.round(baseStability - severityPenalty)));

  return {
    stabilityIndex,
    daysSinceLastCritical,
    incidentSeverityMix: severityMix,
    approximateMTTR,
    totalIncidentsLast30Days: recentIncidents.length,
    totalMaintenancesLast30Days: 0, // Will be set separately
  };
}

/**
 * Group components by their parent group
 */
export function groupComponents(components: Component[]): Map<string | null, Component[]> {
  const groups = new Map<string | null, Component[]>();
  
  // First, find all group components
  const groupComponents = components.filter((c) => c.group);
  groupComponents.forEach((g) => {
    groups.set(g.id, []);
  });
  
  // Add ungrouped container
  groups.set(null, []);
  
  // Assign components to groups
  components
    .filter((c) => !c.group)
    .forEach((c) => {
      const group = groups.get(c.group_id);
      if (group) {
        group.push(c);
      } else {
        groups.get(null)?.push(c);
      }
    });

  return groups;
}

/**
 * Sort maintenances by scheduled time
 */
export function sortMaintenancesByTime(maintenances: ScheduledMaintenance[]): ScheduledMaintenance[] {
  return [...maintenances].sort(
    (a, b) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime()
  );
}

/**
 * Check if maintenance is within next N days
 */
export function isMaintenanceWithinDays(maintenance: ScheduledMaintenance, days: number): boolean {
  const scheduledDate = new Date(maintenance.scheduled_for);
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return scheduledDate <= futureDate;
}
