const BASE_URL = import.meta.env.DEV ? 'http://localhost:3443' : '';

function getHeaders(): HeadersInit {
  const jwt = localStorage.getItem('rccb_jwt');
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (jwt) headers['Authorization'] = `Bearer ${jwt}`;
  return headers;
}

export async function login(token: string, deviceName: string): Promise<{ jwt: string }> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, device_name: deviceName }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Login failed');
  return res.json();
}

export async function setup(): Promise<{ access_token: string; message: string }> {
  const res = await fetch(`${BASE_URL}/api/auth/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Setup failed');
  return res.json();
}

export async function health() {
  const res = await fetch(`${BASE_URL}/api/health`);
  return res.json();
}

export async function uploadPhoto(file: File): Promise<{ filename: string; path: string }> {
  const formData = new FormData();
  formData.append('photo', file);

  const jwt = localStorage.getItem('rccb_jwt');
  const res = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
    body: formData,
  });

  if (!res.ok) throw new Error((await res.json()).error || 'Upload failed');
  return res.json();
}
