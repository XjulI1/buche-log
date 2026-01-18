<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useRackStore, useConsumptionStore } from '@/stores'
import { useExportImport } from '@/composables'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseCard from '@/components/common/BaseCard.vue'

const router = useRouter()
const rackStore = useRackStore()
const consumptionStore = useConsumptionStore()
const { downloadExport, importFromFile, resetAllData } = useExportImport()

const { rack } = storeToRefs(rackStore)

const importStatus = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

onMounted(() => {
  rackStore.loadRack()
})

async function handleExport() {
  try {
    await downloadExport()
  } catch {
    alert('Erreur lors de l\'export')
  }
}

function triggerImport() {
  fileInput.value?.click()
}

async function handleImport(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  try {
    const result = await importFromFile(file)
    importStatus.value = `Import reussi: ${result.racks} porte-buches, ${result.consumptions} enregistrements`
    await rackStore.loadRack()
    await consumptionStore.loadEntries()
  } catch {
    importStatus.value = 'Erreur lors de l\'import'
  }

  // Reset input
  input.value = ''
}

async function handleReset() {
  if (!confirm('Supprimer toutes les donnees ? Cette action est irreversible.')) {
    return
  }
  if (!confirm('Etes-vous vraiment sur ?')) {
    return
  }

  try {
    await resetAllData()
    await rackStore.loadRack()
    await consumptionStore.loadEntries()
    router.push({ name: 'home' })
  } catch {
    alert('Erreur lors de la reinitialisation')
  }
}

function goToRackConfig() {
  router.push({ name: 'rack' })
}
</script>

<template>
  <div class="page">
    <div class="settings-content">
      <BaseCard title="Porte-buches">
        <div v-if="rack" class="rack-summary">
          <p>
            <strong>{{ rack.name }}</strong>
          </p>
          <p>{{ rack.height }} x {{ rack.width }} x {{ rack.depth }} cm</p>
          <p>Buches de {{ rack.logSize }} cm</p>
          <p class="volume">{{ rack.volumeSteres.toFixed(2) }} steres</p>
        </div>
        <div v-else class="no-rack">Aucun porte-buches configure</div>
        <BaseButton variant="secondary" @click="goToRackConfig">
          {{ rack ? 'Modifier' : 'Configurer' }}
        </BaseButton>
      </BaseCard>

      <BaseCard title="Donnees">
        <div class="data-actions">
          <div class="action-item">
            <p class="action-description">Telecharger une sauvegarde de vos donnees</p>
            <BaseButton variant="secondary" @click="handleExport"> Exporter </BaseButton>
          </div>

          <div class="action-item">
            <p class="action-description">Restaurer depuis une sauvegarde</p>
            <input
              ref="fileInput"
              type="file"
              accept=".json"
              class="hidden"
              @change="handleImport"
            />
            <BaseButton variant="secondary" @click="triggerImport"> Importer </BaseButton>
          </div>

          <div v-if="importStatus" class="import-status">{{ importStatus }}</div>
        </div>
      </BaseCard>

      <BaseCard title="Zone de danger">
        <div class="danger-zone">
          <p class="danger-description">
            Supprimer toutes les donnees. Cette action est irreversible.
          </p>
          <BaseButton variant="danger" @click="handleReset"> Reinitialiser </BaseButton>
        </div>
      </BaseCard>

      <div class="app-info">
        <p>Buche-Log v1.0.0</p>
        <p>Application de suivi de consommation de bois</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.rack-summary {
  margin-bottom: 1rem;
}

.rack-summary p {
  margin: 0.25rem 0;
}

.rack-summary .volume {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-top: 0.5rem;
}

.no-rack {
  color: var(--color-text-muted);
  margin-bottom: 1rem;
}

.data-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.action-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-border);
}

.action-item:last-of-type {
  border-bottom: none;
}

.action-description {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0;
  flex: 1;
}

.hidden {
  display: none;
}

.import-status {
  padding: 0.75rem;
  background: var(--color-primary-light);
  border-radius: 8px;
  font-size: 0.875rem;
  color: var(--color-primary);
}

.danger-zone {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.danger-description {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0;
  flex: 1;
}

.app-info {
  text-align: center;
  padding: 1rem;
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.app-info p {
  margin: 0.25rem 0;
}
</style>
