import { AriData } from './external-types';

export interface Hotel {
  hgId: string; // HyperGuest Hotel ID
  name: string;
  giataId?: string;
  peakworkId?: string;
}

export interface HotelWithAri {
  hotel: Hotel;
  ariData: AriData;
}

export interface MealPlan {
  id: string;
  name: string;
}

export interface Occupancy {
  maxAdults: number;
}

export interface ProductDefinition {
  id: string;
  name: string;
  bookingWindowDays: number;
  tourOperatorCode: string;
  dailyPrices: boolean;
  mealPlans: MealPlan[];
  stayDurations: number[];
  occupancies: Occupancy[];
}

export interface GenerateEdfExportInput {
  hotels: HotelWithAri[];
  product_definition: ProductDefinition;
}

export interface ValidationResult {
  isValid: boolean;
  reason?: 'MISSING_REQUIRED_FIELDS' | 'NO_ARI_DATA' | 'OTHER';
  details?: string;
}

export interface HotelEdfModel {
  hotelId: string;
  giataId?: string;
  peakworkId?: string;
  productCode: string;
  rooms: EdfRoom[];
}

export interface EdfRoom {
  roomCode: string;
  roomName?: string;
  seasons: EdfSeason[];
}

export interface EdfSeason {
  seasonId: string;
  dateFrom: string;
  dateTo: string;
  chargeblocks: HotelEdfChargeblock[];
}

export interface HotelEdfChargeblock {
  occupancyKey: string;
  mealPlan: string;
  amount: number;
  currency: string;
}

export interface EdfPrice {
  day: string;
  price: number;
  occupancy: number;
}

export interface EdfFile {
  fileName: string;
  hotelId: string;
  xml: string;
}

export interface LazyAriScope {
  [hotelId: string]: string[]; // meal plans
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

export interface BlockedHotel {
  hotelId: string;
  hotelName: string;
  giataId?: string;
  reason: string;
  details?: string;
}

export interface ExportReport {
  manifest: Manifest;
  runSummary: RunSummary;
  blockedHotels: BlockedHotel[];
}

export interface GenerateEdfExportResult {
  files: EdfFile[];
  report: ExportReport;
}

export interface Runtime {
  startedAtIso: string;
  endedAtIso: string;
  runId?: string;
}
