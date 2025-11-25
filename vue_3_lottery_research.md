# Vue.js 3 Best Practices for Lottery Prediction Website Frontend

## 1. Vue 3 Composition API vs Options API for Data Visualization

### Composition API Advantages for Lottery Data

**Recommended: Composition API for lottery prediction websites**

**Why Composition API is preferred:**

1. **Better Logic Organization**: Lottery applications have complex statistical logic that can be organized by feature rather than by option type

```vue
<!-- Composition API Example for Lottery Data Visualization -->
<template>
  <div class="lottery-dashboard">
    <LotteryChart :data="chartData" :options="chartOptions" />
    <PredictionControls
      v-model="selectedNumbers"
      @predict="handlePrediction"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useLotteryStore } from '@/stores/lottery'
import LotteryChart from '@/components/LotteryChart.vue'
import PredictionControls from '@/components/PredictionControls.vue'

// Reactive state for lottery data
const lotteryStore = useLotteryStore()
const selectedNumbers = ref([])
const historicalData = ref([])

// Computed properties for data transformation
const chartData = computed(() => {
  return lotteryStore.historicalDraws.map(draw => ({
    date: draw.date,
    numbers: draw.numbers,
    frequency: calculateFrequency(draw.numbers)
  }))
})

const chartOptions = computed(() => ({
  responsive: true,
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Frequency'
      }
    }
  }
}))

// Watchers for real-time updates
watch(selectedNumbers, (newSelection) => {
  lotteryStore.updatePrediction(newSelection)
}, { deep: true })

// Methods for lottery logic
const calculateFrequency = (numbers) => {
  return lotteryStore.getNumberFrequency(numbers)
}

const handlePrediction = async () => {
  await lotteryStore.generatePrediction(selectedNumbers.value)
}

// Lifecycle hooks
onMounted(async () => {
  await lotteryStore.fetchHistoricalData()
})
</script>
```

2. **Better TypeScript Support**: Essential for statistical calculations and type safety

```typescript
// composables/useLotteryStats.ts
import { ref, computed } from 'vue'
import type { Ref } from 'vue'

interface LotteryNumber {
  value: number
  frequency: number
  lastDrawn: Date
  hotness: 'hot' | 'cold' | 'normal'
}

export function useLotteryStats(historicalData: Ref<Draw[]>) {
  const numberStats = ref<LotteryNumber[]>([])

  const hotNumbers = computed(() =>
    numberStats.value.filter(n => n.hotness === 'hot')
  )

  const coldNumbers = computed(() =>
    numberStats.value.filter(n => n.hotness === 'cold')
  )

  const calculateStatistics = () => {
    // Statistical calculations for lottery numbers
  }

  return {
    numberStats,
    hotNumbers,
    coldNumbers,
    calculateStatistics
  }
}
```

### When Options API Might Be Considered

Only for very simple components that don't require complex state management or composables.

## 2. State Management Patterns for Prediction Data and User History

### Pinia - Recommended for Vue 3 Lottery Applications

**Pinia is the official state management library for Vue 3 and is perfect for lottery applications:**

```typescript
// stores/lotteryStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface Draw {
  id: string
  date: Date
  numbers: number[]
  jackpot: number
}

interface Prediction {
  id: string
  userId: string
  numbers: number[]
  confidence: number
  createdAt: Date
  result?: 'win' | 'lose'
}

export const useLotteryStore = defineStore('lottery', () => {
  // State
  const historicalDraws = ref<Draw[]>([])
  const predictions = ref<Prediction[]>([])
  const currentPrediction = ref<Prediction | null>(null)
  const userHistory = ref<Prediction[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const recentDraws = computed(() =>
    historicalDraws.value.slice(0, 10)
  )

  const hotNumbers = computed(() => {
    const frequency = calculateNumberFrequency()
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([num]) => parseInt(num))
  })

  const coldNumbers = computed(() => {
    const frequency = calculateNumberFrequency()
    return Object.entries(frequency)
      .sort(([,a], [,b]) => a - b)
      .slice(0, 10)
      .map(([num]) => parseInt(num))
  })

  const winRate = computed(() => {
    const userWins = userHistory.value.filter(p => p.result === 'win').length
    return userHistory.value.length > 0
      ? (userWins / userHistory.value.length) * 100
      : 0
  })

  // Actions
  async function fetchHistoricalData() {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch('/api/lottery/history')
      historicalDraws.value = await response.json()
    } catch (err) {
      error.value = 'Failed to fetch historical data'
      console.error(err)
    } finally {
      isLoading.value = false
    }
  }

  async function generatePrediction(userNumbers: number[]) {
    isLoading.value = true

    try {
      const response = await fetch('/api/lottery/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numbers: userNumbers })
      })

      currentPrediction.value = await response.json()
      predictions.value.push(currentPrediction.value)
    } catch (err) {
      error.value = 'Failed to generate prediction'
      console.error(err)
    } finally {
      isLoading.value = false
    }
  }

  function calculateNumberFrequency() {
    const frequency: Record<string, number> = {}

    historicalDraws.value.forEach(draw => {
      draw.numbers.forEach(num => {
        frequency[num] = (frequency[num] || 0) + 1
      })
    })

    return frequency
  }

  function updateUserHistory(prediction: Prediction) {
    userHistory.value.push(prediction)
    // Persist to localStorage
    localStorage.setItem('lottery-history', JSON.stringify(userHistory.value))
  }

  function loadUserHistory() {
    const saved = localStorage.getItem('lottery-history')
    if (saved) {
      userHistory.value = JSON.parse(saved)
    }
  }

  return {
    // State
    historicalDraws,
    predictions,
    currentPrediction,
    userHistory,
    isLoading,
    error,

    // Getters
    recentDraws,
    hotNumbers,
    coldNumbers,
    winRate,

    // Actions
    fetchHistoricalData,
    generatePrediction,
    updateUserHistory,
    loadUserHistory
  }
})
```

### Composables for Modular State Management

```typescript
// composables/useLocalStorage.ts
import { ref, watch } from 'vue'

export function useLocalStorage<T>(key: string, defaultValue: T) {
  const storedValue = ref<T>(defaultValue)

  if (typeof window !== 'undefined') {
    const item = window.localStorage.getItem(key)
    if (item) {
      storedValue.value = JSON.parse(item)
    }

    watch(storedValue, (newValue) => {
      window.localStorage.setItem(key, JSON.stringify(newValue))
    }, { deep: true })
  }

  return storedValue
}

// Usage in components
const userPreferences = useLocalStorage('lottery-preferences', {
  favoriteNumbers: [],
  notifications: true,
  theme: 'light'
})
```

### Real-time Data Management with WebSocket

```typescript
// composables/useWebSocket.ts
import { ref, onUnmounted } from 'vue'

export function useWebSocket(url: string) {
  const socket = ref<WebSocket | null>(null)
  const data = ref<any>(null)
  const isConnected = ref(false)
  const error = ref<string | null>(null)

  const connect = () => {
    socket.value = new WebSocket(url)

    socket.value.onopen = () => {
      isConnected.value = true
      error.value = null
    }

    socket.value.onmessage = (event) => {
      data.value = JSON.parse(event.data)
    }

    socket.value.onerror = (err) => {
      error.value = 'WebSocket connection error'
      console.error(err)
    }

    socket.value.onclose = () => {
      isConnected.value = false
    }
  }

  const disconnect = () => {
    if (socket.value) {
      socket.value.close()
      socket.value = null
    }
  }

  onUnmounted(() => {
    disconnect()
  })

  return {
    data,
    isConnected,
    error,
    connect,
    disconnect
  }
}
```

## 3. Chart Libraries Compatible with Vue 3 for Lottery Data Visualization

### Top Recommended Chart Libraries

#### 1. Chart.js with vue-chartjs (Most Popular & Flexible)

**Installation:**
```bash
npm install chart.js vue-chartjs
```

