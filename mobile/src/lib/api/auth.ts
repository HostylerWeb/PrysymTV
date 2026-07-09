import {
  apiRequest,
  setAccessToken,
  setRefreshToken,
} from './client';

type AuthSessionResponse = {
  accessToken: string;
  refreshToken?: string;
};

async function persistSession(data: AuthSessionResponse) {
  await setAccessToken(data.accessToken);
  if (data.refreshToken) await setRefreshToken(data.refreshToken);
}

export async function login(email: string, password: string) {
  const data = await apiRequest<AuthSessionResponse>('/auth/login', {
    method: 'POST',
    auth: false,
    body: { email, password },
  });
  await persistSession(data);
  return data;
}

export async function register(input: {
  email: string;
  username: string;
  password: string;
  displayName: string;
  gender: string;
}) {
  const data = await apiRequest<AuthSessionResponse>('/auth/register', {
    method: 'POST',
    auth: false,
    body: input,
  });
  await persistSession(data);
  return data;
}

export async function oauthGoogle(idToken: string) {
  const data = await apiRequest<AuthSessionResponse>('/auth/oauth/google', {
    method: 'POST',
    auth: false,
    body: { idToken },
  });
  await persistSession(data);
  return data;
}

export async function oauthApple(
  identityToken: string,
  authorizationCode?: string,
) {
  const data = await apiRequest<AuthSessionResponse>('/auth/oauth/apple', {
    method: 'POST',
    auth: false,
    body: {
      identityToken,
      ...(authorizationCode ? { authorizationCode } : {}),
    },
  });
  await persistSession(data);
  return data;
}

export async function oauthFacebook(accessToken: string) {
  const data = await apiRequest<AuthSessionResponse>('/auth/oauth/facebook', {
    method: 'POST',
    auth: false,
    body: { accessToken },
  });
  await persistSession(data);
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
    await setRefreshToken(null);
  }
}

export async function forgotPassword(email: string) {
  return apiRequest<{ success?: boolean; message?: string }>('/auth/forgot-password', {
    method: 'POST',
    auth: false,
    body: { email },
  });
}

export async function resetPassword(token: string, newPassword: string) {
  return apiRequest<{ success?: boolean; message?: string }>('/auth/reset-password', {
    method: 'POST',
    auth: false,
    body: { token, newPassword },
  });
}
