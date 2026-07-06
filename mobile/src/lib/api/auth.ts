import { apiRequest, setAccessToken } from './client';

type AuthSessionResponse = { accessToken: string };

export async function login(email: string, password: string) {
  const data = await apiRequest<AuthSessionResponse>('/auth/login', {
    method: 'POST',
    auth: false,
    body: { email, password },
  });
  await setAccessToken(data.accessToken);
  return data;
}

export async function register(input: {
  email: string;
  username: string;
  password: string;
  displayName: string;
}) {
  const data = await apiRequest<AuthSessionResponse>('/auth/register', {
    method: 'POST',
    auth: false,
    body: input,
  });
  await setAccessToken(data.accessToken);
  return data;
}

export async function logoutApi() {
  try {
    await apiRequest<{ message: string }>('/auth/logout', {
      method: 'POST',
      auth: false,
    });
  } finally {
    await setAccessToken(null);
  }
}
