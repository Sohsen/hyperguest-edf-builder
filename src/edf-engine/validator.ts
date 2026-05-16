import {
  Hotel,
  ProductDefinition,
  ARIMap,
  ValidationResult,
} from './types';

interface ValidationInput {
  hotel: Hotel;
  product: ProductDefinition;
  ariData: ARIMap;
}

/**
 * Validates a hotel and its associated data to ensure it meets the basic
 * requirements for EDF generation.
 *
 * This function checks for the presence and validity of required data fields
 * before the more intensive building process begins.
 *
 * Required behavior:
 * 1. missing HyperGuest hotel ID = block
 * 2. missing ARI for selected hotel = block
 * 3. missing rooms = block
 * 4. missing product stay durations = block
 * 5. missing product meal plans = block
 * 6. missing product occupancies = block
 * 7. missing GIATA ID = do not invent; return warning if type supports warnings, otherwise allow for now
 * 8. missing Peakwork ID = do not invent; return warning if type supports warnings, otherwise allow for now
 *
 * Note: This does not currently perform full Peakwork XSD/schema validation.
 *
 * @param input - An object containing the hotel, product definition, and ARI data.
 * @returns A ValidationResult object indicating if the hotel is ready for processing.
 */
export function validateHotelForEdf(input: ValidationInput): ValidationResult {
  const { hotel, product, ariData } = input;

  if (!hotel || !product) {
    return {
      isValid: false,
      reason: 'MISSING_REQUIRED_FIELDS',
      details: 'Hotel or ProductDefinition is missing.',
    };
  }

  // Rule 1: Missing HyperGuest hotel ID
  if (!hotel.hgId) {
    return {
      isValid: false,
      reason: 'MISSING_REQUIRED_FIELDS',
      details: `Hotel '${hotel.name}' is missing a HyperGuest hotel ID.`,
    };
  }

  // Rule 2: Missing ARI for selected hotel
  const hotelAri = ariData[hotel.hgId];
  if (!hotelAri) {
    return {
      isValid: false,
      reason: 'NO_ARI_DATA',
      details: `Missing ARI data for hotel '${hotel.name}' (${hotel.hgId}).`,
    };
  }

  // Rule 3: Missing rooms in ARI
  if (Object.keys(hotelAri).length === 0) {
    return {
      isValid: false,
      reason: 'NO_ARI_DATA',
      details: `ARI data for hotel '${hotel.name}' (${hotel.hgId}) contains no rooms.`,
    };
  }

  // Rule 4: Missing product stay durations
  if (!product.stayDurations || product.stayDurations.length === 0) {
    return {
      isValid: false,
      reason: 'MISSING_REQUIRED_FIELDS',
      details: 'Product definition must have at least one stay duration.',
    };
  }

  // Rule 5: Missing product meal plans
  if (!product.mealPlans || product.mealPlans.length === 0) {
    return {
      isValid: false,
      reason: 'MISSING_REQUIRED_FIELDS',
      details: 'Product definition must have at least one meal plan.',
    };
  }

  // Rule 6: Missing product occupancies
  if (!product.occupancies || product.occupancies.length === 0) {
    return {
      isValid: false,
      reason: 'MISSING_REQUIRED_FIELDS',
      details: 'Product definition must have at least one occupancy.',
    };
  }

  // Rules 7 & 8: Missing GIATA ID and Peakwork ID are allowed for now,
  // as the ValidationResult type does not support warnings.
  // A future implementation should add a warnings array to the result.

  return {
    isValid: true,
  };
}
