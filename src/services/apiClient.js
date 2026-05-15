import { clearAuthSession, createAuthorizationHeader } from './authSession';

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
export const apiBaseUrl = configuredBaseUrl.replace(/\/$/, '');

const MESSAGE_TRANSLATIONS = {
  'Email and password are required.': 'Informe e-mail e senha.',
  'Invalid email or password.': 'E-mail ou senha inválidos.',
};

const FIELD_TRANSLATIONS = {
  Email: 'E-mail',
  Name: 'Nome',
  Password: 'Senha',
  Phone: 'Telefone',
};

const VALIDATION_TRANSLATIONS = {
  'Email already exists': 'E-mail já cadastrado.',
  'Email is invalid': 'E-mail inválido.',
  'Email is required': 'E-mail obrigatório.',
  'Name is required': 'Nome obrigatório.',
  'Password is required': 'Senha obrigatória.',
  'Password must contain at least 8 characters': 'A senha deve ter pelo menos 8 caracteres.',
  'Phone already exists': 'Telefone já cadastrado.',
  'Phone is invalid': 'Telefone inválido.',
  'Phone is required': 'Telefone obrigatório.',
};

export class ApiError extends Error {
  constructor(message, status = 0, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

function translateMessage(message) {
  return MESSAGE_TRANSLATIONS[message] || VALIDATION_TRANSLATIONS[message] || message;
}

function formatValidationError(error) {
  const field = FIELD_TRANSLATIONS[error?.field] || error?.field;
  const message = translateMessage(error?.message || '');

  return field ? `${field}: ${message}` : message;
}

function parseResponseText(text) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function formatApiError(status, data, text) {
  if (Array.isArray(data?.errors)) {
    return data.errors.map(formatValidationError).filter(Boolean).join(' ');
  }

  if (data?.message) {
    return translateMessage(data.message);
  }

  if (status === 401) {
    return 'Sessão expirada ou credenciais inválidas. Faça login novamente.';
  }

  if (status === 403) {
    return 'Você não tem autorização para executar esta ação.';
  }

  return text || `Erro ${status} ao acessar a API.`;
}

export async function apiRequest(endpoint, options = {}) {
  const { auth = false, ...fetchOptions } = options;
  const headers = {
    Accept: 'application/json',
    ...(fetchOptions.body ? { 'Content-Type': 'application/json' } : {}),
    ...fetchOptions.headers,
  };

  if (auth) {
    const authorizationHeader = createAuthorizationHeader();

    if (!authorizationHeader) {
      throw new ApiError('Sua sessão expirou. Faça login novamente.', 401);
    }

    headers.Authorization = authorizationHeader;
  }

  let response;

  try {
    response = await fetch(`${apiBaseUrl}${endpoint}`, {
      ...fetchOptions,
      headers,
    });
  } catch {
    throw new ApiError(
      `Não foi possível conectar à API em ${apiBaseUrl}${endpoint}. Verifique se o CoreFlow está rodando e se o proxy do front aponta para a porta correta.`,
    );
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  const data = parseResponseText(text);

  if (!response.ok) {
    if (response.status === 401 && auth) {
      clearAuthSession();
    }

    throw new ApiError(formatApiError(response.status, data, text), response.status, data);
  }

  return data;
}
