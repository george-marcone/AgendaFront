export const AUTH_SESSION_KEY = 'agenda-front-auth';

const EXPIRATION_SKEW_MS = 30_000;

export function getStorage() {
  return typeof localStorage === 'undefined' ? null : localStorage;
}

export function normalizeAuthResponse(response) {
  const accessToken = response?.accessToken || '';
  const tokenType = response?.tokenType || 'Bearer';
  const expiresAt = response?.expiresAt || '';
  const user = response?.user || null;

  if (!accessToken || !expiresAt || !user) {
    throw new Error('Resposta de autenticação inválida.');
  }

  return {
    accessToken,
    tokenType,
    expiresAt,
    user,
    authenticatedAt: new Date().toISOString(),
  };
}

export function isSessionValid(session) {
  if (!session?.accessToken || !session?.expiresAt) {
    return false;
  }

  const expiresTime = Date.parse(session.expiresAt);

  return !Number.isNaN(expiresTime) && expiresTime - EXPIRATION_SKEW_MS > Date.now();
}

export function readAuthSession() {
  const storage = getStorage();
  const rawSession = storage?.getItem(AUTH_SESSION_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    const session = JSON.parse(rawSession);

    if (!isSessionValid(session)) {
      storage.removeItem(AUTH_SESSION_KEY);
      return null;
    }

    return session;
  } catch {
    storage.removeItem(AUTH_SESSION_KEY);
    return null;
  }
}

export function saveAuthSession(session) {
  getStorage()?.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

export function clearAuthSession() {
  getStorage()?.removeItem(AUTH_SESSION_KEY);
}

export function createAuthorizationHeader(session = readAuthSession()) {
  if (!isSessionValid(session)) {
    return null;
  }

  return `${session.tokenType || 'Bearer'} ${session.accessToken}`;
}
