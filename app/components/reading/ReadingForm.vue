<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import LevelPicker from './LevelPicker.vue'
import LevelStepper from './LevelStepper.vue'
import BaseButton from '~/components/common/BaseButton.vue'
import type { ConsumptionEntry, ConsumptionFormData } from '#shared/types'
import { useRackStore, useConsumptionStore } from '~/stores'
import {
  addDays,
  calculateConsumptionSteres,
  calculateEntryConsumption,
  formatDayLabel,
  formatSteres,
  fromInputDate,
  getISOWeek,
  toInputDate,
} from '~/services/calculations'

const props = defineProps<{
  entry?: ConsumptionEntry | null
  loading?: boolean
  pickerHeight?: number
}>()

const emit = defineEmits<{
  submit: [data: ConsumptionFormData]
  delete: []
  cancel: []
}>()

const rackStore = useRackStore()
const consumptionStore = useConsumptionStore()
const { volumeSteres } = storeToRefs(rackStore)

const isEdit = computed(() => !!props.entry)
const today = new Date()

const dateValue = ref(toInputDate(props.entry?.date ?? today))
const date = computed(() => {
  // En edition, on conserve l'heure d'origine si la date n'a pas change
  if (props.entry && dateValue.value === toInputDate(props.entry.date)) return props.entry.date
  return fromInputDate(dateValue.value)
})
const week = computed(() => getISOWeek(date.value))

const previous = computed(() => consumptionStore.previousEntryFor(date.value, props.entry?.id))

const reloaded = ref(props.entry ? props.entry.reloadFrom != null : false)
const reloadFrom = ref(props.entry?.reloadFrom ?? Math.min(previous.value?.level ?? 0, 20))
const reloadTo = ref(props.entry?.reloadTo ?? 100)
const level = ref(props.entry?.level ?? previous.value?.level ?? 100)
const notes = ref(props.entry?.notes ?? '')

// Tant que l'utilisateur n'a pas touche au niveau, il suit le contexte (precedent / recharge)
const levelTouched = ref(isEdit.value)
let autoLevel = level.value
watch(level, (value) => {
  if (value !== autoLevel) levelTouched.value = true
})

watch([reloaded, reloadTo, previous], () => {
  if (levelTouched.value) return
  autoLevel = reloaded.value ? reloadTo.value : (previous.value?.level ?? 100)
  level.value = autoLevel
})

const dateShortcuts = [
  { label: "Aujourd'hui", days: 0 },
  { label: 'Hier', days: -1 },
  { label: 'Il y a 7 j', days: -7 },
]

const consumedPercent = computed(() =>
  calculateEntryConsumption(
    {
      level: level.value,
      reloadFrom: reloaded.value ? reloadFrom.value : null,
      reloadTo: reloaded.value ? reloadTo.value : null,
    },
    previous.value,
  ),
)

const errors = computed(() => {
  const list: string[] = []
  if (reloaded.value && reloadFrom.value > reloadTo.value) {
    list.push('Le niveau après recharge doit être supérieur au niveau avant recharge.')
  }
  if (reloaded.value && level.value > reloadTo.value) {
    list.push('Le niveau constaté ne peut pas dépasser le niveau après recharge.')
  }
  if (date.value.getTime() > Date.now() + 60_000) {
    list.push('La date ne peut pas être dans le futur.')
  }
  return list
})

const levelIncreased = computed(
  () => !reloaded.value && !!previous.value && level.value > previous.value.level,
)

const reloadFromAbovePrevious = computed(
  () => reloaded.value && !!previous.value && reloadFrom.value > previous.value.level,
)

function declareReload() {
  reloadFrom.value = Math.min(previous.value?.level ?? 0, 20)
  reloadTo.value = Math.max(level.value, 100)
  reloaded.value = true
}

function handleSubmit() {
  if (errors.value.length > 0) return
  emit('submit', {
    level: level.value,
    reloadFrom: reloaded.value ? reloadFrom.value : null,
    reloadTo: reloaded.value ? reloadTo.value : null,
    date: date.value,
    notes: notes.value.trim() || undefined,
  })
}
</script>

