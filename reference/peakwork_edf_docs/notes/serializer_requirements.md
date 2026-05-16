# Peakwork EDF Serializer Requirements

This document outlines the requirements for serializing hotel data into the Peakwork EDF (Extended Data Format) for hotel products.

## 1. Root Structure

The root element of the XML file must be `<HotelRoot>`.

```xml
<HotelRoot xmlns="http://www.peakwork.com/edf/hotel" 
           xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
           xsi:schemaLocation="http://www.peakwork.com/edf/hotel EDF_Hotel.xsd" 
           SchemaVersion="5.2.0">
  <!-- ... content ... -->
</HotelRoot>
```

- **`xmlns`**: The default namespace must be `http://www.peakwork.com/edf/hotel`.
- **`SchemaVersion`**: This attribute is mandatory and must be set to `5.2.0`.

## 2. Main Sections

The `<HotelRoot>` element contains two main sections:

1.  `<BasicData>`: Contains descriptive and identifying information about the hotel.
2.  `<SellingData>`: Contains pricing, availability, and other sales-related information.

### 2.1. BasicData

The `<BasicData>` element is mandatory and contains essential information that identifies the hotel and the contract.

**Key Attributes:**

- `Code`: **(Mandatory)** The unique hotel identifier from the supplier.
- `TourOperatorCode`: **(Mandatory)** The Peakwork-assigned supplier code.
- `Usage`: **(Mandatory)** The sales context, e.g., `HotelOnly`, `Package`.

**Example:**

```xml
<BasicData Code="12345" TourOperatorCode="SUPPLIER" Usage="HotelOnly">
  <!-- ... other basic data ... -->
</BasicData>
```

### 2.2. SellingData

The `<SellingData>` element is mandatory and contains all data related to the sale of the hotel product.

**Key Elements:**

- `<Rooms>`: **(Mandatory)** A container for one or more `<Room>` elements.

**Example:**

```xml
<SellingData Currency="USD">
  <Rooms>
    <!-- ... Room definitions ... -->
  </Rooms>
</SellingData>
```

## 3. Key Data Structures

### 3.1. Rooms

- Each physical room is defined by a `<Room>` element inside `<Rooms>`.
- Each `<Room>` must have a unique `Code` attribute.

**Example:**

```xml
<Rooms>
  <Room Code="DBL-STD">
    <!-- ... Room details ... -->
  </Room>
</Rooms>
```

### 3.2. Seasons and DateBands

- Pricing and availability are defined within `<Seasons>`.
- Each `<Season>` element must have a `Label` attribute to uniquely identify it.
- Date ranges are defined using `<DateBands>` inside a `<Season>`.

**Example:**

```xml
<Room Code="DBL-STD">
  <Seasons>
    <Season Label="SUMMER-2024">
      <DateBands>
        <DateBand Start="2024-06-01" End="2024-08-31"/>
      </DateBands>
      <!-- ... ChargeBlocks for this season ... -->
    </Season>
  </Seasons>
</Room>
```

### 3.3. Occupancy

- The `<Occupancies>` element defines the possible combinations of adults, children, and infants for a given room.
- Each `<Occupancy>` element specifies constraints like `MinAdult`, `MaxAdult`, `MinChild`, `MaxChild`.

**Example:**

```xml
<Room Code="DBL-STD">
  <Occupancies>
    <Occupancy MinAdult="1" MaxAdult="2" MinChild="0" MaxChild="1"/>
  </Occupancies>
  <!-- ... other room details ... -->
</Room>
```

### 3.4. ChargeBlocks and Pricing

- `<ChargeBlocks>` define the pricing structure for a given room, season, and occupancy.
- The `<BaseCharges>` element sets the base price for the room.
- `<GuestCharges>` are used to define additional charges or discounts for specific guest types (e.g., children).

**Example:**

```xml
<Season Label="SUMMER-2024">
  <ChargeBlocks>
    <ChargeBlock>
      <BaseCharges>
        <BaseCharge Amount="150.00" Board="RO"/>
      </BaseCharges>
      <GuestCharges>
        <GuestCharge Amount="-25.00" Board="RO" PersonType="C" MinAge="6" MaxAge="12"/>
      </GuestCharges>
    </ChargeBlock>
  </ChargeBlocks>
</Season>
```

## 4. Mapping Application Concepts to EDF

| Application Concept | EDF Element/Attribute |
|---|---|
| **Hotel** | `<HotelRoot>`, `<BasicData>` |
| **Hotel ID** | `<BasicData Code="..."/>` |
| **Room** | `<Room Code="..."/>` |
| **Season / DateBand** | `<Season Label="..."/>`, `<DateBand Start="..." End="..."/>` |
| **Occupancy**| `<Occupancy MinAdult="..." MaxChild="..."/>` |
| **Meal Plan** | `<BaseCharge Board="..."/>`, `<GuestCharge Board="..."/>` |
| **ARI Row (Price)** | `<BaseCharge Amount="..."/>` |
| **Chargeblock** | `<ChargeBlock>` and its children (`BaseCharges`, `GuestCharges`) |