**Usage for Lottery Data:**
```vue
<template>
  <div class="lottery-charts">
    <Line
      :data="frequencyChartData"
      :options="frequencyChartOptions"
      class="frequency-chart"
    />
    <Bar
      :data="hotColdChartData"
      :options="hotColdChartOptions"
      class="hot-cold-chart"
    />
    <Doughnut
      :data="distributionChartData"
      :options="distributionChartOptions"
      class="distribution-chart"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Line, Bar, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

import { useLotteryStore } from '@/stores/lottery'

const lotteryStore = useLotteryStore()

// Frequency line chart for number appearance over time
const frequencyChartData = computed(() => ({
  labels: lotteryStore.historicalDraws.map(draw =>
    new Date(draw.date).toLocaleDateString()
  ),
  datasets: [
    {
      label: 'Number Frequency',
      data: lotteryStore.historicalDraws.map(draw => draw.numbers.length),
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.4,
      fill: true
    }
  ]
}))

const frequencyChartOptions = {
  responsive: true,
  plugins: {
    title: {
      display: true,
      text: 'Number Frequency Over Time'
    },
    legend: {
      display: true
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Frequency'
      }
    }
  }
}

// Hot/Cold numbers bar chart
const hotColdChartData = computed(() => ({
  labels: Array.from({ length: 50 }, (_, i) => i + 1),
  datasets: [
    {
      label: 'Hot Numbers',
      data: lotteryStore.hotNumbers.map(num =>
        lotteryStore.getNumberFrequency(num)
      ),
      backgroundColor: 'rgba(255, 99, 132, 0.8)',
    },
    {
      label: 'Cold Numbers',
      data: lotteryStore.coldNumbers.map(num =>
        lotteryStore.getNumberFrequency(num)
      ),
      backgroundColor: 'rgba(54, 162, 235, 0.8)',
    }
  ]
}))

// Number distribution doughnut chart
const distributionChartData = computed(() => ({
  labels: ['1-10', '11-20', '21-30', '31-40', '41-50'],
  datasets: [
    {
      data: calculateDistribution(),
      backgroundColor: [
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)'
      ]
    }
  ]
}))

function calculateDistribution() {
  // Calculate number distribution across ranges
  return [12, 19, 15, 25, 22] // Example data
}
</script>
```

#### 2. ECharts with Vue-ECharts (Powerful & Interactive)

**Installation:**
```bash
npm install echarts vue-echarts
```

**Usage:**
```vue
<template>
  <v-chart
    class="chart"
    :option="lotteryHeatmapOption"
    autoresize
  />
  <v-chart
    class="chart"
    :option="predictionScatterOption"
    autoresize
  />
</template>

<script setup>
import { ref, computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import {
  CanvasRenderer
} from 'echarts/renderers'
import {
  HeatmapChart,
  ScatterChart,
  LineChart
} from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  VisualMapComponent
} from 'echarts/components'

use([
  CanvasRenderer,
  HeatmapChart,
  ScatterChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  VisualMapComponent
])

// Lottery number heatmap
const lotteryHeatmapOption = computed(() => ({
  title: {
    text: 'Number Frequency Heatmap'
  },
  tooltip: {
    position: 'top'
  },
  grid: {
    height: '50%',
    top: '10%'
  },
  xAxis: {
    type: 'category',
    data: Array.from({ length: 50 }, (_, i) => i + 1),
    splitArea: {
      show: true
    }
  },
  yAxis: {
    type: 'category',
    data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    splitArea: {
      show: true
    }
  },
  visualMap: {
    min: 0,
    max: 10,
    calculable: true,
    orient: 'horizontal',
    left: 'center',
    bottom: '15%'
  },
  series: [{
    name: 'Number Frequency',
    type: 'heatmap',
    data: generateHeatmapData(),
    label: {
      show: true
    },
    emphasis: {
      itemStyle: {
        shadowBlur: 10,
        shadowColor: 'rgba(0, 0, 0, 0.5)'
      }
    }
  }]
}))

function generateHeatmapData() {
  // Generate heatmap data for lottery numbers
  const data = []
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < 50; j++) {
      data.push([j, i, Math.floor(Math.random() * 10)])
    }
  }
  return data
}
</script>

<style scoped>
.chart {
  height: 400px;
  width: 100%;
}
</style>
```

#### 3. D3.js with Vue (Ultimate Flexibility)

**Installation:**
```bash
npm install d3 @types/d3
```

**Custom Lottery Visualization:**
```vue
<template>
  <div ref="chartContainer" class="d3-chart"></div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import * as d3 from 'd3'

const chartContainer = ref(null)
const props = defineProps<{
  data: Array<{ number: number; frequency: number; date: string }>
}>()

onMounted(() => {
  renderChart()
})

watch(() => props.data, renderChart, { deep: true })

function renderChart() {
  if (!chartContainer.value) return

  // Clear previous chart
  d3.select(chartContainer.value).selectAll('*').remove()

  const margin = { top: 20, right: 30, bottom: 40, left: 90 }
  const width = 800 - margin.left - margin.right
  const height = 400 - margin.top - margin.bottom

  const svg = d3.select(chartContainer.value)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // Create scales
  const x = d3.scaleLinear()
    .domain([1, 50])
    .range([0, width])

  const y = d3.scaleLinear()
    .domain([0, d3.max(props.data, d => d.frequency) || 0])
    .range([height, 0])

  // Create bars
  svg.selectAll('.bar')
    .data(props.data)
    .enter().append('rect')
    .attr('class', 'bar')
    .attr('x', d => x(d.number - 0.5))
    .attr('width', width / 50)
    .attr('y', d => y(d.frequency))
    .attr('height', d => height - y(d.frequency))
    .attr('fill', d => d.frequency > 5 ? 'rgba(255, 99, 132, 0.8)' : 'rgba(54, 162, 235, 0.8)')

  // Add axes
  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x))

  svg.append('g')
    .call(d3.axisLeft(y))
}
</script>
```

### Library Comparison for Lottery Applications

| Library | Best For | Learning Curve | Performance | Customization |
|---------|----------|----------------|-------------|---------------|
| Chart.js | Standard charts, quick setup | Easy | Good | Medium |
| ECharts | Complex interactive visualizations | Medium | Excellent | High |
| D3.js | Custom visualizations, advanced analytics | Hard | Excellent | Unlimited |

**Recommendation:** Start with Chart.js for basic charts, add ECharts for heatmaps and complex visualizations, use D3.js for custom lottery-specific visualizations.

## 4. Component Architecture for Prediction Interfaces

### Recommended Component Structure

```
src/
├── components/
│   ├── lottery/
│   │   ├── LotteryDashboard.vue          # Main dashboard
│   │   ├── NumberPicker.vue              # Number selection interface
│   │   ├── PredictionResults.vue         # Display prediction results
│   │   ├── HistoricalCharts.vue          # Historical data charts
│   │   ├── HotColdNumbers.vue            # Hot/cold number display
│   │   ├── StatisticsPanel.vue           # Statistics and analytics
│   │   └── PredictionHistory.vue         # User prediction history
│   ├── charts/
│   │   ├── FrequencyChart.vue            # Number frequency chart
│   │   ├── TrendChart.vue                # Trend analysis chart
│   │   ├── HeatmapChart.vue              # Number frequency heatmap
│   │   └── DistributionChart.vue         # Number distribution chart
│   ├── ui/
│   │   ├── NumberBall.vue                # Individual number ball
│   │   ├── NumberGrid.vue                # Grid of number balls
│   │   ├── StatCard.vue                  # Statistics card
│   │   └── LoadingSpinner.vue            # Loading indicator
│   └── layout/
│       ├── Header.vue                    # Application header
│       ├── Sidebar.vue                   # Navigation sidebar
│       └── Footer.vue                    # Application footer
├── composables/
│   ├── useLotteryStats.ts                # Lottery statistics logic
│   ├── usePrediction.ts                  # Prediction logic
│   ├── useChart.ts                       # Chart utilities
│   └── useWebSocket.ts                   # Real-time data
├── stores/
│   ├── lottery.ts                        # Main lottery store
│   └── user.ts                           # User preferences store
└── types/
    ├── lottery.ts                        # TypeScript types
    └── prediction.ts                     # Prediction types
```

### Core Component Implementations

#### 1. Main Dashboard Component

