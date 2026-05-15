<script setup>
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import {
  ClipboardList,
  Eye,
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
  NAME_MAX_LENGTH,
  PHONE_LOCAL_DIGIT_LENGTH,
  useContactsStore,
} from '../stores/contactsStore';

const router = useRouter();
const authStore = useAuthStore();
const contactsStore = useContactsStore();
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

onMounted(() => contactsStore.loadContacts());
</script>

<template>
  <main class="agenda-page">
    <header class="topbar">
      <div>
        <span class="eyebrow">CoreFlow</span>
        <h1>Agenda de Contatos</h1>
      </div>

      <button class="ghost-button" type="button" @click="logout">
        <LogOut :size="18" />
        Sair
      </button>
    </header>

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
                <td data-label="Telefone">{{ contact.phone }}</td>
                <td class="row-actions" data-label="Ações">
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
              <dd>{{ selectedContact.phone }}</dd>
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
