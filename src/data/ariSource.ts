import { ARIFullDetails, DailyRatePlanARI, BaseAmounts } from '../types';

export interface ARI_SOURCE_DATA {
  sourceType: string;
  generatedAt: string;
  currency: string;
  hotels: Array<{
    hgHotelId: string;
    giataId: string;
    peakworkHotelId: string;
    hotelName: string;
    country: string;
    city: string;
    destinationCode: string;
    destinationName: string;
    starRating: number;
    rooms: Array<{
      roomCode: string;
      roomName: string;
      rateplans: Array<{
        rateplanCode: string;
        rateplanName: string;
        mealplanCode: string;
        ari: ARIFullDetails[];
      }>;
    }>;
  }>;
}

const generateDates = (start: Date, days: number) => {
  return Array.from({ length: days }).map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d.toISOString().split('T')[0];
  });
};

const DATES = generateDates(new Date('2026-06-01'), 365);

const REAL_HOTELS_DB = [
  // Dubai
  { name: 'Burj Al Arab Jumeirah', city: 'Dubai', country: 'AE', code: 'DXB', stars: 5 },
  { name: 'Atlantis, The Palm', city: 'Dubai', country: 'AE', code: 'DXB', stars: 5 },
  { name: 'Jumeirah Al Naseem', city: 'Dubai', country: 'AE', code: 'DXB', stars: 5 },
  { name: 'Armani Hotel Dubai', city: 'Dubai', country: 'AE', code: 'DXB', stars: 5 },
  { name: 'Address Downtown', city: 'Dubai', country: 'AE', code: 'DXB', stars: 5 },
  { name: 'Five Palm Jumeirah', city: 'Dubai', country: 'AE', code: 'DXB', stars: 5 },
  { name: 'W Dubai - The Palm', city: 'Dubai', country: 'AE', code: 'DXB', stars: 5 },
  { name: 'One&Only The Palm', city: 'Dubai', country: 'AE', code: 'DXB', stars: 5 },
  { name: 'Palazzo Versace Dubai', city: 'Dubai', country: 'AE', code: 'DXB', stars: 5 },
  { name: 'Raffles Dubai', city: 'Dubai', country: 'AE', code: 'DXB', stars: 5 },
  
  // London
  { name: 'The Ritz', city: 'London', country: 'GB', code: 'LHR', stars: 5 },
  { name: 'The Savoy', city: 'London', country: 'GB', code: 'LHR', stars: 5 },
  { name: 'Claridge\'s', city: 'London', country: 'GB', code: 'LHR', stars: 5 },
  { name: 'The Connaught', city: 'London', country: 'GB', code: 'LHR', stars: 5 },
  { name: 'The Dorchester', city: 'London', country: 'GB', code: 'LHR', stars: 5 },
  { name: 'Shangri-La The Shard', city: 'London', country: 'GB', code: 'LHR', stars: 5 },
  { name: 'Rosewood London', city: 'London', country: 'GB', code: 'LHR', stars: 5 },
  { name: 'The Langham', city: 'London', country: 'GB', code: 'LHR', stars: 5 },
  { name: 'Corinthia London', city: 'London', country: 'GB', code: 'LHR', stars: 5 },
  { name: 'Ham Yard Hotel', city: 'London', country: 'GB', code: 'LHR', stars: 5 },

  // Paris
  { name: 'Four Seasons George V', city: 'Paris', country: 'FR', code: 'CDG', stars: 5 },
  { name: 'Plaza Athénée', city: 'Paris', country: 'FR', code: 'CDG', stars: 5 },
  { name: 'Le Meurice', city: 'Paris', country: 'FR', code: 'CDG', stars: 5 },
  { name: 'Hotel de Crillon', city: 'Paris', country: 'FR', code: 'CDG', stars: 5 },
  { name: 'The Peninsula Paris', city: 'Paris', country: 'FR', code: 'CDG', stars: 5 },
  { name: 'Le Bristol Paris', city: 'Paris', country: 'FR', code: 'CDG', stars: 5 },
  { name: 'Shangri-La Paris', city: 'Paris', country: 'FR', code: 'CDG', stars: 5 },
  { name: 'Hotel Lutetia', city: 'Paris', country: 'FR', code: 'CDG', stars: 5 },
  { name: 'Ritz Paris', city: 'Paris', country: 'FR', code: 'CDG', stars: 5 },
  { name: 'Mandarin Oriental Paris', city: 'Paris', country: 'FR', code: 'CDG', stars: 5 },

  // New York
  { name: 'The Plaza', city: 'New York', country: 'US', code: 'NYC', stars: 5 },
  { name: 'The Carlyle', city: 'New York', country: 'US', code: 'NYC', stars: 5 },
  { name: 'Baccarat Hotel', city: 'New York', country: 'US', code: 'NYC', stars: 5 },
  { name: 'The St. Regis New York', city: 'New York', country: 'US', code: 'NYC', stars: 5 },
  { name: 'Equinox Hotel', city: 'New York', country: 'US', code: 'NYC', stars: 5 },
  { name: 'Aman New York', city: 'New York', country: 'US', code: 'NYC', stars: 5 },
  { name: 'The Mark Hotel', city: 'New York', country: 'US', code: 'NYC', stars: 5 },
  { name: 'Park Hyatt New York', city: 'New York', country: 'US', code: 'NYC', stars: 5 },
  { name: '1 Hotel Brooklyn Bridge', city: 'New York', country: 'US', code: 'NYC', stars: 5 },
  { name: 'Public Hotel', city: 'New York', country: 'US', code: 'NYC', stars: 4 },

  // Tokyo
  { name: 'Aman Tokyo', city: 'Tokyo', country: 'JP', code: 'TYO', stars: 5 },
  { name: 'Park Hyatt Tokyo', city: 'Tokyo', country: 'JP', code: 'TYO', stars: 5 },
  { name: 'The Ritz-Carlton Tokyo', city: 'Tokyo', country: 'JP', code: 'TYO', stars: 5 },
  { name: 'Mandarin Oriental Tokyo', city: 'Tokyo', country: 'JP', code: 'TYO', stars: 5 },
  { name: 'Hoshinoya Tokyo', city: 'Tokyo', country: 'JP', code: 'TYO', stars: 5 },
  { name: 'Hotel Gajoen Tokyo', city: 'Tokyo', country: 'JP', code: 'TYO', stars: 5 },
  { name: 'The Peninsula Tokyo', city: 'Tokyo', country: 'JP', code: 'TYO', stars: 5 },
  { name: 'Palace Hotel Tokyo', city: 'Tokyo', country: 'JP', code: 'TYO', stars: 5 },
  { name: 'Grand Hyatt Tokyo', city: 'Tokyo', country: 'JP', code: 'TYO', stars: 5 },
  { name: 'Andaz Tokyo Toranomon Hills', city: 'Tokyo', country: 'JP', code: 'TYO', stars: 5 },

  // Singapore
  { name: 'Marina Bay Sands', city: 'Singapore', country: 'SG', code: 'SIN', stars: 5 },
  { name: 'Raffles Singapore', city: 'Singapore', country: 'SG', code: 'SIN', stars: 5 },
  { name: 'Capella Singapore', city: 'Singapore', country: 'SG', code: 'SIN', stars: 5 },
  { name: 'Fullerton Bay Hotel', city: 'Singapore', country: 'SG', code: 'SIN', stars: 5 },
  { name: 'The Warehouse Hotel', city: 'Singapore', country: 'SG', code: 'SIN', stars: 4 },

  // Bangkok
  { name: 'Mandarin Oriental Bangkok', city: 'Bangkok', country: 'TH', code: 'BKK', stars: 5 },
  { name: 'The Siam', city: 'Bangkok', country: 'TH', code: 'BKK', stars: 5 },
  { name: 'Capella Bangkok', city: 'Bangkok', country: 'TH', code: 'BKK', stars: 5 },
  { name: 'Four Seasons Bangkok', city: 'Bangkok', country: 'TH', code: 'BKK', stars: 5 },
  { name: 'Standard Bangkok Mahanakhon', city: 'Bangkok', country: 'TH', code: 'BKK', stars: 5 },

  // Rome
  { name: 'Hotel de Russie', city: 'Rome', country: 'IT', code: 'ROM', stars: 5 },
  { name: 'Hotel Hassler', city: 'Rome', country: 'IT', code: 'ROM', stars: 5 },
  { name: 'Hotel Eden', city: 'Rome', country: 'IT', code: 'ROM', stars: 5 },
  { name: 'Portrait Roma', city: 'Rome', country: 'IT', code: 'ROM', stars: 5 },
  { name: 'Palazzo Vilòn', city: 'Rome', country: 'IT', code: 'ROM', stars: 5 },

  // Barcelona
  { name: 'Hotel Arts Barcelona', city: 'Barcelona', country: 'ES', code: 'BCN', stars: 5 },
  { name: 'W Barcelona', city: 'Barcelona', country: 'ES', code: 'BCN', stars: 5 },
  { name: 'Majestic Hotel & Spa', city: 'Barcelona', country: 'ES', code: 'BCN', stars: 5 },
  { name: 'Cotton House Hotel', city: 'Barcelona', country: 'ES', code: 'BCN', stars: 5 },
  { name: 'Mandarin Oriental Barcelona', city: 'Barcelona', country: 'ES', code: 'BCN', stars: 5 },

  // Maldives
  { name: 'Soneva Fushi', city: 'Maldives', country: 'MV', code: 'MLE', stars: 5 },
  { name: 'Cheval Blanc Randheli', city: 'Maldives', country: 'MV', code: 'MLE', stars: 5 },
  { name: 'Gili Lankanfushi', city: 'Maldives', country: 'MV', code: 'MLE', stars: 5 },
  { name: 'Joali Maldives', city: 'Maldives', country: 'MV', code: 'MLE', stars: 5 },
  { name: 'Waldorf Astoria Maldives', city: 'Maldives', country: 'MV', code: 'MLE', stars: 5 },

  // Sydney
  { name: 'Park Hyatt Sydney', city: 'Sydney', country: 'AU', code: 'SYD', stars: 5 },
  { name: 'The Langham Sydney', city: 'Sydney', country: 'AU', code: 'SYD', stars: 5 },
  { name: 'Capella Sydney', city: 'Sydney', country: 'AU', code: 'SYD', stars: 5 },
  { name: 'Crown Towers Sydney', city: 'Sydney', country: 'AU', code: 'SYD', stars: 5 },
  { name: 'Old Clare Hotel', city: 'Sydney', country: 'AU', code: 'SYD', stars: 4 },

  // Hong Kong
  { name: 'The Upper House', city: 'Hong Kong', country: 'HK', code: 'HKG', stars: 5 },
  { name: 'The Peninsula Hong Kong', city: 'Hong Kong', country: 'HK', code: 'HKG', stars: 5 },
  { name: 'Rosewood Hong Kong', city: 'Hong Kong', country: 'HK', code: 'HKG', stars: 5 },
  { name: 'Mandarin Oriental HK', city: 'Hong Kong', country: 'HK', code: 'HKG', stars: 5 },
  { name: 'The Landmark Mandarin Oriental', city: 'Hong Kong', country: 'HK', code: 'HKG', stars: 5 },

  // Additional major ones to hit 100
  { name: 'Bellagio Las Vegas', city: 'Las Vegas', country: 'US', code: 'LAS', stars: 5 },
  { name: 'Wynn Las Vegas', city: 'Las Vegas', country: 'US', code: 'LAS', stars: 5 },
  { name: 'Caesars Palace', city: 'Las Vegas', country: 'US', code: 'LAS', stars: 5 },
  { name: 'Cosmopolitan of Las Vegas', city: 'Las Vegas', country: 'US', code: 'LAS', stars: 5 },
  { name: 'Venetian Las Vegas', city: 'Las Vegas', country: 'US', code: 'LAS', stars: 5 },
];

