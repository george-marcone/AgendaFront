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

  it('cadastra um contato pelo formulário usando a store do Pinia', async () => {
    contactsApiMock.list
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 'contact-1',
          name: 'Ana Silva',
          email: 'ana@email.com',
          phone: '11999990000',
        },
      ]);

    const wrapper = mountContactsView();
    await flushPromises();

    const inputs = wrapper.findAll('.contact-form input');
    await inputs[0].setValue('Ana Silva');
    await inputs[1].setValue('ana@email.com');
    await inputs[2].setValue('11999990000');
    await wrapper.find('form.contact-form').trigger('submit.prevent');
    await flushPromises();

    expect(contactsApiMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Ana Silva',
        email: 'ana@email.com',
        phone: '11999990000',
      }),
    );
    expect(wrapper.text()).toContain('Contato cadastrado.');
    expect(wrapper.text()).toContain('Ana Silva');
  });

  it('preenche o formulário ao editar e envia a alteração do contato', async () => {
    contactsApiMock.list
      .mockResolvedValueOnce([
        {
          id: 'contact-1',
          name: 'George Marcone',
          email: 'george@email.com',
          phone: '1100000000',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'contact-1',
          name: 'George Marcone',
          email: 'george@email.com',
          phone: '11988887777',
        },
      ]);

    const wrapper = mountContactsView();
    await flushPromises();

    await wrapper.find('button[aria-label="Editar contato"]').trigger('click');

    const inputs = wrapper.findAll('.contact-form input');
    expect(inputs[0].element.value).toBe('George Marcone');
    expect(inputs[1].element.value).toBe('george@email.com');

    await inputs[2].setValue('11988887777');
    await wrapper.find('form.contact-form').trigger('submit.prevent');
    await flushPromises();

    expect(contactsApiMock.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'contact-1',
        name: 'George Marcone',
        email: 'george@email.com',
        phone: '11988887777',
      }),
    );
    expect(wrapper.text()).toContain('Contato atualizado.');
    expect(wrapper.text()).toContain('11988887777');
  });
});
