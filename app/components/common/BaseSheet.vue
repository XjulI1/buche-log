<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'

const props = defineProps<{
  open: boolean
  title: string
}>()

const emit = defineEmits<{
  close: []
}>()

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

watch(
  () => props.open,
  (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) window.addEventListener('keydown', onKeydown)
    else window.removeEventListener('keydown', onKeydown)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="open" class="overlay" @click.self="emit('close')">
        <div class="sheet" role="dialog" aria-modal="true" :aria-label="title">
          <header class="sheet-header">
            <h2 class="sheet-title">{{ title }}</h2>
            <button type="button" class="close" aria-label="Fermer" @click="emit('close')">✕</button>
          </header>
          <div class="sheet-body">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(44, 36, 23, 0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.sheet {
  width: 100%;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border-radius: 16px 16px 0 0;
  box-shadow: var(--shadow-lg);
}

.sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
}

.sheet-title {
  font-size: 1.125rem;
}

.close {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: var(--color-background);
  font-size: 1rem;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.sheet-body {
  padding: 1.25rem;
  padding-bottom: calc(1.25rem + env(safe-area-inset-bottom));
  overflow-y: auto;
}

.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.2s ease;
}

.sheet-enter-active .sheet,
.sheet-leave-active .sheet {
  transition: transform 0.25s ease;
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-from .sheet,
.sheet-leave-to .sheet {
  transform: translateY(40px);
}

@media (min-width: 900px) {
  .overlay {
    justify-content: flex-end;
    align-items: stretch;
  }

  .sheet {
    width: 480px;
    max-height: none;
    height: 100%;
    border-radius: 0;
  }

  .sheet-enter-from .sheet,
  .sheet-leave-to .sheet {
    transform: translateX(40px);
  }
}
</style>
