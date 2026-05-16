
import { generateEdfExport } from './index';
import { edfExportInputFixture } from './fixtures';
import { buildLazyAriForSelectedHotels } from './lazy-ari';
import { Hotel, EdfExport } from './types';
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

  try {
    // 1. SETUP: Define the scope for the test run.
    const allFixtureHotels: Hotel[] = edfExportInputFixture.hotels;
    const validHotel = allFixtureHotels.find(h => h.id === 'hotel-valid');
    const blockedHotel = allFixtureHotels.find(h => h.id === 'hotel-blocked');

    if (!validHotel || !blockedHotel) {
      throw new Error('Smoke test setup failed: Could not find required hotels in fixtures.');
    }

    const selectedHotels: Hotel[] = [validHotel];

    // 2. LAZY ARI GENERATION: Build ARI only for the selected hotels.
    const lazyAriMap = buildLazyAriForSelectedHotels({
      selectedHotels,
      productDefinition: edfExportInputFixture.product_definition,
    });

    // 3. PRE-ENGINE VERIFICATION:
    console.log('Verifying lazy ARI generation...');
    if (Object.keys(lazyAriMap).length !== selectedHotels.length) {
      throw new Error(`Lazy ARI count (${Object.keys(lazyAriMap).length}) does not match selected hotel count (${selectedHotels.length}).`);
    }
    if (lazyAriMap[blockedHotel.id]) {
      throw new Error(`Lazy ARI map incorrectly contains an unselected hotel (ID: ${blockedHotel.id}).`);
    }
    console.log('[SUCCESS] Lazy ARI is correctly scoped.');

    const engineInput = {
      ...edfExportInputFixture,
      hotels: allFixtureHotels, // Engine knows about all hotels
      ari: lazyAriMap,         // But ARI is provided only for a subset
    };

    // 4. FIRST ENGINE RUN
    console.log('\n--- First Engine Run ---');
    const result1: EdfExport = generateEdfExport(engineInput);

    // 5. SECOND ENGINE RUN (for determinism check)
    console.log('\n--- Second Engine Run (verifying determinism) ---');
    const result2: EdfExport = generateEdfExport(engineInput);

    // 6. POST-ENGINE VERIFICATION
    console.log('\n--- Verifying Engine Output ---');

    // Rule 7: Output is deterministic
    try {
      deepEqual(result1, result2);
      console.log('[SUCCESS] Engine output is deterministic.');
    } catch (e) {
      console.error('Determinism check failed:', e);
      throw new Error('Smoke test failed: Engine runs produced different results for the same input.');
    }

    // Rule 1 & 4: generateEdfExport uses selected hotels only & valid hotel produces XML
    const validHotelFile = result1.files.find(f => f.fileName.includes(validHotel.id));
    if (!validHotelFile || !validHotelFile.xml.trim()) {
      throw new Error(`Test failed: No valid XML file was generated for the selected hotel (ID: ${validHotel.id}).`);
    }
    if (result1.files.length !== selectedHotels.length){
        throw new Error(`Test failed: Expected ${selectedHotels.length} XML file, but received ${result1.files.length}.`);
    }
    console.log('[SUCCESS] XML is generated only for selected hotels.');


    // Rule 2, 3 & 5: lazy ARI, unselected hotels, and blocked hotel reporting
    const blockedReport = result1.summary.blocked.find(b => b.hotel.id === blockedHotel.id);
    if (!blockedReport) {
      throw new Error(`Test failed: Unselected hotel (ID: ${blockedHotel.id}) was not found in the blocked report.`);
    }
    if (blockedReport.reason !== 'No ARI data provided') {
      throw new Error(`Test failed: Blocked reason for ${blockedHotel.id} is incorrect. Expected "No ARI data provided", got "${blockedReport.reason}".`);
    }
    console.log('[SUCCESS] Unselected hotels are correctly blocked and reported.');

    // Rule 6: Report preserves identifiers
    const originalIds = { hg_id: blockedHotel.hg_id, giata_id: blockedHotel.giata_id, peakwork_id: blockedHotel.peakwork_id };
    const reportedIds = { hg_id: blockedReport.hotel.hg_id, giata_id: blockedReport.hotel.giata_id, peakwork_id: blockedReport.hotel.peakwork_id };
    try {
        deepEqual(originalIds, reportedIds);
        console.log('[SUCCESS] Hotel identifiers are correctly preserved in the report.');
    } catch (e) {
        throw new Error(`Test failed: Identifier mismatch for ${blockedHotel.id}. Original: ${JSON.stringify(originalIds)}, Reported: ${JSON.stringify(reportedIds)}`);
    }

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
