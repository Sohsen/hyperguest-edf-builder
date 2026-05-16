import {
  Hotel,
  ProductDefinition,
  ARIMap,
  HotelEdfModel,
  EdfRoom,
  EdfSeason,
  HotelEdfChargeblock,
} from './types';

interface BuildInput {
  hotel: Hotel;
  productDefinition: ProductDefinition;
  ari: ARIMap;
}

/**
 * Builds the internal Hotel EDF model from validated input data.
 * This model is a structured representation that is easy to serialize into XML.
 */
export function buildHotelEdfModel(input: BuildInput): HotelEdfModel {
  const { hotel, productDefinition, ari } = input;

  const productCode = productDefinition.id;
  const rooms: EdfRoom[] = [];

  for (const date of Object.keys(ari).sort()) {
    const dayData = ari[date];
    // Simplified: In a real scenario, you would map hotel room codes to product room codes.
    // Here, we assume the ARI keys match the product definition.
    for (const roomCode of Object.keys(dayData.rates)) {
      for (const mealPlanCode of Object.keys(dayData.rates[roomCode])) {
        const rate = dayData.rates[roomCode][mealPlanCode];

        let room = rooms.find(
          r => r.roomCode === roomCode
        );

        if (!room) {
          room = { roomCode, seasons: [] };
          rooms.push(room);
        }

        const chargeblock: HotelEdfChargeblock = {
          occupancyKey: 'A2',
          mealPlan: mealPlanCode,
          amount: rate.amount,
          currency: rate.currency || 'EUR',
        };

        // Find or create a season for this price.
        // This simplified logic creates a new season for each day.
        // A more advanced version would group consecutive days with the same rate.
        const season: EdfSeason = {
          seasonId: `${roomCode}-${mealPlanCode}-${date}`,
          dateFrom: date,
          dateTo: date,
          chargeblocks: [chargeblock],
        };

        room.seasons.push(season);
      }
    }
  }

  const model: HotelEdfModel = {
    hotelId: hotel.hgId,
    giataId: hotel.giataId,
    peakworkId: hotel.peakworkId,
    productCode: productCode,
    metadata: {
      tourOperatorCode: productDefinition.tourOperatorCode,
      usage: 'HotelOnly',
    },
    rooms: rooms,
  };

  return model;
}
