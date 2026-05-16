import { Hotel, ProductDefinition, AriData, ValidationResult } from './types';

interface ValidationInput {
  hotel: Hotel;
  product: ProductDefinition;
  ariData: AriData;
}

/**
 * Validates that a hotel and its associated data are complete and valid for EDF generation.
 */
export function validateHotelForEdf(input: ValidationInput): ValidationResult {
  const { hotel, product, ariData } = input;

  if (!hotel.hgId || !hotel.name) {
    return {
      isValid: false,
      reason: 'MISSING_REQUIRED_FIELDS',
      details: 'Hotel hgId or name is missing.',
    };
  }

  if (
    !product.id ||
    !product.mealPlans ||
    !product.stayDurations ||
    !product.occupancies
  ) {
    return {
      isValid: false,
      reason: 'MISSING_REQUIRED_FIELDS',
      details: 'Product definition is incomplete.',
    };
  }

  if (Object.keys(ariData).length === 0) {
    return {
      isValid: false,
      reason: 'NO_ARI_DATA',
      details: 'No ARI data is available for this hotel.',
    };
  }

  return { isValid: true };
}