const ROOM_TEMPLATES = [
  { code: 'SUP', name: 'Superior' },
  { code: 'DLX', name: 'Deluxe' },
  { code: 'EXE', name: 'Executive' },
  { code: 'SUI', name: 'Premium Suite' }
];

const MEAL_TEMPLATES = [
  { code: 'RO', name: 'Room Only' },
  { code: 'BB', name: 'Bed & Breakfast' },
  { code: 'HB', name: 'Half Board' }
];

export const generateARIDetails = (date: string, basePrice: number, dayIdx: number, roomCode: string, ratePlanCode: string): ARIFullDetails => {
  const d = new Date(date);
  const dayOfWeek = d.getDay(); // 0 = Sunday, 6 = Saturday
  const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0;
  
  // Seasonal factors (Northern Hemisphere typical)
  const month = d.getMonth();
  let seasonalFactor = 1.0;
  if (month >= 5 && month <= 8) seasonalFactor = 1.4; // Summer peak
  if (month === 11) seasonalFactor = 1.3; // Christmas/New Year
  if (month >= 0 && month <= 2) seasonalFactor = 0.8; // Low season (Jan-Mar)

  // Demand curve simulation (weekly pattern)
  const demandFactor = isWeekend ? 1.25 : 1.0;
  
  // Random event simulation (5% chance of high demand)
  const eventFactor = Math.random() > 0.95 ? 1.5 : 1.0;
  
  const actualPrice = Math.round(basePrice * seasonalFactor * demandFactor * eventFactor);
  
  const dailyRate: DailyRatePlanARI = {
    ratePlanCode,
    currency: 'EUR',
    isOpen: Math.random() > 0.005, // 0.5% chance of stop-sell
    isOpenOnArrival: Math.random() > 0.01,
    isOpenOnDeparture: Math.random() > 0.01,
    minLOS: (dayOfWeek === 5 || seasonalFactor > 1.3) ? 2 : 1,
    maxLOS: 28,
    minStayThrough: (dayIdx % 30 === 0) ? 3 : 0, 
    baseAmounts: [
      {
        numberOfGuests: { adults: 1, children: 0 },
        priceAfterTax: actualPrice * 0.9,
        price: actualPrice * 0.9
      },
      {
        numberOfGuests: { adults: 2, children: 0 },
        priceAfterTax: actualPrice,
        price: actualPrice
      }
    ],
    pricePerPersonAfterTax: Math.round(actualPrice / 2),
    release: (seasonalFactor > 1.2) ? 7 : 0, // 7 days advance booking for peak
    lastMinute: 0
  };

  return {
    date,
    roomTypeCode: roomCode,
    numberOfAvailableRooms: seasonalFactor > 1.3 ? Math.floor(Math.random() * 3) : Math.floor(Math.random() * 8) + 2,
    ratePlans: [dailyRate]
  };
};

