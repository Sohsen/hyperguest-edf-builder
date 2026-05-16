import { generateEdfExport } from './index';
import { edfExportInputFixture } from './fixtures';
import { buildLazyAriForSelectedHotels } from './lazy-ari';
import { Hotel } from './types';

/**
 * Runs a smoke test on the EDF engine using a lazily-loaded, deterministic ARI.
 *
 * This test simulates a real-world scenario where ARI data is fetched only for
 * a specific subset of hotels. It verifies that:
 * 1. The lazy ARI builder generates data *only* for the selected hotels.
 * 2. The EDF engine correctly processes the valid hotel with the provided ARI.
 * 3. The EDF engine correctly blocks the hotel for which no ARI was provided.
 * 4. The generated XML output is valid and non-empty.
 */
function runSmokeTest() {
  console.log('--- Running EDF Engine Smoke Test with Lazy ARI ---');

  try {
    // 1. Define the scope for the lazy ARI generation
    const allFixtureHotels: Hotel[] = edfExportInputFixture.hotels;
    const validHotel = allFixtureHotels.find(h => h.id === 'hotel-valid');

    if (!validHotel) {
      throw new Error('Smoke test setup failed: Could not find the valid hotel in fixtures.');
    }

    const selectedHotels: Hotel[] = [validHotel];
    const unselectedHotelId = 'hotel-blocked'; // This hotel exists in fixtures but won't be selected

    // 2. Build ARI only for the selected hotels
    const lazyAriMap = buildLazyAriForSelectedHotels({
      selectedHotels: selectedHotels,
      productDefinition: edfExportInputFixture.product_definition,
    });
    
    const lazyAriHotelCount = Object.keys(lazyAriMap).length;

    // 3. Verify that the lazy ARI map is correctly scoped
    if (lazyAriMap[unselectedHotelId]) {
      throw new Error(`Smoke test failed: Lazy ARI map incorrectly contains an unselected hotel (ID: ${unselectedHotelId}).`);
    }
    if (lazyAriHotelCount !== selectedHotels.length) {
        throw new Error(`Smoke test verification failed: Lazy ARI count (${lazyAriHotelCount}) does not match selected hotel count (${selectedHotels.length}).`);
    }

    // 4. Pass the full hotel scope but the sparse (lazy) ARI map to the engine
    const result = generateEdfExport({
      ...edfExportInputFixture,
      hotels: allFixtureHotels, // The engine knows about all hotels
      ari: lazyAriMap,         // But ARI is only provided for a subset
    });

    // 5. Validate the engine's output
    if (result.files.length === 0) {
      throw new Error('Smoke test failed: No XML files were generated for the valid hotel.');
    }

    if (result.summary.blockedCount === 0) {
      throw new Error('Smoke test failed: The unselected (blocked) hotel was not correctly identified and blocked by the engine.');
    }

    const emptyFile = result.files.find(f => !f.xml || f.xml.trim() === '');
    if (emptyFile) {
      throw new Error(`Smoke test failed: Generated XML for ${emptyFile.fileName} is empty.`);
    }

    console.log('\n[SUCCESS] All checks passed for lazy ARI smoke test.\n');

    // 6. Log the summary as required
    console.log('--- Lazy ARI Run Summary ---');
    console.log(`- Selected hotel count: ${selectedHotels.length}`);
    console.log(`- Lazy ARI hotel count: ${lazyAriHotelCount}`);
    console.log(`- XML file count:       ${result.files.length}`);
    console.log(`- Blocked hotel count:    ${result.summary.blockedCount}`);

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
