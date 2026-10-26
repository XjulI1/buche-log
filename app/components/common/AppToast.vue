<script setup lang="ts">
import { useToast } from '~/composables/useToast'

const { message } = useToast()
</script>

<template>
  <Transition name="toast">
    <div v-if="message" class="toast" role="status">✓ {{ message }}</div>
  </Transition>
</template>

<style scoped>
.toast {
  position: fixed;
  left: 50%;
  bottom: calc(5.5rem + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  z-index: 300;
  padding: 0.75rem 1.25rem;
  border-radius: 999px;
  background: var(--color-text);
  color: white;
  font-weight: 600;
  box-shadow: var(--shadow-lg);
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 10px);
}

@media (min-width: 900px) {
  .toast {
    bottom: 2rem;
  }
}
</style>
