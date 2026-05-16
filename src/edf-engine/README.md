# EDF Engine Documentation

## 1. Engine Purpose

The primary purpose of the EDF (Electronic Data Format) Engine is to generate structured XML exports for hotel data that conform to the Peakwork specification. It processes a list of hotels, applies business logic, fetches and integrates ARI (Availability, Rates, and Inventory) data, and produces a set of XML files and summary reports.

---

## 2. Module Responsibilities

The engine is organized into several modules, each with a distinct responsibility:

- **`index.ts`**: The main entry point that exposes the public `generateEdfExport` function.
- **`adapter.ts`**: Transforms the input data into a format suitable for the XML builder.
- **`builder.ts`**: Constructs the final XML document from the adapted data.
- **`fixtures.ts`**: Provides deterministic, static data for testing and smoke tests.
- **`lazy-ari.ts`**: Implements the logic for generating ARI data on-demand only for selected hotels.
- **`reporting.ts`**: Generates summaries and reports, including details on blocked or failed hotels.
- **`serializer.ts`**: Converts the constructed XML object into a string format.
- **`validator.ts`**: Contains rules to validate hotel data before and during processing.
- **`types.ts`**: Defines all TypeScript types and interfaces used throughout the engine.
- **`smoke-test.ts`**: An in-memory test script to verify core engine logic and determinism.
- **`export-smoke-output.ts`**: A script to run the engine and write the output files to disk for inspection.

---

## 3. Core Policies

### No Chunking Policy
The engine is designed to generate **one complete XML file per hotel**. It does not support splitting a single hotel's data into multiple smaller files or "chunks."

### Lazy ARI Policy
To ensure efficiency, the engine follows a "lazy ARI" strategy. ARI data is computationally intensive to generate. Therefore, it is only built for the specific subset of hotels that are explicitly selected for an export run. Hotels that are not selected will not have ARI generated for them, and if they are included in a run, they will be blocked with a reason of "No ARI data provided."

### GIATA/Peakwork Identifier Policy
Preserving data integrity is critical. The engine guarantees that all original hotel identifiers, including **HG ID, GIATA ID, and Peakwork ID**, are maintained throughout the entire process. These identifiers are present in all reports, especially for blocked hotels, to ensure traceability and simplify debugging.

---

## 4. Smoke Testing

The engine includes a set of smoke tests to verify its core functionality and ensure that its output is correct and deterministic.

- **`npm run edf:smoke`**
  - Runs a comprehensive, in-memory test suite.
  - Verifies the lazy ARI policy, error reporting, and identifier preservation.
  - Crucially, it runs the engine twice with identical input and performs a deep comparison on the results to guarantee that the output is 100% deterministic.

- **`npm run edf:smoke:write`**
  - Executes the engine using the deterministic fixtures.
  - Writes all generated output (XML files, `report.json`, `manifest.json`, and `run-summary.json`) to the `tmp/edf-engine-smoke/` directory.
  - This allows for manual inspection and verification of the final output files.

---

## 5. Current Limitation

As of now, the EDF engine is a standalone module that has **not yet been wired into the main application UI**. The export process can only be triggered via the command-line scripts. Future work will involve integrating this engine with the front-end export workflow.
