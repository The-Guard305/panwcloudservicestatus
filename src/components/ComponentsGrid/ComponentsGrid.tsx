import { useState, useMemo } from 'react';
import type { Component, Incident, ProductFamily } from '../../types';
import type { Region } from '../../types/regions';
import { extractRegion } from '../../types/regions';
import {
  getComponentStatusColor,
  formatComponentStatus,
  getProductFamily,
  isComponentImpacted,
  formatRelativeTime,
  groupComponents,
} from '../../utils';
import { RegionalFilter } from '../RegionalFilter/RegionalFilter';
import { ComponentDetailModal } from '../ComponentDetailModal/ComponentDetailModal';
import './ComponentsGrid.css';

interface ComponentsGridProps {
  components: Component[];
  incidents: Incident[];
  loading: boolean;
  error: Error | null;
}

const PRODUCT_FAMILIES: ProductFamily[] = ['Strata', 'Prisma', 'Cortex', 'Unit 42', 'Strata Logging Service', 'DLP', 'Other'];

export function ComponentsGrid({
  components,
  incidents,
  loading,
  error,
}: ComponentsGridProps) {
  const [selectedFamily, setSelectedFamily] = useState<ProductFamily | 'All'>('All');
  const [showImpactedOnly, setShowImpactedOnly] = useState(false);
  const [selectedRegions, setSelectedRegions] = useState<Region[]>(['All']);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);

  const groupedComponents = useMemo(() => groupComponents(components), [components]);

  const filteredComponents = useMemo(() => {
    let filtered = components.filter((c) => !c.group);
    
    // Create a map of group_id to group name for parent lookups
    const groupMap = new Map(components.filter(c => c.group).map(c => [c.id, c.name]));

    if (selectedFamily !== 'All') {
      filtered = filtered.filter((c) => {
        // Check component's own name
        let family = getProductFamily(c.name);
        
        // If it's 'Other' and has a parent group, check the parent group name
        if (family === 'Other' && c.group_id) {
          const parentGroupName = groupMap.get(c.group_id);
          if (parentGroupName) {
            family = getProductFamily(parentGroupName);
          }
        }
        
        return family === selectedFamily;
      });
    }

    if (showImpactedOnly) {
      filtered = filtered.filter(isComponentImpacted);
    }

    // Apply regional filter
    if (!selectedRegions.includes('All')) {
      filtered = filtered.filter((c) => {
        const region = extractRegion(c.name, c.description);
        return selectedRegions.includes(region);
      });
    }

    // Apply search filter
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      filtered = filtered.filter((c) =>
        c.name.toLowerCase().includes(lowercasedQuery) ||
        c.description?.toLowerCase().includes(lowercasedQuery)
      );
    }

    return filtered;
  }, [components, selectedFamily, showImpactedOnly, selectedRegions, searchQuery]);

  // Count incidents per component (by name matching)
  const incidentCountByComponent = useMemo(() => {
    const counts = new Map<string, number>();
    
    incidents.forEach((incident) => {
      incident.components?.forEach((comp) => {
        const current = counts.get(comp.id) || 0;
        counts.set(comp.id, current + 1);
      });
    });
    
    return counts;
  }, [incidents]);

  const familyCounts = useMemo(() => {
    const counts: Record<ProductFamily | 'All', number> = {
      All: components.filter((c) => !c.group).length,
      Strata: 0,
      Prisma: 0,
      Cortex: 0,
      'Unit 42': 0,
      'Strata Logging Service': 0,
      DLP: 0,
      Other: 0,
    };
    
    // Create a map of group_id to group name for parent lookups
    const groupMap = new Map(components.filter(c => c.group).map(c => [c.id, c.name]));

    components
      .filter((c) => !c.group)
      .forEach((c) => {
        let family = getProductFamily(c.name);
        
        // If it's 'Other' and has a parent group, check the parent group name
        if (family === 'Other' && c.group_id) {
          const parentGroupName = groupMap.get(c.group_id);
          if (parentGroupName) {
            family = getProductFamily(parentGroupName);
          }
        }
        
        counts[family]++;
      });

    return counts;
  }, [components]);

  if (error) {
    return (
      <div className="components-grid components-grid--error">
        <h2 className="components-grid__title">Components</h2>
        <div className="components-grid__error">
          <p>Failed to load components: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="components-grid">
      <div className="components-grid__header">
        <h2 className="components-grid__title">
          Components
          <span className="components-grid__count">
            ({filteredComponents.length})
          </span>
        </h2>

        <div className="components-grid__filters">
          <input
            type="text"
            placeholder="Search components..."
            className="components-grid__search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="components-grid__family-filter">
            <button
              className={`components-grid__filter-btn ${selectedFamily === 'All' ? 'components-grid__filter-btn--active' : ''}`}
              onClick={() => setSelectedFamily('All')}
            >
              All ({familyCounts.All})
            </button>
            {PRODUCT_FAMILIES.map((family) => (
              <button
                key={family}
                className={`components-grid__filter-btn ${selectedFamily === family ? 'components-grid__filter-btn--active' : ''}`}
                onClick={() => setSelectedFamily(family)}
              >
                {family} ({familyCounts[family]})
              </button>
            ))}
          </div>

          <label className="components-grid__toggle">
            <input
              type="checkbox"
              checked={showImpactedOnly}
              onChange={(e) => setShowImpactedOnly(e.target.checked)}
            />
            <span>Show impacted only</span>
          </label>
        </div>

        <RegionalFilter
          selectedRegions={selectedRegions}
          onRegionChange={setSelectedRegions}
        />
      </div>

      {loading && components.length === 0 ? (
        <div className="components-grid__loading">
          <p>Loading components...</p>
        </div>
      ) : filteredComponents.length === 0 ? (
        <div className="components-grid__empty">
          <p>
            {showImpactedOnly
              ? 'No impacted components - all systems operational!'
              : 'No components found for the selected filter.'}
          </p>
        </div>
      ) : (
        <div className="components-grid__list">
          {filteredComponents.map((component) => {
            const incidentCount = incidentCountByComponent.get(component.id) || 0;
            const parentGroup = Array.from(groupedComponents.entries()).find(
              ([groupId]) => groupId === component.group_id
            );
            const groupName = parentGroup
              ? components.find((c) => c.id === parentGroup[0])?.name
              : null;

            return (
              <div
                key={component.id}
                className={`components-grid__item ${isComponentImpacted(component) ? 'components-grid__item--impacted' : ''}`}
                onClick={() => setSelectedComponent(component)}
                style={{ cursor: 'pointer' }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedComponent(component)}
              >
                <div
                  className="components-grid__status-dot"
                  style={{ backgroundColor: getComponentStatusColor(component.status) }}
                  title={formatComponentStatus(component.status)}
                />
                <div className="components-grid__item-info">
                  <span className="components-grid__item-name">
                    {component.name}
                  </span>
                  {groupName && (
                    <span className="components-grid__item-group">
                      {groupName}
                    </span>
                  )}
                  <span className="components-grid__item-status">
                    {formatComponentStatus(component.status)}
                  </span>
                </div>
                <div className="components-grid__item-meta">
                  {incidentCount > 0 && (
                    <span className="components-grid__incident-badge">
                      {incidentCount} incident{incidentCount !== 1 ? 's' : ''}
                    </span>
                  )}
                  <span className="components-grid__item-updated">
                    {formatRelativeTime(component.updated_at)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedComponent && (
        <ComponentDetailModal
          component={selectedComponent}
          incidents={incidents}
          onClose={() => setSelectedComponent(null)}
        />
      )}
    </div>
  );
}

export default ComponentsGrid;