```vue
<!-- components/lottery/LotteryDashboard.vue -->
<template>
  <div class="lottery-dashboard">
    <div class="dashboard-header">
      <h1>Lottery Prediction Dashboard</h1>
      <div class="stats-summary">
        <StatCard
          v-for="stat in stats"
          :key="stat.label"
          :label="stat.label"
          :value="stat.value"
          :icon="stat.icon"
        />
      </div>
    </div>

    <div class="dashboard-content">
      <div class="main-panel">
        <NumberPicker
          v-model="selectedNumbers"
          :max-numbers="6"
          :number-range="[1, 50]"
          @selection-change="handleSelectionChange"
        />

        <PredictionResults
          :prediction="currentPrediction"
          :loading="isPredicting"
          @generate-prediction="generatePrediction"
        />
      </div>

      <div class="side-panel">
        <HotColdNumbers
          :hot-numbers="hotNumbers"
          :cold-numbers="coldNumbers"
          @number-select="addNumberToSelection"
        />

        <HistoricalCharts
          :data="historicalData"
          :chart-type="activeChartType"
          @chart-type-change="updateChartType"
        />
      </div>
    </div>

    <div class="dashboard-footer">
      <PredictionHistory
        :history="userHistory"
        @history-item-click="loadHistoricalPrediction"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useLotteryStore } from '@/stores/lottery'
import { useWebSocket } from '@/composables/useWebSocket'

// Components
import StatCard from '@/components/ui/StatCard.vue'
import NumberPicker from '@/components/lottery/NumberPicker.vue'
import PredictionResults from '@/components/lottery/PredictionResults.vue'
import HotColdNumbers from '@/components/lottery/HotColdNumbers.vue'
import HistoricalCharts from '@/components/lottery/HistoricalCharts.vue'
import PredictionHistory from '@/components/lottery/PredictionHistory.vue'

// Store and composables
const lotteryStore = useLotteryStore()
const { data: realtimeData } = useWebSocket('ws://localhost:3000/lottery-updates')

// Local state
const selectedNumbers = ref<number[]>([])
const activeChartType = ref<'frequency' | 'trend' | 'heatmap'>('frequency')
const isPredicting = ref(false)

// Computed properties
const stats = computed(() => [
  {
    label: 'Win Rate',
    value: `${lotteryStore.winRate.toFixed(1)}%`,
    icon: 'trophy'
  },
  {
    label: 'Total Predictions',
    value: lotteryStore.userHistory.length,
    icon: 'chart-line'
  },
  {
    label: 'Hot Numbers',
    value: lotteryStore.hotNumbers.length,
    icon: 'fire'
  },
  {
    label: 'Cold Numbers',
    value: lotteryStore.coldNumbers.length,
    icon: 'snowflake'
  }
])

const currentPrediction = computed(() => lotteryStore.currentPrediction)
const hotNumbers = computed(() => lotteryStore.hotNumbers)
const coldNumbers = computed(() => lotteryStore.coldNumbers)
const historicalData = computed(() => lotteryStore.historicalDraws)
const userHistory = computed(() => lotteryStore.userHistory)

// Methods
const handleSelectionChange = (numbers: number[]) => {
  selectedNumbers.value = numbers
}

const addNumberToSelection = (number: number) => {
  if (!selectedNumbers.value.includes(number) && selectedNumbers.value.length < 6) {
    selectedNumbers.value.push(number)
  }
}

const generatePrediction = async () => {
  if (selectedNumbers.value.length === 0) {
    alert('Please select numbers first')
    return
  }

  isPredicting.value = true
  try {
    await lotteryStore.generatePrediction(selectedNumbers.value)
  } finally {
    isPredicting.value = false
  }
}

const updateChartType = (type: 'frequency' | 'trend' | 'heatmap') => {
  activeChartType.value = type
}

const loadHistoricalPrediction = (prediction: Prediction) => {
  selectedNumbers.value = prediction.numbers
  lotteryStore.currentPrediction = prediction
}

// Lifecycle
onMounted(() => {
  lotteryStore.loadUserHistory()
  lotteryStore.fetchHistoricalData()
})
</script>

<style scoped>
.lottery-dashboard {
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 2rem;
  height: 100vh;
  padding: 1rem;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-summary {
  display: flex;
  gap: 1rem;
}

.dashboard-content {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 2rem;
}

.main-panel {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.side-panel {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.dashboard-footer {
  grid-column: 1 / -1;
}
</style>
```

#### 2. Number Picker Component

```vue
<!-- components/lottery/NumberPicker.vue -->
<template>
  <div class="number-picker">
    <div class="picker-header">
      <h3>Select Your Numbers</h3>
      <div class="selection-info">
        <span>{{ selectedNumbers.length }}/{{ maxNumbers }} selected</span>
        <button
          @click="clearSelection"
          class="clear-btn"
          :disabled="selectedNumbers.length === 0"
        >
          Clear
        </button>
      </div>
    </div>

    <NumberGrid
      :numbers="availableNumbers"
      :selected-numbers="selectedNumbers"
      :disabled="isDisabled"
      @number-toggle="toggleNumber"
    />

    <div class="quick-picks">
      <h4>Quick Picks</h4>
      <div class="quick-pick-buttons">
        <button
          v-for="quickPick in quickPickOptions"
          :key="quickPick.label"
          @click="applyQuickPick(quickPick)"
          class="quick-pick-btn"
          :disabled="isDisabled"
        >
          {{ quickPick.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import NumberGrid from '@/components/ui/NumberGrid.vue'

interface QuickPickOption {
  label: string
  generator: () => number[]
}

const props = defineProps<{
  modelValue: number[]
  maxNumbers: number
  numberRange: [number, number]
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [numbers: number[]]
  'selection-change': [numbers: number[]]
}>()

const selectedNumbers = computed({
  get: () => props.modelValue,
  set: (value: number[]) => {
    emit('update:modelValue', value)
    emit('selection-change', value)
  }
})

const isDisabled = computed(() => props.disabled || selectedNumbers.value.length >= props.maxNumbers)

const availableNumbers = computed(() => {
  const [min, max] = props.numberRange
  return Array.from({ length: max - min + 1 }, (_, i) => i + min)
})

const quickPickOptions: QuickPickOption[] = [
  {
    label: 'Random',
    generator: () => generateRandomNumbers(props.maxNumbers, props.numberRange)
  },
  {
    label: 'Hot Numbers',
    generator: () => getHotNumbers(props.maxNumbers)
  },
  {
    label: 'Cold Numbers',
    generator: () => getColdNumbers(props.maxNumbers)
  },
  {
    label: 'Mixed',
    generator: () => getMixedNumbers(props.maxNumbers)
  }
]

const toggleNumber = (number: number) => {
  const index = selectedNumbers.value.indexOf(number)
  let newSelection = [...selectedNumbers.value]

  if (index > -1) {
    // Remove number
    newSelection.splice(index, 1)
  } else if (newSelection.length < props.maxNumbers) {
    // Add number
    newSelection.push(number)
    newSelection.sort((a, b) => a - b)
  }

  selectedNumbers.value = newSelection
}

const clearSelection = () => {
  selectedNumbers.value = []
}

const applyQuickPick = (option: QuickPickOption) => {
  selectedNumbers.value = option.generator()
}

function generateRandomNumbers(count: number, range: [number, number]): number[] {
  const [min, max] = range
  const numbers = new Set<number>()

  while (numbers.size < count) {
    numbers.add(Math.floor(Math.random() * (max - min + 1)) + min)
  }

  return Array.from(numbers).sort((a, b) => a - b)
}

function getHotNumbers(count: number): number[] {
  // Implementation to get hot numbers from store
  return [7, 15, 23, 31, 38, 45].slice(0, count)
}

function getColdNumbers(count: number): number[] {
  // Implementation to get cold numbers from store
  return [3, 11, 19, 27, 35, 43].slice(0, count)
}

function getMixedNumbers(count: number): number[] {
  // Implementation to get mixed numbers
  return [5, 12, 25, 33, 41, 48].slice(0, count)
}
</script>

<style scoped>
.number-picker {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.selection-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.clear-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background: #ef4444;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s;
}

.clear-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

.quick-picks {
  margin-top: 1.5rem;
}

.quick-pick-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.quick-pick-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-pick-btn:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.quick-pick-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
```

#### 3. Prediction Results Component

