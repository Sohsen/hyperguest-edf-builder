import { fileURLToPath } from 'url';
import * as fs from 'fs';
import * as path from 'path';
import { generateEdfExport } from './index';
import {
  edfExportInputFixture,
  sampleProductDefinition,
} from './fixtures';
import { GenerateEdfExportResult } from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Executes the EDF export process using deterministic fixtures and writes the output
 * to the filesystem for verification.
 *
 * This script ensures the output directory is clean, runs the `generateEdfExport` function,
 * and then writes the following files to `tmp/edf-engine-smoke/`:
 *  1. One XML file for each successfully generated hotel.
 *  2. `report.json`: A JSON file containing details of blocked hotels and other metadata.
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
    const result: GenerateEdfExportResult = generateEdfExport(
      edfExportInputFixture.hotels.map(h => h.hotel),
      sampleProductDefinition
    );

    // Write XML files
    result.files.forEach(file => {
      const filePath = path.join(outputDir, file.fileName);
      fs.writeFileSync(filePath, file.xml, 'utf-8');
      console.log(`Wrote XML: ${filePath}`);
    });

    // Write report.json
    const reportPath = path.join(outputDir, 'report.json');
    fs.writeFileSync(
      reportPath,
      JSON.stringify(result.report, null, 2),
      'utf-8'
    );
    console.log(`Wrote report: ${reportPath}`);

    console.log(
      '\n[SUCCESS] All smoke test output files have been written.'
    );
  } catch (error) {
    const e = error as Error;
    console.error(
      '\n[ERROR] Failed to generate smoke test output:',
      e.message
    );
    // In a real CLI app, you might process.exit(1) here
  } finally {
    console.log('\n--- Smoke Test Output Generation Complete ---');
  }
}

generateAndWriteSmokeOutput();
