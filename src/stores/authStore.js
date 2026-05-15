import { defineStore } from 'pinia';
import { authApi } from '../services/authApi';
import {
  clearAuthSession,
  isSessionValid,
  normalizeAuthResponse,
  readAuthSession,
  saveAuthSession,
} from '../services/authSession';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    session: readAuthSession(),
    authChecked: false,
    loading: false,
    changingPassword: false,
  }),

  getters: {
    isAuthenticated: (state) => isSessionValid(state.session),
    user: (state) => state.session?.user || null,
  },

  actions: {
    setSession(response) {
      const session = normalizeAuthResponse(response);

      this.session = session;
      this.authChecked = true;
      saveAuthSession(session);

      return session;
    },

    async login(email, password) {
      this.loading = true;

      try {
        const response = await authApi.login({ email, password });
        return this.setSession(response);
      } finally {
        this.loading = false;
      }
    },

    async changePassword(currentPassword, newPassword) {
      this.changingPassword = true;

      try {
        return await authApi.changeOwnPassword({ currentPassword, newPassword });
      } finally {
        this.changingPassword = false;
      }
    },

    async authenticate({ force = false } = {}) {
      if (!isSessionValid(this.session)) {
        this.logout();
        return false;
      }

      if (this.authChecked && !force) {
        return true;
      }

      try {
        const response = await authApi.authenticate(this.session.accessToken, this.session.tokenType);

        if (!response?.authenticated) {
          this.logout();
          return false;
        }

        this.session = {
          ...this.session,
          user: response.user || this.session.user,
        };
        this.authChecked = true;
        saveAuthSession(this.session);

        return true;
      } catch {
        this.logout();
        return false;
      }
    },

    logout() {
      this.session = null;
      this.authChecked = false;
      clearAuthSession();
    },
  },
});
