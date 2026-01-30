import type { Context, Config } from '@netlify/functions'
import { getDb } from './lib/db.mts'

interface WeatherData {
  location: string
  current: {
    temp_c: number
    condition: string
    icon: string
    humidity: number
    wind_kph: number
    uv: number
  }
  forecast: Array<{
    date: string
    maxtemp_c: number
    mintemp_c: number
    condition: string
    icon: string
    chance_of_rain: number
  }>
  isMonsoon: boolean
  packingTips: string[]
}

// Thai city mapping for common locations
const THAI_CITIES: Record<string, string> = {
  bangkok: 'Bangkok',
  'chiang-mai': 'Chiang Mai',
  'chiang_mai': 'Chiang Mai',
  phuket: 'Phuket',
  'koh-samui': 'Koh Samui',
  'koh_samui': 'Koh Samui',
  krabi: 'Krabi',
  pattaya: 'Pattaya',
  'hua-hin': 'Hua Hin',
  'hua_hin': 'Hua Hin',
  'chiang-rai': 'Chiang Rai',
  'chiang_rai': 'Chiang Rai',
  ayutthaya: 'Ayutthaya',
  sukhothai: 'Sukhothai',
  'koh-phi-phi': 'Koh Phi Phi',
  'koh-lanta': 'Koh Lanta',
  'koh-tao': 'Koh Tao',
  'koh-phangan': 'Koh Phangan',
  pai: 'Pai',
  railay: 'Railay Beach, Krabi',
}

function isMonsoonSeason(): boolean {
  const month = new Date().getMonth() + 1
  return month >= 5 && month <= 10
}

function getPackingTips(forecast: WeatherData['forecast'], isMonsoon: boolean): string[] {
  const tips: string[] = []
  const avgTemp = forecast.reduce((sum, day) => sum + day.maxtemp_c, 0) / forecast.length
  const maxRainChance = Math.max(...forecast.map(d => d.chance_of_rain))

  // Temperature-based tips
  if (avgTemp > 32) {
    tips.push('Pack light, breathable clothing - it\'s hot!')
    tips.push('Bring sunscreen SPF 50+ and a hat')
  } else if (avgTemp > 28) {
    tips.push('Light summer clothes recommended')
    tips.push('Don\'t forget sunglasses')
  }

  // Rain-based tips
  if (maxRainChance > 60 || isMonsoon) {
    tips.push('Pack a compact umbrella or rain poncho')
    tips.push('Waterproof bag for electronics recommended')
    tips.push('Quick-dry clothing is essential')
  }

  // Temple tips (always relevant for Thailand)
  tips.push('Cover shoulders & knees for temple visits')

  // Monsoon-specific
  if (isMonsoon) {
    tips.push('⚠️ Monsoon season: Expect afternoon showers')
    tips.push('Plan outdoor activities for mornings')
  }

  return tips.slice(0, 5)
}

// Generate fallback weather data for when API key is not configured
function generateFallbackWeather(cityName: string, days: number): WeatherData {
  const isMonsoon = isMonsoonSeason()
  const baseTemp = isMonsoon ? 30 : 33
  const rainChance = isMonsoon ? 65 : 25

  const forecast = Array.from({ length: days }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + i)
    return {
      date: date.toISOString().split('T')[0],
      maxtemp_c: baseTemp + Math.floor(Math.random() * 4),
      mintemp_c: baseTemp - 6 + Math.floor(Math.random() * 3),
      condition: isMonsoon ? 'Partly Cloudy' : 'Sunny',
      icon: '//cdn.weatherapi.com/weather/64x64/day/116.png',
      chance_of_rain: rainChance + Math.floor(Math.random() * 20),
    }
  })

  return {
    location: cityName,
    current: {
      temp_c: baseTemp + 1,
      condition: isMonsoon ? 'Partly Cloudy' : 'Sunny',
      icon: '//cdn.weatherapi.com/weather/64x64/day/116.png',
      humidity: isMonsoon ? 75 : 60,
      wind_kph: 12,
      uv: 8,
    },
    forecast,
    isMonsoon,
    packingTips: getPackingTips(forecast, isMonsoon),
  }
}

export default async (req: Request, context: Context) => {
  const apiKey = Netlify.env.get('WEATHERAPI_KEY')
  const url = new URL(req.url)
  const location = url.searchParams.get('location') || 'Bangkok'
  const days = Math.min(parseInt(url.searchParams.get('days') || '7'), 7)

  // Map slug to city name if needed
  const cityName = THAI_CITIES[location.toLowerCase()] || location

  // Return fallback data if API key not configured
  if (!apiKey) {
    const fallbackData = generateFallbackWeather(cityName, days)
    return new Response(JSON.stringify(fallbackData), {
      headers: {
        'Content-Type': 'application/json',
        'X-Weather-Source': 'fallback',
      },
    })
  }

  try {
    // Check cache first
    const db = await getDb()
    const cacheKey = `weather:${cityName.toLowerCase()}:${days}`
    const cached = await db`
      SELECT data, created_at FROM ai_cache
      WHERE cache_key = ${cacheKey}
      AND created_at > NOW() - INTERVAL '6 hours'
      LIMIT 1
    `

    if (cached.length > 0) {
      return new Response(JSON.stringify(cached[0].data), {
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'HIT',
        },
      })
    }

    // Fetch from WeatherAPI
    const weatherUrl = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(cityName)},Thailand&days=${days}&aqi=no`
    const response = await fetch(weatherUrl)

    if (!response.ok) {
      throw new Error(`Weather API returned ${response.status}`)
    }

    const data = await response.json()
    const isMonsoon = isMonsoonSeason()

    const weatherData: WeatherData = {
      location: data.location.name,
      current: {
        temp_c: data.current.temp_c,
        condition: data.current.condition.text,
        icon: data.current.condition.icon,
        humidity: data.current.humidity,
        wind_kph: data.current.wind_kph,
        uv: data.current.uv,
      },
      forecast: data.forecast.forecastday.map((day: any) => ({
        date: day.date,
        maxtemp_c: day.day.maxtemp_c,
        mintemp_c: day.day.mintemp_c,
        condition: day.day.condition.text,
        icon: day.day.condition.icon,
        chance_of_rain: day.day.daily_chance_of_rain,
      })),
      isMonsoon,
      packingTips: getPackingTips(data.forecast.forecastday.map((day: any) => ({
        date: day.date,
        maxtemp_c: day.day.maxtemp_c,
        mintemp_c: day.day.mintemp_c,
        condition: day.day.condition.text,
        icon: day.day.condition.icon,
        chance_of_rain: day.day.daily_chance_of_rain,
      })), isMonsoon),
    }

    // Cache the result
    await db`
      INSERT INTO ai_cache (cache_key, data, created_at)
      VALUES (${cacheKey}, ${JSON.stringify(weatherData)}, NOW())
      ON CONFLICT (cache_key) DO UPDATE SET
        data = EXCLUDED.data,
        created_at = NOW()
    `

    return new Response(JSON.stringify(weatherData), {
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'MISS',
      },
    })
  } catch (error) {
    console.error('Weather API error:', error)
    return new Response(JSON.stringify({ error: 'Failed to fetch weather data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

