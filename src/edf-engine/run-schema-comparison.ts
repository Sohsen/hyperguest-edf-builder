/**
 * This script serves as the main entry point for executing the schema comparison process.
 * It is intended to be run from the command line in a Node.js environment.
 *
 * The script performs the following actions:
 * 1. Imports the core comparison logic from the `schema-comparator` module.
 * 2. Executes the comparison function to validate generated XML against the schema map.
 * 3. Takes the resulting discrepancy report.
 * 4. Pretty-prints the report into a JSON format.
 * 5. Writes the JSON output to a dedicated report file, overwriting any previous version.
 */

import * as fs from 'fs';
import * as path from 'path';
import { compareGeneratedXmlAgainstSchema, DiscrepancyReport } from './schema-comparator';

// --- Configuration ---
const OUTPUT_DIR = 'tmp';
const REPORT_FILE_PATH = path.join(OUTPUT_DIR, 'schema-comparison-report.json');

/**
 * Runs the schema comparison and writes the output to a JSON report file.
 */
function runComparisonAndWriteReport(): void {
  console.log('Starting schema comparison process...');

  try {
    // 1. Execute the comparison
    const report: DiscrepancyReport = compareGeneratedXmlAgainstSchema();

    // 2. Prepare the JSON output
    const jsonOutput = JSON.stringify(report, null, 2);

    // 3. Ensure the output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      console.log(`Created output directory at: ${OUTPUT_DIR}`);
    }

    // 4. Write the report file
    fs.writeFileSync(REPORT_FILE_PATH, jsonOutput, 'utf-8');

    console.log(`Successfully wrote schema comparison report to: ${REPORT_FILE_PATH}`);
    if (!report.valid) {
      console.error('Schema validation failed. See report for details.');
    }

  } catch (error: any) {
    console.error('An error occurred during the schema comparison process:', error.message);
    // Create a synthetic error report
    const errorReport = {
      valid: false,
      error: error.message,
      filesChecked: [],
      missingElements: [],
      missingAttributes: [],
      unexpectedElements: [],
      hierarchyViolations: [],
    };
    fs.writeFileSync(REPORT_FILE_PATH, JSON.stringify(errorReport, null, 2), 'utf-8');
  }
}

// --- Execute the Script ---
runComparisonAndWriteReport();
