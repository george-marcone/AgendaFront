import { apiRequest } from './apiClient';

const userEndpoint = '/User';

function toPayload(contact) {
  return {
    ...(contact.id ? { id: contact.id } : {}),
    name: contact.name.trim(),
    email: contact.email.trim(),
    phone: contact.phone.trim(),
  };
}

function toCreatePayload(contact) {
  return {
    ...toPayload(contact),
    password: contact.password,
  };
}

export const contactsApi = {
  list() {
    return apiRequest(userEndpoint, { auth: true });
  },

  getById(id) {
    return apiRequest(`${userEndpoint}/${encodeURIComponent(id)}`, { auth: true });
  },

  create(contact) {
    return apiRequest(userEndpoint, {
      auth: true,
      method: 'POST',
      body: JSON.stringify(toCreatePayload(contact)),
    });
  },

  update(contact) {
    return apiRequest(`${userEndpoint}/${encodeURIComponent(contact.id)}`, {
      auth: true,
      method: 'PUT',
      body: JSON.stringify(toPayload(contact)),
    });
  },

  remove(id) {
    return apiRequest(`${userEndpoint}/${encodeURIComponent(id)}`, {
      auth: true,
      method: 'DELETE',
    });
  },
};
