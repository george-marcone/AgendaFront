import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import ContactsView from '../views/ContactsView.vue';
import { pinia } from '../stores';
import { useAuthStore } from '../stores/authStore';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/agenda',
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/agenda',
      name: 'agenda',
      component: ContactsView,
      meta: { requiresAuth: true },
    },
  ],
});

router.beforeEach((to) => {
  const authStore = useAuthStore(pinia);
  const authenticated = authStore.isAuthenticated;

  if (to.meta.requiresAuth && !authenticated) {
    return { name: 'login' };
  }

  if (to.name === 'login' && authenticated) {
    return { name: 'agenda' };
  }

  return true;
});

export default router;
