import { GenerateEdfExportInput, Hotel, ProductDefinition } from './types';
import { buildLazyAriForSelectedHotels } from './lazy-ari';

interface PrepareInput {
  selectedHotels: Hotel[];
  productDefinition: ProductDefinition;
}

/**
 * Prepares the full input required by the EDF engine by fetching necessary
 * external data (like ARI) and merging it with the initial selection.
 *
 * @param input - The initial data containing selected hotels and a product definition.
 * @returns The complete and structured input for the `generateEdfExport` function.
 */
export function prepareEdfEngineInput(input: PrepareInput): GenerateEdfExportInput {
  const { selectedHotels, productDefinition } = input;

  const ariData = buildLazyAriForSelectedHotels({
    selectedHotels,
    productDefinition,
  });

  return {
    hotels: selectedHotels.map(hotel => ({
      hotel,
      ariData: ariData[hotel.hgId] || {},
    })),
    product_definition: productDefinition,
  };
}
