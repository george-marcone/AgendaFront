import { defineStore } from 'pinia';
import { contactsApi } from '../services/contactsApi';

export function createEmptyContactForm() {
  return {
    id: '',
    name: '',
    email: '',
    phone: '',
  };
}

export const useContactsStore = defineStore('contacts', {
  state: () => ({
    contacts: [],
    form: createEmptyContactForm(),
    searchTerm: '',
    selectedContact: null,
    loading: false,
    saving: false,
    consulting: false,
    deletingId: '',
    errorMessage: '',
    successMessage: '',
  }),

  getters: {
    isEditing: (state) => Boolean(state.form.id),

    filteredContacts: (state) => {
      const term = state.searchTerm.trim().toLowerCase();

      if (!term) {
        return state.contacts;
      }

      return state.contacts.filter((contact) => {
        return [contact.name, contact.email, contact.phone]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(term));
      });
    },
  },

  actions: {
    setError(error) {
      this.errorMessage =
        error instanceof Error ? error.message : 'Não foi possível concluir a ação.';
    },

    clearFeedback() {
      this.errorMessage = '';
      this.successMessage = '';
    },

    resetForm() {
      this.form = createEmptyContactForm();
    },

    async loadContacts({ keepFeedback = false } = {}) {
      this.loading = true;

      if (!keepFeedback) {
        this.clearFeedback();
      }

      try {
        const response = await contactsApi.list();
        this.contacts = Array.isArray(response) ? response : [];
      } catch (error) {
        this.setError(error);
      } finally {
        this.loading = false;
      }
    },

    editContact(contact) {
      this.clearFeedback();
      this.selectedContact = null;
      this.form = { ...contact };
    },

    async consultContact(contact) {
      this.consulting = true;
      this.clearFeedback();

      try {
        this.selectedContact = await contactsApi.getById(contact.id);
      } catch (error) {
        this.setError(error);
      } finally {
        this.consulting = false;
      }
    },

    async saveContact() {
      this.saving = true;
      this.clearFeedback();

      try {
        if (this.isEditing) {
          await contactsApi.update(this.form);
          this.successMessage = 'Contato atualizado.';
        } else {
          await contactsApi.create(this.form);
          this.successMessage = 'Contato cadastrado.';
        }

        this.resetForm();
        await this.loadContacts({ keepFeedback: true });
      } catch (error) {
        this.setError(error);
      } finally {
        this.saving = false;
      }
    },

    async removeContact(contact) {
      this.deletingId = contact.id;
      this.clearFeedback();

      try {
        await contactsApi.remove(contact.id);
        this.successMessage = 'Contato removido.';

        if (this.selectedContact?.id === contact.id) {
          this.selectedContact = null;
        }

        if (this.form.id === contact.id) {
          this.resetForm();
        }

        await this.loadContacts({ keepFeedback: true });
      } catch (error) {
        this.setError(error);
      } finally {
        this.deletingId = '';
      }
    },
  },
});
