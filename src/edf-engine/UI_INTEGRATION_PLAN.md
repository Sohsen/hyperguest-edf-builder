# UI Integration Plan: Migrating to the Isolated EDF Engine

This document outlines the strategy for safely migrating the hotel data export functionality from the legacy implementation within `App.tsx` to the new, standalone EDF Engine.

---

## 1. Current (Old) Export Flow Summary

- **Location**: The logic is tightly coupled with the `App.tsx` component.
- **Process**: Data transformation, business logic, validation, and XML generation are all handled directly within the React component's lifecycle and state management.
- **State**: The entire process relies on component state, making it difficult to test, debug, and maintain in isolation.
- **Output**: It generates a ZIP file directly, mixing data processing with file packaging concerns.

---

## 2. New Engine Flow Summary

- **Decoupling**: The UI layer's responsibility is reduced to gathering user input and triggering the download.
- **Process**:
    1.  The UI collects the list of selected hotels and the Product Definition from the form.
    2.  It calls the EDF Engine's `generateEdfExport` function, passing the prepared input.
    3.  The engine, running in isolation, handles all validation, data processing, and generation of XML and reports.
    4.  The engine returns a structured `EdfExport` object containing all generated files and summaries.
    5.  The UI receives this object and uses a library (like `jszip`) to package the contents into a downloadable ZIP file.

---

## 3. Required Input Mapping

The UI must map its state to the `EdfExportInput` object required by the engine.

- **`hotels`**: The complete list of all `Hotel` objects loaded in the application.
- **`selectedHotelIds`**: An array of strings, containing the IDs of the hotels the user has chosen to export.
- **`product_definition`**: This object must be constructed from the "Product Definition" form in the UI. Key fields include:
    -   `name`
    -   `version`
    -   `date_generation`
    -   (Other fields as defined in `src/edf-engine/types.ts` under `ProductDefinition`)
- **`ari`**: The UI will generate this map by calling the `buildLazyAriForSelectedHotels` function.

---

## 4. Lazy ARI Trigger Point

The "lazy" nature of ARI generation is initiated by the UI layer just before calling the main engine function.

1.  **User Action**: User clicks the "Export" button.
2.  **Gather Inputs**: The UI gathers the `selectedHotels` and the `productDefinition`.
3.  **Trigger ARI Build**: The UI calls `buildLazyAriForSelectedHotels({ selectedHotels, productDefinition })`.
4.  **Call Engine**: The resulting `lazyAriMap` is passed as the `ari` property in the input for `generateEdfExport`.

This ensures that the expensive ARI generation step is only ever performed for the hotels that are part of the current export job.

---

## 5. GIATA/Peakwork Identifier Preservation

The new engine is built and tested to guarantee the integrity of all key hotel identifiers (`hg_id`, `giata_id`, `peakwork_id`). When the UI displays blocked hotels from `report.json`, it can trust that these identifiers are the correct ones, allowing for accurate feedback to the user.

---

## 6. Hidden/Manual Test Path

To facilitate end-to-end testing without impacting regular users, a hidden export path will be implemented.

- **Mechanism**: A new "Export (BETA)" button will be added to the UI but will be hidden by default.
- **Activation**: It can be made visible by setting a flag in the browser's `localStorage`:
  ```javascript
  localStorage.setItem('showEdfEngineBeta', 'true');
  ```
- **Purpose**: This allows developers and QA to test the complete new flow—from button click to file download—in a production or staging environment safely.

---

## 7. Feature Flag Strategy

For a controlled rollout, the main "Export" button will be governed by a feature flag.

- **Flag**: `useNewEdfEngine` (can be managed by a remote service or `localStorage`).
- **Logic**:
    -   When `useNewEdfEngine` is `true`, the button triggers the **New Engine Flow**.
    -   When `false` or undefined, it triggers the **Current (Old) Export Flow**.
- **Benefit**: This provides an immediate "kill switch" to disable the new engine if any issues are discovered post-deployment.

---

## 8. Rollback Strategy

The feature flag is the primary rollback mechanism.

- **Procedure**: If the new engine causes critical issues in production, set the `useNewEdfEngine` flag to `false`.
- **Impact**: All users will immediately revert to the old, stable export logic without requiring a new code deployment or a service restart.
- **Precaution**: The old export code within `App.tsx` must not be removed until the new engine is fully validated and has been running stably in production.

---

## 9. Acceptance Checklist

The old export code and feature flag will be removed only after all the following criteria are met:

- [ ] **Functional Parity**: The XML output from the new engine has been verified to be functionally identical or superior to the old flow's output for a variety of hotels.
- [ ] **Data Integrity**: Output from `npm run edf:smoke:write` has been manually reviewed and confirmed to be correct.
- [ ] **Performance**: The new flow's performance is acceptable and is as fast or faster than the old flow for a representative export size.
- [ ] **Error Handling**: The UI correctly consumes `report.json` and displays clear, actionable error messages for blocked hotels.
- [ ] **End-to-End QA**: The hidden test path (`showEdfEngineBeta`) has been thoroughly tested and approved by QA across all major use cases.
- [ ] **Rollback Test**: The `useNewEdfEngine` feature flag has been successfully toggled on and off in a staging environment to confirm the rollback mechanism is working.
- [ ] **No Regressions**: The integration has not introduced any new bugs or regressions in other parts of the application.
