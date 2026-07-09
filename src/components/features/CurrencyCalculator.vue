<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useCurrency } from '@/composables/useCurrency'
import { LoadingOutlined, SwapOutlined, DollarOutlined } from '@ant-design/icons-vue'

defineProps<{
  /** Skip the outer card-thai wrapper when embedding inside a parent card. */
  bare?: boolean
}>()

const {
  loading,
  fetchRates,
  convertToThb,
  convertFromThb,
  formatThb,
  formatCurrency,
  thbRate,
  budgetGuide,
  currencySymbol,
  availableCurrencies,
} = useCurrency()

const amount = ref(100)
const direction = ref<'toThb' | 'fromThb'>('toThb')
const selectedCurrency = ref('USD')

const convertedAmount = computed(() => {
  if (direction.value === 'toThb') {
    return convertToThb(amount.value)
  } else {
    return convertFromThb(amount.value)
  }
})

const displayAmount = computed(() => {
  if (direction.value === 'toThb') {
    return formatThb(convertedAmount.value)
  } else {
    return formatCurrency(convertedAmount.value, selectedCurrency.value)
  }
})

function toggleDirection() {
  direction.value = direction.value === 'toThb' ? 'fromThb' : 'toThb'
}

watch(selectedCurrency, async (newCurrency) => {
  await fetchRates(newCurrency)
})

onMounted(async () => {
  await fetchRates(selectedCurrency.value)
})

// Quick conversion amounts
const quickAmounts = [100, 500, 1000, 5000]
</script>

<template>
  <div :class="bare ? '' : 'card-thai'">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="font-semibold text-gray-900 flex items-center gap-2">
        <DollarOutlined class="text-green-500" />
        Currency
      </h3>
      <span class="text-xs text-gray-400">1 {{ selectedCurrency }} = ฿{{ thbRate.toFixed(2) }}</span>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-6">
      <LoadingOutlined class="text-xl text-primary-500 animate-spin" />
    </div>

    <div v-else>
      <!-- Currency selector -->
      <div class="mb-4">
        <select
          v-model="selectedCurrency"
          class="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option v-for="curr in availableCurrencies" :key="curr.code" :value="curr.code">
            {{ curr.symbol }} {{ curr.code }} - {{ curr.name }}
          </option>
        </select>
      </div>

      <!-- Converter -->
      <div class="bg-gray-50 rounded-xl p-4 mb-4">
        <div class="flex items-center gap-2 mb-3">
          <!-- Input -->
          <div class="flex-1">
            <label class="text-xs text-gray-500 mb-1 block">
              {{ direction === 'toThb' ? selectedCurrency : 'THB' }}
            </label>
            <input
              v-model.number="amount"
              type="number"
              min="0"
              step="10"
              class="w-full px-3 py-2 border border-gray-200 rounded-lg text-lg font-medium focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <!-- Swap button -->
          <button
            @click="toggleDirection"
            class="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow mt-4"
          >
            <SwapOutlined class="text-primary-500" />
          </button>

          <!-- Output -->
          <div class="flex-1">
            <label class="text-xs text-gray-500 mb-1 block">
              {{ direction === 'toThb' ? 'THB' : selectedCurrency }}
            </label>
            <div class="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-lg font-bold text-primary-600">
              {{ displayAmount }}
            </div>
          </div>
        </div>

        <!-- Quick amounts -->
        <div class="flex gap-2">
          <button
            v-for="quickAmount in quickAmounts"
            :key="quickAmount"
            @click="amount = quickAmount"
            class="flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors"
            :class="amount === quickAmount ? 'bg-primary-100 text-primary-700' : 'bg-white text-gray-600 hover:bg-gray-100'"
          >
            {{ quickAmount }}
          </button>
        </div>
      </div>

      <!-- Budget guide -->
      <div v-if="budgetGuide" class="space-y-2">
        <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">Daily Budget Guide</p>
        <div class="space-y-1.5">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600">💰 Budget</span>
            <span class="font-medium">{{ currencySymbol }}{{ budgetGuide.budget.min }}-{{ budgetGuide.budget.max }}/day</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600">🏨 Mid-range</span>
            <span class="font-medium">{{ currencySymbol }}{{ budgetGuide.mid.min }}-{{ budgetGuide.mid.max }}/day</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600">✨ Luxury</span>
            <span class="font-medium">{{ currencySymbol }}{{ budgetGuide.luxury.min }}-{{ budgetGuide.luxury.max }}/day</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
