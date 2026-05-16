import { prepareEdfEngineInput } from './adapter';
import { validateEdfEngineInput } from './validator';
import { buildHotelEdfModel } from './builder';
import { serializeHotelEdf } from './serializer';
import { createManifest, createRunSummary } from './reporting';
import { getLazyAriScope } from './lazy-ari';
import {
  SelectedHotel,
  ProductDefinition,
  GenerateEdfExportResult,
  GenerateEdfExportInput,
  HotelEdfModel,
  BlockedHotel,
  EdfFile,
  RunSummary,
  Manifest,
} from './types';

/**
 * Orchestrates the end-to-end process of generating a Peakwork EDF export.
 *
 * This function implements the required behavior by:
 * 1. Accepting selected hotels and a product definition.
 * 2. Calling `prepareEdfEngineInput` from the adapter to construct the input.
 * 3. Validating each hotel's data using the `validateEdfEngineInput` function.
 * 4. Building EDF models for valid hotels using `buildHotelEdfModel`.
 * 5. Serializing the valid models to XML using `serializeHotelEdf`.
 * 6. Reporting blocked hotels with explicit reasons.
 * 7. Reporting the lazy ARI scope.
 * 8. Preserving identifiers (handled by builder and serializer).
 * 9. Returning deterministic results.
 *
 * @param selectedHotels - An array of hotels selected for the export.
 * @param productDefinition - The product definition to be applied.
 * @returns A structured result object containing the generated files and reports.
 */
export function generateEdfExport(
  selectedHotels: SelectedHotel[],
  productDefinition: ProductDefinition
): GenerateEdfExportResult {
  const startTime = 0; // Deterministic start time for run summary.

  const engineInput: GenerateEdfExportInput = prepareEdfEngineInput(
    selectedHotels,
    productDefinition
  );

  const successfulModels: HotelEdfModel[] = [];
  const blockedHotels: BlockedHotel[] = [];
  const files: EdfFile[] = [];

  for (const hotelInput of engineInput.hotels) {
    const validationResult = validateEdfEngineInput(hotelInput);

    if (!validationResult.isValid) {
      blockedHotels.push({
        hotelId: hotelInput.hotel.id,
        reason: validationResult.errors,
      });
      continue;
    }

    try {
      const model = buildHotelEdfModel(hotelInput);

      if (model.rooms.length === 0) {
        blockedHotels.push({
          hotelId: hotelInput.hotel.id,
          reason: ['No valid rooms or seasons could be generated from the provided ARI data.'],
        });
        continue;
      }

      const xmlOutput = serializeHotelEdf(model);
      const fileName = `${model.metadata.tourOperatorCode}_${model.hotelId}_${productDefinition.id}.xml`;

      files.push({
        fileName,
        hotelId: model.hotelId,
        xml: xmlOutput,
      });

      successfulModels.push(model);
    } catch (error) {
      const reason =
        error instanceof Error
          ? error.message
          : 'An unknown error occurred during model building or serialization.';
      blockedHotels.push({ hotelId: hotelInput.hotel.id, reason: [reason] });
    }
  }

  const endTime = 1; // Deterministic end time for run summary.

  const lazyAriScope = getLazyAriScope(successfulModels);

  const summary: RunSummary = createRunSummary({
    successfulModels,
    blockedHotels,
    startTime,
    endTime,
    totalHotels: selectedHotels.length,
    lazyAriScope,
  });

  const manifest: Manifest = createManifest(productDefinition);

  return {
    files,
    manifest,
    summary,
  };
}
