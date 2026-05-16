import {
  Hotel,
  ProductDefinition,
  ARIMap,
  HotelEdfModel,
  HotelEdfRoom,
  HotelEdfSeason,
  HotelEdfChargeblock,
  Room,
  MealPlan,
} from './types';

/**
 * Input for the buildHotelEdfModel function.
 */
interface BuildHotelEdfModelInput {
  hotel: Hotel;
  product: ProductDefinition;
  ariData: ARIMap;
}

/**
 * Generates a deterministic pricing signature for a specific room on a given date.
 * This signature is used to group contiguous days with identical pricing into a single season.
 * @private
 */
function getPricingSignature(
  roomId: string,
  date: string,
  ariData: ARIMap,
  sortedMealPlans: MealPlan[]
): string {
  const dailyRates = ariData[date]?.rates[roomId];
  if (!dailyRates) {
    return '';
  }
  // Sorting meal plans ensures the signature is deterministic
  return sortedMealPlans
    .map(mp => {
      const rate = dailyRates[mp.id];
      // Format: MEAL_PLAN_ID:AMOUNT:CURRENCY|
      return rate ? `${mp.id}:${rate.amount}:${rate.currency}` : `${mp.id}::`;
    })
    .join('|');
}

/**
 * Creates a sorted list of charge blocks for a given room and date.
 * @private
 */
function createChargeblocks(
  roomId: string,
  date: string,
  ariData: ARIMap,
  sortedMealPlans: MealPlan[]
): HotelEdfChargeblock[] {
  const chargeblocks: HotelEdfChargeblock[] = [];
  const dailyRates = ariData[date]?.rates[roomId];
  if (!dailyRates) {
    return [];
  }

  for (const mealPlan of sortedMealPlans) {
    const rate = dailyRates[mealPlan.id];
    if (rate) {
      chargeblocks.push({
        mealPlan: mealPlan.id,
        amount: rate.amount,
        currency: rate.currency,
      });
    }
  }
  return chargeblocks;
}

/**
 * Transforms normalized HyperGuest hotel, product, and ARI data into a
 * deterministic HotelEdfModel structure that is ready for serialization.
 *
 * This function ensures stable and deterministic ordering for all elements,
 * including rooms, seasons, meal plans, and occupancies, by sorting them
 * based on their respective IDs. It normalizes the day-by-day ARI data
 * into contiguous seasons where pricing is consistent.
 *
 * @param input - An object containing the normalized hotel, product, and ARI data.
 * @returns A structured HotelEdfModel.
 */
export function buildHotelEdfModel(input: BuildHotelEdfModelInput): HotelEdfModel {
  const { hotel, product, ariData } = input;

  // 1. Ensure deterministic ordering by sorting all collections by ID or date.
  const sortedRooms = [...product.rooms].sort((a, b) => a.id.localeCompare(b.id));
  const sortedMealPlans = [...product.meal_plans].sort((a, b) => a.id.localeCompare(b.id));
  const sortedDates = Object.keys(ariData).sort((a, b) => a.localeCompare(b));

  const edfRooms: HotelEdfRoom[] = [];

  for (const room of sortedRooms) {
    const seasons: HotelEdfSeason[] = [];
    if (sortedDates.length === 0) continue;

    let currentSeason: HotelEdfSeason | null = null;

    for (let i = 0; i < sortedDates.length; i++) {
      const date = sortedDates[i];
      const pricingSignature = getPricingSignature(room.id, date, ariData, sortedMealPlans);

      if (pricingSignature === '') {
        currentSeason = null; // End any active season if there's a day with no prices.
        continue;
      }

      const prevDate = i > 0 ? sortedDates[i - 1] : null;
      const prevPricingSignature = prevDate ? getPricingSignature(room.id, prevDate, ariData, sortedMealPlans) : null;

      if (pricingSignature !== prevPricingSignature) {
        // Pricing has changed, so start a new season.
        const chargeblocks = createChargeblocks(room.id, date, ariData, sortedMealPlans);
        currentSeason = {
          seasonId: `S-${room.id}-${date}`, // Deterministic ID
          dateFrom: date,
          dateTo: date,
          chargeblocks,
        };
        seasons.push(currentSeason);
      } else if (currentSeason) {
        // Pricing is the same as the previous day; extend the current season.
        currentSeason.dateTo = date;
      }
    }

    if (seasons.length > 0) {
      edfRooms.push({
        roomCode: room.id,
        seasons,
      });
    }
  }

  const hotelIdentifier: {
    hyperguestId: string;
    giataId?: string;
    peakworkId?: string;
  } = {
    hyperguestId: hotel.id,
  };

  if (hotel.giataId) {
    hotelIdentifier.giataId = hotel.giataId;
  }

  if (hotel.peakworkId) {
    hotelIdentifier.peakworkId = hotel.peakworkId;
  }

  const model: HotelEdfModel = {
    hotel: hotelIdentifier,
    metadata: {
      tourOperatorCode: 'PEAKWORK',
      usage: 'HotelOnly',
    },
    rooms: edfRooms,
  };

  return model;
}
