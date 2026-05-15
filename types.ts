export type GiataProperty = {
  giataId: number;
  name: string;
  address?: string;
  city?: string;
  cityName?: string;
  cityGiataId?: number;
  destinationName?: string;
  destinationGiataId?: number;
  countryCode?: string;
  countryName?: string;
  rating?: string;
  latitude?: number;
  longitude?: number;
  chainName?: string;
  chainGiataId?: number;
  roomTypes?: Array<{
    code?: string;
    name?: string;
    variantId?: string;
  }>;
};

export enum NormalizationStatus {
  MATCHED = 'MATCHED',
  AMBIGUOUS = 'AMBIGUOUS',
  UNMAPPED = 'UNMAPPED',
  GIATA_UNAVAILABLE = 'GIATA_UNAVAILABLE'
}

export type NormalizationResult = {
  hgHotelId: string;
  giataId?: number;
  status: NormalizationStatus;
  matchStatus?: NormalizationStatus; // Keeping for compatibility if needed
  matchConfidence: number;
  confidence?: number; // Aliasing
  matchMethod: string;
  lastUpdated: string;
  candidates?: GiataProperty[];
  matchedProperty?: GiataProperty;
};

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface HotelFilters {
  page?: number;
  limit?: number;
  search?: string;
  cities?: string[];
  stars?: number[];
  country?: string[];
}

export interface Hotel {
  id: string;
  hgId: string;
  giataId: string;
  peakworkId: string;
  name: string;
  starRating: number;
  category?: number; // Aliasing for UI
  city: string;
  country: string;
  destination: string;
  resolvedIata?: string;
  roomCount?: number;
  mealPlans?: string[];
  status?: 'safe' | 'warning';
  complexScore?: number;
  normalization?: NormalizationResult;
}

export interface Occupancy {
  id: string;
  adults: number;
  children: number;
  ageFrom: number;
  ageTo: number;
}

export type Step = 'builder' | 'loading' | 'preview';

export interface HistoricalBooking {
  destination: string;
  market: string;
  stayDuration: number;
  bookingWindowDays: number;
  occupancy: string;
  mealPlan: string;
}

export interface Room {
  id: string;
  code: string;
  name: string;
}

export type BaseAmounts = {
  numberOfGuests?: {
    adults?: number;
    children?: number;
    infants?: number;
  };
  priceAfterTax?: number;
  priceBeforeTax?: number;
  price?: number;
};

export type DailyRatePlanARI = {
  pricePerLOS?: number;
  originalRatePlanCode?: string;
  ratePlanCode: string;
  baseAmounts?: BaseAmounts[];
  minLOS?: number;
  maxLOS?: number;
  isOpenOnArrival?: boolean;
  isOpenOnDeparture?: boolean;
  isOpen?: boolean;
  additionalGuestsRate?: {
    adults?: number;
    children?: number;
    infants?: number;
  };
  pricePerPersonAfterTax?: number;
  pricePerRoomAfterTax?: number;
  release?: number;
  lastMinute?: number;
  currency?: string;
  minStayThrough?: number;
  maxStayThrough?: number;
  pricePerAge?: {
    price: number;
    maxAge: number;
    minAge: number;
  }[];
  prices?: BaseAmounts[];
};

export type LosRatePlanARI = {
  ratePlanCode: string;
  currency?: string;
  baseAmounts?: {
    numberOfGuests?: {
      adults?: number;
      children?: number;
      infants?: number;
    };
    priceAfterTax?: number;
    priceBeforeTax?: number;
  }[];
  additionalGuestsRate?: {
    adults?: number;
    children?: number;
    infants?: number;
  };
  pricePerAge?: {
    price: number;
    maxAge: number;
    minAge: number;
  }[];
};

export type RatePlanARI = DailyRatePlanARI | LosRatePlanARI;

export type ARIFullDetails = {
  Id?: number;
  date: Date | string;
  los?: number;
  roomTypeCode: string;
  numberOfAvailableRooms?: number;
  ratePlans?: RatePlanARI[];
};

export type ARIPartialDetails = Omit<ARIFullDetails, "Id">;

export interface ARIData {
  date: string; // YYYY-MM-DD
  price: number;
  stayDuration: number; 
  minLOS: number;
  maxLOS: number;
  release?: number;
  lastMinute?: number;
  stopSell: boolean;
  alloc: number;
  cta?: boolean;
  ctd?: boolean;
}

export interface Season {
  id: string;
  startDate: string;
  endDate: string;
  chargeblocks: Record<string, Record<number, number>>; // occKey -> (duration -> price)
  minLOS: number;
  maxLOS: number;
  release?: number;
  lastMinute?: number;
  alloc: number;
  stopSell: boolean;
  cta?: boolean;
  ctd?: boolean;
  classification?: 'PEAK' | 'SHOULDER' | 'LOW' | 'WEEKEND';
  metadata?: {
    rawSeasonCount: number;
    mergedSeasonCount: number;
    varianceThreshold: number;
    debugLogs?: string[];
  };
}

