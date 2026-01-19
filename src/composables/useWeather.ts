import { ref, computed } from 'vue'
import { useApi } from './useApi'

export interface WeatherForecast {
  date: string
  maxtemp_c: number
  mintemp_c: number
  condition: string
  icon: string
  chance_of_rain: number
}

export interface WeatherData {
  location: string
  current: {
    temp_c: number
    condition: string
    icon: string
    humidity: number
    wind_kph: number
    uv: number
  }
  forecast: WeatherForecast[]
  isMonsoon: boolean
  packingTips: string[]
}

export function useWeather() {
  const { get, loading, error } = useApi()
  const weatherData = ref<WeatherData | null>(null)

  async function fetchWeather(location: string = 'Bangkok', days: number = 7) {
    const data = await get<WeatherData>(
      `/weather?location=${encodeURIComponent(location)}&days=${days}`,
      { requiresAuth: false }
    )
    if (data) {
      weatherData.value = data
    }
    return data
  }

  const currentTemp = computed(() => weatherData.value?.current.temp_c ?? null)
  const currentCondition = computed(() => weatherData.value?.current.condition ?? '')
  const isMonsoon = computed(() => weatherData.value?.isMonsoon ?? false)
  const packingTips = computed(() => weatherData.value?.packingTips ?? [])

  const forecast = computed(() => weatherData.value?.forecast ?? [])

  const weatherIcon = computed(() => {
    const icon = weatherData.value?.current.icon
    if (!icon) return '☀️'
    // WeatherAPI icons are URLs, but we can use emoji fallbacks
    const condition = weatherData.value?.current.condition.toLowerCase() ?? ''
    if (condition.includes('rain') || condition.includes('drizzle')) return '🌧️'
    if (condition.includes('thunder') || condition.includes('storm')) return '⛈️'
    if (condition.includes('cloud') || condition.includes('overcast')) return '☁️'
    if (condition.includes('partly')) return '⛅'
    if (condition.includes('mist') || condition.includes('fog')) return '🌫️'
    return '☀️'
  })

  const uvLevel = computed(() => {
    const uv = weatherData.value?.current.uv ?? 0
    if (uv >= 11) return { level: 'Extreme', color: 'text-purple-600', advice: 'Avoid sun exposure' }
    if (uv >= 8) return { level: 'Very High', color: 'text-red-600', advice: 'Extra protection needed' }
    if (uv >= 6) return { level: 'High', color: 'text-orange-500', advice: 'Protection essential' }
    if (uv >= 3) return { level: 'Moderate', color: 'text-yellow-500', advice: 'Some protection needed' }
    return { level: 'Low', color: 'text-green-500', advice: 'Minimal protection' }
  })

  const rainChanceToday = computed(() => {
    const today = weatherData.value?.forecast[0]
    return today?.chance_of_rain ?? 0
  })

  return {
    loading,
    error,
    weatherData,
    fetchWeather,
    currentTemp,
    currentCondition,
    isMonsoon,
    packingTips,
    forecast,
    weatherIcon,
    uvLevel,
    rainChanceToday,
  }
}