const generateHotels = () => {
  const hotels = [];
  for (let i = 0; i < 100; i++) {
    const hotelData = REAL_HOTELS_DB[i % REAL_HOTELS_DB.length];
    const citySuffix = i >= REAL_HOTELS_DB.length ? ` (Branch ${Math.floor(i / REAL_HOTELS_DB.length)})` : '';
    const hgId = `HG-${hotelData.code}-${(i + 1).toString().padStart(4, '0')}`;
    
    const hotel = {
      hgHotelId: hgId,
      giataId: 'UNMAPPED',
      peakworkHotelId: `PW-${hotelData.code}-${(i + 1).toString().padStart(4, '0')}`,
      hotelName: hotelData.name + citySuffix,
      country: hotelData.country,
      city: hotelData.city,
      destinationCode: hotelData.code,
      destinationName: hotelData.city,
      starRating: hotelData.stars,
      rooms: ROOM_TEMPLATES.slice(0, 2 + (i % 3)).map(rt => {
        const roomCode = `${rt.code}-${hgId}`;
        const basePrice = 150 + (i % 5) * 50 + (ROOM_TEMPLATES.indexOf(rt) * 40);
        
        return {
          roomCode,
          roomName: `${rt.name} Room`,
          rateplans: MEAL_TEMPLATES.slice(0, 1 + (i % 3)).map(mt => ({
            rateplanCode: `${mt.code}-${hgId}`,
            rateplanName: mt.name,
            mealplanCode: mt.code,
            ari: DATES.map((date, dayIdx) => 
               generateARIDetails(date, basePrice + (MEAL_TEMPLATES.indexOf(mt) * 30), dayIdx, roomCode, `${mt.code}-${hgId}`)
            )
          }))
        };
      })
    };
    hotels.push(hotel);
  }
  return hotels;
};

export const ARI_SOURCE: ARI_SOURCE_DATA = {
  sourceType: "REAL_WORLD_BENCHMARK_ARI",
  generatedAt: new Date().toISOString(),
  currency: "EUR",
  hotels: generateHotels()
};