export interface ConstraintCompliance {
  roomsWithinCBLimit: boolean;
  maxCBPerRoom: number;
  roomsExceedingLimit: number;
  roomsAutoCorrected: number;
  priceLimitExceeded: boolean;
  priceViolationRooms: number;
  roomsWithNoSeasons: number;
  seasonLimitExceeded: boolean;
  hotelPriceLimitExceeded: boolean;
}

export interface HotelExportValidation {
  hotelId: string;
  partId?: string;
  partKey?: string;
  isPartitioned?: boolean;
  roomCount: number;
  seasonCount: number;
  mealPlanCount: number;
  occupancyCount: number;
  chargeblockCount: number;
  dateSpan: { start: string; end: string };
  isSynthetic: boolean;
  processedRooms?: any[];
  inputMetrics?: any;
  diagnosticStats?: {
    totalRooms: number;
    roomsWithSeasons: number;
    roomsWithNoSeasons: number;
    ariRowsMatched: number;
  };
  compressionStats: {
    rawInputCB: number;
    postMergeCB: number;
    finalOutputCB: number;
    ratio: number;
  };
  warnings?: string[];
  postProcessingApplied?: boolean;
  constraintCompliance: ConstraintCompliance;
  executionDecision: ExecutionDecision;
    debug?: {
      classification: 'SIMPLE' | 'MEDIUM' | 'COMPLEX';
      beforeSeasonCount: number;
      afterSeasonCount: number;
      beforeChargeblockCount: number;
      afterChargeblockCount: number;
      appliedMergeThreshold: string;
      mergesAttempted?: number;
      mergesPerformed?: number;
      noMergeReason?: string;
      ariRowCount?: number;
      priceChangeCount?: number;
      restrictionChangeCount?: number;
    };
}

export interface TimelineEvent {
  timestamp: string;
  action: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
}

export interface HotelLog {
  hgId: string;
  name: string;
  giataId: string;
  pwId: string;
  status: 'Generated' | 'Generated with Trim' | 'Blocked' | 'Skipped' | 'Not in Last Run' | 'Failed' | string;
  chargeblocks: number;
  trimApplied: string;
  lastGenerated: string;
  notes: string;
  chunkId?: string;
}

export interface ChunkLog {
  id: string; // destinationCode_CHUNK_01
  index: number;
  fileName: string;
  status: 'Success' | 'Failed' | 'Trimmed' | 'Blocked' | 'Partial';
  hotelCount: number;
  predictedChargeblocks: number;
  actualChargeblocks: number;
  trimApplied: string;
  strategy: string; // Example: "Hotel-based chunking (20 per file)"
  outcome: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  generatedAt: string;
  durationMs: number;
  notes: string;
  hotels: HotelLog[];
}

export interface DeterminismAudit {
  inputFingerprint: string;
  configFingerprint: string;
  dataFingerprint: string;
  executionFingerprint: string;
  isDeterministic: boolean;
  comparisonReference: string | null;
  mismatchDetails: string[] | null;
  notes: string;
}

export interface ExecutionDecision {
  strategy: string;
  constraintTriggered: string;
  actionTaken: string;
  selectedPackagingStrategy?: PackagingStrategy;
  totalInputCB?: number;
  finalOutputCB?: number;
  threshold?: number;
  partitioningApplied?: boolean;
  chunkingApplied?: boolean;
  trimmingApplied?: boolean;
  reason?: string;
  note?: string;
}

export interface Manifest {
  id: string;
  runId: string;
  sessionId: string;
  userId: string;
  userEmail: string;
  destinationCode: string;
  destinationName: string;
  country: string;
  productDefinitionVersion: string;
  generatedAt: string;
  overallStatus: string;
  execution: ExecutionDecision;
  determinismAudit?: DeterminismAudit;
  content: {
    hotelsGenerated: number;
    itemCount: number;
    totalChargeblocks: number;
  };
  pdSnapshot: {
    markets: string[];
    airports: { code: string; name: string }[];
    bookingWindowDays: number;
    stayDurations: number[];
    mealPlans: string[];
    occupancies: any[];
  };
}

export const CHUNKING_TOOLTIP = "Chunking breaks a destination-level EDF build into smaller asynchronous batches. This helps prevent oversized exports, keeps processing stable, and allows failed batches to be retried without rebuilding everything.";

