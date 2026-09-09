export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export function getApiUrl(path) {
  if (!path) return API_BASE_URL;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${cleanPath}` : cleanPath;
}
