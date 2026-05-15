<script setup>
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import {
  ClipboardList,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from '@lucide/vue';
import { useAuthStore } from '../stores/authStore';
import {
  EMAIL_MAX_LENGTH,
  formatBrazilianMobilePhone,
  NAME_MAX_LENGTH,
  PHONE_LOCAL_DIGIT_LENGTH,
  useContactsStore,
} from '../stores/contactsStore';
import { calculatePasswordStrength, PASSWORD_MIN_LENGTH } from '../services/passwordStrength';

const router = useRouter();
const authStore = useAuthStore();
const contactsStore = useContactsStore();
const passwordPanelOpen = ref(false);
const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});
const passwordErrors = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});
const passwordSuccessMessage = ref('');
const passwordErrorMessage = ref('');
const {
  contacts,
  form,
  fieldErrors,
  searchTerm,
  selectedContact,
  loading,
  saving,
  consulting,
  deletingId,
  errorMessage,
  successMessage,
  isEditing,
  filteredContacts,
  phoneDigitsCount,
} = storeToRefs(contactsStore);
const {
  loadContacts,
  resetForm,
  editContact,
  consultContact,
  saveContact,
  setPhone,
  validateNameField,
  validateEmailField,
  validatePhoneField,
} = contactsStore;
const loggedUserName = computed(() => getFirstAndLastName(authStore.user));
const ownPasswordStrength = computed(() => calculatePasswordStrength(passwordForm.value.newPassword));

function getFirstAndLastName(user) {
  const explicitName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
  const fullName = explicitName || user?.name || user?.fullName || user?.displayName || '';
  const nameParts = String(fullName).trim().split(/\s+/).filter(Boolean);

  if (nameParts.length <= 1) {
    return nameParts[0] || '';
  }

  return `${nameParts[0]} ${nameParts[nameParts.length - 1]}`;
}

async function deleteContact(contact) {
  const confirmed = window.confirm(`Excluir ${contact.name}?`);

  if (!confirmed) {
    return;
  }

  await contactsStore.removeContact(contact);
}

function logout() {
  authStore.logout();
  router.push({ name: 'login' });
}

function resetPasswordForm() {
  passwordForm.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };
  passwordErrors.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };
  showCurrentPassword.value = false;
  showNewPassword.value = false;
}

function togglePasswordPanel() {
  passwordPanelOpen.value = !passwordPanelOpen.value;
  passwordSuccessMessage.value = '';
  passwordErrorMessage.value = '';

  if (!passwordPanelOpen.value) {
    resetPasswordForm();
  }
}

function clearPasswordError(field) {
  passwordErrors.value[field] = '';
  passwordSuccessMessage.value = '';
  passwordErrorMessage.value = '';
}

function validatePasswordChangeForm() {
  passwordErrors.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

  if (!passwordForm.value.currentPassword) {
    passwordErrors.value.currentPassword = 'Informe a senha atual.';
  }

  if (!passwordForm.value.newPassword) {
    passwordErrors.value.newPassword = 'Informe a nova senha.';
  } else if (passwordForm.value.newPassword.length < PASSWORD_MIN_LENGTH) {
    passwordErrors.value.newPassword = `Informe no mínimo ${PASSWORD_MIN_LENGTH} caracteres.`;
  }

  if (!passwordForm.value.confirmPassword) {
    passwordErrors.value.confirmPassword = 'Confirme a nova senha.';
  } else if (passwordForm.value.confirmPassword !== passwordForm.value.newPassword) {
    passwordErrors.value.confirmPassword = 'As senhas não conferem.';
  }

  return Object.values(passwordErrors.value).every((message) => !message);
}

async function changeOwnPassword() {
  passwordSuccessMessage.value = '';
  passwordErrorMessage.value = '';

  if (!validatePasswordChangeForm()) {
    passwordErrorMessage.value = 'Revise os campos de senha.';
    return;
  }

  try {
    await authStore.changePassword(passwordForm.value.currentPassword, passwordForm.value.newPassword);
    resetPasswordForm();
    passwordSuccessMessage.value = 'Senha alterada.';
  } catch (error) {
    passwordErrorMessage.value =
      error instanceof Error ? error.message : 'Não foi possível alterar a senha.';
  }
}

