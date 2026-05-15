const AUTH_KEY = 'agenda-front-auth';
const MOCK_USER = {
  email: 'gmarcone@gmail.com',
  password: '123456',
};

export const authService = {
  login(email, password) {
    const validEmail = email.trim().toLowerCase() === MOCK_USER.email;
    const validPassword = password === MOCK_USER.password;

    if (!validEmail || !validPassword) {
      return false;
    }

    localStorage.setItem(
      AUTH_KEY,
      JSON.stringify({
        email: MOCK_USER.email,
        authenticatedAt: new Date().toISOString(),
      }),
    );

    return true;
  },

  logout() {
    localStorage.removeItem(AUTH_KEY);
  },

  getSession() {
    const rawSession = localStorage.getItem(AUTH_KEY);

    if (!rawSession) {
      return null;
    }

    try {
      return JSON.parse(rawSession);
    } catch {
      localStorage.removeItem(AUTH_KEY);
      return null;
    }
  },

  isAuthenticated() {
    return Boolean(this.getSession());
  },
};
