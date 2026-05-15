import { defineStore } from 'pinia';
import { contactsApi } from '../services/contactsApi';

const EMAIL_PATTERN =
  /^[A-Za-z0-9._%+-]+@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;
const BRAZILIAN_MOBILE_PHONE_PATTERN = /^\+55 \(\d{2}\) \d{5}-\d{4}$/;
export const NAME_MAX_LENGTH = 50;
export const EMAIL_MAX_LENGTH = 40;
export const PHONE_LOCAL_DIGIT_LENGTH = 11;

export function createEmptyContactForm() {
  return {
    id: '',
    name: '',
    email: '',
    phone: '',
  };
}

export function createEmptyContactFieldErrors() {
  return {
    name: '',
    email: '',
    phone: '',
  };
}

export function getBrazilianMobileDigits(value = '') {
  const rawValue = String(value).trim();
  const digits = rawValue.replace(/\D/g, '');
  const hasFormattedCountryCode = rawValue.startsWith('+55');
  const hasPastedCountryCode = digits.startsWith('55') && digits.length > PHONE_LOCAL_DIGIT_LENGTH;
  const withoutCountryCode =
    hasFormattedCountryCode || hasPastedCountryCode ? digits.slice(2) : digits;

  return withoutCountryCode.slice(0, PHONE_LOCAL_DIGIT_LENGTH);
}

export function formatBrazilianMobilePhone(value = '') {
  const digits = getBrazilianMobileDigits(value);

  if (!digits) {
    return '';
  }

  const areaCode = digits.slice(0, 2);
  const firstPart = digits.slice(2, 7);
  const secondPart = digits.slice(7, 11);
  let formatted = '+55';

  if (areaCode) {
    formatted += ` (${areaCode}`;
  }

  if (areaCode.length === 2) {
    formatted += ')';
  }

  if (firstPart) {
    formatted += ` ${firstPart}`;
  }

  if (secondPart) {
    formatted += `-${secondPart}`;
  }

  return formatted;
}

export function isValidEmail(value = '') {
  return EMAIL_PATTERN.test(value.trim());
}

export function isValidBrazilianMobilePhone(value = '') {
  return BRAZILIAN_MOBILE_PHONE_PATTERN.test(formatBrazilianMobilePhone(value));
}

export function normalizeContactsResponse(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.value)) {
    return response.value;
  }

  if (Array.isArray(response?.items)) {
    return response.items;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
}

export const useContactsStore = defineStore('contacts', {
  state: () => ({
    contacts: [],
    form: createEmptyContactForm(),
    fieldErrors: createEmptyContactFieldErrors(),
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

    phoneDigitsCount: (state) => getBrazilianMobileDigits(state.form.phone).length,
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

    clearFieldErrors() {
      this.fieldErrors = createEmptyContactFieldErrors();
    },

    resetForm() {
      this.form = createEmptyContactForm();
      this.clearFieldErrors();
    },

    setPhone(value) {
      this.form.phone = formatBrazilianMobilePhone(value);
      this.fieldErrors.phone = '';
    },

    validateNameField() {
      const name = this.form.name.trim();

      if (!name) {
        this.fieldErrors.name = 'Informe o nome.';
      } else if (name.length > NAME_MAX_LENGTH) {
        this.fieldErrors.name = `Informe no máximo ${NAME_MAX_LENGTH} caracteres.`;
      } else {
        this.fieldErrors.name = '';
      }

      return !this.fieldErrors.name;
    },

    validateEmailField() {
      const email = this.form.email.trim();

      if (!email) {
        this.fieldErrors.email = 'Informe o e-mail.';
      } else if (email.length > EMAIL_MAX_LENGTH) {
        this.fieldErrors.email = `Informe no máximo ${EMAIL_MAX_LENGTH} caracteres.`;
      } else if (!isValidEmail(email)) {
        this.fieldErrors.email = 'Informe um e-mail válido.';
      } else {
        this.fieldErrors.email = '';
      }

      return !this.fieldErrors.email;
    },

    validatePhoneField() {
      if (!this.form.phone.trim()) {
        this.fieldErrors.phone = 'Informe o telefone.';
      } else if (!isValidBrazilianMobilePhone(this.form.phone)) {
        this.fieldErrors.phone =
          'Informe 11 números para DDD + celular no formato +55 (xx) xxxxx-xxxx.';
      } else {
        this.fieldErrors.phone = '';
      }

      return !this.fieldErrors.phone;
    },

    validateContactForm() {
      this.clearFieldErrors();
      const isValid = [
        this.validateNameField(),
        this.validateEmailField(),
        this.validatePhoneField(),
      ].every(Boolean);

      if (!isValid) {
        this.errorMessage = 'Revise os campos obrigatórios.';
      }

      return isValid;
    },

    async loadContacts({ keepFeedback = false } = {}) {
      this.loading = true;

      if (!keepFeedback) {
        this.clearFeedback();
      }

      try {
        const response = await contactsApi.list();
        this.contacts = normalizeContactsResponse(response);
      } catch (error) {
        this.setError(error);
      } finally {
        this.loading = false;
      }
    },

    editContact(contact) {
      this.clearFeedback();
      this.clearFieldErrors();
      this.selectedContact = null;
      this.form = {
        ...contact,
        phone: formatBrazilianMobilePhone(contact.phone),
      };
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
      this.clearFeedback();

      if (!this.validateContactForm()) {
        return;
      }

      this.form.phone = formatBrazilianMobilePhone(this.form.phone);
      this.saving = true;

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
