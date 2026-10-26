<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  LineController,
  BarController,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
  type TooltipItem,
} from 'chart.js'
import type { SeasonStats } from '#shared/types'
import { formatSeason, formatSteres } from '~/services/calculations'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  LineController,
  BarController,
  Tooltip,
  Legend,
)

// Palette validee (scripts/validate_palette.js, mode clair) : brun bois / bleu
const CURRENT_COLOR = '#8b4513'
const PREVIOUS_COLOR = '#3f7cb8'

const props = defineProps<{
  current: SeasonStats
  previous: SeasonStats | null
  /** Nombre de semaines a afficher (depuis le debut de la saison) */
  weekCount: number
}>()

const chartData = computed(() => {
  const weeks = props.current.weeks.slice(0, props.weekCount)
  const data: ChartData<'bar' | 'line', (number | null)[], string> = {
    labels: weeks.map((w) => `S${w.weekNumber}`),
    datasets: [
      {
        type: 'bar',
        label: `Saison ${formatSeason(props.current.season)}`,
        data: weeks.map((w) => (w.entries > 0 ? w.consumedSteres : null)),
        backgroundColor: CURRENT_COLOR,
        borderRadius: 4,
        borderSkipped: 'start',
        maxBarThickness: 28,
        order: 2,
      },
    ],
  }
  if (props.previous) {
    data.datasets.push({
      type: 'line',
      label: `Saison ${formatSeason(props.previous.season)}`,
      data: props.previous.weeks.slice(0, props.weekCount).map((w) => w.consumedSteres),
      borderColor: PREVIOUS_COLOR,
      backgroundColor: PREVIOUS_COLOR,
      borderWidth: 2,
      borderDash: [6, 4],
      pointRadius: 0,
      pointHoverRadius: 5,
      tension: 0.3,
      order: 1,
    })
  }
  return data
})

// Chart.js plante quand le nombre ou le type des series change sur un graphique existant
// (apparition de la saison precedente, changement de saison) : on le recree dans ce cas.
const chartKey = computed(
  () => `${props.current.season}-${props.previous?.season ?? 'none'}-${props.weekCount}`,
)

const chartOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: {
      position: 'top',
      align: 'start',
      labels: { usePointStyle: true, boxHeight: 8, color: '#5c5347' },
    },
    tooltip: {
      callbacks: {
        label: (context: TooltipItem<'bar'>) =>
          `${context.dataset.label} : ${formatSteres(context.parsed.y ?? 0)}`,
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      title: { display: true, text: 'Stères', color: '#8c8377' },
      grid: { color: '#efebe6' },
      ticks: { color: '#8c8377' },
      border: { display: false },
    },
    x: {
      grid: { display: false },
      ticks: { color: '#8c8377', autoSkip: true, maxRotation: 0 },
    },
  },
}
</script>

<template>
  <div class="chart-container">
    <Bar
      :key="chartKey"
      :data="chartData as ChartData<'bar'>"
      :options="chartOptions"
      dataset-id-key="label"
    />
  </div>
</template>

<style scoped>
.chart-container {
  height: 300px;
}

@media (min-width: 900px) {
  .chart-container {
    height: 360px;
  }
}
</style>
