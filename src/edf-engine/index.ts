npm run build
git add src/edf-engine/index.ts
git commit -m "Add EDF engine orchestration entrypoint"
git pushimport { buildHotelEdfModel } from './builder';
import { serializeHotelEdf } from './serializer';
import {
  ARIMap,
  BlockedHotel,
  EdfFile,
  GenerateEdfExportInput,
  GenerateEdfExportResult,
  Hotel,
  HotelEdfModel,
  Manifest,
  ProductDefinition,
  RunSummary,
} from './types';

// --- Local Validation (as per flow requirement) ---

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates the essential data for a single hotel before processing.
 * @param hotel - The hotel object.
 * @param product - The product definition.
 * @param ariData - The availability, rates, and inventory data.
 * @returns A validation result object.
 */
function validateHotelData(
  hotel: Hotel,
  product: ProductDefinition,
  ariData: ARIMap
): ValidationResult {
  const errors: string[] = [];
  if (!hotel || !hotel.id) {
    errors.push('Hotel data is missing or invalid.');
  }
  if (!product) {
    errors.push('Product definition is missing.');
  }
  if (!ariData || Object.keys(ariData).length === 0) {
    errors.push('ARI data is missing or empty.');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }
  return { isValid: true, errors: [] };
}


// --- Local Reporting (as per flow requirement) ---

/**
 * Creates a run summary object based on the outcome of the EDF generation process.
 * @returns A RunSummary object detailing the results of the run.
 */
function createRunSummary(
    successfulHotels: { edfModel: HotelEdfModel }[],
    blockedHotels: BlockedHotel[],
    startTime: number,
    endTime: number,
): RunSummary {
  return {
    startTime,
    endTime,
    durationMs: endTime - startTime,
    totalHotels: successfulHotels.length + blockedHotels.length,
    successfulCount: successfulHotels.length,
    blockedCount: blockedHotels.length,
    blockedHotels: blockedHotels,
  };
}

/**
 * Creates a manifest file for the export.
 * @returns A Manifest object.
 */
function createManifest(productDefinition: ProductDefinition): Manifest {
  return {
    createdAt: '1970-01-01T00:00:00.000Z', // Deterministic
    product: {
      id: productDefinition.id,
      name: productDefinition.name,
    },
  };
}


/**
 * Orchestrates the end-to-end process of generating a Peakwork EDF export.
 *
 * This function takes normalized hotel and pricing data, validates it,
 * transforms it into the EDF model structure, and serializes it to XML.
 * It produces a deterministic export package containing the XML files,
 * a manifest, and a summary report, without creating a ZIP archive.
 *
 * @param input - The complete dataset required for the export.
 * @returns A structured result object containing the generated files and reports.
 */
export function generateEdfExport(input: GenerateEdfExportInput): GenerateEdfExportResult {
  const startTime = 0; // Deterministic start time for run summary
  const successfulModels: { edfModel: HotelEdfModel }[] = [];
  const blockedHotels: BlockedHotel[] = [];
  const files: EdfFile[] = [];

  for (const { hotel, ariData } of input.hotels) {
    const validation = validateHotelData(hotel, input.productDefinition, ariData);
    if (!validation.isValid) {
      blockedHotels.push({ hotelId: hotel.id, reason: validation.errors });
      continue;
    }

    const model = buildHotelEdfModel({
      hotel,
      product: input.productDefinition,
      ariData,
    });
    
    if (model.rooms.length === 0) {
        blockedHotels.push({ hotelId: hotel.id, reason: ['No valid seasons or rooms could be generated from the provided ARI data.'] });
        continue;
    }

    successfulModels.push({ edfModel: model });

    const xml = serializeHotelEdf(model);
    const fileName = `${model.metadata.tourOperatorCode}_${model.hotelId}_${input.productDefinition.id}.xml`;

    files.push({
      fileName,
      hotelId: model.hotelId,
      xml,
    });
  }
  
  const endTime = 1; // Deterministic end time for run summary

  const summary = createRunSummary(successfulModels, blockedHotels, startTime, endTime);
  const manifest = createManifest(input.productDefinition);

  return {
    files,
    manifest,
    summary,
  };
}
