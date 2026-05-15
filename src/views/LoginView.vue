<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Eye, EyeOff, LogIn } from '@lucide/vue';
import { useAuthStore } from '../stores/authStore';

const router = useRouter();
const authStore = useAuthStore();
const email = ref('');
const password = ref('');
const showPassword = ref(false);
const errorMessage = ref('');

function handleSubmit() {
  errorMessage.value = '';

  if (!authStore.login(email.value, password.value)) {
    errorMessage.value = 'E-mail ou senha inválidos.';
    return;
  }

  router.push({ name: 'agenda' });
}
</script>

<template>
  <main class="auth-page">
    <section class="auth-card" aria-labelledby="login-title">
      <div class="auth-brand">
        <div class="brand-mark" aria-hidden="true">A</div>
        <div>
          <span class="eyebrow">GMMS TECH SOLUTIONS</span>
          <h1 id="login-title">Agenda de Contatos</h1>
        </div>
      </div>

      <form class="login-form" @submit.prevent="handleSubmit">
        <label class="field">
          <span>E-mail</span>
          <input
            v-model="email"
            type="email"
            autocomplete="email"
            placeholder="gmarcone@gmail.com"
            required
          />
        </label>

        <label class="field">
          <span>Senha</span>
          <div class="password-field">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="123456"
              required
            />
            <button
              type="button"
              class="icon-button"
              :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
              :title="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
              @click="showPassword = !showPassword"
            >
              <EyeOff v-if="showPassword" :size="18" />
              <Eye v-else :size="18" />
            </button>
          </div>
        </label>

        <p v-if="errorMessage" class="feedback error" role="alert">
          {{ errorMessage }}
        </p>

        <button type="submit" class="primary-action">
          <LogIn :size="18" />
          Entrar
        </button>
      </form>
    </section>
  </main>
</template>
