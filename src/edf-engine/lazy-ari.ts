import {
  GenerateEdfExportInput,
  ProductDefinition,
  Hotel,
  ARIMap,
  Rate,
} from './types';

interface LazyAriBuilderDependencies {
  productDefinition: ProductDefinition;
  selectedHotels: Hotel[];
}

/**
 * A deterministic seed generator based on string inputs.
 * It produces a simple, stable hash for pseudo-random number generation.
 * @param str - The input string to seed the generator.
 * @returns A numeric seed.
 */
const getDeterministicSeed = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

/**
 * A simple pseudo-random number generator (PRNG) for deterministic results.
 * @param seed - The seed to initialize the generator.
 * @returns A function that generates the next random number in the sequence.
 */
const seededRandom = (seed: number) => () => {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
};

/**
 * Generates a deterministic, temporary ARI (Availability, Rates, and Inventory) map
 * for a given set of selected hotels and a product definition.
 *
 * This function simulates a future HyperGuest ARI integration by creating a small,
 * realistic, and deterministic set of pricing data. The output is stable: the same
 * hotels and product definition will always produce the exact same ARI data.
 * This ensures that downstream functions like the builder and serializer can rely on
 * a consistent input for testing and validation.
 *
 * The data is generated only for the hotels provided in the `selectedHotels` array,
 * simulating a lazy-loading or on-demand data-fetching mechanism.
 *
 * @param dependencies - An object containing the selected hotels and the product definition.
 * @returns An `ARIMap` containing the generated pricing data for the selected hotels.
 */
export function buildLazyAriForSelectedHotels(
  dependencies: LazyAriBuilderDependencies
): ARIMap {
  const { productDefinition, selectedHotels } = dependencies;
  const ariMap: ARIMap = {};

  // Combine product and hotel details for a stable, unique seed.
  const productSeedString = `${productDefinition.id}-${productDefinition.rooms.map(r => r.id).join('_')}`;
  
  for (const hotel of selectedHotels) {
    const hotelSeedString = `${productSeedString}-${hotel.id}`;
    const seed = getDeterministicSeed(hotelSeedString);
    const random = seededRandom(seed);

    const hotelAri: Record<string, { rates: Record<string, Record<string, Rate>> }> = {};
    const bookingWindowDays = productDefinition.bookingWindowDays || 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1); // Start from tomorrow

    for (let day = 0; day < bookingWindowDays; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day);
      const dateString = currentDate.toISOString().split('T')[0];

      const dailyRates: { rates: Record<string, Record<string, Rate>> } = { rates: {} };
      
      // Small chance to create a gap in data to test season splitting
      if (random() < 0.05) {
        continue;
      }
      
      for (const room of productDefinition.rooms) {
        dailyRates.rates[room.id] = {};
        for (const mealPlan of productDefinition.meal_plans) {
          const basePrice = (getDeterministicSeed(room.id) % 50) + 100; // 100-150
          const mealPrice = (getDeterministicSeed(mealPlan.id) % 30); // 0-30
          
          // Introduce slight, deterministic daily price variation
          const priceJitter = Math.floor(random() * 10) - 5; // -5 to +5
          
          dailyRates.rates[room.id][mealPlan.id] = {
            amount: basePrice + mealPrice + priceJitter,
            currency: 'EUR',
          };
        }
      }
      hotelAri[dateString] = dailyRates;
    }
    ariMap[hotel.id] = hotelAri;
  }

  return ariMap;
}
