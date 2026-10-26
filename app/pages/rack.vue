<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useRackStore } from '~/stores/rackStore'
import RackForm from '~/components/rack/RackForm.vue'
import type { RackFormData } from '#shared/types'
import { useToast } from '~/composables/useToast'

const router = useRouter()
const rackStore = useRackStore()
const toast = useToast()
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
    router.push('/')
  } catch (e) {
    toast.showError(e)
  }
}
</script>

<template>
  <div class="page">
    <RackForm :rack="rack" :loading="loading" @submit="handleSubmit" />
  </div>
</template>
