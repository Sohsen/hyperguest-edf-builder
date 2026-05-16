
import * as fs from 'fs';
import * as path from 'path';
import { generateEdfExport } from './index';
import { edfExportInputFixture } from './fixtures';
import { EdfExport } from './types';

/**
 * Executes the EDF export process using deterministic fixtures and writes the output
 * to the filesystem for verification.
 *
 * This script ensures the output directory is clean, runs the `generateEdfExport` function,
 * and then writes the following files to `tmp/edf-engine-smoke/`:
 *  1. One XML file for each successfully generated hotel.
 *  2. `report.json`: A JSON file containing details of blocked hotels.
 *  3. `manifest.json`: The export manifest.
 *  4. `run-summary.json`: A summary of the export run.
 */
async function generateAndWriteSmokeOutput() {
  console.log('--- Generating EDF Smoke Test Output ---');

  const outputDir = path.resolve(__dirname, '../../tmp/edf-engine-smoke');

  // Ensure output folder is recreated on each run
  console.log(`Recreating output directory: ${outputDir}`);
  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
  fs.mkdirSync(outputDir, { recursive: true });

  try {
    // Run generateEdfExport using deterministic fixtures
    const result: EdfExport = generateEdfExport(edfExportInputFixture);

    // Write XML files
    result.files.forEach(file => {
      const filePath = path.join(outputDir, file.fileName);
      fs.writeFileSync(filePath, file.xml, 'utf-8');
      console.log(`Wrote XML: ${filePath}`);
    });

    // Write report.json
    const reportPath = path.join(outputDir, 'report.json');
    fs.writeFileSync(reportPath, JSON.stringify(result.summary.blocked, null, 2), 'utf-8');
    console.log(`Wrote report: ${reportPath}`);

    // Write manifest.json
    const manifestPath = path.join(outputDir, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(result.manifest, null, 2), 'utf-8');
    console.log(`Wrote manifest: ${manifestPath}`);

    // Write run-summary.json
    const summaryPath = path.join(outputDir, 'run-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(result.summary, null, 2), 'utf-8');
    console.log(`Wrote run summary: ${summaryPath}`);

    console.log('\n[SUCCESS] All smoke test output files have been written.');

  } catch (error) {
    const e = error as Error;
    console.error('\n[ERROR] Failed to generate smoke test output:', e.message);
    // In a real CLI app, you might process.exit(1) here
  } finally {
    console.log('\n--- Smoke Test Output Generation Complete ---');
  }
}

generateAndWriteSmokeOutput();
