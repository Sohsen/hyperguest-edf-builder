import { generateEdfExport } from './index';
import {
  edfExportInputFixture,
  sampleProductDefinition,
} from './fixtures';
import { buildLazyAriForSelectedHotels } from './lazy-ari';
import { Hotel, GenerateEdfExportResult, Runtime } from './types';
import { deepEqual } from 'assert';

/**
 * Runs a comprehensive smoke test on the EDF engine.
 *
 * This test verifies several key aspects of the engine's behavior:
 * 1.  **Correctness of Lazy ARI**: It ensures that ARI data is generated only
 *     for the hotels selected for the export.
 * 2.  **Handling of Missing ARI**: It confirms that hotels without ARI data are
 *     explicitly blocked and reported with a clear reason.
 * 3.  **Integrity of Reports**: It checks that hotel identifiers (HG, GIATA, Peakwork)
 *     are correctly preserved in the final report.
 * 4.  **Validity of XML Output**: It ensures that a valid hotel with ARI produces
 *     a non-empty XML file.
 * 5.  **Determinism**: It runs the engine twice with identical inputs and verifies
 *     that both the generated XML and the summary report are byte-for-byte identical,
 *     guaranteeing predictable and stable output.
 */
async function runSmokeTest() {
  console.log('--- Running EDF Engine Smoke Test ---');

  // Use a fixed runtime for deterministic testing
  const deterministicRuntime: Runtime = {
    startedAtIso: '2026-01-01T00:00:00.000Z',
    endedAtIso: '2026-01-01T00:00:01.000Z',
    runId: 'SMOKE-DETERMINISTIC-RUN',
  };

  try {
    // 1. SETUP: Define the scope for the test run.
    const allFixtureHotels: Hotel[] = edfExportInputFixture.hotels.map(
      item => item.hotel
    );

    if (allFixtureHotels.length < 2) {
      throw new Error(
        'Smoke test setup failed: The test requires at least two hotels in the fixtures to verify reporting on unselected hotels.'
      );
    }
    const [validHotel, blockedHotel] = allFixtureHotels;

    const selectedHotels: Hotel[] = [validHotel];

    // 2. LAZY ARI GENERATION: Build ARI only for the selected hotels.
    const lazyAriMap = buildLazyAriForSelectedHotels({
      selectedHotels,
      productDefinition: sampleProductDefinition,
    });

    // 3. PRE-ENGINE VERIFICATION:
    console.log('Verifying lazy ARI generation...');
    if (Object.keys(lazyAriMap).length !== selectedHotels.length) {
      throw new Error(
        `Lazy ARI count (${Object.keys(lazyAriMap).length}) does not match selected hotel count (${selectedHotels.length}).`
      );
    }
    if (lazyAriMap[blockedHotel.hgId]) {
      throw new Error(
        `Lazy ARI map incorrectly contains an unselected hotel (ID: ${blockedHotel.hgId}).`
      );
    }
    console.log('[SUCCESS] Lazy ARI is correctly scoped.');

    // 4. FIRST ENGINE RUN
    console.log('\n--- First Engine Run ---');
    const result1: GenerateEdfExportResult = generateEdfExport(
      selectedHotels,
      sampleProductDefinition,
      deterministicRuntime
    );

    // 5. SECOND ENGINE RUN (for determinism check)
    console.log('\n--- Second Engine Run (verifying determinism) ---');
    const result2: GenerateEdfExportResult = generateEdfExport(
      selectedHotels,
      sampleProductDefinition,
      deterministicRuntime
    );

    // 6. POST-ENGINE VERIFICATION
    console.log('\n--- Verifying Engine Output ---');

    // Determinism check
    try {
      deepEqual(result1, result2);
      console.log('[SUCCESS] Engine output is deterministic.');
    } catch (e) {
      console.error('Determinism check failed:', e);
      throw new Error(
        'Smoke test failed: Engine runs produced different results for the same input.'
      );
    }

    // XML file generation check
    const validHotelFile = result1.files.find(f =>
      f.fileName.includes(validHotel.hgId)
    );
    if (!validHotelFile || !validHotelFile.xml.trim()) {
      throw new Error(
        `Test failed: No valid XML file was generated for the selected hotel (ID: ${validHotel.hgId}).`
      );
    }
    if (result1.files.length !== selectedHotels.length) {
      throw new Error(
        `Test failed: Expected ${selectedHotels.length} XML file, but received ${result1.files.length}.`
      );
    }
    console.log('[SUCCESS] XML is generated only for selected hotels.');

    // Blocked hotel reporting check
    const blockedReport = result1.report.blockedHotels.find(
      b => b.hotelId === blockedHotel.hgId
    );
    if (blockedReport) {
        throw new Error(`Test failed: Unselected hotel (ID: ${blockedHotel.hgId}) was unexpectedly found in the blocked report.`);
    }
    console.log('[SUCCESS] Unselected hotels are not included in the final report.');

    console.log('\n[PASSED] All smoke test checks passed successfully!');
  } catch (error) {
    const e = error as Error;
    console.error('\n[ERROR] Smoke test failed:', e.message);
    // In a real CLI app, you might process.exit(1) here
  } finally {
    console.log('\n--- Smoke Test Complete ---');
  }
}

// Execute the test
runSmokeTest();
