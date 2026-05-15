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
 * Note: This does not currently perform full Peakwork XSD/schema validation.
 * That will be added later after the /reference/peakwork_edf_docs are ingested.
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

  if (!hotel.hgId) {
    return {
      isValid: false,
      reason: 'MISSING_REQUIRED_FIELDS',
      details: `Hotel '${hotel.name}' is missing an hgId.`,
    };
  }

  if (!product.stayDurations || product.stayDurations.length === 0) {
    return {
      isValid: false,
      reason: 'MISSING_REQUIRED_FIELDS',
      details: 'Product definition must have at least one stay duration.',
    };
  }

  if (!product.mealPlans || product.mealPlans.length === 0) {
    return {
      isValid: false,
      reason: 'MISSING_REQUIRED_FIELDS',
      details: 'Product definition must have at least one meal plan.',
    };
  }

  if (!product.occupancies || product.occupancies.length === 0) {
    return {
      isValid: false,
      reason: 'MISSING_REQUIRED_FIELDS',
      details: 'Product definition must have at least one occupancy.',
    };
  }

  const hotelAri = ariData[hotel.hgId];
  if (!hotelAri) {
    return {
      isValid: false,
      reason: 'NO_ARI_DATA',
      details: `No ARI data found for hotel ${hotel.hgId}.`,
    };
  }

  if (Object.keys(hotelAri).length === 0) {
    return {
      isValid: false,
      reason: 'NO_ROOMS_GENERATED',
      details: `ARI data for hotel ${hotel.hgId} contains no room candidates.`,
    };
  }

  // If all checks pass, the hotel is considered valid for the build step.
  return {
    isValid: true,
  };
}
