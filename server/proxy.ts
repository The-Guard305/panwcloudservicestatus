/**
 * Node.js Proxy Server for PANW Service Status API v2
 * Implements whitelist-only routing with caching and error handling
 */

import http from 'http';
import https from 'https';
import { URL } from 'url';

const PORT = 3001;
const UPSTREAM_BASE = 'https://status.paloaltonetworks.com/api/v2';
const TIMEOUT_MS = 15000;
const CACHE_TTL_MS = 30000; // 30 seconds

// Strict whitelist of allowed routes - no dynamic path concatenation
const ALLOWED_ROUTES: Record<string, string> = {
  '/api/panw-status/summary': '/summary.json',
  '/api/panw-status/status': '/status.json',
  '/api/panw-status/components': '/components.json',
  '/api/panw-status/incidents/unresolved': '/incidents/unresolved.json',
  '/api/panw-status/incidents': '/incidents.json',
  '/api/panw-status/scheduled-maintenances/upcoming': '/scheduled-maintenances/upcoming.json',
  '/api/panw-status/scheduled-maintenances/active': '/scheduled-maintenances/active.json',
  '/api/panw-status/scheduled-maintenances': '/scheduled-maintenances.json',
};

// Simple in-memory cache
interface CacheEntry {
  data: string;
  timestamp: number;
  statusCode: number;
  contentType: string;
}

const cache = new Map<string, CacheEntry>();

function getCached(key: string): CacheEntry | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  
  return entry;
}

function setCache(key: string, data: string, statusCode: number, contentType: string): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    statusCode,
    contentType,
  });
}

function sendError(
  res: http.ServerResponse,
  statusCode: number,
  message: string,
  details?: unknown
): void {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify({ error: { message, details } }));
}

function sendSuccess(
  res: http.ServerResponse,
  data: string,
  statusCode: number = 200,
  contentType: string = 'application/json'
): void {
  res.writeHead(statusCode, {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'max-age=30',
  });
  res.end(data);
}

async function fetchUpstream(upstreamPath: string): Promise<{
  data: string;
  statusCode: number;
  contentType: string;
}> {
  return new Promise((resolve, reject) => {
    const url = new URL(upstreamPath, UPSTREAM_BASE);
    
    const req = https.get(
      url.toString(),
      {
        timeout: TIMEOUT_MS,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PANW-Status-Cockpit/1.0',
        },
      },
      (response) => {
        let data = '';
        
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
          resolve({
            data,
            statusCode: response.statusCode || 500,
            contentType: response.headers['content-type'] || 'application/json',
          });
        });
      }
    );
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
  });
}

const server = http.createServer(async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    });
    res.end();
    return;
  }
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    sendError(res, 405, 'Method not allowed');
    return;
  }
  
  const requestPath = req.url?.split('?')[0] || '';
  
  // Health check endpoint
  if (requestPath === '/health') {
    sendSuccess(res, JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }
  
  // Check whitelist - exact match only, no path manipulation
  const upstreamPath = ALLOWED_ROUTES[requestPath];
  
  if (!upstreamPath) {
    sendError(res, 404, 'Endpoint not found', { 
      requestedPath: requestPath,
      allowedPaths: Object.keys(ALLOWED_ROUTES),
    });
    return;
  }
  
  // Check cache first
  const cached = getCached(requestPath);
  if (cached) {
    console.log(`[CACHE HIT] ${requestPath}`);
    sendSuccess(res, cached.data, cached.statusCode, cached.contentType);
    return;
  }
  
  // Fetch from upstream
  try {
    console.log(`[PROXY] ${requestPath} -> ${UPSTREAM_BASE}${upstreamPath}`);
    const result = await fetchUpstream(upstreamPath);
    
    // Cache successful responses
    if (result.statusCode >= 200 && result.statusCode < 300) {
      setCache(requestPath, result.data, result.statusCode, result.contentType);
    }
    
    sendSuccess(res, result.data, result.statusCode, result.contentType);
  } catch (error) {
    console.error(`[ERROR] ${requestPath}:`, error);
    sendError(
      res,
      502,
      'Failed to fetch from upstream',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
});

server.listen(PORT, () => {
  console.log(`PANW Status Proxy Server running on http://localhost:${PORT}`);
  console.log('Allowed routes:');
  Object.entries(ALLOWED_ROUTES).forEach(([frontend, upstream]) => {
    console.log(`  ${frontend} -> ${UPSTREAM_BASE}${upstream}`);
  });
});
