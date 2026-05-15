import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginView from '../LoginView.vue';
import { useAuthStore } from '../../stores/authStore';

const routerMock = vi.hoisted(() => ({
  push: vi.fn(),
}));

const authApiMock = vi.hoisted(() => ({
  login: vi.fn(),
  authenticate: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRouter: () => routerMock,
}));

vi.mock('../../services/authApi', () => ({
  authApi: authApiMock,
}));

function mountLoginView() {
  const pinia = createPinia();
  setActivePinia(pinia);

  return mount(LoginView, {
    global: {
      plugins: [pinia],
    },
  });
}

describe('LoginView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authApiMock.login.mockResolvedValue({
      accessToken: 'jwt-token',
      tokenType: 'Bearer',
      expiresAt: '2099-01-01T00:00:00.000Z',
      user: {
        id: 'user-1',
        name: 'Admin',
        email: 'admin@coreflow.local',
      },
    });
  });

  it('mostra erro quando a API rejeita as credenciais', async () => {
    authApiMock.login.mockRejectedValueOnce(new Error('E-mail ou senha inválidos.'));
    const wrapper = mountLoginView();
    const inputs = wrapper.findAll('input');

    await inputs[0].setValue('outro@email.com');
    await inputs[1].setValue('senha-errada');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(authApiMock.login).toHaveBeenCalledWith({
      email: 'outro@email.com',
      password: 'senha-errada',
    });
    expect(wrapper.find('[role="alert"]').text()).toBe('E-mail ou senha inválidos.');
    expect(routerMock.push).not.toHaveBeenCalled();
    expect(useAuthStore().isAuthenticated).toBe(false);
  });

  it('autentica com e-mail e senha válidos e navega para a agenda', async () => {
    const wrapper = mountLoginView();
    const inputs = wrapper.findAll('input');

    await inputs[0].setValue('admin@coreflow.local');
    await inputs[1].setValue('Admin@123456');
    await wrapper.find('form').trigger('submit.prevent');
    await flushPromises();

    expect(authApiMock.login).toHaveBeenCalledWith({
      email: 'admin@coreflow.local',
      password: 'Admin@123456',
    });
    expect(useAuthStore().session.user.email).toBe('admin@coreflow.local');
    expect(routerMock.push).toHaveBeenCalledWith({ name: 'agenda' });
    expect(JSON.parse(localStorage.getItem('agenda-front-auth')).accessToken).toBe('jwt-token');
    expect(JSON.parse(localStorage.getItem('agenda-front-auth')).user.email).toBe(
      'admin@coreflow.local',
    );
  });

  it('alterna a visibilidade da senha no formulário', async () => {
    const wrapper = mountLoginView();
    const passwordInput = wrapper.find('input[autocomplete="current-password"]');

    expect(passwordInput.attributes('type')).toBe('password');

    await wrapper.find('button[aria-label="Mostrar senha"]').trigger('click');

    expect(passwordInput.attributes('type')).toBe('text');
  });
});
