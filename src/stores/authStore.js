import { defineStore } from 'pinia';

const AUTH_KEY = 'agenda-front-auth';
const MOCK_USER = {
  email: 'gmarcone@gmail.com',
  password: '123456',
};

function getStorage() {
  return typeof localStorage === 'undefined' ? null : localStorage;
}

function readSession() {
  const storage = getStorage();
  const rawSession = storage?.getItem(AUTH_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession);
  } catch {
    storage.removeItem(AUTH_KEY);
    return null;
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    session: readSession(),
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.session),
  },

  actions: {
    login(email, password) {
      const validEmail = email.trim().toLowerCase() === MOCK_USER.email;
      const validPassword = password === MOCK_USER.password;

      if (!validEmail || !validPassword) {
        return false;
      }

      this.session = {
        email: MOCK_USER.email,
        authenticatedAt: new Date().toISOString(),
      };

      getStorage()?.setItem(AUTH_KEY, JSON.stringify(this.session));
      return true;
    },

    logout() {
      this.session = null;
      getStorage()?.removeItem(AUTH_KEY);
    },
  },
});
