import { Hotel } from './types';
import { ARI_SOURCE } from './data/ariSource';

export const DESTINATIONS = Array.from(new Set(ARI_SOURCE.hotels.map(h => h.destinationCode))).map(code => {
  const hotel = ARI_SOURCE.hotels.find(h => h.destinationCode === code)!;
  return {
    code: hotel.destinationCode,
    name: hotel.destinationName,
    country: hotel.country
  };
});

export const HOTELS: Hotel[] = ARI_SOURCE.hotels.map((h, i) => ({
  id: `h-${i + 1}`,
  hgId: h.hgHotelId,
  giataId: h.giataId,
  peakworkId: h.peakworkHotelId,
  name: h.hotelName,
  starRating: h.starRating,
  city: h.city,
  country: h.country,
  destination: h.destinationCode
}));

export const COUNTRIES = Array.from(new Set(ARI_SOURCE.hotels.map(h => h.country))).map(code => ({
  code,
  name: code // Fallback to code if name not easily mapable here
}));

export const ALL_MARKETS = [
  { code: 'DE', name: 'Germany' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'FR', name: 'France' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'US', name: 'United States' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'EG', name: 'Egypt' }
];

export const MARKET_CLUSTERS = [
  { 
    id: 'DACH', 
    name: 'DACH', 
    countries: ['DE', 'AT', 'CH'],
    defaults: { stayDurations: [7, 10, 14], bookingWindowDays: 120, mealPlans: ['HB', 'AI'], occupancies: ['2A', '2A1C'] }
  },
  { 
    id: 'WEU', 
    name: 'West Europe', 
    countries: ['GB', 'FR', 'NL', 'BE', 'IE'],
    defaults: { stayDurations: [3, 4, 7], bookingWindowDays: 90, mealPlans: ['BB', 'HB'], occupancies: ['2A', '1A'] }
  }
];

export const OCCUPANCY_PRIORITY_LIST = ['2A', '2A1C', '2A2C', '1A'];
export const MEAL_PLAN_PRIORITY = ['AI', 'HB', 'BB', 'RO'];
export const ROOM_PRIORITY = ['Standard', 'Superior', 'Deluxe', 'Family', 'Suite'];

export const MEAL_PLANS = ['RO', 'BB', 'HB', 'FB', 'AI'];

export const COMMON_OCCUPANCIES = {
  '1A': { adults: 1, children: 0, ageFrom: 0, ageTo: 0, label: '1 Adult' },
  '2A': { adults: 2, children: 0, ageFrom: 0, ageTo: 0, label: '2 Adults' },
  '2A1C': { adults: 2, children: 1, ageFrom: 2, ageTo: 12, label: '2+1 (2-12)' },
  '2A2C': { adults: 2, children: 2, ageFrom: 2, ageTo: 12, label: '2+2 (2-12)' }
};

export const AIRPORT_MAPPING: Record<string, { code: string; name: string }[]> = {
  'DE': [{ code: 'BER', name: 'Berlin (BER)' }, { code: 'FRA', name: 'Frankfurt (FRA)' }],
  'GB': [{ code: 'LHR', name: 'London Heathrow (LHR)' }, { code: 'LGW', name: 'London Gatwick (LGW)' }],
  'US': [{ code: 'JFK', name: 'New York JFK (JFK)' }],
  'AE': [{ code: 'DXB', name: 'Dubai (DXB)' }],
  'EG': [{ code: 'CAI', name: 'Cairo (CAI)' }]
};

export const CITY_TO_IATA: Record<string, string> = {
  'Dubai': 'DXB',
  'Cairo': 'CAI',
  'Palma de Mallorca': 'PMI',
  'London': 'LHR',
  'Paris': 'CDG',
  'Berlin': 'BER',
  'Bangkok': 'BKK',
  'Singapore': 'SIN',
  'New York': 'NYC',
  'Tokyo': 'TYO'
};

export const DESTINATION_COUNTRY_MAP: Record<string, string> = {
  'DXB': 'AE',
  'CAI': 'EG',
  'PMI': 'ES',
  'LHR': 'GB',
  'CDG': 'FR',
  'BER': 'DE',
  'BKK': 'TH',
  'SIN': 'SG',
  'NYC': 'US',
  'TYO': 'JP'
};

// --- Peakwork Rules & Limits ---
export const MAX_CB_PER_ROOM = 31;
export const MAX_SEASONS_PER_HOTEL = 2000;
export const MAX_TOTAL_PRICES_PER_HOTEL = 55000;
export const MAX_PRICES_PER_ROOM = 4000;
export const MAJOR_PRICE_SHIFT = 0.03; // 3% variance triggers a new season

export const DESTINATION_RECOMMENDATIONS: Record<string, { stayDurations: number[], bookingWindowDays: number }> = {
  'DEFAULT': { stayDurations: [7], bookingWindowDays: 120 }
};

export const OCCUPANCY_RECOMMENDATIONS: Record<string, Record<string, string[]>> = {
  'DEFAULT': { 'DEFAULT': ['2A', '1A'] }
};

export const MEAL_PLAN_RECOMMENDATIONS: Record<string, Record<string, string[]>> = {
  'DEFAULT': { 'DEFAULT': ['BB', 'HB'] }
};
