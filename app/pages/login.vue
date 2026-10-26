<script setup lang="ts">
import { useRouter } from 'vue-router'
import BaseCard from '~/components/common/BaseCard.vue'
import LoginForm from '~/components/account/LoginForm.vue'

const router = useRouter()
</script>

<template>
  <div class="page">
    <BaseCard>
      <LoginForm @authenticated="router.push('/')" />
    </BaseCard>
  </div>
</template>
