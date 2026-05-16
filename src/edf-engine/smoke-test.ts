import { generateEdfExport } from './index';
import { edfExportInputFixture } from './fixtures';

/**
 * Runs a smoke test on the EDF engine using deterministic fixtures.
 *
 * This test executes the `generateEdfExport` function and verifies the output
 * against a set of basic expectations. It prints a summary of the results
 * to the console and throws an error if a critical expectation is not met,
 * such as failing to generate an XML file for a valid hotel or failing to
 * block an invalid one.
 */
function runSmokeTest() {
  console.log('--- Running EDF Engine Smoke Test ---');

  try {
    const result = generateEdfExport(edfExportInputFixture);

    // 1. Validate the output
    if (result.files.length === 0) {
      throw new Error('Smoke test failed: No XML files were generated for the valid hotel.');
    }

    if (result.summary.blockedCount === 0) {
      throw new Error('Smoke test failed: The blocked hotel was not correctly identified.');
    }

    const emptyFile = result.files.find(f => !f.xml || f.xml.trim() === '');
    if (emptyFile) {
      throw new Error(`Smoke test failed: Generated XML for ${emptyFile.fileName} is empty.`);
    }

    console.log('\n[SUCCESS] All checks passed.\n');

    // 2. Print the results as required
    console.log(`- XML files generated: ${result.files.length}`);
    console.log(`- Blocked hotels: ${result.summary.blockedCount}`);

    console.log('\n- Generated file names:');
    result.files.forEach(file => {
      console.log(`  - ${file.fileName}`);
    });

    console.log('\n- Run summary:');
    console.log(JSON.stringify(result.summary, null, 2));

  } catch (error) {
    console.error('\n[ERROR] Smoke test failed:', (error as Error).message);
    // In a real CLI app, you might process.exit(1) here
  } finally {
    console.log('\n--- Smoke Test Complete ---');
  }
}

// Execute the test
runSmokeTest();