```vue
<!-- components/lottery/PredictionResults.vue -->
<template>
  <div class="prediction-results">
    <div class="results-header">
      <h3>Prediction Results</h3>
      <button
        @click="generateNewPrediction"
        class="predict-btn"
        :disabled="loading || !hasSelection"
      >
        {{ loading ? 'Analyzing...' : 'Generate Prediction' }}
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <LoadingSpinner />
      <p>Analyzing patterns and generating prediction...</p>
    </div>

    <div v-else-if="prediction" class="prediction-content">
      <div class="confidence-score">
        <div class="confidence-circle">
          <span>{{ prediction.confidence }}%</span>
        </div>
        <div class="confidence-labels">
          <span>Confidence</span>
          <span class="confidence-desc">Based on historical patterns</span>
        </div>
      </div>

      <div class="predicted-numbers">
        <h4>Predicted Numbers</h4>
        <div class="numbers-display">
          <NumberBall
            v-for="number in prediction.numbers"
            :key="number"
            :number="number"
            :highlight="true"
          />
        </div>
      </div>

      <div class="prediction-analysis">
        <h4>Analysis</h4>
        <div class="analysis-grid">
          <div class="analysis-item">
            <span class="label">Pattern Match:</span>
            <span class="value">{{ prediction.analysis.patternMatch }}%</span>
          </div>
          <div class="analysis-item">
            <span class="label">Frequency Score:</span>
            <span class="value">{{ prediction.analysis.frequencyScore }}</span>
          </div>
          <div class="analysis-item">
            <span class="label">Recent Trend:</span>
            <span class="value" :class="prediction.analysis.trend">
              {{ prediction.analysis.trend }}
            </span>
          </div>
        </div>
      </div>

      <div class="prediction-actions">
        <button @click="savePrediction" class="save-btn">
          Save to History
        </button>
        <button @click="sharePrediction" class="share-btn">
          Share
        </button>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon">🎯</div>
      <h4>No Prediction Yet</h4>
      <p>Select your numbers and click "Generate Prediction" to get started</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import NumberBall from '@/components/ui/NumberBall.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

interface Prediction {
  id: string
  numbers: number[]
  confidence: number
  analysis: {
    patternMatch: number
    frequencyScore: number
    trend: 'up' | 'down' | 'stable'
  }
  createdAt: Date
}

const props = defineProps<{
  prediction: Prediction | null
  loading: boolean
}>()

const emit = defineEmits<{
  'generate-prediction': []
  'save-prediction': [prediction: Prediction]
  'share-prediction': [prediction: Prediction]
}>()

const hasSelection = computed(() => {
  // Check if user has selected numbers
  return true // This should be connected to parent component
})

const generateNewPrediction = () => {
  emit('generate-prediction')
}

const savePrediction = () => {
  if (props.prediction) {
    emit('save-prediction', props.prediction)
  }
}

const sharePrediction = () => {
  if (props.prediction) {
    emit('share-prediction', props.prediction)
  }
}
</script>

<style scoped>
.prediction-results {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.predict-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.predict-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.predict-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.loading-state {
  text-align: center;
  padding: 2rem;
}

.confidence-score {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.confidence-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.25rem;
  font-weight: bold;
}

.confidence-labels {
  display: flex;
  flex-direction: column;
}

.confidence-desc {
  font-size: 0.875rem;
  color: #6b7280;
}

.predicted-numbers {
  margin-bottom: 2rem;
}

.numbers-display {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

.prediction-analysis {
  margin-bottom: 2rem;
}

.analysis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.analysis-item {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.label {
  font-size: 0.875rem;
  color: #6b7280;
}

.value {
  font-weight: 600;
  color: #111827;
}

.value.up {
  color: #10b981;
}

.value.down {
  color: #ef4444;
}

.value.stable {
  color: #f59e0b;
}

.prediction-actions {
  display: flex;
  gap: 1rem;
}

.save-btn, .share-btn {
  padding: 0.75rem 1.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn:hover {
  border-color: #10b981;
  color: #10b981;
}

.share-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}
</style>
```

## 5. API Integration Patterns with Flask Backend

### Recommended API Service Architecture

```typescript
// services/api.ts
import axios, { AxiosInstance, AxiosResponse } from 'axios'

class ApiService {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      }
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          localStorage.removeItem('auth_token')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  // Lottery-specific API methods
  async getHistoricalData(params?: {
    limit?: number
    offset?: number
    startDate?: string
    endDate?: string
  }) {
    const response = await this.client.get('/lottery/history', { params })
    return response.data
  }

  async generatePrediction(numbers: number[], options?: {
    algorithm?: 'ml' | 'statistical' | 'hybrid'
    includeProbability?: boolean
  }) {
    const response = await this.client.post('/lottery/predict', {
      numbers,
      ...options
    })
    return response.data
  }

  async getStatistics(type: 'frequency' | 'trends' | 'patterns') {
    const response = await this.client.get(`/lottery/statistics/${type}`)
    return response.data
  }

  async savePrediction(prediction: {
    numbers: number[]
    confidence: number
    algorithm: string
  }) {
    const response = await this.client.post('/user/predictions', prediction)
    return response.data
  }

  async getUserHistory(params?: {
    limit?: number
    offset?: number
  }) {
    const response = await this.client.get('/user/predictions', { params })
    return response.data
  }

  async subscribeToNotifications(settings: {
    email?: string
    sms?: string
    types: string[]
  }) {
    const response = await this.client.post('/user/notifications', settings)
    return response.data
  }
}

export const apiService = new ApiService()
```

### Composable for API Integration

```typescript
// composables/useApi.ts
import { ref, computed } from 'vue'
import { apiService } from '@/services/api'

export function useApi<T>(
  apiCall: () => Promise<T>,
  options?: {
    immediate?: boolean
    onSuccess?: (data: T) => void
    onError?: (error: any) => void
  }
) {
  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)

  const execute = async () => {
    loading.value = true
    error.value = null

    try {
      const result = await apiCall()
      data.value = result
      options?.onSuccess?.(result)
    } catch (err) {
      error.value = err as Error
      options?.onError?.(err)
    } finally {
      loading.value = false
    }
  }

  if (options?.immediate) {
    execute()
  }

  return {
    data,
    loading,
    error,
    execute,
    refresh: execute
  }
}

// Specific composable for lottery data
export function useLotteryData() {
  const {
    data: historicalData,
    loading: loadingHistorical,
    error: historicalError,
    refresh: refreshHistorical
  } = useApi(() => apiService.getHistoricalData({ limit: 100 }), {
    immediate: true
  })

  const {
    data: statistics,
    loading: loadingStats,
    error: statsError,
    refresh: refreshStats
  } = useApi(() => apiService.getStatistics('frequency'), {
    immediate: true
  })

  return {
    historicalData,
    loadingHistorical,
    historicalError,
    refreshHistorical,
    statistics,
    loadingStats,
    statsError,
    refreshStats
  }
}
```

### Real-time Data Integration

```typescript
// composables/useRealtimeData.ts
import { ref, onUnmounted } from 'vue'
import { apiService } from '@/services/api'

export function useRealtimeData(endpoint: string) {
  const data = ref<any>(null)
  const isConnected = ref(false)
  const error = ref<string | null>(null)

  let eventSource: EventSource | null = null

  const connect = () => {
    eventSource = new EventSource(
      `${apiService.client.defaults.baseURL}/${endpoint}`
    )

    eventSource.onopen = () => {
      isConnected.value = true
      error.value = null
    }

    eventSource.onmessage = (event) => {
      try {
        data.value = JSON.parse(event.data)
      } catch (err) {
        console.error('Failed to parse real-time data:', err)
      }
    }

    eventSource.onerror = () => {
      isConnected.value = false
      error.value = 'Connection lost'
      // Auto-reconnect after 5 seconds
      setTimeout(connect, 5000)
    }
  }

  const disconnect = () => {
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
    isConnected.value = false
  }

  onUnmounted(() => {
    disconnect()
  })

  return {
    data,
    isConnected,
    error,
    connect,
    disconnect
  }
}
```

### Error Handling and Retry Logic

```typescript
// utils/apiHelpers.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (i === maxRetries) {
        throw lastError
      }

      // Exponential backoff
      const waitTime = delay * Math.pow(2, i)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }

  throw lastError!
}

// Usage in components
export function useRobustApi() {
  const executeWithRetry = async <T>(
    apiCall: () => Promise<T>
  ): Promise<{ data: T | null; error: Error | null }> => {
    try {
      const data = await withRetry(apiCall)
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  return { executeWithRetry }
}
```

