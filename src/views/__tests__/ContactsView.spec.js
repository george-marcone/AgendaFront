import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ContactsView from '../ContactsView.vue';

const routerMock = vi.hoisted(() => ({
  push: vi.fn(),
}));

const contactsApiMock = vi.hoisted(() => ({
  list: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRouter: () => routerMock,
}));

vi.mock('../../services/contactsApi', () => ({
  contactsApi: contactsApiMock,
}));

function mountContactsView() {
  const pinia = createPinia();
  setActivePinia(pinia);

  return mount(ContactsView, {
    global: {
      plugins: [pinia],
    },
  });
}

describe('ContactsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    contactsApiMock.list.mockResolvedValue([]);
    contactsApiMock.create.mockResolvedValue(null);
    contactsApiMock.update.mockResolvedValue(null);
    contactsApiMock.getById.mockResolvedValue(null);
    contactsApiMock.remove.mockResolvedValue(null);
  });

  it('exibe primeiro e ultimo nome da pessoa logada acima do botao sair', async () => {
    localStorage.setItem(
      'agenda-front-auth',
      JSON.stringify({
        accessToken: 'jwt-token',
        tokenType: 'Bearer',
        expiresAt: '2099-01-01T00:00:00.000Z',
        user: {
          id: 'user-1',
          name: 'George Henrique Silva',
          email: 'george@email.com',
        },
      }),
    );

    const wrapper = mountContactsView();
    await flushPromises();

    expect(wrapper.find('.logged-user').text()).toBe('George Silva');
    expect(wrapper.find('.topbar-actions .ghost-button').text()).toContain('Sair');
  });

  it('exibe a lista ordenada pelo registro mais recente quando a API fornece data', async () => {
    contactsApiMock.list.mockResolvedValueOnce([
      {
        id: 'older-contact',
        name: 'Contato Antigo',
        email: 'antigo@email.com',
        phone: '+5511900000000',
        createdAt: '2026-05-10T10:00:00.000Z',
      },
      {
        id: 'newer-contact',
        name: 'Contato Novo',
        email: 'novo@email.com',
        phone: '+5581997236704',
        createdAt: '2026-05-15T10:00:00.000Z',
      },
    ]);

    const wrapper = mountContactsView();
    await flushPromises();

    const rows = wrapper.findAll('tbody tr');
    expect(rows[0].text()).toContain('Contato Novo');
    expect(rows[1].text()).toContain('Contato Antigo');
  });

  it('cadastra um contato pelo formulário usando a store do Pinia', async () => {
    contactsApiMock.list
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({
        value: [
          {
            id: 'contact-1',
            name: 'Ana Silva',
            email: 'ana@email.com',
            phone: '+5581997236704',
          },
        ],
      });

    const wrapper = mountContactsView();
    await flushPromises();

    const inputs = wrapper.findAll('.contact-form input');
    await inputs[0].setValue('Ana Silva');
    await inputs[1].setValue('ana@email.com');
    await inputs[2].setValue('81997236704');
    await inputs[3].setValue('User@123456');

    expect(inputs[0].attributes('maxlength')).toBe('50');
    expect(inputs[1].attributes('maxlength')).toBe('40');
    expect(inputs[2].attributes('maxlength')).toBe('19');
    expect(inputs[2].element.value).toBe('+55 (81) 99723-6704');
    expect(wrapper.text()).toContain('11/11 números');

    await wrapper.find('form.contact-form').trigger('submit.prevent');
    await flushPromises();

    expect(contactsApiMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Ana Silva',
        email: 'ana@email.com',
        phone: '+5581997236704',
        password: 'User@123456',
      }),
    );
    expect(wrapper.text()).toContain('Contato cadastrado.');
    expect(wrapper.text()).toContain('Ana Silva');
    expect(wrapper.text()).toContain('+55 (81) 99723-6704');
  });

  it('preenche o formulário ao editar e envia a alteração do contato', async () => {
    contactsApiMock.list
      .mockResolvedValueOnce([
        {
          id: 'contact-1',
          name: 'George Marcone',
          email: 'george@email.com',
          phone: '+5511900000000',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'contact-1',
          name: 'George Marcone',
          email: 'george@email.com',
          phone: '+5511988887777',
        },
      ]);

    const wrapper = mountContactsView();
    await flushPromises();

    await wrapper.find('button[aria-label="Editar contato"]').trigger('click');

    const inputs = wrapper.findAll('.contact-form input');
    expect(inputs[0].element.value).toBe('George Marcone');
    expect(inputs[1].element.value).toBe('george@email.com');

    await inputs[2].setValue('11988887777');

    expect(inputs[2].element.value).toBe('+55 (11) 98888-7777');

    await wrapper.find('form.contact-form').trigger('submit.prevent');
    await flushPromises();

    expect(contactsApiMock.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'contact-1',
        name: 'George Marcone',
        email: 'george@email.com',
        phone: '+5511988887777',
      }),
    );
    expect(wrapper.text()).toContain('Contato atualizado.');
    expect(wrapper.text()).toContain('+55 (11) 98888-7777');
  });

  it('valida campos obrigatórios antes de enviar o cadastro', async () => {
    const wrapper = mountContactsView();
    await flushPromises();

    await wrapper.find('form.contact-form').trigger('submit.prevent');

    expect(contactsApiMock.create).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('Revise os campos obrigatórios.');
    expect(wrapper.text()).toContain('Informe o nome.');
    expect(wrapper.text()).toContain('Informe o e-mail.');
    expect(wrapper.text()).toContain('Informe o telefone.');
    expect(wrapper.text()).toContain('Informe a senha.');
  });

  it('valida formato de e-mail e telefone incompleto', async () => {
    const wrapper = mountContactsView();
    await flushPromises();

    const inputs = wrapper.findAll('.contact-form input');
    await inputs[0].setValue('Ana Silva');
    await inputs[1].setValue('email-invalido');
    await inputs[2].setValue('119999');
    await inputs[3].setValue('User@123456');
    await wrapper.find('form.contact-form').trigger('submit.prevent');

    expect(contactsApiMock.create).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('Informe um e-mail válido.');
    expect(wrapper.text()).toContain(
      'Informe 11 números para DDD + celular no formato +55 (xx) xxxxx-xxxx.',
    );
  });

  it('valida formato de e-mail e telefone ao sair dos campos', async () => {
    const wrapper = mountContactsView();
    await flushPromises();

    const inputs = wrapper.findAll('.contact-form input');
    await inputs[1].setValue('ana@email');
    await inputs[1].trigger('blur');
    await inputs[2].setValue('119999');
    await inputs[2].trigger('blur');

    expect(wrapper.text()).toContain('Informe um e-mail válido.');
    expect(wrapper.text()).toContain(
      'Informe 11 números para DDD + celular no formato +55 (xx) xxxxx-xxxx.',
    );
  });
});
