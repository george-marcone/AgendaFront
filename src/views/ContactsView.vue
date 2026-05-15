<script setup>
import { computed, onMounted, ref } from 'vue';
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
import { authService } from '../services/authService';
import { contactsApi } from '../services/contactsApi';

const router = useRouter();
const contacts = ref([]);
const form = ref(createEmptyForm());
const searchTerm = ref('');
const selectedContact = ref(null);
const loading = ref(false);
const saving = ref(false);
const consulting = ref(false);
const deletingId = ref('');
const errorMessage = ref('');
const successMessage = ref('');

const isEditing = computed(() => Boolean(form.value.id));

const filteredContacts = computed(() => {
  const term = searchTerm.value.trim().toLowerCase();

  if (!term) {
    return contacts.value;
  }

  return contacts.value.filter((contact) => {
    return [contact.name, contact.email, contact.phone]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(term));
  });
});

function createEmptyForm() {
  return {
    id: '',
    name: '',
    email: '',
    phone: '',
  };
}

function setError(error) {
  errorMessage.value =
    error instanceof Error ? error.message : 'Não foi possível concluir a ação.';
}

function clearFeedback() {
  errorMessage.value = '';
  successMessage.value = '';
}

async function loadContacts({ keepFeedback = false } = {}) {
  loading.value = true;

  if (!keepFeedback) {
    clearFeedback();
  }

  try {
    const response = await contactsApi.list();
    contacts.value = Array.isArray(response) ? response : [];
  } catch (error) {
    setError(error);
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.value = createEmptyForm();
}

function editContact(contact) {
  clearFeedback();
  selectedContact.value = null;
  form.value = { ...contact };
}

async function consultContact(contact) {
  consulting.value = true;
  clearFeedback();

  try {
    selectedContact.value = await contactsApi.getById(contact.id);
  } catch (error) {
    setError(error);
  } finally {
    consulting.value = false;
  }
}

async function saveContact() {
  saving.value = true;
  clearFeedback();

  try {
    if (isEditing.value) {
      await contactsApi.update(form.value);
      successMessage.value = 'Contato atualizado.';
    } else {
      await contactsApi.create(form.value);
      successMessage.value = 'Contato cadastrado.';
    }

    resetForm();
    await loadContacts({ keepFeedback: true });
  } catch (error) {
    setError(error);
  } finally {
    saving.value = false;
  }
}

async function deleteContact(contact) {
  const confirmed = window.confirm(`Excluir ${contact.name}?`);

  if (!confirmed) {
    return;
  }

  deletingId.value = contact.id;
  clearFeedback();

  try {
    await contactsApi.remove(contact.id);
    successMessage.value = 'Contato removido.';

    if (selectedContact.value?.id === contact.id) {
      selectedContact.value = null;
    }

    if (form.value.id === contact.id) {
      resetForm();
    }

    await loadContacts({ keepFeedback: true });
  } catch (error) {
    setError(error);
  } finally {
    deletingId.value = '';
  }
}

function logout() {
  authService.logout();
  router.push({ name: 'login' });
}

onMounted(loadContacts);
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
      <form class="panel contact-form" @submit.prevent="saveContact">
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
          <input v-model="form.name" type="text" autocomplete="name" required />
        </label>

        <label class="field">
          <span>E-mail</span>
          <input v-model="form.email" type="email" autocomplete="email" required />
        </label>

        <label class="field">
          <span>Telefone</span>
          <input v-model="form.phone" type="tel" autocomplete="tel" required />
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
