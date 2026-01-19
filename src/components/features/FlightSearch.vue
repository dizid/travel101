<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useFlights, type FlightSearchParams, type Flight } from '@/composables/useFlights'
import ProBadge from '@components/ui/ProBadge.vue'
import {
  LoadingOutlined,
  SearchOutlined,
  SwapOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  RightOutlined,
  FilterOutlined,
} from '@ant-design/icons-vue'

const props = defineProps<{
  defaultDestination?: string
  compact?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', flight: Flight): void
}>()

const {
  loading,
  flights,
  fetchAirports,
  searchFlights,
  thaiAirports,
  internationalAirports,
  cheapestFlight,
  fastestFlight,
  formatDuration,
  formatTime,
  formatDate,
  sortByPrice,
  sortByDuration,
} = useFlights()

const origin = ref('')
const destination = ref(props.defaultDestination || 'BKK')
const departureDate = ref('')
const returnDate = ref('')
const tripType = ref<'roundtrip' | 'oneway'>('roundtrip')
const adults = ref(1)
const sortBy = ref<'price' | 'duration' | 'departure'>('price')
const maxStops = ref<number | null>(null)
const searched = ref(false)

// Set default departure date to 2 weeks from now
onMounted(async () => {
  await fetchAirports()
  const twoWeeks = new Date()
  twoWeeks.setDate(twoWeeks.getDate() + 14)
  departureDate.value = twoWeeks.toISOString().split('T')[0]

  const threeWeeks = new Date()
  threeWeeks.setDate(threeWeeks.getDate() + 21)
  returnDate.value = threeWeeks.toISOString().split('T')[0]
})

const canSearch = computed(() =>
  origin.value && destination.value && departureDate.value
)

const filteredFlights = computed(() => {
  let result = flights.value
  if (maxStops.value !== null) {
    result = result.filter(f => f.stops <= maxStops.value!)
  }
  return result
})

async function handleSearch() {
  if (!canSearch.value) return

  const params: FlightSearchParams = {
    origin: origin.value,
    destination: destination.value,
    departureDate: departureDate.value,
    adults: adults.value,
  }

  if (tripType.value === 'roundtrip' && returnDate.value) {
    params.returnDate = returnDate.value
  }

  await searchFlights(params)
  searched.value = true

  // Apply default sort
  if (sortBy.value === 'price') sortByPrice(true)
  else if (sortBy.value === 'duration') sortByDuration(true)
}

function swapAirports() {
  const temp = origin.value
  origin.value = destination.value
  destination.value = temp
}

function selectFlight(flight: Flight) {
  emit('select', flight)
  // Open booking URL in new tab
  window.open(flight.bookingUrl, '_blank')
}

watch(sortBy, (newSort) => {
  if (newSort === 'price') sortByPrice(true)
  else if (newSort === 'duration') sortByDuration(true)
})
</script>

