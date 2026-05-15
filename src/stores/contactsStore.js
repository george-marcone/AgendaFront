import { defineStore } from 'pinia';
import { contactsApi } from '../services/contactsApi';

const EMAIL_PATTERN =
  /^[A-Za-z0-9._%+-]+@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;
const BRAZILIAN_MOBILE_PHONE_PATTERN = /^\+55 \(\d{2}\) \d{5}-\d{4}$/;
const RECENT_CONTACT_IDS_KEY = 'agenda-front-recent-contact-ids';
const DATE_FIELDS = [
  'createdAt',
  'created_at',
  'createdOn',
  'createdDate',
  'registeredAt',
  'registrationDate',
];
export const NAME_MAX_LENGTH = 50;
export const EMAIL_MAX_LENGTH = 40;
export const PHONE_LOCAL_DIGIT_LENGTH = 11;

function getStorage() {
  return typeof localStorage === 'undefined' ? null : localStorage;
}

function readRecentContactIds() {
  const rawIds = getStorage()?.getItem(RECENT_CONTACT_IDS_KEY);

  if (!rawIds) {
    return [];
  }

  try {
    const ids = JSON.parse(rawIds);
    return Array.isArray(ids) ? ids : [];
  } catch {
    getStorage()?.removeItem(RECENT_CONTACT_IDS_KEY);
    return [];
  }
}

function saveRecentContactIds(ids) {
  getStorage()?.setItem(RECENT_CONTACT_IDS_KEY, JSON.stringify(ids.slice(0, 25)));
}

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

export function toBrazilianE164Phone(value = '') {
  const digits = getBrazilianMobileDigits(value);

  return digits ? `+55${digits}` : '';
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

export function getContactCreatedTime(contact) {
  const fieldName = DATE_FIELDS.find((field) => contact?.[field]);
  const timestamp = fieldName ? Date.parse(contact[fieldName]) : Number.NaN;

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function sortContactsByMostRecent(contacts, recentContactIds = []) {
  return [...contacts]
    .map((contact, originalIndex) => ({
      contact,
      originalIndex,
      createdTime: getContactCreatedTime(contact),
      recentIndex: recentContactIds.indexOf(contact.id),
    }))
    .sort((left, right) => {
      if (left.createdTime || right.createdTime) {
        return right.createdTime - left.createdTime || left.originalIndex - right.originalIndex;
      }

      if (left.recentIndex !== -1 || right.recentIndex !== -1) {
        if (left.recentIndex === -1) return 1;
        if (right.recentIndex === -1) return -1;
        return left.recentIndex - right.recentIndex;
      }

      return left.originalIndex - right.originalIndex;
    })
    .map(({ contact }) => contact);
}

export const useContactsStore = defineStore('contacts', {
  state: () => ({
    contacts: [],
    recentContactIds: readRecentContactIds(),
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

    promoteRecentContact(id) {
      if (!id) {
        return;
      }

      this.recentContactIds = [id, ...this.recentContactIds.filter((contactId) => contactId !== id)];
      saveRecentContactIds(this.recentContactIds);
      this.contacts = sortContactsByMostRecent(this.contacts, this.recentContactIds);
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
        this.contacts = sortContactsByMostRecent(
          normalizeContactsResponse(response),
          this.recentContactIds,
        );
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

      const payload = {
        ...this.form,
        phone: toBrazilianE164Phone(this.form.phone),
      };
      const wasEditing = this.isEditing;
      this.saving = true;

      try {
        if (wasEditing) {
          await contactsApi.update(payload);
          this.successMessage = 'Contato atualizado.';
        } else {
          await contactsApi.create(payload);
          this.successMessage = 'Contato cadastrado.';
        }

        this.resetForm();
        await this.loadContacts({ keepFeedback: true });

        if (!wasEditing) {
          const createdContact = this.contacts.find((contact) => {
            return contact.email === payload.email && contact.phone === payload.phone;
          });
          this.promoteRecentContact(createdContact?.id);
        }
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
