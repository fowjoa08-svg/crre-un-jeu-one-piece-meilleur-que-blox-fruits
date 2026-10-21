const JSON_HEADERS = { 'Content-Type': 'application/json' };

async function request(path, options = {}) {
  const res = await fetch(path, { credentials: 'include', headers: JSON_HEADERS, ...options });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) throw new Error(data?.error || 'Erreur réseau');
  return data;
}

export const api = {
  me: () => request('/api/me'),
  register: (username, password) =>
    request('/api/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) }),
  login: (username, password) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  save: (state) => request('/api/save', { method: 'PUT', body: JSON.stringify({ state }) }),
};
