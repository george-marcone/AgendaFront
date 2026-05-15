import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginView from '../LoginView.vue';
import { useAuthStore } from '../../stores/authStore';

const routerMock = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRouter: () => routerMock,
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
    routerMock.push.mockClear();
  });

  it('mostra erro quando as credenciais mockadas são inválidas', async () => {
    const wrapper = mountLoginView();
    const inputs = wrapper.findAll('input');

    await inputs[0].setValue('outro@email.com');
    await inputs[1].setValue('senha-errada');
    await wrapper.find('form').trigger('submit.prevent');

    expect(wrapper.find('[role="alert"]').text()).toBe('E-mail ou senha inválidos.');
    expect(routerMock.push).not.toHaveBeenCalled();
    expect(useAuthStore().isAuthenticated).toBe(false);
  });

  it('autentica com e-mail e senha válidos e navega para a agenda', async () => {
    const wrapper = mountLoginView();
    const inputs = wrapper.findAll('input');

    await inputs[0].setValue('gmarcone@gmail.com');
    await inputs[1].setValue('123456');
    await wrapper.find('form').trigger('submit.prevent');

    expect(useAuthStore().session.email).toBe('gmarcone@gmail.com');
    expect(routerMock.push).toHaveBeenCalledWith({ name: 'agenda' });
    expect(JSON.parse(localStorage.getItem('agenda-front-auth')).email).toBe(
      'gmarcone@gmail.com',
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
