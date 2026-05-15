import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronLeft,
  TriangleAlert as AlertTriangle, 
  Check,
  CircleCheck as CheckCircle2, 
  Loader2, 
  Globe, 
  Plane, 
  Users, 
  Calendar, 
  Clock, 
  Timer,
  Utensils,
  UtensilsCrossed,
  X,
  LayoutDashboard,
  Settings,
  History,
  Eye,
  Save,
  Menu,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CircleAlert as AlertCircle,
  ArrowRight,
  ArrowLeft,
  Download,
  Upload,
  Import,
  ExternalLink,
  Sparkles,
  Star,
  FileCheck,
  FileText,
  Filter,
  BarChart4,
  BarChart3,
  MapPin,
  Database,
  Info,
  Archive,
  FileArchive,
  Zap,
  Circle,
  ShieldCheck,
  Hotel as HotelIcon,
  MoreVertical,
  User,
  Activity,
  MessageSquare,
  ChevronUp,
  GripHorizontal,
  PlusCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import Papa from 'papaparse';
import JSZip from 'jszip';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

import { Virtuoso } from 'react-virtuoso';
import { SearchableMultiSelect } from './components/SearchableMultiSelect';

const formatNumber = (val: any) => {
  if (val === null || val === undefined || isNaN(Number(val))) return "—";
  return Number(val).toLocaleString();
};

import { 
  Hotel, Occupancy, Step, PackagingState, HistoricalBooking, ARIData, Season, Room, ExportReport, HotelExportValidation, ProductDefinition, ChunkLog, HotelLog, TimelineEvent, Manifest, DeterminismAudit, ExecutionDecision, CHUNKING_TOOLTIP, ExecutionMode, PackagingStrategy, PACKAGING_STRATEGY_DESCRIPTIONS, ConstraintCompliance,
  ARIMatchDiagnostic, FallbackPolicy,
  GiataProperty, NormalizationStatus, NormalizationResult
} from './types';
import { PRELOADED_ARI } from './services/ariDataset';
import { SIMULATED_HOTELS, generateRealisticARIForHotel } from './services/simulationService';
import { GiataDriveService } from './services/giataDriveService';
import { 
  DESTINATIONS, 
  CITY_TO_IATA,
  COUNTRIES, 
  MEAL_PLANS, 
  HOTELS as CONST_HOTELS, 
  DESTINATION_RECOMMENDATIONS,
  COMMON_OCCUPANCIES,
  OCCUPANCY_RECOMMENDATIONS,
  MEAL_PLAN_RECOMMENDATIONS,
  AIRPORT_MAPPING,
  DESTINATION_COUNTRY_MAP,
  MAX_CB_PER_ROOM,
  MAX_SEASONS_PER_HOTEL,
  MAX_TOTAL_PRICES_PER_HOTEL,
  MAX_PRICES_PER_ROOM,
  MAJOR_PRICE_SHIFT,
  MARKET_CLUSTERS,
  OCCUPANCY_PRIORITY_LIST,
  MEAL_PLAN_PRIORITY,
  ROOM_PRIORITY
} from './constants';
import {
  getSeededRandom,
  jitterShift,
  getBehaviorSignature,
  arePriceVectorsCompatible,
  resolveDurationPrice,
  getPriceVector,
  mergeAdjacentSeasonsInRoom,
  forceMergeSeasons,
  reduceRoomDimensions,
  enforcePeakworkConstraints,
  mapOccupancyToARICode,
  getHotelCategory,
  getInputComplexityMetrics,
  getHotelComplexity,
  resolveGiata,
  deriveHotels,
  buildAriIndexes,
  getHotelIdentity,
  deriveSeasonsForRoom,
  generateEDFModelForHotel,
  estimateSeasonsCount,
  DEFAULT_FALLBACK_POLICY,
  PRICE_VARIANCE_THRESHOLD
} from './services/engine';

// --- Helper Components & Styles ---

const normalizeText = (text: string): string => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .trim();
};

const getSearchScore = (query: string, item: { name: string; code?: string; iso?: string; hgId?: string; giataId?: string; peakworkId?: string; searchText: string }): number => {
  const q = normalizeText(query);
  if (!q) return 0;

  // 1. Exact code match (Highest priority)
  if (item.code && normalizeText(item.code) === q) return 100;
  if (item.iso && normalizeText(item.iso) === q) return 98;
  if (item.hgId && normalizeText(item.hgId) === q) return 95;
  if (item.giataId && normalizeText(item.giataId) === q) return 90;
  if (item.peakworkId && normalizeText(item.peakworkId) === q) return 85;

  // 2. Exact name match
  const n = normalizeText(item.name);
  if (n === q) return 80;

  // 3. Starts-with match
  if (n.startsWith(q)) return 60;
  if (item.searchText.split(' ').some(word => word.startsWith(q))) return 50;

  // 4. Contains match
  if (item.searchText.includes(q)) return 30;

  // 5. Fuzzy / Subsequence match
  let qIdx = 0;
  let tIdx = 0;
  const target = item.searchText;
  while (qIdx < q.length && tIdx < target.length) {
    if (q[qIdx] === target[tIdx]) qIdx++;
    tIdx++;
  }
  if (qIdx === q.length) return 10;

  return 0;
};

const Tooltip = ({ text, children }: { text: string; children: React.ReactNode }) => {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top - 10;
    
    timerRef.current = setTimeout(() => {
      setCoords({ x, y });
      setShow(true);
    }, 400); // 400ms delay
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShow(false);
  };
  
  return (
    <div 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {show && createPortal(
        <div 
          className="fixed z-[1000] px-3 py-2 bg-neutral-900 border border-white/10 rounded shadow-2xl text-white text-[10px] font-bold uppercase tracking-widest pointer-events-none -translate-x-1/2 -translate-y-full max-w-[200px] text-center leading-relaxed"
          style={{ top: coords.y, left: coords.x }}
        >
          {text}
        </div>,
        document.body
      )}
    </div>
  );
};

const FlowIndicator = ({ currentStep, onNavigate, canNavigate }: { currentStep: number, onNavigate: (step: number) => void, canNavigate: (step: number) => { allowed: boolean; reason?: string } }) => {
  const steps = [
    { id: 1, label: 'Product', icon: Globe },
    { id: 2, label: 'Hotels', icon: HotelIcon },
    { id: 3, label: 'Rules', icon: Settings },
    { id: 4, label: 'Review', icon: Download }
  ];

  return (
    <div className="flex items-center justify-center py-2 h-[48px] border-b border-hg-border/50 bg-hg-bg">
      <div className="flex items-center gap-2 max-w-full overflow-x-auto no-scrollbar px-4">
        {steps.map((step, i) => {
          const nav = canNavigate(step.id);
          const isEnabled = nav.allowed;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <React.Fragment key={step.id}>
              <button 
                onClick={() => onNavigate(step.id)}
                disabled={!isEnabled && !isActive}
                className={`flex items-center gap-2 shrink-0 transition-all duration-300 group outline-none ${
                    isActive ? 'opacity-100 cursor-default' : 
                    isEnabled ? 'opacity-60 hover:opacity-100 cursor-pointer' : 
                    'opacity-20 cursor-not-allowed'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                    isActive 
                    ? 'bg-hg-accent text-hg-bg shadow-lg shadow-hg-accent/20 scale-110' 
                    : isCompleted 
                        ? 'bg-hg-accent/10 text-hg-accent border border-hg-accent/30' 
                        : 'bg-hg-panel text-hg-muted border border-hg-border'
                }`}>
                  {isCompleted ? <Check size={12} /> : step.id}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
                    isActive ? 'text-hg-text' : 'text-hg-muted group-hover:text-hg-text'
                }`}>
                  {step.label}
                </span>
              </button>
              {i < steps.length - 1 && (
                <div className={`w-8 h-px shrink-0 transition-all duration-500 ${currentStep > step.id ? 'bg-hg-accent' : 'bg-hg-border'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

const CollapsedSelection = ({ 
  items, 
  onRemove, 
  max = 8,
  isMobile = false
}: { 
  items: string[]; 
  onRemove?: (item: string) => void;
  max?: number;
  isMobile?: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (items.length === 0) return null;
  
  const effectiveMax = isMobile ? 4 : max;
  const displayItems = isExpanded ? items : items.slice(0, effectiveMax);
  const remainingCount = items.length - (isExpanded ? items.length : effectiveMax);

  return (
    <div className="flex flex-col gap-2">
      <div className={`flex flex-wrap gap-1 transition-all duration-300 ${!isExpanded ? 'max-h-[52px] overflow-hidden' : 'max-h-[300px] overflow-y-auto custom-scrollbar pr-1'}`}>
        {displayItems.map((item, i) => (
          <div 
            key={stableKey("collapsed", item, i)} 
            className="flex items-center gap-1.5 bg-neutral-900 border border-white/10 px-2 py-1 rounded text-[10px] font-bold text-white group hover:border-hg-accent/50 transition-colors"
          >
            <span className="truncate max-w-[120px]">{item}</span>
            {onRemove && (
              <button 
                onClick={(e) => { e.stopPropagation(); onRemove(item); }}
                className="text-neutral-500 hover:text-red-400 transition-colors"
                id={`remove-${item}`}
              >
                <X size={10} />
              </button>
            )}
          </div>
        ))}
        {!isExpanded && remainingCount > 0 && (
          <button 
            onClick={() => setIsExpanded(true)}
            className="px-2 py-1 rounded text-[10px] font-black text-hg-accent bg-hg-accent/10 border border-hg-accent/20 hover:bg-hg-accent/20 transition-all uppercase tracking-tighter"
          >
            +{remainingCount} more
          </button>
        )}
      </div>
      {isExpanded && items.length > effectiveMax && (
        <button 
          onClick={() => setIsExpanded(false)}
          className="text-[9px] font-black text-hg-muted hover:text-white uppercase tracking-widest text-left w-fit"
        >
          Collapse List
        </button>
      )}
    </div>
  );
};

// --- Helpers ---

function stableKey(...parts: (string | number | boolean | null | undefined)[]): string {
  return parts
    .filter(p => p !== null && p !== undefined && p !== "")
    .map(String)
    .join("-");
}

function getExecutionUnitKey(item: any): string {
  const hotelId = item.hotelId || item.hgId;
  const partId = item.partId || item.partKey || null;

  if (item.partKey) return item.partKey;
  if (partId) return `${hotelId}-${partId}`;
  return `${hotelId}-single`;
}

interface DestinationLog {
  id: string; // RUN_YYYY_MM_DD_HHMMSS
  destination: string; // IATA
  name: string;
  country: string;
  hotelsInScope: number;
  hotelsGenerated: number;
  hotelsTrimmed: number;
  hotelsBlocked: number;
  lastGenerationTime: string;
  status: 'Complete' | 'Partial' | 'Blocked' | 'Not Generated';
  statusNote: string;
  configId: string;
  triggeredBy: string;
  userEmail: string;
  sessionId: string;
  manifest: Manifest;
  chunks: ChunkLog[];
  events: TimelineEvent[];
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; 
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

function deterministicStringify(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return `[${[...obj].map(deterministicStringify).join(',')}]`;
  }
  const keys = Object.keys(obj).sort();
  return `{${keys.map(k => `${JSON.stringify(k)}:${deterministicStringify(obj[k])}`).join(',')}}`;
}

function generateDeterminismAudit(
  inputData: any, 
  configData: any, 
  ariData: any, 
  outputData: any
): DeterminismAudit {
  const inputFingerprint = hashString(deterministicStringify(inputData));
  const configFingerprint = hashString(deterministicStringify(configData));
  const dataFingerprint = hashString(deterministicStringify(ariData));
  const executionFingerprint = hashString(deterministicStringify(outputData));

  // Key for local storage comparison
  const key = `det_audit_${inputFingerprint}_${configFingerprint}_${dataFingerprint}`;
  const lastFingerprint = localStorage.getItem(key);
  
  let isDeterministic = true;
  let notes = "Pass: Execution matches last recorded run for these identical parameters.";
  let mismatchDetails: string[] | null = null;
  
  if (lastFingerprint && lastFingerprint !== executionFingerprint) {
    isDeterministic = false;
    notes = "Mismatch detected in engine output for identical configuration.";
    mismatchDetails = [
      "Target execution fingerprint does not match reference",
      "Mismatch detected in: partitioning decisions, chargeblock counts, or chunk distribution."
    ];
  } else if (!lastFingerprint) {
    notes = "First recorded execution for this input set.";
  }

  // Update storage for next run
  localStorage.setItem(key, executionFingerprint);

  return {
    inputFingerprint,
    configFingerprint,
    dataFingerprint,
    executionFingerprint,
    isDeterministic,
    comparisonReference: lastFingerprint,
    mismatchDetails,
    notes
  };
}

function forecastHotel(
  product: ProductDefinition,
  hotel: Hotel,
  importedARI: Record<string, any>
): { 
  beforeChargeblocks: number; 
  afterChargeblocks: number; 
  isCompressed: boolean; 
  isTrimmed: boolean;
  roomsWithNoSeasons: number;
  inputMetrics: any;
  model: any;
} {
  const model = generateEDFModelForHotel(hotel, product, importedARI, 0, PackagingStrategy.BALANCED);
  const inputMetrics = getInputComplexityMetrics(hotel, importedARI);
  
  if (!model) return { beforeChargeblocks: 0, afterChargeblocks: 0, isCompressed: false, isTrimmed: false, roomsWithNoSeasons: 0, inputMetrics, model: null };

  const totalCB = model.processedRooms.reduce((acc, r) => acc + (r.roomChargeblocks || 0), 0);
  const roomsWithNoSeasons = model.processedRooms.filter((r: any) => (r.seasons || []).length === 0).length;
  const totalDecisions = Object.values(model.decisions);
  const applied = totalDecisions.some(d => d.actionTaken !== 'NONE');
  const forced = totalDecisions.some(d => d.actionTaken.includes('Forced') || d.actionTaken.includes('Reduced'));

  return {
    beforeChargeblocks: totalCB, 
    afterChargeblocks: totalCB,
    isCompressed: applied,
    isTrimmed: forced,
    roomsWithNoSeasons,
    inputMetrics,
    model: model
  };
}

function forecastAllHotels(
  product: ProductDefinition,
  hotels: Hotel[],
  importedARI: Record<string, any>
): Record<string, number> {
  const result: Record<string, number> = {};
  hotels.forEach(h => {
    result[h.id] = forecastHotel(product, h, importedARI).afterChargeblocks;
  });
  return result;
}

const forecastChargeblocks = (
  hotelId: string,
  product: ProductDefinition,
  importedARI: Record<string, any>,
  inScopeHotels: Hotel[]
): number => {
  const hotel = inScopeHotels.find(h => h.id === hotelId);
  if (!hotel) return 0;
  return forecastHotel(product, hotel, importedARI).afterChargeblocks;
};

const getTargetSeasons = (complexity: 'SIMPLE' | 'MEDIUM' | 'COMPLEX'): { min: number; max: number } => {
  switch (complexity) {
    case 'SIMPLE': return { min: 15, max: 30 };
    case 'MEDIUM': return { min: 15, max: 35 };
    case 'COMPLEX': return { min: 20, max: 40 };
    default: return { min: 15, max: 35 };
  }
};

const INFRA_CHUNK_THRESHOLD = 5000; 

const generateEDFXML = (hotel: Hotel, roomsData: { roomCode: string; seasons: Season[] }[], state: PackagingState): string => {
  const { id: giataId, status: giataStatus } = resolveGiata(hotel.giataId, hotel.hgId);
  const now = new Date().toISOString().split('T')[0];
  
  // 1. Identify all unique date ranges (Seasons) across all rooms
  const seasonRanges: { start: string; end: string; id: string }[] = [];
  const rangeToId = new Map<string, string>();
  
  roomsData.forEach(({ seasons }) => {
    seasons.forEach(s => {
      const key = `${s.startDate}|${s.endDate}`;
      if (!rangeToId.has(key)) {
        const sid = `S${seasonRanges.length + 1}`;
        rangeToId.set(key, sid);
        seasonRanges.push({ start: s.startDate, end: s.endDate, id: sid });
      }
    });
  });

  // 2. Identify all unique boards (Meal Plans) across all rooms
  const usedBoards = new Set<string>();
  roomsData.forEach(({ seasons }) => {
    seasons.forEach(s => {
      Object.keys(s.chargeblocks).forEach(occKey => {
        const [mealPlan] = occKey.split('|');
        usedBoards.add(mealPlan);
      });
    });
  });

  const boardDescriptions: Record<string, string> = {
    'RO': 'Room Only',
    'BB': 'Bed and Breakfast',
    'HB': 'Half Board',
    'FB': 'Full Board',
    'AI': 'All Inclusive'
  };

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<HotelRoot xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="EDF_Hotel.xsd">\n`;

  // ========= 1. BASIC DATA =========
  xml += `    <BasicData>\n`;
  xml += `        <HotelKey>HG-${hotel.hgId}</HotelKey>\n`;
  xml += `        <Name>${hotel.name.replace(/&/g, '&amp;')}</Name>\n`;
  xml += `        <Country>${hotel.country || 'XX'}</Country>\n`;
  xml += `        <City>${hotel.city || 'Unknown'}</City>\n`;
  xml += `        <AddressLine1>${hotel.destination || 'Hotel Address'}</AddressLine1>\n`;
  xml += `        <ZipCode>00000</ZipCode>\n`;
  xml += `        <Latitude>0.0000</Latitude>\n`;
  xml += `        <Longitude>0.0000</Longitude>\n`;

  xml += `        <ArrivalAirports>\n`;
  if (hotel.resolvedIata) {
    xml += `            <Airport>${hotel.resolvedIata}</Airport>\n`;
  } else if (state.productDefinition.airports.length > 0) {
    state.productDefinition.airports.slice(0, 3).forEach(code => {
      xml += `            <Airport>${code}</Airport>\n`;
    });
  } else {
    xml += `            <Airport>ZZZ</Airport>\n`;
  }
  xml += `        </ArrivalAirports>\n`;

  xml += `        <DepartureAirports>\n`;
  if (state.productDefinition.airports.length > 0) {
    state.productDefinition.airports.slice(0, 3).forEach(code => {
      xml += `            <Airport>${code}</Airport>\n`;
    });
  }
  xml += `        </DepartureAirports>\n`;

  xml += `        <Category>${hotel.starRating || 4}</Category>\n`;
  xml += `        <Currency>EUR</Currency>\n`;
  xml += `    </BasicData>\n`;

  // ========= 2. SELLING DATA =========
  xml += `    <SellingData>\n`;

  // 2.1 Season Definitions
  xml += `        <SeasonDefinitions>\n`;
  seasonRanges.forEach(sr => {
    xml += `            <SeasonDefinition SeasonID="${sr.id}">\n`;
    xml += `                <Name>Season ${sr.id}</Name>\n`;
    xml += `                <StartDate>${sr.start}</StartDate>\n`;
    xml += `                <EndDate>${sr.end}</EndDate>\n`;
    xml += `            </SeasonDefinition>\n`;
  });
  xml += `        </SeasonDefinitions>\n`;

  // 2.2 Boards
  xml += `        <Boards>\n`;
  Array.from(usedBoards).sort().forEach(bc => {
    xml += `            <Board BoardCode="${bc}">\n`;
    xml += `                <Description>${boardDescriptions[bc] || bc}</Description>\n`;
    xml += `            </Board>\n`;
  });
  xml += `        </Boards>\n`;

  // 2.3 Rooms
  xml += `        <Rooms>\n`;
  roomsData.forEach(({ roomCode, seasons }, rIdx) => {
    if (seasons.length === 0) return;
    const roomId = `R${rIdx + 1}`;
    
    xml += `            <Room RoomID="${roomId}">\n`;
    xml += `                <RoomName>${roomCode.replace(/&/g, '&amp;')}</RoomName>\n`;
    
    // Attempt to derive capacities from used occupancies
    let maxAdults = 2, maxChildren = 0;
    const roomOccMap = new Map<string, { id: string; min: number; max: number; ageFrom: number; ageTo: number }>();
    
    seasons.forEach(s => {
      Object.keys(s.chargeblocks).forEach(occKey => {
        const [_, occCode] = occKey.split('|');
        if (!roomOccMap.has(occCode)) {
          // Find the actual occupancy object from product definition if possible
          const occDef = state.productDefinition.occupancies.find(o => mapOccupancyToARICode(o) === occCode);
          if (occDef) {
            const occId = `${roomId}_OCC${roomOccMap.size + 1}`;
            roomOccMap.set(occCode, {
              id: occId,
              min: occDef.adults,
              max: occDef.adults + occDef.children,
              ageFrom: occDef.ageFrom,
              ageTo: occDef.ageTo
            });
            maxAdults = Math.max(maxAdults, occDef.adults);
            maxChildren = Math.max(maxChildren, occDef.children);
          } else {
             // Fallback for unknown occupancy codes
             const occId = `${roomId}_OCC${roomOccMap.size + 1}`;
             roomOccMap.set(occCode, { id: occId, min: 2, max: 2, ageFrom: 0, ageTo: 99 });
          }
        }
      });
    });

    xml += `                <MaxAdults>${maxAdults}</MaxAdults>\n`;
    xml += `                <MaxChildren>${maxChildren}</MaxChildren>\n`;

    xml += `                <Occupancies>\n`;
    roomOccMap.forEach(o => {
      xml += `                    <Occupancy OccID="${o.id}">\n`;
      xml += `                        <MinPax>${o.min}</MinPax>\n`;
      xml += `                        <MaxPax>${o.max}</MaxPax>\n`;
      xml += `                        <AgeFrom>${o.ageFrom}</AgeFrom>\n`;
      xml += `                        <AgeTo>${o.ageTo}</AgeTo>\n`;
      xml += `                    </Occupancy>\n`;
    });
    xml += `                </Occupancies>\n`;

    xml += `                <ChargeBlocks>\n`;
    seasons.forEach((s, sIdx) => {
      const cbId = `${roomId}_CB${sIdx + 1}`;
      const seasonId = rangeToId.get(`${s.startDate}|${s.endDate}`) || 'S1';
      
      xml += `                    <ChargeBlock ChargeBlockID="${cbId}">\n`;
      xml += `                        <ValidFrom>${s.startDate}</ValidFrom>\n`;
      xml += `                        <ValidTo>${s.endDate}</ValidTo>\n`;
      xml += `                        <Sections>\n`;
      xml += `                            <Section SectionID="${cbId}_SEC1">\n`;
      xml += `                                <BaseCharges>\n`;
      
      Object.entries(s.chargeblocks).forEach(([occKey, durations]) => {
        const [mealPlan, occCode] = occKey.split('|');
        const occInfo = roomOccMap.get(occCode);
        if (!occInfo) return;

        // EDF BaseCharge usually represents a single duration or Night price.
        // We output each duration as a separate BaseCharge if we want to preserve detail,
        // but strict EDF usually wants one primary. 
        // For compatibility with our multi-duration app, we'll output each duration.
        Object.entries(durations as any).forEach(([dur, price]) => {
          xml += `                                    <BaseCharge SeasonID="${seasonId}" BoardCode="${mealPlan}" OccID="${occInfo.id}">\n`;
          xml += `                                        <Price duration="${dur}">${(price as number).toFixed(2)}</Price>\n`;
          xml += `                                        <Currency>EUR</Currency>\n`;
          xml += `                                        <ChargeType>PerRoomPerNight</ChargeType>\n`;
          xml += `                                    </BaseCharge>\n`;
        });
      });
      
      xml += `                                </BaseCharges>\n`;
      xml += `                            </Section>\n`;
      xml += `                        </Sections>\n`;
      xml += `                    </ChargeBlock>\n`;
    });
    xml += `                </ChargeBlocks>\n`;

    xml += `                <Restrictions>\n`;
    seasons.forEach(s => {
      const seasonId = rangeToId.get(`${s.startDate}|${s.endDate}`) || 'S1';
      xml += `                    <Restriction>\n`;
      xml += `                        <SeasonID>${seasonId}</SeasonID>\n`;
      xml += `                        <MinStay>${s.minLOS > 0 ? s.minLOS : 1}</MinStay>\n`;
      xml += `                        <MaxStay>${s.maxLOS > 0 ? s.maxLOS : 99}</MaxStay>\n`;
      xml += `                        <ClosedToArrival>${s.cta || false}</ClosedToArrival>\n`;
      xml += `                        <ClosedToDeparture>${s.ctd || false}</ClosedToDeparture>\n`;
      if (s.stopSell) xml += `                        <StopSell>true</StopSell>\n`;
      xml += `                    </Restriction>\n`;
    });
    xml += `                </Restrictions>\n`;

    xml += `            </Room>\n`;
  });
  xml += `        </Rooms>\n`;

  xml += `    </SellingData>\n`;
  xml += `</HotelRoot>\n`;
  
  return xml;
};

const MultiSelect = ({ 
  label, 
  options, 
  selected, 
  onChange, 
  placeholder,
  disabled 
}: { 
  label: string; 
  options: { label: string; value: any }[]; 
  selected: any[]; 
  onChange: (vals: any[]) => void; 
  placeholder: string;
  disabled?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (val: any) => {
    if (disabled) return;
    if (selected.includes(val)) {
      onChange(selected.filter(v => v !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`space-y-1.5 transition-opacity duration-300 ${disabled ? 'opacity-50 pointer-events-none grayscale-[0.3]' : ''}`} ref={containerRef}>
      <label className="text-[11px] font-bold text-hg-muted uppercase tracking-wider">{label}</label>
      <div className="relative">
        <div 
          onClick={() => {
            if (disabled) return;
            setIsOpen(!isOpen);
            if (!isOpen) setSearchTerm('');
          }}
          className={`hg-input min-h-[38px] flex flex-wrap gap-1 items-center py-1.5 transition-colors ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${isOpen ? 'border-hg-accent shadow-[0_0_0_1px_rgba(34,197,94,0.2)]' : ''}`}
        >
          {selected.length === 0 ? (
            <span className="text-hg-muted font-normal">{placeholder}</span>
          ) : (
            selected.map((val, idx) => (
              <span key={stableKey("ms-selected", label, val, idx)} className="bg-hg-accent/10 border border-hg-accent/20 text-hg-accent text-[11px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                {options.find(o => o.value === val)?.label || val}
                <X 
                  size={10} 
                  className="hover:text-hg-text cursor-pointer" 
                  onClick={(e) => { e.stopPropagation(); toggleOption(val); }} 
                />
              </span>
            ))
          )}
          <div className="ml-auto flex items-center gap-2 px-1">
             {selected.length > 0 && (
               <X 
                 size={12} 
                 className="text-hg-muted hover:text-hg-text" 
                 onClick={(e) => { e.stopPropagation(); onChange([]); }} 
               />
             )}
             <ChevronDown size={14} className={`text-hg-muted shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
        
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute top-full left-0 right-0 mt-1 bg-hg-panel border border-hg-border rounded-[6px] shadow-2xl z-[60] flex flex-col shadow-black/50 overflow-hidden"
            >
              <div className="p-2 border-b border-hg-divider bg-black/20">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-hg-muted/40" size={12} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search options..."
                    className="w-full bg-hg-input border border-hg-border rounded-[4px] pl-8 pr-2 py-1.5 text-[12px] text-hg-text focus:outline-none focus:border-hg-accent/50 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                </div>
              </div>
              <div className="p-1 max-h-[200px] overflow-auto no-scrollbar">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((opt, idx) => (
                    <label 
                      key={stableKey("ms-opt", label, opt.value, idx)}
                      className={`flex items-center gap-2 px-3 py-2 hover:bg-white/5 cursor-pointer rounded-[4px] transition-colors ${selected.includes(opt.value) ? 'bg-hg-accent/5' : ''}`}
                    >
                      <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center transition-colors ${selected.includes(opt.value) ? 'bg-hg-accent border-hg-accent' : 'border-hg-border hover:border-hg-muted'}`}>
                        {selected.includes(opt.value) && <CheckCircle2 size={10} className="text-hg-bg" />}
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={selected.includes(opt.value)}
                        onChange={() => toggleOption(opt.value)}
                      />
                      <span className={`text-[13px] transition-colors ${selected.includes(opt.value) ? 'text-hg-accent font-bold' : 'text-hg-text font-medium'}`}>
                        {opt.label}
                      </span>
                    </label>
                  ))
                ) : (
                  <div className="p-4 text-center text-hg-muted italic text-[12px]">
                    No options matching "{searchTerm}"
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const EXECUTION_MODE_TOOLTIPS: Record<ExecutionMode, string> = {
  [ExecutionMode.REGRESSION]: "Runs deterministic test scenarios using controlled ARI patterns for validation",
  [ExecutionMode.STRESS]: "Simulates high-volume ARI combinations to test performance and scaling limits",
  [ExecutionMode.PRODUCTION]: "Uses production-grade logic for EDF generation with full validation rules"
};

const PACKAGING_STRATEGY_TOOLTIPS: Record<PackagingStrategy, string> = {
  [PackagingStrategy.MINIMIZED]: "Generates minimal viable combinations for lightweight export",
  [PackagingStrategy.BALANCED]: "Optimized balance between coverage and performance (recommended)",
  [PackagingStrategy.MAXIMIZED]: "Generates full combination coverage for maximum distribution reach"
};

const Navbar = ({ 
  onSave, 
  onExport, 
  onMenuClick, 
  executionMode,
  setExecutionMode,
  packagingStrategy,
  setPackagingStrategy,
  activeTab,
  setActiveTab,
  windowSize,
  product,
  selectedHotels,
  metrics,
  isSidebarOpen
}: { 
  onSave: () => void; 
  onExport: () => void;
  onMenuClick: () => void; 
  executionMode: ExecutionMode; 
  setExecutionMode: (m: ExecutionMode) => void;
  packagingStrategy: PackagingStrategy;
  setPackagingStrategy: (s: PackagingStrategy) => void;
  activeTab: 'product' | 'packaging' | 'review';
  setActiveTab: (t: 'product' | 'packaging' | 'review') => void;
  windowSize: { width: number; height: number };
  product: ProductDefinition;
  selectedHotels: string[];
  metrics: any;
  isSidebarOpen: boolean;
}) => {
  const tabs = [
    { id: 'product', label: 'Product' },
    { id: 'packaging', label: 'Rules' },
    { id: 'review', label: 'Review' }
  ];

  return (
    <nav className="h-[56px] bg-hg-nav/95 backdrop-blur-md border-b border-hg-border flex items-center px-4 overflow-hidden shadow-2xl max-w-full">
      <div className="flex items-center gap-4 lg:gap-6 flex-1 min-w-0 h-full overflow-hidden">
        <button 
          onClick={onMenuClick}
          className="p-1.5 text-hg-muted hover:text-hg-text transition-colors hover:bg-white/5 rounded-md flex-shrink-0"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        
        <div className="flex items-center gap-2 flex-shrink-0 mr-2 lg:mr-4">
          <div className="w-8 h-8 bg-hg-accent rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-hg-accent/20">
            <HotelIcon size={16} className="text-hg-bg" />
          </div>
          <span className="text-[14px] font-black text-white tracking-tighter hidden sm:block truncate uppercase leading-none max-w-[120px] lg:max-w-none">
            HyperGuest <span className="text-hg-accent">EDF</span>
          </span>
        </div>

        <div className="h-8 w-px bg-hg-border mx-1 lg:mx-2 hidden xl:block flex-shrink-0" />

        <div className="hidden xl:flex items-center gap-6 px-4 py-1.5 bg-black/20 border border-white/5 rounded-xl ml-4 flex-shrink-0">
           <div className="flex flex-col">
              <span className="text-[8px] font-black text-hg-muted uppercase tracking-widest">Destinations</span>
              <span className="text-[12px] font-black text-white leading-none">{product.destinations.length}</span>
           </div>
           <div className="flex flex-col">
              <span className="text-[8px] font-black text-hg-muted uppercase tracking-widest">Hotels</span>
              <span className="text-[12px] font-black text-white leading-none">{selectedHotels.length}</span>
           </div>
           <div className="flex flex-col">
              <span className="text-[8px] font-black text-hg-muted uppercase tracking-widest leading-none">Pricing Nodes</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                 <div className={`w-1.5 h-1.5 rounded-full ${metrics.valid > 0 ? 'bg-hg-accent shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500 animate-pulse'}`} />
                 <span className={`text-[12px] font-black leading-none tabular-nums ${metrics.valid > 0 ? 'text-hg-accent' : 'text-red-500'}`}>{formatNumber(metrics.valid)}</span>
              </div>
           </div>
        </div>

        <div className="h-8 w-px bg-hg-border mx-1 lg:mx-2 hidden xl:block flex-shrink-0" />

        {/* Primary Flow Navigation - LEFT */}
        <div className={`${windowSize.width >= 768 ? 'flex' : 'hidden'} items-stretch h-full flex-shrink-0 ml-1 lg:ml-2 overflow-x-auto no-scrollbar`}>
          {tabs.map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 lg:px-6 flex items-center text-[12px] lg:text-[14px] font-black uppercase tracking-[0.1em] lg:tracking-[0.2em] transition-all relative whitespace-nowrap group ${
                activeTab === tab.id 
                  ? 'text-white' 
                  : 'text-hg-muted hover:text-white'
              }`}
            >
              <span className="truncate">{tab.label}</span>
              {activeTab === tab.id ? (
                <motion.div 
                   layoutId="navUnderline"
                   className="absolute bottom-0 left-2 lg:left-4 right-2 lg:right-4 h-0.5 bg-hg-accent shadow-[0_0_15px_rgba(var(--hg-accent-rgb),1)]"
                />
              ) : (
                <div className="absolute bottom-0 left-2 lg:left-4 right-2 lg:right-4 h-0.5 bg-white/0 group-hover:bg-white/10 transition-colors" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* System Controls - RIGHT */}
      <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0 ml-auto min-w-0">
        <div className="hidden lg:flex items-center gap-4 pr-2 lg:pr-4 border-r border-hg-border/50 min-w-0">
          <div className="flex flex-col gap-1 pr-2">
            <span className="text-[7px] font-black text-hg-muted uppercase tracking-[0.2em] leading-none text-right">Execution Mode</span>
            <div className="flex bg-neutral-900 p-0.5 rounded-lg border border-hg-border/50 flex-shrink-0">
              {Object.values(ExecutionMode).map((mode) => (
                <Tooltip key={stableKey("exec-mode-hp", mode)} text={EXECUTION_MODE_TOOLTIPS[mode]}>
                  <button
                    onClick={() => setExecutionMode(mode)}
                    className={`px-3 h-7 rounded-md text-[9px] font-black transition-all uppercase tracking-widest ${
                      executionMode === mode 
                        ? 'bg-hg-accent text-hg-bg shadow-[0_0_10px_rgba(var(--hg-accent-rgb),0.3)]'
                        : 'text-hg-muted hover:text-hg-text'
                    }`}
                  >
                    {mode}
                  </button>
                </Tooltip>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[7px] font-black text-hg-muted uppercase tracking-[0.2em] leading-none text-right">Packaging Strategy</span>
            <div className="flex bg-neutral-900/80 p-0.5 rounded-lg border border-hg-border/50 flex-shrink-0">
              {Object.values(PackagingStrategy).map((strat) => (
                <Tooltip key={stableKey("pack-strat-hp", strat)} text={PACKAGING_STRATEGY_TOOLTIPS[strat]}>
                  <button
                    onClick={() => setPackagingStrategy(strat)}
                    className={`px-3 h-7 rounded-md text-[9px] font-black transition-all uppercase tracking-widest whitespace-nowrap ${
                      packagingStrategy === strat 
                        ? 'bg-hg-accent text-hg-bg shadow-[0_0_15px_rgba(var(--hg-accent-rgb),0.3)]'
                        : 'text-hg-muted hover:text-hg-text hover:bg-white/5'
                    }`}
                  >
                    {strat.toLowerCase() === 'minimized' ? 'Minimized' : strat.toLowerCase() === 'balanced' ? 'Balanced' : 'Maximized'}
                  </button>
                </Tooltip>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={onSave}
            className="h-9 px-4 flex items-center gap-2 text-[11px] font-black text-hg-muted hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 uppercase tracking-widest"
          >
            <Save size={14} /> <span className="hidden sm:inline">SAVE</span>
          </button>

          <button 
            onClick={onExport}
            className="bg-hg-accent text-hg-bg h-9 px-6 rounded-lg text-[11px] font-black uppercase tracking-[0.2em] hover:brightness-110 transition-all shadow-xl shadow-hg-accent/20 flex items-center gap-2 active:scale-95"
          >
            <Download size={14} className="flex-shrink-0" /> <span className="truncate">EXPORT</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

const MobileStepNav = ({ 
  activeStep, 
  onStepChange,
  isMobile
}: { 
  activeStep: MobileStep; 
  onStepChange: (step: MobileStep) => void;
  isMobile: boolean;
}) => {
  if (!isMobile) return null;

  const steps: { id: MobileStep; label: string; icon: any }[] = [
    { id: 'destinations', label: 'Dest', icon: Globe },
    { id: 'hotels', label: 'Hotels', icon: HotelIcon },
    { id: 'rules', label: 'Rules', icon: Settings },
    { id: 'preview', label: 'Preview', icon: Eye },
    { id: 'logs', label: 'Logs', icon: History },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-hg-nav border-t border-hg-border md:hidden safe-bottom">
      <div className="flex items-center justify-around h-14 px-2">
        {steps.map((step) => (
          <button
            key={stableKey("mobile-step", step.id)}
            onClick={() => onStepChange(step.id)}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
              activeStep === step.id ? 'text-hg-accent' : 'text-hg-muted'
            }`}
          >
            <step.icon size={18} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{step.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const MobileHotelCard = React.memo(({ 
  hotel, 
  isSelected, 
  onToggle, 
  hotelData,
  hasARI
}: { 
  hotel: any; 
  isSelected: boolean; 
  onToggle: () => void; 
  hotelData: any; 
  hasARI: boolean; 
}) => {
  return (
    <div 
      onClick={onToggle}
      className={`p-4 rounded-lg border transition-all ${
        isSelected 
          ? 'bg-hg-accent/5 border-hg-accent' 
          : 'bg-hg-panel border-hg-border'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono text-hg-muted bg-white/5 px-1.5 py-0.5 rounded uppercase">{hotel.hgId}</span>
            <div className="flex items-center gap-0.5">
              {(() => {
                const count = hotel.starRating || 0;
                const starItems = Array.from({ length: count });
                const keys = starItems.map((_, i) => stableKey("star", getExecutionUnitKey(hotel), i));
                logKeyDuplication("MobileHotelCard (Stars)", keys, starItems);
                return starItems.map((_, i) => (
                  <Star key={keys[i]} size={8} className="text-hg-warning fill-hg-warning" />
                ));
              })()}
            </div>
          </div>
          <h3 className="text-[13px] font-bold text-hg-text truncate leading-tight mb-0.5">{hotel.name}</h3>
          <p className="text-[11px] text-hg-muted truncate">{hotel.city}, {hotel.country}</p>
        </div>
        <div className={`w-5 h-5 rounded-[4px] border flex items-center justify-center transition-colors shrink-0 ${
          isSelected ? 'bg-hg-accent border-hg-accent text-hg-bg' : 'bg-hg-input border-hg-border'
        }`}>
          {isSelected && <Check size={12} strokeWidth={4} />}
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-between border-t border-hg-divider/50 pt-3">
        <div className="flex flex-col">
          <span className="text-[9px] uppercase font-bold text-hg-muted tracking-wider">ARI Status</span>
          <span className={`text-[11px] font-bold ${hasARI ? 'text-hg-accent' : 'text-red-400'}`}>
            {hasARI ? 'SYNCED' : 'MISSING'}
          </span>
        </div>
          <div className="flex flex-col items-end">
          <span className="text-[9px] uppercase font-bold text-hg-muted tracking-wider">Peakwork Compliance</span>
          <div className="flex items-center gap-2">
            {hotelData.model?.processedRooms?.some((r: any) => r.roomChargeblocks > 31) ? (
              <span className="text-[11px] font-bold text-red-500 uppercase flex items-center gap-1">
                <AlertTriangle size={10} /> EXCEEDED
              </span>
            ) : (
              <span className="text-[11px] font-bold text-hg-accent uppercase flex items-center gap-1">
                <Check size={10} /> SAFE
              </span>
            )}
            <span className="text-[11px] font-mono font-bold text-hg-text">
              {Math.max(...(hotelData.model?.processedRooms?.map((r: any) => r.roomChargeblocks) || [0]))} <span className="text-hg-muted font-normal">CB</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

const ExportReportModal = ({ report, onClose }: { report: ExportReport, onClose: () => void }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);


  const downloadPDF = async () => {
    if (!reportRef.current) return;
    setIsGeneratingPDF(true);
    
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#07090c', 
        logging: false,
        onclone: (clonedDoc) => {
          const elements = clonedDoc.getElementsByTagName('*');
          // Expanded list of properties that might contain colors
          const colorProps = [
            'color', 'background-color', 'background-image', 'border-color', 
            'fill', 'stroke', 'stop-color', 'outline-color', 'box-shadow', 'background'
          ];
          
          for (let i = 0; i < elements.length; i++) {
            const el = elements[i] as HTMLElement;
            // Use the cloned doc's view if possible for style resolution
            const style = el.ownerDocument?.defaultView?.getComputedStyle(el) || window.getComputedStyle(el);
            
            colorProps.forEach(prop => {
              const val = style.getPropertyValue(prop);
              if (val && (val.includes('oklab') || val.includes('oklch') || val.includes('color-mix'))) {
                let hex = '#9aa4af'; // Default fallback
                const cn = (el.getAttribute('class') || '').toLowerCase();
                
                // Color Mapping
                if (cn.includes('accent')) hex = '#56c271';
                else if (cn.includes('success')) hex = '#56c271';
                else if (cn.includes('warning')) hex = '#e7b34c';
                else if (cn.includes('danger') || cn.includes('red-')) hex = '#d96b6b';
                else if (cn.includes('bg-hg-bg') || cn.includes('bg-hg-nav')) hex = '#07090c';
                else if (cn.includes('text-hg-text')) hex = '#ffffff';
                else if (cn.includes('text-hg-muted')) hex = '#9aa4af';
                else if (cn.includes('border-')) hex = '#1a1d23';

                // Specific property handling
                if (prop === 'box-shadow') {
                  el.style.boxShadow = 'none';
                } else if (prop === 'background-image' || prop === 'background') {
                  // If it's a gradient with oklab, just replace with solid background color
                  el.style.backgroundImage = 'none';
                  el.style.backgroundColor = hex;
                } else {
                  el.style.setProperty(prop, hex, 'important');
                }
              }
            });
          }
          ['pdf-close-button', 'pdf-export-button'].forEach(id => {
            const el = clonedDoc.getElementById(id);
            if (el) el.style.display = 'none';
          });
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`HG_EDF_Validation_${report.executionMode}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-hg-nav border border-hg-border w-full max-w-4xl max-h-[80vh] flex flex-col rounded-xl overflow-hidden shadow-2xl"
      >
        <div className="p-4 border-b border-hg-border flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${report.executionMode === ExecutionMode.PRODUCTION ? 'bg-hg-accent/20 text-hg-accent' : 'bg-hg-warning/20 text-hg-warning'}`}>
              <FileCheck size={20} />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-hg-text">EDF Export Validation Report</h3>
              <p className="text-[11px] text-hg-muted font-mono uppercase tracking-widest">{report.executionMode} MODE · {new Date(report.timestamp).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              id="pdf-export-button"
              onClick={downloadPDF}
              disabled={isGeneratingPDF}
              className="px-3 h-8 bg-white/5 hover:bg-white/10 rounded-[4px] border border-hg-border transition-colors text-hg-text text-[11px] font-bold flex items-center gap-2"
            >
              {isGeneratingPDF ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
              EXPORT PDF
            </button>
            <button 
              id="pdf-close-button"
              onClick={onClose} 
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-hg-muted hover:text-hg-text"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div ref={reportRef} className="flex-1 overflow-auto p-4 lg:p-8 no-scrollbar bg-hg-nav">
          {(() => {
            const hotels = report.hotels || [];
            const totalRooms = hotels.reduce((acc: number, h) => acc + (h.roomCount || 0), 0);
            const nonCompliantRooms = hotels.reduce((acc: number, h) => acc + (h.constraintCompliance?.roomsExceedingLimit || 0), 0);
            const totalAutoCorrectedRooms = hotels.reduce((acc: number, h) => acc + (h.constraintCompliance?.roomsAutoCorrected || 0), 0);
            const totalRoomsWithPriceViolations = hotels.reduce((acc: number, h) => acc + (h.constraintCompliance?.priceViolationRooms || 0), 0);
            const totalInputCB = hotels.reduce((acc: number, h) => acc + (Number(h.inputMetrics?.chargeblocks) || 0), 0);
            const totalPrices = hotels.reduce((acc: number, h) => {
              const rooms = h.processedRooms || [];
              const hotelRoomsTotal = Number(rooms.reduce((rAcc: number, r: any) => {
                return rAcc + Number((r.seasons || []).reduce((sAcc: number, s: any) => {
                  return sAcc + Number(Object.values(s.chargeblocks || {}).reduce((cAcc: number, c: any) => cAcc + Object.keys(c || {}).length, 0));
                }, 0));
              }, 0));
              return acc + hotelRoomsTotal;
            }, 0);
            
            const priceViolations = hotels.some(h => h.constraintCompliance?.hotelPriceLimitExceeded);
            const seasonViolations = hotels.some(h => h.constraintCompliance?.seasonLimitExceeded);
            const autoCorrectedHotels = hotels.filter(h => h.postProcessingApplied).length;

            return (
              <div className="space-y-12">
                {/* 1. EXECUTION OVERVIEW */}
                <section>
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-hg-divider">
                    <h3 className="text-[14px] font-black text-hg-text uppercase tracking-[0.2em]">1. Execution Overview</h3>
                    <div className="flex items-center gap-4 text-[10px] font-mono text-hg-muted uppercase">
                      <span>Run ID: {`EXP_${new Date(report.timestamp).getTime().toString(36).toUpperCase()}`}</span>
                      <span>{new Date(report.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-hg-muted uppercase tracking-wider">Hotels Processed</span>
                      <div className="text-xl font-mono font-bold text-hg-text">{report.inventorySummary?.uniqueHotelsGenerated}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-hg-muted uppercase tracking-wider">Rooms Processed</span>
                      <div className="text-xl font-mono font-bold text-hg-text">{totalRooms}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-hg-muted uppercase tracking-wider">Strategy</span>
                      <div className="text-xl font-bold text-hg-accent truncate">{report.execution?.selectedPackagingStrategy?.replace('_', ' ') || 'BALANCED'}</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-hg-muted uppercase tracking-wider">Files Generated</span>
                      <div className="text-xl font-mono font-bold text-hg-text">{report.inventorySummary?.filesGenerated}</div>
                    </div>
                  </div>
                  
                  {report.partitioningApplied && (
                    <div className="mt-4 p-3 bg-hg-accent/5 border border-hg-accent/20 rounded flex items-center gap-3">
                      <Zap size={14} className="text-hg-accent" />
                      <div>
                        <p className="text-[11px] font-bold text-hg-accent uppercase">Dynamic Partitioning Active</p>
                        <p className="text-[10px] text-hg-muted">One or more hotels exceeded the 65,536 price limit and were split into sub-files for compliance.</p>
                      </div>
                    </div>
                  )}
                </section>

                {/* 2. CONSTRAINT COMPLIANCE SUMMARY */}
                <section>
                  <h3 className="text-[14px] font-black text-hg-text uppercase tracking-[0.2em] mb-6 pb-2 border-b border-hg-divider">2. Constraint Compliance</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Room Level */}
                    <div className="bg-hg-panel border border-hg-border rounded-xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-white uppercase tracking-widest">Room Constraints</span>
                        {nonCompliantRooms === 0 ? <CheckCircle2 className="text-hg-accent" size={18} /> : <AlertTriangle className="text-red-500" size={18} />}
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-[12px]">
                          <span className="text-hg-muted font-medium">Safe (&le;31 CB)</span>
                          <span className="font-mono font-bold text-hg-accent">{totalRooms - totalAutoCorrectedRooms - nonCompliantRooms}</span>
                        </div>
                        <div className="flex justify-between items-center text-[12px]">
                          <span className="text-hg-muted font-medium">Auto-Corrected via Merge</span>
                          <span className="font-mono font-bold text-hg-warning">{totalAutoCorrectedRooms}</span>
                        </div>
                        <div className="flex justify-between items-center text-[12px]">
                          <span className="text-hg-muted font-medium">Exceeding Limit</span>
                          <span className={`font-mono font-bold ${nonCompliantRooms > 0 ? 'text-red-500 underline' : 'text-hg-muted opacity-40'}`}>{nonCompliantRooms}</span>
                        </div>
                        <div className="pt-2 border-t border-hg-divider flex justify-between items-center">
                          <span className="text-[9px] font-black text-hg-muted uppercase">Global Status</span>
                          <span className={`text-[10px] font-black uppercase ${nonCompliantRooms === 0 ? 'text-hg-accent' : 'text-red-500'}`}>
                            {nonCompliantRooms === 0 ? 'Fully Compliant' : 'Requires Attention'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Structural Level */}
                    <div className="bg-hg-panel border border-hg-border rounded-xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-white uppercase tracking-widest">Structural Limits</span>
                        {(!priceViolations && !seasonViolations && totalRoomsWithPriceViolations === 0) ? <CheckCircle2 className="text-hg-accent" size={18} /> : <AlertTriangle className="text-hg-warning" size={18} />}
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-[12px]">
                          <span className="text-hg-muted font-medium">Price Violations (Room)</span>
                          <span className={`font-mono font-bold ${totalRoomsWithPriceViolations > 0 ? 'text-hg-warning decoration-dotted underline' : 'text-hg-accent'}`}>{totalRoomsWithPriceViolations}</span>
                        </div>
                        <div className="flex justify-between items-center text-[12px]">
                          <span className="text-hg-muted font-medium">Hotel Price Limit (65k)</span>
                          <span className={`font-mono font-bold ${priceViolations ? 'text-hg-warning' : 'text-hg-accent'}`}>{priceViolations ? 'PARTITIONED' : 'SAFE'}</span>
                        </div>
                        <div className="flex justify-between items-center text-[12px]">
                          <span className="text-hg-muted font-medium">Hotel Season Limit (255)</span>
                          <span className={`font-mono font-bold ${seasonViolations ? 'text-hg-warning' : 'text-hg-accent'}`}>{seasonViolations ? 'MERGED' : 'SAFE'}</span>
                        </div>
                        <div className="pt-2 border-t border-hg-divider flex justify-between items-center">
                          <span className="text-[9px] font-black text-hg-muted uppercase">System Strategy</span>
                          <span className="text-[10px] font-black uppercase text-hg-muted">Transparent Merge</span>
                        </div>
                      </div>
                    </div>

                    {/* Auto-Correction Level */}
                    <div className="bg-hg-panel border border-hg-border rounded-xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-white uppercase tracking-widest">Optimization Status</span>
                        <Zap className="text-hg-warning" size={18} />
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-[12px]">
                          <span className="text-hg-muted font-medium">Auto-Corrected Hotels</span>
                          <span className="font-mono font-bold text-hg-warning">{autoCorrectedHotels}</span>
                        </div>
                        <div className="flex justify-between items-center text-[12px]">
                          <span className="text-hg-muted font-medium">System Adjustments</span>
                          <span className="font-mono font-bold text-hg-text">Deterministic</span>
                        </div>
                        <div className="pt-2 border-t border-hg-divider flex justify-between items-center">
                          <span className="text-[9px] font-black text-hg-muted uppercase">Correction Logic</span>
                          <span className="text-[10px] font-black uppercase text-hg-accent">Safe-Fail Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 3. EXECUTION DECISIONS */}
                <section>
                  <h3 className="text-[14px] font-black text-hg-text uppercase tracking-[0.2em] mb-4 pb-2 border-b border-hg-divider">3. Execution Decisions</h3>
                  <div className="bg-white/5 border border-hg-border rounded-xl p-6 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-hg-accent/20 rounded-lg text-hg-accent">
                        <MessageSquare size={20} />
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="text-[14px] text-hg-text font-medium leading-relaxed italic">
                          "{report.execution?.reason}"
                        </p>
                        <ul className="text-[11px] text-hg-muted space-y-1.5 list-disc pl-5 opacity-70">
                          {nonCompliantRooms > 0 && <li>Detected {nonCompliantRooms} rooms exceeding 31 CB limit; applied deterministic merging to maintain compliance.</li>}
                          {report.partitioningApplied && <li>Hotel price threshold (65,536) breached; dynamic file partitioning applied to ensure successful Peakwork ingest.</li>}
                          {!report.partitioningApplied && <li>No hotel exceeded total price limits; full product density maintained in single file.</li>}
                          <li>Packaging Strategy ({report.execution?.selectedPackagingStrategy}) prioritizes {report.execution?.selectedPackagingStrategy === PackagingStrategy.MAXIMIZED ? 'granularity over file count' : report.execution?.selectedPackagingStrategy === PackagingStrategy.MINIMIZED ? 'consolidation over granularity' : 'a balance between density and granularity'}.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 4. HOTEL & ROOM BREAKDOWN */}
                <section>
                  <h3 className="text-[14px] font-black text-hg-text uppercase tracking-[0.2em] mb-6 pb-2 border-b border-hg-divider">4. Property & Room Breakdown</h3>
                  <div className="space-y-4">
                    {hotels.map((h, idx) => {
                      const rooms = h.processedRooms || [];
                      return (
                        <div key={stableKey("report-hotel", h.hotelId, idx)} className="bg-hg-panel border border-hg-border rounded-xl">
                          <Disclosure>
                            {({ open }) => (
                              <>
                                <DisclosureButton className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors text-left group">
                                  <div className="flex items-center gap-6">
                                    <div className="flex flex-col">
                                      <span className="text-[9px] font-black text-hg-muted uppercase tracking-widest mb-0.5">Hotel ID</span>
                                      <span className="text-[14px] font-bold text-hg-text">{h.hotelId}</span>
                                    </div>
                                    <div className="w-px h-8 bg-hg-divider" />
                                    <div className="flex flex-col">
                                      <span className="text-[9px] font-black text-hg-muted uppercase tracking-widest mb-0.5">Rooms</span>
                                      <span className="font-mono font-bold text-hg-text">{h.roomCount}</span>
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-[9px] font-black text-hg-muted uppercase tracking-widest mb-0.5">Total CB</span>
                                      <span className="font-mono font-bold text-hg-text">{h.chargeblockCount}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    {h.constraintCompliance?.roomsExceedingLimit > 0 ? (
                                      <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-[10px] font-bold rounded uppercase border border-red-500/20">Correction Active</span>
                                    ) : (
                                      <span className="px-2 py-0.5 bg-hg-accent/10 text-hg-accent text-[10px] font-bold rounded uppercase border border-hg-accent/20">Compliant</span>
                                    )}
                                    <ChevronRight className={`transition-transform duration-200 ${open ? 'rotate-90' : ''}`} size={18} />
                                  </div>
                                </DisclosureButton>
                                <DisclosurePanel className="px-4 pb-4 animate-in fade-in slide-in-from-top-1">
                                  <div className="bg-black/20 rounded-lg p-2 border border-hg-divider/50 mt-2">
                                    <table className="w-full text-left">
                                      <thead>
                                        <tr className="border-b border-hg-divider">
                                          <th className="px-4 py-2 text-[9px] font-black text-hg-muted uppercase tracking-widest">Room ID</th>
                                          <th className="px-4 py-2 text-[9px] font-black text-hg-muted uppercase tracking-widest">ChargeBlocks</th>
                                          <th className="px-4 py-2 text-[9px] font-black text-hg-muted uppercase tracking-widest">Status</th>
                                          <th className="px-4 py-2 text-[9px] font-black text-hg-muted uppercase tracking-widest">Auto-Correction</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {rooms.map((room: any, rIdx: number) => {
                                          const status = room.roomChargeblocks > 31 ? 'exceeded' : room.roomChargeblocks >= 28 ? 'warning' : 'safe';
                                          const action = room.roomChargeblocks > 31 ? 'Deterministic Merge' : room.roomChargeblocks >= 26 ? 'Density Optimized' : 'None';
                                          
                                          return (
                                            <tr key={stableKey("report-room", h.hotelId, room.roomCode, rIdx)} className="border-b border-hg-divider/30 last:border-0 hover:bg-white/5 transition-colors">
                                              <td className="px-4 py-3 font-mono text-[12px] text-hg-text font-bold">{room.roomCode}</td>
                                              <td className="px-4 py-3 font-mono text-[12px] text-hg-text">{room.roomChargeblocks} / 31</td>
                                              <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5">
                                                  <div className={`w-1.5 h-1.5 rounded-full ${status === 'exceeded' ? 'bg-red-500' : status === 'warning' ? 'bg-hg-warning' : 'bg-hg-accent'}`} />
                                                  <span className={`text-[10px] font-black uppercase ${status === 'exceeded' ? 'text-red-500' : status === 'warning' ? 'text-hg-warning' : 'text-hg-accent'}`}>
                                                    {status === 'exceeded' ? 'EXCEEDED' : status === 'warning' ? 'WARNING' : 'SAFE'}
                                                  </span>
                                                </div>
                                              </td>
                                              <td className="px-4 py-3 text-[10px] font-bold text-hg-muted lowercase tracking-tighter italic opacity-60">
                                                {action}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </DisclosurePanel>
                              </>
                            )}
                          </Disclosure>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* 5. TECHNICAL AUDIT */}
                <section className="pt-8 opacity-60 hover:opacity-100 transition-opacity">
                  <Disclosure>
                    {({ open }) => (
                      <>
                        <DisclosureButton className="flex items-center gap-2 text-hg-muted hover:text-hg-text transition-colors">
                          <Settings size={14} />
                          <span className="text-[11px] font-bold uppercase tracking-widest">5. Technical Audit Logs</span>
                          <ChevronRight className={`transition-transform duration-200 ${open ? 'rotate-90' : ''}`} size={14} />
                        </DisclosureButton>
                        <DisclosurePanel className="mt-6 space-y-6">
                          <div className="bg-black/40 border border-hg-border rounded-xl p-6 font-mono text-[10px] leading-relaxed text-hg-muted overflow-auto max-h-[400px]">
                            <p className="text-hg-accent font-bold mb-4 uppercase tracking-widest">// System Determinism Audit Block</p>
                            {(() => {
                              const outputCB = Number(report.inventorySummary?.totalChargeblocks) || 0;
                              const inputCB = Number(totalInputCB) || 1;
                              const ratio = `${((1 - outputCB / inputCB) * 100).toFixed(1)}%`;
                              return (
                                <pre className="p-4 bg-black/20 rounded-lg mb-6 border border-hg-divider/50">{JSON.stringify({
                                  runId: `EXP_${new Date(report.timestamp).getTime().toString(36).toUpperCase()}`,
                                  timestamp: report.timestamp,
                                  coreVersion: "2.4.0-stable",
                                  strategy: report.execution?.selectedPackagingStrategy,
                                  totalInputCB,
                                  totalOutputCB: outputCB,
                                  reductionRatio: ratio
                                }, null, 2)}</pre>
                              );
                            })()}
                            
                            <p className="text-hg-accent font-bold mt-8 mb-4 uppercase tracking-widest">// Data Integrity Fingerprints</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                              <div className="p-3 bg-black/20 border border-hg-divider/50 rounded-lg">
                                <span className="text-[9px] uppercase font-black text-hg-muted block mb-1">Input Hash</span>
                                <code className="text-hg-text break-all">{report.determinismAudit?.inputFingerprint || 'F_INP_77x021'}</code>
                              </div>
                              <div className="p-3 bg-black/20 border border-hg-divider/50 rounded-lg">
                                <span className="text-[9px] uppercase font-black text-hg-muted block mb-1">Config Hash</span>
                                <code className="text-hg-text break-all">{report.determinismAudit?.configFingerprint || 'C_CFG_09z442'}</code>
                              </div>
                              <div className="p-3 bg-black/20 border border-hg-divider/50 rounded-lg">
                                <span className="text-[9px] uppercase font-black text-hg-muted block mb-1">Execution Root</span>
                                <code className="text-hg-text break-all">{report.determinismAudit?.executionFingerprint || 'E_EXE_33q881'}</code>
                              </div>
                            </div>

                            <p className="text-hg-accent font-bold mt-8 mb-4 uppercase tracking-widest">// Compression Efficiency (Sample)</p>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                              {hotels.slice(0, 8).map((h, i) => (
                                <div key={stableKey("debug-cb", h.hotelId, i)} className="p-3 bg-black/20 border border-hg-divider/50 rounded-lg">
                                  <p className="font-bold text-hg-text mb-1 text-[11px] truncate">{h.hotelId}</p>
                                  <div className="flex justify-between text-[10px]">
                                    <span>Ratio:</span>
                                    <span className="text-hg-accent font-bold">{(h.compressionStats?.ratio * 100 || 0).toFixed(0)}%</span>
                                  </div>
                                  <div className="flex justify-between text-[10px]">
                                    <span>Ops:</span>
                                    <span className="text-hg-muted">{(h as any).debug?.mergesPerformed || 0} merges</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </DisclosurePanel>
                      </>
                    )}
                  </Disclosure>
                </section>
              </div>
            );
          })()}
        </div>
        
        <div className="p-4 bg-hg-panel border-t border-hg-border flex justify-end">
          <button 
            onClick={onClose}
            className="hg-button-primary px-6 h-9"
          >
            Acknowledge & Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
const Sidebar = ({ 
  isOpen, 
  onClose,
  activeView,
  onViewChange,
  isMobile,
  metrics,
  onExportARI,
  onImportARI,
  onShowLogs,
  activeDesktopTab,
  setActiveDesktopTab,
  isTablet,
  windowSize,
  executionMode,
  setExecutionMode,
  packagingStrategy,
  setPackagingStrategy,
  onShowDiagnostics
}: { 
  isOpen: boolean; 
  onClose: () => void;
  activeView: 'builder' | 'logs';
  onViewChange: (view: 'builder' | 'logs') => void;
  isMobile: boolean;
  metrics: any;
  onExportARI: () => void;
  onImportARI: () => void;
  onShowLogs: () => void;
  activeDesktopTab: 'product' | 'packaging' | 'review';
  setActiveDesktopTab: (tab: 'product' | 'packaging' | 'review') => void;
  isTablet: boolean;
  windowSize: { width: number; height: number };
  executionMode: ExecutionMode;
  setExecutionMode: (mode: ExecutionMode) => void;
  packagingStrategy: PackagingStrategy;
  setPackagingStrategy: (strat: PackagingStrategy) => void;
  onShowDiagnostics: () => void;
}) => {
  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-[320px] bg-hg-nav border-r border-hg-border flex flex-col z-[70] shadow-2xl shadow-black/50"
            >
              <div className="h-[56px] border-b border-hg-border flex items-center px-4 gap-4 lg:gap-6">
                <button 
                  onClick={onClose}
                  className="p-1.5 text-hg-muted hover:text-hg-text transition-colors hover:bg-white/5 rounded-md flex-shrink-0"
                >
                  <X size={20} />
                </button>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-8 h-8 bg-hg-accent rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-hg-accent/20">
                    <HotelIcon size={16} className="text-hg-bg" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[14px] font-black text-hg-text tracking-tighter leading-none">operator v4.0</span>
                    <span className="text-[9px] text-hg-accent font-black uppercase tracking-[0.2em] mt-0.5">Connected</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar py-4 px-3 space-y-8">
                {/* Navigation Section */}
                <div className="space-y-1">
                  <h4 className="px-3 text-[10px] font-black text-hg-muted/50 uppercase tracking-[0.2em] mb-2">Workflow</h4>
                  {[
                    { id: 'builder', label: 'Product Builder', icon: LayoutDashboard },
                    { id: 'logs', label: 'Execution Logs', icon: History },
                  ].map((item) => (
                    <button 
                      key={item.id}
                      onClick={() => {
                        onViewChange(item.id as any);
                        if (!isMobile && !isTablet && (item.id === 'logs')) onClose();
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-bold transition-all ${
                        activeView === item.id 
                        ? 'bg-hg-accent/10 text-hg-accent' 
                        : 'text-hg-muted hover:text-hg-text hover:bg-white/5'
                      }`}
                    >
                      <item.icon size={18} />
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Sub-navigation for Product/Packaging on Mobile/Tablet */}
                {(isMobile || isTablet || windowSize.width < 1600) && activeView === 'builder' && (
                  <div className="space-y-1 pt-2 border-t border-hg-border/30">
                    <h4 className="px-3 text-[10px] font-black text-hg-muted/30 uppercase tracking-[0.2em] mb-2">Configuration</h4>
                    {[
                      { id: 'product', label: 'Product Definition', icon: Database },
                      { id: 'packaging', label: 'Packaging Configuration', icon: Settings },
                      { id: 'review', label: 'Review & Export', icon: Download },
                    ].map((item) => (
                      <button 
                        key={item.id}
                        onClick={() => {
                          setActiveDesktopTab(item.id as any);
                          onClose();
                        }}
                        className={`w-full flex items-center gap-3 px-6 py-2.5 rounded-lg text-[12px] font-bold transition-all ${
                          activeDesktopTab === item.id 
                          ? 'text-hg-accent' 
                          : 'text-hg-muted hover:text-hg-text'
                        }`}
                      >
                        <item.icon size={16} />
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Execution Mode (Mobile/Tablet) */}
                {(isMobile || isTablet) && (
                  <div className="space-y-4 pt-4 border-t border-hg-border/30">
                    <h4 className="px-3 text-[10px] font-black text-hg-muted/50 uppercase tracking-[0.2em]">Execution Mode</h4>
                    <div className="px-2 grid grid-cols-1 gap-1">
                      {Object.values(ExecutionMode).map((mode) => (
                        <button
                          key={stableKey("side-exec", mode)}
                          onClick={() => setExecutionMode(mode)}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${
                            executionMode === mode 
                              ? 'bg-hg-accent text-hg-bg shadow-lg shadow-hg-accent/20' 
                              : 'text-hg-muted hover:text-hg-text hover:bg-white/5'
                          }`}
                        >
                          <span>{mode}</span>
                          {executionMode === mode && <Check size={14} />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Packaging Strategy (Mobile/Tablet) */}
                {(isMobile || isTablet) && (
                  <div className="space-y-4 pt-4 border-t border-hg-border/30">
                    <h4 className="px-3 text-[10px] font-black text-hg-muted/50 uppercase tracking-[0.2em]">EDF Strategy</h4>
                    <div className="px-2 grid grid-cols-1 gap-1">
                      {Object.values(PackagingStrategy).map((strat) => (
                        <button
                          key={stableKey("side-strat", strat)}
                          onClick={() => setPackagingStrategy(strat)}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${
                            packagingStrategy === strat 
                              ? 'bg-hg-accent text-hg-bg shadow-lg shadow-hg-accent/20' 
                              : 'text-hg-muted hover:text-hg-text hover:bg-white/5'
                          }`}
                        >
                          <span>{strat}</span>
                          {packagingStrategy === strat && <Check size={14} />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metrics / Run Summary Section */}
                <div className="space-y-4 pt-4 border-t border-hg-border/30">
                  <h4 className="px-3 text-[10px] font-black text-hg-muted/50 uppercase tracking-[0.2em]">Live Run Summary</h4>
                  <div className="mx-2 grid grid-cols-2 gap-2">
                    <div className="bg-hg-panel border border-hg-border p-3 rounded-lg flex flex-col gap-1">
                      <span className="text-[9px] font-black text-hg-muted uppercase tracking-wider">Rooms Compliance</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-mono font-black text-hg-accent">{metrics.valid}</span>
                        <span className="text-[10px] text-hg-muted">Valid</span>
                      </div>
                    </div>
                    <div className="bg-hg-panel border border-hg-border p-3 rounded-lg flex flex-col gap-1">
                      <span className="text-[9px] font-black text-hg-muted uppercase tracking-wider">ARI Density</span>
                      <div className="flex items-baseline gap-2 text-hg-text">
                        <span className="text-xl font-mono font-black">{metrics.total}</span>
                        <span className="text-[10px] text-hg-muted">CB</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Operations Section */}
                <div className="space-y-1">
                  <h4 className="px-3 text-[10px] font-black text-hg-muted/50 uppercase tracking-[0.2em] mb-2">Systems & Data</h4>
                  {[
                    { label: 'Import ARI Feed', icon: Import, onClick: onImportARI },
                    { label: 'Export ARI Analysis', icon: Download, onClick: onExportARI },
                    { label: 'Run Diagnostics', icon: Activity, onClick: () => { onShowDiagnostics(); onClose(); }, highlight: metrics.trimmed > 0 },
                    { label: 'GIATA Mapping Hub', icon: Globe, onClick: () => window.open('https://www.giata.com/en/multicode/', '_blank') },
                  ].map((btn) => (
                    <button 
                      key={btn.label}
                      onClick={btn.onClick}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-bold transition-all ${
                        btn.highlight 
                        ? 'bg-hg-warning/10 text-hg-warning hover:bg-hg-warning/20' 
                        : 'text-hg-muted hover:text-hg-text hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <btn.icon size={18} />
                        {btn.label}
                      </div>
                      {btn.highlight && <div className="w-2 h-2 rounded-full bg-hg-warning animate-pulse" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-hg-border bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-hg-accent/20 flex items-center justify-center text-hg-accent border border-hg-accent/30">
                    <User size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-hg-text tracking-tight">Operator User</span>
                    <span className="text-[10px] text-hg-muted font-mono">admin@hyperguest.com</span>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};


const PredictiveDestinationSearch = ({ 
  selectedValues, 
  onChange,
  isMobile 
}: { 
  selectedValues: string[]; 
  onChange: (vals: string[]) => void;
  isMobile?: boolean;
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    setIsFetching(true);
    try {
      const results = await GiataDriveService.fetchLocations(q);
      setSuggestions(results);
      setShowDropdown(true);
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) fetchSuggestions(query);
      else setSuggestions([]);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, fetchSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleValue = (val: string) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter(v => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
    setQuery('');
    setSuggestions([]);
    setShowDropdown(false);
  };

  const groupedSuggestions = useMemo(() => {
    return {
      Cities: suggestions.filter(s => s.type === 'city'),
      Airports: suggestions.filter(s => s.type === 'airport'),
      Countries: suggestions.filter(s => s.type === 'country')
    };
  }, [suggestions]);

  return (
    <div className="space-y-4" ref={containerRef}>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-hg-muted group-focus-within:text-hg-accent transition-colors">
          <Search size={18} />
        </div>
        <input 
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowDropdown(true)}
          placeholder="Search by IATA, ISO, City or Country name..."
          className="w-full h-14 pl-12 pr-12 bg-hg-bg border border-hg-border focus:border-hg-accent/50 rounded-2xl text-[13px] font-bold tracking-tight text-white placeholder:text-hg-muted/50 outline-none transition-all focus:ring-4 focus:ring-hg-accent/5 shadow-xl"
        />
        {isFetching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <Loader2 size={16} className="text-hg-accent animate-spin" />
          </div>
        )}

        <AnimatePresence>
          {showDropdown && suggestions.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full left-0 right-0 mt-2 z-[1000] bg-neutral-900 border border-hg-border/50 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl max-h-[400px] overflow-y-auto custom-scrollbar"
            >
              {Object.entries(groupedSuggestions).map(([group, items]) => {
                if (items.length === 0) return null;
                return (
                  <div key={group} className="border-b border-white/5 last:border-0 pb-2">
                    <div className="px-5 py-3 text-[10px] font-black text-hg-muted uppercase tracking-[0.2em] bg-white/[0.02]">
                      {group}
                    </div>
                    {items.map((item: any) => {
                      const code = item.iata || item.iso;
                      const isSelected = selectedValues.includes(code);
                      return (
                        <div 
                          key={`${item.type}-${item.name}-${code}`}
                          onClick={() => toggleValue(code)}
                          className="px-5 py-3.5 hover:bg-hg-accent/5 cursor-pointer flex items-center justify-between transition-colors group/item"
                        >
                          <div className="flex flex-col">
                            <span className="text-[13px] font-bold text-white group-hover/item:text-hg-accent transition-colors">
                              {item.name}
                            </span>
                            <span className="text-[10px] font-medium text-hg-muted uppercase tracking-wider">
                              {item.country || item.region || (item.iso ? 'Country' : '')}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono font-black text-hg-muted/40 group-hover/item:text-hg-accent/40 tabular-nums">
                              {code}
                            </span>
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isSelected ? 'bg-hg-accent border-hg-accent text-hg-bg' : 'border-hg-border bg-black/20 text-transparent'}`}>
                              <Check size={12} className="stroke-[3px]" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-wrap gap-2">
        {selectedValues.map((val) => (
          <div 
            key={val}
            className="flex items-center gap-2 bg-hg-accent/10 border border-hg-accent/20 px-3 py-1.5 rounded-xl text-[11px] font-black text-hg-accent uppercase tracking-widest group hover:bg-hg-accent/20 transition-all hover:border-hg-accent shadow-lg shadow-hg-accent/5"
          >
            <span>{val}</span>
            <button 
              onClick={() => onChange(selectedValues.filter(v => v !== val))}
              className="text-hg-accent/40 hover:text-hg-accent transition-colors"
            >
              <X size={12} strokeWidth={3} />
            </button>
          </div>
        ))}
        {selectedValues.length === 0 && (
          <div className="text-[11px] font-medium text-hg-muted italic px-2">
            No destinations selected. Add cities, airports or countries to define your scope.
          </div>
        )}
      </div>
    </div>
  );
};

const CollapsibleSection = ({ id, title, icon: Icon, isOpen, onToggle, children, className, isMobile = false }: { id: string; title: string; icon: any; isOpen: boolean; onToggle: () => void; children: React.ReactNode; className?: string; isMobile?: boolean }) => (
  <div className={className || `border border-white/5 overflow-hidden transition-all duration-300 ${isMobile ? 'm-3 p-4 bg-[#11161C] rounded-[14px]' : 'bg-neutral-900 rounded-2xl shadow-sm hover:shadow-md'}`}>
    {!isMobile ? (
      <button 
        onClick={onToggle}
        className={`w-full px-6 py-5 flex items-center justify-between transition-colors ${isOpen ? 'bg-hg-nav border-b border-hg-divider' : 'hover:bg-hg-nav/50'}`}
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isOpen ? 'bg-hg-accent text-hg-bg' : 'bg-hg-panel text-hg-muted'}`}>
            <Icon size={20} />
          </div>
          <div className="flex flex-col items-start">
            <h3 className="text-[14px] font-black uppercase tracking-widest text-hg-text">{title}</h3>
            <span className="text-[10px] text-hg-muted font-bold uppercase tracking-tighter opacity-60">
              {isOpen ? 'Collapse view' : 'Expand to view details'}
            </span>
          </div>
        </div>
        <div className={`w-8 h-8 rounded-full border border-hg-divider flex items-center justify-center transition-transform duration-500 ${isOpen ? 'rotate-180 bg-hg-panel' : ''}`}>
          <ChevronDown size={16} className="text-hg-muted" />
        </div>
      </button>
    ) : (
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-hg-accent/10 text-hg-accent flex items-center justify-center">
          <Icon size={16} />
        </div>
        <h3 className="text-[12px] font-black uppercase tracking-widest text-hg-text">{title}</h3>
      </div>
    )}
    {(!isMobile || isOpen) && (
      <div className={isMobile ? "" : "overflow-hidden"}>
        {children}
      </div>
    )}
  </div>
);

const HotelCard = React.memo(({ 
  hotel: h, 
  isSelected, 
  onToggle, 
  isMobile,
  onResolveAmbiguity,
}: { 
  hotel: Hotel; 
  isSelected: boolean; 
  onToggle: (id: string) => void; 
  isMobile?: boolean;
  onResolveAmbiguity?: (hotelId: string, candidate: GiataProperty) => void;
}) => {
  const roomCount = h.roomCount || 0;
  const status = h.status || 'safe';
  const [showCandidates, setShowCandidates] = useState(false);
  
  const normStatus = h.normalization?.status || NormalizationStatus.UNMAPPED;
  const giataData = h.normalization?.matchedProperty;
  const candidates = h.normalization?.candidates || [];
  
  const hasHGId = !!h.hgId;
  const hasGiataId = !!h.giataId;

  const getStatusBadge = () => {
    if (hasGiataId && hasHGId) {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-hg-accent/10 text-hg-accent border border-hg-accent/20 rounded-lg shadow-sm">
          <CheckCircle2 size={12} strokeWidth={3} />
          <span className="text-[10px] font-black uppercase tracking-widest font-sans">Matched</span>
        </div>
      );
    }
    if (hasGiataId && !hasHGId) {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg shadow-sm">
          <Info size={12} strokeWidth={3} />
          <span className="text-[10px] font-black uppercase tracking-widest font-sans">No HG Mapping</span>
        </div>
      );
    }
    if (!hasGiataId && hasHGId) {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-hg-warning/10 text-hg-warning border border-hg-warning/20 rounded-lg shadow-sm">
          <Info size={12} strokeWidth={3} />
          <span className="text-[10px] font-black uppercase tracking-widest font-sans">Not Mapped to GIATA</span>
        </div>
      );
    }
    return null;
  };

  const getGiataColor = () => {
    if (!hasGiataId) return 'text-hg-muted';
    if (normStatus === NormalizationStatus.MATCHED) return 'text-hg-accent';
    if (normStatus === NormalizationStatus.AMBIGUOUS) return 'text-yellow-500';
    return 'text-red-500';
  };

  if (isMobile) {
    return (
      <div 
        className={`flex flex-col border-b border-hg-border/50 transition-colors ${isSelected ? 'bg-hg-accent/5' : 'bg-transparent'}`}
      >
        <div 
          onClick={() => onToggle(h.id)}
          className="flex items-center gap-3 p-3 min-h-[96px] cursor-pointer"
        >
          <div className={`w-5 h-5 rounded-[6px] border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-hg-accent border-hg-accent' : 'border-hg-divider bg-transparent'}`}>
              {isSelected && <Check size={12} className="text-hg-bg stroke-[3px]" />}
          </div>
          
          <div className="flex-1 min-w-0 py-1">
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="text-[15px] font-black text-hg-text truncate leading-tight tracking-tight">{h.name}</h3>
              <div className="flex items-center shrink-0 px-1.5 py-0.5 bg-yellow-500/10 rounded-md">
                  <Star size={10} className="text-yellow-500 fill-yellow-500" />
                  <span className="text-[10px] font-black text-yellow-500 ml-1">{h.starRating}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-[11px] text-hg-muted font-bold uppercase tracking-widest opacity-70">
                <span className="truncate">{h.city}, {h.country}</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-mono font-black">
                <span className={getGiataColor()}>GIATA: {h.giataId || 'N/A'}</span>
                {hasHGId && <span className="text-hg-accent/60">HG: {h.hgId}</span>}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            {getStatusBadge()}
            <div className="text-[11px] font-mono font-black text-hg-text tabular-nums">
              {formatNumber(roomCount)} <span className="text-[9px] text-hg-muted uppercase tracking-tighter">Rooms</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop View
  return (
    <div className={`flex flex-col border-b border-hg-divider/50 transition-all ${isSelected ? 'bg-hg-accent/5' : 'hover:bg-white/5'}`}>
      <div 
        onClick={() => onToggle(h.id)}
        className="group flex items-center gap-5 p-5 cursor-pointer"
      >
        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-hg-accent border-hg-accent text-hg-bg scale-105 shadow-lg shadow-hg-accent/20' : 'border-hg-divider bg-transparent hover:border-hg-accent/50'}`}>
            {isSelected && <Check size={14} className="stroke-[4px]" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1.5">
            <h3 className="text-[16px] font-black text-hg-text truncate uppercase tracking-tight group-hover:text-hg-accent transition-colors">{h.name}</h3>
            <div className="flex items-center gap-0.5 ml-1">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  size={12} 
                  className={i < h.starRating ? "text-yellow-500 fill-yellow-500" : "text-hg-muted/20 fill-transparent"} 
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-hg-muted font-bold uppercase tracking-[0.1em] opacity-80">
            <div className="flex items-center gap-1.5">
              <MapPin size={12} className="text-hg-accent/50" />
              <span>{h.city}, {h.country || 'GLOBAL'}</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-white/10" />
            <div className="flex items-center gap-2 font-mono">
              <span className="text-hg-muted/40">GIATA</span>
              <span className={getGiataColor()}>{h.giataId || 'N/A'}</span>
            </div>
            {hasHGId && (
              <>
                <div className="w-1 h-1 rounded-full bg-white/10" />
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-hg-muted/40">HG</span>
                  <span className="text-hg-accent">{h.hgId}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-8 shrink-0">
          {getStatusBadge()}
          
          <div className="flex flex-col items-end min-w-[100px]">
             <div className="text-lg font-mono font-black text-hg-text tabular-nums leading-none mb-1">
                {formatNumber(roomCount)}
             </div>
             <div className="text-[9px] font-black text-hg-muted uppercase tracking-[0.2em] opacity-50">Room Configs</div>
          </div>
        </div>
      </div>
    </div>
  );
});

const Pagination = ({ 
  page, 
  totalPages, 
  onPageChange, 
  limit, 
  onLimitChange,
  isMobile 
}: { 
  page: number; 
  totalPages: number; 
  onPageChange: (p: number) => void;
  limit: number;
  onLimitChange: (l: number) => void;
  isMobile: boolean;
}) => {
  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t border-hg-border/50 bg-hg-panel/10 rounded-b-2xl px-4">
      <div className="flex items-center gap-1.5 order-2 sm:order-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="px-3 h-8 flex items-center justify-center rounded-lg border border-hg-border text-[10px] font-black uppercase tracking-tighter hover:border-hg-accent disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <ChevronLeft size={14} className="mr-1" /> Prev
        </button>
        
        {start > 1 && (
          <>
            <button onClick={() => onPageChange(1)} className={`w-8 h-8 rounded-lg text-[10px] font-black transition-colors ${page === 1 ? 'bg-hg-accent text-hg-bg' : 'hover:bg-white/5 text-hg-muted'}`}>1</button>
            {start > 2 && <span className="text-hg-muted opacity-30">...</span>}
          </>
        )}

        {pages.map(p => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 rounded-lg text-[10px] font-black transition-colors ${page === p ? 'bg-hg-accent text-hg-bg shadow-lg shadow-hg-accent/20' : 'hover:bg-white/5 text-hg-muted'}`}
          >
            {p}
          </button>
        ))}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="text-hg-muted opacity-30">...</span>}
            <button onClick={() => onPageChange(totalPages)} className={`w-8 h-8 rounded-lg text-[10px] font-black transition-colors ${page === totalPages ? 'bg-hg-accent text-hg-bg' : 'hover:bg-white/5 text-hg-muted'}`}>{totalPages}</button>
          </>
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="px-3 h-8 flex items-center justify-center rounded-lg border border-hg-border text-[10px] font-black uppercase tracking-tighter hover:border-hg-accent disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          Next <ChevronRight size={14} className="ml-1" />
        </button>
      </div>

      <div className="flex items-center gap-3 order-1 sm:order-2">
        <span className="text-[10px] font-black text-hg-muted uppercase tracking-widest whitespace-nowrap">Show:</span>
        <div className="flex bg-neutral-900 border border-hg-border/50 p-1 rounded-xl">
          {[50, 100, 150].map(size => (
            <button
              key={size}
              onClick={() => onLimitChange(size)}
              className={`px-3 h-7 rounded-lg text-[10px] font-black transition-all ${
                limit === size 
                  ? 'bg-hg-accent text-hg-bg' 
                  : 'text-hg-muted hover:text-white hover:bg-white/5'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const HotelsSection = React.memo(({ 
  hotels, 
  selectedIds, 
  onToggle, 
  isMobile, 
  searchTerm,
  setSearchTerm,
  onToggleAll,
  onClear,
  totalCount,
  isLandscape,
  selectedStars,
  setSelectedStars,
  selectedCities,
  setSelectedCities,
  availableCities,
  availableStars,
  inventoryLength,
  giataMappedFilter,
  setGiataMappedFilter,
  onResolveAmbiguity,
  page,
  setPage,
  limit,
  setLimit,
  totalPages,
  isFetching,
  isSelected,
  allSelected,
  deselectedIds,
}: { 
  hotels: Hotel[]; 
  selectedIds: Set<string>; 
  onToggle: (id: string) => void; 
  isMobile: boolean;
  searchTerm: string;
  setSearchTerm: (q: string) => void;
  onToggleAll: () => void;
  onClear: () => void;
  totalCount: number;
  isLandscape?: boolean;
  selectedStars: number[];
  setSelectedStars: (stars: number[]) => void;
  selectedCities: string[];
  setSelectedCities: (cities: string[]) => void;
  availableCities: string[];
  availableStars: number[];
  inventoryLength: number;
  giataMappedFilter: string;
  setGiataMappedFilter: (val: string) => void;
  onResolveAmbiguity: (hotelId: string, candidate: GiataProperty) => void;
  page: number;
  setPage: (p: number) => void;
  limit: number;
  setLimit: (l: number) => void;
  totalPages: number;
  isFetching: boolean;
  isSelected: (id: string) => boolean;
  allSelected: boolean;
  deselectedIds: Set<string>;
}) => {
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  const toggleStar = (star: number) => {
    setSelectedStars(selectedStars.includes(star) 
      ? selectedStars.filter(s => s !== star) 
      : [...selectedStars, star].sort((a,b) => b-a));
  };

  const clearFilters = () => {
    setSelectedStars([]);
    setSelectedCities([]);
    setSearchTerm('');
    setGiataMappedFilter('ALL');
  };

  return (
    <div className={`flex flex-col h-full ${isLandscape ? 'space-y-2 p-2' : 'space-y-4 p-4'} ${isMobile && !isLandscape ? 'pb-24' : ''}`}>
      {/* Desktop Inline Filters */}
      {!isMobile && (
        <div className="flex flex-wrap items-center gap-3 bg-hg-nav/20 p-3 rounded-2xl border border-white/5 mb-2">
          <div className="relative flex-1 group min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-hg-muted group-focus-within:text-hg-accent transition-colors" size={14} />
            <input 
              type="text"
              placeholder="Search by hotel name, city or GIATA ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 h-10 bg-hg-bg border border-hg-border focus:border-hg-accent/50 rounded-xl text-[11px] font-medium transition-all focus:ring-4 focus:ring-hg-accent/5 outline-none text-hg-text"
            />
          </div>

          <select 
            value={giataMappedFilter}
            onChange={(e) => setGiataMappedFilter(e.target.value)}
            className="w-[180px] h-10 px-3 bg-hg-bg border border-hg-border rounded-xl text-[11px] font-bold uppercase tracking-widest text-hg-text outline-none focus:border-hg-accent/50"
          >
            <option value="ALL">Normalization: All</option>
            <option value="MATCHED">Matched</option>
            <option value="AMBIGUOUS">Ambiguous</option>
            <option value="UNMAPPED">Unmapped</option>
          </select>

          <div className="w-[180px]">
            <SearchableMultiSelect 
              label=""
              placeholder="Filter City"
              options={availableCities.map(c => ({ label: c, value: c }))}
              selectedValues={selectedCities}
              onChange={setSelectedCities}
              isMobile={false}
            />
          </div>

          <div className="flex bg-neutral-900 border border-hg-border/50 p-1 rounded-xl">
            {[5, 4, 3, 2, 1].map(star => (
              <button
                key={star}
                onClick={() => toggleStar(star)}
                className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all flex flex-col items-center justify-center ${
                  selectedStars.includes(star) 
                    ? 'bg-hg-accent text-hg-bg shadow-lg shadow-hg-accent/20' 
                    : 'text-hg-muted hover:text-white hover:bg-white/5'
                }`}
              >
                {star}<Star size={8} fill={selectedStars.includes(star) ? "currentColor" : "none"} />
              </button>
            ))}
          </div>

          <button 
            onClick={clearFilters}
            className="px-3 h-10 text-[10px] font-black text-hg-muted hover:text-hg-danger transition-colors uppercase tracking-widest"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Main Controls Row */}
      <div className={`flex flex-col sm:flex-row items-center ${isLandscape ? 'gap-2 p-2' : 'gap-4 p-3'} bg-hg-panel rounded-2xl border border-hg-border shadow-sm`}>
        {isMobile && (
          <div className="flex gap-2 w-full mb-2 sm:mb-0">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-hg-muted" size={14} />
              <input 
                type="text"
                placeholder="Search hotels..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 h-10 bg-hg-bg border border-hg-border rounded-xl text-[11px] font-medium outline-none text-hg-text"
              />
            </div>
            <button 
              onClick={() => setIsFilterSheetOpen(true)}
              className="px-4 h-10 bg-hg-nav border border-hg-border rounded-xl flex items-center gap-2 text-[10px] font-black text-hg-text uppercase tracking-widest active:scale-95 transition-all"
            >
              <Filter size={14} className={selectedCities.length > 0 || selectedStars.length > 0 || giataMappedFilter !== 'ALL' ? "text-hg-accent" : "text-hg-muted"} />
              Filter
              {(selectedCities.length > 0 || selectedStars.length > 0 || giataMappedFilter !== 'ALL') && (
                <span className="w-1.5 h-1.5 rounded-full bg-hg-accent shadow-[0_0_8px_rgba(var(--hg-accent-rgb),0.5)]" />
              )}
            </button>
          </div>
        )}
        
        <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
           <button 
             onClick={onToggleAll} 
             className={`flex-1 sm:flex-none ${isLandscape ? 'h-9 px-4' : 'h-10 px-6'} rounded-xl border border-hg-border bg-hg-bg hover:border-hg-accent text-hg-text text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95`}
           >
             Select All
           </button>
           <button 
             onClick={onClear} 
             className={`flex-1 sm:flex-none ${isLandscape ? 'h-9 px-4' : 'h-10 px-6'} rounded-xl border border-hg-border bg-hg-bg hover:text-hg-danger hover:border-hg-danger/30 text-hg-text text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95`}
           >
             Clear Selection
           </button>
        </div>
      </div>

      <div className={`flex-1 h-[600px] w-full relative border border-white/5 md:border-hg-border/50 rounded-2xl overflow-hidden bg-hg-bg/30 ${isFetching ? 'opacity-50' : ''}`}>
        {isFetching && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/20 backdrop-blur-[1px]">
            <div className="w-10 h-10 border-4 border-hg-accent/20 border-t-hg-accent rounded-full animate-spin mb-4" />
            <span className="text-[10px] font-black text-hg-accent uppercase tracking-[0.3em]">Synching with Giata Drive...</span>
          </div>
        )}
        {hotels.length === 0 && !isFetching ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-black/40 backdrop-blur-[2px]">
            <div className="w-16 h-16 bg-hg-accent/5 rounded-full flex items-center justify-center mb-6 border border-hg-accent/20">
              <Search className="text-hg-accent/50" size={32} />
            </div>
            {inventoryLength === 0 ? (
              <>
                <h3 className="text-[16px] font-black text-white uppercase tracking-tight mb-2">No hotel inventory loaded</h3>
                <p className="text-[11px] text-hg-muted font-bold uppercase tracking-widest mb-8 max-w-[240px]">
                  Please check your destinations or upload an ARI source file.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-[16px] font-black text-white uppercase tracking-tight mb-2">No hotels match current filters</h3>
                <p className="text-[11px] text-hg-muted font-bold uppercase tracking-widest mb-8 max-w-[240px]">
                  {searchTerm ? `Nothing found for "${searchTerm}"` : 'Try clearing your star, city, or GIATA filters to see more results.'}
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <button 
                    onClick={clearFilters}
                    className="px-5 py-2.5 bg-hg-accent text-hg-bg rounded-xl text-[11px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-hg-accent/20"
                  >
                    Clear Filters
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <Virtuoso
            style={{ height: isMobile && !isLandscape ? 520 : '100%', minHeight: '300px' }}
            totalCount={hotels.length}
            itemContent={(index) => {
              const h = hotels[index];
              if (!h) return null;
              return (
                <div className="px-1 md:px-4 py-1.5">
                  <HotelCard 
                    hotel={h}
                    isSelected={isSelected(h.id)}
                    onToggle={onToggle}
                    isMobile={isMobile}
                    onResolveAmbiguity={onResolveAmbiguity}
                  />
                </div>
              );
            }}
            className="no-scrollbar"
          />
        )}
      </div>

      <Pagination 
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        limit={limit}
        onLimitChange={setLimit}
        isMobile={isMobile}
      />

      <div className="px-4 py-3 flex items-center justify-between bg-hg-panel/30 border border-white/5 rounded-xl">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-hg-muted uppercase tracking-widest">Inventory</span>
            <span className="text-[14px] font-black text-hg-text tabular-nums">{formatNumber(totalCount)}</span>
          </div>
          <div className="w-px h-6 bg-hg-border/50" />
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-hg-muted uppercase tracking-widest">Selected</span>
            <span className="text-[14px] font-black text-hg-accent tabular-nums">{formatNumber(allSelected ? totalCount - deselectedIds.size : selectedIds.size)}</span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 text-[10px] font-bold text-hg-muted/30 uppercase tracking-tighter">
          {giataMappedFilter !== 'ALL' && <span className="text-hg-accent">Filtering by GIATA: {giataMappedFilter} · </span>}
          Virtualization Active · {hotels.length} rendered
        </div>
      </div>

      {/* Mobile Filter Sheet */}
      <AnimatePresence>
        {isFilterSheetOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterSheetOpen(false)}
              className="fixed inset-0 bg-black/80 z-[110] backdrop-blur-sm md:hidden"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[120] bg-hg-nav border-t border-hg-border rounded-t-3xl p-6 md:hidden max-h-[85vh] overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-hg-border/50 rounded-full mx-auto mb-8" />
              
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Filter Hotels</h3>
                <button 
                  onClick={clearFilters}
                  className="text-[11px] font-bold text-hg-accent uppercase"
                >
                  Clear All
                </button>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-hg-muted uppercase tracking-[0.2em] block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-hg-muted" size={16} />
                    <input 
                      type="text"
                      placeholder="Hotel name, city, or GIATA ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 h-12 bg-hg-bg border border-hg-border rounded-xl text-[13px] outline-none text-white focus:border-hg-accent/50"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-hg-muted uppercase tracking-[0.2em] block">GIATA Normalization</label>
                  <div className="grid grid-cols-1 gap-2">
                    {['ALL', 'MATCHED', 'AMBIGUOUS', 'UNMAPPED'].map(val => (
                      <button
                        key={val}
                        onClick={() => setGiataMappedFilter(val)}
                        className={`h-11 px-4 rounded-xl flex items-center justify-between border transition-all ${
                          giataMappedFilter === val
                            ? 'bg-hg-accent/20 border-hg-accent text-hg-accent'
                            : 'bg-hg-bg border-hg-border text-hg-muted'
                        }`}
                      >
                        <span className="text-[11px] font-black uppercase tracking-widest">{val}</span>
                        {giataMappedFilter === val && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-hg-muted uppercase tracking-[0.2em] block">City</label>
                  <SearchableMultiSelect 
                    label=""
                    placeholder="Search cities..."
                    options={availableCities.map(c => ({ label: c, value: c }))}
                    selectedValues={selectedCities}
                    onChange={setSelectedCities}
                    isMobile={true}
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-hg-muted uppercase tracking-[0.2em] block">Star Rating</label>
                  <div className="grid grid-cols-5 gap-2">
                    {[5, 4, 3, 2, 1].map(star => (
                      <button
                        key={star}
                        onClick={() => toggleStar(star)}
                        className={`h-12 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all ${
                          selectedStars.includes(star)
                            ? 'bg-hg-accent/20 border-hg-accent text-hg-accent'
                            : 'bg-hg-bg border-hg-border text-hg-muted'
                        }`}
                      >
                        <span className="text-[14px] font-black">{star}</span>
                        <Star size={10} fill={selectedStars.includes(star) ? "currentColor" : "none"} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-8 grid grid-cols-2 gap-4 pb-8">
                  <button 
                    onClick={() => setIsFilterSheetOpen(false)}
                    className="h-14 bg-hg-bg border border-hg-border text-white text-[12px] font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => setIsFilterSheetOpen(false)}
                    className="h-14 bg-hg-accent text-hg-bg text-[12px] font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-all shadow-xl shadow-hg-accent/20"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
});


const Badge = ({ children, onRemove, active }: { children: React.ReactNode; onRemove?: () => void; active?: boolean; key?: React.Key }) => (
  <span className={`hg-badge ${active ? 'hg-badge-active' : ''}`}>
    {children}
    {onRemove && (
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }} 
        className="text-hg-muted hover:text-hg-danger transition-colors ml-1.5"
      >
        <X size={12} />
      </button>
    )}
  </span>
);

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {(() => {
      const starItems = Array.from({ length: 5 });
      const keys = starItems.map((_, i) => stableKey("star-global", i));
      // Usually used in many places, sibling uniqueness is enough, but adding log for total safety
      logKeyDuplication("StarRating", keys, starItems);
      return starItems.map((_, i) => (
        <span key={keys[i]} className={`text-[10px] ${i < rating ? "text-hg-warning" : "text-hg-border"}`}>★</span>
      ));
    })()}
  </div>
);

const ValidationError = ({ message }: { message?: string }) => (
  <AnimatePresence>
    {message && (
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex items-center gap-2 text-red-400 text-[11px] font-bold mt-2"
      >
        <AlertCircle size={14} />
        {message}
      </motion.div>
    )}
  </AnimatePresence>
);

const ExportDiagnosticsPanel = ({ diagnostics, onClose }: { diagnostics: any[], onClose: () => void }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const summary = useMemo(() => {
    let totalHotels = diagnostics.length;
    let totalRooms = diagnostics.reduce((acc, h) => acc + (h.diagnosticStats?.totalRooms || 0), 0);
    let totalRoomsWithSeasons = diagnostics.reduce((acc, h) => acc + (h.diagnosticStats?.roomsWithSeasons || 0), 0);
    let totalAriRows = diagnostics.reduce((acc, h) => acc + (h.diagnosticStats?.ariRowsMatched || 0), 0);
    
    // Find common failure reason
    const failureFrequencies: Record<string, number> = {};
    diagnostics.forEach(h => {
      h.rooms?.forEach((r: any) => {
        if (r.finalSeasons === 0 && r.filterReason) {
          failureFrequencies[r.filterReason] = (failureFrequencies[r.filterReason] || 0) + 1;
        }
      });
    });
    
    const mainFailure = Object.entries(failureFrequencies).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';
    
    return { totalHotels, totalRooms, totalRoomsWithSeasons, totalAriRows, mainFailure };
  }, [diagnostics]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-24 right-6 z-[100] w-[400px] bg-hg-nav border border-hg-border shadow-2xl rounded-lg overflow-hidden flex flex-col"
    >
      <div className="p-4 border-b border-hg-divider flex items-center justify-between bg-hg-bg/50">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-hg-warning animate-pulse" />
           <h3 className="text-[12px] font-bold text-hg-text uppercase tracking-wider">Export Diagnostics</h3>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="p-1 hover:bg-white/5 rounded text-hg-muted hover:text-hg-text transition-colors"
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-white/5 rounded text-hg-muted hover:text-hg-text transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      
      <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-hg-bg p-3 rounded border border-hg-border">
             <div className="text-[9px] text-hg-muted uppercase font-bold mb-1">Hotels Checked</div>
             <div className="text-lg font-mono font-bold text-hg-text">{summary.totalHotels}</div>
          </div>
          <div className="bg-hg-bg p-3 rounded border border-hg-border">
             <div className="text-[9px] text-hg-muted uppercase font-bold mb-1">Rooms in Scope</div>
             <div className="text-lg font-mono font-bold text-hg-text">{summary.totalRooms}</div>
          </div>
          <div className="bg-hg-bg p-3 rounded border border-hg-border">
             <div className="text-[9px] text-hg-muted uppercase font-bold mb-1">Rooms with Seasons</div>
             <div className="text-lg font-mono font-bold text-hg-accent">{summary.totalRoomsWithSeasons}</div>
          </div>
          <div className="bg-hg-bg p-3 rounded border border-hg-border">
             <div className="text-[9px] text-hg-muted uppercase font-bold mb-1">ARI Rows Matched</div>
             <div className="text-lg font-mono font-bold text-hg-text">{summary.totalAriRows}</div>
          </div>
        </div>

        <div className="bg-red-500/5 border border-red-500/20 p-3 rounded">
           <div className="text-[9px] text-red-400 uppercase font-bold mb-1">Dominant Failure Mode</div>
           <p className="text-[12px] text-red-200 leading-relaxed font-medium">{summary.mainFailure}</p>
        </div>

        {isExpanded && (
          <div className="mt-4 border-t border-hg-divider pt-4 pb-2">
            <h4 className="text-[10px] font-bold text-hg-muted uppercase mb-3 px-1">Detailed Breakdown</h4>
            <div className="space-y-4">
              {diagnostics.map((h, i) => (
                <div key={stableKey("diag-hotel", h.hotelId, h.partId, h.partKey, i)} className="bg-hg-bg/30 border border-hg-border/50 rounded overflow-hidden">
                  <div className="bg-hg-bg/50 px-3 py-2 border-b border-hg-divider flex justify-between items-center">
                    <span className="text-[10px] font-bold text-hg-text truncate pr-2">{h.hotelName}</span>
                    <span className="text-[9px] font-mono text-hg-muted shrink-0">{h.hotelId}</span>
                  </div>
                  <div className="p-1">
                    <table className="w-full text-[10px]">
                      <thead>
                        <tr className="text-hg-muted uppercase tracking-tighter border-b border-hg-divider/30 text-left">
                          <th className="px-2 py-1.5 font-bold">Room</th>
                          <th className="px-2 py-1.5 font-bold text-center">ARI</th>
                          <th className="px-2 py-1.5 font-bold text-center">Cand</th>
                          <th className="px-2 py-1.5 font-bold text-center">Final</th>
                          <th className="px-2 py-1.5 font-bold">Failure</th>
                        </tr>
                      </thead>
                      <tbody>
                        {h.rooms?.map((r: any, j: number) => (
                          <tr key={stableKey("diag-room", h.hotelId, h.partId, h.partKey, r.roomCode, j)} className="border-b border-hg-divider/10 hover:bg-white/5 transition-colors">
                            <td className="px-2 py-1.5 font-medium text-hg-text">{r.roomCode}</td>
                            <td className="px-2 py-1.5 text-center font-mono">{r.ariRowsMatched}</td>
                            <td className="px-2 py-1.5 text-center font-mono">{r.seasonsGenerated}</td>
                            <td className={`px-2 py-1.5 text-center font-mono font-bold ${r.finalSeasons > 0 ? 'text-hg-accent' : 'text-hg-muted'}`}>
                              {r.finalSeasons}
                            </td>
                            <td className="px-2 py-1.5 text-red-400 italic max-w-[120px] truncate" title={r.filterReason}>
                              {r.finalSeasons === 0 ? (r.filterReason || 'Unknown') : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6">
               <h4 className="text-[10px] font-bold text-hg-muted uppercase mb-2 px-1">Raw JSON Payload</h4>
               <div className="bg-black/40 rounded p-3 overflow-x-auto">
                 <pre className="text-[9px] text-hg-muted font-mono whitespace-pre h-[200px] overflow-y-auto no-scrollbar">
                   {JSON.stringify(diagnostics, null, 2)}
                 </pre>
               </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 bg-hg-bg/80 border-t border-hg-divider flex justify-center">
         <button 
           onClick={() => setIsExpanded(!isExpanded)}
           className="text-[9px] font-bold text-hg-accent uppercase hover:underline"
         >
           {isExpanded ? 'Hide Details' : 'Expand Detailed Breakdown'}
         </button>
      </div>
    </motion.div>
  );
};

const SummaryBar = ({ state, metrics, leftOffset, selectedHotels }: { state: PackagingState, metrics: any, leftOffset: number, selectedHotels: string[] }) => {
  const p = state.productDefinition || {} as any;
  const statusColor = metrics?.status === 'high' ? 'text-red-500' : metrics?.status === 'medium' ? 'text-hg-warning' : 'text-hg-accent';
  
  return (
  <div 
    style={{ left: `${leftOffset}px` }}
    className="fixed top-[48px] left-0 right-0 min-h-[36px] bg-hg-panel border-b border-hg-border z-40 flex items-center flex-wrap px-3 sm:px-6 py-1 gap-y-1 gap-x-3 no-scrollbar"
  >
    <div className="flex items-center gap-1 text-[11px] text-hg-muted whitespace-nowrap">
      <span className="font-bold text-hg-text uppercase">Destinations:</span>
      <span className="text-hg-text font-mono">{p.destinations?.length || 0}</span>
    </div>
    <div className="flex items-center gap-1 text-[11px] text-hg-muted whitespace-nowrap">
      <span className="font-bold text-hg-text uppercase ml-1">Hotels:</span>
      <span className="text-hg-text font-mono">{selectedHotels?.length || 0}</span>
    </div>
    <div className="flex items-center gap-1 text-[11px] text-hg-muted whitespace-nowrap">
      <span className="font-bold text-hg-text uppercase ml-1">Airports:</span>
      <span className="text-hg-text font-mono">{p.airports?.length || 0}</span>
    </div>
    <div className="w-px h-4 bg-hg-divider shrink-0 ml-1" />
    <div className="flex items-center gap-1 text-[11px] text-hg-muted whitespace-nowrap">
      <span className="font-bold text-hg-text uppercase ml-1">Total Rooms:</span>
      <span className="text-hg-text font-mono">{formatNumber(metrics.valid + metrics.trimmed + metrics.roomsWithNoSeasons)}</span>
    </div>
    <div className="flex items-center gap-1 text-[11px] text-hg-muted whitespace-nowrap">
      <span className="font-bold text-hg-text uppercase ml-1">Compliant (≤31 CB):</span>
      <span className="text-hg-accent font-mono font-bold">{formatNumber(metrics.valid)}</span>
    </div>
    <div className="flex items-center gap-1 text-[11px] text-hg-muted whitespace-nowrap">
      <span className="font-bold text-hg-text uppercase ml-1">Violations:</span>
      <span className="text-hg-danger font-mono font-bold">{formatNumber(metrics.trimmed)}</span>
    </div>
    {metrics.roomsWithNoSeasons > 0 && (
      <div className="flex items-center gap-1 text-[11px] text-hg-muted whitespace-nowrap">
        <span className="font-bold text-hg-text uppercase ml-1">No Seasons:</span>
        <span className="text-hg-warning font-mono font-bold animate-pulse">{metrics.roomsWithNoSeasons}</span>
      </div>
    )}
    <div className="w-px h-4 bg-hg-divider shrink-0 ml-1" />
    <div className="flex items-center gap-1 text-[11px] text-hg-muted whitespace-nowrap uppercase">
      <span className="font-bold text-hg-text">Compliance:</span>
      <span className={`font-bold ${metrics.roomsWithNoSeasons > 0 ? 'text-red-500' : statusColor}`}>
        {metrics.roomsWithNoSeasons > 0 ? 'EMPTY DATA' : (metrics.trimmed > 0 ? 'VIOLATIONS' : 'COMPLIANT')}
      </span>
    </div>
    <div className="ml-auto flex items-center gap-4 shrink-0">
      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-hg-bg border border-white/5 rounded text-[10px] uppercase font-bold text-hg-muted whitespace-nowrap">
        <span>{state.executionMode}</span>
        <span className="opacity-30">|</span>
        <span>{state.packagingStrategy}</span>
      </div>
      <div className="flex items-center gap-1 text-[11px] text-hg-muted whitespace-nowrap uppercase tracking-tighter">
        <span className="font-bold text-hg-text">Total Density:</span>
        <span className={`font-mono font-bold ${statusColor}`}>{metrics.total} CB</span>
      </div>
    </div>
  </div>
  );
};

const WorkloadBanner = ({ metrics, onAutoFix, onManualAdjust, leftOffset }: { 
  metrics: any; 
  onAutoFix: () => void; 
  onManualAdjust: () => void;
  leftOffset: number;
}) => {
  const isCritical = metrics.hasZeroCB;
  const isOptimized = metrics.isIndividualOverload || metrics.isGlobalOverload;

  if (!isCritical && !isOptimized) return null;

  const getBannerConfig = () => {
    if (metrics.roomsWithNoSeasons > 0) {
      return {
        bg: 'bg-hg-warning/10 border-hg-warning/20',
        iconBg: 'bg-hg-warning/20 text-hg-warning border-hg-warning/30',
        title: "Export Integrity Risk",
        subTitle: "text-hg-warning font-bold",
        message: `No exportable seasons generated for ${metrics.roomsWithNoSeasons} rooms. Check booking window, durations, and availability rules.`,
        footer: "text-hg-warning/70",
        footerMsg: "Empty data detected: These rooms will be omitted from the export if not corrected.",
        icon: AlertCircle
      };
    }
    
    if (metrics.trimmed > 0) {
      return {
        bg: 'bg-red-500/10 border-red-500/20',
        iconBg: 'bg-red-500/20 text-red-500 border-red-500/30',
        title: "Compliance Alert",
        subTitle: "text-red-400 font-bold",
        message: `${metrics.trimmed} rooms exceed the 31 ChargeBlock limit. Peakwork export may fail or lead to data loss.`,
        footer: "text-red-500/70",
        footerMsg: "Auto-Reduction active: System will deterministicly merge seasons to fit constraints.",
        icon: AlertTriangle
      };
    }
    
    return {
      bg: 'bg-hg-accent/5 border-hg-accent/10',
      iconBg: 'bg-hg-accent/20 text-hg-accent border-hg-accent/30',
      title: "Peakwork Healthy",
      subTitle: "text-hg-accent/80",
      message: "All rooms are within the 31 ChargeBlock limit. Output is safe for official export.",
      footer: "text-hg-accent/60",
      footerMsg: "System status: Verified & Compliant",
      icon: CheckCircle2
    };
  };

  const cfg = getBannerConfig();
  const Icon = cfg.icon;

  return (
    <div 
      style={{ left: `${leftOffset}px` }}
      className={`fixed top-[84px] left-0 right-0 h-[56px] border-b z-30 flex items-center px-4 gap-4 overflow-hidden shadow-lg animate-in slide-in-from-top duration-300 transition-none ${cfg.bg}`}
    >
      <div className={`flex items-center justify-center w-8 h-8 rounded-[2px] shrink-0 border ${cfg.iconBg}`}>
        <Icon size={20} />
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className={`text-[12px] font-bold uppercase tracking-tight ${metrics.trimmed > 0 ? 'text-red-500' : 'text-hg-accent'}`}>
            {cfg.title}
          </span>
          <span className={`text-[11px] ${cfg.subTitle}`}>
            {cfg.message}
          </span>
        </div>
        <div className={`text-[10px] truncate uppercase font-mono tracking-tighter font-bold opacity-70 ${cfg.footer}`}>
          {cfg.footerMsg}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {metrics.trimmed > 0 && (
          <button 
            onClick={onAutoFix}
            className="h-8 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-500 text-[10px] font-bold rounded-[2px] uppercase border border-red-500/30 transition-all"
          >
            Review Fix
          </button>
        )}
      </div>
    </div>
  );
};

interface FixPlan {
  product: ProductDefinition;
  importedARI: Record<string, ARIData>;
  changes: {
    durations?: [number, number];
    mealPlans?: [number, number];
    markets?: [number, number];
    occupancies?: [number, number];
    rooms?: number; // Total rooms removed
  };
  beforeComplexity: number;
  afterComplexity: number;
}

const AutoFixModal = ({ isOpen, onClose, plan, onApply }: { isOpen: boolean; onClose: () => void; plan: any; onApply: () => void }) => {
  if (!plan || !isOpen || !plan.changes) return null;
  const hasChanges = Object.keys(plan.changes).length > 0;
  
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[480px] bg-hg-bg border border-hg-border rounded-[2px] overflow-hidden shadow-2xl"
      >
        <div className="p-4 border-b border-hg-divider bg-hg-nav flex items-center justify-between">
          <h2 className="text-[13px] font-bold uppercase tracking-wider text-hg-text">Optimize Configuration</h2>
          <button onClick={onClose} className="text-hg-muted hover:text-hg-text transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar">
          <p className="text-[13px] text-hg-muted leading-relaxed">
            Deterministic trimming will maintain a strict budget of 31 chargeblocks per room.
            {hasChanges ? ' Optimization will keep your product within Peakwork limits while maintaining critical price density.' : ' No automated changes can achieve the budget.'}
          </p>
          
          {hasChanges && (
            <div className="space-y-3">
              {Object.entries(plan.changes).map(([key, change], idx) => (
                <div key={stableKey("audit-change", key, idx)} className="flex items-center justify-between p-3 bg-hg-nav border border-hg-divider rounded-[4px]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                      {key === 'stayDurations' ? <Calendar size={14} /> : 
                       key === 'occupancies' ? <Users size={14} /> : 
                       key === 'mealPlans' ? <Utensils size={14} /> : 
                       key === 'rooms' ? <HotelIcon size={14} /> : 
                       key === 'markets' ? <Globe size={14} /> : <Sparkles size={14} />}
                    </div>
                    <span className="text-[12px] font-bold uppercase tracking-wide text-hg-text">{key}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-hg-accent font-bold">{String(change)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {plan.hotelLogs && plan.hotelLogs.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-hg-divider">
              <h4 className="text-[11px] font-bold text-hg-muted uppercase tracking-widest">Detailed Audit Log</h4>
              <div className="space-y-3">
                {plan.hotelLogs.filter((l: any) => l.reductions.length > 0 || l.after > 154).map((log: any, idx: number) => (
                  <div key={stableKey("audit-log", log.id, idx)} className="p-3 bg-black/20 rounded border border-hg-divider font-mono text-[10px]">
                    <div className="flex justify-between items-start mb-2">
                       <span className="font-bold text-hg-text uppercase">{log.id}</span>
                       <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${log.status === 'Resolved' ? 'bg-hg-accent/20 text-hg-accent' : 'bg-red-500/20 text-red-500'}`}>
                         {log.status}
                       </span>
                    </div>
                    
                    <div className="text-hg-muted mb-1">Predicted before: {log.before}</div>
                    
                    {log.reductions.length > 0 && (
                      <div className="mb-1">
                        <div className="text-hg-text mb-0.5">Applied reductions:</div>
                        {log.reductions.map((r: string, i: number) => (
                          <div key={stableKey("log-red", log.id, i)} className="pl-2">- {r}</div>
                        ))}
                      </div>
                    )}
                    
                    <div className="text-hg-muted">Predicted after: <span className={log.after <= 154 ? 'text-hg-accent font-bold' : 'text-red-500 font-bold'}>{log.after}</span></div>
                    
                    {log.reason && (
                      <div className="mt-2 p-1.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-[2px] font-bold">
                        Reason: {log.reason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {plan.stillAbove && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded flex items-start gap-3">
              <AlertTriangle className="text-red-500 shrink-0" size={16} />
              <p className="text-[11px] text-red-500 font-bold uppercase tracking-wider leading-relaxed">
                Minimum achievable configuration still exceeds 154 chargeblocks. 
                Please reduce Destinations or select fewer Hotels manually.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-hg-divider">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-hg-muted uppercase tracking-tighter text-hg-accent">Predicted Charges</span>
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-bold text-hg-text line-through opacity-50">{plan.beforeComplexity}</span>
                <ArrowRight size={14} className="text-hg-accent" />
                <span className="text-[20px] font-bold text-hg-accent">{plan.afterComplexity}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 bg-hg-nav border-t border-hg-divider flex justify-end gap-3 px-6 pb-6">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-[11px] font-bold uppercase text-hg-muted hover:text-hg-text transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onApply}
            disabled={!hasChanges || plan.stillAbove}
            className="px-6 py-2 bg-hg-accent hover:bg-hg-accent-dark text-hg-bg text-[11px] font-bold uppercase rounded-[2px] transition-colors shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Apply Fix
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const LogsView = ({ 
  logs, 
  filter, 
  setFilter, 
  onBack, 
  onSelectDestination,
  selectedLogDestination,
  setSelectedLogDestination,
  isMobile,
  setSelectedLogForCompare,
  setNotification
}: { 
  logs: DestinationLog[], 
  filter: any, 
  setFilter: any, 
  onBack: () => void, 
  onSelectDestination: (d: string) => void,
  selectedLogDestination: string | null,
  setSelectedLogDestination: (d: string | null) => void,
  isMobile: boolean,
  setSelectedLogForCompare: (log: DestinationLog | null) => void,
  setNotification: (n: { message: string, type: 'success' | 'warning' | 'error' | 'info' }) => void
}) => {
  const filteredLogs = logs.filter(log => {
    // Search by name or IATA
    if (filter.search && !log.name.toLowerCase().includes(filter.search.toLowerCase()) && !log.destination.toLowerCase().includes(filter.search.toLowerCase())) return false;
    if (filter.status?.length > 0 && !filter.status.includes(log.status)) return false;
    if (filter.blockedOnly && log.hotelsBlocked === 0) return false;
    if (filter.trimmedOnly && log.hotelsTrimmed === 0) return false;
    
    if (filter.destinations?.length > 0 && !filter.destinations.includes(log.destination)) return false;
    if (filter.countries?.length > 0 && !filter.countries.includes(log.country)) return false;
    if (filter.users?.length > 0 && !filter.users.includes(log.triggeredBy)) return false;
    
    return true;
  });

  const generateAuditReport = (log: DestinationLog) => {
    if (!log) {
      setNotification({ message: 'Audit report unavailable for this run', type: 'error' });
      return;
    }
    
    // Check for necessary data
    if (!log.manifest) {
      setNotification({ message: 'Detailed manifest data missing for this record', type: 'error' });
      return;
    }

    const m = log.manifest;
    const chunkingApplied = m.execution?.chunkingApplied || log.chunks.length > 1;
    const partitioningApplied = m.execution?.partitioningApplied || log.chunks.some(c => c.hotels.some(h => h.notes.includes('Part')));
    const safeName = log.name.replace(/[^a-z0-9]/gi, '_').toUpperCase();

    let reportText = `HyperGuest EDF Export Audit Report\n`;
    reportText += `==================================\n\n`;
    
    reportText += `Execution Summary:\n`;
    reportText += `------------------\n`;
    reportText += `Run ID: ${log.id}\n`;
    reportText += `Timestamp: ${log.lastGenerationTime}\n`;
    reportText += `User: ${log.triggeredBy} (${log.userEmail})\n`;
    reportText += `Destination: ${log.name} (${log.destination})\n`;
    reportText += `IATA: ${log.destination}\n`;
    reportText += `Country: ${log.country}\n`;
    reportText += `Hotels in Scope: ${log.hotelsInScope}\n`;
    reportText += `Hotels Generated: ${m.content?.hotelsGenerated || log.hotelsGenerated}\n`;
    reportText += `Files Generated: 1\n`;
    reportText += `Packaging Strategy: ${m.execution?.selectedPackagingStrategy || 'N/A'}\n`;
    reportText += `Chunking Applied: ${chunkingApplied ? 'YES' : 'NO'}\n`;
    reportText += `Partitioning Applied: ${partitioningApplied ? 'YES' : 'NO'}\n`;

    if (m.execution) {
      const d = m.execution;
      reportText += `\nExecution Decision Details:\n`;
      reportText += `Decision Logic: ${d.reason}\n`;
      reportText += `Note: ${d.note || 'N/A'}\n`;
      reportText += `Threshold Limit: ${d.threshold} CB\n`;
      reportText += `Raw Input Volume: ${d.totalInputCB} CB\n`;
      reportText += `Final Workload: ${d.finalOutputCB} CB\n`;
      reportText += `Trimming Applied: ${d.trimmingApplied ? 'YES' : 'NO'}\n`;
    }

    if (m.determinismAudit) {
      const db = m.determinismAudit;
      reportText += `\nDeterminism Audit:\n`;
      reportText += `------------------\n`;
      reportText += `Status: ${db.isDeterministic ? 'PASS' : 'FAIL'}\n`;
      reportText += `Input Fingerprint: ${db.inputFingerprint}\n`;
      reportText += `Config Fingerprint: ${db.configFingerprint}\n`;
      reportText += `Data Fingerprint: ${db.dataFingerprint}\n`;
      reportText += `Execution Fingerprint: ${db.executionFingerprint}\n`;
      reportText += `Notes: ${db.notes}\n`;
    }

    reportText += `\nContent Summary:\n`;
    reportText += `----------------\n`;
    reportText += `Total Items: ${m.content?.itemCount || log.hotelsGenerated}\n`;
    reportText += `Total Chargeblocks: ${m.content?.totalChargeblocks || 'N/A'}\n`;
    reportText += `Hotels Trimmed: ${log.hotelsTrimmed}\n`;
    reportText += `Hotels Blocked: ${log.hotelsBlocked}\n\n`;
    
    if (partitioningApplied) {
      const partsCount = log.chunks.reduce((acc, c) => acc + c.hotels.filter(h => h.notes.includes('Part')).length, 0);
      reportText += `Hotel-Parts Generated: ${partsCount}\n`;
    }
    
    if (chunkingApplied) {
      reportText += `Chunks Generated: ${log.chunks.length}\n`;
    }
    
    reportText += `\nExecution Notes:\n`;
    reportText += `----------------\n`;
    reportText += `${log.statusNote || 'No execution notes provided.'}\n\n`;
    
    reportText += `ARI Source Summary:\n`;
    reportText += `-------------------\n`;
    reportText += `Markets: ${m.pdSnapshot?.markets?.join(', ') || 'N/A'}\n`;
    reportText += `Meal Plans: ${m.pdSnapshot?.mealPlans?.join(', ') || 'N/A'}\n`;
    reportText += `Durations: ${m.pdSnapshot?.stayDurations?.join(', ') || 'N/A'}\n`;
    reportText += `Booking Window: ${m.pdSnapshot?.bookingWindowDays || 'N/A'} days\n\n`;
    
    reportText += `Hotel Drilldown:\n`;
    reportText += `----------------\n`;
    reportText += `HG ID | Status | Chargeblocks | Trim Applied | Notes\n`;
    log.chunks.forEach(chunk => {
      chunk.hotels.forEach(h => {
        reportText += `${h.hgId} | ${h.status} | ${h.chargeblocks} | ${h.trimApplied} | ${h.notes}\n`;
      });
    });

    try {
      const blob = new Blob([reportText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `AUDIT_REPORT_${safeName}_${log.id}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setNotification({ message: `Full Audit Report for ${log.destination} exported successfully.`, type: 'success' });
    } catch (err) {
      console.error("Report generation failed:", err);
      setNotification({ message: 'Failed to generate audit report file', type: 'error' });
    }
  };

  const uniqueDests = Array.from(new Set(logs.map(l => l.destination))).sort();
  const uniqueCountries = Array.from(new Set(logs.map(l => l.country))).sort();
  const uniqueUsers = Array.from(new Set(logs.map(l => l.triggeredBy))).sort();

  const selectedLog = logs.find(l => l.id + l.destination === selectedLogDestination);

  const exportCSV = () => {
    const headers = ['Destination', 'IATA', 'Country', 'Status', 'Hotels in Scope', 'Hotels Generated', 'Hotels Trimmed', 'Hotels Blocked', 'Last Run', 'Config ID'];
    const rows = logs.map(l => [l.name, l.destination, l.country, l.status, l.hotelsInScope, l.hotelsGenerated, l.hotelsTrimmed, l.hotelsBlocked, l.lastGenerationTime, l.configId]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "edf_generation_summary.csv");
    link.click();
  };

  const exportDetailsCSV = (log: DestinationLog) => {
    const headers = ['HG ID', 'Hotel Name', 'GIATA', 'PW ID', 'Status', 'Chargeblocks', 'Trim Applied', 'Notes'];
    const allHotels = log.chunks.flatMap(c => c.hotels);
    const rows = allHotels.map(h => [h.hgId, h.name, h.giataId, h.pwId, h.status, h.chargeblocks, h.trimApplied, h.notes]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `edf_details_${log.destination}.csv`);
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-hg-nav rounded transition-colors text-hg-muted hover:text-hg-text">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-[20px] font-bold text-hg-text tracking-tight uppercase tracking-[0.05em]">EDF Generation Log</h1>
            <p className="text-[11px] text-hg-muted font-medium opacity-60">Human-readable summary of the last 24 hours</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-hg-nav border border-hg-border rounded text-[10px] font-bold uppercase text-hg-text hover:bg-hg-border transition-colors tracking-widest shadow-sm">
            <Download size={14} className="text-hg-accent" /> Export Summary
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-hg-nav border border-hg-border p-5 rounded-lg shadow-sm group hover:border-hg-accent/30 transition-colors">
          <span className="text-[10px] font-bold text-hg-muted uppercase block mb-1 tracking-widest opacity-50">Destinations Processed</span>
          <span className="text-[26px] font-bold text-hg-text font-mono tracking-tighter">{new Set(logs.map(l => l.destination)).size}</span>
        </div>
        <div className="bg-hg-nav border border-hg-border p-5 rounded-lg shadow-sm group hover:border-hg-accent/30 transition-colors">
          <span className="text-[10px] font-bold text-hg-muted uppercase block mb-1 tracking-widest opacity-50">Hotels Generated</span>
          <span className="text-[26px] font-bold text-hg-accent font-mono tracking-tighter">{logs.reduce((acc, l) => acc + l.hotelsGenerated, 0)}</span>
        </div>
        <div className="bg-hg-nav border border-hg-border p-5 rounded-lg shadow-sm group hover:border-hg-warning/30 transition-colors">
          <span className="text-[10px] font-bold text-hg-muted uppercase block mb-1 tracking-widest opacity-50">Hotels Trimmed</span>
          <span className="text-[26px] font-bold text-hg-warning font-mono tracking-tighter">{logs.reduce((acc, l) => acc + l.hotelsTrimmed, 0)}</span>
        </div>
        <div className="bg-hg-nav border border-hg-border p-5 rounded-lg shadow-sm group hover:border-red-500/30 transition-colors">
          <span className="text-[10px] font-bold text-hg-muted uppercase block mb-1 tracking-widest opacity-50">Hotels Blocked</span>
          <span className="text-[26px] font-bold text-red-500 font-mono tracking-tighter">{logs.reduce((acc, l) => acc + l.hotelsBlocked, 0)}</span>
        </div>
      </div>

      <div className="bg-hg-nav border border-hg-border rounded-xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-hg-border bg-black/20">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <Filter size={16} className="text-hg-accent" />
                 <h2 className="text-[12px] font-bold text-hg-text uppercase tracking-widest">Inventory Filters</h2>
               </div>
               <div className="flex items-center gap-3">
                 <button 
                   onClick={() => setFilter({ ...filter, trimmedOnly: !filter.trimmedOnly })}
                   className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all duration-200 border ${filter.trimmedOnly ? 'bg-hg-warning border-hg-warning text-black shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 'bg-hg-bg text-hg-muted border-hg-border hover:border-hg-warning'}`}
                 >
                   Trimmed Only
                 </button>
                 <button 
                   onClick={() => setFilter({ ...filter, blockedOnly: !filter.blockedOnly })}
                   className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all duration-200 border ${filter.blockedOnly ? 'bg-red-500 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-hg-bg text-hg-muted border-hg-border hover:border-red-500'}`}
                 >
                   Blocked Only
                 </button>
                 <div className="w-[1px] h-4 bg-hg-border mx-1" />
                 <button 
                   onClick={() => setFilter({ ...filter, search: '', status: ['Complete'], trimmedOnly: false, blockedOnly: false, destinations: [], countries: [], users: [] })}
                   className="text-[10px] font-bold text-hg-muted hover:text-hg-accent uppercase transition-colors flex items-center gap-1.5"
                 >
                   <Trash2 size={12} /> Reset All
                 </button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              <div className="flex flex-col gap-1.5 lg:col-span-1">
                <label className="text-[9px] font-bold text-hg-muted uppercase tracking-wider">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-hg-muted opacity-50" size={12} />
                  <input 
                    type="text" 
                    placeholder="Search Name / IATA..."
                    value={filter.search}
                    onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                    className="w-full h-[36px] bg-hg-bg border border-hg-border rounded-md pl-9 pr-4 py-2 text-[12px] focus:outline-none focus:border-hg-accent transition-all hover:border-hg-muted/50 font-medium"
                  />
                </div>
              </div>

              <SearchableMultiSelect 
                label="Status"
                placeholder="All Statuses"
                options={[
                  { label: 'Complete', value: 'Complete' },
                  { label: 'Partial', value: 'Partial' },
                  { label: 'Blocked', value: 'Blocked' },
                  { label: 'Not Generated', value: 'Not Generated' }
                ]}
                selectedValues={filter.status}
                onChange={(vals) => setFilter({ ...filter, status: vals })}
              />

              <SearchableMultiSelect 
                label="Country"
                placeholder="All Countries"
                options={uniqueCountries.map(c => ({ label: c, value: c }))}
                selectedValues={filter.countries}
                onChange={(vals) => setFilter({ ...filter, countries: vals })}
              />

              <SearchableMultiSelect 
                label="Destination"
                placeholder="All Destinations"
                options={uniqueDests.map(d => ({ label: d, value: d }))}
                selectedValues={filter.destinations}
                onChange={(vals) => setFilter({ ...filter, destinations: vals })}
              />

              <SearchableMultiSelect 
                label="Triggered By"
                placeholder="All Users"
                options={uniqueUsers.map(u => ({ label: u, value: u }))}
                selectedValues={filter.users}
                onChange={(vals) => setFilter({ ...filter, users: vals })}
              />
            </div>
          </div>
        </div>

        {isMobile ? (
          <div className="space-y-4 px-1 pb-10">
                {(() => {
                  const keys = filteredLogs.map((log, idx) => stableKey("mobile-log-card", log.id, log.destination, log.configId, idx));
                  logKeyDuplication("LogsView (Mobile)", keys, filteredLogs);
                  return filteredLogs.map((log, idx) => {
                    const isExpanded = selectedLogDestination === log.id + log.destination;
                    return (
                      <div 
                        key={keys[idx]}
                        className={`bg-hg-panel border transition-all rounded-xl overflow-hidden ${isExpanded ? 'border-hg-accent ring-1 ring-hg-accent/20 shadow-lg' : 'border-hg-divider shadow-sm'}`}
                      >
                  <div className="p-4" onClick={() => setSelectedLogDestination(isExpanded ? null : log.id + log.destination)}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${log.status === 'Complete' ? 'bg-hg-success' : log.status === 'Partial' ? 'bg-hg-warning' : 'bg-red-500'}`} />
                          <h3 className="font-bold text-hg-text leading-tight">{log.name}</h3>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[10px] text-hg-muted">
                          <span className="bg-hg-nav px-1.5 rounded border border-hg-border/50">{log.destination}</span>
                          <span className="uppercase tracking-tighter">{log.country}</span>
                        </div>
                      </div>
                      <ChevronRight size={14} className={`text-hg-muted transition-transform duration-300 mt-1 ${isExpanded ? 'rotate-90 text-hg-accent' : ''}`} />
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-2">
                      <div className="bg-hg-bg/50 p-2 rounded-lg border border-hg-divider/30 text-center">
                        <div className="text-[14px] font-mono font-bold text-hg-text tabular-nums">{log.hotelsGenerated}</div>
                        <div className="text-[8px] uppercase font-bold text-hg-muted tracking-tighter">Hotels Gen</div>
                      </div>
                      <div className="bg-hg-bg/50 p-2 rounded-lg border border-hg-divider/30 text-center">
                        <div className={`text-[14px] font-mono font-bold tabular-nums ${log.hotelsTrimmed > 0 ? 'text-hg-warning' : 'text-hg-muted'}`}>{log.hotelsTrimmed}</div>
                        <div className="text-[8px] uppercase font-bold text-hg-muted tracking-tighter">Hotels Trim</div>
                      </div>
                      <div className="bg-hg-bg/50 p-2 rounded-lg border border-hg-divider/30 text-center">
                        <div className={`text-[14px] font-mono font-bold tabular-nums ${log.hotelsBlocked > 0 ? 'text-red-500' : 'text-hg-muted'}`}>{log.hotelsBlocked}</div>
                        <div className="text-[8px] uppercase font-bold text-hg-muted tracking-tighter">Hotels Block</div>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between text-[9px] text-hg-muted uppercase font-bold tracking-widest pt-3 border-t border-hg-divider/50">
                      <div className="flex items-center gap-1.5 opacity-60">
                        <Clock size={10} />
                        {new Date(log.lastGenerationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="flex items-center gap-1.5 text-hg-accent">
                        <User size={10} />
                        {log.triggeredBy.split(' ')[0]}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="border-t border-hg-divider bg-black/20 p-4 space-y-6"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[12px] font-bold text-hg-text uppercase tracking-wider flex items-center gap-2">
                             <FileText size={14} className="text-hg-accent" /> Manifest Details
                          </h4>
                          <span className="text-hg-accent font-mono text-[9px] font-bold opacity-70">Chunks: {log.chunks?.length || 0}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-[10px]">
                           <div className="space-y-1">
                              <span className="text-hg-muted uppercase font-bold">Scope</span>
                              <div className="text-hg-text font-mono bg-hg-bg px-2 py-1 rounded border border-hg-divider">{log.hotelsInScope} Hotels</div>
                           </div>
                           <div className="space-y-1">
                              <span className="text-hg-muted uppercase font-bold">ARI Sources</span>
                              <div className="text-hg-text font-mono bg-hg-bg px-2 py-1 rounded border border-hg-divider">{log.manifest?.pdSnapshot?.airports?.length || 0} Markets</div>
                           </div>
                        </div>
                        
                        <div className="space-y-2">
                          <span className="text-[10px] text-hg-muted uppercase font-bold">Notes</span>
                          <div className="text-[11px] text-hg-text leading-relaxed bg-hg-bg p-3 rounded-lg border border-hg-divider/30 italic">
                             "{log.statusNote}"
                          </div>
                        </div>

                        <button 
                          onClick={() => generateAuditReport(log)}
                          className="w-full h-11 hg-button-secondary border border-hg-accent/20 text-hg-accent text-[11px] font-bold flex items-center justify-center gap-2"
                        >
                          <Activity size={14} /> Full Audit Report
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
                  );
                });
              })()}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-black/20 text-hg-muted font-bold uppercase text-[9px] tracking-widest whitespace-nowrap">
                <tr>
                  <th className="px-6 py-4">Destination</th>
                  <th className="px-6 py-4">IATA</th>
                  <th className="px-6 py-4">Country</th>
                  <th className="px-6 py-4 text-center">Hotels in Scope</th>
                  <th className="px-6 py-4 text-center">Chunks</th>
                  <th className="px-6 py-4 text-center">Generated</th>
                  <th className="px-6 py-4 text-center">Trimmed</th>
                  <th className="px-6 py-4 text-center">Blocked</th>
                  <th className="px-6 py-4">Triggered By</th>
                  <th className="px-6 py-4">Last Run</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hg-border">
                {(() => {
                  const keys = filteredLogs.map((log, idx) => stableKey("log-row", log.id, log.destination, log.configId, idx));
                  logKeyDuplication("LogsView (Desktop)", keys, filteredLogs);
                  return filteredLogs.map((log, idx) => (
                    <React.Fragment key={keys[idx]}>
                    <tr className={`hover:bg-hg-border/30 transition-colors cursor-pointer group ${selectedLogDestination === log.id + log.destination ? 'bg-hg-accent/5' : ''}`} onClick={() => setSelectedLogDestination(selectedLogDestination === log.id + log.destination ? null : log.id + log.destination)}>
                    <td className="px-6 py-4">
                      <span className="font-bold text-hg-text group-hover:text-hg-accent transition-colors">
                        {log.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-hg-muted text-[11px]">{log.destination}</td>
                    <td className="px-6 py-4 text-hg-muted uppercase tracking-tighter text-[11px] font-medium">{log.country}</td>
                    <td className="px-6 py-4 text-center font-mono">{log.hotelsInScope}</td>
                    <td className="px-6 py-4 text-center font-mono text-hg-accent font-bold">{log.chunks?.length || 0}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-hg-success-dim text-hg-success px-2 py-0.5 rounded text-[10px] font-bold font-mono">
                        {log.hotelsGenerated}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {log.hotelsTrimmed > 0 ? (
                        <span className="bg-hg-warning/10 text-hg-warning px-2 py-0.5 rounded text-[10px] font-bold font-mono">
                          {log.hotelsTrimmed}
                        </span>
                      ) : (
                        <span className="text-hg-muted/20">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {log.hotelsBlocked > 0 ? (
                        <span className="bg-red-500/10 text-red-500 px-2 py-0.5 rounded text-[10px] font-bold font-mono">
                          {log.hotelsBlocked}
                        </span>
                      ) : (
                        <span className="text-hg-muted/20">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-hg-text font-medium">{log.triggeredBy}</span>
                        <span className="text-[9px] text-hg-muted font-mono">{log.userEmail}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-hg-muted tabular-nums">
                      {new Date(log.lastGenerationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${log.status === 'Complete' ? 'bg-hg-success' : log.status === 'Partial' ? 'bg-hg-warning' : 'bg-red-500'}`} />
                        <div className="flex flex-col">
                          <span className="font-bold uppercase tracking-wide text-[10px]">{log.status}</span>
                          <span className="text-[9px] text-hg-muted whitespace-nowrap">{log.statusNote}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3 translate-x-3 group-hover:translate-x-0 opacity-0 group-hover:opacity-100 transition-all duration-200">
                         <ChevronRight size={16} className={`text-hg-muted transition-transform mt-1.5 ${selectedLogDestination === log.id + log.destination ? 'rotate-90' : ''}`} />
                      </div>
                    </td>
                  </tr>
                  {selectedLogDestination === log.id + log.destination && (
                    <tr>
                      <td colSpan={12} className="px-6 py-0 bg-[#0c0c0c] border-y border-hg-border/50">
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="py-8 space-y-8">
                          {/* A. Manifest Summary */}
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                              <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                  <h4 className="text-[14px] font-bold text-hg-text flex items-center gap-2">
                                    <FileText size={16} className="text-hg-accent" />
                                    Run Manifest Summary
                                  </h4>
                                  <p className="text-[10px] text-hg-muted uppercase tracking-widest font-bold font-mono text-hg-accent/70">{log.manifest?.id || 'NO-MANIFEST-ID'}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <button 
                                    onClick={() => generateAuditReport(log)}
                                    className="hg-button-secondary py-1.5 px-3 h-auto text-[10px] font-bold flex items-center gap-2 border border-hg-accent/20 text-hg-accent hover:bg-hg-accent/10"
                                  >
                                    <Activity size={12} /> Full Audit
                                  </button>
                                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    log.status === 'Complete' ? 'bg-hg-success/10 text-hg-success border border-hg-success/20' : 
                                    'bg-hg-warning/10 text-hg-warning border border-hg-warning/20'
                                  }`}>
                                    Overall: {log.status}
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="p-3 bg-white/5 rounded border border-white/5 space-y-1">
                                  <span className="text-[9px] text-hg-muted uppercase font-bold tracking-tighter">Run ID</span>
                                  <span className="text-[12px] text-hg-text font-mono block truncate">{log.id}</span>
                                </div>
                                <div className="p-3 bg-white/5 rounded border border-white/5 space-y-1">
                                  <span className="text-[9px] text-hg-muted uppercase font-bold tracking-tighter">Triggered By</span>
                                  <span className="text-[12px] text-hg-text font-medium block">{log.triggeredBy}</span>
                                </div>
                                <div className="p-3 bg-white/5 rounded border border-white/5 space-y-1">
                                  <span className="text-[9px] text-hg-muted uppercase font-bold tracking-tighter">PD Version</span>
                                  <span className="text-[12px] text-hg-text font-bold text-hg-accent font-mono block">{log.configId}</span>
                                </div>
                                <div className="p-3 bg-white/5 rounded border border-white/5 space-y-1">
                                  <span className="text-[9px] text-hg-muted uppercase font-bold tracking-tighter">Session ID</span>
                                  <span className="text-[12px] text-hg-text font-mono block">{log.sessionId}</span>
                                </div>
                              </div>
                              
                              <div className="space-y-4">
                                <h5 className="text-[10px] font-bold text-hg-muted uppercase tracking-widest flex items-center gap-2">
                                  <BarChart4 size={12} />
                                  Processing Inventory
                                </h5>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                  <div className="bg-white/5 p-4 rounded-lg flex flex-col border border-hg-border/50">
                                    <span className="text-[9px] font-bold text-hg-muted uppercase tracking-widest mb-1">Hotels in Scope</span>
                                    <span className="text-xl font-mono font-bold text-hg-text">{log.hotelsInScope}</span>
                                    <span className="text-[9px] text-hg-muted mt-1 uppercase italic font-medium">Input workload</span>
                                  </div>
                                  <div className="bg-hg-success/5 p-4 rounded-lg flex flex-col border border-hg-success/20">
                                    <span className="text-[9px] font-bold text-hg-success uppercase tracking-widest mb-1">Generated Hotels</span>
                                    <span className="text-xl font-mono font-bold text-hg-success">{log.hotelsGenerated}</span>
                                    <span className="text-[9px] text-hg-success/70 mt-1 uppercase italic font-medium">Unique properties</span>
                                  </div>
                                  <div className="bg-hg-accent/5 p-4 rounded-lg flex flex-col border border-hg-accent/20">
                                    <span className="text-[9px] font-bold text-hg-accent uppercase tracking-widest mb-1">Content Units</span>
                                    <span className="text-xl font-mono font-bold text-hg-accent">{log.manifest?.content?.itemCount || log.hotelsGenerated}</span>
                                    <span className="text-[9px] text-hg-accent/70 mt-1 uppercase italic font-medium">Incl. Partitions</span>
                                  </div>
                                  <div className="bg-hg-warning/5 p-4 rounded-lg flex flex-col border border-hg-warning/20">
                                    <span className="text-[9px] font-bold text-hg-warning uppercase tracking-widest mb-1">Export Files</span>
                                    <span className="text-xl font-mono font-bold text-hg-warning">1</span>
                                    <span className="text-[9px] text-hg-warning/70 mt-1 uppercase italic font-medium">{log.chunks.length > 1 ? `${log.chunks.length} Chunks` : 'Single Batch'}</span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                  <div className="bg-white/5 px-4 py-3 rounded border border-hg-border/50">
                                    <span className="block text-[9px] font-bold text-hg-muted uppercase mb-1">Execution Mode</span>
                                    <span className="text-[11px] font-bold text-hg-text capitalize">{log.manifest?.execution?.selectedPackagingStrategy?.toLowerCase().replace('_', ' ') || 'Standard'}</span>
                                  </div>
                                  <div className="bg-white/5 px-4 py-3 rounded border border-hg-border/50">
                                    <span className="block text-[9px] font-bold text-hg-muted uppercase mb-1">Recovery applied</span>
                                    <span className="text-[11px] font-bold text-hg-text">{log.hotelsTrimmed > 0 ? 'Trimmed' : log.chunks.length > 1 ? 'Chunked' : 'None'}</span>
                                  </div>
                                  <div className="bg-white/5 px-4 py-3 rounded border border-hg-border/50">
                                    <span className="block text-[9px] font-bold text-hg-muted uppercase mb-1">Safety Policy</span>
                                    <span className="text-[11px] font-bold text-hg-text font-mono truncate">31 CB per Room</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Product Definition Snapshot */}
                              <div className="p-4 bg-white/5 rounded border border-white/5">
                                <h5 className="text-[10px] font-bold text-hg-muted uppercase mb-3 tracking-widest flex items-center gap-2">
                                  <Settings size={12} />
                                  Product Definition Snapshot
                                </h5>
                                <div className="flex flex-wrap gap-x-8 gap-y-4">
                                   <div className="space-y-1">
                                     <span className="text-[9px] text-hg-muted block">Markets</span>
                                     <div className="flex gap-1">
                                      {(() => {
                                        const markets = log.manifest?.pdSnapshot?.markets || [];
                                        const keys = markets.map((m, mIdx) => `log-market-badge-${log.id}-${m}-${mIdx}`);
                                        logKeyDuplication(`Log ${log.id} Markets`, keys, markets);
                                        return markets.map((m, mIdx) => <span key={keys[mIdx]} className="px-1.5 py-0.5 bg-hg-accent/10 text-hg-accent rounded text-[10px] font-bold">{m}</span>);
                                      })()}
                                    </div>
                                   </div>
                                   <div className="space-y-1">
                                     <span className="text-[9px] text-hg-muted block">Stay Durations</span>
                                     <span className="text-[10px] font-mono text-hg-text">[{(log.manifest?.pdSnapshot?.stayDurations || []).join(', ')}]</span>
                                   </div>
                                   <div className="space-y-1">
                                     <span className="text-[9px] text-hg-muted block">Booking Window</span>
                                     <span className="text-[10px] font-mono text-hg-text">{log.manifest?.pdSnapshot?.bookingWindowDays || '—'} Days</span>
                                   </div>
                                   <div className="space-y-1">
                                     <span className="text-[9px] text-hg-muted block">Meal Plans</span>
                                     <span className="text-[10px] font-mono text-hg-text">{(log.manifest?.pdSnapshot?.mealPlans || []).join(', ')}</span>
                                   </div>
                                </div>
                              </div>
                            </div>

                            {/* Timeline */}
                            <div className="bg-black/20 p-5 rounded-lg border border-hg-border/50">
                               <h4 className="text-[12px] font-bold text-hg-text mb-4 uppercase tracking-wider flex items-center gap-2">
                                 <Clock size={14} className="text-hg-accent" />
                                 Run Timeline
                               </h4>
                               <div className="space-y-4">
                                 {(() => {
                                   const events = log.events || [];
                                   const keys = events.map((event: any, idx: number) => stableKey("log", log.id, "event", event.type, event.timestamp, idx));
                                   logKeyDuplication(`Log ${log.id} Events`, keys, events);
                                   return events.map((event: any, idx: number) => (
                                     <div key={keys[idx]} className="flex gap-3 relative pb-4 last:pb-0">
                                       {idx < (log.events?.length || 0) - 1 && <div className="absolute left-[7px] top-4 w-0.5 h-full bg-hg-border/30" />}
                                       <div className={`w-[14px] h-[14px] rounded-full shrink-0 z-10 mt-1 border-2 border-hg-bg ${
                                         event.type === 'SUCCESS' ? 'bg-hg-success' : 
                                         event.type === 'ERROR' ? 'bg-red-500' :
                                         event.type === 'WARNING' ? 'bg-hg-warning' : 'bg-hg-accent'
                                       }`} />
                                       <div className="space-y-0.5">
                                         <p className="text-[11px] text-hg-text leading-tight">{event.action}</p>
                                         <span className="text-[9px] text-hg-muted font-mono">{new Date(event.timestamp).toLocaleTimeString()}</span>
                                       </div>
                                     </div>
                                   ));
                                 })()}
                               </div>
                            </div>
                          </div>

                          {/* B. Chunk Summary */}
                          <div className="space-y-4">
                             <div className="flex items-center justify-between">
                               <h4 className="text-[14px] font-bold text-hg-text flex items-center gap-2">
                                 <Database size={16} className="text-hg-accent" />
                                 Execution Chunks
                               </h4>
                               <div className="flex gap-4 items-center">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-hg-success" />
                                    <span className="text-[10px] text-hg-muted font-bold uppercase">Success</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-hg-warning" />
                                    <span className="text-[10px] text-hg-muted font-bold uppercase">Trimmed</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500" />
                                    <span className="text-[10px] text-hg-muted font-bold uppercase">Blocked</span>
                                  </div>
                               </div>
                             </div>

                             <div className="border border-hg-border rounded-lg overflow-hidden bg-white/5 shadow-inner">
                               <table className="w-full text-left text-[11px]">
                                 <thead className="bg-black/30 text-hg-muted font-bold uppercase text-[9px] tracking-wider">
                                   <tr>
                                     <th className="px-6 py-3">Chunk ID / File Name</th>
                                     <th className="px-6 py-3 text-center">Strategy</th>
                                     <th className="px-6 py-3 text-center">Hotels</th>
                                     <th className="px-6 py-3 text-center">Chargeblocks</th>
                                     <th className="px-6 py-3">Outcome</th>
                                     <th className="px-6 py-3">Status</th>
                                     <th className="px-6 py-3 text-right">Actions</th>
                                   </tr>
                                 </thead>
                                 <tbody className="divide-y divide-white/5">
                                   {(() => {
                                      const chunks = log.chunks || [];
                                      const keys = chunks.map((chunk, idx) => stableKey("log", log.id, "chunk", chunk.id, chunk.fileName, idx));
                                      logKeyDuplication(`Log ${log.id} Chunks`, keys, chunks);
                                      return chunks.map((chunk, idx) => (
                                        <tr key={keys[idx]} className="hover:bg-white/5 transition-colors group/chunk">
                                          <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                              <span className="text-hg-text font-bold">{chunk.id}</span>
                                              <span className="text-[10px] text-hg-muted italic">{chunk.fileName}</span>
                                            </div>
                                          </td>
                                          <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                              <span className="text-hg-text text-[10px] font-mono">{chunk.strategy.split(';')[0]}</span>
                                              <span className="text-hg-muted text-[9px] uppercase font-bold">{chunk.strategy.split(';')[1]?.trim()}</span>
                                            </div>
                                          </td>
                                          <td className="px-6 py-4 text-center font-mono font-bold text-hg-text">{chunk.hotelCount}</td>
                                          <td className="px-6 py-4 text-center">
                                             <div className="flex flex-col items-center">
                                               <span className="text-hg-accent font-mono font-bold">{chunk.actualChargeblocks}</span>
                                               <span className="text-hg-muted text-[9px] line-through opacity-40">{chunk.predictedChargeblocks}</span>
                                             </div>
                                          </td>
                                          <td className="px-6 py-4">
                                            <span className={`text-[10px] font-bold ${
                                              chunk.outcome === 'SUCCESS' ? 'text-hg-success' : 
                                              chunk.outcome === 'PARTIAL' ? 'text-hg-warning' : 'text-red-500'
                                            }`}>
                                              {chunk.outcome}
                                            </span>
                                          </td>
                                          <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase border ${
                                              chunk.status === 'Success' ? 'bg-hg-success/10 text-hg-success border-hg-success/20' :
                                              chunk.status === 'Trimmed' || chunk.status === 'Partial' ? 'bg-hg-warning/10 text-hg-warning border-hg-warning/20' :
                                              'bg-red-500/10 text-red-500 border-red-500/20'
                                            }`}>
                                              {chunk.status}
                                            </span>
                                          </td>
                                          <td className="px-6 py-4">
                                             <div className="flex justify-end gap-2 opacity-0 group-hover/chunk:opacity-100 transition-opacity">
                                                <button className="p-1.5 hover:bg-hg-accent/20 rounded text-hg-accent transition-colors" title="Download EDF">
                                                  <FileArchive size={14} />
                                                </button>
                                                <button className="p-1.5 hover:bg-hg-text/10 rounded text-hg-text/60 transition-colors" title="Chunk Info">
                                                  <Info size={14} />
                                                </button>
                                             </div>
                                          </td>
                                        </tr>
                                      ));
                                   })()}
                                 </tbody>
                               </table>
                             </div>
                          </div>

                          {/* C. Complete Hotel Inventory Details */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-[14px] font-bold text-hg-text flex items-center gap-2">
                                <HotelIcon size={16} className="text-hg-accent" />
                                Full Hotel Inventory Traceability
                              </h4>
                              <button onClick={() => exportDetailsCSV(log)} className="text-[10px] font-bold uppercase text-hg-accent hover:underline flex items-center gap-1.5">
                                <Download size={14} /> Export Detailed Trace CSV
                              </button>
                            </div>

                            <div className="border border-hg-border overflow-hidden rounded-lg bg-black/20">
                              <div className="max-h-[400px] overflow-y-auto">
                                <table className="w-full text-left text-[11px]">
                                  <thead className="bg-hg-nav text-hg-muted font-bold uppercase text-[9px] tracking-wider sticky top-0 z-20">
                                    <tr>
                                      <th className="px-6 py-3 border-b border-hg-border">HG ID / Name</th>
                                      <th className="px-6 py-3 border-b border-hg-border text-center">Chunk</th>
                                      <th className="px-6 py-3 border-b border-hg-border">GIATA ID</th>
                                      <th className="px-6 py-3 border-b border-hg-border">PW ID</th>
                                      <th className="px-6 py-3 border-b border-hg-border">Status</th>
                                      <th className="px-6 py-3 border-b border-hg-border text-center">CB</th>
                                      <th className="px-6 py-3 border-b border-hg-border">Trimming</th>
                                      <th className="px-6 py-3 border-b border-hg-border">Audit Notes</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-hg-border/30">
                                    {(() => {
                                      const hotels = (log.chunks || []).flatMap(c => (c.hotels || []).map(h => ({ ...h, chunkId: c.id })));
                                      const keys = hotels.map((h, idx) => stableKey("log", log.id, "hotel", getExecutionUnitKey(h), idx));
                                      logKeyDuplication(`Log ${log.id} Inventory`, keys, hotels);
                                      return hotels.map((h, idx) => (
                                        <tr key={keys[idx]} className="hover:bg-white/5 transition-colors group/row">
                                          <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                              <span className="font-bold text-hg-text group-hover/row:text-hg-accent transition-colors">{h.name}</span>
                                              <span className="text-[9px] font-mono text-hg-muted uppercase tracking-tighter mt-0.5">{h.hgId}</span>
                                            </div>
                                          </td>
                                          <td className="px-6 py-4 text-center">
                                            <span className="text-[10px] font-mono text-hg-accent/70 bg-hg-accent/5 px-2 py-0.5 rounded">{h.chunkId?.split('_').pop()}</span>
                                          </td>
                                          <td className="px-6 py-4 font-mono text-[10px] text-hg-muted">{h.giataId}</td>
                                          <td className="px-6 py-4 font-mono text-[10px] text-hg-muted tracking-tighter">{h.pwId}</td>
                                          <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase border ${
                                              h.status === 'Generated' ? 'bg-hg-success/10 text-hg-success border-hg-success/20' :
                                              h.status === 'Generated with Trim' ? 'bg-hg-warning/10 text-hg-warning border-hg-warning/20' :
                                              'bg-red-500/10 text-red-500 border-red-500/20'
                                            }`}>
                                              {h.status}
                                            </span>
                                          </td>
                                          <td className="px-6 py-4 text-center font-mono font-bold tabular-nums text-hg-text">{h.chargeblocks}</td>
                                          <td className="px-6 py-4">
                                            <span className={`text-[10px] font-medium ${h.trimApplied !== 'None' ? 'text-hg-warning' : 'text-hg-muted opacity-30 text-[9px]'}`}>
                                              {h.trimApplied || '—'}
                                            </span>
                                          </td>
                                          <td className="px-6 py-4 text-hg-muted text-[10px] italic leading-snug">
                                            {h.notes}
                                          </td>
                                        </tr>
                                      ));
                                    })()}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ));
            })()}
            </tbody>
          </table>
        </div>
      )}

      {filteredLogs.length === 0 && (
          <div className="p-12 text-center">
             <div className="w-12 h-12 bg-hg-border/50 rounded-full flex items-center justify-center mx-auto mb-4 text-hg-muted">
                <Search size={24} />
             </div>
             <p className="text-hg-muted text-[13px]">No matching logs found for your filters.</p>
             <button onClick={() => setFilter({ ...filter, search: '', status: 'all', trimmedOnly: false, blockedOnly: false, iata: '' })} className="text-hg-accent text-[11px] font-bold uppercase mt-2 hover:underline">Clear all filters</button>
          </div>
        )}
      </div>
    </div>
  );
};

const PRESETS: Record<string, Partial<ProductDefinition>> = {
  'City Break': {
    stayDurations: [2, 3, 4, 5],
    mealPlans: ['RO', 'BB'],
    occupancies: [{ id: 'occ-cb-1', adults: 2, children: 0, ageFrom: 0, ageTo: 0 }]
  },
  'Beach Holiday': {
    stayDurations: [5, 6, 7, 8, 9, 10],
    mealPlans: ['BB', 'HB', 'AI'],
    occupancies: [
      { id: 'occ-bh-1', adults: 2, children: 0, ageFrom: 0, ageTo: 0 },
      { id: 'occ-bh-2', adults: 2, children: 1, ageFrom: 2, ageTo: 12 }
    ]
  },
  'Family Package': {
    stayDurations: [7, 8, 9, 10, 11, 12, 13, 14],
    mealPlans: ['HB', 'AI'],
    occupancies: [
      { id: 'occ-fp-1', adults: 2, children: 1, ageFrom: 2, ageTo: 12 },
      { id: 'occ-fp-2', adults: 2, children: 2, ageFrom: 2, ageTo: 12 }
    ]
  }
};

const PRODUCT_LIMITS = {
  [ExecutionMode.REGRESSION]: {
    hotels: 20,
    roomsPerHotel: 4,
    mealPlans: 4,
    occupancies: 3,
    stayDurations: 6,
    markets: 3,
    airports: 4,
    edfCombinations: 255
  },
  [ExecutionMode.STRESS]: {
    hotels: 50,
    roomsPerHotel: 8,
    mealPlans: 8,
    occupancies: 6,
    stayDurations: 14,
    markets: 10,
    airports: 10,
    edfCombinations: 500
  },
  [ExecutionMode.PRODUCTION]: {
    hotels: 100,
    stayDurations: 21,
    occupancies: 10,
    mealPlans: 10,
    markets: 20,
    airports: 50,
    edfCombinations: 1000
  }
};

// --- Main App ---

const PortalDropdown = ({ 
  anchorEl, 
  onClose, 
  children,
  width = 'w-64'
}: { 
  anchorEl: HTMLElement | null, 
  onClose: () => void, 
  children: React.ReactNode,
  width?: string
}) => {
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (!anchorEl) return;
    
    const updatePosition = () => {
      const rect = anchorEl.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [anchorEl]);

  if (!anchorEl) return null;
  
  return createPortal(
    <>
      <div className="fixed inset-0 z-[100]" onClick={onClose} />
      <div 
        className={`absolute z-[101] bg-hg-panel border border-hg-border shadow-2xl rounded overflow-hidden overflow-y-auto no-scrollbar ${width}`}
        style={{ 
          top: coords.top + 4, 
          left: coords.left,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </>,
    document.body
  );
};

const createChunk = (hotels: HotelLog[], index: number, destCode: string, configId: string, now: string): ChunkLog => {
  const cId = `${destCode}_CHUNK_${String(index).padStart(2, '0')}`;
  const cStatus: ChunkLog['status'] = hotels.every(hl => hl.status === 'Generated') ? 'Success' : 
                                     hotels.some(hl => hl.status === 'Blocked') ? 'Partial' : 'Trimmed';
  
  return {
    id: cId,
    index,
    fileName: `${destCode}_v${configId.split('-')[1]}_P${index}.zip`,
    status: cStatus,
    hotelCount: hotels.length,
    predictedChargeblocks: hotels.reduce((acc, hl) => acc + hl.chargeblocks, 0),
    actualChargeblocks: hotels.reduce((acc, hl) => acc + hl.chargeblocks, 0),
    trimApplied: cStatus === 'Trimmed' || cStatus === 'Partial' ? 'Mixed' : 'None',
    strategy: 'Dynamic Capacity Pack',
    outcome: 'SUCCESS',
    generatedAt: now,
    durationMs: 400 + (hotels.length * 40),
    notes: `Chunk ${index} finalized for ${destCode}`,
    hotels: [...hotels]
  };
};

const PackagingRulesDrawer = ({ 
  isOpen, 
  onClose, 
  children,
  isMobile,
  isTablet
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  children: React.ReactNode;
  isMobile: boolean;
  isTablet: boolean;
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={isMobile ? { y: '100%' } : { x: '100%' }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: '100%' } : { x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`absolute flex flex-col bg-hg-nav shadow-2xl z-[120] ${
              isMobile 
                ? 'inset-0 w-full h-full rounded-none' 
                : isTablet
                  ? 'inset-6 left-1/2 -translate-x-1/2 w-full max-w-4xl rounded-2xl border border-hg-border h-[calc(100%-3rem)]'
                  : 'top-0 right-0 bottom-0 w-[480px] border-l border-hg-border h-full'
            }`}
          >
            <div className="flex items-center justify-between p-4 border-b border-hg-border bg-hg-panel">
              <div className="flex items-center gap-3">
                <span className="bg-hg-accent text-hg-bg px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wider">Step 2</span>
                <h2 className="text-[12px] font-bold uppercase tracking-widest text-hg-text">Packaging Configuration</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-hg-muted hover:text-hg-text transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <div className="p-0">
                {children}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

type MobileStep = 'destinations' | 'hotels' | 'rules' | 'preview' | 'logs';

const logKeyDuplication = (component: string, keys: string[], items: any[]) => {
  const duplicates = keys.filter((k, i) => keys.indexOf(k) !== i);
  if (duplicates.length > 0) {
    console.error("DUPLICATE KEYS DETECTED", {
      component,
      keys,
      duplicates,
      items
    });
  }
};

const MobileHeader = ({ onMenu, onExport, title, isLandscape, activeTab, onTabChange }: { onMenu: () => void; onExport: () => void; title: string, isLandscape?: boolean, activeTab?: any, onTabChange?: any }) => (
  <header className={`fixed top-0 inset-x-0 ${isLandscape ? 'h-11' : 'h-14'} bg-hg-panel border-b border-hg-border z-[60] flex items-center justify-between px-3 max-w-full overflow-hidden box-border`}>
    <div className="flex items-center gap-2 min-w-0">
      <button onClick={onMenu} className="p-1.5 text-hg-muted hover:text-hg-accent transition-colors flex-shrink-0">
        <Menu size={isLandscape ? 18 : 20} />
      </button>
      <h1 className={`${isLandscape ? 'text-[11px]' : 'text-[14px]'} font-black uppercase tracking-tight text-hg-text truncate`}>{isLandscape ? 'HG EDF' : title}</h1>
    </div>

    {isLandscape && (
      <div className="flex items-center bg-black/20 rounded-lg p-0.5 border border-white/5">
        {[
          { id: 'product', label: 'Product' },
          { id: 'packaging', label: 'Rules' },
          { id: 'review', label: 'Review' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id ? 'bg-hg-accent text-hg-bg' : 'text-hg-muted hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    )}

    <button 
      onClick={onExport}
      className={`flex items-center gap-1.5 px-3 ${isLandscape ? 'h-7 py-0' : 'py-1.5'} bg-hg-accent/10 text-hg-accent rounded-lg text-[10px] font-bold uppercase tracking-wide border border-hg-accent/20 flex-shrink-0 ml-2`}
    >
      <Download size={14} />
      <span className={isLandscape ? 'inline' : 'hidden sm:inline'}>Export</span>
    </button>
  </header>
);

const MobileStepLabel = ({ step, total, name, isLandscape }: { step: number; total: number; name: string, isLandscape?: boolean }) => (
  <div className={`${isLandscape ? 'px-3 py-1' : 'px-4 py-2'} bg-hg-bg/50 border-b border-hg-border/30`}>
    <p className={`${isLandscape ? 'text-[8px]' : 'text-[10px]'} font-bold text-hg-muted uppercase tracking-wider`}>
      Step {step} of {total} — <span className="text-hg-text">{name}</span>
    </p>
  </div>
);

const MobileStepBar = ({ currentStep, totalSteps, stepName, isLandscape }: { currentStep: number; totalSteps: number, stepName: string, isLandscape?: boolean }) => (
  <div className={`fixed ${isLandscape ? 'top-11 h-9' : 'top-14 h-11'} inset-x-0 bg-hg-panel border-b border-hg-border z-50 flex items-center px-4 justify-between`}>
    {isLandscape ? (
      <>
        <div className="flex items-center gap-4">
          {[
            { id: 1, label: 'Destinations' },
            { id: 2, label: 'Hotels' },
            { id: 3, label: 'Export' }
          ].map(s => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${s.id === currentStep ? 'bg-hg-accent border-hg-accent' : 'bg-transparent border-hg-border'}`}>
                <span className={`text-[8px] font-black ${s.id === currentStep ? 'text-hg-bg' : 'text-hg-muted'}`}>{s.id}</span>
              </div>
              <span className={`text-[9px] font-black uppercase tracking-[0.1em] ${s.id === currentStep ? 'text-hg-text' : 'text-hg-muted'}`}>{s.label}</span>
              {s.id < 3 && <div className="w-4 h-px bg-hg-border mx-1" />}
            </div>
          ))}
        </div>
      </>
    ) : (
      <>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-hg-accent/20 border border-hg-accent/30 flex items-center justify-center">
            <span className="text-[10px] font-black text-hg-accent">{currentStep}</span>
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest text-hg-text">
            Step {currentStep} of {totalSteps} — {stepName}
          </span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 w-1.5 rounded-full ${i + 1 === currentStep ? 'bg-hg-accent' : i + 1 < currentStep ? 'bg-hg-accent/40' : 'bg-hg-divider'}`} 
            />
          ))}
        </div>
      </>
    )}
  </div>
);

const MobileDestinations = ({ destinations, onChange }: { destinations: string[], onChange: (vals: string[]) => void }) => {
  return (
    <div className="bg-hg-panel border border-hg-border rounded-2xl p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-hg-accent text-hg-bg">
          <Globe size={18} />
        </div>
        <div>
          <h3 className="text-[14px] font-black uppercase tracking-widest text-hg-text">Destinations</h3>
          <p className="text-[10px] font-bold text-hg-muted uppercase tracking-widest mt-0.5">{destinations.length} selected</p>
        </div>
      </div>

      <PredictiveDestinationSearch 
        selectedValues={destinations}
        onChange={onChange}
        isMobile={true}
      />
    </div>
  );
};

const MobileDiagnosticsSheet = ({ 
  isOpen, 
  onClose, 
  hotelsCount, 
  ariRows, 
  roomsCount, 
  product 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  hotelsCount: number, 
  ariRows: number, 
  roomsCount: number, 
  product: ProductDefinition 
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div key="diag-sheet" className="fixed inset-0 z-[100] flex flex-col justify-end">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-hg-panel border-t border-hg-border rounded-t-3xl p-6 pb-12 max-h-[85vh] overflow-y-auto no-scrollbar shadow-2xl"
          >
            <div className="w-12 h-1.5 bg-hg-divider rounded-full mx-auto mb-6" />
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-hg-accent text-hg-bg rounded-lg">
                   <Database size={18} />
                 </div>
                 <h2 className="text-[14px] font-black uppercase tracking-tighter text-hg-text">ARI Source Diagnostics</h2>
               </div>
               <button onClick={onClose} className="p-2 text-hg-muted hover:text-hg-text transition-colors"><X size={20} /></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
               {[
                 { label: 'Source ID', value: product.id.substring(0, 8) },
                 { label: 'Hotels', value: formatNumber(hotelsCount) },
                 { label: 'Destinations', value: product.destinations.length || 1 },
                 { label: 'ARI Records', value: formatNumber(ariRows) },
                 { label: 'Rooms Loaded', value: formatNumber(roomsCount) },
                 { label: 'Mealplans', value: product.mealPlans.length },
                 { label: 'Occupancies', value: product.occupancies.length },
                 { label: 'Price Range', value: '€80 - €300' }
               ].map((item, i) => (
                 <div key={i} className="bg-hg-bg p-4 rounded-xl border border-hg-border">
                   <div className="text-[9px] font-black text-hg-muted uppercase tracking-[0.2em] mb-1">{item.label}</div>
                   <div className="text-[14px] font-mono font-black text-hg-text">{item.value}</div>
                 </div>
               ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const MobileBottomBar = ({ onNext, metrics, canNext, onShowDiagnostics }: { onNext: () => void; metrics: any; canNext: boolean; onShowDiagnostics: () => void }) => (
  <div className="fixed bottom-0 inset-x-0 h-16 bg-hg-panel border-t border-hg-border z-50 flex items-center justify-between px-4 pb-safe gap-3">
    <button 
      onClick={onShowDiagnostics}
      className={`flex items-center gap-2 px-3 h-10 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all border border-hg-border shrink-0 bg-hg-bg hover:bg-white/5 active:scale-95`}
    >
      <Activity size={14} className="text-hg-accent" />
      <span>Diagnostics</span>
    </button>

    <div className="flex flex-col gap-0.5 min-w-0 flex-1 overflow-hidden">
      <div className="flex items-center gap-1.5 truncate">
        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${metrics.trimmed > 0 ? 'bg-hg-danger' : 'bg-hg-accent'}`} />
        <span className="text-[11px] font-black tabular-nums text-hg-text truncate">
          {formatNumber(metrics.total)} CB
        </span>
      </div>
      <span className="text-[9px] font-bold text-hg-muted uppercase tracking-tighter truncate leading-none">
        {metrics.trimmed > 0 ? `${formatNumber(metrics.trimmed)} Violations` : 'Policy Active'}
      </span>
    </div>
    
    <button 
      onClick={onNext}
      disabled={!canNext}
      className={`flex items-center gap-2 px-5 h-10 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shrink-0 ${
        canNext 
          ? 'bg-hg-accent text-hg-bg shadow-lg shadow-hg-accent/20 active:scale-95' 
          : 'bg-hg-border text-hg-muted cursor-not-allowed opacity-50'
      }`}
    >
      <span>Next</span>
      <ArrowRight size={14} />
    </button>
  </div>
);

const FlowProgress = ({ currentTab, isMobile }: { currentTab: string, isMobile?: boolean }) => {
  const steps = [
    { id: 'product', label: 'Destinations', step: 1 },
    { id: 'product', label: 'Hotels', step: 2 },
    { id: 'packaging', label: 'Rules', step: 3 },
    { id: 'review', label: 'Export', step: 4 },
  ];

  if (isMobile) {
    return (
      <div className="h-9 w-full bg-hg-panel border-b border-hg-border flex items-center px-4 overflow-x-auto no-scrollbar gap-4">
        {steps.map((step, idx) => {
          const isActive = currentTab === step.id;
          return (
            <div key={idx} className="flex items-center gap-2 shrink-0">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border transition-all ${
                isActive 
                  ? 'bg-hg-accent border-hg-accent text-hg-bg' 
                  : 'bg-neutral-900 border-neutral-800 text-neutral-500'
              }`}>
                {step.step}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${
                isActive ? 'text-white' : 'text-neutral-500'
              }`}>
                {step.label}
              </span>
              {idx < steps.length - 1 && <div className="w-4 h-px bg-hg-border" />}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 mb-8">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-[15px] left-0 right-0 h-0.5 bg-neutral-800 -z-10" />
        
        {steps.map((step, idx) => {
          const isActive = currentTab === step.id;
          
          return (
            <div key={idx} className="flex flex-col items-center gap-2 bg-hg-bg px-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black border-2 transition-all duration-500 ${
                isActive 
                  ? 'bg-hg-accent border-hg-accent text-hg-bg shadow-[0_0_15px_rgba(var(--hg-accent-rgb),0.3)]' 
                  : 'bg-neutral-900 border-neutral-800 text-neutral-500'
              }`}>
                {step.step}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-500 ${
                isActive ? 'text-white' : 'text-neutral-500'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const COUNTRY_INFO: Record<string, { name: string; region: string }> = {
  'AE': { name: 'United Arab Emirates', region: 'Middle East' },
  'EG': { name: 'Egypt', region: 'Middle East' },
  'ES': { name: 'Spain', region: 'Europe' },
  'GB': { name: 'United Kingdom', region: 'Europe' },
  'FR': { name: 'France', region: 'Europe' },
  'DE': { name: 'Germany', region: 'Europe' },
  'TH': { name: 'Thailand', region: 'Asia' },
  'SG': { name: 'Singapore', region: 'Asia' },
  'US': { name: 'United States', region: 'North America' },
  'JP': { name: 'Japan', region: 'Asia' },
  'NL': { name: 'Netherlands', region: 'Europe' }
};

function App() {
  const [applyGlobalRecommendations, setApplyGlobalRecommendations] = useState(false);

  useEffect(() => {
    if (applyGlobalRecommendations) {
      applyAllRecommendations();
    }
  }, [applyGlobalRecommendations]);

  const [activeDesktopTab, setActiveDesktopTab] = useState<'product' | 'packaging' | 'review'>('product');
  const [destinationsExpanded, setDestinationsExpanded] = useState(true);
  const [activeMobileStep, setActiveMobileStep] = useState<MobileStep>('destinations');
  const [step, setStep] = useState<Step>('builder');
  const [activeView, setActiveView] = useState<'builder' | 'logs'>('builder');
  const [selectedLogDestination, setSelectedLogDestination] = useState<string | null>(null);
  const [selectedLogForCompare, setSelectedLogForCompare] = useState<DestinationLog | null>(null);

  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1440,
    height: typeof window !== 'undefined' ? window.innerHeight : 900
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowSize.width < 768;
  const isLandscape = windowSize.width > windowSize.height && windowSize.width < 1400; // Expanded to cover tablets in landscape
  const isTablet = windowSize.width >= 768 && windowSize.width < 1200;
  const isDesktop = windowSize.width >= 1200;

  // GIATA Normalization State
  const [giataProperties, setGiataProperties] = useState<GiataProperty[]>([]);
  const [giataIndex, setGiataIndex] = useState<Map<string, GiataProperty[]>>(new Map());
  const [isGiataLoading, setIsGiataLoading] = useState(false);
  const [normalizedHotels, setNormalizedHotels] = useState<Hotel[]>([]);
  const [giataMappedFilter, setGiataMappedFilter] = useState('ALL');

  const handleResolveAmbiguity = (hotelId: string, candidate: GiataProperty) => {
    setNormalizedHotels(prev => prev.map(h => {
      if (h.id === hotelId) {
        return {
          ...h,
          normalization: {
            hgHotelId: h.hgId,
            status: NormalizationStatus.MATCHED,
            matchStatus: NormalizationStatus.MATCHED,
            giataId: candidate.giataId,
            matchedProperty: candidate,
            matchConfidence: 1.0,
            confidence: 1.0,
            matchMethod: 'MANUAL_RESOLUTION',
            lastUpdated: new Date().toISOString()
          }
        };
      }
      return h;
    }));
  };

  useEffect(() => {
    const loadGiataData = async () => {
      if (!import.meta.env.VITE_GIATA_DRIVE_API_KEY) {
        setGiataError('GIATA_API_KEY_MISSING');
        return;
      }

      setIsGiataLoading(true);
      try {
        const properties = await GiataDriveService.fetchGiataProperties();
        setGiataProperties(properties);
        setGiataIndex(GiataDriveService.buildGiataIndex(properties));
        setGiataError(null);
      } catch (err: any) {
        setGiataError(err.message || 'GIATA_LOAD_FAILED');
      } finally {
        setIsGiataLoading(false);
      }
    };

    loadGiataData();
  }, []);

  useEffect(() => {
    if (isMobile) {
      if (activeMobileStep === 'logs') {
        setActiveView('logs');
      } else {
        setActiveView('builder');
      }
    }
  }, [activeMobileStep, isMobile]);

  const [ariData] = useState<Record<string, any>>(PRELOADED_ARI);
  const [selectedStars, setSelectedStars] = useState<number[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [totalGiataHotels, setTotalGiataHotels] = useState(0);
  const [giataHotels, setGiataHotels] = useState<Hotel[]>([]);
  const [isGiataFetching, setIsGiataFetching] = useState(false);
  const [selectedHotelIds, setSelectedHotelIds] = useState<Set<string>>(new Set());
  const [allSelected, setAllSelected] = useState(false);
  const [deselectedIds, setDeselectedIds] = useState<Set<string>>(new Set());
  const [giataError, setGiataError] = useState<string | null>(null);
  const [isValidatingDeep, setIsValidatingDeep] = useState(false);

  const totalPages = Math.ceil(totalGiataHotels / limit);

  const isSelected = useCallback((id: string) => {
    return allSelected ? !deselectedIds.has(id) : selectedHotelIds.has(id);
  }, [allSelected, deselectedIds, selectedHotelIds]);

  const selectedHotelsCount = useMemo(() => {
    if (allSelected) {
      return Math.max(0, totalGiataHotels - deselectedIds.size);
    }
    return selectedHotelIds.size;
  }, [allSelected, totalGiataHotels, deselectedIds.size, selectedHotelIds.size]);

  // Legacy compatibility for components expecting and array
  const selectedHotels = useMemo(() => {
    return Array.from(selectedHotelIds);
  }, [selectedHotelIds]);

  const setSelectedHotels = useCallback((ids: string[] | ((prev: string[]) => string[])) => {
    if (typeof ids === 'function') {
      const nextIds = ids(Array.from(selectedHotelIds));
      setSelectedHotelIds(new Set(nextIds));
    } else {
      setSelectedHotelIds(new Set(ids));
    }
    setAllSelected(false);
    setDeselectedIds(new Set());
  }, [selectedHotelIds]);

  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const handleToggleHotel = (id: string) => {
    if (allSelected) {
      setDeselectedIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    } else {
      setSelectedHotelIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }
  };

  const handleToggleAll = () => {
    if (allSelected) {
      setAllSelected(false);
      setDeselectedIds(new Set());
      setSelectedHotelIds(new Set());
    } else {
      setAllSelected(true);
      setDeselectedIds(new Set());
      setSelectedHotelIds(new Set());
    }
  };

  const [state, setState] = useState<PackagingState>(() => {
    const initialDestinations = DESTINATIONS.map(d => d.code);
    
    return {
      productDefinition: {
        id: crypto.randomUUID(),
        name: 'Deterministic Baseline Run',
        destinations: initialDestinations,
        selectedClusters: [],
        markets: ['DE', 'GB'], 
        excludedMarkets: [],
        airports: ['FRA', 'LHR'], 
        marketAirports: { 
          'DE': ['FRA'],
          'GB': ['LHR']
        },
        marketOverrideStates: { 'DE': 'manual', 'GB': 'manual' },
        bookingWindowDays: 180,
        occupancies: Object.entries(COMMON_OCCUPANCIES).map(([id, occ]) => ({
          id,
          adults: occ.adults,
          children: occ.children,
          ageFrom: occ.ageFrom,
          ageTo: occ.ageTo
        })),
        stayDurations: [3, 4, 7, 10, 14],
        mealPlans: ['RO', 'BB', 'HB', 'AI'],
        createdAt: new Date().toISOString()
      },
      executionMode: ExecutionMode.REGRESSION,
      packagingStrategy: PackagingStrategy.BALANCED
    };
  });

  // Derived Indexes - Recomputes ONLY when ariData changes
  const ariIndexes = useMemo(() => buildAriIndexes(ariData, CONST_HOTELS), [ariData]);
  const hotels = ariIndexes.hotelSummaries;
  const inventory = hotels;

  const ariRowsCount = ariIndexes.ariRows;
  const uniqueRoomsCount = ariIndexes.roomCount;

  useEffect(() => {
    if (hotels.length > 0 && giataIndex.size > 0) {
      const normalized = GiataDriveService.performNormalization(hotels, giataIndex);
      setNormalizedHotels(normalized);
    } else if (hotels.length > 0) {
      setNormalizedHotels(hotels);
    }
  }, [hotels, giataIndex]);

  const [savedDefinitions, setSavedDefinitions] = useState<ProductDefinition[]>(() => {
    const saved = localStorage.getItem('hg_saved_definitions');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    console.log("--- ARI SYSTEM STATUS ---");
    console.log("ARI ROWS LOADED:", ariRowsCount);
    console.log("UNIQUE HOTELS:", hotels.length);
    console.log("UNIQUE ROOMS:", uniqueRoomsCount);
    console.log("-------------------------");

    if (ariRowsCount === 0 || hotels.length === 0) {
      console.error("ARI DATASET EMPTY — generation/loading failed");
    }
    
    // Auto-select first 20 hotels ONLY if selectedHotels is currently empty (e.g. on clean load)
    if (hotels.length > 0 && selectedHotels.length === 0) {
      const initialIds = hotels.slice(0, 20).map(h => h.id);
      setSelectedHotels(initialIds);
      console.log("INITIAL SELECTION SYNCED:", initialIds.length, "hotels.");
    }
  }, [hotels, ariRowsCount, uniqueRoomsCount]);

  const product = state.productDefinition;
  const limits = PRODUCT_LIMITS[state.executionMode];

  const metrics = useMemo(() => {
    // Calculate metrics based on CURRENTLY VISIBLE giataHotels that are selected
    // Note: In a full-scale app, these should come from the server for the entire selection
    const inScopeHotels = giataHotels.filter(h => isSelected(h.id));
    
    return {
      valid: inScopeHotels.length * 10, 
      trimmed: 0,
      total: inScopeHotels.length * 10,
      hasZeroCB: false,
      inScopeHotels: inScopeHotels,
      roomsWithNoSeasons: 0,
      complexityScore: inScopeHotels.length * 5,
      status: 'low',
      hotelComplexityMap: {} as Record<string, any>,
      inScope: inScopeHotels.length,
      hotelsWithRealARI: inScopeHotels.filter(h => h.hgId).length // Only hotels with HG ID have ARI in this mock
    };
  }, [giataHotels, isSelected]);

  const fetchHotels = useCallback(async () => {
    setIsGiataFetching(true);
    try {
      const response = await GiataDriveService.fetchPaginatedHotels({
        page,
        limit,
        search: searchTerm,
        destinations: product.destinations, // Global scope
        cities: selectedCities, // Local refinement
        stars: selectedStars,
        normalization: giataMappedFilter
      });
      setGiataHotels(response.items);
      setTotalGiataHotels(response.total);
    } catch (err) {
      setGiataError('FAILED_TO_LOAD_HOTELS');
    } finally {
      setIsGiataFetching(false);
    }
  }, [page, limit, searchTerm, product.destinations, selectedStars, giataMappedFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHotels();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchHotels]);

  const persistDefinitions = (defs: ProductDefinition[]) => {
    setSavedDefinitions(defs);
    localStorage.setItem('hg_saved_definitions', JSON.stringify(defs));
  };

  const saveCurrentDefinition = (name: string) => {
    const newDef = { 
      ...product, 
      id: (crypto as any).randomUUID(), 
      name, 
      createdAt: new Date().toISOString() 
    };
    persistDefinitions([newDef, ...savedDefinitions]);
    setNotification({ message: `Definition "${name}" saved successfully.`, type: 'success' });
  };

  const loadDefinition = (id: string) => {
    const def = savedDefinitions.find(d => d.id === id);
    if (def) {
      setState(prev => ({ ...prev, productDefinition: def }));
      setNotification({ message: `Loaded definition: ${def.name}`, type: 'success' });
    }
  };

  const applyPreset = (presetName: string) => {
    const preset = PRESETS[presetName];
    if (preset) {
      setState(prev => ({
        ...prev,
        productDefinition: {
          ...prev.productDefinition,
          ...preset,
          name: `${presetName} Preset`
        }
      }));
      setNotification({ message: `Applied ${presetName} preset.`, type: 'success' });
    }
  };

  const [isDurationsExpanded, setIsDurationsExpanded] = useState(false);
  const [expandedClusters, setExpandedClusters] = useState<Set<string>>(new Set());
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Hotel; direction: 'asc' | 'desc' } | null>(null);
  const [countryFilter, setCountryFilter] = useState<string[]>([]);
  const [showHotelFilters, setShowHotelFilters] = useState(false);
  const [customHotels, setCustomHotels] = useState<Hotel[] | null>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalBooking[] | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRunSummaryOpen, setIsRunSummaryOpen] = useState(false);
  const [isDiagnosticsPinned, setIsDiagnosticsPinned] = useState(false);
  const [diagnosticsPos, setDiagnosticsPos] = useState({ x: 0, y: 0 });
  const [isPackagingDrawerOpen, setIsPackagingDrawerOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const savedWidth = localStorage.getItem('hg_sidebar_width');
    return savedWidth ? parseInt(savedWidth, 10) : 280;
  });
  const [lastSidebarWidth, setLastSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['destinations']));

  const toggleSection = (id: string) => {
    const next = new Set(expandedSections);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedSections(next);
  };

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const stopResizing = () => {
    setIsResizing(false);
  };

  const resize = (e: MouseEvent) => {
    if (isResizing) {
      const newWidth = Math.min(Math.max(e.clientX, 60), 360);
      setSidebarWidth(newWidth);
    }
  };

  const resetSidebarWidth = () => {
    setSidebarWidth(280);
  };

  const toggleSidebarCollapse = () => {
    if (sidebarWidth > 60) {
      setLastSidebarWidth(sidebarWidth);
      setSidebarWidth(60);
    } else {
      setSidebarWidth(lastSidebarWidth > 60 ? lastSidebarWidth : 280);
    }
  };

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
      localStorage.setItem('hg_sidebar_width', sidebarWidth.toString());
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, sidebarWidth]);

  useEffect(() => {
    // Live ARI sync handled by fetchLiveARI effect
  }, []);

  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingHistory, setIsUploadingHistory] = useState(false);
  const [isMapping, setIsMapping] = useState(false);
  const sessionId = useMemo(() => `SES_${Math.floor(Date.now() / 1000)}_${Math.random().toString(36).substring(2, 7)}`.toUpperCase(), []);

  const [edfLogs, setEdfLogs] = useState<DestinationLog[]>(() => {
    const saved = localStorage.getItem('hg_edf_logs');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('hg_edf_logs', JSON.stringify(edfLogs));
  }, [edfLogs]);

  const [logFilter, setLogFilter] = useState({ 
    time: '24h', 
    search: '', 
    status: ['Complete'] as string[], 
    trimmedOnly: false, 
    blockedOnly: false, 
    destinations: [] as string[],
    countries: [] as string[],
    users: [] as string[]
  });
  const [isSmartMapping, setIsSmartMapping] = useState(false);
  const [exportDiagnostics, setExportDiagnostics] = useState<any[] | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const historyInputRef = useRef<HTMLInputElement>(null);
  const mappingInputRef = useRef<HTMLInputElement>(null);
  const ariInputRef = useRef<HTMLInputElement>(null);

  const handleMappingUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsMapping(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const mappingData = results.data as any[];
        const mappingMap = new Map<string, string>();
        
        mappingData.forEach(row => {
          const hgId = (row['HG ID'] || row['hgId'] || row['HGID'] || '').trim();
          const giataId = (row['Giata ID'] || row['giataId'] || row['GIATAID'] || row['GIATA'] || '').trim();
          if (hgId && giataId) {
            mappingMap.set(hgId, giataId);
          }
        });

        if (mappingMap.size === 0) {
          setNotification({ 
            message: 'No valid mapping data found. Please ensure your CSV has "HG ID" and "Giata ID" columns.', 
            type: 'error' 
          });
          setIsMapping(false);
          return;
        }

        const currentHotels = customHotels || hotels;
        let updatedCount = 0;
        const updatedHotels = currentHotels.map(h => {
          const newGiata = mappingMap.get(h.hgId);
          if (newGiata && (!h.giataId || h.giataId === '-')) {
            updatedCount++;
            return { ...h, giataId: newGiata };
          }
          return h;
        });

        setCustomHotels(updatedHotels);
        setNotification({ 
          message: `Successfully mapped ${updatedCount} hotels with GIATA IDs.`, 
          type: 'success' 
        });
        setIsMapping(false);
        if (event.target) event.target.value = '';
      },
      error: (error) => {
        setIsMapping(false);
        setNotification({ message: 'Error parsing mapping CSV.', type: 'error' });
        if (event.target) event.target.value = '';
      }
    });
  };

  const handleSmartMap = async (allMissing = false) => {
    let hotelsToMap: Hotel[] = [];
    
    if (allMissing) {
      hotelsToMap = filteredHotels.filter(h => !h.giataId || h.giataId === '-').slice(0, 20);
    } else {
      hotelsToMap = filteredHotels.filter(h => 
        selectedHotels.includes(h.id) && (!h.giataId || h.giataId === '-')
      ).slice(0, 20);
    }

    if (hotelsToMap.length === 0) {
      setNotification({ 
        message: allMissing ? 'No unmapped hotels found in current view.' : 'Please select hotels that are missing GIATA IDs to use Smart Map.', 
        type: 'error' 
      });
      return;
    }

    setIsSmartMapping(true);
    try {
      const { GoogleGenAI, Type } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `Search online for the GIATA IDs of the following hotels. 
      You must provide a GIATA ID for every hotel if possible, even if your confidence is low. 
      Use your search tool to find official GIATA Multicode mappings or hotel website references.
      
      Return ONLY a JSON array of objects with "hgId" and "giataId".
      
      Hotels:
      ${hotelsToMap.map(h => `- ${h.name} in ${h.city}, ${h.country} (HG ID: ${h.hgId})`).join('\n')}`;

      const response = await (ai.models as any).generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        tools: [{ googleSearch: {} }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                hgId: { type: Type.STRING },
                giataId: { type: Type.STRING }
              },
              required: ["hgId", "giataId"]
            }
          }
        }
      });

      const mappings = JSON.parse(response.text || '[]');
      if (mappings.length > 0) {
        const mappingMap = new Map<string, string>();
        mappings.forEach((m: any) => mappingMap.set(m.hgId, m.giataId));

        const currentHotels = customHotels || hotels;
        const updatedHotels = currentHotels.map(h => {
          const newGiata = mappingMap.get(h.hgId);
          if (newGiata) return { ...h, giataId: newGiata };
          return h;
        });

        setCustomHotels(updatedHotels);
        setNotification({ 
          message: `AI successfully mapped ${mappings.length} hotels.`, 
          type: 'success' 
        });
      } else {
        setNotification({ message: 'AI could not find GIATA IDs for the selected hotels.', type: 'error' });
      }
    } catch (error) {
      console.error('Smart Map Error:', error);
      setNotification({ message: 'AI mapping failed. Please try again later.', type: 'error' });
    } finally {
      setIsSmartMapping(false);
    }
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    if (!customHotels) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [customHotels]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [step, customHotels === null]);

  // --- Optimized Lookups ---
  const destinationLookup = useMemo(() => {
    const map = new Map<string, string>();
    DESTINATIONS.forEach(d => {
      map.set(d.code.toLowerCase(), d.code);
      map.set(d.name.toLowerCase(), d.code);
    });
    return map;
  }, []);

  const destinationNameLookup = useMemo(() => {
    const map = new Map<string, string>();
    DESTINATIONS.forEach(d => map.set(d.code, d.name));
    return map;
  }, []);

  const activeHotels = useMemo(() => (customHotels && customHotels.length > 0) ? customHotels : hotels, [customHotels, hotels]);

  const activeHotelsMap = useMemo(() => {
    const map = new Map<string, Hotel>();
    activeHotels.forEach(h => map.set(h.id, h));
    return map;
  }, [activeHotels]);

  const activeHotelsByHgIdMap = useMemo(() => {
    const map = new Map<string, Hotel>();
    activeHotels.forEach(h => map.set(h.hgId, h));
    return map;
  }, [activeHotels]);

  const hotelsWithIata = useMemo(() => {
    return activeHotels.map(hotel => {
      const hotelDest = hotel.destination || hotel.city;
      // First check if the destination is already an IATA code (length 3, uppercase)
      const isAlreadyIata = hotel.destination && hotel.destination.length === 3 && hotel.destination === hotel.destination.toUpperCase();
      let resolvedIata = isAlreadyIata ? hotel.destination : (CITY_TO_IATA[hotelDest] || CITY_TO_IATA[hotel.city || '']);
      
      if (!resolvedIata) {
        // ... rest of logic
        resolvedIata = destinationLookup.get(hotelDest.toLowerCase());
      }
      return { ...hotel, resolvedIata };
    });
  }, [activeHotels, destinationLookup]);

  const indexedHotels = useMemo(() => {
    return hotelsWithIata.map(h => {
      const ari = ariData[h.hgId] || {};
      const mealPlans = new Set<string>();
      const occupancies = new Set<string>();
      
      if (ari.rooms) {
        ari.rooms.forEach((r: any) => {
          if (r.seasons) {
            r.seasons.forEach((s: any) => {
              if (s.chargeblocks) {
                Object.keys(s.chargeblocks).forEach(key => {
                  const [mp, occ] = key.split('|');
                  if (mp) mealPlans.add(mp);
                  if (occ) occupancies.add(occ);
                });
              }
            });
          }
        });
      }

      const airportsInDest = AIRPORT_MAPPING[h.resolvedIata] || [];
      const airportSearch = airportsInDest.map(a => `${a.code} ${a.name}`).join(' ');

      const searchTerms = [
        h.name,
        h.city,
        h.country,
        h.resolvedIata,
        h.hgId,
        h.giataId,
        h.peakworkId,
        airportSearch,
        h.starRating ? `${h.starRating} star` : '',
        h.starRating ? String(h.starRating) : '',
        ...Array.from(mealPlans),
        ...Array.from(occupancies)
      ];

      return {
        ...h,
        iso: h.country,
        searchText: searchTerms.map(normalizeText).join(' ')
      };
    });
  }, [hotelsWithIata, ariData]);

  const hotelsWithIataMap = useMemo(() => {
    const map = new Map<string, any>();
    indexedHotels.forEach(h => map.set(h.id, h));
    return map;
  }, [indexedHotels]);

  const availableCities = useMemo(() => {
    const cities = new Set<string>();
    indexedHotels.forEach(h => {
      if (h.city) cities.add(h.city);
    });
    return Array.from(cities).sort();
  }, [indexedHotels]);

  const availableStars = useMemo(() => {
    const stars = new Set<number>();
    indexedHotels.forEach(h => {
      if (typeof h.starRating === 'number') stars.add(h.starRating);
    });
    return Array.from(stars).sort((a, b) => b - a);
  }, [indexedHotels]);

  const normalizeSearch = useCallback((value: string) =>
    String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " "), []);

  const activeDestinations = useMemo(() => {
    const destMap = new Map<string, { 
      id: string;
      code: string; 
      name: string; 
      cities: Set<string>; 
      countries: Set<string>; 
      hotelCount: number; 
      iso: string;
      region?: string;
      airportName?: string;
    }>();
    
    hotelsWithIata.forEach(h => {
      const iataCode = h.resolvedIata;
      if (!iataCode) return;
      
      if (!destMap.has(iataCode)) {
        const airportsInDest = AIRPORT_MAPPING[iataCode] || [];
        const airportName = airportsInDest.map(a => a.name).join(', ');
        
        destMap.set(iataCode, {
          id: iataCode,
          code: iataCode,
          name: destinationNameLookup.get(iataCode) || iataCode,
          cities: new Set(),
          countries: new Set(),
          hotelCount: 0,
          iso: DESTINATION_COUNTRY_MAP[iataCode] || '',
          airportName: airportName,
          region: COUNTRY_INFO[DESTINATION_COUNTRY_MAP[iataCode] || '']?.region || 'Global'
        });
      }
      const entry = destMap.get(iataCode)!;
      entry.hotelCount++;
      if (h.city) entry.cities.add(h.city);
      if (h.country) entry.countries.add(h.country);
    });

    return Array.from(destMap.values())
      .map(d => {
        const citiesArr = Array.from(d.cities);
        const countriesArr = Array.from(d.countries);
        const countryName = COUNTRY_INFO[d.iso]?.name || d.iso;
        
        const searchText = [
          d.code,
          d.name,
          d.iso,
          countryName,
          d.airportName,
          d.region,
          ...citiesArr,
          ...countriesArr
        ].filter(Boolean).join(" ");
        
        return {
          ...d,
          countryName,
          citiesArr,
          countriesArr,
          searchText: normalizeSearch(searchText)
        };
      })
      .sort((a, b) => b.hotelCount - a.hotelCount || a.name.localeCompare(b.name));
  }, [hotelsWithIata, destinationNameLookup, normalizeSearch]);

  const destinationOptions = useMemo(() => {
    return activeDestinations.map(d => ({
      label: `${d.name} · ${d.code} · ${d.countryName} · ${d.region}`,
      value: d.code,
      searchKeys: d.searchText.split(' ')
    }));
  }, [activeDestinations]);

  const allDestinationCountries = useMemo(() => {
    const countries = new Set<string>();
    activeDestinations.forEach(d => d.countries.forEach(c => countries.add(c)));
    return Array.from(countries).sort();
  }, [activeDestinations]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        const parsedHotels: Hotel[] = results.data.map((row: any, index: number) => {
          // Robust header matching
          const getVal = (keys: string[]) => {
            for (const key of keys) {
              if (row[key] !== undefined) return row[key];
              // Try case-insensitive match
              const actualKey = Object.keys(row).find(k => k.toLowerCase() === key.toLowerCase());
              if (actualKey) return row[actualKey];
            }
            return '';
          };

          return {
            id: `custom-${index}`,
            hgId: getVal(['HG ID', 'hgId', 'HGID', 'HyperGuest ID']),
            giataId: getVal(['Giata ID', 'giataId', 'GIATAID', 'GIATA']),
            peakworkId: getVal(['Peakwork ID', 'peakworkId', 'PEAKWORKID', 'PWID', 'PW']),
            name: getVal(['Hotel Name', 'name', 'HotelName', 'Hotel']),
            starRating: Number(getVal(['Star Rating', 'starRating', 'Stars', 'Rating']) || 0),
            city: getVal(['City', 'city', 'Town']),
            country: getVal(['Country', 'country']),
            destination: getVal(['Destination', 'destination', 'Dest', 'Airport Code', 'IATA', 'City', 'Town'])
          };
        }).filter((h: Hotel) => (h.hgId || h.giataId || h.peakworkId) && h.name);

        if (parsedHotels.length > 0) {
          const allIds = parsedHotels.map(h => h.id);
          const allDests = Array.from(new Set(parsedHotels.map(h => {
             const val = h.destination || h.city || '';
             const resolved = CITY_TO_IATA[val];
             if (resolved) return resolved;
             const found = DESTINATIONS.find(d => d.code.toLowerCase() === val.toLowerCase() || d.name.toLowerCase() === val.toLowerCase());
             return found ? found.code : null;
          }).filter(Boolean) as string[]));

          setCustomHotels(parsedHotels);
          setSelectedHotels(allIds);
          setState(prev => ({ 
            ...prev, 
            productDefinition: {
              ...prev.productDefinition,
              destinations: allDests
            } 
          }));
          setNotification({ 
            message: `Successfully loaded ${parsedHotels.length} hotels from CSV.`, 
            type: 'success' 
          });
        } else {
          setNotification({ 
            message: 'No valid hotel data found. Please ensure your CSV has headers like "HG ID" and "Hotel Name".', 
            type: 'error' 
          });
        }
        // Reset input so same file can be uploaded again if needed
        if (event.target) event.target.value = '';
        setIsUploading(false);
      },
      error: (error) => {
        setIsUploading(false);
        console.error('CSV Parsing Error:', error);
        setNotification({ message: 'Error parsing CSV file. Please check the format.', type: 'error' });
        if (event.target) event.target.value = '';
      }
    });
  };

  const handleHistoryUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingHistory(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        
        const parsedHistory = data.map(row => {
          const getVal = (keys: string[]) => {
            const key = Object.keys(row).find(k => keys.includes(k.trim()));
            return key ? row[key].trim() : '';
          };

          return {
            destination: getVal(['Destination', 'destination', 'Dest', 'IATA', 'Airport']),
            market: getVal(['Market', 'market', 'Source', 'Country', 'Origin']),
            stayDuration: parseInt(getVal(['Duration', 'duration', 'Nights', 'Stay'])),
            bookingWindowDays: parseInt(getVal(['Lead Time', 'leadTime', 'Booking Window', 'Window', 'LeadTime'])),
            occupancy: getVal(['Occupancy', 'occupancy', 'RoomType', 'Room']),
            mealPlan: getVal(['Meal Plan', 'mealPlan', 'MealPlan', 'Board'])
          };
        }).filter(b => b.destination && !isNaN(b.stayDuration));

        if (parsedHistory.length > 0) {
          setHistoricalData(parsedHistory);
          setNotification({ 
            message: `Successfully loaded ${parsedHistory.length} historical bookings. Recommendations updated.`, 
            type: 'success' 
          });
        } else {
          setNotification({ 
            message: 'No valid historical data found. Please check your CSV format.', 
            type: 'error' 
          });
        }
        if (event.target) event.target.value = '';
        setIsUploadingHistory(false);
      },
      error: (error) => {
        setIsUploadingHistory(false);
        setNotification({ message: 'Error parsing historical data CSV.', type: 'error' });
        if (event.target) event.target.value = '';
      }
    });
  };

  const [totalExported, setTotalExported] = useState(0);
  const [lastExportReport, setLastExportReport] = useState<ExportReport | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showFixModal, setShowFixModal] = useState(false);



  const [expandedHotels, setExpandedHotels] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<string[]>([]);

  const toggleHotelExpansion = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setExpandedHotels(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [destSearch, setDestSearch] = useState('');
  const [destCountryFilter, setDestCountryFilter] = useState<string[]>([]);
  const [showDestPredictive, setShowDestPredictive] = useState(false);
  const [marketSearch, setMarketSearch] = useState('');
  const [airportSearch, setAirportSearch] = useState('');

  // Cleanup destinations that don't match the country filter
  useEffect(() => {
    if (destCountryFilter.length > 0) {
      const validCultures = new Set(destCountryFilter);
      setState(prev => {
        const pd = prev.productDefinition;
        const newDests = pd.destinations.filter(dCode => {
          const destEntry = activeDestinations.find(ad => ad.code === dCode);
          if (!destEntry) return false;
          return Array.from(destEntry.countries).some(c => validCultures.has(c));
        });
        
        if (newDests.length !== pd.destinations.length) {
          return { 
            ...prev, 
            productDefinition: {
              ...pd,
              destinations: newDests
            }
          };
        }
        return prev;
      });
    }
  }, [destCountryFilter, activeDestinations]);

  const uniqueCities = useMemo(() => {
    const product = state.productDefinition || {} as any;
    const hotelsInScope = (product.destinations?.length || 0) === 0 
      ? hotelsWithIata 
      : hotelsWithIata.filter(h => (product.destinations || []).includes(h.resolvedIata));
    const cities = new Set(hotelsInScope.map(h => h.city));
    return Array.from(cities).sort();
  }, [state.productDefinition?.destinations, hotelsWithIata]);

  const uniqueCountries = useMemo(() => {
    const p = state.productDefinition || {} as any;
    const hotelsInScope = (p.destinations?.length || 0) === 0 
      ? hotelsWithIata 
      : hotelsWithIata.filter(h => (p.destinations || []).includes(h.resolvedIata));
    const countries = new Set(hotelsInScope.map(h => h.country));
    return Array.from(countries).sort();
  }, [state.productDefinition?.destinations, hotelsWithIata]);

  // Reset filters if they are no longer valid for the selected destinations
  useEffect(() => {
    setSelectedCities(prev => prev.filter(c => uniqueCities.includes(c)));
  }, [uniqueCities]);

  useEffect(() => {
    setCountryFilter(prev => prev.filter(c => uniqueCountries.includes(c)));
  }, [uniqueCountries]);

  // Recommended Durations & Booking Window based on selected destinations or historical data
  const [isCalculatingRecommendations, setIsCalculatingRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState<any>({ 
    destinations: [],
    stayDurations: [3, 7, 10, 14], 
    bookingWindowDays: 90, 
    occupancies: ['DBL', 'FAM1'], 
    mealPlans: ['BB', 'HB'] 
  });

  useEffect(() => {
    setIsCalculatingRecommendations(true);
    const timer = setTimeout(() => {
      const baseRecs = { stayDurations: [3, 7, 10, 14], bookingWindowDays: 90, occupancies: ['DBL', 'FAM1'], mealPlans: ['BB', 'HB'] };
      const p = state.productDefinition || {} as any;
      
      // Cluster overrides (Highest priority for commercial defaults)
      if (p.selectedClusters && p.selectedClusters.length > 0) {
        const cDurations = new Set<number>();
        const cMealPlans = new Set<string>();
        const cOccupancies = new Set<string>();
        let cWindow = 0;
        
        p.selectedClusters.forEach((cid: string) => {
          const cluster = MARKET_CLUSTERS.find(c => c.id === cid);
          if (cluster) {
            cluster.defaults.stayDurations.forEach(d => cDurations.add(d));
            cluster.defaults.mealPlans.forEach(m => cMealPlans.add(m));
            cluster.defaults.occupancies.forEach(o => cOccupancies.add(o));
            cWindow = Math.max(cWindow, cluster.defaults.bookingWindowDays);
          }
        });

        setRecommendations({
          ...baseRecs,
          stayDurations: Array.from(cDurations).sort((a,b) => a-b),
          mealPlans: Array.from(cMealPlans),
          occupancies: Array.from(cOccupancies),
          bookingWindowDays: cWindow,
          isHistorical: false,
          isClusterDriven: true
        });
        setIsCalculatingRecommendations(false);
        return;
      }

      if (historicalData && historicalData.length > 0) {
        const filtered = historicalData.filter(b => {
          const matchesDest = (p.destinations?.length || 0) === 0 || (p.destinations || []).includes(b.destination);
          const matchesMarket = (p.markets?.length || 0) === 0 || (p.markets || []).includes(b.market);
          return matchesDest && matchesMarket;
        });

        if (filtered.length > 0) {
          const durationFreq: Record<number, number> = {};
          const occupancyFreq: Record<string, number> = {};
          const mealPlanFreq: Record<string, number> = {};
          const destFreq: Record<string, number> = {};
          const marketFreq: Record<string, number> = {};
          let totalWindow = 0;

          filtered.forEach(b => {
            if (!isNaN(b.stayDuration)) durationFreq[b.stayDuration] = (durationFreq[b.stayDuration] || 0) + 1;
            if (b.occupancy) occupancyFreq[b.occupancy] = (occupancyFreq[b.occupancy] || 0) + 1;
            if (b.mealPlan) mealPlanFreq[b.mealPlan] = (mealPlanFreq[b.mealPlan] || 0) + 1;
            if (b.destination) destFreq[b.destination] = (destFreq[b.destination] || 0) + 1;
            if (b.market) marketFreq[b.market] = (marketFreq[b.market] || 0) + 1;
            if (!isNaN(b.bookingWindowDays)) totalWindow += b.bookingWindowDays;
          });

          const getTop = (freq: Record<any, number>, limit: number) => 
            Object.entries(freq)
              .sort((a, b) => b[1] - a[1])
              .slice(0, limit)
              .map(([val]) => val);

          setRecommendations({
            destinations: getTop(destFreq, 5),
            markets: getTop(marketFreq, 5),
            stayDurations: getTop(durationFreq, 5).map(Number).sort((a,b) => a-b),
            bookingWindowDays: Math.round(totalWindow / filtered.length),
            occupancies: getTop(occupancyFreq, 5),
            mealPlans: getTop(mealPlanFreq, 5),
            isHistorical: true
          });
          setIsCalculatingRecommendations(false);
          return;
        }
      }

      const pDests = p.destinations || [];
      const pMarkets = p.markets || [];

      if (pDests.length === 0 && pMarkets.length === 0) {
        setRecommendations({ 
          ...baseRecs, 
          destinations: ['PMI', 'AYT', 'HER', 'HRG', 'LPA'],
          markets: ['DE', 'GB', 'NL', 'FR', 'ES'],
          isHistorical: false 
        });
        setIsCalculatingRecommendations(false);
        return;
      }
      
      const durations = new Set<number>();
      const occupancies = new Set<string>();
      const mealPlans = new Set<string>();
      let totalWindowRec = 0;
      let countRec = 0;

      pDests.forEach(destCode => {
        const rec = DESTINATION_RECOMMENDATIONS[destCode];
        if (rec) {
          rec.stayDurations.forEach(d => durations.add(d));
          totalWindowRec += rec.bookingWindowDays;
          countRec++;
        }

        const destOccs = OCCUPANCY_RECOMMENDATIONS[destCode] || OCCUPANCY_RECOMMENDATIONS['DEFAULT'];
        const destMeals = MEAL_PLAN_RECOMMENDATIONS[destCode] || MEAL_PLAN_RECOMMENDATIONS['DEFAULT'];
        
        if (pMarkets.length > 0) {
          pMarkets.forEach(marketCode => {
            const marketOccs = destOccs[marketCode] || destOccs['DEFAULT'] || OCCUPANCY_RECOMMENDATIONS['DEFAULT']['DEFAULT'];
            marketOccs.forEach(o => occupancies.add(o));

            const marketMeals = destMeals[marketCode] || destMeals['DEFAULT'] || MEAL_PLAN_RECOMMENDATIONS['DEFAULT']['DEFAULT'];
            marketMeals.forEach(m => mealPlans.add(m));
          });
        } else {
          const defaultOccs = destOccs['DEFAULT'] || OCCUPANCY_RECOMMENDATIONS['DEFAULT']['DEFAULT'];
          defaultOccs.forEach(o => occupancies.add(o));

          const defaultMeals = destMeals['DEFAULT'] || MEAL_PLAN_RECOMMENDATIONS['DEFAULT']['DEFAULT'];
          defaultMeals.forEach(m => mealPlans.add(m));
        }
      });

      if (pDests.length === 0 && pMarkets.length > 0) {
        pMarkets.forEach(marketCode => {
          const defaultDestOccs = OCCUPANCY_RECOMMENDATIONS['DEFAULT'];
          const marketOccs = defaultDestOccs[marketCode] || defaultDestOccs['DEFAULT'];
          marketOccs.forEach(o => occupancies.add(o));

          const defaultDestMeals = MEAL_PLAN_RECOMMENDATIONS['DEFAULT'];
          const marketMeals = defaultDestMeals[marketCode] || defaultDestMeals['DEFAULT'];
          marketMeals.forEach(m => mealPlans.add(m));
        });
      }

      setRecommendations({
        destinations: ['PMI', 'AYT', 'HER', 'HRG', 'LPA'],
        markets: ['DE', 'GB', 'NL', 'FR', 'ES'],
        stayDurations: durations.size > 0 ? Array.from(durations).sort((a, b) => a - b) : baseRecs.stayDurations,
        bookingWindowDays: countRec > 0 ? Math.round(totalWindowRec / countRec) : baseRecs.bookingWindowDays,
        occupancies: occupancies.size > 0 ? Array.from(occupancies).slice(0, 5) : baseRecs.occupancies,
        mealPlans: mealPlans.size > 0 ? Array.from(mealPlans) : baseRecs.mealPlans,
        isHistorical: false
      });
      setIsCalculatingRecommendations(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [state.productDefinition?.destinations, state.productDefinition?.markets, state.productDefinition?.selectedClusters, historicalData]);

  const applyRecommendedOccupancies = () => {
    const recommendedOccs = recommendations.occupancies.map(key => ({
      id: crypto.randomUUID(),
      ...COMMON_OCCUPANCIES[key as keyof typeof COMMON_OCCUPANCIES]
    }));

    setState(prev => ({
      ...prev,
      productDefinition: {
        ...prev.productDefinition,
        occupancies: recommendedOccs
      }
    }));
  };

  const applyRecommendedMealPlans = () => {
    setState(prev => ({
      ...prev,
      productDefinition: {
        ...prev.productDefinition,
        mealPlans: recommendations.mealPlans
      }
    }));
  };

  const applyRecommendedBookingWindow = () => {
    setState(prev => ({
      ...prev,
      productDefinition: {
        ...prev.productDefinition,
        bookingWindowDays: recommendations.bookingWindowDays
      }
    }));
  };

  const addOccupancy = () => {
    setState(prev => ({
      ...prev,
      productDefinition: {
        ...prev.productDefinition,
        occupancies: [...prev.productDefinition.occupancies, { id: crypto.randomUUID(), adults: 2, children: 0, ageFrom: 0, ageTo: 0 }]
      }
    }));
  };

  const removeOccupancy = (id: string) => {
    setState(prev => ({
      ...prev,
      productDefinition: {
        ...prev.productDefinition,
        occupancies: prev.productDefinition.occupancies.filter(o => o.id !== id)
      }
    }));
  };

  const updateOccupancy = (id: string, field: string, value: number) => {
    setState(prev => ({
      ...prev,
      productDefinition: {
        ...prev.productDefinition,
        occupancies: prev.productDefinition.occupancies.map(o => o.id === id ? { ...o, [field]: value } : o)
      }
    }));
  };

  const applyRecommendedDurations = () => {
    setState(prev => ({
      ...prev,
      productDefinition: {
        ...prev.productDefinition,
        stayDurations: recommendations.stayDurations
      }
    }));
  };

  const applyAllRecommendations = () => {
    applyRecommendedDurations();
    applyRecommendedBookingWindow();
    applyRecommendedMealPlans();
    applyRecommendedOccupancies();
  };

  // Filtered Dropdown Options
  const filteredDestOptions = useMemo(() => {
    return activeDestinations.filter(d => {
      const matchesSearch = d.name.toLowerCase().includes(destSearch.toLowerCase()) || 
                           d.code.toLowerCase().includes(destSearch.toLowerCase());
      const matchesCountry = destCountryFilter.length === 0 || 
                            destCountryFilter.some(c => d.countries.has(c));
      return matchesSearch && matchesCountry;
    });
  }, [destSearch, destCountryFilter, activeDestinations]);

  const filteredMarketOptions = useMemo(() => {
    const search = marketSearch.toLowerCase();
    const clusters = MARKET_CLUSTERS.filter(c => 
      c.name.toLowerCase().includes(search) || 
      c.id.toLowerCase().includes(search)
    ).map(c => ({ ...c, isCluster: true, code: c.id }));
    
    const countries = COUNTRIES.filter(c => 
      c.name.toLowerCase().includes(search) || 
      c.code.toLowerCase().includes(search)
    ).map(c => ({ ...c, isCluster: false }));
    
    return [...clusters, ...countries];
  }, [marketSearch]);

  const toggleCluster = (clusterId: string) => {
    const cluster = MARKET_CLUSTERS.find(c => c.id === clusterId);
    if (!cluster) return;

    const isSelected = (product.selectedClusters || []).includes(clusterId);
    
    setState(prev => {
      const p = prev.productDefinition || {} as any;
      let newClusters: string[];
      let newMarkets: string[];
      let newExcluded: string[];
      const newOverrideStates = { ...(p.marketOverrideStates || {}) };

      if (isSelected) {
        newClusters = (p.selectedClusters || []).filter((id: string) => id !== clusterId);
        newMarkets = (p.markets || []).filter((m: string) => !cluster.countries.includes(m));
        newExcluded = (p.excludedMarkets || []).filter((m: string) => !cluster.countries.includes(m));
        cluster.countries.forEach(m => {
          if (newOverrideStates[m] === 'inherited') delete newOverrideStates[m];
        });
      } else {
        newClusters = [...(p.selectedClusters || []), clusterId];
        const uniqueNew = cluster.countries.filter(c => !(p.markets || []).includes(c));
        newMarkets = [...(p.markets || []), ...uniqueNew];
        newExcluded = (p.excludedMarkets || []).filter(m => !cluster.countries.includes(m));
        cluster.countries.forEach(m => {
          if (!newOverrideStates[m]) newOverrideStates[m] = 'inherited';
        });
        setExpandedClusters(prev => new Set(prev).add(clusterId));
      }

      return {
        ...prev,
        productDefinition: { 
          ...p, 
          selectedClusters: newClusters, 
          markets: newMarkets, 
          excludedMarkets: newExcluded,
          marketOverrideStates: newOverrideStates
        }
      };
    });
  };

  const toggleMarketInCluster = (marketCode: string) => {
    setState(prev => {
      const p = prev.productDefinition || {} as any;
      const isSelected = (p.markets || []).includes(marketCode);
      const isFromCluster = MARKET_CLUSTERS.some(c => (p.selectedClusters || []).includes(c.id) && c.countries.includes(marketCode));
      const newOverrideStates = { ...(p.marketOverrideStates || {}) };

      if (isSelected) {
        delete newOverrideStates[marketCode];
        return {
          ...prev,
          productDefinition: {
            ...p,
            markets: (p.markets || []).filter((m: string) => m !== marketCode),
            excludedMarkets: isFromCluster ? [...(p.excludedMarkets || []), marketCode] : (p.excludedMarkets || []),
            marketOverrideStates: newOverrideStates
          }
        };
      } else {
        newOverrideStates[marketCode] = isFromCluster ? 'inherited' : 'manual';
        return {
          ...prev,
          productDefinition: {
            ...p,
            markets: [...(p.markets || []), marketCode],
            excludedMarkets: (p.excludedMarkets || []).filter((m: string) => m !== marketCode),
            marketOverrideStates: newOverrideStates
          }
        };
      }
    });
  };

  const filteredAirportOptions = useMemo(() => {
    const availableAirports: { code: string; name: string }[] = [];
    (product.markets || []).forEach(marketCode => {
      const ports = AIRPORT_MAPPING[marketCode] || [];
      ports.forEach(p => {
        if (!availableAirports.find(ap => ap.code === p.code)) {
          availableAirports.push(p);
        }
      });
    });

    return availableAirports.filter(a => 
      a.name.toLowerCase().includes(airportSearch.toLowerCase()) || 
      a.code.toLowerCase().includes(airportSearch.toLowerCase())
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [product.markets, airportSearch]);

  const destPredictiveResults = useMemo(() => {
    if (!destSearch || destSearch.length < 1) return [];
    return activeDestinations.filter(d => 
      d.name.toLowerCase().includes(destSearch.toLowerCase()) || 
      d.code.toLowerCase().includes(destSearch.toLowerCase())
    ).slice(0, 8);
  }, [destSearch, activeDestinations]);

  const predictiveResults = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    return activeHotels.filter(h => 
      h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.hgId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.giataId.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 8);
  }, [searchTerm, activeHotels]);

  // Real-time Validation
  useEffect(() => {
    const newErrors: string[] = [];
    const newFieldErrors: Record<string, string> = {};
    const product = state.productDefinition || {} as any;
    
    if ((product.destinations?.length || 0) === 0) {
      newErrors.push("At least one destination must be selected.");
      newFieldErrors.destinations = "At least one destination must be selected.";
    }
    
    const destSet = new Set(product.destinations || []);
    const inScopeHotels = (selectedHotels || []).filter(id => {
      const h = hotelsWithIataMap.get(id);
      return h && (destSet.size === 0 || destSet.has(h.resolvedIata));
    });

    if (inScopeHotels.length === 0) {
      newErrors.push("At least one hotel within the selected destinations must be selected.");
      newFieldErrors.hotels = "At least one hotel within the selected destinations must be selected.";
    }
    if ((product.markets?.length || 0) === 0) {
      newErrors.push("At least one source market must be selected.");
      newFieldErrors.markets = "At least one source market must be selected.";
    }
    if ((product.airports?.length || 0) === 0) {
      newErrors.push("At least one departure airport must be selected.");
      newFieldErrors.airports = "At least one departure airport must be selected.";
    }
    if ((product.stayDurations?.length || 0) === 0) {
      newErrors.push("At least one duration must be selected.");
      newFieldErrors.stayDurations = "At least one duration must be selected.";
    }
    if ((product.mealPlans?.length || 0) === 0) {
      newErrors.push("At least one meal plan must be selected.");
      newFieldErrors.mealPlans = "At least one meal plan must be selected.";
    }

    const occupancyKeys = new Set();
    (product.occupancies || []).forEach((occ: any, index: number) => {
      const key = occ.children === 0 
        ? `${occ.adults}-0` 
        : `${occ.adults}-${occ.children}-${occ.ageFrom}-${occ.ageTo}`;
      
      if (occupancyKeys.has(key)) {
        const msg = `Duplicate occupancy combination at row ${index + 1}.`;
        newErrors.push(msg);
        newFieldErrors.occupancies = msg;
      }
      occupancyKeys.add(key);

      if (occ.children > 0) {
        if (occ.ageFrom < 2 || occ.ageFrom > 14) {
          const msg = `Child age from must be between 2 and 14 (Row ${index + 1}).`;
          newErrors.push(msg);
          newFieldErrors.occupancies = msg;
        }
        if (occ.ageTo < 2 || occ.ageTo > 14) {
          const msg = `Child age to must be between 2 and 14 (Row ${index + 1}).`;
          newErrors.push(msg);
          newFieldErrors.occupancies = msg;
        }
        if (occ.ageFrom > occ.ageTo) {
          const msg = `Child age from cannot be greater than age to (Row ${index + 1}).`;
          newErrors.push(msg);
          newFieldErrors.occupancies = msg;
        }
      }
    });

    setErrors(newErrors);
    setFieldErrors(newFieldErrors);
  }, [product, activeHotels]);

  const activeFilterCount = selectedCities.length + selectedStars.length + (searchTerm ? 1 : 0);

  // Filtered Hotels
  const filteredHotels = useMemo(() => {
    const result = normalizedHotels.filter(hotel => {
      const matchesCity = selectedCities.length === 0 || selectedCities.includes(hotel.city);
      const matchesStars = selectedStars.length === 0 || selectedStars.includes(hotel.starRating);
      
      const normName = hotel.normalization?.matchedProperty?.name?.toLowerCase() || '';
      const normGiataId = hotel.normalization?.giataId?.toString() || '';
      
      const matchesSearch = !searchTerm || 
                           hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           hotel.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           hotel.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           hotel.hgId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           normName.includes(searchTerm.toLowerCase()) ||
                           normGiataId.includes(searchTerm.toLowerCase());
      
      const status = hotel.normalization?.status || NormalizationStatus.UNMAPPED;
      const matchesGiata = giataMappedFilter === 'ALL' || 
                          (giataMappedFilter === 'MATCHED' && status === NormalizationStatus.MATCHED) || 
                          (giataMappedFilter === 'AMBIGUOUS' && status === NormalizationStatus.AMBIGUOUS) ||
                          (giataMappedFilter === 'UNMAPPED' && status === NormalizationStatus.UNMAPPED);

      return matchesCity && matchesStars && matchesSearch && matchesGiata;
    });

    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = (a as any)[sortConfig.key] || '';
        const bValue = (b as any)[sortConfig.key] || '';

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [normalizedHotels, selectedCities, selectedStars, searchTerm, sortConfig, giataMappedFilter]);

  const selectedHotelsSet = useMemo(() => new Set(selectedHotels), [selectedHotels]);

  const [visibleHotelsCount, setVisibleHotelsCount] = useState(50);
  
  useEffect(() => {
    setVisibleHotelsCount(50);
  }, [searchTerm, selectedStars, selectedCities, countryFilter, giataMappedFilter, product.destinations]);

  const visibleHotels = useMemo(() => {
    return filteredHotels.slice(0, visibleHotelsCount);
  }, [filteredHotels, visibleHotelsCount]);

  const isAllFilteredSelected = allSelected;

  const displayHotels = giataHotels;

  const buildStatusMessages = useMemo(() => {
    const msgs = [];
    const p = state.productDefinition;
    
    const conditions = {
      destinations: p.destinations.length > 0,
      hotels: selectedHotels.length > 0,
      rules: p.stayDurations.length > 0 && p.mealPlans.length > 0 && p.occupancies.length > 0,
      conflicts: 0 // Placeholder logic
    };

    if (metrics.valid > 0 && conditions.destinations && conditions.hotels && conditions.rules) {
      msgs.push({ 
        type: 'success', 
        text: 'Configuration valid',
        details: conditions
      });
    } else {
      msgs.push({ 
        type: 'warning', 
        text: 'Configuration pending',
        details: conditions
      });
    }
    
    return msgs;
  }, [metrics.valid, state.productDefinition, selectedHotels.length]);

  const isBlocked = metrics.hasZeroCB;

  const fixPlan = useMemo(() => {
    if (metrics.status !== 'high') return null;

    let nextProduct: ProductDefinition = JSON.parse(JSON.stringify(state.productDefinition));
    let nextARI = JSON.parse(JSON.stringify(ariData));
    let changes: Record<string, string> = {};
    let hotelLogs: { id: string; name: string; before: number; after: number; reductions: string[]; status: 'Resolved' | 'Blocked'; reason?: string }[] = [];

    const checkAllHotels = (p: ProductDefinition, ari: Record<string, any>) => {
      return metrics.inScopeHotels.every(h => forecastHotel(p, h, ari).afterChargeblocks <= 154);
    };

    const getMaxForecast = (p: ProductDefinition, ari: Record<string, any>) => {
      return Math.max(...metrics.inScopeHotels.map(h => forecastHotel(p, h, ari).afterChargeblocks));
    };

    // Initialize logs
    metrics.inScopeHotels.forEach(h => {
      hotelLogs.push({
        id: h.hgId,
        name: h.name,
        before: forecastHotel(nextProduct, h, nextARI).afterChargeblocks,
        after: 0,
        reductions: [],
        status: 'Resolved'
      });
    });

    // 1. Occupancies (Prioritized)
    if (!checkAllHotels(nextProduct, nextARI)) {
      const initialOccs = [...(nextProduct.occupancies || [])];
      const prioritized = [...(nextProduct.occupancies || [])].sort((a, b) => {
        const pA = OCCUPANCY_PRIORITY_LIST.indexOf(mapOccupancyToARICode(a));
        const pB = OCCUPANCY_PRIORITY_LIST.indexOf(mapOccupancyToARICode(b));
        return (pA === -1 ? 999 : pA) - (pB === -1 ? 999 : pB);
      });

      while (prioritized.length > 1 && !checkAllHotels(nextProduct, nextARI)) {
        prioritized.pop();
        nextProduct.occupancies = [...prioritized];
      }
      if (nextProduct.occupancies.length < initialOccs.length) {
        changes.occupancies = `${initialOccs.length} → ${nextProduct.occupancies.length} types`;
        hotelLogs.forEach(log => {
          log.reductions.push(`Occupancies: ${initialOccs.length} → ${nextProduct.occupancies.length}`);
        });
      }
    }

    // 2. Durations
    const initialDurations = [...(nextProduct.stayDurations || [])];
    while ((nextProduct.stayDurations?.length || 0) > 1 && !checkAllHotels(nextProduct, nextARI)) {
      const sorted = [...(nextProduct.stayDurations || [])].sort((a, b) => a - b);
      let bestIdx = sorted.length - 1; // Default to longest
      if (sorted.length > 2) {
          let minGap = Infinity;
          for (let i = 1; i < sorted.length - 1; i++) {
            const gap = (sorted[i] - sorted[i-1]) + (sorted[i+1] - sorted[i]);
            if (gap < minGap) {
              minGap = gap;
              bestIdx = i;
            }
          }
      }
      const removed = sorted[bestIdx];
      nextProduct.stayDurations = nextProduct.stayDurations.filter(d => d !== removed);
    }
    if ((nextProduct.stayDurations?.length || 0) < initialDurations.length) {
      changes.stayDurations = `[${initialDurations.sort((a,b)=>a-b).join(',')}] → [${nextProduct.stayDurations.sort((a,b)=>a-b).join(',')}]`;
      hotelLogs.forEach(log => {
        log.reductions.push(`Durations: ${changes.stayDurations}`);
      });
    }

    // 3. Meal Plans
    if (!checkAllHotels(nextProduct, nextARI)) {
      const initialMPs = [...(nextProduct.mealPlans || [])];
      const prioritized = [...(nextProduct.mealPlans || [])].sort((a, b) => {
        const pA = MEAL_PLAN_PRIORITY.indexOf(a);
        const pB = MEAL_PLAN_PRIORITY.indexOf(b);
        return (pA === -1 ? 999 : pA) - (pB === -1 ? 999 : pB);
      });

      while (prioritized.length > 1 && !checkAllHotels(nextProduct, nextARI)) {
        prioritized.pop();
        nextProduct.mealPlans = [...prioritized];
      }
      if (nextProduct.mealPlans.length < initialMPs.length) {
        changes.mealPlans = `[${initialMPs.join(',')}] → [${nextProduct.mealPlans.join(',')}]`;
        hotelLogs.forEach(log => {
          log.reductions.push(`Meal Plans: ${changes.mealPlans}`);
        });
      }
    }

    // 4. Rooms (PER HOTEL - this is specific to each hotel's ARI)
    if (!checkAllHotels(nextProduct, nextARI)) {
      let totalRoomsRemoved = 0;
      metrics.inScopeHotels.forEach(hotel => {
        const hLog = hotelLogs.find(l => l.id === hotel.hgId);
        const hotelARI = nextARI[hotel.hgId];
        if (hotelARI) {
          const keys = Object.keys(hotelARI).sort((a, b) => {
            const pA = ROOM_PRIORITY.indexOf(a as any);
            const pB = ROOM_PRIORITY.indexOf(b as any);
            return (pA === -1 ? 999 : pA) - (pB === -1 ? 999 : pB);
          });

          let removedCount = 0;
          while (keys.length > 1 && forecastHotel(nextProduct, hotel, nextARI).afterChargeblocks > 154) {
            const keyToRemove = keys.pop()!;
            delete hotelARI[keyToRemove];
            removedCount++;
            totalRoomsRemoved++;
          }
          if (removedCount > 0 && hLog) {
            hLog.reductions.push(`Rooms: Reduced from ${Object.keys(ariData[hotel.hgId] || {}).length} to ${Object.keys(hotelARI).length}`);
          }
        }
      });
      if (totalRoomsRemoved > 0) changes.rooms = `Reduced ${totalRoomsRemoved} rooms across scope`;
    }

    // 5. Markets
    if (!checkAllHotels(nextProduct, nextARI)) {
      const initialMarkets = [...(nextProduct.markets || [])];
      while ((nextProduct.markets?.length || 0) > 1 && !checkAllHotels(nextProduct, nextARI)) {
        const removed = nextProduct.markets.pop();
        if (removed && nextProduct.marketAirports) delete nextProduct.marketAirports[removed];
      }
      if (nextProduct.markets.length < initialMarkets.length) {
        changes.markets = `[${initialMarkets.join(',')}] → [${nextProduct.markets.join(',')}]`;
        hotelLogs.forEach(log => {
          log.reductions.push(`Markets: ${changes.markets}`);
        });
      }
    }

    // 6. Airports (within remaining markets) - MATERIAL REDUCTION
    if (!checkAllHotels(nextProduct, nextARI)) {
      let airportsRemoved = 0;
      nextProduct.markets.forEach(mc => {
        const ports = [...(nextProduct.marketAirports[mc] || (AIRPORT_MAPPING[mc] || []).map(p => p.code))];
        while (ports.length > 0 && !checkAllHotels(nextProduct, nextARI)) {
          ports.pop();
          airportsRemoved++;
          nextProduct.marketAirports[mc] = [...ports];
        }
      });
      if (airportsRemoved > 0) {
        changes.airports = `Removed ${airportsRemoved} airports across markets`;
        hotelLogs.forEach(log => {
          log.reductions.push(`Airports: Materially reduced port density to resolve budget`);
        });
      }
    }

    // Finalize Logs
    hotelLogs.forEach(log => {
      const hotel = metrics.inScopeHotels.find(h => h.hgId === log.id);
      if (hotel) {
        log.after = forecastHotel(nextProduct, hotel, nextARI).afterChargeblocks;
        if (log.after > 154) {
          log.status = 'Blocked';
          log.reason = 'Minimum achievable configuration still exceeds 154 chargeblocks';
        }
      }
    });

    const stillAbove = !checkAllHotels(nextProduct, nextARI);
    if (!stillAbove && Object.keys(changes).length === 0) return null;

    return {
      product: nextProduct,
      importedARI: nextARI,
      changes,
      stillAbove,
      hotelLogs,
      beforeComplexity: metrics.complexityScore,
      afterComplexity: metrics.inScopeHotels.reduce((acc, h) => acc + forecastHotel(nextProduct, h, nextARI).afterChargeblocks, 0)
    };
  }, [metrics, state.productDefinition, ariData]);

  const applyAutoFix = () => {
    if (!fixPlan) return;
    
    setState(prev => ({
      ...prev,
      productDefinition: fixPlan.product,
      importedARI: fixPlan.importedARI
    }));

    setShowFixModal(false);
    setNotification({ message: 'Complexity optimized automatically.', type: 'success' });
  };

  const handleGeneratePreview = () => {
    // HARD RULE: Absolute Pre-Generation Guard
    const p = state.productDefinition || {} as any;
    const ari = ariData;
    
    // We sort hotels by complexity to optimize chunk packing
    const allSelectedHotels = metrics.inScopeHotels.map(h => {
      const forecast = forecastHotel(p, h, ari);
      return { hotel: h, forecast };
    });

    if (errors.length === 0) {
      const now = new Date().toISOString();
      const runId = `RUN_${new Date().toISOString().slice(0, 19).replace(/[-:]/g, '_').replace('T', '_')}`;
      const userEmail = "amrmohsenamin@gmail.com";
      const userName = "Amr Mohsen";
      const configId = `PD-${Math.floor(Date.now() / 1000)}`;

      const currentDestinations = product.destinations || [];
      
      const newLogs: DestinationLog[] = currentDestinations.map(destCode => {
        const hotelsInDestGroup = allSelectedHotels.filter(item => item.hotel.resolvedIata === destCode || item.hotel.destination === destCode);
        const hotelsInDestSub = hotelsInDestGroup.map(item => item.hotel);
        
        const countriesFound = Array.from(new Set(hotelsInDestSub.map(h => h.country).filter(Boolean)));
        const resolvedCountry = countriesFound.length === 1 ? countriesFound[0] : (countriesFound.length > 1 ? 'Multiple countries' : (DESTINATION_COUNTRY_MAP[destCode] || 'Unknown'));
        
        const destNamesFound = Array.from(new Set(hotelsInDestSub.map(h => h.destination).filter(Boolean)));
        const destName: string = (destNamesFound.length === 1 ? destNamesFound[0] : (destinationNameLookup.get(destCode) || destCode)) as string;

        // Initial Events
        const events: TimelineEvent[] = [
          { timestamp: new Date().toISOString(), action: 'User triggered generation simulation', type: 'INFO' },
          { timestamp: new Date().toISOString(), action: `Product definition snapshot created (v${configId})`, type: 'INFO' }
        ];

        // --- REAL CHUNKING LOGIC ---
        // Max 1500 Chargeblocks per chunk
        // Max 15 Hotels per chunk
        const INTERNAL_MAX_CB = 1500; 
        const MAX_HOTELS_PER_CHUNK = 12; 
        
        const chunks: ChunkLog[] = [];
        let currentChunkHotels: HotelLog[] = [];
        let currentChunkCB = 0;
        let chunkCounter = 1;

        let hotelsGenerated = 0;
        let hotelsTrimmed = 0;
        let hotelsBlocked = 0;

        // Sort hotels by chargeblocks (descending) for better packing
        hotelsInDestGroup.sort((a, b) => b.forecast.afterChargeblocks - a.forecast.afterChargeblocks);

        hotelsInDestGroup.forEach((item, index) => {
          const h = item.hotel;
          const forecast = item.forecast;
          
          let comp = forecast.afterChargeblocks;
          let hotelStatus: HotelLog['status'] = 'Generated';
          let trimApplied: HotelLog['trimApplied'] = 'None';
          let note = 'Generated successfully';

          // RECOVERY LOGIC (Simulation)
          if (comp > 154) {
            // Attempt 1: Deterministic Trim
            const trimmedCB = Math.floor(comp * 0.75); // More aggressive reduction
            if (trimmedCB <= 154) {
              comp = trimmedCB;
              hotelStatus = 'Generated with Trim';
              trimApplied = 'Deterministic dimension reduction';
              note = `AUTO-FIX: REDUCED ${forecast.afterChargeblocks} → ${comp} CB`;
              hotelsTrimmed++;
              hotelsGenerated++;
            } else {
              // Fail
              hotelStatus = 'Blocked';
              note = `BLOCKED: Complexity ${comp} CB exceeds limits post-fix`;
              hotelsBlocked++;
              comp = forecast.afterChargeblocks; 
            }
          } else {
            if (forecast.isTrimmed || forecast.isCompressed || forecast.afterChargeblocks < forecast.beforeChargeblocks) {
               hotelStatus = 'Generated with Trim';
               trimApplied = 'Deterministic dimension reduction';
               note = 'Generated with auto-recovery optimizations';
               hotelsTrimmed++;
               hotelsGenerated++;
            } else {
               hotelsGenerated++;
            }
          }

          const hLog: HotelLog = {
            hgId: h.hgId,
            name: h.name,
            giataId: h.giataId,
            pwId: h.peakworkId || `PW-${h.hgId}`,
            status: hotelStatus,
            chargeblocks: comp,
            trimApplied: trimApplied,
            lastGenerated: now,
            notes: note,
            chunkId: `${destCode}_CHUNK_${String(chunkCounter).padStart(2, '0')}`
          };

          // Packing decision
          const fits = (currentChunkHotels.length < MAX_HOTELS_PER_CHUNK) && (currentChunkCB + comp <= INTERNAL_MAX_CB);
          
          if (!fits && currentChunkHotels.length > 0) {
            // Finalize current chunk
            chunks.push(createChunk(currentChunkHotels, chunkCounter, destCode, configId, now));
            chunkCounter++;
            currentChunkHotels = [];
            currentChunkCB = 0;
            hLog.chunkId = `${destCode}_CHUNK_${String(chunkCounter).padStart(2, '0')}`;
          }

          currentChunkHotels.push(hLog);
          currentChunkCB += comp;

          if (index === hotelsInDestGroup.length - 1) {
            chunks.push(createChunk(currentChunkHotels, chunkCounter, destCode, configId, now));
          }
        });

        // --- Determinism Audit Preparation (Simulation) ---
        const auditInput_sim = {
          hotels: hotelsInDestGroup.map(item => item.hotel.hgId).sort(),
          destinations: [destCode],
          productDefinition: {
            markets: [...state.productDefinition.markets].sort(),
            airports: [...state.productDefinition.airports].sort(),
            stayDurations: [...state.productDefinition.stayDurations].sort(),
            mealPlans: [...state.productDefinition.mealPlans].sort(),
            occupancies: state.productDefinition.occupancies.map(o => ({ adults: o.adults, children: o.children })),
            bookingWindowDays: state.productDefinition.bookingWindowDays
          }
        };

        const auditConfig_sim = {
          packagingStrategy: state.packagingStrategy,
          maxCBPerRoom: MAX_CB_PER_ROOM,
          priceVarianceThreshold: PRICE_VARIANCE_THRESHOLD,
          executionMode: state.executionMode,
          ariMode: 'LIVE'
        };

        const auditData_sim = {
          ariVersion: 'v1_live_makcorps',
          mappingVersion: 'dest_country_v2',
          dataSeed: 42 
        };

        const auditExecution_sim = {
          hotelDecisions: hotelsInDestGroup.map(item => ({
            id: item.hotel.hgId,
            isPartitioned: false,
            partCount: 1,
            chargeblocks: 100, // Dummy for simulation metrics
            status: 'Generated'
          })).sort((a, b) => a.id.localeCompare(b.id)),
          chunkStructure: chunks.map(c => ({
            id: c.id,
            hotelCount: c.hotelCount,
            cb: c.actualChargeblocks
          })),
          totals: {
            itemCount: hotelsGenerated,
            totalCB: currentChunkCB
          }
        };

        const determinismAudit_sim = generateDeterminismAudit(auditInput_sim, auditConfig_sim, auditData_sim, auditExecution_sim);

        // 2. Create Manifest
        const totalCB_sim = currentChunkCB;
        const rawCB_sim = totalCB_sim * 1.05; // Dummy raw for simulation
        const manifest: Manifest = {
          id: `MANIFEST_${destCode}_${runId}`,
          runId,
          sessionId,
          userId: 'USR-001',
          userEmail,
          destinationCode: destCode,
          destinationName: destName,
          country: (resolvedCountry as any) === 'Multiple countries' ? 'Multiple countries' : (resolvedCountry as string),
          productDefinitionVersion: configId,
          generatedAt: now,
          overallStatus: hotelsBlocked === hotelsInDestGroup.length ? 'Blocked' : hotelsBlocked > 0 ? 'Partial' : 'Complete',
          execution: {
            strategy: state.packagingStrategy,
            constraintTriggered: 'Simulation',
            actionTaken: 'Chunked Simulation',
            selectedPackagingStrategy: state.packagingStrategy,
            totalInputCB: Math.round(rawCB_sim),
            finalOutputCB: totalCB_sim,
            threshold: INTERNAL_MAX_CB,
            partitioningApplied: false,
            chunkingApplied: chunks.length > 1,
            trimmingApplied: hotelsTrimmed > 0,
            reason: chunks.length > 1 ? `Simulation: Workload requires split into ${chunks.length} chunks.` : "Simulation: Workload fits within single export batch."
          },
          determinismAudit: determinismAudit_sim,
          content: {
            hotelsGenerated: hotelsGenerated,
            itemCount: hotelsGenerated,
            totalChargeblocks: currentChunkCB // This is a bit simplified for preview but fits
          },
          pdSnapshot: {
            markets: product.markets,
            airports: product.destinations.map(d => ({ code: d, name: destinationNameLookup.get(d) || d })),
            bookingWindowDays: product.bookingWindowDays,
            stayDurations: product.stayDurations,
            mealPlans: product.mealPlans,
            occupancies: product.occupancies
          }
        };

        const chunkingText = chunks.length > 1 ? `across ${chunks.length} chunks` : 'in single batch';
        const hotelsText = hotelsGenerated === 1 ? '1 hotel' : `${hotelsGenerated} hotels`;

        return {
          id: runId,
          destination: destCode,
          name: destName as string,
          country: resolvedCountry as string,
          hotelsInScope: hotelsInDestGroup.length,
          hotelsGenerated: hotelsGenerated,
          hotelsTrimmed: hotelsTrimmed,
          hotelsBlocked: hotelsBlocked,
          lastGenerationTime: now,
          status: (hotelsBlocked === hotelsInDestGroup.length ? 'Blocked' : hotelsBlocked > 0 || hotelsTrimmed > 0 ? 'Partial' : 'Complete') as any,
          statusNote: `Generated ${hotelsText} ${chunkingText}`,
          configId,
          triggeredBy: userName,
          userEmail,
          sessionId,
          manifest,
          chunks,
          events: events as TimelineEvent[]
        };
      });

      setEdfLogs(prev => [...newLogs, ...prev].slice(0, 50));
      setStep('loading');
      setTimeout(() => setStep('preview'), 1500);
    }
  };

  const handleSort = (key: keyof Hotel) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ column }: { column: keyof Hotel }) => {
    if (sortConfig?.key !== column) return <ArrowUpDown size={12} className="opacity-30" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-hg-accent" /> : <ArrowDown size={12} className="text-hg-accent" />;
  };

  const handleClearSelection = useCallback(() => {
    setSelectedHotelIds(new Set());
    setDeselectedIds(new Set());
    setAllSelected(false);
  }, []);

  const toggleHotel = useCallback((id: string) => {
    setSelectedHotels(prev => {
      const currentSelection = new Set(prev);
      if (currentSelection.has(id)) {
        currentSelection.delete(id);
      } else {
        if ((limits as any).hotels && currentSelection.size >= (limits as any).hotels) {
          setNotification({ message: `Hotel limit reached (${(limits as any).hotels})`, type: 'error' });
          return prev;
        }
        currentSelection.add(id);
      }
      return Array.from(currentSelection);
    });
  }, [limits]);

  const toggleAllHotels = useCallback(() => {
    const allFilteredIds = filteredHotels.map(h => h.id);
    setSelectedHotels(prev => {
      const currentSelection = new Set(prev);
      const allFilteredSelected = allFilteredIds.every(id => currentSelection.has(id));
      
      if (allFilteredSelected) {
        // Deselect all filtered
        allFilteredIds.forEach(id => currentSelection.delete(id));
      } else {
        // Select all filtered
        allFilteredIds.forEach(id => currentSelection.add(id));
      }
      return Array.from(currentSelection);
    });
  }, [filteredHotels]);

  const toggleTag = (field: 'destinations' | 'markets' | 'airports' | 'stayDurations' | 'mealPlans', value: any) => {
    console.time("selectionUpdate");
    setState(prev => {
      const current = prev.productDefinition[field] as any[];
      const isSelected = current.includes(value);
      if (!isSelected && (limits as any)[field] && current.length >= (limits as any)[field]) return prev;
      const newValues = isSelected ? current.filter(v => v !== value) : [...current, value];
      return { ...prev, productDefinition: { ...prev.productDefinition, [field]: newValues } };
    });
    console.timeEnd("selectionUpdate");
  };

  const handleARIImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        const ariMap: Record<string, Record<string, Record<string, Record<string, ARIData[]>>>> = { ...ariData };

        data.forEach((row, rowIndex) => {
          const hotelId = String(row.hotelId || row.hgId || row.hg_hotel_id || row.HotelId || '').trim();
          const roomCode = String(row.roomCode || row.room_code || row.RoomCode || '').trim();
          const mealPlan = String(row.mealPlan || row.mealPlanCode || row.MealPlan || '').trim();
          const occupancy = String(row.occupancy || row.occupancyCode || row.Occupancy || '').trim();
          const date = String(row.date || row.day || row.Date || '').trim();
          
          if (!hotelId || !roomCode || !mealPlan || !occupancy || !date) {
            if (rowIndex < 5) console.warn(`Skipping ARI row ${rowIndex} due to missing keys:`, row);
            return;
          }

          if (!ariMap[hotelId]) ariMap[hotelId] = {};
          if (!ariMap[hotelId][roomCode]) ariMap[hotelId][roomCode] = {};
          if (!ariMap[hotelId][roomCode][mealPlan]) ariMap[hotelId][roomCode][mealPlan] = {};
          if (!ariMap[hotelId][roomCode][mealPlan][occupancy]) ariMap[hotelId][roomCode][mealPlan][occupancy] = [];

          const price = parseFloat(row.price || row.rate || row.amount || '0');
          const alloc = parseInt(row.alloc || row.allocation || row.availability || row.avail || '0');
          
          if (isNaN(price)) {
            console.warn(`Invalid price for hotel ${hotelId} on ${date}. Defaulting to 0.`);
          }

          ariMap[hotelId][roomCode][mealPlan][occupancy].push({
            date,
            price: isNaN(price) ? 0 : price,
            stayDuration: parseInt(row.duration || row.dur || row.stay || row.Duration) || 1,
            minLOS: parseInt(row.minLOS || row.min_los || row.minStay) || 1,
            maxLOS: parseInt(row.maxLOS || row.max_los || row.maxStay) || 21,
            stopSell: row.stopSell === 'true' || row.stopSell === '1' || row.closed === 'true' || row.stop_sell === 'true' || row.StopSell === '1',
            alloc: isNaN(alloc) ? 0 : alloc,
            cta: row.cta === 'true' || row.cta === '1' || row.CTA === 'true' || row.CTA === '1',
            ctd: row.ctd === 'true' || row.ctd === '1' || row.CTD === 'true' || row.CTD === '1'
          });
        });

        // Sort data by date for each leaf
        Object.values(ariMap).forEach(rooms => {
          Object.values(rooms).forEach(mps => {
            Object.values(mps).forEach(occs => {
              Object.values(occs).forEach(days => {
                days.sort((a, b) => a.date.localeCompare(b.date));
              });
            });
          });
        });

        setState(prev => ({ ...prev, importedARI: ariMap }));
        setNotification({ 
          message: `ARI data imported successfully. ${data.length} records processed for multiple board/occupancy levels.`, 
          type: 'success' 
        });
      },
      error: (err) => {
        console.error('ARI Import failed:', err);
        setNotification({ message: 'Failed to parse ARI file. Ensure it is a valid CSV.', type: 'error' });
      }
    });

    // Reset input
    event.target.value = '';
  };

  const handleExportARI = async () => {
    if (selectedHotels.length === 0) {
      setNotification({ message: 'Select at least one hotel to export ARI debug.', type: 'error' });
      return;
    }

    setNotification({ message: `Generating ARI debug dataset for ${selectedHotels.length} hotels...`, type: 'success' });

    setTimeout(async () => {
      try {
        const zip = new JSZip();
        let combinedCSV = 'hgId,roomCode,mealPlan,occupancy,date,price,minLOS,maxLOS,stopSell,allocation\n';
        let rowCount = 0;

        for (const hotelId of selectedHotels) {
          const hotel = activeHotelsMap.get(hotelId);
          if (!hotel) continue;
          
          const hotelARI = ariData[hotel.hgId];
          if (!hotelARI) continue;

          Object.entries(hotelARI).forEach(([roomCode, mpData]) => {
            Object.entries(mpData as any).forEach(([mp, occData]) => {
              Object.entries(occData as any).forEach(([occ, days]) => {
                (days as any[]).forEach(day => {
                   combinedCSV += `${hotel.hgId},${roomCode},${mp},${occ},${day.date},${day.price},${day.minLOS},${day.maxLOS},${day.stopSell},${day.alloc}\n`;
                   rowCount++;
                });
              });
            });
          });
        }

        if (rowCount === 0) {
          console.error("ARI Export failed: No rows were generated for selected hotels.", {
            selectedCount: selectedHotels.length,
            ariHotels: hotels.length
          });
          setNotification({ message: 'Export failed: No ARI data found for selected hotels.', type: 'error' });
          return;
        }

        zip.file("ARI_DEBUG_FULL.csv", combinedCSV);
        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `ARI_DEBUG_EXPORT_${new Date().toISOString().split('T')[0]}.zip`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('ARI Export failed:', err);
        setNotification({ message: 'ARI Export failed.', type: 'error' });
      }
    }, 100);
  };

  const handleLoadGlobalSimulation = async () => {
    setNotification({ message: 'Refreshing static ARI dataset...', type: 'info' });
    await new Promise(r => setTimeout(r, 800));
    setNotification({ message: 'Static dataset refreshed. 150 hotels available.', type: 'success' });
  };

  const [ariGenerating, setAriGenerating] = useState(false);

  const lazyGenerateARI = (hotel: Hotel, product: ProductDefinition) => {
    // Systematic dummy ARI generation for Giata hotels
    const ari: Record<string, any[]> = {};
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2026-12-31');
    
    product.stayDurations.forEach(duration => {
      product.mealPlans.forEach(meal => {
        product.occupancies.forEach(occ => {
          const key = `${hotel.hgId}_${occ.adults}_${occ.children}_${meal}`;
          if (!ari[key]) ari[key] = [];
          
          let curr = new Date(startDate);
          while (curr <= endDate) {
            const dateStr = curr.toISOString().split('T')[0];
            const basePrice = (hotel.starRating || 3) * 50 + (duration * 20);
            ari[key].push({
              date: dateStr,
              price: basePrice + Math.floor(Math.random() * 20),
              alloc: 5,
              stopSell: false,
              stayDuration: duration,
              mealPlan: meal,
              occupancy: `${occ.adults}-${occ.children}`
            });
            curr.setDate(curr.getDate() + 7); // weekly resolution for dummy data to keep it small
          }
        });
      });
    });
    return ari;
  };

  const handleExportEDF = async () => {
    // EDF EXPORT DEBUG
    console.error("EDF EXPORT DEBUG: Initiation", {
      productExists: !!product,
      selectedHotels: selectedHotels?.length || 0,
      stateExists: !!state,
      ariLoadedCount: Object.keys(ariData || {}).length
    });

    const selectedHotelIds = selectedHotels || [];
    
    if (selectedHotelIds.length === 0) {
      setNotification({ message: 'Select at least one hotel to export.', type: 'error' });
      return;
    }

    // ARI Requirement Check - Safe Mode for Giata Hotels
    const inScopeHotels = (selectedHotelIds || []).map(id => activeHotelsMap.get(id)).filter(Boolean) as Hotel[];
    const missingARIHotels = inScopeHotels.filter(h => h && !ariData[h.hgId]);
    
    let workingAriData = { ...ariData };
    
    if (missingARIHotels.length > 0) {
      setAriGenerating(true);
      setNotification({ message: `Generating safe-mode ARI for ${missingARIHotels.length} hotels...`, type: 'info' });
      
      missingARIHotels.forEach(h => {
        const dummy = lazyGenerateARI(h, product);
        Object.assign(workingAriData, dummy);
      });
      setAriGenerating(false);
    }

    if (state.executionMode === ExecutionMode.PRODUCTION) {
      const unmapped = inScopeHotels.filter(h => !h.giataId || h.giataId === '-' || h.giataId.startsWith('P'));
      if (unmapped.length > 0) {
        setNotification({ 
          message: `Production export forbidden: ${unmapped.length} unmapped hotels.`, 
          type: 'error' 
        });
        return;
      }
    }

    const now = new Date().toISOString();
    setNotification({ message: `Executing chunked export for ${selectedHotelIds.length} hotels...`, type: 'success' });

    setTimeout(async () => {
      try {
        const zip = new JSZip();
        let hotelValidations: HotelExportValidation[] = [];
        
        let hotelsGeneratedSet = new Set<string>();
        let hotelsTrimmedSet = new Set<string>();
        let hotelsBlockedSet = new Set<string>();
        let totalHotelPartsGenerated = 0;

        const configId = `PD-${Math.floor(Date.now() / 1000)}`;
        const finalChunks: ChunkLog[] = [];
        
        const MAX_CB_PER_ROOM_TARGET = 31; // Safety target
        
        const processHotelWithPackagingStrategy = (hotelId: string, variationSeed: number = 0): any[] => {
          const hotel = activeHotelsMap.get(hotelId);
          if (!hotel) return [];

          const strategy = state.packagingStrategy;
          const model = generateEDFModelForHotel(hotel, product, workingAriData, variationSeed, strategy);
          if (!model) return [];

          const { processedRooms, compliance, decisions, actualProduct, complexity } = model;
          const totalCB = processedRooms.reduce((acc: number, r: any) => acc + r.roomChargeblocks, 0);

          // Partitioning Rule: Triggered ONLY if total prices > 65536 or seasons > 255
          const partitioningMandatory = compliance.hotelPriceLimitExceeded || compliance.seasonLimitExceeded;
          
          if (partitioningMandatory) {
            const parts: any[] = [];
            let currentPartRooms: any[] = [];
            let currentPartCB = 0;
            
            processedRooms.forEach((r: any) => {
              // Heuristic for splitting: try to stay under a generous CB count per part if possible, but forced if mandatory
              if (currentPartCB + r.roomChargeblocks > 1000 && currentPartRooms.length > 0) {
                 parts.push({ rooms: currentPartRooms, cb: currentPartCB });
                 currentPartRooms = [];
                 currentPartCB = 0;
              }
              currentPartRooms.push(r);
              currentPartCB += r.roomChargeblocks;
            });
            if (currentPartRooms.length > 0) parts.push({ rooms: currentPartRooms, cb: currentPartCB });

            return parts.map((part, idx) => {
              const xml = generateEDFXML(hotel, part.rooms, state);
              const partId = `P${idx + 1}`;
              const partKey = `${hotel.hgId}-${partId}`;
              return {
                hotel, xml, partId, partKey, isPartitioned: true, isBlocked: false,
                validation: {
                  hotelId: hotel.hgId, partId, partKey, isPartitioned: true, roomCount: part.rooms.length,
                  seasonCount: part.rooms.reduce((acc: number, r: any) => acc + (r.seasons?.length || 0), 0),
                  mealPlanCount: actualProduct.mealPlans.length, occupancyCount: actualProduct.occupancies.length,
                  chargeblockCount: part.cb, dateSpan: { start: '2025-01-01', end: '2026-12-31' },
                  isProvisionalGiata: hotel.giataId.startsWith('P'), isSynthetic: false, postProcessingApplied: true,
                  processedRooms: part.rooms,
                  inputMetrics: { chargeblocks: (metrics.hotelComplexityMap[hotel.id]?.beforeChargeblocks || part.cb) },
                  diagnosticStats: model.diagnosticStats,
                  compressionStats: {
                    rawInputCB: metrics.hotelComplexityMap[hotel.id]?.beforeChargeblocks || part.cb,
                    postMergeCB: part.cb,
                    finalOutputCB: part.cb,
                    ratio: (metrics.hotelComplexityMap[hotel.id]?.beforeChargeblocks || part.cb) > 0 ? part.cb / (metrics.hotelComplexityMap[hotel.id]?.beforeChargeblocks || part.cb) : 1
                  },
                  constraintCompliance: compliance,
                  executionDecision: decisions[part.rooms[0].roomCode] || { strategy, constraintTriggered: 'PARTITIONED', actionTaken: 'Split into parts' }
                }
              };
            });
          }

          const xml = generateEDFXML(hotel, processedRooms, state);
          return [{ 
            hotel, xml, isBlocked: totalCB === 0, isPartitioned: false,
            validation: {
              hotelId: hotel.hgId, isPartitioned: false, roomCount: processedRooms.length,
              seasonCount: processedRooms.reduce((acc: number, r: any) => acc + (r.seasons?.length || 0), 0),
              mealPlanCount: actualProduct.mealPlans.length, occupancyCount: actualProduct.occupancies.length,
              chargeblockCount: totalCB, dateSpan: { start: '2025-01-01', end: '2026-12-31' },
              isProvisionalGiata: hotel.giataId.startsWith('P'), isSynthetic: false,
              processedRooms: processedRooms,
              inputMetrics: { chargeblocks: (metrics.hotelComplexityMap[hotel.id]?.beforeChargeblocks || totalCB) },
              diagnosticStats: model.diagnosticStats,
              compressionStats: {
                rawInputCB: metrics.hotelComplexityMap[hotel.id]?.beforeChargeblocks || totalCB,
                postMergeCB: totalCB,
                finalOutputCB: totalCB,
                ratio: (metrics.hotelComplexityMap[hotel.id]?.beforeChargeblocks || totalCB) > 0 ? totalCB / (metrics.hotelComplexityMap[hotel.id]?.beforeChargeblocks || totalCB) : 1
              },
              constraintCompliance: compliance,
              executionDecision: decisions[processedRooms[0]?.roomCode] || { strategy, constraintTriggered: 'NONE', actionTaken: 'NONE' }
            }
          }];
        };

        const allRecoveryResults: any[] = [];
        inScopeHotels.forEach(hotel => {
          try {
            const results = processHotelWithPackagingStrategy(hotel.id);
            results.forEach(res => allRecoveryResults.push({ hotel, res }));
          } catch (err) { console.error(err); }
        });

        console.error("EDF EXPORT DEBUG: Recovery Phase Complete", {
          resultsCount: allRecoveryResults.length,
          hotelsProcessed: inScopeHotels.length
        });

        let totalOriginalCB = 0;
        let totalFinalCB = 0;
        allRecoveryResults.forEach(r => {
          if (r.res) {
            totalOriginalCB += (r.res.validation as any).debug?.beforeChargeblockCount || r.res.validation.chargeblockCount;
            totalFinalCB += r.res.validation.chargeblockCount;
          }
        });

        const validResultsPool = allRecoveryResults.filter(r => !r.res?.isBlocked);
        const blockedResultsPool = allRecoveryResults.filter(r => r.res?.isBlocked);

        const diagnostics = allRecoveryResults.map(r => ({
          hotelId: r.hotel.hgId,
          hotelName: r.hotel.name,
          partId: (r.res as any).partId,
          partKey: (r.res as any).partKey,
          isBlocked: r.res.isBlocked,
          diagnosticStats: (r.res.validation as any).diagnosticStats,
          compliance: (r.res.validation as any).constraintCompliance,
          rooms: (r.res.validation as any).processedRooms?.map((rom: any) => ({
            roomCode: rom.roomCode,
            seasonsGenerated: rom.seasonsGenerated,
            ariRowsMatched: rom.ariRowsMatched,
            filterReason: rom.filterReason,
            finalSeasons: (rom.seasons || []).length
          }))
        }));

        console.log("EXPORT DIAGNOSTICS", diagnostics);
        setExportDiagnostics(diagnostics);

        if (validResultsPool.length === 0) {
          const firstBlocked = blockedResultsPool[0];
          let detail = "";
          if (firstBlocked) {
             const v = firstBlocked.res.validation as any;
             const emptyRoom = v.processedRooms?.find((rm: any) => (rm.seasons || []).length === 0);
             if (emptyRoom) {
                detail = ` (e.g. Room ${emptyRoom.roomCode}: ${emptyRoom.filterReason || 'No seasons matched booking window/durations'})`;
             }
          }
          const msg = `No exportable seasons generated. Check booking window, durations, and availability rules.${detail}`;
          console.error(msg);
          setNotification({ message: msg, type: 'error' });
          return;
        }


        // Process results for reporting
        blockedResultsPool.forEach(bh => {
          hotelsBlockedSet.add(bh.hotel.hgId);
          hotelValidations.push(bh.res!.validation as any);
        });

        // Sort valid results by complexity (descending)
        validResultsPool.sort((a, b) => b.res!.validation.chargeblockCount - a.res!.validation.chargeblockCount);

        const MAX_HOTELS_PER_CHUNK = 15;
        const totalValid = validResultsPool.length;

        // DECISION: Only chunk if we exceed safe operational limits
        const needsChunking = false; // Chunking intentionally disabled
        let chunkingApplied = false;

        if (totalValid > 0) {
          if (!needsChunking) {
            // SINGLE BATCH EXECUTION
            const validLogs: HotelLog[] = validResultsPool.map(item => {
              const hotel = item.hotel;
              const res = item.res!;
              
              hotelsGeneratedSet.add(hotel.hgId);
              totalHotelPartsGenerated++;
              if (res.validation.postProcessingApplied) hotelsTrimmedSet.add(hotel.hgId);
              
              const partSuffix = (res.partId && res.isPartitioned) ? `_${res.partId}` : '';
              zip.file(`HG_${hotel.hgId}${partSuffix}_${state.executionMode}.xml`, res.xml);
              hotelValidations.push(res.validation as any);
              
              const diag = res.validation.diagnosticStats?.ariDiagnostics?.[0];
              const derivationStatus = diag?.fallback?.matchType === 'DERIVED' ? ' (Derived)' : '';
              
              return {
                hgId: hotel.hgId, name: hotel.name, giataId: hotel.giataId, pwId: hotel.peakworkId || `PW-${hotel.hgId}`,
                status: (res.validation.postProcessingApplied ? 'Generated with Trim' : 'Generated') + derivationStatus,
                chargeblocks: res.validation.chargeblockCount, trimApplied: res.validation.postProcessingApplied ? 'Deterministic dimension reduction' : 'None',
                lastGenerated: now, 
                notes: diag?.fallback?.matchType === 'DERIVED' 
                  ? `Duration Derived: ${diag.fallback.reason}` 
                  : (res as any).partId ? `Hotel Part ${(res as any).partId} (${(res as any).partKey})` : 'Generated in single export', 
                chunkId: 'EDF_SINGLE'
              };
            });

            const failLogs: HotelLog[] = blockedResultsPool.map(item => {
              const hotel = item.hotel;
              const res = item.res!;
              const diag = res.validation.diagnosticStats?.ariDiagnostics?.[0];
              const displayReason = diag?.failureReason || (res.validation.chargeblockCount === 0 ? 'EXCLUDED_NO_ARI' : 'VALIDATION_FAILED');
              
              return {
                hgId: hotel.hgId, name: hotel.name, giataId: hotel.giataId, pwId: hotel.peakworkId || `PW-${hotel.hgId}`,
                status: res.validation.chargeblockCount === 0 ? displayReason : 'Failed',
                chargeblocks: 0, trimApplied: 'None',
                lastGenerated: now, notes: res.validation.chargeblockCount === 0 ? (diag?.fallback?.applied ? `Fallback Level: ${diag.fallback.level}` : 'Exhausted board/occupancy fallbacks') : 'Seasons validation failed',
                chunkId: 'EDF_SINGLE'
              };
            });

            const hLogs = [...validLogs, ...failLogs];

            finalChunks.push({
              id: 'EDF_SINGLE', index: 1, fileName: `export_full_v${configId.split('-')[1]}.zip`,
              status: hLogs.every(hl => hl.status === 'Generated') ? 'Success' : 'Trimmed',
              hotelCount: hLogs.length, predictedChargeblocks: totalFinalCB, actualChargeblocks: totalFinalCB,
              trimApplied: hLogs.some(hl => hl.status.includes('Trim')) ? 'Mixed' : 'None',
              strategy: 'Single Export (No Chunking)', outcome: 'SUCCESS', generatedAt: now, durationMs: 400,
              notes: 'All items grouped in one batch', hotels: hLogs
            });
          } else {
        // UTILITY-DRIVEN DYNAMIC CHUNKING (Bin-Packing with Rebalancing)
            chunkingApplied = true;
            let chunkBuckets: HotelLog[][] = [];
            let chunkCBs: number[] = [];
            
            // First pass: First-Fit Bin Packing
            validResultsPool.forEach((item) => {
              const hotel = item.hotel;
              const res = item.res!;
              
              hotelsGeneratedSet.add(hotel.hgId);
              totalHotelPartsGenerated++;
              if (res.validation.postProcessingApplied) hotelsTrimmedSet.add(hotel.hgId);
              
              const partSuffix = (res.partId && res.isPartitioned) ? `_${res.partId}` : '';
              zip.file(`HG_${hotel.hgId}${partSuffix}_${state.executionMode}.xml`, res.xml);
              hotelValidations.push(res.validation as any);

              const diag = res.validation.diagnosticStats?.ariDiagnostics?.[0];
              const derivationStatus = diag?.fallback?.matchType === 'DERIVED' ? ' (Derived)' : '';
              
              const hLog: HotelLog = {
                hgId: hotel.hgId, name: hotel.name, giataId: hotel.giataId, pwId: hotel.peakworkId || `PW-${hotel.hgId}`,
                status: (res.validation.postProcessingApplied ? 'Generated with Trim' : 'Generated') + derivationStatus,
                chargeblocks: res.validation.chargeblockCount, trimApplied: res.validation.postProcessingApplied ? 'Deterministic dimension reduction' : 'None',
                lastGenerated: now, 
                notes: diag?.fallback?.matchType === 'DERIVED' 
                  ? `Duration Derived: ${diag.fallback.reason}` 
                  : ((res as any).partId && (res as any).isPartitioned) ? `Part ${(res as any).partId} (${(res as any).partKey})` : 'Generated successfully', 
                chunkId: ''
              };

              // Better bucket selection (Balanced Load Distribution)
              let bestBucketIdx = -1;
              let minCurrentCB = Infinity;
              
              for (let i = 0; i < chunkBuckets.length; i++) {
                if (chunkCBs[i] + hLog.chargeblocks <= INFRA_CHUNK_THRESHOLD) {
                  if (chunkCBs[i] < minCurrentCB) {
                    minCurrentCB = chunkCBs[i];
                    bestBucketIdx = i;
                  }
                }
              }
              
              if (bestBucketIdx !== -1) {
                chunkBuckets[bestBucketIdx].push(hLog);
                chunkCBs[bestBucketIdx] += hLog.chargeblocks;
              } else {
                chunkBuckets.push([hLog]);
                chunkCBs.push(hLog.chargeblocks);
              }
            });

            // Second pass: Rebalance tiny remainder chunks if possible
            if (chunkBuckets.length > 1) {
              const lastIdx = chunkBuckets.length - 1;
              const lastChunkSize = chunkCBs[lastIdx];
              const avgCB = totalFinalCB / chunkBuckets.length;
              
              // If last chunk is very small (< 40% of average), try to pull items from neighbors
              if (lastChunkSize < avgCB * 0.4) {
                 // Simple greedy rebalancing: try to merge last small chunk into previous ones if they have space
                 for (let i = 0; i < lastIdx; i++) {
                   const itemsToMove = [...chunkBuckets[lastIdx]];
                   let potentialNewCB = chunkCBs[i];
                   let canStashAll = true;
                   
                   for (const item of itemsToMove) {
                     if (potentialNewCB + item.chargeblocks > INFRA_CHUNK_THRESHOLD) {
                       canStashAll = false;
                       break;
                     }
                     potentialNewCB += item.chargeblocks;
                   }
                   
                   if (canStashAll) {
                     chunkBuckets[i].push(...chunkBuckets[lastIdx]);
                     chunkCBs[i] = potentialNewCB;
                     chunkBuckets.splice(lastIdx, 1);
                     chunkCBs.splice(lastIdx, 1);
                     break;
                   }
                 }
              }
            }

            // Finalize chunks
            chunkBuckets.forEach((cHotels, cIdx) => {
              const chunkId = `CHUNK_${String(cIdx + 1).padStart(2, '0')}`;
              const uniqueInChunk = new Set(cHotels.map(h => h.hgId)).size;
              cHotels.forEach(hl => hl.chunkId = chunkId);
              
              finalChunks.push({
                id: chunkId, index: cIdx + 1, fileName: `export_P${cIdx + 1}.zip`,
                status: cHotels.every(hl => hl.status === 'Generated') ? 'Success' : 'Trimmed',
                hotelCount: uniqueInChunk, predictedChargeblocks: chunkCBs[cIdx], actualChargeblocks: chunkCBs[cIdx],
                trimApplied: 'Mixed', strategy: 'Bin-Packing (Optimized)', outcome: 'SUCCESS',
                generatedAt: now, durationMs: 800 + (cHotels.length * 50),
                notes: `Load-balanced batch ${cIdx + 1}: ${cHotels.length} items from ${uniqueInChunk} hotels`,
                hotels: [...cHotels]
              });
            });

            if (blockedResultsPool.length > 0) {
              const failLogs: HotelLog[] = blockedResultsPool.map(item => {
                const hotel = item.hotel;
                const res = item.res!;
                const diag = res.validation.diagnosticStats?.ariDiagnostics?.[0];
                const displayReason = diag?.failureReason || (res.validation.chargeblockCount === 0 ? 'EXCLUDED_NO_ARI' : 'VALIDATION_FAILED');

                return {
                  hgId: hotel.hgId, name: hotel.name, giataId: hotel.giataId, pwId: hotel.peakworkId || `PW-${hotel.hgId}`,
                  status: res.validation.chargeblockCount === 0 ? displayReason : 'Failed',
                  chargeblocks: 0, trimApplied: 'None',
                  lastGenerated: now, notes: res.validation.chargeblockCount === 0 ? (diag?.fallback?.applied ? `Fallback Level: ${diag.fallback.level}` : 'Exhausted board/occupancy fallbacks') : 'Seasons validation failed',
                  chunkId: 'FAILED_POOL'
                };
              });
              
              finalChunks.push({
                id: 'FAILED_POOL', index: chunkBuckets.length + 1, fileName: 'none',
                status: 'Failed', hotelCount: failLogs.length, predictedChargeblocks: 0, actualChargeblocks: 0,
                trimApplied: 'None', strategy: 'Failure Reporting', outcome: 'FAILED',
                generatedAt: now, durationMs: 0, notes: 'Hotels that failed validation or produced no data',
                hotels: failLogs
              });
            }
          }
        }

        const maxChunkCB = finalChunks.length > 0 ? Math.max(...finalChunks.map(c => c.actualChargeblocks)) : totalFinalCB;
        const cbReductionRatio = totalFinalCB > 0 ? (totalFinalCB - maxChunkCB) / totalFinalCB : 0;
        
        const increasedGenerated = totalHotelPartsGenerated > hotelsGeneratedSet.size;
        const partitioningApplied = increasedGenerated;
        const totalItemsCount = totalHotelPartsGenerated;
        
        // In this implementation, we always package everything into a single ZIP for the user to download.
        // However, we represent the logical files generated (the EDF XMLs) or the physical download packs (the ZIPs).
        // The user says: "If there is one export ZIP/file, totalFilesGenerated = 1."
        const totalFilesGenerated = 1; 

        let strategyLabel = 'Single Batch (Non-Partitioned)';
        if (chunkingApplied) {
          strategyLabel = 'Single Batch (Non-Partitioned)';
        } else if (partitioningApplied) {
          strategyLabel = 'Partitioned Execution';
        }

        let chunkingBenefitReason = "Single export (no chunking applied). Total volume is within safe operational limits.";
        let decisionReason = "No chunking required because total workload is within safety thresholds.";
        const thresholdBreached = totalFinalCB > INFRA_CHUNK_THRESHOLD;

        if (chunkingApplied) {
          if (state.packagingStrategy === PackagingStrategy.MAXIMIZED) {
            chunkingBenefitReason = `Preserved commercial granularity via chunking into ${finalChunks.length} chunks as per packaging strategy.`;
            decisionReason = `Workload exceeded ${INFRA_CHUNK_THRESHOLD} CB. Preserving detail required splitting into ${finalChunks.length} chunks.`;
          } else if (state.packagingStrategy === PackagingStrategy.MINIMIZED) {
             chunkingBenefitReason = `Chunking applied as last resort matching safety limits after aggressive trimming.`;
             decisionReason = `Even with aggressive trimming, total volume exceeded single-file capacity. Chunking into ${finalChunks.length} files to maintain XML structure integrity.`;
          } else {
            chunkingBenefitReason = `System split inventory into ${finalChunks.length} chunks to fulfill product definition within safety limits.`;
            decisionReason = `Workload balanced across ${finalChunks.length} chunks to prevent downstream ingestion time-outs.`;
          }
        } else if (state.packagingStrategy === PackagingStrategy.MINIMIZED) {
           chunkingBenefitReason = "Successfully minimized to single export batch via merge/compression optimizations.";
           decisionReason = "Aggressive trimming enabled consolidation of large dataset into a single export file.";
        }

        if (!thresholdBreached && !partitioningApplied) {
          decisionReason = "Selected strategy did not change execution because workload did not breach chunking or partitioning thresholds.";
        }

        // --- Debug Summary Generation ---
        const runSummary: any = {
          hotelsInScope: inScopeHotels.length,
          hotelsGenerated: hotelsGeneratedSet.size,
          hotelsExcludedNoAri: Array.from(hotelsBlockedSet).length,
          roomsMatchedStrict: 0,
          roomsMatchedViaFallback: 0,
          roomsFailed: 0,
          dominantFailureReason: 'NONE'
        };

        const failureReasonsCount: Record<string, number> = {};
        allRecoveryResults.forEach(r => {
          const stats = r.res.validation.diagnosticStats;
          if (stats && stats.ariDiagnostics) {
            stats.ariDiagnostics.forEach((d: ARIMatchDiagnostic) => {
              if (d.fallback?.applied) runSummary.roomsMatchedViaFallback++;
              else if (d.strictMatch.mealPlanMatched && d.strictMatch.occupancyMatched) runSummary.roomsMatchedStrict++;
              
              if (d.failureReason) {
                runSummary.roomsFailed++;
                failureReasonsCount[d.failureReason] = (failureReasonsCount[d.failureReason] || 0) + 1;
              }
            });
          }
        });

        let maxCount = 0;
        Object.entries(failureReasonsCount).forEach(([reason, count]) => {
          if (count > maxCount) {
            maxCount = count;
            runSummary.dominantFailureReason = reason;
          }
        });

        console.log("EDF EXPORT RUN SUMMARY:", runSummary);

        // --- Determinism Audit Preparation ---
        const auditInput = {
          hotels: [...selectedHotelIds].sort(),
          destinations: Array.from(new Set(inScopeHotels.map(h => h.resolvedIata || h.destination))).sort(),
          productDefinition: {
            markets: [...state.productDefinition.markets].sort(),
            airports: [...state.productDefinition.airports].sort(),
            stayDurations: [...state.productDefinition.stayDurations].sort(),
            mealPlans: [...state.productDefinition.mealPlans].sort(),
            occupancies: state.productDefinition.occupancies.map(o => ({ adults: o.adults, children: o.children })),
            bookingWindowDays: state.productDefinition.bookingWindowDays
          }
        };

        const auditConfig = {
          strategy: state.packagingStrategy,
          maxCBPerRoom: MAX_CB_PER_ROOM,
          priceVarianceThreshold: PRICE_VARIANCE_THRESHOLD,
          executionMode: state.executionMode,
          ariMode: 'LIVE'
        };

        const auditData = {
          ariVersion: 'v1_live_makcorps',
          mappingVersion: 'dest_country_v2',
          dataSeed: 42 // Fixed seed for mock generation
        };

        const auditExecution = {
          hotelDecisions: allRecoveryResults.map(r => ({
            id: r.hotel.hgId,
            isPartitioned: r.res?.isPartitioned || false,
            partCount: r.res?.isPartitioned ? (allRecoveryResults.filter(ar => ar.hotel.hgId === r.hotel.hgId).length) : 1,
            chargeblocks: r.res?.validation.chargeblockCount || 0,
            status: r.res?.isBlocked ? 'Blocked' : 'Generated'
          })).sort((a, b) => a.id.localeCompare(b.id)),
          chunkStructure: finalChunks.map(c => ({
            id: c.id,
            hotelCount: c.hotelCount,
            cb: c.actualChargeblocks
          })),
          totals: {
            itemCount: totalItemsCount,
            totalCB: totalFinalCB
          }
        };

        const executionDecision: ExecutionDecision = {
          strategy: state.packagingStrategy,
          constraintTriggered: 'Volume',
          actionTaken: 'Balanced Chunking',
          selectedPackagingStrategy: state.packagingStrategy,
          totalInputCB: totalOriginalCB,
          finalOutputCB: totalFinalCB,
          threshold: 1200,
          partitioningApplied: partitioningApplied,
          chunkingApplied: chunkingApplied,
          trimmingApplied: hotelsTrimmedSet.size > 0,
          reason: decisionReason,
          note: "Post-merge CB may increase due to normalization/season expansion"
        };

        const determinismAudit = generateDeterminismAudit(auditInput, auditConfig, auditData, auditExecution);

        const report: ExportReport = {
          isValid: validResultsPool.length > 0,
          errorMessage: validResultsPool.length === 0 ? "No exportable seasons generated. Check booking window, durations, and availability rules." : undefined,
          timestamp: now,
          executionMode: state.executionMode,
          hotels: hotelValidations,
          similarities: [],
          chunks: finalChunks,
          chunkingApplied,
          partitioningApplied,
          execution: executionDecision,
          determinismAudit,
          inventorySummary: {
            inScopeHotels: selectedHotelIds.length,
            uniqueHotelsGenerated: hotelsGeneratedSet.size,
            hotelPartsGenerated: partitioningApplied ? totalHotelPartsGenerated : 0,
            filesGenerated: totalFilesGenerated,
            chunks: finalChunks.length,
            blockedHotels: hotelsBlockedSet.size,
            totalChargeblocks: totalFinalCB,
            itemCount: totalItemsCount,
            trimmedHotels: hotelsTrimmedSet.size
          },
          strategy: strategyLabel,
          chunkingBenefit: {
            applied: chunkingApplied,
            reason: chunkingBenefitReason,
            evaluationSkipped: false
          }
        };

        const runId = `RUN_EXP_${now.slice(0, 19).replace(/[-:]/g, '_').replace('T', '_')}`;
        const destCodes = Array.from(new Set(inScopeHotels.map(h => h.resolvedIata || h.destination)));
        
        const newLogs: DestinationLog[] = destCodes.map(destCode => {
            const hotelsInDest = inScopeHotels.filter(h => h.resolvedIata === destCode || h.destination === destCode);
            const hotelIdsInDest = new Set(hotelsInDest.map(h => h.hgId));
            
            const destChunks = finalChunks.filter(c => c.hotels.some(h => hotelIdsInDest.has(h.hgId)));
            const dHotels = allRecoveryResults.filter(r => hotelIdsInDest.has(r.hotel.hgId));
            const dGenerated = dHotels.filter(r => !r.res?.isBlocked).length;
            const dTrimmed = dHotels.filter(r => r.res?.validation.postProcessingApplied).length;
            const dBlocked = dHotels.filter(r => r.res?.isBlocked).length;
            const dPartitioned = dHotels.some(r => r.res?.isPartitioned);
            const dItems = dHotels.filter(r => !r.res?.isBlocked).length;
            const dCB = dHotels.reduce((acc, r) => acc + (r.res?.validation.chargeblockCount || 0), 0);

            const countriesFound = Array.from(new Set(hotelsInDest.map(h => h.country).filter(Boolean)));
            const logCountry = countriesFound.length === 1 ? countriesFound[0] : (countriesFound.length > 1 ? 'Multiple countries' : 'Unknown');
            const logDestName = destinationNameLookup.get(destCode) || destCode;

            let statusNote = `Generated ${dGenerated} hotels`;
            if (chunkingApplied || dPartitioned) {
               statusNote = `Generated ${dItems} items from ${dGenerated} hotels`;
               if (chunkingApplied) statusNote += ` across ${destChunks.length} chunks`;
            }

            return {
              id: runId, destination: destCode, name: logDestName, country: logCountry, hotelsInScope: hotelsInDest.length,
              hotelsGenerated: dGenerated, hotelsTrimmed: dTrimmed, hotelsBlocked: dBlocked, lastGenerationTime: now,
              status: dBlocked > 0 ? 'Partial' : 'Complete', statusNote,
              configId, triggeredBy: 'Amr Mohsen', userEmail: 'amrmohsenamin@gmail.com', sessionId,
              manifest: { 
                id: `M_${runId}`, 
                runId, 
                sessionId, 
                userId: 'U1', 
                userEmail: 'amrmohsenamin@gmail.com', 
                destinationCode: destCode, 
                destinationName: logDestName, 
                country: (logCountry as any) === 'Multiple countries' ? 'Multiple countries' : (logCountry as string), 
                productDefinitionVersion: configId, 
                generatedAt: now, 
                overallStatus: 'Complete', 
                execution: executionDecision,
                determinismAudit,
                content: {
                  hotelsGenerated: dGenerated,
                  itemCount: dItems,
                  totalChargeblocks: dCB
                },
                pdSnapshot: {
                  markets: state.productDefinition.markets,
                  airports: state.productDefinition.airports.map(code => ({ code, name: destinationNameLookup.get(code) || code })),
                  bookingWindowDays: state.productDefinition.bookingWindowDays,
                  stayDurations: state.productDefinition.stayDurations,
                  mealPlans: state.productDefinition.mealPlans,
                  occupancies: state.productDefinition.occupancies
                }
              },
              chunks: destChunks, events: []
            };
        });

        setEdfLogs(prev => [...newLogs, ...prev]);
        setLastExportReport(report);
        setShowReportModal(true);
        zip.file("export_validation_report.json", JSON.stringify(report, null, 2));

        const content = await zip.generateAsync({ type: 'blob' });
        setTotalExported(selectedHotelIds.length);
        const url = URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `EDF_EXPORT_${now.split('T')[0]}.zip`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        let successMsg = `Export complete. ${hotelsGeneratedSet.size} hotels generated.`;
        if (chunkingApplied || partitioningApplied) {
           successMsg = `Export complete. ${totalItemsCount} items generated from ${hotelsGeneratedSet.size} hotels.`;
        }
        setNotification({ 
          message: successMsg, 
          type: 'success' 
        });
      } catch (err: any) {
        setNotification({ message: `Export failed: ${err.message}`, type: 'error' });
      }
    }, 100);
  };

  const renderPackagingRules = (isDrawer = false) => {
    const product = state.productDefinition;
    return (
      <div className={isDrawer ? "p-0 space-y-6" : "space-y-6"}>
        <div className={`hg-panel p-0 overflow-hidden ${isDrawer ? 'border-none bg-transparent' : ''}`}>
          {!isDrawer && (
            <div className="p-4 border-b border-hg-divider bg-hg-nav">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="bg-hg-accent text-hg-bg px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wider">Step 2</span>
                  <h2 className="text-[12px] font-bold uppercase tracking-wider text-hg-text">Packaging Configuration</h2>
                </div>
                <button 
                  onClick={applyAllRecommendations}
                  className="text-[10px] font-bold text-hg-accent hover:bg-hg-accent/10 border border-hg-accent/20 px-2 py-1 rounded transition-all flex items-center gap-1.5 uppercase"
                >
                  <Sparkles size={12} />
                  Recommended
                </button>
              </div>
            </div>
          )}
          
          <div className="divide-y divide-hg-divider">
            {/* Source Markets */}
            <div className={`p-5 space-y-3 transition-all duration-300 ${isBlocked ? 'bg-red-500/5' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-hg-text flex items-center gap-2">
                     <Globe size={12} className="text-hg-accent" /> Source Markets
                  </label>
                  <span className="text-[10px] text-hg-muted font-medium uppercase tracking-tighter">Commercial grouping & overrides</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setState(prev => ({ 
                      ...prev, 
                      productDefinition: {
                        ...prev.productDefinition,
                        selectedClusters: [],
                        markets: [], 
                        airports: [],
                        marketAirports: {},
                        marketOverrideStates: {}
                      }
                    }))}
                    className="text-[11px] font-bold text-hg-muted hover:text-hg-text transition-colors disabled:opacity-30 disabled:cursor-not-allowed px-1"
                  >
                    CLEAR
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {/* Selected Clusters & Individual Markets */}
                <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-hg-input border border-hg-border rounded">
                  {(() => {
                    const clusters = product.selectedClusters;
                    const keys = clusters.map((cid, idx) => stableKey("builder-cluster", cid, idx));
                    logKeyDuplication("Builder (Selected Clusters)", keys, clusters);
                    return clusters.map((cid, idx) => (
                      <button 
                        key={keys[idx]} 
                        onClick={() => {
                          const next = new Set(expandedClusters);
                          if (next.has(cid)) next.delete(cid);
                          else next.add(cid);
                          setExpandedClusters(next);
                        }}
                        className={`flex items-center bg-hg-accent/10 border border-hg-accent/30 rounded px-2 py-1 gap-2 group transition-all ${expandedClusters.has(cid) ? 'ring-1 ring-hg-accent bg-hg-accent/20' : 'hover:bg-hg-accent/15'}`}
                      >
                         <div className="flex flex-col items-start text-left">
                           <span className="text-[10px] font-bold text-hg-accent uppercase leading-none">{cid} Cluster</span>
                           <span className="text-[9px] text-hg-accent/60 leading-tight">
                             {MARKET_CLUSTERS.find(c => c.id === cid)?.countries.filter(m => product.markets.includes(m)).length} Member Markets
                           </span>
                         </div>
                         <div className="flex items-center gap-1.5 ml-1">
                           <ChevronDown size={12} className={`text-hg-accent transition-transform duration-300 ${expandedClusters.has(cid) ? 'rotate-180' : ''}`} />
                           <X size={12} className="text-hg-accent/40 hover:text-hg-accent" onClick={(e) => { e.stopPropagation(); toggleCluster(cid); }} />
                         </div>
                      </button>
                    ));
                  })()}

                  {product.markets.filter(m => !MARKET_CLUSTERS.some(c => product.selectedClusters.includes(c.id) && c.countries.includes(m))).map((m, idx) => (
                    <Badge key={stableKey("market-badge-indiv", m, idx)} onRemove={() => toggleMarketInCluster(m)} active>
                      {`${m} (INDIVIDUAL)`}
                    </Badge>
                  ))}
                  
                  <div className="relative">
                    <button 
                      id={`add-market-trigger${isDrawer ? '-drawer' : ''}`}
                      onClick={() => setActiveDropdown(activeDropdown === 'market' ? null : 'market')}
                      className={`text-[11px] px-2 py-1 h-full flex items-center gap-1.5 rounded border transition-colors ${activeDropdown === 'market' ? 'bg-hg-accent text-hg-bg border-hg-accent shadow-lg' : 'text-hg-muted hover:text-hg-accent border-hg-border hover:border-hg-accent'}`}
                    >
                      + ADD <ChevronDown size={10} />
                    </button>
                    {activeDropdown === 'market' && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)} />
                        <div className="absolute top-full left-0 mt-1 w-64 bg-hg-panel border border-hg-border z-10 p-2 rounded shadow-2xl max-h-64 overflow-y-auto no-scrollbar">
                          <div className="sticky top-0 bg-hg-panel pb-2 mb-2 border-b border-hg-divider">
                            <input 
                              type="text" 
                              placeholder="Search markets or clusters..."
                              value={marketSearch}
                              onChange={(e) => setMarketSearch(e.target.value)}
                              className="w-full bg-hg-input border border-hg-border rounded pl-3 pr-3 py-1.5 text-[12px] focus:outline-none focus:border-hg-accent transition-colors"
                              autoFocus
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            {filteredMarketOptions.map((opt, idx) => {
                              const isSelected = opt.isCluster 
                                ? product.selectedClusters.includes(opt.code)
                                : product.markets.includes(opt.code);

                              return (
                                <button 
                                  key={stableKey("market-dd", opt.code, idx, opt.isCluster ? "cluster" : "indiv")} 
                                  onClick={() => opt.isCluster ? toggleCluster(opt.code) : toggleMarketInCluster(opt.code)}
                                  className={`text-[12px] px-3 py-2 text-left hover:bg-hg-divider transition-colors flex items-center justify-between rounded ${isSelected ? 'text-hg-accent font-bold bg-hg-accent/5' : 'text-hg-muted'}`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span>{opt.name}</span>
                                    {opt.isCluster && <span className="text-[8px] border border-hg-accent/20 bg-hg-accent/5 text-hg-accent px-1 rounded font-bold uppercase tracking-tighter">Cluster</span>}
                                  </div>
                                  {isSelected && <CheckCircle2 size={12} />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Expanded Cluster Management (Nested Rows) */}
                {MARKET_CLUSTERS.filter(c => expandedClusters.has(c.id)).map(cluster => (
                  <motion.div 
                    key={stableKey("cluster-mgmt", cluster.id)} 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="bg-hg-nav/50 border border-hg-divider rounded overflow-hidden"
                  >
                    <div className="px-3 py-1.5 bg-hg-divider/30 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-hg-text uppercase tracking-wider">{cluster.name} Management</span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => cluster.countries.forEach(m => !product.markets.includes(m) && toggleMarketInCluster(m))}
                          className="text-[9px] font-bold text-hg-accent hover:underline uppercase"
                        >
                          Include All
                        </button>
                        <button 
                          onClick={() => cluster.countries.forEach(m => product.markets.includes(m) && toggleMarketInCluster(m))}
                          className="text-[9px] font-bold text-hg-muted hover:text-hg-text uppercase"
                        >
                          Exclude All
                        </button>
                      </div>
                    </div>
                    <div className="p-2 space-y-1">
                      {cluster.countries.map((mCode, idx) => {
                        const isIncluded = product.markets.includes(mCode);
                        const overrideState = product.marketOverrideStates[mCode];
                        return (
                          <div key={stableKey("cluster-country", cluster.id, mCode, idx)} className="flex items-center justify-between px-2 py-1.5 hover:bg-hg-divider/30 rounded transition-colors group">
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={() => toggleMarketInCluster(mCode)}
                                className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isIncluded ? 'bg-hg-accent border-hg-accent text-hg-bg' : 'border-hg-border bg-hg-input text-transparent'}`}
                              >
                                <CheckCircle2 size={10} />
                              </button>
                              <span className={`text-[12px] font-medium transition-colors ${isIncluded ? 'text-hg-text' : 'text-hg-muted/40 line-through'}`}>
                                {COUNTRIES.find(c => c.code === mCode)?.name} ({mCode})
                              </span>
                            </div>
                            <div className="flex items-center gap-3 pr-1">
                              {isIncluded && (
                                <>
                                  <div className="flex flex-col items-end">
                                    <span className="text-[9px] font-mono text-hg-muted uppercase tracking-tighter">{(product.marketAirports[mCode] || (AIRPORT_MAPPING[mCode] || []).map(p => p.code)).length} Airports</span>
                                    <span className={`text-[8px] font-bold uppercase px-1 rounded border leading-tight ${
                                      overrideState === 'override' ? 'border-hg-warning/30 bg-hg-warning/5 text-hg-warning' : 
                                      overrideState === 'inherited' ? 'border-hg-accent/30 bg-hg-accent/5 text-hg-accent' : 
                                      'border-hg-muted/30 bg-hg-muted/5 text-hg-muted'
                                    }`}>
                                      {overrideState}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>

              <ValidationError message={fieldErrors.markets} />
            </div>

            {/* Departure Airports */}
            <div className={`p-5 space-y-4 transition-all duration-300 ${isBlocked || product.markets.length === 0 ? 'bg-red-500/5' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-hg-text flex items-center gap-2">
                     <Plane size={12} className="text-hg-accent" /> Departure Airports
                  </label>
                  <span className="text-[10px] text-hg-muted font-medium uppercase tracking-tighter">Configure network mapping per Source Market</span>
                </div>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto no-scrollbar pr-1">
                {product.markets.map((marketCode, idx) => {
                  const country = COUNTRIES.find(c => c.code === marketCode);
                  const marketPorts = product.marketAirports[marketCode] || (AIRPORT_MAPPING[marketCode] || []).map(p => p.code);
                  const isOverridden = product.marketOverrideStates[marketCode] === 'override';
                  
                  return (
                    <div key={stableKey("market-dep-ports", marketCode, idx)} className="bg-hg-panel border border-hg-divider rounded overflow-hidden shadow-sm">
                      <div className="bg-hg-nav px-3 py-2 border-b border-hg-divider flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-hg-text">{country?.name || marketCode}</span>
                          <span className="text-[9px] font-mono text-hg-muted">{marketCode}</span>
                          <span className={`text-[8px] font-bold uppercase px-1 rounded border leading-tight ${
                            isOverridden ? 'border-hg-warning/30 bg-hg-warning/5 text-hg-warning' : 'border-hg-accent/30 bg-hg-accent/5 text-hg-accent'
                          }`}>
                            {isOverridden ? 'Manual Override' : 'Inherited Defaults'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => {
                              const allMarketPorts = (AIRPORT_MAPPING[marketCode] || []).map(p => p.code);
                              setState(prev => ({
                                ...prev,
                                productDefinition: {
                                  ...prev.productDefinition,
                                  marketAirports: { ...prev.productDefinition.marketAirports, [marketCode]: allMarketPorts },
                                  marketOverrideStates: { ...prev.productDefinition.marketOverrideStates, [marketCode]: 'override' }
                                }
                              }));
                            }}
                            className="text-[9px] font-bold text-hg-accent hover:underline uppercase"
                          >
                            All
                          </button>
                          <button 
                            onClick={() => {
                              setState(prev => ({
                                ...prev,
                                productDefinition: {
                                  ...prev.productDefinition,
                                  marketAirports: { ...prev.productDefinition.marketAirports, [marketCode]: [] },
                                  marketOverrideStates: { ...prev.productDefinition.marketOverrideStates, [marketCode]: 'override' }
                                }
                              }));
                            }}
                            className="text-[9px] font-bold text-hg-muted hover:text-hg-text uppercase"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-hg-input/30 min-h-[40px] flex flex-wrap gap-1.5 items-center">
                        {marketPorts.map((apCode, idx) => {
                          const apName = AIRPORT_MAPPING[marketCode]?.find(p => p.code === apCode)?.name || apCode;
                          return (
                            <Badge 
                              key={stableKey("dep-ap-badge", marketCode, apCode, idx)} 
                              onRemove={() => {
                                setState(prev => ({
                                  ...prev,
                                  productDefinition: {
                                    ...prev.productDefinition,
                                    marketAirports: {
                                      ...prev.productDefinition.marketAirports,
                                      [marketCode]: marketPorts.filter(x => x !== apCode)
                                    },
                                    marketOverrideStates: { ...prev.productDefinition.marketOverrideStates, [marketCode]: 'override' }
                                  }
                                }));
                              }} 
                              active
                            >
                              {apName}
                            </Badge>
                          );
                        })}

                        <div className="relative">
                          <button 
                            id={`airport-trigger-${marketCode}${isDrawer ? '-drawer' : ''}`}
                            onClick={() => setActiveDropdown(activeDropdown === `airport-${marketCode}` ? null : `airport-${marketCode}`)}
                            className="px-2 py-0.5 border border-hg-border rounded text-hg-muted hover:text-hg-accent hover:border-hg-accent text-[10px] flex items-center gap-1 transition-colors"
                          >
                            + ADD <ChevronDown size={10} />
                          </button>
                          <PortalDropdown 
                            anchorEl={activeDropdown === `airport-${marketCode}` ? document.getElementById(`airport-trigger-${marketCode}${isDrawer ? '-drawer' : ''}`) : null}
                            onClose={() => { setActiveDropdown(null); setAirportSearch(''); }}
                          >
                            <div className="p-2 space-y-2 w-64">
                              <div className="sticky top-0 bg-hg-panel pb-2 mb-1 border-b border-hg-divider">
                                <input 
                                  type="text"
                                  placeholder="Search airports..."
                                  value={airportSearch}
                                  onChange={(e) => setAirportSearch(e.target.value)}
                                  className="w-full bg-hg-input border border-hg-border rounded px-3 py-1.5 text-[12px] focus:outline-none focus:border-hg-accent transition-colors"
                                  autoFocus
                                />
                              </div>
                              <div className="flex flex-col gap-1 max-h-64 overflow-y-auto no-scrollbar py-1">
                                {(AIRPORT_MAPPING[marketCode] || [])
                                  .filter(ap => 
                                    ap.name.toLowerCase().includes(airportSearch.toLowerCase()) || 
                                    ap.code.toLowerCase().includes(airportSearch.toLowerCase())
                                  ).map((ap, idx) => {
                                  const isSelected = marketPorts.includes(ap.code);
                                  return (
                                    <button 
                                      key={stableKey("ap-dd-opt", marketCode, ap.code, idx)}
                                      onClick={() => {
                                        const current = product.marketAirports[marketCode] || (AIRPORT_MAPPING[marketCode] || []).map(p => p.code);
                                        const isIncluded = current.includes(ap.code);
                                        setState(prev => ({
                                          ...prev,
                                          productDefinition: {
                                            ...prev.productDefinition,
                                            marketAirports: {
                                              ...prev.productDefinition.marketAirports,
                                              [marketCode]: isIncluded ? current.filter(x => x !== ap.code) : [...current, ap.code]
                                            },
                                            marketOverrideStates: { ...prev.productDefinition.marketOverrideStates, [marketCode]: 'override' }
                                          }
                                        }));
                                      }}
                                      className={`text-[12px] px-3 py-2 text-left rounded hover:bg-hg-divider transition-colors ${isSelected ? 'text-hg-accent font-bold bg-hg-accent/5' : 'text-hg-muted'}`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span>{ap.name}</span>
                                        <span className="text-[10px] font-mono opacity-50 uppercase">({ap.code})</span>
                                      </div>
                                      {isSelected && <CheckCircle2 size={12} />}
                                    </button>
                                  );
                                })}
                              </div>
                              
                              <div className="pt-2 border-t border-hg-divider">
                                <div className="px-1 mb-1.5 flex flex-col">
                                  <span className="text-[9px] font-bold text-hg-muted uppercase tracking-wider">Bulk Add (IATA)</span>
                                  <span className="text-[8px] text-hg-muted/60 leading-none">Comma-separated list</span>
                                </div>
                                <div className="flex gap-1 px-1">
                                  <input 
                                    type="text" 
                                    placeholder="LHR, LGW, STN..."
                                    className="flex-1 bg-hg-input border border-hg-border rounded px-2 py-1.5 text-[12px] focus:outline-none focus:border-hg-accent transition-colors"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        const val = (e.currentTarget.value || '').toUpperCase();
                                        const codes = val.split(',').map(s => s.trim()).filter(Boolean);
                                        const current = product.marketAirports[marketCode] || (AIRPORT_MAPPING[marketCode] || []).map(p => p.code);
                                        setState(prev => ({
                                          ...prev,
                                          productDefinition: {
                                            ...prev.productDefinition,
                                            marketAirports: {
                                              ...prev.productDefinition.marketAirports,
                                              [marketCode]: Array.from(new Set([...current, ...codes]))
                                            },
                                            marketOverrideStates: { ...prev.productDefinition.marketOverrideStates, [marketCode]: 'override' }
                                          }
                                        }));
                                        e.currentTarget.value = '';
                                        setActiveDropdown(null);
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </PortalDropdown>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <ValidationError message={fieldErrors.airports} />
            </div>

            {/* Booking Window */}
            <div className={`p-5 space-y-3 transition-all duration-300 ${isBlocked ? 'bg-red-500/5' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-hg-muted">Booking Window (Days)</label>
                  <button 
                    onClick={applyRecommendedBookingWindow}
                    className="text-[10px] font-bold text-hg-accent hover:text-hg-accent-dark transition-colors flex flex-col items-start gap-0.5 disabled:opacity-30 disabled:cursor-not-allowed group mt-1"
                  >
                    <span className="flex items-center gap-1 uppercase tracking-widest text-[9px] px-1 py-0.5 bg-hg-accent/5 border border-hg-accent/20 rounded">
                      <Sparkles size={10} /> Commercially Recommended
                    </span>
                    <span className="text-[9px] text-hg-muted font-medium opacity-0 group-hover:opacity-100 transition-opacity">Based on source-market booking lead-time behavior</span>
                  </button>
                </div>
                <input 
                  type="number" 
                  value={product.bookingWindowDays}
                  onChange={(e) => setState(prev => ({ 
                    ...prev, 
                    productDefinition: {
                      ...prev.productDefinition,
                      bookingWindowDays: Number(e.target.value) 
                    }
                  }))}
                  className="hg-input w-16 text-center py-1 h-8 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <input 
                type="range" 
                min="1" 
                max="365" 
                value={product.bookingWindowDays}
                onChange={(e) => setState(prev => ({ 
                  ...prev, 
                  productDefinition: {
                    ...prev.productDefinition,
                    bookingWindowDays: Number(e.target.value) 
                  }
                }))}
                className={`w-full accent-hg-accent h-1.5 bg-hg-divider rounded-full appearance-none transition-all cursor-pointer`}
              />
              <ValidationError message={fieldErrors.bookingWindowDays} />
            </div>

            {/* Durations */}
            <div className={`p-5 space-y-3 transition-all duration-300 ${isBlocked ? 'bg-red-500/5' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-hg-muted">Durations (Nights)</label>
                  <button 
                    onClick={applyRecommendedDurations}
                    className="text-[10px] font-bold text-hg-accent hover:text-hg-accent-dark transition-colors flex flex-col items-start gap-0.5 disabled:opacity-30 disabled:cursor-not-allowed group mt-1"
                  >
                    <span className="flex items-center gap-1 uppercase tracking-widest text-[9px] px-1 py-0.5 bg-hg-accent/5 border border-hg-accent/20 rounded">
                      <Sparkles size={10} /> Commercially Recommended
                    </span>
                    <span className="text-[9px] text-hg-muted font-medium opacity-0 group-hover:opacity-100 transition-opacity">Based on market and destination stay patterns</span>
                  </button>
                </div>
                <div className="flex gap-3 mt-1">
                  <button 
                    onClick={() => setState(prev => ({ 
                      ...prev, 
                      productDefinition: {
                        ...prev.productDefinition,
                        stayDurations: [] 
                      }
                    }))}
                    className="text-[11px] font-bold text-hg-muted hover:text-hg-text transition-colors"
                  >
                    CLEAR
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-10 gap-1 p-1.5 bg-hg-input border border-hg-border rounded-[4px]">
                {(() => {
                  const durations = Array.from({ length: 30 }, (_, i) => i + 1);
                  const keys = durations.map(n => stableKey("builder-duration", n));
                  logKeyDuplication("Builder (Durations)", keys, durations);
                  return durations.map((n, idx) => {
                    const isRecommended = recommendations.stayDurations.includes(n);
                    const isSelected = product.stayDurations.includes(n);
                    return (
                      <button
                        key={keys[idx]}
                        onClick={() => toggleTag('stayDurations', n)}
                        className={`aspect-square flex items-center justify-center text-[11px] font-bold rounded-[4px] transition-colors relative ${
                          isSelected 
                          ? 'bg-hg-accent text-hg-bg' 
                          : isRecommended 
                            ? 'bg-hg-accent/10 text-hg-accent hover:bg-hg-accent/20' 
                            : 'text-hg-muted hover:bg-hg-divider hover:text-hg-text'
                        } cursor-pointer`}
                      >
                        {n}
                        {isRecommended && !isSelected && (
                          <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-hg-accent rounded-full border border-hg-bg" />
                        )}
                      </button>
                    );
                  });
                })()}
              </div>
              <ValidationError message={fieldErrors.stayDurations} />
            </div>

            {/* Meal Plans */}
            <div className={`p-5 space-y-3 transition-all duration-300 ${isBlocked ? 'bg-red-500/5' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-hg-muted">Meal Plans</label>
                  <button 
                    onClick={applyRecommendedMealPlans}
                    className="text-[10px] font-bold text-hg-accent hover:text-hg-accent-dark transition-colors flex flex-col items-start gap-0.5 disabled:opacity-30 disabled:cursor-not-allowed group mt-1"
                  >
                    <span className="flex items-center gap-1 uppercase tracking-widest text-[9px] px-1 py-0.5 bg-hg-accent/5 border border-hg-accent/20 rounded">
                      <Sparkles size={10} /> Commercially Recommended
                    </span>
                    <span className="text-[9px] text-hg-muted font-medium opacity-0 group-hover:opacity-100 transition-opacity">Based on commercial board preference</span>
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 p-2 bg-hg-input border border-hg-border rounded-[4px]">
                {(() => {
                  const keys = MEAL_PLANS.map(mp => stableKey("builder-mp", mp));
                  logKeyDuplication("Builder (Meal Plans)", keys, MEAL_PLANS);
                  return MEAL_PLANS.map((mp, idx) => {
                    const isSelected = product.mealPlans.includes(mp);
                    return (
                      <button
                        key={keys[idx]}
                        onClick={() => toggleTag('mealPlans', mp)}
                        className={`px-3 py-1.5 text-[11px] font-bold rounded-[4px] border transition-colors ${
                          isSelected
                          ? 'bg-hg-accent text-hg-bg border-hg-accent'
                          : 'bg-hg-panel text-hg-muted border-hg-divider hover:border-hg-muted'
                        } cursor-pointer`}
                      >
                        {mp}
                      </button>
                    );
                  });
                })()}
              </div>
              <ValidationError message={fieldErrors.mealPlans} />
            </div>

            {/* Occupancy Matrix */}
            <div className={`p-5 space-y-4 transition-all duration-300 ${isBlocked ? 'bg-red-500/5' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-hg-muted">Occupancy Matrix</label>
                  <button 
                    onClick={applyRecommendedOccupancies}
                    className="text-[10px] font-bold text-hg-accent hover:text-hg-accent-dark transition-colors flex flex-col items-start gap-0.5 disabled:opacity-30 disabled:cursor-not-allowed group mt-1"
                  >
                    <span className="flex items-center gap-1 uppercase tracking-widest text-[9px] px-1 py-0.5 bg-hg-accent/5 border border-hg-accent/20 rounded">
                      <Sparkles size={10} /> Commercially Recommended
                    </span>
                    <span className="text-[9px] text-hg-muted font-medium opacity-0 group-hover:opacity-100 transition-opacity">Based on common demand composition</span>
                  </button>
                </div>
                <div className="flex gap-3 pb-8">
                  <button 
                    onClick={addOccupancy} 
                    className="text-[11px] font-bold text-hg-muted hover:text-hg-text transition-colors flex items-center gap-1"
                  >
                    <Plus size={12} /> ADD ROW
                  </button>
                </div>
              </div>

              <div className="border border-hg-border rounded-[4px] overflow-x-auto no-scrollbar">
                <table className="w-full text-left text-[13px] border-collapse">
                  <thead>
                    <tr className="bg-hg-nav border-b border-hg-border">
                      <th className="hg-table-header py-2 px-3">Adults</th>
                      <th className="hg-table-header py-2 px-3">Children</th>
                      <th className="hg-table-header py-2 px-3">Age From</th>
                      <th className="hg-table-header py-2 px-3">Age To</th>
                      <th className="hg-table-header w-10 py-2 px-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hg-divider">
                    {(() => {
                      const occupancies = product.occupancies;
                      const keys = occupancies.map((occ, index) => stableKey("builder-occ", occ.id, index));
                      logKeyDuplication("Builder (Occupancy Matrix)", keys, occupancies);
                      return occupancies.map((occ, index) => {
                      const isDuplicate = product.occupancies.some((o, i) => {
                        if (i === index) return false;
                        const key1 = o.children === 0 ? `${o.adults}-0` : `${o.adults}-${o.children}-${o.ageFrom}-${o.ageTo}`;
                        const key2 = occ.children === 0 ? `${occ.adults}-0` : `${occ.adults}-${occ.children}-${occ.ageFrom}-${occ.ageTo}`;
                        return key1 === key2;
                      });

                      return (
                        <tr key={keys[index]} className={`hover:bg-hg-divider/50 transition-colors ${isDuplicate ? 'bg-red-500/5' : ''}`}>
                          <td className="hg-table-cell py-2 px-3">
                            <input 
                              type="number" 
                              value={occ.adults} 
                              min="1"
                              max="9"
                              onChange={(e) => updateOccupancy(occ.id, 'adults', Number(e.target.value))}
                              className="hg-input w-full text-center h-8 font-mono font-bold text-hg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </td>
                          <td className="hg-table-cell py-2 px-3">
                            <input 
                              type="number" 
                              value={occ.children} 
                              min="0"
                              max="9"
                              onChange={(e) => updateOccupancy(occ.id, 'children', Number(e.target.value))}
                              className="hg-input w-full text-center h-8 font-mono font-bold text-hg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </td>
                          <td className="hg-table-cell py-2 px-3">
                            <input 
                              type="number" 
                              value={occ.ageFrom} 
                              min="0"
                              max="17"
                              disabled={occ.children === 0}
                              onChange={(e) => updateOccupancy(occ.id, 'ageFrom', Number(e.target.value))}
                              className={`hg-input w-full text-center disabled:opacity-20 h-8 ${occ.children > 0 && occ.ageFrom > occ.ageTo ? 'border-red-500 text-red-400' : ''}`}
                            />
                          </td>
                          <td className="hg-table-cell py-2 px-3">
                            <input 
                              type="number" 
                              value={occ.ageTo} 
                              min="0"
                              max="17"
                              disabled={occ.children === 0}
                              onChange={(e) => updateOccupancy(occ.id, 'ageTo', Number(e.target.value))}
                              className={`hg-input w-full text-center disabled:opacity-20 h-8 ${occ.children > 0 && occ.ageFrom > occ.ageTo ? 'border-red-500 text-red-400' : ''}`}
                            />
                          </td>
                          <td className="hg-table-cell py-2 px-3 text-right">
                            <button 
                              onClick={() => removeOccupancy(occ.id)} 
                              className="text-hg-muted hover:text-red-400 p-1.5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
                </table>
              </div>
              <ValidationError message={fieldErrors.occupancy} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderImpactPanel = (isMobileView = false) => {
    const totalRooms = metrics.valid + metrics.trimmed;
    const hasViolations = metrics.trimmed > 0;

    return (
      <div className={`hg-panel border-l-4 ${hasViolations ? 'border-l-red-500' : 'border-l-hg-accent'} p-5 ${isMobileView ? 'mb-4 shadow-lg' : 'mt-4'}`}>
        <div className="flex flex-wrap items-center gap-y-6 gap-x-8">
          <div className="flex items-center gap-6 sm:gap-8 flex-wrap">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-hg-muted">
                <Database size={12} />
                <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-wider">Hotels Found</span>
              </div>
              <div className="text-lg sm:text-xl font-mono font-bold text-hg-text tabular-nums tracking-tighter">
                {metrics.inScopeHotels.length}
              </div>
            </div>

            <div className="hidden sm:block w-px h-10 bg-hg-divider" />

            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-hg-muted">
                <Archive size={12} />
                <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-wider">Rooms Total</span>
              </div>
              <div className="text-lg sm:text-xl font-mono font-bold text-hg-text tabular-nums tracking-tighter">
                {formatNumber(totalRooms)}
              </div>
            </div>

            <div className="hidden sm:block w-px h-10 bg-hg-divider" />

            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-hg-success">
                <CheckCircle2 size={12} />
                <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-wider">Rooms Safe</span>
              </div>
              <div className="text-lg sm:text-xl font-mono font-bold text-hg-success tabular-nums tracking-tighter">
                {formatNumber(metrics.valid)}
              </div>
            </div>

            <div className="hidden sm:block w-px h-10 bg-hg-divider" />

            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-red-500">
                <AlertTriangle size={12} />
                <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-wider">Exceeding Limit</span>
              </div>
              <div className="text-lg sm:text-xl font-mono font-bold text-red-500 tabular-nums tracking-tighter">
                {formatNumber(metrics.trimmed)}
              </div>
            </div>
          </div>

          <div className={`${isMobileView ? 'w-full' : 'ml-auto'} flex items-center justify-between sm:justify-end gap-6 sm:gap-6`}>
               <div className="flex flex-col items-start sm:items-end">
                  <span className="text-[10px] sm:text-[11px] font-bold text-neutral-500 uppercase tracking-wider">ARI Feed Status</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      metrics.hasZeroCB ? 'bg-red-500' : 
                      metrics.trimmed > 0 ? 'bg-yellow-500' : 
                      'bg-green-500'
                    }`} />
                    <span className={`text-[12px] sm:text-[13px] font-bold ${
                      metrics.hasZeroCB ? 'text-red-500' : 
                      metrics.trimmed > 0 ? 'text-yellow-500' : 
                      'text-green-500'
                    }`}>
                      {metrics.hasZeroCB ? 'ARI BLOCKED' : metrics.trimmed > 0 ? 'PARTIAL DATA' : 'COMPLIANT (STATIC)'}
                    </span>
                  </div>
                </div>
            <button 
              onClick={handleGeneratePreview}
              disabled={errors.length > 0 || metrics.hasZeroCB}
              title={metrics.hasZeroCB ? "Export blocked: no valid ARI data available" : ""}
              className={`h-10 sm:h-11 px-4 sm:px-6 flex items-center gap-3 transition-all duration-300 ${ (metrics.hasZeroCB) ? 'bg-red-900/50 text-red-500 border border-red-500/30 cursor-not-allowed grayscale' : 'hg-button-primary'}`}
            >
              <span className="text-[12px] sm:text-[13px] font-bold uppercase tracking-widest whitespace-nowrap">
                {metrics.hasZeroCB ? 'No ARI' : isMobileView ? 'Preview' : 'Validate & Preview'}
              </span> 
              <ArrowRight size={16} className="hidden sm:block" />
            </button>
          </div>
        </div>
      </div>
    );
  };


  const isDestinationsValid = useMemo(() => product.destinations.length > 0, [product.destinations.length]);
  const isHotelsValid = useMemo(() => selectedHotels.length > 0, [selectedHotels.length]);
  const isRulesValid = useMemo(() => metrics.total > 0, [metrics.total]);

  const [currentStep, setCurrentStep] = useState(1);
  
  const inScopeHotels = metrics.inScopeHotels;

  // Sync tabs with steps
  useEffect(() => {
    if (currentStep === 1 || currentStep === 2) {
      if (activeDesktopTab !== 'product') setActiveDesktopTab('product');
    } else if (currentStep === 3) {
      if (activeDesktopTab !== 'packaging') setActiveDesktopTab('packaging');
    } else if (currentStep === 4) {
      if (activeDesktopTab !== 'review') setActiveDesktopTab('review');
    }
  }, [currentStep]);

  // Sync steps with tabs (for Sidebar/Navbar navigation)
  useEffect(() => {
    if (activeDesktopTab === 'review') setCurrentStep(4);
    else if (activeDesktopTab === 'packaging') setCurrentStep(3);
    else if (activeDesktopTab === 'product' && currentStep > 2) setCurrentStep(2);
  }, [activeDesktopTab]);

  const handleStepNavigation = useCallback((targetStep: number) => {
    // Backwards is always allowed
    if (targetStep < currentStep) {
      setCurrentStep(targetStep);
      return;
    }

    // Forward validation
    if (targetStep === 2 && !isDestinationsValid) {
      setNotification({ message: 'Complete previous step first: Select Destinations', type: 'error' });
      return;
    }
    if (targetStep === 3 && !isHotelsValid) {
      setNotification({ message: 'Complete previous step first: Select Hotels', type: 'error' });
      return;
    }
    if (targetStep === 4 && !isRulesValid) {
      setNotification({ message: 'Complete previous step first: Complete Rule Configuration', type: 'error' });
      return;
    }

    setCurrentStep(targetStep);
  }, [currentStep, isDestinationsValid, isHotelsValid, isRulesValid]);

  const canNavigate = useCallback((targetStep: number) => {
    if (targetStep <= currentStep) return { allowed: true };
    if (targetStep === 2) return { allowed: isDestinationsValid };
    if (targetStep === 3) return { allowed: isHotelsValid };
    if (targetStep === 4) return { allowed: isRulesValid };
    return { allowed: false };
  }, [currentStep, isDestinationsValid, isHotelsValid, isRulesValid]);

  const currentStepName = useMemo(() => {
    switch(currentStep) {
      case 1: return 'Destinations';
      case 2: return 'Hotels';
      case 3: return 'Configure Rules';
      case 4: return 'Export EDF';
      default: return '';
    }
  }, [currentStep]);

  useEffect(() => {
    if (isMobile && !isLandscape && currentStep === 2 && activeDesktopTab === 'product') {
      const el = document.getElementById('hotels-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentStep, isMobile, isLandscape, activeDesktopTab]);

  return (
    <div className={`min-h-screen bg-hg-bg text-hg-text max-w-full overflow-x-hidden relative ${isMobile && !isLandscape ? 'pb-16' : ''}`}>
      {!isMobile ? (
        <header className="fixed top-0 left-0 right-0 z-[2000] bg-hg-bg shadow-xl flex flex-col">
          <Navbar 
            onSave={() => setNotification({ message: 'Configuration saved successfully.', type: 'success' })} 
            onExport={handleExportEDF} 
            onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
            executionMode={state.executionMode}
            setExecutionMode={(mode) => setState(prev => ({ ...prev, executionMode: mode }))}
            packagingStrategy={state.packagingStrategy}
            setPackagingStrategy={(strat) => setState(prev => ({ ...prev, packagingStrategy: strat }))}
            activeTab={activeDesktopTab}
            setActiveTab={(tab) => {
              if (tab === 'product') handleStepNavigation(1);
              else if (tab === 'packaging') handleStepNavigation(3);
              else if (tab === 'review') handleStepNavigation(4);
            }}
            windowSize={windowSize}
            product={state.productDefinition}
            selectedHotels={selectedHotels}
            metrics={metrics}
            isSidebarOpen={isSidebarOpen}
          />
          <FlowIndicator 
            currentStep={currentStep} 
            onNavigate={handleStepNavigation}
            canNavigate={canNavigate}
          />
          {activeDesktopTab === 'product' && !isLandscape && (
            <div 
              onClick={() => setShowDiagnostics(true)}
              className="w-full px-6 h-11 bg-black/20 border-b border-white/5 flex items-center justify-between cursor-pointer hover:bg-black/40 transition-all group shrink-0"
            >
              <div className="flex items-center gap-3">
                <div className="p-1 bg-hg-accent text-hg-bg rounded shadow-lg shadow-hg-accent/20">
                  <Database size={12} />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-black uppercase tracking-tight text-hg-text">
                    ARI Source Ready
                  </span>
                  <div className="w-1 h-1 rounded-full bg-hg-muted/30" />
                  <span className="text-[10px] font-bold text-hg-accent/80 uppercase tracking-widest">
                    {formatNumber(hotels.length)} Hotels • {formatNumber(uniqueRoomsCount)} Rooms • {formatNumber(ariRowsCount)} Data Points
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-hg-muted/60">
                  <div className="flex items-center gap-1.5 border-r border-white/5 pr-4">
                    <Globe size={11} className="text-hg-muted/40" />
                    {product.destinations.length || 1} DEST
                  </div>
                  <div className="flex items-center gap-1.5 border-r border-white/5 pr-4">
                    <HotelIcon size={11} className="text-hg-muted/40" />
                    {selectedHotels.length} HOTELS
                  </div>
                  <div className="flex items-center gap-1.5 border-r border-white/5 pr-4">
                    <Utensils size={11} className="text-hg-muted/40" />
                    {MEAL_PLANS.length} ML
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users size={11} className="text-hg-muted/40" />
                    {Object.keys(COMMON_OCCUPANCIES).length} OCC
                  </div>
                </div>
              </div>
            </div>
          )}
        </header>
      ) : (
        <MobileHeader 
          title="HyperGuest EDF" 
          onMenu={() => setIsSidebarOpen(true)} 
          onExport={handleExportEDF}
          isLandscape={isLandscape}
          activeTab={activeDesktopTab}
          onTabChange={(tab) => {
            if (tab === 'product') handleStepNavigation(1);
            else if (tab === 'packaging') handleStepNavigation(3);
            else if (tab === 'review') handleStepNavigation(4);
          }}
        />
      )}

      <div className={isMobile ? (isLandscape ? "pt-11" : "pt-14") : ""}>
        {isMobile && !isLandscape && (
          <>
            <FlowProgress currentTab={activeDesktopTab} isMobile />
            <MobileStepLabel step={currentStep} total={4} name={currentStepName} />
          </>
        )}
      </div>

      <AnimatePresence>
        {showDiagnostics && (
          <motion.div 
            initial={isMobile ? { y: '100%' } : { x: '100%' }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: '100%' } : { x: '100%' }}
            className={`fixed z-[120] bg-hg-panel border-hg-border shadow-2xl flex flex-col overflow-hidden ${
              isMobile ? 'inset-x-0 bottom-0 max-h-[85vh] rounded-t-3xl border-t' : 'top-0 right-0 bottom-0 w-[420px] border-l'
            }`}
          >
            <div className={`px-6 py-5 border-b border-white/5 bg-neutral-900/50 flex items-center justify-between ${isMobile ? 'sticky top-0 z-10' : ''}`}>
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-hg-accent/10 rounded-lg">
                    <Activity size={18} className="text-hg-accent font-black" />
                 </div>
                 <div className="flex flex-col text-left">
                    <h3 className="text-[13px] font-black uppercase tracking-[0.1em] text-white">Data Engine Diagnostics</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                       <div className="w-1.5 h-1.5 rounded-full bg-hg-accent animate-pulse" />
                       <span className="text-[9px] font-bold text-hg-muted uppercase tracking-tighter">Live Monitor: Connected</span>
                    </div>
                 </div>
              </div>
              <button 
                onClick={() => setShowDiagnostics(false)}
                className="p-2 hover:bg-white/5 rounded-xl text-neutral-500 hover:text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
               {/* KPI Summary */}
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-hg-muted uppercase tracking-[0.2em] flex items-center gap-2">
                       <BarChart3 size={12} /> Execution Metrics
                    </h4>
                    <span className="text-[8px] font-bold text-hg-muted uppercase px-1.5 py-0.5 border border-white/5 rounded">Real-time</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     {[
                       { label: 'TOTAL SOURCES', value: selectedHotelsCount, color: 'text-hg-text' },
                       { label: 'ARI AVAILABLE', value: metrics.hotelsWithRealARI, color: 'text-hg-success' },
                       { label: 'Density', value: formatNumber(metrics.total), color: 'text-white' },
                       { label: 'Truncations', value: formatNumber(metrics.trimmed), color: 'text-hg-warning' }
                     ].map(stat => (
                       <div key={stat.label} className="p-3 rounded-lg bg-black/20 border border-white/5">
                          <div className="text-[9px] font-bold text-hg-muted uppercase mb-1">{stat.label}</div>
                          <div className={`text-lg font-mono font-bold ${stat.color}`}>{stat.value}</div>
                       </div>
                     ))}
                  </div>
               </div>
               <div className="space-y-4">
                   <h4 className="text-[10px] font-black text-hg-muted uppercase tracking-[0.2em] flex items-center gap-2">
                     <Zap size={12} /> Data Pipeline
                   </h4>
                   <div className="p-5 rounded-2xl bg-neutral-900/50 border border-hg-accent/10 relative overflow-hidden group">
                      <div className="grid gap-4 relative z-10">
                         <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-neutral-300">ARI Feed Status</span>
                            <div className="flex items-center gap-2">
                               <span className="w-1.5 h-1.5 rounded-full bg-hg-accent" />
                               <span className="text-[10px] font-black uppercase text-hg-accent">Authenticated</span>
                            </div>
                         </div>
                         <div className="h-px bg-white/5" />
                         <div className="space-y-2">
                            <div className="flex justify-between text-[10px]">
                               <span className="text-neutral-500 font-bold uppercase tracking-tighter">Connection Mode</span>
                               <span className="text-white font-mono">{state.executionMode}</span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                               <span className="text-neutral-500 font-bold uppercase tracking-tighter">Latency</span>
                               <span className="text-hg-success font-mono">0.02ms (Indexed)</span>
                            </div>
                         </div>
                         <p className="text-[9px] text-neutral-500 leading-relaxed italic mt-2 border-l-2 border-hg-accent/20 pl-3">
                           ARI indexing Complete. All rule sets compliant with engine specifications.
                         </p>
                      </div>
                   </div>
                </div>

               {/* Compliance */}
               <div className="space-y-4 pb-12">
                  <h4 className="text-[10px] font-black text-hg-muted uppercase tracking-[0.2em] flex items-center gap-2">
                    <ShieldCheck size={12} /> Compliance Engine
                  </h4>
                  <div className="space-y-2">
                     <div className="p-4 rounded-xl bg-neutral-900/50 border border-white/5 flex items-center justify-between transition-colors hover:border-hg-accent/30">
                        <div className="flex items-center gap-4 text-left">
                           <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20">
                              <Check size={18} />
                           </div>
                           <div className="flex flex-col">
                              <span className="text-[11px] font-black text-white uppercase tracking-wider">Peakwork V7 Native</span>
                              <span className="text-[9px] text-neutral-500">Certified schema</span>
                           </div>
                        </div>
                        {metrics.hasZeroCB && <AlertCircle size={14} className="text-red-500 animate-pulse" />}
                     </div>
                  </div>
               </div>
            </div>

            <div className="p-6 bg-hg-panel border-t border-white/5">
               <button 
                onClick={() => setShowFixModal(true)} 
                className="w-full h-12 bg-hg-accent text-hg-bg text-[11px] font-black uppercase tracking-widest rounded-xl hover:brightness-110 transition-all shadow-xl"
               >
                 Optimization Panel
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showReportModal && lastExportReport && (
        <ExportReportModal 
          report={lastExportReport} 
          onClose={() => setShowReportModal(false)} 
        />
      )}
      {/* SIDEBAR & OVERLAYS */}
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeView={activeView}
        onViewChange={setActiveView}
        isMobile={isMobile}
        isTablet={isTablet}
        metrics={metrics}
        onExportARI={handleExportARI}
        onImportARI={() => ariInputRef.current?.click()}
        onShowLogs={() => setActiveView('logs')}
        activeDesktopTab={activeDesktopTab}
        setActiveDesktopTab={(tab) => {
          if (tab === 'product') handleStepNavigation(1);
          else if (tab === 'packaging') handleStepNavigation(3);
          else if (tab === 'review') handleStepNavigation(4);
        }}
        windowSize={windowSize}
        executionMode={state.executionMode}
        setExecutionMode={(m) => setState(prev => ({ ...prev, executionMode: m }))}
        packagingStrategy={state.packagingStrategy}
        setPackagingStrategy={(s) => setState(prev => ({ ...prev, packagingStrategy: s }))}
        onShowDiagnostics={() => setShowDiagnostics(true)}
      />

      {/* TOP SUMMARY STRIP - REMOVED PER REQUEST */}
      {/* <div className={`fixed top-[48px] left-0 right-0 h-[40px] ... */}

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept=".csv" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={historyInputRef} 
        onChange={handleHistoryUpload} 
        accept=".csv" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={mappingInputRef} 
        onChange={handleMappingUpload} 
        accept=".csv" 
        className="hidden" 
      />

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-neutral-800 text-white rounded-lg shadow-2xl flex items-center gap-3 border border-white/10 backdrop-blur-xl max-w-[90vw] sm:max-w-md w-max min-w-0"
          >
            <div className={`w-2 h-2 rounded-full shrink-0 ${notification.type === 'success' ? 'bg-green-500' : notification.type === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`} />
            <span className="text-[12px] font-bold tracking-tight truncate shrink">{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-auto hover:text-green-500 transition-colors shrink-0">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {isMobile && (
        <MobileStepBar 
          currentStep={activeDesktopTab === 'product' ? 1 : activeDesktopTab === 'packaging' ? 2 : 3} 
          totalSteps={3} 
          stepName={activeDesktopTab === 'product' ? 'Configuration' : activeDesktopTab === 'packaging' ? 'Inventory' : 'Review'} 
          isLandscape={isLandscape}
        />
      )}

      <main className={`flex flex-col min-h-0 ${isMobile ? (isLandscape ? 'pt-[36px]' : 'pt-[101px]') : (activeDesktopTab === 'product' ? 'pt-[148px]' : 'pt-[104px]')} pb-12 px-4 transition-all duration-300 max-w-full overflow-x-hidden box-border bg-hg-bg ${isSidebarOpen && isDesktop ? 'pl-[336px]' : ''}`}>

        {hotels.length === 0 && (
          <div className="max-w-[1440px] mx-auto mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-xl flex items-center gap-4">
            <AlertTriangle className="text-red-500 animate-pulse" size={24} />
            <div>
              <h3 className="text-red-500 font-black uppercase text-[14px]">STATIC ARI DATASET EMPTY — generation/loading failed</h3>
              <p className="text-red-400/80 text-[11px] font-medium leading-relaxed">The internal deterministic ARI layer failed to initialize or hotel mapping was lost. Please check console logs for generation trace.</p>
            </div>
          </div>
        )}
        {activeView === 'logs' ? (
          <LogsView 
            logs={edfLogs} 
            filter={logFilter}
            setFilter={setLogFilter}
            onBack={() => setActiveView('builder')}
            onSelectDestination={(d) => setSelectedLogDestination(d)}
            selectedLogDestination={selectedLogDestination}
            setSelectedLogDestination={setSelectedLogDestination}
            isMobile={isMobile}
            setSelectedLogForCompare={setSelectedLogForCompare}
            setNotification={setNotification}
          />
        ) : (
          <div className={`${!isMobile ? "max-w-[1440px] mx-auto pt-4" : isLandscape ? "h-screen flex flex-col pt-0 overflow-hidden" : "pb-12"}`}>
            {!isMobile && !isLandscape && <SummaryBar state={state} metrics={metrics} leftOffset={0} selectedHotels={selectedHotels} />}
            
            {isMobile && isLandscape ? (
               <div className="flex w-full flex-1 overflow-hidden bg-hg-bg">
                 <div className="w-[40%] h-full border-r border-hg-divider/50 flex flex-col pt-3 overflow-hidden">
                    <div className="px-4 py-2 flex items-center justify-between border-b border-hg-divider/30 bg-hg-nav/20">
                       <div className="flex items-center gap-2">
                          <Globe size={14} className="text-hg-accent shrink-0" />
                          <h2 className="text-[11px] font-black uppercase tracking-widest text-hg-accent">Destinations</h2>
                       </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#0f1216]">
                       <div className="space-y-4">
                          <SearchableMultiSelect 
                            label=""
                            placeholder="Add cities..."
                            options={destinationOptions}
                            selectedValues={product.destinations}
                            onChange={(vals) => setState(prev => ({ 
                              ...prev, 
                              productDefinition: { ...prev.productDefinition, destinations: vals } 
                            }))}
                            isMobile
                          />
                          <div className="bg-[#11161C] border border-hg-border/30 rounded-xl p-3 min-h-[44px]">
                            <CollapsedSelection 
                              items={product.destinations} 
                              max={6}
                              onRemove={(d) => toggleTag('destinations', d)}
                              isMobile
                            />
                          </div>
                       </div>
                    </div>
                    <div className="p-3 bg-hg-nav/40 border-t border-hg-divider/30">
                       <button 
                        onClick={() => handleStepNavigation(activeDesktopTab === 'product' ? 3 : 4)}
                        className="w-full h-10 bg-hg-accent text-hg-bg text-[11px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95"
                       >
                         {activeDesktopTab === 'product' ? 'Next: Packaging' : 'Next: Review'}
                       </button>
                    </div>
                 </div>

                 <div className="w-[60%] h-full flex flex-col bg-hg-panel overflow-hidden">
                    <div className="px-4 py-2.5 bg-hg-nav/50 border-b border-hg-divider/30 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <HotelIcon size={14} className="text-hg-muted" />
                          <h2 className="text-[11px] font-black uppercase text-hg-text tracking-widest px-2 py-0.5 bg-[#11161C] border border-hg-border/20 rounded">Hotels ({filteredHotels.length})</h2>
                       </div>
                       <div className="text-[10px] font-mono font-bold text-hg-accent tabular-nums">
                          {formatNumber(metrics.total)} CB
                       </div>
                    </div>
                    <div className="flex-1 min-h-0 relative">
                      <HotelsSection 
                        hotels={giataHotels}
                        selectedIds={selectedHotelIds}
                        onToggle={handleToggleHotel}
                        isMobile={isMobile}
                        isLandscape={isLandscape}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        onToggleAll={handleToggleAll}
                        onClear={handleClearSelection}
                        totalCount={totalGiataHotels}
                        selectedStars={selectedStars}
                        setSelectedStars={setSelectedStars}
                        selectedCities={selectedCities}
                        setSelectedCities={setSelectedCities}
                        availableCities={availableCities}
                        availableStars={availableStars}
                        inventoryLength={totalGiataHotels}
                        giataMappedFilter={giataMappedFilter}
                        setGiataMappedFilter={setGiataMappedFilter}
                        onResolveAmbiguity={handleResolveAmbiguity}
                        page={page}
                        setPage={setPage}
                        limit={limit}
                        setLimit={setLimit}
                        totalPages={totalPages}
                        isFetching={isGiataFetching}
                        isSelected={isSelected}
                        allSelected={allSelected}
                        deselectedIds={deselectedIds}
                      />
                    </div>
                 </div>
               </div>
            ) : (
              <AnimatePresence mode="wait">
                {activeDesktopTab === 'product' ? (
                  <motion.div 
                   key="product"
                   initial={isMobile ? { opacity: 1 } : { opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -10 }}
                   className={isMobile ? "space-y-1 pt-0" : "grid grid-cols-1 lg:grid-cols-[28%_44%_28%] gap-5 items-start w-full"}
                >
                  <div className="space-y-6 lg:overflow-visible relative">
                    {isMobile ? (
                      <MobileDestinations 
                        destinations={product.destinations} 
                        onChange={(vals) => setState(prev => ({ 
                          ...prev, 
                          productDefinition: { ...prev.productDefinition, destinations: vals } 
                        }))} 
                      />
                    ) : (
                    <div className="bg-hg-panel border border-hg-border rounded-2xl overflow-visible shadow-xl relative p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 rounded-xl bg-hg-accent text-hg-bg shadow-lg shadow-hg-accent/20">
                          <Globe size={20} />
                        </div>
                        <div>
                          <h3 className="text-[15px] font-black uppercase tracking-widest text-hg-text">Scope Definition</h3>
                          <p className="text-[10px] font-bold text-hg-muted uppercase tracking-widest mt-0.5">Define your target markets & destinations</p>
                        </div>
                      </div>

                      <PredictiveDestinationSearch 
                        selectedValues={product.destinations}
                        onChange={(vals) => setState(prev => ({ 
                          ...prev, 
                          productDefinition: { ...prev.productDefinition, destinations: vals } 
                        }))}
                        isMobile={isMobile}
                      />
                    </div>
                    )}
                  </div>

                  <div className={isMobile ? "px-1" : "space-y-6"}>
                     {isMobile && (
                       <div className="px-6 py-2 mb-2 flex items-center justify-between">
                         <h2 className={`text-[12px] font-black uppercase tracking-widest transition-colors ${selectedHotels.length === 0 && product.destinations.length > 0 ? 'text-[#FF4D4D] underline decoration-2 underline-offset-4 animate-pulse' : 'text-hg-text'}`}>
                           Hotel Selection <span className="text-hg-muted font-mono ml-1 tabular-nums">({totalGiataHotels})</span>
                         </h2>
                       </div>
                     )}
                     <div id="hotels-section" className={`${isMobile ? "bg-transparent border-none" : "bg-neutral-900 border border-white/5 rounded-2xl shadow-sm overflow-hidden"}`}>
                        {!isMobile && (
                          <div className="px-6 py-5 border-b border-hg-divider flex items-center justify-between bg-hg-nav/30">
                            <div className="flex items-center gap-3">
                              <HotelIcon size={18} className="text-hg-accent" />
                              <h2 className="text-[14px] font-black uppercase tracking-widest text-white">Hotel Inventory</h2>
                            </div>
                          </div>
                        )}
                        <HotelsSection 
                          hotels={giataHotels}
                          selectedIds={selectedHotelIds}
                          onToggle={handleToggleHotel}
                          isMobile={isMobile}
                          searchTerm={searchTerm}
                          setSearchTerm={setSearchTerm}
                          onToggleAll={handleToggleAll}
                          onClear={handleClearSelection}
                          totalCount={totalGiataHotels}
                          selectedStars={selectedStars}
                          setSelectedStars={setSelectedStars}
                          selectedCities={selectedCities}
                          setSelectedCities={setSelectedCities}
                          availableCities={availableCities}
                          availableStars={availableStars}
                          inventoryLength={totalGiataHotels}
                          giataMappedFilter={giataMappedFilter}
                          setGiataMappedFilter={setGiataMappedFilter}
                          onResolveAmbiguity={handleResolveAmbiguity}
                          page={page}
                          setPage={setPage}
                          limit={limit}
                          setLimit={setLimit}
                          totalPages={totalPages}
                          isFetching={isGiataFetching}
                          isSelected={isSelected}
                          allSelected={allSelected}
                          deselectedIds={deselectedIds}
                        />
                     </div>
                  </div>

                  {!isMobile && (
                    <div className="space-y-6">
                      <div className="bg-hg-panel border border-hg-border rounded-2xl p-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-hg-accent opacity-50" />
                        <div className="flex items-center justify-between mb-6">
                           <div className="flex flex-col">
                              <h3 className="text-[14px] font-black uppercase tracking-widest text-[#FFFFFF]">Build Status</h3>
                              <p className="text-[9px] font-bold text-hg-muted uppercase tracking-widest mt-0.5">Configuration Integrity Check</p>
                           </div>
                           {(isValidatingDeep || isCalculatingRecommendations) && (
                            <div className="flex items-center gap-2 px-2 py-1 bg-hg-accent/10 rounded-lg">
                              <Loader2 size={12} className="text-hg-accent animate-spin" />
                              <span className="text-[9px] font-black text-hg-accent uppercase tracking-widest">Compiling</span>
                            </div>
                           )}
                        </div>
                        
                        <div className="space-y-3">
                          {buildStatusMessages.map((msg: any, idx) => (
                            <div key={idx} className="space-y-4">
                              <Tooltip text="Configuration Valid means: At least 1 destination, 1 hotel, and active rules.">
                                <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                  msg.type === 'success' ? 'bg-green-500/5 border-green-500/10 text-green-500' : 'bg-red-500/5 border-red-500/10 text-red-500'
                                } hover:brightness-110 cursor-help`}>
                                  <div className="flex items-center gap-3">
                                    <div className={`p-1.5 rounded-lg ${msg.type === 'success' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                      {msg.type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                                    </div>
                                    <span className="text-[11px] font-black uppercase tracking-widest">{msg.text}</span>
                                  </div>
                                  <div className={`w-2 h-2 rounded-full ${msg.type === 'success' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                </div>
                              </Tooltip>

                              {msg.details && (
                                <div className="grid grid-cols-1 gap-1 px-1">
                                  <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                                    <span className="text-[10px] font-bold text-hg-muted uppercase">Destinations</span>
                                    <span className={`text-[10px] font-black uppercase ${msg.details.destinations ? 'text-hg-accent' : 'text-hg-muted'}`}>
                                      {msg.details.destinations ? 'OK' : 'MISSING'}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                                    <span className="text-[10px] font-bold text-hg-muted uppercase">Hotels</span>
                                    <span className={`text-[10px] font-black uppercase ${msg.details.hotels ? 'text-hg-accent' : 'text-hg-muted'}`}>
                                      {msg.details.hotels ? 'OK' : 'MISSING'}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                                    <span className="text-[10px] font-bold text-hg-muted uppercase">Rules</span>
                                    <span className={`text-[10px] font-black uppercase ${msg.details.rules ? 'text-hg-accent' : 'text-hg-muted'}`}>
                                      {msg.details.rules ? 'OK' : 'MISSING'}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between py-1.5">
                                    <span className="text-[10px] font-bold text-hg-muted uppercase">Conflicts</span>
                                    <span className={`text-[10px] font-black uppercase ${msg.details.conflicts === 0 ? 'text-hg-accent' : 'text-red-500'}`}>
                                      {msg.details.conflicts}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                               <div className="w-1.5 h-1.5 bg-hg-accent rounded-full" />
                               <span className="text-[10px] font-black text-hg-text uppercase">Live Feed</span>
                            </div>
                            <span className="text-[10px] font-mono text-hg-muted tabular-nums">HG-EDF-v1.4</span>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : activeDesktopTab === 'packaging' ? (
                <motion.div 
                  key="packaging"
                  initial={isMobile ? { opacity: 1 } : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={isMobile ? "" : "max-w-full lg:max-w-4xl mx-auto pb-20"}
                >
                  <div className={isMobile ? "" : "bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden shadow-2xl"}>
                     {!isMobile && (
                      <div className="px-6 py-5 bg-neutral-800 border-b border-white/5 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           <Zap size={18} className="text-hg-accent" />
                           <h3 className="text-[14px] font-black uppercase tracking-widest text-white">Packaging Configuration</h3>
                         </div>
                      </div>
                     )}
                     <div className="p-0">
                        <PackagingRulesTab 
                          state={state}
                          setState={setState}
                          isBlocked={isBlocked}
                          fieldErrors={fieldErrors}
                          marketSearch={marketSearch}
                          setMarketSearch={setMarketSearch}
                          filteredMarketOptions={filteredMarketOptions}
                          toggleCluster={toggleCluster}
                          toggleMarketInCluster={toggleMarketInCluster}
                          expandedClusters={expandedClusters}
                          setExpandedClusters={setExpandedClusters}
                          activeDropdown={activeDropdown}
                          setActiveDropdown={setActiveDropdown}
                          airportSearch={airportSearch}
                          setAirportSearch={setAirportSearch}
                          applyAllRecommendations={applyAllRecommendations}
                          recommendations={recommendations}
                          applyGlobalRecommendations={applyGlobalRecommendations}
                          setApplyGlobalRecommendations={setApplyGlobalRecommendations}
                          isMobile={isMobile}
                        />
                     </div>
                  </div>
                </motion.div>
                ) : (
                    <motion.div 
                      key="review"
                      initial={isMobile ? { opacity: 1 } : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={isMobile ? "pb-32" : ""}
                    >
                      <>
                      <div className={isMobile ? "space-y-6" : ""}>
                       {isMobile && (
                         <div className={`mx-3 p-4 rounded-xl border flex items-center gap-4 ${metrics.hasZeroCB ? 'bg-red-900/10 border-red-500/20' : 'bg-green-500/5 border-green-500/10'}`}>
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${metrics.hasZeroCB ? 'bg-red-500/20 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                               {metrics.hasZeroCB ? <AlertTriangle size={20} /> : <Check size={20} />}
                            </div>
                            <div className="flex-1 min-w-0">
                               <h3 className={`text-[12px] font-black uppercase tracking-widest ${metrics.hasZeroCB ? 'text-red-500' : 'text-green-500'}`}>
                                 {metrics.hasZeroCB ? 'ARI BLOCKED' : 'ARI COMPLIANT'}
                               </h3>
                               <p className="text-[10px] font-bold text-hg-muted mt-0.5 truncate uppercase opacity-60">
                                 {formatNumber(metrics.valid)} combinations validated
                               </p>
                            </div>
                         </div>
                       )}
                       
                       <div className="p-3">
                        <ReviewStep 
                          state={state} 
                          metrics={metrics} 
                          onExport={handleExportEDF} 
                          selectedHotels={selectedHotels}
                          isMobile={isMobile}
                        />
                       </div>
                    </div>
                    </>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
            
            {isMobile && !isLandscape && (
              <MobileBottomBar 
                 onNext={() => {
                   if (activeDesktopTab === 'product') {
                     handleStepNavigation(3);
                   } else if (activeDesktopTab === 'packaging') {
                     handleStepNavigation(4);
                   }
                 }}
                 metrics={metrics}
                 canNext={activeDesktopTab !== 'review'}
                 onShowDiagnostics={() => setShowDiagnostics(true)}
              />
            )}
          </div>
        )}
      </main>

      {/* Diagnostics Side Panel / Bottom Sheet */}
      <AnimatePresence>
        {showDiagnostics && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDiagnostics(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110]"
            />
            <motion.div 
              initial={isMobile ? { y: '100%' } : { x: '100%' }}
              animate={isMobile ? { y: 0 } : { x: 0 }}
              exit={isMobile ? { y: '100%' } : { x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed z-[120] bg-hg-bg border-hg-border shadow-2xl overflow-hidden flex flex-col ${
                isMobile 
                  ? 'bottom-0 left-0 right-0 h-[85vh] rounded-t-3xl border-t' 
                  : 'top-0 right-0 bottom-0 w-[450px] border-l'
              }`}
            >
              <div className="p-6 border-b border-hg-border flex items-center justify-between bg-hg-panel/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-hg-accent/10 rounded-lg text-hg-accent">
                    <Activity size={20} />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-black uppercase tracking-[0.2em] text-hg-text">System Diagnostics</h3>
                    <p className="text-[10px] text-hg-muted font-bold uppercase tracking-widest mt-0.5">Real-time Performance Trace</p>
                  </div>
                </div>
                <button onClick={() => setShowDiagnostics(false)} className="p-2 hover:bg-white/5 rounded-full text-hg-muted transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
                {metrics.trimmed > 0 && (
                  <div className="hg-panel p-5 border-l-4 border-hg-warning bg-hg-warning/5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-hg-warning uppercase tracking-widest">Capacity Truncation</span>
                      <span className="text-[10px] font-mono font-black text-hg-warning/60 bg-hg-warning/10 px-2 py-0.5 rounded">Compliance Check</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-hg-text tabular-nums">{formatNumber(metrics.trimmed)}</span>
                      <span className="text-[10px] font-bold text-hg-muted uppercase">Seasons Trimmed</span>
                    </div>
                    <p className="text-[11px] text-hg-muted leading-relaxed">
                      We've applied strategic truncation to maintain Peakwork compliance thresholds. Your current configuration exceeds the 31-chargeblock limit in some clusters.
                    </p>
                    <button 
                      onClick={() => { setShowFixModal(true); setShowDiagnostics(false); }}
                      className="w-full py-3 hg-button-warning text-[10px] font-black uppercase tracking-widest"
                    >
                      Resolve Capacity Issues
                    </button>
                  </div>
                )}

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-hg-muted uppercase tracking-[0.2em] border-b border-hg-border pb-2">Active Trace Metrics</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-hg-panel border border-hg-border rounded-xl">
                      <div className="text-[8px] font-black text-hg-muted uppercase tracking-widest mb-1">Total Complexity</div>
                      <div className="text-[18px] font-mono font-black text-hg-text">{formatNumber(metrics.complexityScore)}</div>
                    </div>
                    <div className="p-4 bg-hg-panel border border-hg-border rounded-xl">
                      <div className="text-[8px] font-black text-hg-muted uppercase tracking-widest mb-1">In-Scope Hotels</div>
                      <div className="text-[18px] font-mono font-black text-hg-text">{formatNumber(metrics.inScope)}</div>
                    </div>
                    <div className="p-4 bg-hg-panel border border-hg-border rounded-xl">
                      <div className="text-[8px] font-black text-hg-muted uppercase tracking-widest mb-1">Compliant Hubs</div>
                      <div className="text-[18px] font-mono font-black text-hg-success">{formatNumber(metrics.valid)}</div>
                    </div>
                    <div className="p-4 bg-hg-panel border border-hg-border rounded-xl">
                      <div className="text-[8px] font-black text-hg-muted uppercase tracking-widest mb-1">Errors Flagged</div>
                      <div className="text-[18px] font-mono font-black text-red-500">{formatNumber(metrics.roomsWithNoSeasons)}</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-3">
                  <h5 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Environment Trace</h5>
                  <div className="space-y-2 font-mono text-[10px]">
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-white/30">H-G ENGINE</span>
                      <span className="text-white/60">v4.0.0-PROD</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-white/30">CLIENT COMPLIANCE</span>
                      <span className="text-white/60">PEAKWORK-V11</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-white/30">MEMORY LOAD</span>
                      <span className="text-white/60">{(performance as any).memory?.usedJSHeapSize ? `${Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)} MB` : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-hg-panel border-t border-hg-border">
                <button 
                  onClick={() => setShowReportModal(true)}
                  className="w-full h-12 hg-button-secondary text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <FileText size={16} /> Download Full System Report
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Diagnostics Panel Toggle Button */}
      {isDesktop && (
        <div className={`fixed bottom-6 right-6 z-[90] flex flex-col items-end gap-3 pointer-events-none`}>
          <div className="pointer-events-auto">
            <button 
              onClick={() => setShowDiagnostics(true)}
              className={`flex items-center gap-3 px-6 h-12 rounded-full border shadow-2xl transition-all duration-300 ${
                metrics.trimmed > 0 
                  ? 'bg-hg-warning border-hg-warning/50 text-hg-bg animate-pulse hover:animate-none' 
                  : 'bg-hg-text border-white/10 text-white hover:bg-white/10'
              }`}
            >
              <Activity size={18} className={metrics.trimmed > 0 ? "animate-spin-slow" : ""} />
              <span className="text-[11px] font-black uppercase tracking-[0.15em]">Diagnostics</span>
              {metrics.trimmed > 0 && (
                <span className="flex h-2 w-2 rounded-full bg-hg-bg relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-hg-bg opacity-75"></span>
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showReportModal && lastExportReport && (
          <ExportReportModal report={lastExportReport} onClose={() => setShowReportModal(false)} />
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showFixModal && metrics.trimmed > 0 && (
          <AutoFixModal 
            isOpen={showFixModal} 
            onClose={() => setShowFixModal(false)}
            plan={metrics}
            onApply={() => setNotification({ message: 'Optimization profiles injected.', type: 'success' })}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {step === 'loading' && (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-hg-bg flex flex-col items-center justify-center"
            >
              <Loader2 className="text-hg-accent animate-spin mb-4" size={48} />
              <h2 className="text-[14px] font-bold uppercase tracking-widest text-hg-text">Generating EDF payload...</h2>
              <p className="text-hg-muted text-[11px] mt-2">Applying trimming logic and optimizing data feed</p>
            </motion.div>
          )}

          {step === 'preview' && (
            <motion.div 
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-[1600px] mx-auto pt-24 px-4 pb-12"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setStep('builder')}
                    className="hg-button-secondary w-10 h-10 p-0 flex items-center justify-center"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div>
                    <h1 className="text-xl font-bold text-hg-text tracking-tight">Preview</h1>
                    <p className="text-hg-muted text-[13px]">System summary of generated EDF payload</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setStep('builder')}
                    className="hg-button-secondary h-10 px-6"
                  >
                    EDIT CONFIG
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="hg-panel p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-[14px] font-bold uppercase tracking-wider text-hg-text">EDF Payload Summary</h3>
                      <div className="flex items-center gap-2 text-[11px] font-bold text-hg-accent bg-hg-accent/10 px-3 py-1 rounded-full">
                        <CheckCircle2 size={12} />
                        READY FOR EXPORT
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {[
                        { label: 'TOTAL SOURCES', value: selectedHotels?.length || 0, icon: HotelIcon },
                        { label: 'Global Markets', value: product.destinations?.length || 0, icon: Globe },
                        { label: 'ARI AVAILABLE', value: metrics.hotelsWithRealARI, icon: Sparkles },
                        { label: 'Combinations', value: metrics.valid, icon: Users },
                      ].map((item, idx) => (
                        <div key={stableKey("preview-stat-metric", item.label, idx)} className="space-y-1">
                          <div className="flex items-center gap-2 text-hg-muted">
                            <item.icon size={12} />
                            <span className="text-[11px] uppercase font-bold tracking-wider">{item.label}</span>
                          </div>
                          <div className="text-2xl font-mono font-bold text-hg-text tracking-tighter tabular-nums">
                            {formatNumber(item.value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="hg-panel overflow-hidden">
                    <div className="p-4 border-b border-hg-divider bg-hg-nav flex items-center justify-between">
                      <h3 className="text-[12px] font-bold uppercase tracking-wider text-hg-text">Sample Payload Structure</h3>
                      <div className="flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-hg-accent" />
                        <div className="w-2 h-2 rounded-full bg-hg-warning" />
                        <div className="w-2 h-2 rounded-full bg-hg-danger" />
                      </div>
                    </div>
                    <div className="p-6 bg-hg-bg font-mono text-[12px] text-hg-muted overflow-x-auto">
                      <pre className="leading-relaxed">
                        {`{
  "header": {
    "version": "2.0",
    "timestamp": "${new Date().toISOString()}",
    "scope": "HyperGuest_EDF_Builder"
  },
  "definitions": {
    "markets": ${JSON.stringify(product.airports || [])},
    "stayDurations": ${JSON.stringify(product.stayDurations || [])},
    "mealPlans": ${JSON.stringify(product.mealPlans || [])}
  },
  "data": [
    {
      "hotelId": "${customHotels?.[0]?.hgId || 'HG-12345'}",
      "giataId": "${customHotels?.[0]?.giataId || '12345'}",
      "combinations": ${metrics.valid},
      "status": "ACTIVE"
    },
    ...
  ]
}`}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="hg-panel p-6">
                    <h3 className="text-[14px] font-bold uppercase tracking-wider text-hg-text mb-4">Export Settings</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-hg-muted">Format</label>
                        <select className="hg-input w-full h-10 px-3">
                          <option>JSON (Standard)</option>
                          <option>XML (Legacy)</option>
                          <option>CSV (Bulk)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-hg-muted">Compression</label>
                        <div className="flex gap-2">
                          <button className="flex-1 h-10 border border-hg-accent bg-hg-accent/10 text-hg-accent text-[11px] font-bold rounded-[4px]">GZIP</button>
                          <button className="flex-1 h-10 border border-hg-divider text-hg-muted text-[11px] font-bold rounded-[4px]">NONE</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="hg-panel p-6 border-l-4 border-l-hg-warning">
                    <div className="flex items-start gap-4">
                      <AlertTriangle className="text-hg-warning shrink-0" size={20} />
                      <div>
                        <h4 className="text-[13px] font-bold text-hg-text mb-1">System Notice</h4>
                        <p className="text-hg-muted text-[12px] leading-relaxed">
                          This EDF payload contains {formatNumber(metrics.trimmed)} trimmed combinations to maintain system performance.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 h-6 bg-neutral-900 border-t border-white/5 flex items-center px-4 justify-between z-[60]">
        <div className="flex gap-6 text-[9px] font-black uppercase text-neutral-500 tracking-widest overflow-hidden min-w-0">
          <span className="truncate flex items-center gap-1.5 shrink-0"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Engine: <span className="text-white">v4.0.0-PROD</span></span>
          <span className="hidden sm:inline flex items-center gap-1.5 shrink-0"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500" /> Cluster: <span className="text-white">EU-WEST-1</span></span>
        </div>
        <span className="text-[8px] font-black uppercase text-white tracking-[0.2em] shrink-0 opacity-40">PEAKWORK COMPLIANT ENGINE</span>
      </div>
    </div>
  );
};

function ReviewStep({ state, metrics, onExport, selectedHotels, isMobile }: any) {
  const { productDefinition: product } = state;
  
  return (
    <div className="space-y-6">
      {!isMobile && (
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[14px] font-black uppercase tracking-widest text-white">Final Review</h3>
          <button 
            onClick={onExport}
            className="hg-button px-6 h-10 text-[11px] font-black uppercase tracking-widest"
          >
            Export EDF
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Scope Summary */}
        <div className="p-5 rounded-2xl bg-neutral-900/50 border border-white/5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
             <Globe size={16} className="text-hg-accent" />
             <h4 className="text-[11px] font-black uppercase tracking-widest text-white">Market Scope</h4>
          </div>
          <div className="flex flex-wrap gap-2">
             {(product.markets || []).length === 0 ? (
               <span className="text-[10px] text-hg-muted uppercase font-bold tracking-widest">Global Feed (None restricted)</span>
             ) : (
               (product.markets || []).map((m: string) => (
                 <span key={m} className="px-2 py-1 bg-hg-accent/10 border border-hg-accent/20 rounded text-[10px] font-mono font-bold text-hg-accent">{m}</span>
               ))
             )}
          </div>
          <div className="pt-2 border-t border-white/5">
             <div className="flex justify-between items-center text-[10px]">
                <span className="text-hg-muted font-bold uppercase tracking-tighter">Target Hubs</span>
                <span className="text-white font-mono">{(product.airports || []).length === 0 ? 'ALL' : (product.airports || []).length} Hubs</span>
             </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="p-5 rounded-2xl bg-neutral-900/50 border border-white/5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
             <Clock size={16} className="text-hg-accent" />
             <h4 className="text-[11px] font-black uppercase tracking-widest text-white">Product Configuration</h4>
          </div>
          <div className="space-y-3">
             <div className="flex justify-between text-[11px]">
                <span className="text-hg-muted font-bold uppercase tracking-tighter">Booking Window</span>
                <span className="text-white font-mono">{product.bookingWindowDays} Days</span>
             </div>
             <div className="flex justify-between text-[11px]">
                <span className="text-hg-muted font-bold uppercase tracking-tighter">Stay Durations</span>
                <span className="text-white font-mono">{(product.stayDurations || []).length} Vectors</span>
             </div>
             <div className="flex justify-between text-[11px]">
                <span className="text-hg-muted font-bold uppercase tracking-tighter">Meal Plans</span>
                <span className="text-white font-mono">{(product.mealPlans || []).join(', ')}</span>
             </div>
          </div>
        </div>
      </div>

      {/* Inventory Summary */}
      <div className="p-5 rounded-2xl bg-neutral-900/50 border border-white/5 space-y-3">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
               <HotelIcon size={16} className="text-hg-accent" />
               <h4 className="text-[11px] font-black uppercase tracking-widest text-white">Inventory</h4>
            </div>
            <span className="text-[10px] font-black text-hg-muted tabular-nums leading-none uppercase">{selectedHotels.length} Hotels Selected</span>
         </div>
         <div className="h-px bg-white/5" />
         <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="space-y-1">
               <div className="text-[9px] font-bold text-hg-muted uppercase tracking-tighter">Total Combinations</div>
               <div className="text-[16px] font-black text-white tabular-nums">{formatNumber(metrics.total)}</div>
            </div>
            <div className="space-y-1">
               <div className="text-[9px] font-bold text-hg-muted uppercase tracking-tighter">Validated Feed</div>
               <div className="text-[16px] font-black text-hg-success tabular-nums">{formatNumber(metrics.valid)}</div>
            </div>
            <div className={`space-y-1 ${metrics.trimmed > 0 ? 'text-hg-warning' : 'opacity-40'}`}>
               <div className="text-[9px] font-bold uppercase tracking-tighter">Truncated Rows</div>
               <div className="text-[16px] font-black tabular-nums">{formatNumber(metrics.trimmed)}</div>
            </div>
            <div className={`space-y-1 ${metrics.roomsWithNoSeasons > 0 ? 'text-red-500' : 'opacity-40'}`}>
               <div className="text-[9px] font-bold uppercase tracking-tighter">Failed Nodes</div>
               <div className="text-[16px] font-black tabular-nums">{formatNumber(metrics.roomsWithNoSeasons)}</div>
            </div>
         </div>
      </div>

      {isMobile && (
        <div className="p-4 bg-hg-accent/10 border border-hg-accent/20 rounded-xl">
           <div className="flex items-center gap-3">
              <Sparkles size={16} className="text-hg-accent" />
              <div>
                 <p className="text-[11px] font-black text-white uppercase tracking-wider">Ready for Transfer</p>
                 <p className="text-[9px] text-hg-muted font-medium mt-0.5">Payload complies with internal engine v4.0.0 specifications.</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function PackagingRulesTab({ 
  state, 
  setState, 
  isBlocked, 
  fieldErrors,
  marketSearch,
  setMarketSearch,
  filteredMarketOptions,
  toggleCluster,
  toggleMarketInCluster,
  expandedClusters,
  setExpandedClusters,
  activeDropdown,
  setActiveDropdown,
  airportSearch,
  setAirportSearch,
  applyAllRecommendations,
  recommendations,
  applyGlobalRecommendations,
  setApplyGlobalRecommendations,
  isMobile
}: any) {
  const { productDefinition: product } = state;
  const [activeStep, setActiveStep] = useState<number | null>(1);
  const [isAnimatingEntrance, setIsAnimatingEntrance] = useState(true);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 120,
        damping: 18
      }
    }
  };

  const toggleDuration = (n: number) => {
    const isSelected = (product.stayDurations || []).includes(n);
    const newDurs = isSelected 
      ? (product.stayDurations || []).filter((d: number) => d !== n)
      : [...(product.stayDurations || []), n].sort((a,b) => a-b);
    
    setState((prev: any) => ({
      ...prev,
      productDefinition: { ...prev.productDefinition, stayDurations: newDurs }
    }));
  };

  const selectedMarketsAndClusters = [
    ...MARKET_CLUSTERS.filter(c => (product.selectedClusters || []).includes(c.id)).map(c => c.name),
    ...COUNTRIES.filter(m => (product.markets || []).includes(m.code) && !MARKET_CLUSTERS.some(c => (product.selectedClusters || []).includes(c.id) && c.countries.includes(m.code))).map(m => m.name)
  ];

  const activeMarketCodes = useMemo(() => {
    const codes = new Set<string>();
    (product.markets || []).forEach((m: string) => codes.add(m));
    (product.selectedClusters || []).forEach((clusterId: string) => {
      const cluster = MARKET_CLUSTERS.find(c => c.id === clusterId);
      if (cluster && cluster.countries) cluster.countries.forEach(m => codes.add(m));
    });
    return Array.from(codes);
  }, [product.markets, product.selectedClusters]);

  const steps = [
    { id: 1, label: 'Source Market', icon: Globe, isComplete: selectedMarketsAndClusters.length > 0, summary: selectedMarketsAndClusters.join(', '), canApplyRecommendation: true, recommendationAction: applyAllRecommendations },
    { id: 2, label: 'Departure Airports', icon: Plane, isComplete: (product.airports || []).length > 0, summary: (product.airports || []).join(', ') },
    { id: 3, label: 'Booking Window', icon: Clock, isComplete: product.bookingWindowDays > 0, summary: `${product.bookingWindowDays} days`, canApplyRecommendation: true, recommendationAction: () => setState((prev:any) => ({ ...prev, productDefinition: { ...prev.productDefinition, bookingWindowDays: recommendations.bookingWindowDays }})) },
    { id: 4, label: 'Stay Durations', icon: Timer, isComplete: (product.stayDurations || []).length > 0, summary: (product.stayDurations || []).join(', '), canApplyRecommendation: true, recommendationAction: () => setState((prev:any) => ({ ...prev, productDefinition: { ...prev.productDefinition, stayDurations: recommendations.stayDurations }})) },
    { id: 5, label: 'Meal Plans', icon: UtensilsCrossed, isComplete: (product.mealPlans || []).length > 0, summary: (product.mealPlans || []).join(', '), canApplyRecommendation: true, recommendationAction: () => setState((prev:any) => ({ ...prev, productDefinition: { ...prev.productDefinition, mealPlans: recommendations.mealPlans }})) },
    { id: 6, label: 'Room Occupancies', icon: Users, isComplete: (product.occupancies || []).length > 0, summary: (product.occupancies || []).map((o:any) => o.label || o.id).join(', '), canApplyRecommendation: true, recommendationAction: () => setState((prev:any) => ({ ...prev, productDefinition: { ...prev.productDefinition, occupancies: recommendations.occupancies }})) },
  ];

  const handleStepClick = (id: number) => {
    if (isAnimatingEntrance) return;
    setActiveStep(prev => prev === id ? null : id);
  };

  useEffect(() => {
    // Section default expansion on mount
    if (activeStep === null) {
      setActiveStep(1);
    }
    
    // Disable interaction guard after animation sequence (stagger + spring duration)
    const timer = setTimeout(() => setIsAnimatingEntrance(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Reset invalid airports when market changes
    if ((product.airports || []).length > 0) {
      const validForCurrentMarkets = new Set<string>();
      (activeMarketCodes || []).forEach((mCode: any) => {
        if (AIRPORT_MAPPING[mCode]) {
          (AIRPORT_MAPPING[mCode] || []).forEach((a: any) => validForCurrentMarkets.add(a.code));
        }
      });
      
      const filteredAirports = (product.airports || []).filter((a: string) => validForCurrentMarkets.has(a));
      if (filteredAirports.length !== (product.airports || []).length) {
        setState((prev: any) => ({
          ...prev,
          productDefinition: { ...prev.productDefinition, airports: filteredAirports }
        }));
      }
    }
  }, [activeMarketCodes, setState, (product.airports || []).length]);

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-6 bg-neutral-950 min-h-[600px] space-y-4"
    >
      {/* Global Recommendations Toggle */}
      {!isMobile && (
        <motion.div 
          variants={itemVariants}
          className="flex items-center justify-between p-4 bg-hg-accent/5 border border-hg-accent/20 rounded-2xl mb-6"
        >
          <div className="flex items-center gap-3">
             <div className="p-2 bg-hg-accent text-hg-bg rounded-lg">
                <Sparkles size={18} />
             </div>
             <div>
                <p className="text-[12px] font-black uppercase tracking-widest text-white">Commercial Recommendations</p>
                <p className="text-[10px] text-hg-muted font-bold uppercase tracking-tight">One-click smart configuration for all cards</p>
             </div>
          </div>
          <button 
            disabled={isAnimatingEntrance}
            onClick={() => !isAnimatingEntrance && setApplyGlobalRecommendations(!applyGlobalRecommendations)}
            className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
              applyGlobalRecommendations 
                ? 'bg-hg-accent text-hg-bg shadow-lg shadow-hg-accent/20' 
                : 'bg-white/5 text-hg-muted border border-white/5 hover:bg-white/10'
            } ${isAnimatingEntrance ? 'opacity-50 cursor-wait' : ''}`}
          >
            {applyGlobalRecommendations ? 'Recommendations Applied' : 'Apply All Suggestions'}
          </button>
        </motion.div>
      )}

      {steps.map((step) => {
        const isOpen = activeStep === step.id;
        const Icon = step.icon;
        
        return (
          <motion.div 
            key={step.id} 
            variants={itemVariants}
            className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
              isOpen 
                ? 'bg-neutral-900 border-hg-accent/50 shadow-[0_0_30px_rgba(var(--hg-accent-rgb),0.1)] opacity-100' 
                : 'bg-neutral-900/40 border-white/5 opacity-90 hover:opacity-100 hover:border-white/10'
            } ${isAnimatingEntrance ? 'pointer-events-none' : ''}`}
          >
            {/* Accordion Header */}
            <div 
              className={`w-full px-6 py-4 flex items-center justify-between text-left group transition-all ${isAnimatingEntrance ? 'cursor-wait' : 'cursor-pointer'}`}
              onClick={() => handleStepClick(step.id)}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl transition-all duration-300 ${
                  isOpen ? 'bg-hg-accent text-hg-bg shadow-lg shadow-hg-accent/20 scale-110' : step.isComplete ? 'bg-green-500/10 text-green-500' : 'bg-white/5 text-neutral-500'
                }`}>
                  {step.isComplete && !isOpen ? <Check size={16} /> : <Icon size={16} />}
                </div>
                <div>
                  <h4 className={`text-[13px] font-black uppercase tracking-[0.2em] transition-colors ${isOpen ? 'text-white' : 'text-neutral-400'}`}>
                    {step.label}
                  </h4>
                  {!isOpen && step.isComplete && (
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest mt-0.5 block truncate max-w-[200px] sm:max-w-md">
                      Configured: {step.summary}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                {!isOpen && (
                  <button 
                    className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-md text-[9px] font-black text-hg-muted uppercase tracking-widest border border-white/5 transition-all opacity-0 group-hover:opacity-100"
                  >
                    Edit
                  </button>
                )}
                {isOpen && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-hg-accent/10 border border-hg-accent/20 rounded text-[8px] font-black text-hg-accent uppercase"
                  >
                    <Sparkles size={10} /> Live Editing
                  </motion.div>
                )}
                <ChevronDown size={14} className={`text-neutral-600 transition-transform duration-500 ${isOpen ? 'rotate-180 text-hg-accent' : ''}`} />
              </div>
            </div>

            {/* Accordion Content */}
            <AnimatePresence>
              {isOpen && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: "circOut" }}
                >
                  <div className="px-6 pb-8 space-y-6">
                    {isOpen && step.canApplyRecommendation && !applyGlobalRecommendations && (
                      <div className="pt-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); step.recommendationAction(); }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-hg-accent/5 hover:bg-hg-accent/20 border border-hg-accent/20 rounded-lg text-[10px] font-black text-hg-accent uppercase tracking-widest transition-all"
                        >
                          <Sparkles size={12} />
                          Apply Smart Suggestion
                        </button>
                      </div>
                    )}
                    {/* Content based on step ID */}
                    {step.id === 1 && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="p-4 bg-black/40 border border-white/5 rounded-xl">
                          <label className="text-[9px] font-black text-hg-muted uppercase tracking-widest mb-3 block">Selected Markets</label>
                          {selectedMarketsAndClusters.length === 0 ? (
                            <span className="text-hg-muted text-[11px] italic">No markets selected. Global scope active.</span>
                          ) : (
                            <CollapsedSelection 
                              items={selectedMarketsAndClusters} 
                              onRemove={(item) => {
                                const cluster = MARKET_CLUSTERS.find(c => c.name === item);
                                if (cluster) toggleCluster(cluster.id);
                                else {
                                  const market = COUNTRIES.find(m => m.name === item);
                                  if (market) toggleMarketInCluster(market.code);
                                }
                              }}
                            />
                          )}
                        </div>

                        <div className="relative group">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-hg-accent transition-colors" size={16} />
                          <input 
                            type="text"
                            placeholder="Find target markets or commercial clusters..."
                            value={marketSearch}
                            onChange={(e) => setMarketSearch(e.target.value)}
                            className="w-full h-11 bg-black/20 border border-white/10 rounded-xl pl-12 pr-4 text-white text-[12px] focus:border-hg-accent/50 focus:ring-4 focus:ring-hg-accent/5 transition-all outline-none"
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                          {filteredMarketOptions.map((opt: any) => {
                            const key = stableKey("market-opt", opt.code || opt.id);
                            if (opt.isCluster) {
                              const isSelected = product.selectedClusters.includes(opt.id);
                              const isExpanded = expandedClusters.has(opt.id);
                              return (
                                <div key={key} className="space-y-1">
                                  <div 
                                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                                      isSelected ? 'bg-hg-accent/10 border-hg-accent/50' : 'bg-white/5 border-transparent hover:bg-white/10'
                                    }`}
                                    onClick={() => toggleCluster(opt.id)}
                                  >
                                     <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-hg-accent text-hg-bg' : 'bg-white/5 text-neutral-500'}`}>
                                          <Archive size={12} />
                                        </div>
                                        <span className={`text-[12px] font-bold ${isSelected ? 'text-white' : 'text-neutral-300'}`}>{opt.name}</span>
                                     </div>
                                     <div className="flex items-center gap-2">
                                       <span className="text-[9px] text-neutral-500 font-mono uppercase">{opt.countries.length} MKTS</span>
                                       <button 
                                         onClick={(e) => {
                                           e.stopPropagation();
                                           const next = new Set(expandedClusters);
                                           if (isExpanded) next.delete(opt.id); else next.add(opt.id);
                                           setExpandedClusters(next);
                                         }}
                                         className="p-1 px-2 hover:bg-white/5 rounded text-neutral-500 text-[10px] appearance-none"
                                       >
                                         <PlusCircle size={12} className={`transition-transform ${isExpanded ? 'rotate-45' : ''}`} />
                                       </button>
                                     </div>
                                  </div>
                                </div>
                              );
                            } else {
                              const isSelected = product.markets.includes(opt.code) && !MARKET_CLUSTERS.some(c => product.selectedClusters.includes(c.id) && c.countries.includes(opt.code));
                              return (
                                <div 
                                  key={key}
                                  onClick={() => toggleMarketInCluster(opt.code)}
                                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                                    isSelected ? 'bg-hg-accent/10 border-hg-accent/50' : 'bg-white/5 border-transparent hover:bg-white/10'
                                  }`}
                                >
                                   <div className="flex items-center gap-3">
                                      <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-hg-accent text-hg-bg' : 'bg-white/5 text-neutral-500'}`}>
                                        <Globe size={12} />
                                      </div>
                                      <span className={`text-[12px] font-bold ${isSelected ? 'text-white' : 'text-neutral-300'}`}>{opt.name}</span>
                                   </div>
                                   <span className="text-[9px] text-neutral-500 font-mono uppercase">{opt.code}</span>
                                </div>
                              );
                            }
                          })}
                        </div>
                      </div>
                    )}

                    {step.id === 2 && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                        <p className="text-[11px] text-neutral-400 font-medium">Configure IATA hubs for the selected markets. Empty means all hubs in market scope.</p>
                        <div className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-3">
                          <label className="text-[9px] font-black text-hg-muted uppercase tracking-widest block">Whitelist Hubs</label>
                          {product.airports.length === 0 ? (
                            <span className="text-hg-muted text-[11px] italic">Global feed (Full market coverage)</span>
                          ) : (
                            <CollapsedSelection 
                              items={product.airports} 
                              onRemove={(a) => {
                                const newAirports = product.airports.filter((airport: string) => airport !== a);
                                setState((prev: any) => ({ ...prev, productDefinition: { ...prev.productDefinition, airports: newAirports }}));
                              }}
                            />
                          )}
                        </div>
                        <SearchableMultiSelect 
                          label="Target Hubs"
                          placeholder="Search IATA codes..."
                          options={(() => {
                            const availableAirports: { label: string; value: string }[] = [];
                            (activeMarketCodes || []).forEach((mCode: any) => {
                              if (AIRPORT_MAPPING[mCode]) {
                                (AIRPORT_MAPPING[mCode] || []).forEach(a => {
                                  if (!availableAirports.some(oa => oa.value === a.code)) {
                                    availableAirports.push({ label: `${a.name} (${a.code})`, value: a.code });
                                  }
                                });
                              }
                            });
                            return availableAirports;
                          })()}
                          selectedValues={product.airports}
                          onChange={(vals) => setState((prev: any) => ({ ...prev, productDefinition: { ...prev.productDefinition, airports: vals }}))}
                        />
                      </div>
                    )}

                    {step.id === 3 && (
                      <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center justify-between p-5 bg-black/40 border border-white/5 rounded-xl">
                           <div className="space-y-1">
                             <div className="text-[13px] font-black text-white uppercase tracking-wider tabular-nums">Booking Lead Time</div>
                             <p className="text-[10px] text-neutral-500">Maximum days in advance permitted</p>
                           </div>
                           <div className="flex items-center gap-4 bg-hg-panel px-6 py-2 rounded-lg border border-hg-border">
                              <input 
                                type="number"
                                min={1} max={365}
                                value={product.bookingWindowDays}
                                onChange={(e) => setState((prev: any) => ({ ...prev, productDefinition: { ...prev.productDefinition, bookingWindowDays: parseInt(e.target.value) || 0 }}))}
                                className="bg-transparent border-none text-hg-accent font-mono text-xl font-black w-12 text-center focus:ring-0"
                              />
                              <span className="text-[10px] text-neutral-500 uppercase font-black tracking-widest">Days</span>
                           </div>
                        </div>
                        <div className="px-2 pt-2">
                          <input 
                            type="range"
                            min={1} max={365}
                            value={product.bookingWindowDays}
                            onChange={(e) => setState((prev: any) => ({ ...prev, productDefinition: { ...prev.productDefinition, bookingWindowDays: parseInt(e.target.value) }}))}
                            className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-hg-accent"
                          />
                          <div className="flex justify-between mt-3 text-[9px] font-bold text-neutral-600 uppercase tracking-widest px-1">
                             <span>Immediate</span>
                             <span>180 Days</span>
                             <span>1 Year</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {step.id === 4 && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] text-neutral-400 font-medium">Select supported length-of-stay nights. Whitelisted vectors will generate cache objects.</p>
                          <button 
                            onClick={() => setState((prev: any) => ({ ...prev, productDefinition: { ...prev.productDefinition, stayDurations: recommendations.stayDurations }}))}
                            className="text-[9px] font-black text-hg-accent hover:brightness-110 flex items-center gap-1.5 px-3 py-1.5 bg-hg-accent/5 border border-hg-accent/10 rounded-full transition-all"
                          >
                            <Sparkles size={12} /> Sync with AI Recs
                          </button>
                        </div>
                        <div className="p-4 bg-black/20 border border-white/5 rounded-xl grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2">
                          {Array.from({ length: 30 }, (_, i) => i + 1).map(n => {
                            const isSelected = product.stayDurations.includes(n);
                            const isRecommended = recommendations?.stayDurations?.includes(n);
                            return (
                              <button
                                key={n}
                                onClick={() => toggleDuration(n)}
                                className={`h-11 rounded-xl border transition-all flex flex-col items-center justify-center gap-0.5 relative overflow-hidden ${
                                  isSelected 
                                    ? 'bg-hg-accent/20 border-hg-accent text-hg-accent' 
                                    : isRecommended ? 'bg-white/5 border-hg-accent/20 text-neutral-400 hover:border-hg-accent/40' : 'bg-black/20 border-white/5 text-neutral-600 hover:border-white/20'
                                }`}
                              >
                                <span className="text-[12px] font-mono font-black">{n}</span>
                                {isRecommended && (
                                  <div className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-hg-accent' : 'bg-hg-accent/50'}`} />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {step.id === 5 && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex flex-wrap gap-2">
                          {MEAL_PLANS.map(mp => {
                            const isSelected = product.mealPlans.includes( mp);
                            return (
                              <button
                                key={mp}
                                onClick={() => {
                                  const newMPs = isSelected 
                                    ? product.mealPlans.filter((m: string) => m !== mp)
                                    : [...product.mealPlans, mp];
                                  setState((prev: any) => ({ ...prev, productDefinition: { ...prev.productDefinition, mealPlans: newMPs }}));
                                }}
                                className={`px-10 py-4 rounded-xl text-[11px] font-black transition-all border uppercase tracking-[0.1em] ${
                                  isSelected 
                                    ? 'bg-hg-accent/20 border-hg-accent text-hg-accent shadow-lg shadow-hg-accent/5' 
                                    : 'bg-black/20 border-white/5 text-neutral-500 hover:bg-black/40 hover:border-white/20'
                                }`}
                              >
                                {mp}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {step.id === 6 && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(COMMON_OCCUPANCIES).map(([key, occ]: [string, any]) => {
                            const isSelected = product.occupancies.some((o: any) => o.id === key);
                            const isRecommended = (recommendations?.occupancies as unknown as string[])?.includes(key);
                            return (
                              <button
                                key={key}
                                onClick={() => {
                                  const newOccs = isSelected 
                                    ? product.occupancies.filter((o: any) => o.id !== key)
                                    : [...product.occupancies, { ...occ, id: key }];
                                  setState((prev: any) => ({ ...prev, productDefinition: { ...prev.productDefinition, occupancies: newOccs }}));
                                }}
                                className={`px-6 py-4 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 min-w-[120px] relative ${
                                  isSelected 
                                    ? 'bg-hg-accent/20 border-hg-accent text-hg-accent' 
                                    : isRecommended ? 'bg-white/5 border-hg-accent/20 text-neutral-400' : 'bg-black/20 border-white/5 text-neutral-600'
                                }`}
                              >
                                <span className="text-[12px] font-black uppercase tracking-wider">{occ.label}</span>
                                <div className="flex items-center gap-1 opacity-60">
                                  <User size={10} />
                                  <span className="text-[10px] font-bold">{occ.adults}</span>
                                  {occ.children > 0 && <><span className="mx-0.5">+</span><span className="text-[10px] font-bold">{occ.children}</span></>}
                                </div>
                                {isRecommended && (
                                  <div className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-hg-accent' : 'bg-hg-accent/50'}`} />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

export default App;
