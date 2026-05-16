import {
  Hotel,
  ProductDefinition,
  ARIMap,
  AriData,
  DailyRate,
  Rate,
} from './types';

interface LazyAriInput {
  selectedHotels: Hotel[];
  productDefinition: ProductDefinition;
}

/**
 * Generates a "lazy" ARI map for the selected hotels.
 *
 * This is a placeholder for a real HyperGuest ARI API call. It deterministically
 * generates pricing data based on the hotel ID, date, and product definition to
 * ensure that tests and local development have a consistent and predictable
 * source of ARI data without making external network requests.
 *
 * The generated data is intentionally varied to simulate real-world scenarios,
 * including price changes, different meal plan costs, and variations between hotels.
 */
export function buildLazyAriForSelectedHotels(input: LazyAriInput): ARIMap {
  const { selectedHotels, productDefinition } = input;
  const { bookingWindowDays, dailyPrices, mealPlans, occupancies, stayDurations } = productDefinition;

  const today = new Date();
  const ari: ARIMap = {};

  for (const hotel of selectedHotels) {
    const hotelAri: AriData = {};
    const basePrice = (parseInt(hotel.hgId.replace(/[^0-9]/g, ''), 10) % 50) + 100;

    for (let i = 0; i < bookingWindowDays; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split('T')[0];

      const dailyRate: DailyRate = { rates: {} };
      const dayOfWeek = date.getDay(); // 0 (Sun) to 6 (Sat)

      for (const { id: mealId, name: mealName } of mealPlans) {
        let mealPrice = 0;
        if (mealId === 'BB') mealPrice = 15;
        if (mealId === 'HB') mealPrice = 40;

        // Simulate weekend price bump
        const weekendFactor = dayOfWeek === 5 || dayOfWeek === 6 ? 1.2 : 1;

        const rate: Rate = {
          amount: Math.round((basePrice + mealPrice) * weekendFactor),
          currency: 'EUR',
        };

        // In a real scenario, you'd have room types. Here, we just use a placeholder.
        if (!dailyRate.rates['ROOM-STD']) {
          dailyRate.rates['ROOM-STD'] = {};
        }
        dailyRate.rates['ROOM-STD'][mealId] = rate;
      }

      hotelAri[dateString] = dailyRate;
    }
    ari[hotel.hgId] = hotelAri;
  }

  return ari;
}

// Helper to get a deterministic room name based on hotel ID and index
function getRoomName(hotelId: string, index: number): string {
  const baseRoomType = (parseInt(hotelId.replace(/[^0-9]/g, ''), 10) + index) % 3;
  if (baseRoomType === 0) return 'Standard Double';
  if (baseRoomType === 1) return 'Superior Sea View';
  return 'Junior Suite';
}

export function getLazyAriScope(successfulModels: import('./types').HotelEdfModel[]): import('./types').LazyAriScope {
  const hotelIds = successfulModels.map((model) => model.hotelId).sort();

  return {
    selectedHotelCount: hotelIds.length,
    ariHotelCount: hotelIds.length,
    unselectedHotelsExcluded: true,
    hotelIds,
  };
}
