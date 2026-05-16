# GIATA Mapping Contract for EDF Engine

## Rule
The EDF engine must not bypass GIATA Drive mapping.

## Identifier handling
The engine adapter must preserve:
- HyperGuest hotel ID
- GIATA ID, when available
- Peakwork ID, when available

## Missing identifiers
If GIATA ID or Peakwork ID is missing, the adapter must not invent values.

Missing identifiers should be passed through to the validator/builder layer so the engine can decide whether to:
- block the hotel
- warn
- continue with fallback behavior

## Current phase
The adapter consumes already mapped/enriched hotel records from the current app flow.

## Future phase
Real GIATA Drive lookup/enrichment can be integrated before adapter execution, but not inside the serializer or XML generation layer.
