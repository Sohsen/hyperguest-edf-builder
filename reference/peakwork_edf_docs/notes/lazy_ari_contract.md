# Lazy ARI Generation Contract

This document outlines the behavior and contract for the lazy ARI (Availability, Rates, and Inventory) generation layer, designed to simulate a future live HyperGuest ARI integration.

## 1. Core Principle: Lazy, On-Demand Generation

- **No Global ARI:** The system **must not** rely on a global or preloaded ARI dataset. All previous static ARI datasets (`PRELOADED_ARI`) are considered deprecated for the core export flow.
- **Post-Selection Trigger:** ARI generation **must** be triggered only *after* a user has finalized their hotel selection in the **Product Definition** step of the workflow.

## 2. Simulation of Future Integration

The current implementation, `buildLazyAriForSelectedHotels`, serves as a temporary, deterministic dummy layer. Its purpose is to faithfully simulate the contract that a future, live HyperGuest ARI service will adhere to.

- **Future Integration Point:** This module is the designated integration point. When the live service is ready, its API client will replace the dummy generation logic within this module, while respecting the established input/output contract.

## 3. Deterministic Output

To ensure stable and predictable behavior for testing, validation, and exports, the ARI generation process must be **strictly deterministic**.

- **Rule:** Given an identical set of selected hotels and an identical `ProductDefinition`, the output `ARIMap` **must** be exactly the same on every run.

## 4. Generation Boundary

- **Selected Hotels as Boundary:** The list of selected hotel IDs acts as the definitive boundary for ARI generation. The system must only process hotels within this list.
- **Exclusion of Unselected Hotels:** For any hotel ID not present in the `selectedHotels` input array, no ARI data will be generated. The resulting `ARIMap` **must not** contain keys for unselected hotels. This is critical for testing the engine's ability to handle data gaps and block hotels without availability.
