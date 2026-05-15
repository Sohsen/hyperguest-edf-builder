import {
  BlockedHotel,
  HotelEdfModel,
  Manifest,
  ProductDefinition,
  RunSummary,
} from './types';

// --- Input Contracts for Exported Functions ---

interface CreateRunSummaryInput {
  successfulHotels: { edfModel: HotelEdfModel }[];
  blockedHotels: BlockedHotel[];
  startTime: number;
}

interface CreateManifestInput {
  productDefinition: ProductDefinition;
}

// --- Exported Functions ---

/**
 * Creates a run summary object based on the outcome of the EDF generation process.
 *
 * @param input - The results of the hotel processing, including successful and blocked hotels, and the start time.
 * @returns A RunSummary object detailing the results of the run.
 */
export function createRunSummary(input: CreateRunSummaryInput): RunSummary {
  const { successfulHotels, blockedHotels, startTime } = input;
  const endTime = Date.now();

  const successfulHotelCount = successfulHotels.length;
  const blockedHotelCount = blockedHotels.length;

  /*
   * NOTE: The calculation for 'totalChargeblocks' is prepared below.
   * It will be added to the returned object once the RunSummary type in types.ts is updated to include it.
   *
   * const totalChargeblocks = successfulHotels.reduce((acc, { edfModel }) => {
   *   return acc + edfModel.rooms.reduce((roomAcc, room) => {
   *     return roomAcc + room.seasons.reduce((seasonAcc, season) => {
   *       return seasonAcc + season.chargeblocks.length;
   *     }, 0);
   *   }, 0);
   * }, 0);
   */

  return {
    totalHotels: successfulHotelCount + blockedHotelCount,
    successfulHotels: successfulHotelCount,
    blockedHotels: blockedHotelCount,
    startTime: new Date(startTime).toISOString(),
    endTime: new Date(endTime).toISOString(),
    durationMs: endTime - startTime,
  };
}

/**
 * Creates an export manifest containing a snapshot of the configuration used for the run.
 *
 * @param input - The product definition used for the export.
 * @returns A Manifest object.
 */
export function createExportManifest(input: CreateManifestInput): Manifest {
  const { productDefinition } = input;
  const now = new Date();

  // A simple timestamp-based run ID is used for now.
  const runId = `RUN-${now.getTime()}`;

  // Create a deep copy for the snapshot to prevent mutation of the original object.
  const productDefinitionSnapshot = JSON.parse(JSON.stringify(productDefinition));

  return {
    runId,
    timestamp: now.toISOString(),
    productDefinitionSnapshot,
  };
}