<template>
  <form class="reading-form" @submit.prevent="handleSubmit">
    <section class="field">
      <div class="field-header">
        <label class="field-label" for="reading-date">Date du relevé</label>
        <span class="week-badge">Semaine {{ week.week }}</span>
      </div>
      <div class="date-row">
        <input
          id="reading-date"
          v-model="dateValue"
          type="date"
          class="date-input"
          :max="toInputDate(today)"
          required
        >
        <div class="chips">
          <button
            v-for="shortcut in dateShortcuts"
            :key="shortcut.days"
            type="button"
            class="chip"
            :class="{ active: dateValue === toInputDate(addDays(today, shortcut.days)) }"
            @click="dateValue = toInputDate(addDays(today, shortcut.days))"
          >
            {{ shortcut.label }}
          </button>
        </div>
      </div>
    </section>

    <section class="field reload">
      <label class="toggle">
        <input v-model="reloaded" type="checkbox">
        <span>J'ai rechargé depuis le relevé précédent</span>
      </label>
      <div v-if="reloaded" class="reload-levels">
        <LevelStepper v-model="reloadFrom" label="Niveau avant recharge" :presets="[0, 10, 20]" />
        <span class="arrow" aria-hidden="true">→</span>
        <LevelStepper v-model="reloadTo" label="Niveau après recharge" :presets="[80, 90, 100]" />
      </div>
      <p v-if="reloadFromAbovePrevious" class="notice">
        Le niveau avant recharge ({{ reloadFrom }} %) est supérieur au relevé précédent ({{ previous?.level }} %).
      </p>
    </section>

    <section class="field">
      <LevelPicker
        v-model="level"
        label="Niveau constaté maintenant"
        :previous-level="reloaded ? null : previous?.level"
        :previous-label="previous ? `Relevé du ${formatDayLabel(previous.date)}` : undefined"
        :height="pickerHeight"
      />
      <p v-if="levelIncreased" class="notice">
        Le niveau a augmenté depuis le relevé précédent ({{ previous?.level }} %).
        <button type="button" class="link" @click="declareReload">J'ai rechargé</button>
      </p>
    </section>

    <div class="summary" aria-live="polite">
      <template v-if="previous">
        <span class="summary-label">Consommé depuis le {{ formatDayLabel(previous.date) }}</span>
        <span class="summary-value">
          {{ consumedPercent }} % ≈ {{ formatSteres(calculateConsumptionSteres(volumeSteres, consumedPercent)) }}
        </span>
      </template>
      <span v-else class="summary-label">Premier relevé : il servira de point de départ.</span>
    </div>

    <section class="field">
      <label class="field-label" for="reading-notes">Note (facultatif)</label>
      <textarea
        id="reading-notes"
        v-model="notes"
        class="notes"
        rows="2"
        placeholder="Ex. grand froid, invités, poêle éteint…"
      />
    </section>

    <ul v-if="errors.length" class="errors">
      <li v-for="error in errors" :key="error">{{ error }}</li>
    </ul>

    <div class="actions">
      <BaseButton v-if="isEdit" type="button" variant="danger" @click="emit('delete')">
        Supprimer
      </BaseButton>
      <BaseButton v-if="isEdit" type="button" variant="secondary" @click="emit('cancel')">
        Annuler
      </BaseButton>
      <BaseButton type="submit" size="large" class="submit" :loading="loading" :disabled="errors.length > 0">
        {{ isEdit ? 'Enregistrer' : 'Enregistrer le relevé' }}
      </BaseButton>
    </div>
  </form>
</template>

<style scoped>
.reading-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.field-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.week-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.date-row {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
}

.date-input {
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font: inherit;
  background: var(--color-surface);
  color: var(--color-text);
  min-height: 44px;
}

.chips {
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
}

.chip {
  padding: 0.5rem 0.75rem;
  min-height: 36px;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.chip.active {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: 600;
}

.reload {
  padding: 0.875rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-background);
}

.toggle {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  font-weight: 600;
  cursor: pointer;
  min-height: 32px;
}

.toggle input {
  width: 20px;
  height: 20px;
  accent-color: var(--color-primary);
}

.reload-levels {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  padding-top: 0.5rem;
}

.arrow {
  font-size: 1.25rem;
  color: var(--color-text-muted);
}

.notice {
  margin: 0;
  padding: 0.625rem 0.75rem;
  border-radius: 8px;
  background: #fff3e0;
  color: #8a4a00;
  font-size: 0.8125rem;
}

.link {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  font-weight: 700;
  color: var(--color-primary);
  text-decoration: underline;
  cursor: pointer;
}

.summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding: 0.875rem 1rem;
  border-radius: 10px;
  background: var(--color-primary-light);
}

.summary-label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.summary-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-primary);
}

.notes {
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font: inherit;
  background: var(--color-surface);
  color: var(--color-text);
  resize: vertical;
}

.notes:focus,
.date-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.errors {
  margin: 0;
  padding: 0.75rem 1rem 0.75rem 2rem;
  border-radius: 8px;
  background: #fdecea;
  color: var(--color-danger-dark);
  font-size: 0.875rem;
}

.actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.submit {
  flex: 1;
  min-width: 200px;
}
</style>
