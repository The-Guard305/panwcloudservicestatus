// Regional filtering types for PANW services

export type Region = 
  | 'US-East' 
  | 'US-West' 
  | 'EU-West' 
  | 'EU-Central'
  | 'APAC-East'
  | 'APAC-South'
  | 'Global'
  | 'All';

export interface RegionFilter {
  selected: Region[];
  available: Region[];
}

// Extract region from component name or description
export function extractRegion(name: string, description?: string | null): Region {
  const text = `${name} ${description || ''}`.toLowerCase();
  
  if (text.includes('us-east') || text.includes('virginia') || text.includes('n. virginia') || text.includes('ohio') || text.includes('canada')) return 'US-East';
  if (text.includes('us-west') || text.includes('oregon') || text.includes('california') || text.includes('n. california')) return 'US-West';
  if (text.includes('eu-west') || text.includes('ireland') || text.includes('london') || text.includes('paris') || text.includes('netherlands')) return 'EU-West';
  if (text.includes('eu-central') || text.includes('frankfurt') || text.includes('germany') || text.includes('zurich')) return 'EU-Central';
  if (text.includes('apac-east') || text.includes('tokyo') || text.includes('seoul') || text.includes('hong kong') || text.includes('osaka')) return 'APAC-East';
  if (text.includes('apac-south') || text.includes('mumbai') || text.includes('sydney') || text.includes('singapore') || text.includes('australia') || text.includes('india')) return 'APAC-South';
  
  return 'Global';
}

export const ALL_REGIONS: Region[] = [
  'All',
  'Global',
  'US-East',
  'US-West',
  'EU-West',
  'EU-Central',
  'APAC-East',
  'APAC-South',
];

export function getRegionColor(region: Region): string {
  switch (region) {
    case 'US-East': return '#00ffff'; // pure cyan
    case 'US-West': return '#cc00ff'; // pure purple
    case 'EU-West': return '#00ff99'; // pure green
    case 'EU-Central': return '#66ff00'; // pure lime
    case 'APAC-East': return '#ff6600'; // pure orange
    case 'APAC-South': return '#ff0066'; // pure magenta
    case 'Global': return '#00ccff'; // bright cyan
    default: return '#00ffff'; // pure cyan
  }
}
