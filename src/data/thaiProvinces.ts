// All 77 Thai provinces with center coordinates and region mapping
// Used for client-side distance calculations (no API cost)

export interface ProvinceCoordinates {
  lat: number
  lng: number
  region: 'North' | 'Isan' | 'Central' | 'South' | 'Bangkok' | 'East' | 'West'
}

export const THAI_PROVINCE_COORDS: Record<string, ProvinceCoordinates> = {
  // Bangkok
  'Bangkok': { lat: 13.7563, lng: 100.5018, region: 'Bangkok' },

  // Central
  'Ang Thong': { lat: 14.5896, lng: 100.4550, region: 'Central' },
  'Ayutthaya': { lat: 14.3692, lng: 100.5877, region: 'Central' },
  'Chainat': { lat: 15.1851, lng: 100.1247, region: 'Central' },
  'Lopburi': { lat: 14.7995, lng: 100.6534, region: 'Central' },
  'Nakhon Nayok': { lat: 14.2069, lng: 101.2133, region: 'Central' },
  'Nakhon Pathom': { lat: 13.8199, lng: 100.0641, region: 'Central' },
  'Nonthaburi': { lat: 13.8621, lng: 100.5144, region: 'Central' },
  'Pathum Thani': { lat: 14.0208, lng: 100.5250, region: 'Central' },
  'Samut Prakan': { lat: 13.5991, lng: 100.5998, region: 'Central' },
  'Samut Sakhon': { lat: 13.5475, lng: 100.2744, region: 'Central' },
  'Samut Songkhram': { lat: 13.4098, lng: 100.0024, region: 'Central' },
  'Saraburi': { lat: 14.5289, lng: 100.9103, region: 'Central' },
  'Sing Buri': { lat: 14.8936, lng: 100.3967, region: 'Central' },
  'Suphan Buri': { lat: 14.4744, lng: 100.1177, region: 'Central' },

  // North
  'Chiang Mai': { lat: 18.7883, lng: 98.9853, region: 'North' },
  'Chiang Rai': { lat: 19.9105, lng: 99.8406, region: 'North' },
  'Kamphaeng Phet': { lat: 16.4827, lng: 99.5226, region: 'North' },
  'Lampang': { lat: 18.2888, lng: 99.4903, region: 'North' },
  'Lamphun': { lat: 18.5744, lng: 99.0087, region: 'North' },
  'Mae Hong Son': { lat: 19.3020, lng: 97.9654, region: 'North' },
  'Nakhon Sawan': { lat: 15.7030, lng: 100.1371, region: 'North' },
  'Nan': { lat: 18.7756, lng: 100.7730, region: 'North' },
  'Phayao': { lat: 19.1664, lng: 99.9019, region: 'North' },
  'Phetchabun': { lat: 16.4189, lng: 101.1591, region: 'North' },
  'Phichit': { lat: 16.4415, lng: 100.3486, region: 'North' },
  'Phitsanulok': { lat: 16.8211, lng: 100.2659, region: 'North' },
  'Phrae': { lat: 18.1445, lng: 100.1403, region: 'North' },
  'Sukhothai': { lat: 17.0068, lng: 99.8233, region: 'North' },
  'Tak': { lat: 16.8840, lng: 99.1259, region: 'North' },
  'Uthai Thani': { lat: 15.3835, lng: 100.0254, region: 'North' },
  'Uttaradit': { lat: 17.6200, lng: 100.0993, region: 'North' },

  // Isan (Northeast)
  'Amnat Charoen': { lat: 15.8656, lng: 104.6258, region: 'Isan' },
  'Bueng Kan': { lat: 18.3609, lng: 103.6466, region: 'Isan' },
  'Buri Ram': { lat: 14.9930, lng: 103.1029, region: 'Isan' },
  'Chaiyaphum': { lat: 15.8068, lng: 102.0316, region: 'Isan' },
  'Kalasin': { lat: 16.4315, lng: 103.5059, region: 'Isan' },
  'Khon Kaen': { lat: 16.4322, lng: 102.8236, region: 'Isan' },
  'Loei': { lat: 17.4860, lng: 101.7223, region: 'Isan' },
  'Maha Sarakham': { lat: 16.1851, lng: 103.3008, region: 'Isan' },
  'Mahasarakham': { lat: 16.1851, lng: 103.3008, region: 'Isan' },
  'Mukdahan': { lat: 16.5424, lng: 104.7235, region: 'Isan' },
  'Nakhon Phanom': { lat: 17.3920, lng: 104.7695, region: 'Isan' },
  'Nakhon Ratchasima': { lat: 14.9799, lng: 102.0978, region: 'Isan' },
  'Nong Bua Lamphu': { lat: 17.2218, lng: 102.4260, region: 'Isan' },
  'Nong Khai': { lat: 17.8783, lng: 102.7420, region: 'Isan' },
  'Roi Et': { lat: 16.0538, lng: 103.6520, region: 'Isan' },
  'Sakon Nakhon': { lat: 17.1545, lng: 104.1348, region: 'Isan' },
  'Si Sa Ket': { lat: 15.1186, lng: 104.3220, region: 'Isan' },
  'Surin': { lat: 14.8829, lng: 103.4937, region: 'Isan' },
  'Ubon Ratchathani': { lat: 15.2287, lng: 104.8564, region: 'Isan' },
  'Udon Thani': { lat: 17.4138, lng: 102.7870, region: 'Isan' },
  'Yasothon': { lat: 15.7944, lng: 104.1451, region: 'Isan' },

  // East
  'Chachoengsao': { lat: 13.6904, lng: 101.0779, region: 'East' },
  'Chanthaburi': { lat: 12.6113, lng: 102.1034, region: 'East' },
  'Chonburi': { lat: 13.3611, lng: 100.9847, region: 'East' },
  'Prachin Buri': { lat: 14.0509, lng: 101.3660, region: 'East' },
  'Rayong': { lat: 12.6814, lng: 101.2816, region: 'East' },
  'Sa Kaeo': { lat: 13.8241, lng: 102.0645, region: 'East' },
  'Trat': { lat: 12.2428, lng: 102.5177, region: 'East' },

  // West
  'Kanchanaburi': { lat: 14.0228, lng: 99.5328, region: 'West' },
  'Phetchaburi': { lat: 13.1119, lng: 99.9390, region: 'West' },
  'Prachuap Khiri Khan': { lat: 11.8126, lng: 99.7957, region: 'West' },
  'Ratchaburi': { lat: 13.5283, lng: 99.8134, region: 'West' },

  // South
  'Chumphon': { lat: 10.4930, lng: 99.1800, region: 'South' },
  'Krabi': { lat: 8.0863, lng: 98.9063, region: 'South' },
  'Nakhon Si Thammarat': { lat: 8.4325, lng: 99.9599, region: 'South' },
  'Narathiwat': { lat: 6.4254, lng: 101.8253, region: 'South' },
  'Pattani': { lat: 6.8686, lng: 101.2503, region: 'South' },
  'Phang Nga': { lat: 8.4509, lng: 98.5253, region: 'South' },
  'Phatthalung': { lat: 7.6167, lng: 100.0743, region: 'South' },
  'Phuket': { lat: 7.8804, lng: 98.3923, region: 'South' },
  'Ranong': { lat: 9.9528, lng: 98.6385, region: 'South' },
  'Satun': { lat: 6.6238, lng: 100.0674, region: 'South' },
  'Songkhla': { lat: 7.1897, lng: 100.5954, region: 'South' },
  'Surat Thani': { lat: 9.1382, lng: 99.3217, region: 'South' },
  'Trang': { lat: 7.5563, lng: 99.6114, region: 'South' },
  'Yala': { lat: 6.5414, lng: 101.2803, region: 'South' },
}

// Haversine distance calculation between two points (returns km)
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371 // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Get distance from user to the closest province a festival occurs in
// Returns 0 for nationwide festivals, null if no province data
export function getFestivalDistance(
  userLat: number,
  userLng: number,
  provinces: string[] | null | undefined,
  isNationwide: boolean
): number | null {
  if (isNationwide) return 0

  if (!provinces?.length) return null

  let minDistance = Infinity
  for (const province of provinces) {
    const coords = THAI_PROVINCE_COORDS[province]
    if (coords) {
      const dist = haversineDistance(userLat, userLng, coords.lat, coords.lng)
      minDistance = Math.min(minDistance, dist)
    }
  }

  return minDistance === Infinity ? null : Math.round(minDistance)
}

// Format distance for display
export function formatDistance(km: number | null): string | null {
  if (km === null) return null
  if (km === 0) return 'Nationwide'
  if (km < 50) return 'Very close'
  return `~${km} km`
}
