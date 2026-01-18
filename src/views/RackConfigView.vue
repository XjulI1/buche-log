<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useRackStore } from '@/stores'
import RackForm from '@/components/rack/RackForm.vue'
import type { RackFormData } from '@/types'

const router = useRouter()
const rackStore = useRackStore()
const { rack, loading } = storeToRefs(rackStore)

onMounted(() => {
  rackStore.loadRack()
})

async function handleSubmit(data: RackFormData) {
  try {
    if (rack.value) {
      await rackStore.updateRack(data)
    } else {
      await rackStore.createRack(data)
    }
    router.push({ name: 'home' })
  } catch {
    // Error is handled in store
  }
}
</script>

<template>
  <div class="page">
    <RackForm :rack="rack" :loading="loading" @submit="handleSubmit" />
  </div>
</template>
