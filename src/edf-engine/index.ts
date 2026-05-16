import { prepareEdfEngineInput } from './adapter';
import { validateHotelForEdf } from './validator';
import { buildHotelEdfModel } from './builder';
import { serializeHotelEdf } from './serializer';
import { createManifest, createRunSummary } from './reporting';
import { getLazyAriScope } from './lazy-ari';
import {
  Hotel,
  ProductDefinition,
  GenerateEdfExportResult,
  GenerateEdfExportInput,
  HotelEdfModel,
  BlockedHotel,
  EdfFile,
  ExportReport,
  Runtime,
} from './types';

/**
 * Orchestrates the end-to-end process of generating a Peakwork EDF export.
 *
 * @param selectedHotels - An array of hotels selected for the export.
 * @param productDefinition - The product definition to be applied.
 * @param runtime - Optional deterministic runtime metadata for testing.
 * @returns A structured result object containing the generated files and reports.
 */
export function generateEdfExport(
  selectedHotels: Hotel[],
  productDefinition: ProductDefinition,
  runtime?: Runtime 
): GenerateEdfExportResult {
  const startTime = runtime?.startedAtIso || new Date().toISOString();

  const engineInput: GenerateEdfExportInput = prepareEdfEngineInput({
    selectedHotels,
    productDefinition,
  });

  const successfulModels: HotelEdfModel[] = [];
  const blockedHotels: BlockedHotel[] = [];
  const files: EdfFile[] = [];

  for (const hotelWithAri of engineInput.hotels) {
    const validationResult = validateHotelForEdf({
      hotel: hotelWithAri.hotel,
      product: engineInput.product_definition,
      ariData: hotelWithAri.ariData,
    });

    if (!validationResult.isValid) {
      blockedHotels.push({
        hotelId: hotelWithAri.hotel.hgId,
        hotelName: hotelWithAri.hotel.name,
        giataId: hotelWithAri.hotel.giataId,
        reason: validationResult.reason!,
        details: validationResult.details,
      });
      continue;
    }

    try {
      const model = buildHotelEdfModel({
        hotel: hotelWithAri.hotel,
        productDefinition: engineInput.product_definition,
        ari: hotelWithAri.ariData,
      });

      if (!Array.isArray(model.rooms) || model.rooms.length === 0) {
        blockedHotels.push({
          hotelId: hotelWithAri.hotel.hgId,
          hotelName: hotelWithAri.hotel.name,
          giataId: hotelWithArij.hotel.giataId,
          reason: 'NO_ARI_DATA',
          details: 'No valid rooms or seasons could be generated from the provided ARI data.',
        });
        continue;
      }

      const xmlOutput = serializeHotelEdf(model);
      const fileName = `${productDefinition.id}_${hotelWithAri.hotel.hgId}.xml`;

      files.push({
        fileName,
        hotelId: model.hotelId,
        xml: xmlOutput,
      });

      successfulModels.push(model);
    } catch (error) {
      const details =
        error instanceof Error
          ? error.message
          : 'An unknown error occurred during model building or serialization.';
      blockedHotels.push({
        hotelId: hotelWithAri.hotel.hgId,
        hotelName: hotelWithAri.hotel.name,
        giataId: hotelWithAri.hotel.giataId,
        reason: 'GENERATION_ERROR',
        details,
      });
    }
  }

  const endTime = runtime?.endedAtIso || new Date().toISOString();
  const lazyAriScope = getLazyAriScope(successfulModels);

  const report: ExportReport = {
    manifest: createManifest({
      productDefinition,
      runId: runtime?.runId,
      timestamp: runtime?.startedAtIso,
    }),
    runSummary: createRunSummary({
      totalHotels: selectedHotels.length,
      successfulModels,
      blockedHotels,
      startTime,
      endTime,
      lazyAriScope,
    }),
    blockedHotels,
  };

  return {
    files,
    report,
  };
}