<template>
  <div class="flight-search">
    <!-- Search Form -->
    <div class="card-thai mb-6">
      <div class="flex items-center gap-2 mb-4">
        <span class="text-2xl">✈️</span>
        <h3 class="font-semibold text-gray-900">Flight Search</h3>
        <ProBadge v-if="!compact" />
      </div>

      <!-- Trip Type -->
      <div class="flex gap-4 mb-4">
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            v-model="tripType"
            type="radio"
            value="roundtrip"
            class="text-primary-600"
          />
          <span class="text-sm">Round trip</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            v-model="tripType"
            type="radio"
            value="oneway"
            class="text-primary-600"
          />
          <span class="text-sm">One way</span>
        </label>
      </div>

      <!-- Origin & Destination -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div class="relative">
          <label class="block text-sm font-medium text-gray-700 mb-1">From</label>
          <select v-model="origin" class="input-thai w-full">
            <option value="">Select origin...</option>
            <optgroup label="International">
              <option v-for="a in internationalAirports" :key="a.code" :value="a.code">
                {{ a.code }} - {{ a.city }}
              </option>
            </optgroup>
            <optgroup label="Thailand">
              <option v-for="a in thaiAirports" :key="a.code" :value="a.code">
                {{ a.code }} - {{ a.city }}
              </option>
            </optgroup>
          </select>
        </div>

        <div class="relative">
          <button
            @click="swapAirports"
            class="absolute left-1/2 top-1/2 -translate-x-1/2 z-10 hidden md:flex w-8 h-8 items-center justify-center bg-white border border-gray-300 rounded-full hover:bg-gray-50 shadow-sm"
            style="margin-left: -1rem; margin-top: 0.5rem;"
          >
            <SwapOutlined class="text-gray-500" />
          </button>
          <label class="block text-sm font-medium text-gray-700 mb-1">To</label>
          <select v-model="destination" class="input-thai w-full">
            <option value="">Select destination...</option>
            <optgroup label="Thailand">
              <option v-for="a in thaiAirports" :key="a.code" :value="a.code">
                {{ a.code }} - {{ a.city }}
              </option>
            </optgroup>
            <optgroup label="International">
              <option v-for="a in internationalAirports" :key="a.code" :value="a.code">
                {{ a.code }} - {{ a.city }}
              </option>
            </optgroup>
          </select>
        </div>
      </div>

      <!-- Dates -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Departure</label>
          <input
            v-model="departureDate"
            type="date"
            class="input-thai w-full"
            :min="new Date().toISOString().split('T')[0]"
          />
        </div>
        <div v-if="tripType === 'roundtrip'">
          <label class="block text-sm font-medium text-gray-700 mb-1">Return</label>
          <input
            v-model="returnDate"
            type="date"
            class="input-thai w-full"
            :min="departureDate"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Passengers</label>
          <select v-model="adults" class="input-thai w-full">
            <option v-for="n in 9" :key="n" :value="n">{{ n }} Adult{{ n > 1 ? 's' : '' }}</option>
          </select>
        </div>
      </div>

      <!-- Search Button -->
      <button
        @click="handleSearch"
        :disabled="!canSearch || loading"
        class="btn-thai w-full flex items-center justify-center gap-2"
      >
        <LoadingOutlined v-if="loading" class="animate-spin" />
        <SearchOutlined v-else />
        {{ loading ? 'Searching...' : 'Search Flights' }}
      </button>
    </div>

    <!-- Results -->
    <div v-if="searched && !loading">
      <!-- Quick Stats -->
      <div v-if="flights.length > 0" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-green-50 rounded-xl p-4 border border-green-200">
          <div class="flex items-center gap-2 text-green-700 mb-1">
            <DollarOutlined />
            <span class="text-sm font-medium">Cheapest</span>
          </div>
          <span class="text-2xl font-bold text-green-700">
            ${{ cheapestFlight?.price.toFixed(0) }}
          </span>
        </div>
        <div class="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div class="flex items-center gap-2 text-blue-700 mb-1">
            <ClockCircleOutlined />
            <span class="text-sm font-medium">Fastest</span>
          </div>
          <span class="text-2xl font-bold text-blue-700">
            {{ fastestFlight ? formatDuration(fastestFlight.duration) : '-' }}
          </span>
        </div>
        <div class="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <span class="text-sm text-gray-600">Found</span>
          <div class="text-2xl font-bold text-gray-700">{{ flights.length }} flights</div>
        </div>
        <div class="bg-purple-50 rounded-xl p-4 border border-purple-200">
          <span class="text-sm text-purple-600">Direct</span>
          <div class="text-2xl font-bold text-purple-700">
            {{ flights.filter(f => f.stops === 0).length }}
          </div>
        </div>
      </div>

      <!-- Filters & Sort -->
      <div v-if="flights.length > 0" class="flex flex-wrap items-center gap-4 mb-4">
        <div class="flex items-center gap-2">
          <FilterOutlined class="text-gray-500" />
          <span class="text-sm text-gray-600">Stops:</span>
          <select v-model="maxStops" class="input-thai text-sm py-1 px-2">
            <option :value="null">Any</option>
            <option :value="0">Direct only</option>
            <option :value="1">1 stop max</option>
            <option :value="2">2 stops max</option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600">Sort by:</span>
          <select v-model="sortBy" class="input-thai text-sm py-1 px-2">
            <option value="price">Price (low to high)</option>
            <option value="duration">Duration (shortest)</option>
          </select>
        </div>
      </div>

      <!-- Flight Cards -->
      <div class="space-y-4">
        <div
          v-for="flight in filteredFlights"
          :key="flight.id"
          class="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          <div class="flex flex-col md:flex-row md:items-center gap-4">
            <!-- Airline & Flight Info -->
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-3">
                <span class="text-lg">✈️</span>
                <span class="font-medium text-gray-900">{{ flight.airlines.join(', ') }}</span>
                <span
                  v-if="flight.stops === 0"
                  class="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full"
                >
                  Direct
                </span>
                <span
                  v-else
                  class="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full"
                >
                  {{ flight.stops }} stop{{ flight.stops > 1 ? 's' : '' }}
                </span>
              </div>

              <!-- Route -->
              <div class="flex items-center gap-4">
                <div class="text-center">
                  <div class="text-xl font-bold text-gray-900">{{ formatTime(flight.departureTime) }}</div>
                  <div class="text-sm text-gray-500">{{ flight.origin.code }}</div>
                </div>

                <div class="flex-1 flex items-center gap-2">
                  <div class="flex-1 border-t border-dashed border-gray-300"></div>
                  <div class="text-xs text-gray-500 whitespace-nowrap">
                    {{ formatDuration(flight.duration) }}
                  </div>
                  <RightOutlined class="text-gray-400 text-xs" />
                  <div class="flex-1 border-t border-dashed border-gray-300"></div>
                </div>

                <div class="text-center">
                  <div class="text-xl font-bold text-gray-900">{{ formatTime(flight.arrivalTime) }}</div>
                  <div class="text-sm text-gray-500">{{ flight.destination.code }}</div>
                </div>
              </div>

              <div class="text-xs text-gray-400 mt-2">
                {{ formatDate(flight.departureTime) }}
              </div>
            </div>

            <!-- Price & Book -->
            <div class="flex md:flex-col items-center md:items-end gap-4 md:gap-2 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-gray-100 md:pl-4">
              <div class="text-right">
                <div class="text-2xl font-bold text-primary-600">
                  ${{ flight.price.toFixed(0) }}
                </div>
                <div class="text-xs text-gray-500">per person</div>
              </div>
              <button
                @click="selectFlight(flight)"
                class="btn-thai text-sm px-4 py-2"
              >
                Book Now
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- No Results -->
      <div v-if="flights.length === 0" class="text-center py-12">
        <span class="text-5xl mb-4 block">🔍</span>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No flights found</h3>
        <p class="text-gray-500">Try different dates or airports</p>
      </div>
    </div>

    <!-- Initial State -->
    <div v-else-if="!searched && !loading" class="text-center py-12 text-gray-500">
      <span class="text-5xl mb-4 block">✈️</span>
      <p>Search for flights to Thailand</p>
    </div>
  </div>
</template>

<style scoped>
.input-thai {
  @apply px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors;
}
</style>
