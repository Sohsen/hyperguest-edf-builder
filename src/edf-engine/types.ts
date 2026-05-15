/**
 * This file defines the shared TypeScript types and interfaces for the isolated EDF engine.
 * It ensures a consistent data model across all engine modules.
 */

// --- Base Data Structures (Isolated from App)

export interface Hotel {
  id: string;
  hgId: string;
  name: string;
  giataId?: string;
  peakworkId?: string;
  city: string;
  country: string;
  destination: string;
  starRating: number;
  [key: string]: any;
}

export interface Occupancy {
  id: string;
  adults: number;
  children: number;
  ageFrom: number;
  ageTo: number;
}

export interface ProductDefinition {
  id: string;
  name: string;
  destinations: string[];
  markets: string[];
  airports: string[];
  bookingWindowDays: number;
  stayDurations: number[];
  mealPlans: string[];
  occupancies: Occupancy[];
  [key: string]: any;
}

export interface ARIData {
  date: string;
  price: number;
  alloc: number;
  minLOS: number;
  maxLOS: number;
  stopSell: boolean;
  cta: boolean;
  ctd: boolean;
  [key: string]: any;
}

export type ARIMap = Record<string, Record<string, ARIData[]>>;

// --- Structured EDF Model (Pre-Serialization) ---

export interface HotelEdfChargeblock {
  occupancyKey: string;
  mealPlan: string;
  amount: number;
  currency: string;
}

export interface HotelEdfSeason {
  seasonId: string;
  dateFrom: string;
  dateTo: string;
  chargeblocks: HotelEdfChargeblock[];
}

export interface HotelEdfRoom {
  roomCode: string;
  roomName?: string;
  seasons: HotelEdfSeason[];
}

export interface HotelEdfModel {
  hotelId: string;
  hotelName: string;
  giataId?: string;
  peakworkId?: string;
  rooms: HotelEdfRoom[];
  metadata: Record<string, any>;
}

// --- Engine Validation & Reporting Contracts ---

export type ValidationReason =
  | 'NO_ARI_DATA'
  | 'VALIDATION_FAILED'
  | 'MISSING_REQUIRED_FIELDS'
  | 'ZERO_CHARGEBLOCKS'
  | 'EXCEEDS_COMPLEXITY_LIMITS'
  | 'GENERATION_ERROR';

export interface ValidationResult {
  isValid: boolean;
  reason?: ValidationReason;
  details?: string;
}

export interface BlockedHotel {
  hotelId: string;
  hotelName: string;
  giataId?: string;
  reason: ValidationReason;
  details?: string;
}

export interface RunSummary {
  totalHotels: number;
  successfulHotels: number;
  blockedHotels: number;
  startTime: string;
  endTime: string;
  durationMs: number;
}

export interface Manifest {
  runId: string;
  timestamp: string;
  productDefinitionSnapshot: ProductDefinition;
}

export interface ExportReport {
  manifest: Manifest;
  runSummary: RunSummary;
  blockedHotels: BlockedHotel[];
}