## 6. Performance Optimization for Real-time Data Updates

### Vue 3 Performance Best Practices

```typescript
// composables/useVirtualList.ts
import { ref, computed, onMounted, onUnmounted } from 'vue'

export function useVirtualList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const scrollTop = ref(0)
  const containerRef = ref<HTMLElement | null>(null)

  const visibleCount = Math.ceil(containerHeight / itemHeight)
  const startIndex = computed(() => Math.floor(scrollTop.value / itemHeight))
  const endIndex = computed(() => Math.min(
    startIndex.value + visibleCount + 1,
    items.length - 1
  ))

  const visibleItems = computed(() =>
    items.slice(startIndex.value, endIndex.value + 1)
  )

  const offsetY = computed(() => startIndex.value * itemHeight)
  const totalHeight = computed(() => items.length * itemHeight)

  const handleScroll = () => {
    if (containerRef.value) {
      scrollTop.value = containerRef.value.scrollTop
    }
  }

  onMounted(() => {
    containerRef.value?.addEventListener('scroll', handleScroll)
  })

  onUnmounted(() => {
    containerRef.value?.removeEventListener('scroll', handleScroll)
  })

  return {
    containerRef,
    visibleItems,
    offsetY,
    totalHeight,
    startIndex,
    endIndex
  }
}
```

### Data Debouncing and Throttling

```typescript
// utils/performance.ts
import { debounce, throttle } from 'lodash-es'

export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T {
  return debounce(fn, delay) as T
}

export function useThrottle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T {
  return throttle(fn, delay) as T
}

// Usage in components
export function useOptimizedSearch() {
  const searchQuery = ref('')
  const results = ref([])
  const loading = ref(false)

  const debouncedSearch = useDebounce(async (query: string) => {
    if (!query.trim()) {
      results.value = []
      return
    }

    loading.value = true
    try {
      // Perform search API call
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      results.value = await response.json()
    } finally {
      loading.value = false
    }
  }, 300)

  watch(searchQuery, debouncedSearch)

  return {
    searchQuery,
    results,
    loading
  }
}
```

### Memoization and Caching

```typescript
// utils/cache.ts
class Cache {
  private cache = new Map<string, { data: any; expiry: number }>()

  set(key: string, data: any, ttl: number = 300000) { // 5 minutes default
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    })
  }

  get(key: string): any | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  clear() {
    this.cache.clear()
  }
}

export const cache = new Cache()

// Memoized API calls
export function useMemoizedApi<T>(
  key: string,
  apiCall: () => Promise<T>,
  ttl?: number
) {
  const cachedData = cache.get(key)
  const data = ref(cachedData)
  const loading = ref(!cachedData)
  const error = ref<Error | null>(null)

  const execute = async () => {
    if (cachedData) {
      return cachedData
    }

    loading.value = true
    error.value = null

    try {
      const result = await apiCall()
      cache.set(key, result, ttl)
      data.value = result
      return result
    } catch (err) {
      error.value = err as Error
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    data,
    loading,
    error,
    execute
  }
}
```

### Component-level Optimization

```vue
<!-- Optimized chart component -->
<template>
  <div ref="chartContainer" class="chart-container">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, shallowRef } from 'vue'
import { useResizeObserver } from '@vueuse/core'

const props = defineProps<{
  data: Array<{ x: number; y: number }>
}>()

const chartContainer = ref(null)
const canvas = ref(null)
const chartInstance = shallowRef(null) // Use shallowRef for heavy objects

// Debounced resize handler
const handleResize = debounce(() => {
  if (chartInstance.value) {
    chartInstance.value.resize()
  }
}, 100)

useResizeObserver(chartContainer, handleResize)

onMounted(() => {
  // Initialize chart only when component is mounted
  initChart()
})

onUnmounted(() => {
  // Clean up chart instance
  if (chartInstance.value) {
    chartInstance.value.destroy()
  }
})

function initChart() {
  // Chart initialization logic
}
</script>
```

## 7. Testing Strategies for Vue Applications with Statistical Data

### Unit Testing with Vitest

```typescript
// tests/components/NumberPicker.test.ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import NumberPicker from '@/components/lottery/NumberPicker.vue'

describe('NumberPicker', () => {
  it('should render correct number of available numbers', () => {
    const wrapper = mount(NumberPicker, {
      props: {
        modelValue: [],
        maxNumbers: 6,
        numberRange: [1, 10]
      }
    })

    const numberBalls = wrapper.findAll('[data-test="number-ball"]')
    expect(numberBalls).toHaveLength(10)
  })

  it('should emit update:modelValue when number is selected', async () => {
    const wrapper = mount(NumberPicker, {
      props: {
        modelValue: [],
        maxNumbers: 6,
        numberRange: [1, 10]
      }
    })

    const firstBall = wrapper.find('[data-test="number-ball-1"]')
    await firstBall.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([[[1]]])
  })

  it('should not exceed max numbers selection', async () => {
    const wrapper = mount(NumberPicker, {
      props: {
        modelValue: [1, 2, 3, 4, 5],
        maxNumbers: 6,
        numberRange: [1, 10]
      }
    })

    const sixthBall = wrapper.find('[data-test="number-ball-6"]')
    await sixthBall.trigger('click')

    const seventhBall = wrapper.find('[data-test="number-ball-7"]')
    await seventhBall.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')[0][0]).toHaveLength(6)
  })
})
```

### Testing Statistical Calculations

```typescript
// tests/composables/useLotteryStats.test.ts
import { describe, it, expect } from 'vitest'
import { useLotteryStats } from '@/composables/useLotteryStats'

describe('useLotteryStats', () => {
  it('should calculate correct number frequency', () => {
    const mockData = [
      { numbers: [1, 2, 3, 4, 5, 6], date: '2024-01-01' },
      { numbers: [1, 7, 8, 9, 10, 11], date: '2024-01-02' },
      { numbers: [2, 12, 13, 14, 15, 16], date: '2024-01-03' }
    ]

    const { numberStats } = useLotteryStats(mockData)

    expect(numberStats.value).toContainEqual(
      expect.objectContaining({ value: 1, frequency: 2 })
    )
    expect(numberStats.value).toContainEqual(
      expect.objectContaining({ value: 2, frequency: 2 })
    )
    expect(numberStats.value).toContainEqual(
      expect.objectContaining({ value: 3, frequency: 1 })
    )
  })

  it('should identify hot numbers correctly', () => {
    const mockData = Array.from({ length: 100 }, (_, i) => ({
      numbers: [1, 2, 3, 4, 5, 6].map(n => n + i),
      date: `2024-01-${i + 1}`
    }))

    const { hotNumbers } = useLotteryStats(mockData)

    expect(hotNumbers.value.length).toBeGreaterThan(0)
    expect(hotNumbers.value.every(n => n.hotness === 'hot')).toBe(true)
  })
})
```

### Integration Testing

```typescript
// tests/integration/lotteryPrediction.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import LotteryDashboard from '@/components/lottery/LotteryDashboard.vue'

// Mock API
vi.mock('@/services/api', () => ({
  apiService: {
    getHistoricalData: vi.fn().mockResolvedValue([
      { id: '1', numbers: [1, 2, 3, 4, 5, 6], date: '2024-01-01' }
    ]),
    generatePrediction: vi.fn().mockResolvedValue({
      id: 'pred-1',
      numbers: [7, 8, 9, 10, 11, 12],
      confidence: 75
    })
  }
}))

describe('Lottery Prediction Flow', () => {
  let wrapper: any

  beforeEach(() => {
    const pinia = createPinia()
    wrapper = mount(LotteryDashboard, {
      global: {
        plugins: [pinia]
      }
    })
  })

  it('should complete full prediction flow', async () => {
    // Select numbers
    const numberBalls = wrapper.findAll('[data-test="number-ball"]')
    await numberBalls[0].trigger('click') // Select number 1
    await numberBalls[1].trigger('click') // Select number 2
    await numberBalls[2].trigger('click') // Select number 3

    // Generate prediction
    const predictBtn = wrapper.find('[data-test="predict-btn"]')
    await predictBtn.trigger('click')

    // Wait for API call
    await wrapper.vm.$nextTick()

    // Verify results
    expect(wrapper.find('[data-test="prediction-results"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="confidence-score"]').text()).toContain('75%')
  })
})
```

