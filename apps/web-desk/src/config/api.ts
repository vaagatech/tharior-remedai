/**
 * RemedAI Production API Client
 * Dynamically resolves API Gateway endpoints from runtime env-config.json, Vite build args, or local settings.
 */

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('remedai_api_gateway_url');
    if (custom && custom.trim()) return custom.trim().replace(/\/$/, '');

    const runtimeEnv = (window as any).__ENV__?.VITE_API_BASE_URL;
    if (runtimeEnv && runtimeEnv.trim() && !runtimeEnv.includes('undefined')) {
      return runtimeEnv.trim().replace(/\/$/, '');
    }
  }

  const viteEnv = import.meta.env.VITE_API_BASE_URL;
  if (viteEnv && viteEnv.trim() && !viteEnv.includes('undefined')) {
    return viteEnv.trim().replace(/\/$/, '');
  }

  return '';
}

export function getWsBaseUrl(): string {
  const apiBase = getApiBaseUrl();
  if (!apiBase) {
    if (typeof window !== 'undefined') {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${proto}//${window.location.host}/ws/events`;
    }
    return 'ws://localhost:8000/ws/events';
  }
  const wsUrl = apiBase.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
  return `${wsUrl}/ws/events`;
}

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = baseUrl ? `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}` : endpoint;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`API Error ${response.status} (${url}): ${errorText}`);
  }

  return response.json();
}
