<script setup lang="ts">
import { computed, ref } from 'vue'
import { levelColor } from '~/components/rack/levelColor'

const model = defineModel<number>({ required: true })

defineProps<{
  label?: string
  previousLevel?: number | null
  previousLabel?: string
  height?: number
}>()

/** Reperes sur lesquels le niveau s'aimante pendant le glisser */
const SNAPS = [0, 25, 50, 75, 100]
const SNAP_DISTANCE = 3

const rackEl = ref<HTMLElement | null>(null)
const dragging = ref(false)

const fillColor = computed(() => levelColor(model.value))

function clamp(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)))
}

function levelFromPointer(event: PointerEvent): number {
  const rect = rackEl.value!.getBoundingClientRect()
  const raw = ((rect.bottom - event.clientY) / rect.height) * 100
  const snap = SNAPS.find((s) => Math.abs(s - raw) <= SNAP_DISTANCE)
  return clamp(snap ?? raw)
}

function onPointerDown(event: PointerEvent) {
  dragging.value = true
  rackEl.value?.setPointerCapture(event.pointerId)
  model.value = levelFromPointer(event)
}

function onPointerMove(event: PointerEvent) {
  if (dragging.value) model.value = levelFromPointer(event)
}

function onPointerUp() {
  dragging.value = false
}

function step(delta: number) {
  model.value = clamp(model.value + delta)
}

function onKeydown(event: KeyboardEvent) {
  const deltas: Record<string, number> = {
    ArrowUp: 1,
    ArrowRight: 1,
    ArrowDown: -1,
    ArrowLeft: -1,
    PageUp: 10,
    PageDown: -10,
  }
  if (event.key in deltas) {
    event.preventDefault()
    step(deltas[event.key]!)
  } else if (event.key === 'Home') {
    model.value = 0
  } else if (event.key === 'End') {
    model.value = 100
  }
}

function onNumberInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  if (!Number.isNaN(value)) model.value = clamp(value)
}
</script>

<template>
  <div class="level-picker" :style="{ '--rack-height': `${height ?? 200}px` }">
    <div
      ref="rackEl"
      class="rack"
      :class="{ dragging }"
      role="slider"
      tabindex="0"
      :aria-label="label ?? 'Niveau'"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="model"
      :aria-valuetext="`${model} %`"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @keydown="onKeydown"
    >
      <div class="fill" :style="{ height: `${model}%`, background: fillColor }" />
      <div class="logs">
        <div v-for="i in 10" :key="i" class="log-row">
          <div v-for="j in 4" :key="j" class="log" />
        </div>
      </div>
      <div v-for="mark in [25, 50, 75]" :key="mark" class="mark" :style="{ bottom: `${mark}%` }">
        <span class="mark-label">{{ mark === 50 ? '½' : mark === 25 ? '¼' : '¾' }}</span>
      </div>
      <div
        v-if="previousLevel != null"
        class="previous"
        :style="{ bottom: `${previousLevel}%` }"
        :title="`${previousLabel ?? 'Relevé précédent'} : ${previousLevel} %`"
      />
      <div class="handle" :style="{ bottom: `${model}%` }" />
    </div>

    <div class="controls">
      <span v-if="label" class="label">{{ label }}</span>
      <div class="value-row">
        <button type="button" class="step" aria-label="Moins 5 %" @click="step(-5)">−5</button>
        <label class="value">
          <input
            type="number"
            inputmode="numeric"
            min="0"
            max="100"
            :value="model"
            :aria-label="label ?? 'Niveau en pourcentage'"
            @change="onNumberInput"
          >
          <span>%</span>
        </label>
        <button type="button" class="step" aria-label="Plus 5 %" @click="step(5)">+5</button>
      </div>
      <input
        v-model.number="model"
        type="range"
        class="slider"
        min="0"
        max="100"
        step="1"
        :style="{ '--progress': `${model}%` }"
        :aria-label="label ?? 'Niveau'"
      >
      <span v-if="previousLevel != null" class="previous-hint">
        <span class="previous-swatch" /> {{ previousLabel ?? 'Relevé précédent' }} : {{ previousLevel }} %
      </span>
      <span class="hint">Touchez ou faites glisser sur le porte-bûches</span>
    </div>
  </div>
</template>

<style scoped>
.level-picker {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

.rack {
  width: 130px;
  height: var(--rack-height);
  flex-shrink: 0;
  background: var(--color-surface);
  border: 3px solid var(--color-border);
  border-radius: 10px;
  position: relative;
  overflow: hidden;
  cursor: ns-resize;
  touch-action: none;
  user-select: none;
}

.rack:focus-visible,
.rack.dragging {
  border-color: var(--color-primary);
}

.fill {
  position: absolute;
  inset: auto 0 0 0;
  opacity: 0.85;
  transition: background 0.3s ease;
}

.rack:not(.dragging) .fill,
.rack:not(.dragging) .handle {
  transition:
    height 0.15s ease,
    bottom 0.15s ease,
    background 0.3s ease;
}

.logs {
  position: absolute;
  inset: auto 0 0 0;
  display: flex;
  flex-direction: column-reverse;
  padding: 4px;
  gap: 3px;
  opacity: 0.25;
  pointer-events: none;
}

.log-row {
  display: flex;
  gap: 3px;
  justify-content: center;
}

.log {
  width: 26px;
  height: 14px;
  background: #8b4513;
  border-radius: 7px;
}

.mark {
  position: absolute;
  left: 0;
  right: 0;
  border-top: 1px dashed var(--color-text-muted);
  pointer-events: none;
}

.mark-label {
  position: absolute;
  right: 4px;
  top: -0.6rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.previous {
  position: absolute;
  left: 0;
  right: 0;
  border-top: 2px dotted var(--color-text);
  pointer-events: none;
}

.handle {
  position: absolute;
  left: 50%;
  width: 44px;
  height: 8px;
  margin-bottom: -4px;
  transform: translateX(-50%);
  background: var(--color-surface);
  border: 2px solid var(--color-text);
  border-radius: 4px;
  pointer-events: none;
}

.controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  min-width: 200px;
  flex: 1;
  max-width: 280px;
}

.label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.value-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.step {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
  cursor: pointer;
}

.step:active {
  background: var(--color-primary-light);
}

.value {
  display: flex;
  align-items: baseline;
  gap: 0.125rem;
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--color-text);
}

.value input {
  width: 3.2ch;
  border: none;
  border-bottom: 2px solid var(--color-border);
  background: transparent;
  font: inherit;
  color: inherit;
  text-align: right;
  appearance: textfield;
  -moz-appearance: textfield;
}

.value input::-webkit-inner-spin-button,
.value input::-webkit-outer-spin-button {
  appearance: none;
  margin: 0;
}

.value input:focus {
  outline: none;
  border-bottom-color: var(--color-primary);
}

.slider {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(
    to right,
    var(--color-primary) var(--progress),
    var(--color-border) var(--progress)
  );
  appearance: none;
  cursor: pointer;
}

.slider::-webkit-slider-thumb {
  appearance: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-primary);
  border: 3px solid white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.slider::-moz-range-thumb {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--color-primary);
  border: 3px solid white;
}

.previous-hint,
.hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-align: center;
}

.previous-hint {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--color-text-secondary);
}

.previous-swatch {
  width: 18px;
  border-top: 2px dotted var(--color-text);
}
</style>
