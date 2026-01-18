<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import type { RackFormData, LogSize, Rack } from '@/types'
import { calculateSteres } from '@/services/calculations/stere'

const props = defineProps<{
  rack?: Rack | null
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [data: RackFormData]
}>()

const name = ref(props.rack?.name ?? 'Mon porte-buches')
const height = ref(props.rack?.height ?? 100)
const width = ref(props.rack?.width ?? 100)
const depth = ref(props.rack?.depth ?? 50)
const logSize = ref<LogSize>(props.rack?.logSize ?? 33)

const logSizeOptions = [
  { value: 25, label: '25 cm' },
  { value: 33, label: '33 cm' },
  { value: 50, label: '50 cm' },
]

const estimatedSteres = computed(() => {
  return calculateSteres(height.value, width.value, depth.value, logSize.value)
})

function handleSubmit() {
  emit('submit', {
    name: name.value,
    height: height.value,
    width: width.value,
    depth: depth.value,
    logSize: logSize.value,
  })
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <BaseCard title="Dimensions du porte-buches">
      <div class="form-grid">
        <BaseInput v-model="name" label="Nom" placeholder="Mon porte-buches" required />

        <BaseInput
          v-model="height"
          label="Hauteur (cm)"
          type="number"
          :min="10"
          :max="300"
          required
        />

        <BaseInput
          v-model="width"
          label="Largeur (cm)"
          type="number"
          :min="10"
          :max="500"
          required
        />

        <BaseInput
          v-model="depth"
          label="Profondeur (cm)"
          type="number"
          :min="10"
          :max="200"
          required
        />

        <BaseSelect v-model="logSize" label="Taille des buches" :options="logSizeOptions" />
      </div>

      <div class="estimate">
        <span class="estimate-label">Volume estime</span>
        <span class="estimate-value">{{ estimatedSteres.toFixed(2) }} steres</span>
      </div>
    </BaseCard>

    <div class="form-actions">
      <BaseButton type="submit" :loading="loading">
        {{ rack ? 'Mettre a jour' : 'Enregistrer' }}
      </BaseButton>
    </div>
  </form>
</template>

<style scoped>
.form-grid {
  display: grid;
  gap: 1rem;
}

.estimate {
  margin-top: 1.5rem;
  padding: 1rem;
  background: var(--color-primary-light);
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.estimate-label {
  font-weight: 500;
  color: var(--color-text-secondary);
}

.estimate-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-primary);
}

.form-actions {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
}
</style>
