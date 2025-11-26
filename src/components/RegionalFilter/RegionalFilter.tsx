import type { Region } from '../../types/regions';
import { ALL_REGIONS, getRegionColor } from '../../types/regions';
import './RegionalFilter.css';

interface RegionalFilterProps {
  selectedRegions: Region[];
  onRegionChange: (regions: Region[]) => void;
}

export function RegionalFilter({ selectedRegions, onRegionChange }: RegionalFilterProps) {
  const handleRegionToggle = (region: Region) => {
    if (region === 'All') {
      onRegionChange(['All']);
      return;
    }

    const withoutAll = selectedRegions.filter(r => r !== 'All');
    
    if (withoutAll.includes(region)) {
      const filtered = withoutAll.filter(r => r !== region);
      onRegionChange(filtered.length === 0 ? ['All'] : filtered);
    } else {
      onRegionChange([...withoutAll, region]);
    }
  };

  const isSelected = (region: Region) => {
    if (region === 'All') return selectedRegions.includes('All');
    return !selectedRegions.includes('All') && selectedRegions.includes(region);
  };

  return (
    <div className="regional-filter">
      <div className="filter-label">
        <span className="filter-icon">🌍</span>
        <span>Regions</span>
      </div>
      <div className="region-chips">
        {ALL_REGIONS.map(region => (
          <button
            key={region}
            className={`region-chip ${isSelected(region) ? 'selected' : ''}`}
            onClick={() => handleRegionToggle(region)}
            style={{
              borderColor: isSelected(region) ? getRegionColor(region) : undefined,
              backgroundColor: isSelected(region) ? `${getRegionColor(region)}15` : undefined,
            }}
          >
            <span className="region-name">{region}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
