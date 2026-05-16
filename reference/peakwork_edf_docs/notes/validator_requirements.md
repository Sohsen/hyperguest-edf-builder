git status
git diff --stat# Peakwork EDF Validator Requirements

This document outlines the validation requirements for Peakwork EDF (Extended Data Format) hotel product files. These rules ensure data integrity, consistency, and adherence to the format's constraints.

## 1. XSD Schema Validation

- **Primary Validation**: All EDF XML files must be validated against the official Peakwork XSD schemas. This is the first and most critical validation step.
- **Schema Location**: The validator must be able to locate and use the correct XSD files for the given `SchemaVersion` specified in the `<HotelRoot>` element.

## 2. Structural and Root Element Validation

- **Root Element**: The root element must be `<HotelRoot>`.
- **Mandatory Sections**: The `<HotelRoot>` element must contain exactly one `<BasicData>` and one `<SellingData>` element.
- **Namespace**: The XML namespace must be correctly declared as `http://www.peakwork.com/edf/hotel`.

## 3. `BasicData` Validation

- **`Code`**: The `Code` attribute is mandatory and must not be empty. It should be a unique identifier for the hotel from the supplier's perspective.
- **`TourOperatorCode`**: This attribute is mandatory, must not be empty, and should correspond to a valid Peakwork supplier code.
- **`Usage`**: This attribute is mandatory and must be one of the allowed values (e.g., `HotelOnly`, `Package`).

## 4. `SellingData` Validation

- **`Currency`**: The `Currency` attribute is mandatory and must contain a valid 3-letter ISO 4217 currency code.
- **`Rooms`**: The `<Rooms>` element is mandatory and must contain at least one `<Room>` element.

## 5. Room, Season, and Occupancy Validation

- **Room Code**: Each `<Room>` must have a unique `Code` attribute within the context of the hotel.
- **Season Label**: Each `<Season>` must have a unique `Label` attribute within the context of a `<Room>`.
- **DateBand Overlaps**: The validator must check for overlapping `<DateBand>` ranges within the same `<Season>`. Overlaps are not permitted.
- **Occupancy Consistency**: The values for `MinAdult`, `MaxAdult`, `MinChild`, and `MaxChild` in `<Occupancy>` elements must be logical (e.g., `Min` should not be greater than `Max`).

## 6. Pricing and Chargeblock Validation

- **Charge Amounts**: All `Amount` attributes in `<BaseCharge>` and `<GuestCharge>` must be valid decimal numbers.
- **Board Codes**: All `Board` attributes must be valid, non-empty strings corresponding to the board types offered (e.g., `RO`, `BB`, `HB`).
- **Age Ranges**: In `<GuestCharge>` elements, `MinAge` must be less than or equal to `MaxAge`.

## 7. Cardinality and Constraint Checks

- **Mandatory Elements**: The validator must enforce the presence of all mandatory elements as defined by the XSD and this document (e.g., `<HotelRoot>`, `<BasicData>`, `<SellingData>`, `<Rooms>`).
- **Repeating Elements**: The validator must check that elements with cardinality constraints (e.g., `maxOccurs="1"`) are not repeated.

## 8. Cross-Reference and Integrity Validation

- **FileKey and Hotel Identifiers**: While not strictly required for validation of a single file, a complete validation process should check for consistency of hotel identifiers (`Code`, `TourOperatorCode`, `HotelKey`) across multiple EDF files for the same hotel.
