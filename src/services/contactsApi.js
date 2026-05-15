const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
const apiBaseUrl = configuredBaseUrl.replace(/\/$/, '');
const userEndpoint = `${apiBaseUrl}/User`;

async function request(path = '', options = {}) {
  const headers = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers,
  };

  const response = await fetch(`${userEndpoint}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || `Erro ${response.status} ao acessar a API.`);
  }

  return text ? JSON.parse(text) : null;
}

function toPayload(contact) {
  return {
    ...(contact.id ? { id: contact.id } : {}),
    name: contact.name.trim(),
    email: contact.email.trim(),
    phone: contact.phone.trim(),
  };
}

export const contactsApi = {
  list() {
    return request();
  },

  getById(id) {
    return request(`/${encodeURIComponent(id)}`);
  },

  create(contact) {
    return request('', {
      method: 'POST',
      body: JSON.stringify(toPayload(contact)),
    });
  },

  update(contact) {
    return request(`/${encodeURIComponent(contact.id)}`, {
      method: 'PUT',
      body: JSON.stringify(toPayload(contact)),
    });
  },

  remove(id) {
    return request(`/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};
