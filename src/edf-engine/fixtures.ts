import {
  ARIMap,
  Hotel,
  ProductDefinition,
  GenerateEdfExportInput,
} from './types';

// A realistic but minimal product definition for testing.
export const sampleProductDefinition: ProductDefinition = {
  id: 'PROD-SUMMER-2024',
  name: 'Summer Sunshine Getaway',
  rooms: [
    { id: 'DBL-STD', name: 'Standard Double Room' },
    { id: 'SUI-JNR', name: 'Junior Suite' },
  ],
  meal_plans: [
    { id: 'RO', name: 'Room Only' },
    { id: 'BB', name: 'Bed & Breakfast' },
  ],
  // Occupancy definitions are not used by the builder yet, so they can be omitted.
  occupancies: [], 
};

// A valid hotel with corresponding ARI data.
export const validHotel: Hotel = {
  id: 'HG-001',
  name: 'Seaside Resort & Spa',
};

// A hotel that will be blocked because it has no associated ARI data.
export const blockedHotelNoAri: Hotel = {
  id: 'HG-002',
  name: 'Mountain Lodge (No ARI)',
};


// ARI data for the valid hotel. This fixture is designed to create multiple
// seasons during the build process due to pricing changes and gaps.
export const sampleAriMap: ARIMap = {
  // --- Season 1: Two days with consistent pricing ---
  '2024-07-01': {
    rates: {
      'DBL-STD': {
        'RO': { amount: 100, currency: 'EUR' },
        'BB': { amount: 120, currency: 'EUR' },
      },
      'SUI-JNR': {
        'RO': { amount: 180, currency: 'EUR' },
        'BB': { amount: 210, currency: 'EUR' },
      },
    },
  },
  '2024-07-02': {
    rates: {
      'DBL-STD': {
        'RO': { amount: 100, currency: 'EUR' },
        'BB': { amount: 120, currency: 'EUR' },
      },
      'SUI-JNR': {
        'RO': { amount: 180, currency: 'EUR' },
        'BB': { amount: 210, currency: 'EUR' },
      },
    },
  },
  // --- Season 2: Pricing changes ---
  '2024-07-03': {
    rates: {
      'DBL-STD': {
        'RO': { amount: 110, currency: 'EUR' },
        'BB': { amount: 130, currency: 'EUR' },
      },
      'SUI-JNR': {
        'RO': { amount: 190, currency: 'EUR' },
        'BB': { amount: 220, currency: 'EUR' },
      },
    },
  },
  // --- Gap Day: This will split the seasons ---
  // No data for 2024-07-04
  // --- Season 3: New pricing after the gap ---
  '2024-07-05': {
    rates: {
      'DBL-STD': {
        'RO': { amount: 95, currency: 'EUR' },
        'BB': { amount: 115, currency: 'EUR' },
      },
       // SUI-JNR is intentionally omitted to test partial room data
    },
  },
};

/**
 * A complete, deterministic input fixture for the `generateEdfExport` function.
 */
export const edfExportInputFixture: GenerateEdfExportInput = {
  productDefinition: sampleProductDefinition,
  hotels: [
    {
      hotel: validHotel,
      ariData: sampleAriMap,
    },
    {
      hotel: blockedHotelNoAri,
      ariData: {},
    },
  ],
};
