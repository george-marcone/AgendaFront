import { apiRequest } from './apiClient';

function toLoginPayload({ email, password }) {
  return {
    email: email.trim().toLowerCase(),
    password,
  };
}

export const authApi = {
  login(credentials) {
    return apiRequest('/Auth/login', {
      method: 'POST',
      body: JSON.stringify(toLoginPayload(credentials)),
    });
  },

  authenticate(accessToken, tokenType = 'Bearer') {
    return apiRequest('/Auth/authenticate', {
      headers: {
        Authorization: `${tokenType || 'Bearer'} ${accessToken}`,
      },
    });
  },

  changeOwnPassword({ currentPassword, newPassword }) {
    return apiRequest('/User/me/password', {
      auth: true,
      method: 'PATCH',
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });
  },
};