export interface ExportReport {
  isValid: boolean;
  errorMessage?: string;
  timestamp: string;
  executionMode: ExecutionMode;
  hotels: HotelExportValidation[];
  similarities: {
    hotelA: string;
    hotelB: string;
    similarityScore: number;
    reasons: string[];
  }[];
  chunks?: ChunkLog[];
  inventorySummary?: {
    inScopeHotels: number;
    uniqueHotelsGenerated: number;
    hotelPartsGenerated: number;
    filesGenerated: number;
    chunks: number;
    blockedHotels: number;
    totalChargeblocks: number;
    itemCount: number;
    trimmedHotels: number;
  };
  strategy?: string;
  chunkingApplied?: boolean;
  partitioningApplied?: boolean;
  execution?: ExecutionDecision;
  constraintCompliance?: ConstraintCompliance;
  chunkingBenefit?: {
    applied: boolean;
    reason: string;
    evaluationSkipped: boolean;
  };
  determinismAudit?: DeterminismAudit;
}

export interface ProductDefinition {
  id: string;
  name: string;
  destinations: string[];
  selectedClusters: string[];
  markets: string[];
  excludedMarkets: string[];
  airports: string[];
  marketAirports: Record<string, string[]>; // marketCode -> airportCodes
  marketOverrideStates: Record<string, 'inherited' | 'override' | 'manual'>;
  bookingWindowDays: number;
  stayDurations: number[];
  mealPlans: string[];
  occupancies: Occupancy[];
  createdAt: string;
}

export enum ExecutionMode {
  REGRESSION = 'REGRESSION',
  STRESS = 'STRESS',
  PRODUCTION = 'PRODUCTION'
}

export enum PackagingStrategy {
  MINIMIZED = 'MINIMIZED',
  BALANCED = 'BALANCED',
  MAXIMIZED = 'MAXIMIZED'
}

export const PACKAGING_STRATEGY_DESCRIPTIONS: Record<PackagingStrategy, string> = {
  [PackagingStrategy.MINIMIZED]: "Reduce data volume using aggressive merging. May reduce seasonal granularity.",
  [PackagingStrategy.BALANCED]: "Preserve detail where possible, optimize when approaching Peakwork room limits.",
  [PackagingStrategy.MAXIMIZED]: "Preserve full detail. May produce larger outputs or trigger partitioning if volume limits are reached."
};

export interface PackagingState {
  productDefinition: ProductDefinition;
  executionMode: ExecutionMode;
  packagingStrategy: PackagingStrategy;
}

export interface FallbackPolicy {
  allowStayDurationsFallback: boolean;
  allowOccupancyFallback: boolean;
  allowMealPlanFallback: boolean;
  allowMarketFallback: boolean;
  stayDurationsFallback: {
    allowDerivation: boolean;
    allowMixedBuild: boolean;
    allowSingleNightExpansion: boolean;
    maxCombinationDepth: number;
    preferExactMultiples: boolean;
    enforceContiguity: boolean;
    enforceAvailability: boolean;
  };
}

export interface ARIMatchDiagnostic {
  hotelId: string;
  roomCode: string;
  requested: {
    markets: string[];
    mealPlans: string[];
    occupancies: string[];
    stayDurations: number[];
    dateWindow: { start: string; end: string };
  };
  available: {
    markets: string[];
    mealPlans: string[];
    occupancies: string[];
    stayDurations: number[];
    dateRange: { start: string; end: string };
  };
  strictMatch: {
    marketMatched: boolean;
    mealPlanMatched: boolean;
    occupancyMatched: boolean;
    durationMatched: boolean;
    dateOverlapMatched: boolean;
  };
  fallback?: {
    applied: boolean;
    level: 'NONE' | 'DURATION_FALLBACK' | 'OCCUPANCY_FALLBACK' | 'MEALPLAN_FALLBACK' | 'MARKET_FALLBACK';
    requestedValue?: any;
    selectedValue?: any;
    allowedByPolicy: boolean;
    reason: string;
    matchType?: 'EXACT' | 'DERIVED';
    derivationStrategy?: 'EXACT_MULTIPLE' | 'MIXED_BUILD' | 'SINGLE_NIGHT_EXPANSION' | 'BEST_FIT';
    components?: { stayDurations: number; price: number; startDate: string; endDate: string }[];
    coverageRatio?: number;
    componentCount?: number;
    contiguous?: boolean;
    availabilityValid?: boolean;
    rejectedPaths?: number;
  };
  finalMatch?: {
    market: string;
    mealPlan: string;
    occupancy: string;
    duration?: number;
    ariRowsMatched: number;
    seasonsGenerated: number;
    chargeblocksGenerated: number;
  };
  failureReason?: string;
}

export interface DerivationResult {
  price: number;
  components: { stayDuration: number; price: number; startDate: string; endDate: string }[];
  strategy: 'EXACT' | 'EXACT_MULTIPLE' | 'MIXED_BUILD' | 'SINGLE_NIGHT_EXPANSION';
  rejectedPaths: number;
  raw?: ARIData;
}
