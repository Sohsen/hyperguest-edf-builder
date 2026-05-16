import {
  HotelEdfModel,
  BlockedHotel,
  ProductDefinition,
  Manifest,
  RunSummary,
  LazyAriScope,
} from './types';

interface RunSummaryInput {
  totalHotels: number;
  successfulModels: HotelEdfModel[];
  blockedHotels: BlockedHotel[];
  startTime: string;
  endTime: string;
  lazyAriScope: LazyAriScope;
}

interface ManifestInput {
  productDefinition: ProductDefinition;
  runId?: string;
  timestamp?: string;
}

/**
 * Creates the manifest file, which is a snapshot of the export configuration.
 */
export function createManifest(input: ManifestInput): Manifest {
  const {
    productDefinition,
    runId = `RUN-${Date.now()}`,
    timestamp = new Date().toISOString(),
  } = input;

  // Deep copy to prevent mutations from affecting the original object
  const productDefSnapshot: ProductDefinition = JSON.parse(
    JSON.stringify(productDefinition)
  );

  return {
    runId: runId,
    timestamp: timestamp,
    productDefinitionSnapshot: productDefSnapshot,
  };
}

/**
 * Creates a summary of the export run.
 */
export function createRunSummary(input: RunSummaryInput): RunSummary {
  const { totalHotels, successfulModels, blockedHotels, startTime, endTime } = input;

  return {
    totalHotels: totalHotels,
    successfulHotels: successfulModels.length,
    blockedHotels: blockedHotels.length,
    startTime: startTime,
    endTime: endTime,
    durationMs: new Date(endTime).getTime() - new Date(startTime).getTime(),
    };
}