onMounted(() => contactsStore.loadContacts());
</script>

<template>
  <main class="agenda-page">
    <header class="topbar">
      <div>
        <span class="eyebrow">GMMS TECH SOLUTIONS</span>
        <h1>Agenda de Contatos</h1>
      </div>

      <div class="topbar-actions">
        <p v-if="loggedUserName" class="logged-user">{{ loggedUserName }}</p>

        <div class="topbar-buttons">
          <button
            class="ghost-button"
            type="button"
            aria-controls="password-change-panel"
            :aria-expanded="passwordPanelOpen"
            @click="togglePasswordPanel"
          >
            <KeyRound :size="18" />
            Alterar senha
          </button>

          <button class="ghost-button" type="button" @click="logout">
            <LogOut :size="18" />
            Sair
          </button>
        </div>
      </div>
    </header>

    <form
      v-if="passwordPanelOpen"
      id="password-change-panel"
      class="panel password-change-panel"
      novalidate
      @submit.prevent="changeOwnPassword"
    >
      <div class="panel-heading">
        <div>
          <span class="eyebrow">Conta</span>
          <h2>Alterar minha senha</h2>
        </div>

        <button
          type="button"
          class="icon-button"
          aria-label="Fechar alteração de senha"
          title="Fechar alteração de senha"
          @click="togglePasswordPanel"
        >
          <X :size="18" />
        </button>
      </div>

      <p v-if="passwordErrorMessage" class="feedback error" role="alert">
        {{ passwordErrorMessage }}
      </p>
      <p v-if="passwordSuccessMessage" class="feedback success" role="status">
        {{ passwordSuccessMessage }}
      </p>

      <div class="password-change-grid">
        <label class="field">
          <span>Senha atual</span>
          <div class="password-field">
            <input
              v-model="passwordForm.currentPassword"
              :type="showCurrentPassword ? 'text' : 'password'"
              autocomplete="current-password"
              required
              :aria-invalid="Boolean(passwordErrors.currentPassword)"
              aria-describedby="current-password-error"
              @input="clearPasswordError('currentPassword')"
            />
            <button
              type="button"
              class="icon-button"
              :aria-label="showCurrentPassword ? 'Ocultar senha atual' : 'Mostrar senha atual'"
              :title="showCurrentPassword ? 'Ocultar senha atual' : 'Mostrar senha atual'"
              @click="showCurrentPassword = !showCurrentPassword"
            >
              <EyeOff v-if="showCurrentPassword" :size="18" />
              <Eye v-else :size="18" />
            </button>
          </div>
          <small
            v-if="passwordErrors.currentPassword"
            id="current-password-error"
            class="field-error"
          >
            {{ passwordErrors.currentPassword }}
          </small>
        </label>

        <label class="field">
          <span>Nova senha</span>
          <div class="password-field">
            <input
              v-model="passwordForm.newPassword"
              :type="showNewPassword ? 'text' : 'password'"
              autocomplete="new-password"
              :minlength="PASSWORD_MIN_LENGTH"
              required
              :aria-invalid="Boolean(passwordErrors.newPassword)"
              aria-describedby="new-password-error new-password-strength new-password-hint"
              @input="clearPasswordError('newPassword')"
            />
            <button
              type="button"
              class="icon-button"
              :aria-label="showNewPassword ? 'Ocultar nova senha' : 'Mostrar nova senha'"
              :title="showNewPassword ? 'Ocultar nova senha' : 'Mostrar nova senha'"
              @click="showNewPassword = !showNewPassword"
            >
              <EyeOff v-if="showNewPassword" :size="18" />
              <Eye v-else :size="18" />
            </button>
          </div>
          <small v-if="passwordErrors.newPassword" id="new-password-error" class="field-error">
            {{ passwordErrors.newPassword }}
          </small>
          <div
            v-if="passwordForm.newPassword"
            id="new-password-strength"
            class="password-strength"
            :class="`password-strength--${ownPasswordStrength.level}`"
            aria-live="polite"
          >
            <div
              class="password-strength-track"
              role="meter"
              :aria-valuenow="ownPasswordStrength.percent"
              aria-valuemin="0"
              aria-valuemax="100"
              :aria-valuetext="ownPasswordStrength.label"
            >
              <span :style="{ width: `${ownPasswordStrength.percent}%` }"></span>
            </div>
            <small>Força da senha: {{ ownPasswordStrength.label }}</small>
          </div>
          <small id="new-password-hint" class="field-hint">
            Mínimo de {{ PASSWORD_MIN_LENGTH }} caracteres, com letras, números e símbolos.
          </small>
        </label>

        <label class="field">
          <span>Confirmar nova senha</span>
          <input
            v-model="passwordForm.confirmPassword"
            type="password"
            autocomplete="new-password"
            required
            :aria-invalid="Boolean(passwordErrors.confirmPassword)"
            aria-describedby="confirm-password-error"
            @input="clearPasswordError('confirmPassword')"
          />
          <small
            v-if="passwordErrors.confirmPassword"
            id="confirm-password-error"
            class="field-error"
          >
            {{ passwordErrors.confirmPassword }}
          </small>
        </label>

        <button
          type="submit"
          class="primary-action password-change-action"
          :disabled="authStore.changingPassword"
        >
          <LoaderCircle v-if="authStore.changingPassword" class="spin" :size="18" />
          <KeyRound v-else :size="18" />
          Salvar senha
        </button>
      </div>
    </form>

    <section class="agenda-grid">
      <form class="panel contact-form" novalidate @submit.prevent="saveContact">
        <div class="panel-heading">
          <div>
            <span class="eyebrow">{{ isEditing ? 'Edição' : 'Cadastro' }}</span>
            <h2>{{ isEditing ? 'Editar contato' : 'Novo contato' }}</h2>
          </div>

          <button
            v-if="isEditing"
            type="button"
            class="icon-button"
            aria-label="Cancelar edição"
            title="Cancelar edição"
            @click="resetForm"
          >
            <X :size="18" />
          </button>
        </div>

        <label class="field">
          <span>Nome</span>
          <input
            v-model="form.name"
            type="text"
            autocomplete="name"
            :maxlength="NAME_MAX_LENGTH"
            required
            :aria-invalid="Boolean(fieldErrors.name)"
            aria-describedby="name-error"
            @input="fieldErrors.name = ''"
            @blur="validateNameField"
          />
          <small v-if="fieldErrors.name" id="name-error" class="field-error">
            {{ fieldErrors.name }}
          </small>
          <small class="field-hint">{{ form.name.length }}/{{ NAME_MAX_LENGTH }}</small>
        </label>

        <label class="field">
          <span>E-mail</span>
          <input
            v-model="form.email"
            type="email"
            autocomplete="email"
            :maxlength="EMAIL_MAX_LENGTH"
            required
            pattern="^[^\s@]+@[^\s@]+\.[^\s@]{2,}$"
            :aria-invalid="Boolean(fieldErrors.email)"
            aria-describedby="email-error"
            @input="fieldErrors.email = ''"
            @blur="validateEmailField"
          />
          <small v-if="fieldErrors.email" id="email-error" class="field-error">
            {{ fieldErrors.email }}
          </small>
          <small class="field-hint">{{ form.email.length }}/{{ EMAIL_MAX_LENGTH }}</small>
        </label>

        <label class="field">
          <span>Telefone</span>
          <input
            :value="form.phone"
            type="tel"
            autocomplete="tel"
            inputmode="numeric"
            placeholder="+55 (11) 99999-9999"
            pattern="^\+55 \([0-9]{2}\) [0-9]{5}-[0-9]{4}$"
            maxlength="19"
            required
            :aria-invalid="Boolean(fieldErrors.phone)"
            aria-describedby="phone-error"
            @input="setPhone($event.target.value)"
            @blur="validatePhoneField"
          />
          <small v-if="fieldErrors.phone" id="phone-error" class="field-error">
            {{ fieldErrors.phone }}
          </small>
          <small class="field-hint">
            {{ phoneDigitsCount }}/{{ PHONE_LOCAL_DIGIT_LENGTH }} números
          </small>
        </label>

        <button type="submit" class="primary-action" :disabled="saving">
          <LoaderCircle v-if="saving" class="spin" :size="18" />
          <Save v-else-if="isEditing" :size="18" />
          <Plus v-else :size="18" />
          {{ isEditing ? 'Salvar alterações' : 'Cadastrar contato' }}
        </button>
      </form>

      <section class="panel contact-list" aria-labelledby="contacts-title">
        <div class="panel-heading list-heading">
          <div>
            <span class="eyebrow">{{ contacts.length }} contato(s)</span>
            <h2 id="contacts-title">Contatos</h2>
          </div>

          <button
            type="button"
            class="icon-button"
            aria-label="Atualizar lista"
            title="Atualizar lista"
            :disabled="loading"
            @click="loadContacts"
          >
            <RefreshCw :class="{ spin: loading }" :size="18" />
          </button>
        </div>

        <div class="search-row">
          <Search :size="18" aria-hidden="true" />
          <input v-model="searchTerm" type="search" placeholder="Consultar contato" />
        </div>

        <p v-if="errorMessage" class="feedback error" role="alert">
          {{ errorMessage }}
        </p>
        <p v-if="successMessage" class="feedback success" role="status">
          {{ successMessage }}
        </p>

        <div v-if="loading" class="empty-state">
          <LoaderCircle class="spin" :size="26" />
          Carregando contatos
        </div>

        <div v-else-if="filteredContacts.length === 0" class="empty-state">
          <ClipboardList :size="28" />
          Nenhum contato encontrado
        </div>

        <div v-else class="table-wrap">
          <table>
            <colgroup>
              <col class="name-column" />
              <col class="email-column" />
              <col class="phone-column" />
              <col class="actions-column" />
            </colgroup>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Telefone</th>
                <th class="actions-column">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="contact in filteredContacts" :key="contact.id">
                <td data-label="Nome">{{ contact.name }}</td>
                <td data-label="E-mail">{{ contact.email }}</td>
                <td data-label="Telefone">{{ formatBrazilianMobilePhone(contact.phone) }}</td>
                <td class="actions-cell" data-label="Ações">
                  <div class="row-actions">
                    <button
                      type="button"
                      class="icon-button"
                      aria-label="Consultar contato"
                      title="Consultar contato"
                      :disabled="consulting"
                      @click="consultContact(contact)"
                    >
                      <Eye :size="17" />
                    </button>
                    <button
                      type="button"
                      class="icon-button"
                      aria-label="Editar contato"
                      title="Editar contato"
                      @click="editContact(contact)"
                    >
                      <Pencil :size="17" />
                    </button>
                    <button
                      type="button"
                      class="icon-button danger"
                      aria-label="Excluir contato"
                      title="Excluir contato"
                      :disabled="deletingId === contact.id"
                      @click="deleteContact(contact)"
                    >
                      <LoaderCircle v-if="deletingId === contact.id" class="spin" :size="17" />
                      <Trash2 v-else :size="17" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <aside v-if="selectedContact" class="details-panel" aria-label="Contato consultado">
          <div>
            <span class="eyebrow">Consulta</span>
            <h3>{{ selectedContact.name }}</h3>
          </div>
          <dl>
            <div>
              <dt>E-mail</dt>
              <dd>{{ selectedContact.email }}</dd>
            </div>
            <div>
              <dt>Telefone</dt>
              <dd>{{ formatBrazilianMobilePhone(selectedContact.phone) }}</dd>
            </div>
          </dl>
          <button
            type="button"
            class="icon-button"
            aria-label="Fechar consulta"
            title="Fechar consulta"
            @click="selectedContact = null"
          >
            <X :size="18" />
          </button>
        </aside>
      </section>
    </section>
  </main>
</template>