### End-to-End Testing with Playwright

```typescript
// tests/e2e/lottery.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Lottery Prediction Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should allow users to select numbers and generate predictions', async ({ page }) => {
    // Select numbers
    await page.click('[data-test="number-ball-1"]')
    await page.click('[data-test="number-ball-7"]')
    await page.click('[data-test="number-ball-15"]')
    await page.click('[data-test="number-ball-23"]')
    await page.click('[data-test="number-ball-31"]')
    await page.click('[data-test="number-ball-45"]')

    // Verify selection
    const selectedNumbers = await page.locator('[data-test="selected-number"]')
    await expect(selectedNumbers).toHaveCount(6)

    // Generate prediction
    await page.click('[data-test="predict-btn"]')

    // Wait for results
    await page.waitForSelector('[data-test="prediction-results"]')

    // Verify prediction results
    await expect(page.locator('[data-test="confidence-score"]')).toBeVisible()
    await expect(page.locator('[data-test="predicted-numbers"]')).toBeVisible()

    // Verify statistical analysis
    await expect(page.locator('[data-test="pattern-match"]')).toBeVisible()
    await expect(page.locator('[data-test="frequency-score"]')).toBeVisible()
  })

  test('should display historical charts correctly', async ({ page }) => {
    await page.click('[data-test="charts-tab"]')

    // Wait for charts to load
    await page.waitForSelector('[data-test="frequency-chart"]')

    // Verify chart data
    const chartCanvas = page.locator('[data-test="frequency-chart"] canvas')
    await expect(chartCanvas).toBeVisible()

    // Test chart interactions
    await page.hover('[data-test="chart-point"]')
    await expect(page.locator('[data-test="chart-tooltip"]')).toBeVisible()
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock network error
    await page.route('/api/lottery/predict', route => route.abort())

    await page.click('[data-test="number-ball-1"]')
    await page.click('[data-test="predict-btn"]')

    // Verify error message
    await expect(page.locator('[data-test="error-message"]')).toBeVisible()
    await expect(page.locator('[data-test="error-message"]')).toContainText(
      'Failed to generate prediction'
    )
  })
})
```

### Testing Statistical Accuracy

```typescript
// tests/statistics/predictionAccuracy.test.ts
import { describe, it, expect } from 'vitest'
import { calculatePredictionAccuracy, validateStatisticalSignificance } from '@/utils/statistics'

describe('Statistical Validation', () => {
  it('should validate prediction accuracy', () => {
    const predictions = [
      { predicted: [1, 2, 3, 4, 5, 6], actual: [1, 7, 8, 9, 10, 11] },
      { predicted: [7, 8, 9, 10, 11, 12], actual: [7, 8, 13, 14, 15, 16] },
      { predicted: [13, 14, 15, 16, 17, 18], actual: [2, 3, 13, 14, 15, 16] }
    ]

    const accuracy = calculatePredictionAccuracy(predictions)
    expect(accuracy).toBeGreaterThan(0)
    expect(accuracy).toBeLessThanOrEqual(1)
  })

  it('should validate statistical significance', () => {
    const sample = Array.from({ length: 1000 }, () => Math.floor(Math.random() * 50) + 1)
    const isSignificant = validateStatisticalSignificance(sample)

    expect(typeof isSignificant).toBe('boolean')
  })
})
```

## 8. Accessibility Considerations for Gambling-Related Content

### WCAG 2.1 Compliance for Lottery Applications

```vue
<!-- Accessible Number Picker Component -->
<template>
  <div class="number-picker" role="application" aria-label="Lottery number selector">
    <div class="picker-header">
      <h2 id="picker-title">Select Your Lottery Numbers</h2>
      <div class="selection-status" aria-live="polite" aria-atomic="true">
        <span>{{ selectedNumbers.length }} of {{ maxNumbers }} numbers selected</span>
        <span v-if="selectedNumbers.length > 0" class="selected-numbers">
          Selected: {{ selectedNumbers.join(', ') }}
        </span>
      </div>
    </div>

    <!-- Keyboard navigation support -->
    <div
      ref="numberGrid"
      class="number-grid"
      role="grid"
      :aria-label="`Number grid from ${numberRange[0]} to ${numberRange[1]}`"
      tabindex="0"
      @keydown="handleKeyNavigation"
    >
      <div
        v-for="number in availableNumbers"
        :key="number"
        :ref="`number-${number}`"
        class="number-cell"
        role="gridcell"
        :aria-label="`Number ${number}`"
        :aria-selected="isSelected(number)"
        :aria-disabled="isDisabled"
        tabindex="-1"
        @click="selectNumber(number)"
        @keydown.enter="selectNumber(number)"
        @keydown.space.prevent="selectNumber(number)"
      >
        <button
          :class="['number-ball', { 'selected': isSelected(number), 'disabled': isDisabled }]"
          :aria-pressed="isSelected(number)"
          :disabled="isDisabled"
          type="button"
        >
          <span class="number-text">{{ number }}</span>
          <span class="visually-hidden">
            {{ isSelected(number) ? 'Selected' : 'Not selected' }} number {{ number }}
          </span>
        </button>
      </div>
    </div>

    <!-- Accessible quick pick options -->
    <div class="quick-picks" role="group" aria-label="Quick pick options">
      <h3 id="quick-picks-title">Quick Selection Options</h3>
      <div class="quick-pick-buttons" aria-describedby="quick-picks-title">
        <button
          v-for="option in quickPickOptions"
          :key="option.id"
          class="quick-pick-btn"
          :aria-describedby="`quick-pick-desc-${option.id}`"
          @click="applyQuickPick(option)"
        >
          {{ option.label }}
          <span :id="`quick-pick-desc-${option.id}`" class="visually-hidden">
            {{ option.description }}
          </span>
        </button>
      </div>
    </div>

    <!-- Clear selection with proper confirmation -->
    <button
      v-if="selectedNumbers.length > 0"
      class="clear-btn"
      aria-label="Clear all selected numbers"
      @click="confirmClearSelection"
    >
      Clear Selection
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'

const props = defineProps<{
  modelValue: number[]
  maxNumbers: number
  numberRange: [number, number]
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [numbers: number[]]
  'selection-change': [numbers: number[]]
}>()

const numberGrid = ref<HTMLElement | null>(null)
const currentFocusIndex = ref(0)

const selectedNumbers = computed({
  get: () => props.modelValue,
  set: (value: number[]) => {
    emit('update:modelValue', value)
    emit('selection-change', value)
  }
})

const availableNumbers = computed(() => {
  const [min, max] = props.numberRange
  return Array.from({ length: max - min + 1 }, (_, i) => i + min)
})

const quickPickOptions = [
  {
    id: 'random',
    label: 'Random Pick',
    description: 'Select random numbers'
  },
  {
    id: 'hot',
    label: 'Hot Numbers',
    description: 'Select frequently drawn numbers'
  },
  {
    id: 'cold',
    label: 'Cold Numbers',
    description: 'Select rarely drawn numbers'
  }
]

const isSelected = (number: number) => selectedNumbers.value.includes(number)
const isDisabled = computed(() => props.disabled || selectedNumbers.value.length >= props.maxNumbers)

const selectNumber = (number: number) => {
  if (isDisabled.value) return

  const index = selectedNumbers.value.indexOf(number)
  let newSelection = [...selectedNumbers.value]

  if (index > -1) {
    newSelection.splice(index, 1)
    announceToScreenReader(`Removed number ${number}`)
  } else if (newSelection.length < props.maxNumbers) {
    newSelection.push(number)
    newSelection.sort((a, b) => a - b)
    announceToScreenReader(`Added number ${number}`)
  }

  selectedNumbers.value = newSelection
}

const handleKeyNavigation = (event: KeyboardEvent) => {
  const grid = numberGrid.value
  if (!grid) return

  const cells = Array.from(grid.querySelectorAll('[role="gridcell"]'))
  const currentIndex = cells.findIndex(cell => cell === document.activeElement)

  let newIndex = currentIndex

  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      event.preventDefault()
      newIndex = Math.min(currentIndex + 1, cells.length - 1)
      break
    case 'ArrowLeft':
    case 'ArrowUp':
      event.preventDefault()
      newIndex = Math.max(currentIndex - 1, 0)
      break
    case 'Home':
      event.preventDefault()
      newIndex = 0
      break
    case 'End':
      event.preventDefault()
      newIndex = cells.length - 1
      break
    default:
      return
  }

  if (newIndex !== currentIndex) {
    cells[newIndex].querySelector('button')?.focus()
  }
}

const announceToScreenReader = (message: string) => {
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', 'polite')
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'visually-hidden'
  announcement.textContent = message

  document.body.appendChild(announcement)
  setTimeout(() => document.body.removeChild(announcement), 1000)
}

const confirmClearSelection = () => {
  if (window.confirm('Are you sure you want to clear all selected numbers?')) {
    selectedNumbers.value = []
    announceToScreenReader('All numbers cleared')
  }
}
</script>

<style scoped>
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.number-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(50px, 1fr));
  gap: 0.5rem;
  margin: 1rem 0;
  border: 2px solid transparent;
  border-radius: 8px;
  padding: 1rem;
  transition: border-color 0.2s;
}

.number-grid:focus {
  outline: none;
  border-color: #3b82f6;
}

.number-ball {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid #d1d5db;
  background: white;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.number-ball:hover:not(:disabled) {
  border-color: #3b82f6;
  transform: scale(1.05);
}

.number-ball:focus {
  outline: 3px solid #3b82f6;
  outline-offset: 2px;
}

.number-ball.selected {
  background: #3b82f6;
  color: white;
  border-color: #1d4ed8;
}

.number-ball:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (prefers-reduced-motion: reduce) {
  .number-ball {
    transition: none;
  }
}
</style>
```

