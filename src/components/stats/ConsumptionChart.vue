<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type TooltipItem,
} from 'chart.js'
import type { YearlyStats } from '@/types'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const props = defineProps<{
  stats: YearlyStats
}>()

const chartData = computed(() => {
  const weeksWithData = props.stats.weeks.filter((w) => w.entries > 0 || w.totalConsumedSteres > 0)

  return {
    labels: weeksWithData.map((w) => `S${w.weekNumber}`),
    datasets: [
      {
        label: 'Steres consommes',
        data: weeksWithData.map((w) => w.totalConsumedSteres),
        backgroundColor: 'rgba(139, 69, 19, 0.7)',
        borderColor: 'rgb(139, 69, 19)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    title: {
      display: true,
      text: `Consommation ${props.stats.year}`,
      font: {
        size: 16,
        weight: 'bold' as const,
      },
    },
    tooltip: {
      callbacks: {
        label: (context: TooltipItem<'bar'>) => {
          const value = context.parsed.y ?? 0
          return `${value.toFixed(2)} steres`
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Steres',
      },
    },
    x: {
      title: {
        display: true,
        text: 'Semaine',
      },
    },
  },
}
</script>

<template>
  <div class="chart-container">
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>

<style scoped>
.chart-container {
  height: 300px;
  padding: 1rem;
  background: var(--color-surface);
  border-radius: 12px;
  border: 1px solid var(--color-border);
}
</style>
