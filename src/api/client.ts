/**
 * API Client for PANW Service Status API v2
 * Routes through local proxy to handle CORS
 */

import type {
  StatusResponse,
  SummaryResponse,
  ComponentsResponse,
  IncidentsResponse,
  MaintenancesResponse,
  ApiError,
} from '../types';

const API_BASE = '/api/panw-status';
const TIMEOUT_MS = 10000;

class ApiClientError extends Error {
  statusCode?: number;
  details?: unknown;

  constructor(message: string, statusCode?: number, details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

async function fetchWithTimeout<T>(
  url: string,
  timeoutMs: number = TIMEOUT_MS
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorDetails: unknown;
      try {
        const errorBody = (await response.json()) as ApiError;
        errorDetails = errorBody.error;
      } catch {
        errorDetails = await response.text();
      }
      throw new ApiClientError(
        `API request failed: ${response.status} ${response.statusText}`,
        response.status,
        errorDetails
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof ApiClientError) {
      throw error;
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiClientError('Request timed out', undefined, { timeout: timeoutMs });
    }
    throw new ApiClientError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      undefined,
      error
    );
  }
}

export const apiClient = {
  /**
   * Get overall status rollup
   */
  async getStatus(): Promise<StatusResponse> {
    return fetchWithTimeout<StatusResponse>(`${API_BASE}/status`);
  },

  /**
   * Get full summary including components, incidents, and maintenances
   */
  async getSummary(): Promise<SummaryResponse> {
    return fetchWithTimeout<SummaryResponse>(`${API_BASE}/summary`);
  },

  /**
   * Get all components
   */
  async getComponents(): Promise<ComponentsResponse> {
    return fetchWithTimeout<ComponentsResponse>(`${API_BASE}/components`);
  },

  /**
   * Get unresolved incidents
   */
  async getUnresolvedIncidents(): Promise<IncidentsResponse> {
    return fetchWithTimeout<IncidentsResponse>(`${API_BASE}/incidents/unresolved`);
  },

  /**
   * Get recent incidents (up to 50)
   */
  async getRecentIncidents(): Promise<IncidentsResponse> {
    return fetchWithTimeout<IncidentsResponse>(`${API_BASE}/incidents`);
  },

  /**
   * Get upcoming scheduled maintenances
   */
  async getUpcomingMaintenances(): Promise<MaintenancesResponse> {
    return fetchWithTimeout<MaintenancesResponse>(
      `${API_BASE}/scheduled-maintenances/upcoming`
    );
  },

  /**
   * Get active (in progress) maintenances
   */
  async getActiveMaintenances(): Promise<MaintenancesResponse> {
    return fetchWithTimeout<MaintenancesResponse>(
      `${API_BASE}/scheduled-maintenances/active`
    );
  },

  /**
   * Get all recent maintenances
   */
  async getAllMaintenances(): Promise<MaintenancesResponse> {
    return fetchWithTimeout<MaintenancesResponse>(`${API_BASE}/scheduled-maintenances`);
  },
};

export { ApiClientError };
export default apiClient;
