import { ENABLE_NEW_EDF_ENGINE } from './feature-flags';
import { generateEdfExport } from './index';
import { validHotel, blockedHotelNoAri, sampleProductDefinition } from './fixtures';

interface EdfEngineResult {
  enabled: boolean;
  success: boolean;
  xmlFileNames?: string[];
  blockedHotelCount?: number;
  reportSummary?: string[];
  errorMessage?: string;
}

export async function runNewEdfEngineSmokeBridge(): Promise<EdfEngineResult> {
  if (!ENABLE_NEW_EDF_ENGINE) {
    return {
      enabled: false,
      success: false,
    };
  }

  try {
    const selectedHotels = [validHotel, blockedHotelNoAri];

    const result = generateEdfExport(
      selectedHotels,
      sampleProductDefinition,
      {
        startedAtIso: '2026-01-01T00:00:00.000Z',
        endedAtIso: '2026-01-01T00:00:01.000Z',
      }
    );
    return {
      enabled: true,
      success: true,
      xmlFileNames: result.files.map(file => file.fileName),
      blockedHotelCount: result.report.blockedHotels.length,
      reportSummary: [
        `successfulHotels=${result.report.runSummary.successfulHotels}`,
        `blockedHotels=${result.report.runSummary.blockedHotels}`,
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      enabled: true,
      success: false,
      errorMessage,
    };
  }
}
