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


interface PrepareUiInput {
  selectedHotels: Hotel[];
  productDefinition: ProductDefinition;
  ariDataByHotelId: Record<string, any>;
}

/**
 * Prepares EDF engine input from the real UI export flow.
 * This preserves the UI-provided ARI source instead of generating lazy dummy ARI.
 */
export function prepareEdfEngineInputFromUi(input: PrepareUiInput): GenerateEdfExportInput {
  const { selectedHotels, productDefinition, ariDataByHotelId } = input;

  return {
    hotels: selectedHotels.map(hotel => ({
      hotel,
      ariData: ariDataByHotelId[hotel.hgId] || {},
    })),
    product_definition: productDefinition,
  };
}