### Screen Reader Support for Statistical Data

```vue
<!-- Accessible Statistics Component -->
<template>
  <div class="statistics-panel" role="region" aria-labelledby="stats-title">
    <h2 id="stats-title">Lottery Statistics</h2>

    <!-- Summary statistics with ARIA live regions -->
    <div class="stats-summary" role="group" aria-label="Summary statistics">
      <div class="stat-item">
        <dt class="stat-label">Win Rate</dt>
        <dd class="stat-value" aria-live="polite">
          {{ winRate.toFixed(1) }}%
          <span class="visually-hidden">Current win rate is {{ winRate.toFixed(1) }} percent</span>
        </dd>
      </div>

      <div class="stat-item">
        <dt class="stat-label">Total Predictions</dt>
        <dd class="stat-value" aria-live="polite">
          {{ totalPredictions }}
          <span class="visually-hidden">{{ totalPredictions }} total predictions made</span>
        </dd>
      </div>
    </div>

    <!-- Accessible data table for hot/cold numbers -->
    <div class="frequency-analysis" role="region" aria-labelledby="frequency-title">
      <h3 id="frequency-title">Number Frequency Analysis</h3>

      <table class="frequency-table" aria-label="Hot and cold numbers frequency">
        <caption>
          Numbers ordered by frequency of appearance in recent draws.
          Hot numbers appear most frequently, cold numbers appear least frequently.
        </caption>
        <thead>
          <tr>
            <th scope="col">Number</th>
            <th scope="col">Frequency</th>
            <th scope="col">Status</th>
            <th scope="col">Last Drawn</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in frequencyData" :key="item.number">
            <td>{{ item.number }}</td>
            <td>{{ item.frequency }} times</td>
            <td>
              <span :class="['status-badge', item.status]" :aria-label="`${item.status} number`">
                {{ item.status }}
              </span>
            </td>
            <td>{{ formatDate(item.lastDrawn) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Accessible chart alternative -->
    <div class="chart-container" role="img" :aria-label="chartDescription">
      <canvas ref="chartCanvas"></canvas>
      <div class="chart-data-table" v-if="showDataTable">
        <table aria-label="Chart data in tabular format">
          <caption>{{ chartTitle }} - Data table</caption>
          <thead>
            <tr>
              <th scope="col">Number</th>
              <th scope="col">Frequency</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in chartData" :key="item.number">
              <td>{{ item.number }}</td>
              <td>{{ item.frequency }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Chart controls for accessibility -->
    <div class="chart-controls" role="group" aria-label="Chart display options">
      <button
        @click="toggleDataTable"
        class="toggle-data-btn"
        :aria-expanded="showDataTable"
        aria-controls="chart-data-table"
      >
        {{ showDataTable ? 'Hide' : 'Show' }} Data Table
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const showDataTable = ref(false)
const chartCanvas = ref(null)

const props = defineProps({
  winRate: { type: Number, default: 0 },
  totalPredictions: { type: Number, default: 0 },
  frequencyData: { type: Array, default: () => [] },
  chartData: { type: Array, default: () => [] },
  chartTitle: { type: String, default: 'Number Frequency Chart' }
})

const chartDescription = computed(() => {
  return `Chart showing number frequency from ${props.chartData[0]?.number || 1} to ${props.chartData[props.chartData.length - 1]?.number || 50}. ` +
    `Highest frequency: ${Math.max(...props.chartData.map(d => d.frequency))} occurrences. ` +
    `Lowest frequency: ${Math.min(...props.chartData.map(d => d.frequency))} occurrences.`
})

const toggleDataTable = () => {
  showDataTable.value = !showDataTable.value
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}
</script>
```

### Responsible Gaming Features

```vue
<!-- Responsible Gaming Component -->
<template>
  <div class="responsible-gaming" role="region" aria-labelledby="responsible-gaming-title">
    <h2 id="responsible-gaming-title">Responsible Gaming</h2>

    <!-- Usage tracking with alerts -->
    <div class="usage-monitoring" role="alert" aria-live="polite">
      <div v-if="showWarning" class="usage-warning" role="alertdialog" aria-labelledby="warning-title">
        <h3 id="warning-title">Take a Break</h3>
        <p>You've been playing for {{ sessionTime }} minutes. Consider taking a break.</p>
        <div class="warning-actions">
          <button @click="continuePlaying" class="continue-btn">Continue</button>
          <button @click="takeBreak" class="break-btn">Take Break</button>
          <button @click="setLimits" class="limits-btn">Set Limits</button>
        </div>
      </div>
    </div>

    <!-- Spending limits -->
    <div class="limits-section" role="group" aria-labelledby="limits-title">
      <h3 id="limits-title">Daily Limits</h3>
      <div class="limit-indicators">
        <div class="limit-item">
          <dt class="limit-label">Predictions Used</dt>
          <dd class="limit-value">
            <progress
              :value="dailyPredictions"
              :max="predictionLimit"
              aria-label={`${dailyPredictions} of ${predictionLimit} daily predictions used`}
            />
            <span class="limit-text">{{ dailyPredictions }}/{{ predictionLimit }}</span>
          </dd>
        </div>

        <div class="limit-item">
          <dt class="limit-label">Session Time</dt>
          <dd class="limit-value">
            <progress
              :value="sessionTime"
              :max="sessionLimit"
              aria-label={`${sessionTime} of ${sessionLimit} minutes used this session`}
            />
            <span class="limit-text">{{ formatTime(sessionTime) }}/{{ formatTime(sessionLimit) }}</span>
          </dd>
        </div>
      </div>

      <button @click="openLimitsSettings" class="settings-btn" aria-label="Configure gaming limits">
        Configure Limits
      </button>
    </div>

    <!-- Self-exclusion options -->
    <div class="self-exclusion" role="group" aria-labelledby="exclusion-title">
      <h3 id="exclusion-title">Self-Exclusion Options</h3>
      <p>If you need to take a longer break from gaming, consider self-exclusion.</p>

      <div class="exclusion-options">
        <button
          v-for="option in exclusionOptions"
          :key="option.duration"
          @click="initiateExclusion(option)"
          class="exclusion-btn"
          :aria-describedby="`exclusion-desc-${option.duration}`"
        >
          {{ option.label }}
          <span :id="`exclusion-desc-${option.duration}`" class="visually-hidden">
            Exclude yourself for {{ option.duration }}
          </span>
        </button>
      </div>
    </div>

    <!-- Help resources -->
    <div class="help-resources" role="group" aria-labelledby="help-title">
      <h3 id="help-title">Need Help?</h3>
      <ul class="resource-list">
        <li v-for="resource in helpResources" :key="resource.name">
          <a
            :href="resource.url"
            target="_blank"
            rel="noopener noreferrer"
            class="resource-link"
            :aria-label="`${resource.name} - opens in new tab`"
          >
            {{ resource.name }}
            <span class="visually-hidden"> (opens in new tab)</span>
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const dailyPredictions = ref(15)
const predictionLimit = ref(50)
const sessionTime = ref(0)
const sessionLimit = ref(60) // minutes
const showWarning = ref(false)

let sessionTimer = null

const exclusionOptions = [
  { duration: '24h', label: '24 Hours' },
  { duration: '7d', label: '7 Days' },
  { duration: '30d', label: '30 Days' },
  { duration: 'permanent', label: 'Permanent' }
]

const helpResources = [
  { name: 'National Problem Gambling Helpline', url: 'https://www.problemgambling.gov' },
  { name: 'Gamblers Anonymous', url: 'https://www.gamblersanonymous.org' },
  { name: 'GamCare', url: 'https://www.gamcare.org.uk' }
]

onMounted(() => {
  sessionTimer = setInterval(() => {
    sessionTime.value++
    if (sessionTime.value >= 45 && !showWarning.value) {
      showWarning.value = true
    }
  }, 60000) // Update every minute
})

onUnmounted(() => {
  if (sessionTimer) {
    clearInterval(sessionTimer)
  }
})

const continuePlaying = () => {
  showWarning.value = false
}

const takeBreak = () => {
  // Implement break functionality
  alert('Break feature coming soon')
}

const setLimits = () => {
  // Open limits settings
  alert('Settings panel coming soon')
}

const openLimitsSettings = () => {
  // Open detailed settings modal
  alert('Detailed settings coming soon')
}

const initiateExclusion = (option) => {
  const confirmation = confirm(`Are you sure you want to exclude yourself for ${option.label}?`)
  if (confirmation) {
    // Implement self-exclusion
    alert(`Self-exclusion for ${option.label} initiated`)
  }
}

const formatTime = (minutes) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}
</script>

<style scoped>
.usage-warning {
  background: #fef3c7;
  border: 2px solid #f59e0b;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
}

.warning-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

progress {
  width: 100%;
  height: 1.5rem;
  margin-right: 0.5rem;
}

.limit-value {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.exclusion-options {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin: 1rem 0;
}

.resource-list {
  list-style: none;
  padding: 0;
}

.resource-link {
  display: block;
  padding: 0.5rem 0;
  color: #3b82f6;
  text-decoration: underline;
}

.resource-link:hover {
  color: #1d4ed8;
}

@media (prefers-reduced-motion: reduce) {
  .usage-warning {
    animation: none;
  }
}
</style>
```

