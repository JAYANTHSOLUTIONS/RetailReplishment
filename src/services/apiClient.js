// src/services/apiClient.js
// Base fetch wrapper for JSON Server.
// Default base URL reads from the Vite env variable or falls back to localhost.

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new ApiError(res.status, res.statusText, body);
  }

  return res.json();
}

export class ApiError extends Error {
  constructor(status, statusText, body) {
    super(`HTTP ${status} ${statusText}`);
    this.status     = status;
    this.statusText = statusText;
    this.body       = body;
  }
}

export const apiClient = {
  get:    (path)         => request(path),
  post:   (path, data)   => request(path, { method: 'POST',   body: JSON.stringify(data) }),
  put:    (path, data)   => request(path, { method: 'PUT',    body: JSON.stringify(data) }),
  patch:  (path, data)   => request(path, { method: 'PATCH',  body: JSON.stringify(data) }),
  delete: (path)         => request(path, { method: 'DELETE' }),
};
