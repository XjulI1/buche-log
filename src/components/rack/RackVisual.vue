<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  level: number // 0-100
  height?: number
  width?: number
}>()

const fillHeight = computed(() => `${props.level}%`)

const levelColor = computed(() => {
  if (props.level > 60) return 'var(--color-success)'
  if (props.level > 30) return 'var(--color-warning)'
  return 'var(--color-danger)'
})
</script>

<template>
  <div class="rack-visual" :style="{ '--rack-height': `${height ?? 150}px` }">
    <div class="rack-container">
      <div class="rack-fill" :style="{ height: fillHeight, background: levelColor }"></div>
      <div class="rack-logs">
        <div v-for="i in 8" :key="i" class="log-row">
          <div v-for="j in 4" :key="j" class="log"></div>
        </div>
      </div>
    </div>
    <div class="rack-level">{{ level }}%</div>
  </div>
</template>

<style scoped>
.rack-visual {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.rack-container {
  width: 120px;
  height: var(--rack-height);
  background: var(--color-surface);
  border: 3px solid var(--color-border);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.rack-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  transition: height 0.5s ease, background 0.3s ease;
}

.rack-logs {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column-reverse;
  padding: 4px;
  gap: 2px;
  opacity: 0.3;
}

.log-row {
  display: flex;
  gap: 2px;
  justify-content: center;
}

.log {
  width: 24px;
  height: 12px;
  background: #8b4513;
  border-radius: 2px;
}

.rack-level {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
}
</style>
