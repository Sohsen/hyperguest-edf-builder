
import {
  ProductDefinition,
  Hotel,
  ARIMap,
  GenerateEdfExportInput
} from './types';
import { buildLazyAriForSelectedHotels } from './lazy-ari';

interface PrepareEdfEngineInputArgs {
  selectedHotels: Hotel[];
  productDefinition: ProductDefinition;
}

/**
 * Prepares the complete input payload for the EDF (Electronic Data Feed) engine.
 *
 * This adapter serves as a bridge between the application's state and the core engine.
 * It accepts hotels that have already been enriched with identifiers (GIATA, etc.)
 * from the main application flow and prepares them for the engine.
 *
 * Key responsibilities:
 * - It preserves all existing hotel identifiers (`hgId`, `giataId`, `peakworkId`), passing them
 *   through to the engine without modification. It does not perform any mapping itself.
 * - It triggers the lazy-building of ARI data for the selected hotels, ensuring that
 *   availability and rates are generated only for the hotels currently in scope.
 * - It assembles the final, deterministic input object that the `generateEdfExport`
 *   function requires, ensuring unselected hotels are completely excluded.
 *
 * @param args - An object containing the user-selected (and pre-mapped) hotels and the product definition.
 * @returns The fully-formed `GenerateEdfExportInput` object, ready for the engine.
 */
export function prepareEdfEngineInput(
  args: PrepareEdfEngineInputArgs
): GenerateEdfExportInput {
  const { selectedHotels, productDefinition } = args;

  // 1. Build ARI lazily, scoped only to the selected hotels.
  const ariMap = buildLazyAriForSelectedHotels({
    selectedHotels,
    productDefinition,
  });

  // 2. Return the complete, deterministic payload for the engine.
  // The hotels array, with all its pre-mapped identifiers, is passed through directly.
  return {
    hotels: selectedHotels,
    product_definition: productDefinition,
    ari: ariMap,
  };
}