### High Contrast and Dark Mode Support

```css
/* styles/accessibility.css */

/* High contrast mode support */
@media (prefers-contrast: high) {
  .number-ball {
    border-width: 3px;
    font-weight: 900;
  }

  .number-ball.selected {
    background: #000;
    color: #fff;
    border-color: #fff;
  }

  .stat-value {
    font-weight: bold;
    font-size: 1.1em;
  }
}

/* Dark mode with proper contrast ratios */
@media (prefers-color-scheme: dark) {
  .lottery-dashboard {
    background: #1a1a1a;
    color: #ffffff;
  }

  .number-ball {
    background: #2d2d2d;
    color: #ffffff;
    border-color: #4a4a4a;
  }

  .number-ball:hover:not(:disabled) {
    background: #3d3d3d;
    border-color: #5a5a5a;
  }

  .prediction-results {
    background: #2d2d2d;
    border: 1px solid #4a4a4a;
  }

  /* Ensure text remains readable */
  .stat-label {
    color: #cccccc;
  }

  .stat-value {
    color: #ffffff;
    font-weight: 600;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .number-ball:hover {
    transform: none !important;
  }

  .chart-container {
    scroll-behavior: auto;
  }
}

/* Focus indicators for keyboard navigation */
*:focus {
  outline: 3px solid #3b82f6;
  outline-offset: 2px;
}

/* High contrast focus indicators */
@media (prefers-contrast: high) {
  *:focus {
    outline: 4px solid #000;
    outline-offset: 1px;
  }
}

/* Screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Skip links for keyboard navigation */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: #000;
  color: #fff;
  padding: 8px;
  text-decoration: none;
  z-index: 9999;
}

.skip-link:focus {
  top: 6px;
}
```

### Vue 3 Accessibility Composables

```typescript
// composables/useAccessibility.ts
import { ref, onMounted, onUnmounted } from 'vue'

export function useA11y() {
  const prefersReducedMotion = ref(false)
  const prefersHighContrast = ref(false)
  const prefersDarkMode = ref(false)

  const updatePreferences = () => {
    prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    prefersHighContrast.value = window.matchMedia('(prefers-contrast: high)').matches
    prefersDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  onMounted(() => {
    updatePreferences()

    // Listen for preference changes
    const mediaQueries = [
      '(prefers-reduced-motion: reduce)',
      '(prefers-contrast: high)',
      '(prefers-color-scheme: dark)'
    ]

    mediaQueries.forEach(query => {
      window.matchMedia(query).addEventListener('change', updatePreferences)
    })
  })

  onUnmounted(() => {
    const mediaQueries = [
      '(prefers-reduced-motion: reduce)',
      '(prefers-contrast: high)',
      '(prefers-color-scheme: dark)'
    ]

    mediaQueries.forEach(query => {
      window.matchMedia(query).removeEventListener('change', updatePreferences)
    })
  })

  return {
    prefersReducedMotion,
    prefersHighContrast,
    prefersDarkMode
  }
}

export function useScreenReader() {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message

    document.body.appendChild(announcement)

    // Remove after announcement is read
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  const announceError = (message: string) => {
    announce(`Error: ${message}`, 'assertive')
  }

  const announceSuccess = (message: string) => {
    announce(`Success: ${message}`, 'polite')
  }

  return {
    announce,
    announceError,
    announceSuccess
  }
}

export function useKeyboardNavigation() {
  const trapFocus = (element: HTMLElement) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus()
            e.preventDefault()
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus()
            e.preventDefault()
          }
        }
      }

      if (e.key === 'Escape') {
        element.focus()
      }
    }

    element.addEventListener('keydown', handleKeyDown)
    firstElement?.focus()

    return () => {
      element.removeEventListener('keydown', handleKeyDown)
    }
  }

  return {
    trapFocus
  }
}
```

This comprehensive research document covers all aspects of building a Vue.js 3 lottery prediction website frontend with best practices for:

1. **Composition API Usage** - Leveraging Vue 3's Composition API for complex statistical logic and data visualization
2. **State Management** - Using Pinia for prediction data and user history with real-time updates
3. **Chart Libraries** - Chart.js, ECharts, and D3.js integration for lottery data visualization
4. **Component Architecture** - Modular, reusable components for prediction interfaces
5. **API Integration** - Robust patterns for Flask backend integration with error handling
6. **Performance Optimization** - Virtual scrolling, debouncing, and caching for real-time data
7. **Testing Strategies** - Comprehensive unit, integration, and e2e testing for statistical accuracy
8. **Accessibility** - WCAG 2.1 compliance, screen reader support, and responsible gaming features

The architectural recommendations provide a solid foundation for building a scalable, accessible, and performant lottery prediction application using Vue.js 3.
TodoWrite
<arg_key>todos</arg_key>
<arg_value>[{"content": "Research Vue 3 Composition API vs Options API for lottery data visualization", "status": "completed", "activeForm": "Completed Vue 3 API patterns research"}, {"content": "Analyze state management patterns for prediction data and user history", "status": "in_progress", "activeForm": "Analyzing state management approaches"}, {"content": "Identify Vue 3 compatible chart libraries for lottery data", "status": "pending", "activeForm": "Identifying chart libraries"}, {"content": "Design component architecture for prediction interfaces", "status": "pending", "activeForm": "Designing component architecture"}, {"content": "Research API integration patterns with Flask backend", "status": "pending", "activeForm": "Researching Flask integration patterns"}, {"content": "Explore performance optimization for real-time data", "status": "pending", "activeForm": "Exploring performance optimization"}, {"content": "Investigate testing strategies for statistical data", "status": "pending", "activeForm": "Investigating testing strategies"}, {"content": "Address accessibility for gambling-related content", "status": "pending", "activeForm": "Addressing accessibility considerations"}]