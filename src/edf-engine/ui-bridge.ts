import { ENABLE_NEW_EDF_ENGINE } from './feature-flags';
import { generateEdfExport } from './index';
import { fixtures } from './fixtures';

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
    const result = await generateEdfExport(fixtures.smoke);
    return {
      enabled: true,
      success: true,
      xmlFileNames: result.xmlFileNames,
      blockedHotelCount: result.blockedHotelCount,
      reportSummary: result.reportSummary,
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
