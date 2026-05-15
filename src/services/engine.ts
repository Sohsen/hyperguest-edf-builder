import { 
  Hotel, 
  ProductDefinition, 
  ARIData, 
  PackagingStrategy, 
  Season, 
  ExecutionDecision,
  ConstraintCompliance,
  ARIMatchDiagnostic
} from '../types';
import { 
  MAX_CB_PER_ROOM, 
  MAX_SEASONS_PER_HOTEL, 
  MAX_TOTAL_PRICES_PER_HOTEL, 
  MAX_PRICES_PER_ROOM, 
  MAJOR_PRICE_SHIFT 
} from '../constants';

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

export interface DerivationResult {
  price: number;
  components: { stayDuration: number; price: number; startDate: string; endDate: string }[];
  strategy: 'EXACT' | 'EXACT_MULTIPLE' | 'MIXED_BUILD' | 'SINGLE_NIGHT_EXPANSION';
  rejectedPaths: number;
  raw?: ARIData;
}

export const DEFAULT_FALLBACK_POLICY: FallbackPolicy = {
  allowStayDurationsFallback: true,
  allowOccupancyFallback: true,
  allowMealPlanFallback: false,
  allowMarketFallback: false,
  stayDurationsFallback: {
    allowDerivation: true,
    allowMixedBuild: true,
    allowSingleNightExpansion: true,
    maxCombinationDepth: 28,
    preferExactMultiples: true,
    enforceContiguity: true,
    enforceAvailability: true
  }
};

export const PRICE_VARIANCE_THRESHOLD = 0.05;

export const getSeededRandom = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  return () => {
    h = Math.imul(h ^ h >>> 16, 0x85ebca6b);
    h = Math.imul(h ^ h >>> 13, 0xc2b2ae35);
    return ((h = h ^ h >>> 16) >>> 0) / 4294967296;
  };
};

export const jitterShift = (dateStr: string) => {
  const d = new Date(dateStr);
  const rng = getSeededRandom(dateStr);
  d.setDate(d.getDate() + Math.floor(rng() * 3) - 1);
  return d.toISOString().split('T')[0];
};

export const getBehaviorSignature = (day: ARIData | undefined): string => {
  if (!day) return 'END';
  return [
    day.minLOS,
    day.maxLOS,
    day.release || 0,
    day.lastMinute || 0,
    day.stopSell ? 'SS' : 'OK',
    day.cta ? 'CTA' : '-',
    day.ctd ? 'CTD' : '-',
    day.alloc > 0 ? 'AV' : 'NA'
  ].join('|');
};

export const arePriceVectorsCompatible = (v1: number[], v2: number[], threshold: number): boolean => {
  if (v1.length !== v2.length) return false;
  for (let i = 0; i < v1.length; i++) {
    if (v1[i] === -1 || v2[i] === -1) {
      if (v1[i] !== v2[i]) return false;
      continue;
    }
    const variance = Math.abs(v1[i] - v2[i]) / Math.max(v1[i], 1);
    if (variance > threshold) return false;
  }
  return true;
};

export const resolveDurationPrice = (
  startDateStr: string,
  targetDuration: number,
  ariByDate: Record<string, ARIData[]>,
  policy: FallbackPolicy['stayDurationsFallback'],
  depth: number = 0,
  memo: Map<string, DerivationResult | null> = new Map()
): DerivationResult | null => {
  const memoKey = `${startDateStr}-${targetDuration}`;
  if (memo.has(memoKey)) return memo.get(memoKey);

  if (targetDuration === 0) return { price: 0, components: [], strategy: 'EXACT', rejectedPaths: 0 };
  if (depth >= policy.maxCombinationDepth) return null;

  const entries = ariByDate[startDateStr] || [];
  let rejectedCount = 0;

  const exact = entries.find(e => e.stayDuration === targetDuration);
  if (exact) {
    if (policy.enforceAvailability && (exact.stopSell || exact.alloc === 0)) {
      rejectedCount++;
    } else {
      const res: DerivationResult = {
        price: exact.price,
        components: [{ 
          stayDuration: exact.stayDuration, price: exact.price, startDate: startDateStr, 
          endDate: new Date(new Date(startDateStr).getTime() + (exact.stayDuration - 1) * 86400000).toISOString().split('T')[0]
        }],
        strategy: 'EXACT', rejectedPaths: rejectedCount, raw: exact
      };
      memo.set(memoKey, res);
      return res;
    }
  }

  if (!policy.allowDerivation) return null;

  const availableDurations = entries
    .filter(e => e.stayDuration > 0 && e.stayDuration < targetDuration)
    .sort((a, b) => b.stayDuration - a.stayDuration);

  let bestResult: DerivationResult | null = null;
  for (const entry of availableDurations) {
    if (policy.enforceAvailability && (entry.stopSell || entry.alloc === 0)) {
      rejectedCount++;
      continue;
    }
    const nextDate = new Date(startDateStr);
    nextDate.setDate(nextDate.getDate() + entry.stayDuration);
    const nextDateStr = nextDate.toISOString().split('T')[0];
    const result = resolveDurationPrice(nextDateStr, targetDuration - entry.stayDuration, ariByDate, policy, depth + 1, memo);
    
    if (result) {
      const totalPrice = entry.price + result.price;
      const components = [{
        stayDuration: entry.stayDuration, price: entry.price, startDate: startDateStr,
        endDate: new Date(new Date(startDateStr).getTime() + (entry.stayDuration - 1) * 86400000).toISOString().split('T')[0]
      }, ...result.components];

      const allSame = components.every(c => c.stayDuration === components[0].stayDuration);
      let currentStrategy: DerivationResult['strategy'] = 'MIXED_BUILD';
      if (allSame) {
        currentStrategy = components[0].stayDuration === 1 ? 'SINGLE_NIGHT_EXPANSION' : 'EXACT_MULTIPLE';
      }

      const currentResult: DerivationResult = {
        price: totalPrice, components, strategy: currentStrategy,
        rejectedPaths: rejectedCount + result.rejectedPaths, raw: entry
      };

      if (!bestResult) {
        bestResult = currentResult;
      } else {
        const bestIsExactMultiple = bestResult.strategy === 'EXACT_MULTIPLE' || bestResult.strategy === 'SINGLE_NIGHT_EXPANSION' || bestResult.strategy === 'EXACT';
        const currentIsExactMultiple = currentResult.strategy === 'EXACT_MULTIPLE' || currentResult.strategy === 'SINGLE_NIGHT_EXPANSION' || currentResult.strategy === 'EXACT';
        if (currentIsExactMultiple && !bestIsExactMultiple) bestResult = currentResult;
        else if (currentResult.components.length < bestResult.components.length) bestResult = currentResult;
        else if (currentResult.components.length === bestResult.components.length && totalPrice < bestResult.price) bestResult = currentResult;
      }
    } else { rejectedCount++; }
  }
  memo.set(memoKey, bestResult);
  return bestResult;
};

export const getPriceVector = (
  index: number, 
  ari: ARIData[], 
  stayDurations: number[], 
  ariByDate: Record<string, ARIData[]>,
  policy: FallbackPolicy,
  memo: Map<string, DerivationResult | null> = new Map()
): number[] => {
  if (!ari[index]) return stayDurations.map(() => -1);
  const startDate = ari[index].date;
  return stayDurations.map(d => {
    const result = resolveDurationPrice(startDate, d, ariByDate, policy.stayDurationsFallback, 0, memo);
    return result ? result.price : -1;
  });
};

export function mergeAdjacentSeasonsInRoom(seasons: Season[], threshold: number): Season[] {
  if (seasons.length <= 1) return seasons;
  let currentSeasons = [...seasons];
  let changed = true;
  while (changed) {
    changed = false;
    const newSeasons: Season[] = [];
    for (let i = 0; i < currentSeasons.length; i++) {
      const s1 = currentSeasons[i]; const s2 = currentSeasons[i+1];
      if (s2) {
        const sameRest = s1.minLOS === s2.minLOS && s1.maxLOS === s2.maxLOS && s1.stopSell === s2.stopSell && s1.cta === s2.cta && s1.ctd === s2.ctd;
        let totalVar = 0, count = 0;
        const keys1 = Object.keys(s1.chargeblocks);
        for (const k of keys1) {
          if (s2.chargeblocks[k]) {
            const p1 = Object.values(s1.chargeblocks[k] as Record<number, number>)[0];
            const p2 = Object.values(s2.chargeblocks[k] as Record<number, number>)[0];
            totalVar += Math.abs(p1 - p2) / Math.max(p1, 1);
            count++;
          }
        }
        const avgVar = count > 0 ? totalVar / count : 0;
        if (sameRest && avgVar <= threshold) {
          const merged: Season = { ...s1, endDate: s2.endDate, alloc: Math.max(s1.alloc, s2.alloc), chargeblocks: { ...s1.chargeblocks } };
          Object.keys(merged.chargeblocks).forEach(k => {
             if (s2.chargeblocks[k]) {
                const p1 = merged.chargeblocks[k], p2 = s2.chargeblocks[k];
                Object.keys(p1).forEach(d => { p1[Number(d)] = Math.round((p1[Number(d)] + p2[Number(d)]) / 2); });
             }
          });
          newSeasons.push(merged); i++; changed = true; continue;
        }
      }
      newSeasons.push(s1);
    }
    currentSeasons = newSeasons;
  }
  return currentSeasons;
}

export function forceMergeSeasons(seasons: Season[], limit: number): Season[] {
  let currentSeasons = [...seasons];
  const getCBCount = (ss: Season[]) => ss.reduce((acc, s) => acc + Object.keys(s.chargeblocks).length, 0);
  while (getCBCount(currentSeasons) > limit && currentSeasons.length > 1) {
    let bestIdx = -1; let minVariance = Infinity;
    for (let i = 0; i < currentSeasons.length - 1; i++) {
        const s1 = currentSeasons[i]; const s2 = currentSeasons[i+1];
        let totalVar = 0, count = 0;
        const keys1 = Object.keys(s1.chargeblocks);
        for (const k of keys1) {
          if (s2.chargeblocks[k]) {
            const p1 = Object.values(s1.chargeblocks[k] as Record<number, number>)[0], p2 = Object.values(s2.chargeblocks[k] as Record<number, number>)[0];
            totalVar += Math.abs(p1 - p2) / Math.max(p1, 1); count++;
          }
        }
        const variance = count > 0 ? totalVar / count : 1;
        if (variance < minVariance) { minVariance = variance; bestIdx = i; }
    }
    if (bestIdx !== -1) {
       const s1 = currentSeasons[bestIdx], s2 = currentSeasons[bestIdx+1];
       const merged: Season = { ...s1, endDate: s2.endDate, alloc: Math.max(s1.alloc, s2.alloc), chargeblocks: { ...s1.chargeblocks } };
       Object.keys(merged.chargeblocks).forEach(k => {
          if (s2.chargeblocks[k]) {
             const p1 = merged.chargeblocks[k], p2 = s2.chargeblocks[k];
             Object.keys(p1).forEach(d => { p1[Number(d)] = Math.round((p1[Number(d)] + p2[Number(d)]) / 2); });
          }
       });
       currentSeasons.splice(bestIdx, 2, merged);
    } else break;
  }
  return currentSeasons;
}

export function reduceRoomDimensions(seasons: Season[], limit: number): Season[] {
  const allCombinations = new Set<string>();
  seasons.forEach(s => Object.keys(s.chargeblocks).forEach(k => allCombinations.add(k)));
  const combinations = Array.from(allCombinations);
  combinations.sort((a, b) => a.length - b.length || a.localeCompare(b));
  let comboCount = combinations.length;
  while (seasons.reduce((acc, s) => acc + Object.keys(s.chargeblocks).filter(k => combinations.slice(0, comboCount).includes(k)).length, 0) > limit && comboCount > 1) comboCount--;
  const activeCombos = combinations.slice(0, comboCount);
  return seasons.map(s => {
    const newCB: Record<string, Record<number, number>> = {};
    activeCombos.forEach(c => { if (s.chargeblocks[c]) newCB[c] = s.chargeblocks[c]; });
    return { ...s, chargeblocks: newCB };
  });
}

export function enforcePeakworkConstraints(
  roomsDerivation: any[],
  strategy: PackagingStrategy,
  hotel: Hotel
): { 
  processedRooms: any[], 
  compliance: ConstraintCompliance,
  decisions: Record<string, ExecutionDecision>
} {
  const decisions: Record<string, ExecutionDecision> = {};
  let rooms = JSON.parse(JSON.stringify(roomsDerivation));
  rooms = rooms.map((room: any) => {
    const originalCB = (room.seasons || []).reduce((acc: number, s: any) => acc + Object.keys(s.chargeblocks).length, 0);
    if (room.seasons.length === 0) {
      decisions[room.roomCode] = { strategy, constraintTriggered: 'EMPTY_DATA', actionTaken: 'NO_EXPORTABLE_SEASONS' };
      return { ...room, roomChargeblocks: 0 };
    }
    if (originalCB <= MAX_CB_PER_ROOM) {
      decisions[room.roomCode] = { strategy, constraintTriggered: 'NONE', actionTaken: 'NONE' };
      return { ...room, roomChargeblocks: originalCB };
    }
    let currentSeasons = [...room.seasons]; let actionTaken = '';
    const mergeThreshold = strategy === PackagingStrategy.MINIMIZED ? 0.25 : (strategy === PackagingStrategy.BALANCED ? 0.15 : 0.08);
    currentSeasons = mergeAdjacentSeasonsInRoom(currentSeasons, mergeThreshold);
    actionTaken = `Applied deterministic season merge (threshold ${mergeThreshold})`;
    let currentCB = currentSeasons.reduce((acc, s) => acc + Object.keys(s.chargeblocks).length, 0);
    if (currentCB > MAX_CB_PER_ROOM) {
      currentSeasons = forceMergeSeasons(currentSeasons, MAX_CB_PER_ROOM); actionTaken += ` -> Forced date-band merging`;
      currentCB = currentSeasons.reduce((acc, s) => acc + Object.keys(s.chargeblocks).length, 0);
    }
    if (currentCB > MAX_CB_PER_ROOM) {
      currentSeasons = reduceRoomDimensions(currentSeasons, MAX_CB_PER_ROOM); actionTaken += ` -> Reduced mealPlans/occupancies dimensions`;
      currentCB = currentSeasons.reduce((acc, s) => acc + Object.keys(s.chargeblocks).length, 0);
    }
    decisions[room.roomCode] = { strategy, constraintTriggered: 'MAX_CB_PER_ROOM > 31', actionTaken: `${actionTaken} (Reduced from ${originalCB} to ${currentCB})` };
    return { ...room, seasons: currentSeasons, roomChargeblocks: currentCB };
  });
  const maxCBPerRoom = rooms.length > 0 ? Math.max(...rooms.map((r: any) => r.roomChargeblocks)) : 0;
  const roomsExceedingLimit = rooms.filter((r: any) => r.roomChargeblocks > MAX_CB_PER_ROOM).length;
  const roomsAutoCorrected = Object.values(decisions).filter(d => d.actionTaken !== 'NONE').length;
  const roomsWithNoSeasons = rooms.filter((r: any) => (r.seasons || []).length === 0).length;
  const totalSeasons = rooms.reduce((acc: number, r: any) => acc + r.seasons.length, 0);
  const seasonLimitExceeded = totalSeasons > MAX_SEASONS_PER_HOTEL;
  const totalPrices = rooms.reduce((acc: number, r: any) => acc + r.seasons.reduce((sAcc: number, s: any) => sAcc + Object.values(s.chargeblocks as Record<string, any>).reduce((cAcc: number, c: any) => cAcc + Object.keys(c).length, 0), 0), 0);
  const hotelPriceLimitExceeded = totalPrices > MAX_TOTAL_PRICES_PER_HOTEL;
  const priceViolationRooms = rooms.filter((r: any) => {
    const uniquePrices = new Set();
    r.seasons.forEach((s: any) => Object.values(s.chargeblocks).forEach((c: any) => Object.values(c).forEach(p => uniquePrices.add(p))));
    return uniquePrices.size > MAX_PRICES_PER_ROOM;
  }).length;
  const compliance = { roomsWithinCBLimit: roomsExceedingLimit === 0, maxCBPerRoom, roomsExceedingLimit, roomsAutoCorrected, priceLimitExceeded: priceViolationRooms > 0, priceViolationRooms, roomsWithNoSeasons, seasonLimitExceeded, hotelPriceLimitExceeded };
  return { processedRooms: rooms, compliance, decisions };
}

export const mapOccupancyToARICode = (occ: any): string => {
  if (typeof occ === 'string') return occ;
  const { adults, children } = occ;
  if (adults === 1 && children === 0) return '1A';
  if (adults === 2 && children === 0) return '2A';
  if (adults === 2 && children === 1) return '2A1C';
  if (adults === 2 && children === 2) return '2A2C';
  return occ.id;
};

export const getHotelCategory = (hotel: Hotel): 'SMALL' | 'CITY' | 'RESORT' => {
  const resortCodes = new Set(['PMI', 'AYT', 'HER', 'HRG', 'LPA', 'TFS', 'FUE', 'RHO', 'KGS', 'RMF', 'SSH', 'DLM', 'BJV', 'CFU', 'ZTH', 'CHQ', 'LCA', 'PFO', 'DJE', 'MIR', 'AGP', 'ALC', 'IBZ', 'MAH', 'DBV', 'SPU', 'ACE', 'FAO', 'FNC', 'PDL', 'SPC', 'HKT', 'DPS']);
  if (resortCodes.has(hotel.destination)) return 'RESORT';
  if (hotel.starRating <= 3) return 'SMALL';
  return 'CITY';
};

export const getInputComplexityMetrics = (hotel: Hotel, importedARI: Record<string, any>) => {
  const ari = importedARI[hotel.hgId];
  if (!ari) return { category: 'LOW' as const, score: 0, ariRowCount: 0, priceChangeCount: 0, restrictionChangeCount: 0, roomCount: 0, mealPlanCount: 0, occupancyCount: 0 };
  let ariRowCount = 0, priceChangeCount = 0, restrictionChangeCount = 0;
  const rooms = Object.keys(ari), mpsSet = new Set<string>(), occsSet = new Set<string>();
  rooms.forEach(room => {
    Object.entries(ari[room] as any).forEach(([mp, occData]: [string, any]) => {
      mpsSet.add(mp);
      Object.entries(occData).forEach(([occ, days]: [string, any]) => {
        occsSet.add(occ); const dayList = days as any[]; ariRowCount += dayList.length;
        for (let i = 1; i < dayList.length; i++) {
          const d1 = dayList[i], d2 = dayList[i-1];
          if (d1.price !== d2.price) priceChangeCount++;
          if (d1.minLOS !== d2.minLOS || d1.maxLOS !== d2.maxLOS || d1.stopSell !== d2.stopSell || d1.alloc !== d2.alloc) restrictionChangeCount++;
        }
      });
    });
  });
  const totalScore = (rooms.length * 8) + (mpsSet.size * 4) + (occsSet.size * 4) + (priceChangeCount * 0.5) + (restrictionChangeCount * 0.8) + (Math.sqrt(ariRowCount) * 0.5);
  let category: 'LOW' | 'MED' | 'HIGH' = 'LOW';
  if (totalScore > 120 || priceChangeCount > 100 || restrictionChangeCount > 50) category = 'HIGH';
  else if (totalScore > 50 || priceChangeCount > 20) category = 'MED';
  return { category, score: totalScore, ariRowCount, priceChangeCount, restrictionChangeCount, roomCount: rooms.length, mealPlanCount: mpsSet.size, occupancyCount: occsSet.size };
};

export const getHotelComplexity = (hotel: Hotel, importedARI: Record<string, any>): 'SIMPLE' | 'MEDIUM' | 'COMPLEX' => {
  const metrics = getInputComplexityMetrics(hotel, importedARI);
  if (metrics.category === 'HIGH') return 'COMPLEX';
  if (metrics.category === 'MED') return 'MEDIUM';
  return 'SIMPLE';
};

export const resolveGiata = (gid: string | undefined, hgId: string): { id: string; status: 'active' | 'provisional' } => {
  if (!gid || gid === '-' || gid.trim() === '') return { id: `DGIATA_${hgId}`, status: 'provisional' };
  return { id: gid, status: 'active' };
};

export const deriveHotels = (ariData: Record<string, any>, allHotels: Hotel[]): Hotel[] => {
  if (!ariData) return [];
  const ariKeys = new Set(Object.keys(ariData));
  return allHotels
    .filter(h => h && ariKeys.has(h.hgId))
    .map(h => {
      const ari = ariData[h.hgId];
      const roomCount = ari ? Object.keys(ari).length : 0;
      
      // Precompute meal plans
      const mealPlansSet = new Set<string>();
      if (ari) {
        Object.values(ari).forEach((rooms: any) => {
          Object.keys(rooms).forEach(plan => mealPlansSet.add(plan));
        });
      }

      return {
        ...h,
        roomCount,
        mealPlans: Array.from(mealPlansSet)
      };
    });
};

export const buildAriIndexes = (ari: Record<string, any>, allHotels: Hotel[]) => {
  const hotelsById: Record<string, Hotel> = {};
  const destinations = new Set<string>();
  const countries = new Set<string>();
  const hotelSummaries: Hotel[] = [];
  const roomsByHotel: Record<string, string[]> = {};
  const mealPlansByHotel: Record<string, string[]> = {};
  const occupanciesByHotel: Record<string, string[]> = {};
  
  if (!ari) return { hotelsById, hotelSummaries, destinations: [], countries: [], ariRows: 0, roomCount: 0, roomsByHotel, mealPlansByHotel, occupanciesByHotel };

  let totalRows = 0;
  let totalRoomsNum = 0;
  const ariKeys = new Set(Object.keys(ari));

  allHotels.forEach(h => {
    if (h && ariKeys.has(h.hgId)) {
      const hotelAri = ari[h.hgId];
      const mealPlansSet = new Set<string>();
      const roomsSet = new Set<string>();
      const occupanciesSet = new Set<string>();
      let hotelRows = 0;
      
      Object.entries(hotelAri).forEach(([roomCode, mpData]: [string, any]) => {
        roomsSet.add(roomCode);
        Object.entries(mpData).forEach(([mp, occData]: [string, any]) => {
          mealPlansSet.add(mp);
          Object.entries(occData).forEach(([occ, days]: [string, any]) => {
            occupanciesSet.add(occ);
            hotelRows += (days as any[]).length;
          });
        });
      });

      const rooms = Array.from(roomsSet);
      totalRoomsNum += rooms.length;
      
      const summary: Hotel = {
        ...h,
        roomCount: rooms.length,
        mealPlans: Array.from(mealPlansSet)
      };

      hotelsById[h.id] = summary;
      hotelSummaries.push(summary);
      destinations.add(h.destination);
      countries.add(h.country);
      roomsByHotel[h.id] = rooms;
      mealPlansByHotel[h.id] = Array.from(mealPlansSet);
      occupanciesByHotel[h.id] = Array.from(occupanciesSet);
      totalRows += hotelRows;
    }
  });

  return {
    hotelsById,
    hotelSummaries,
    destinations: Array.from(destinations),
    countries: Array.from(countries),
    ariRows: totalRows,
    roomCount: totalRoomsNum,
    roomsByHotel,
    mealPlansByHotel,
    occupanciesByHotel
  };
};

export const getHotelIdentity = (hotel: Hotel) => {
  const rng = getSeededRandom(hotel.hgId); const category = getHotelCategory(hotel);
  const breakpoints = Array.from({ length: 3 + Math.floor(rng() * 4) }, () => rng());
  return { category, breakpoints, shiftDays: () => Math.floor(rng() * 7) - 3, rng, isAirport: ['DXB', 'LHR', 'FRA'].includes(hotel.destination), isResort: category === 'RESORT', isBoutique: hotel.starRating >= 4 && !category.includes('RESORT') && rng() > 0.7 };
};

export const deriveSeasonsForRoom = (
  roomData: Record<string, Record<string, ARIData[]>>, 
  stayDurations: number[],
  hotel: Hotel,
  baseThreshold: number = PRICE_VARIANCE_THRESHOLD,
  complexity: 'SIMPLE' | 'MEDIUM' | 'COMPLEX' = 'MEDIUM',
  variationSeed: number = 0,
  fallbackPolicy: FallbackPolicy = DEFAULT_FALLBACK_POLICY
): { seasons: Season[]; rawCount: number; mergedCount: number; combinations: number; seasonsGenerated: number; seasonsFiltered: number; ariRowsMatched: number; filterReason?: string; } => {
  const identity = getHotelIdentity(hotel); let totalAriRowsMatched = 0;
  const jitterPrice = (p: number) => variationSeed === 0 ? p : p * (1 + (variationSeed * 0.01));
  const boardOccs: { mp: string; occ: string }[] = [];
  Object.entries(roomData).forEach(([mp, occs]) => Object.keys(occs).forEach(occ => boardOccs.push({ mp, occ })));
  if (boardOccs.length === 0) return { seasons: [], rawCount: 0, mergedCount: 0, combinations: 0, seasonsGenerated: 0, seasonsFiltered: 0, ariRowsMatched: 0, filterReason: 'No matching Board/Occupancy pairs found' };
  const ariByTrack: Record<string, Record<string, ARIData[]>> = {}, allTrackBreakpoints = new Set<string>();
  boardOccs.forEach(({ mp, occ }) => {
    const trackKey = `${mp}|${occ}`, ariRaw = roomData[mp][occ]; if (ariRaw.length === 0) return;
    totalAriRowsMatched += ariRaw.length;
    const ariByDate: Record<string, ARIData[]> = {}; ariRaw.forEach(d => { if (!ariByDate[d.date]) ariByDate[d.date] = []; ariByDate[d.date].push(d); });
    ariByTrack[trackKey] = ariByDate;
    const ari = Object.keys(ariByDate).sort().map(date => {
      const entries = ariByDate[date], primary = entries.find(e => e.stayDuration === 1) || entries[0];
      const dayRng = getSeededRandom(`${hotel.hgId}-${mp}-${occ}-${date}`), newDay = { ...primary };
      if (dayRng() < 0.02) { if (dayRng() > 0.5) newDay.stopSell = true; else newDay.minLOS = identity.isAirport ? 3 : 7; }
      return newDay;
    });
    const trackBreakpoints = new Set<string>(); trackBreakpoints.add(ari[0].date);
    let curBehavior = getBehaviorSignature(ari[0]); const trackMemo = new Map<string, DerivationResult | null>();
    let curPriceVector = getPriceVector(0, ari, stayDurations, ariByDate, fallbackPolicy, trackMemo);
    for (let i = 1; i < ari.length; i++) {
        const behavior = getBehaviorSignature(ari[i]), priceVector = getPriceVector(i, ari, stayDurations, ariByDate, fallbackPolicy, trackMemo);
        if (behavior !== curBehavior || !arePriceVectorsCompatible(curPriceVector, priceVector, MAJOR_PRICE_SHIFT * (0.8 + identity.rng() * 0.4))) {
          trackBreakpoints.add(ari[i].date); curBehavior = behavior; curPriceVector = priceVector;
        }
    }
    trackBreakpoints.forEach(dateStr => {
      let fDate = dateStr; if (variationSeed !== 0) fDate = jitterShift(dateStr);
      if (identity.rng() > 0.7) { const d = new Date(fDate); d.setDate(d.getDate() + Math.floor(identity.rng() * 7) - 3); const s = d.toISOString().split('T')[0]; if (ari.some(x => x.date === s)) fDate = s; }
      allTrackBreakpoints.add(fDate);
    });
  });
  const firstARI = roomData[boardOccs[0].mp][boardOccs[0].occ];
  if (firstARI.length > 20) identity.breakpoints.forEach(p => { let b = firstARI[Math.floor(p * (firstARI.length-1))].date; if (variationSeed !== 0) b = jitterShift(b); allTrackBreakpoints.add(b); });
  const lastD = new Date(firstARI[firstARI.length-1].date); lastD.setDate(lastD.getDate()+1); allTrackBreakpoints.add(lastD.toISOString().split('T')[0]);
  const sortedBreakpoints = Array.from(allTrackBreakpoints).sort(), initialSeasons: Season[] = [];
  for (let i = 0; i < sortedBreakpoints.length - 1; i++) {
    const startDate = sortedBreakpoints[i], nextB = sortedBreakpoints[i+1], eObj = new Date(nextB); eObj.setDate(eObj.getDate()-1); const endDate = eObj.toISOString().split('T')[0];
    const chargeblocks: any = {}; let sMin: number | null = null, sMax: number | null = null, sRel: number | null = null, sLM: number | null = null, sAlloc = 0, sStop = false, sCta = false, sCtd = false;
    boardOccs.forEach(({ mp, occ }) => {
      const trackKey = `${mp}|${occ}`, ariByDate = ariByTrack[trackKey], seasonMemo = new Map<string, DerivationResult | null>(), dPrices: Record<number, number> = {};
      stayDurations.forEach(d => {
        let sum = 0, count = 0; const dObj = new Date(startDate), eObj_ = new Date(endDate);
        while (dObj <= eObj_) {
          const res = resolveDurationPrice(dObj.toISOString().split('T')[0], d, ariByDate, fallbackPolicy.stayDurationsFallback, 0, seasonMemo);
          if (res) { sum += res.price; count++; if (sMin === null && res.raw) { sMin = res.raw.minLOS; sMax = res.raw.maxLOS; sRel = res.raw.release || 0; sLM = res.raw.lastMinute || 0; sAlloc = res.raw.alloc; sStop = res.raw.stopSell; sCta = res.raw.cta || false; sCtd = res.raw.ctd || false; } }
          dObj.setDate(dObj.getDate() + 1);
        }
        if (count > 0) dPrices[d] = variationSeed === 0 ? sum / count : jitterPrice(sum / count);
      });
      if (Object.keys(dPrices).length > 0) chargeblocks[trackKey] = dPrices;
    });
    if (Object.keys(chargeblocks).length > 0) initialSeasons.push({ id: `S${initialSeasons.length + 1}`, startDate, endDate, chargeblocks, minLOS: sMin || 1, maxLOS: sMax || 28, release: sRel || 0, lastMinute: sLM || 0, alloc: sAlloc, stopSell: sStop, cta: sCta, ctd: sCtd });
  }
  const compress = (seasons: Season[], currentThreshold: number): Season[] => {
    const merged: Season[] = [];
    seasons.forEach(s => {
      if (merged.length === 0) { merged.push({ ...s }); return; }
      const prev = merged[merged.length-1], prevKeys = Object.keys(prev.chargeblocks), currKeys = Object.keys(s.chargeblocks);
      let same = prev.minLOS === s.minLOS && prev.maxLOS === s.maxLOS && prev.stopSell === s.stopSell && prev.cta === s.cta && prev.ctd === s.ctd && (prev.alloc > 0) === (s.alloc > 0) && prevKeys.length === currKeys.length;
      if (same) { for (const k of prevKeys) { if (!s.chargeblocks[k] || !arePriceVectorsCompatible(Object.values(prev.chargeblocks[k] as any), Object.values(s.chargeblocks[k] as any), currentThreshold)) { same = false; break; } } }
      if (same) { prev.endDate = s.endDate; prev.alloc = Math.max(prev.alloc, s.alloc); prevKeys.forEach(k => { const p1 = prev.chargeblocks[k], p2 = s.chargeblocks[k]; Object.keys(p1).forEach(d => { p1[Number(d)] = Math.round((p1[Number(d)] + p2[Number(d)]) / 2); }); }); }
      else merged.push({ ...s });
    });
    return merged;
  };
  const finalSeasons = compress(initialSeasons, baseThreshold);
  return { seasons: finalSeasons, rawCount: initialSeasons.length, mergedCount: finalSeasons.length, combinations: boardOccs.length * stayDurations.length * finalSeasons.length, seasonsGenerated: initialSeasons.length, seasonsFiltered: 0, ariRowsMatched: totalAriRowsMatched };
};

export function generateEDFModelForHotel(
  hotel: Hotel,
  product: ProductDefinition,
  importedARI: Record<string, any>,
  variationSeed: number = 0,
  strategy: PackagingStrategy = PackagingStrategy.BALANCED,
  fallbackPolicy: FallbackPolicy = DEFAULT_FALLBACK_POLICY
): { processedRooms: any[]; compliance: ConstraintCompliance; decisions: Record<string, ExecutionDecision>; actualProduct: any; complexity: 'SIMPLE' | 'MEDIUM' | 'COMPLEX'; diagnosticStats?: { totalRooms: number; roomsWithSeasons: number; roomsWithNoSeasons: number; ariRowsMatched: number; ariDiagnostics: ARIMatchDiagnostic[]; }; debugLogs: any[]; } | null {
  const hotelARI = importedARI[hotel.hgId]; if (!hotelARI) return null;
  const complexity = getHotelComplexity(hotel, importedARI), currentProduct = { stayDurations: [...product.stayDurations], occupancies: [...product.occupancies], mealPlans: [...product.mealPlans], markets: [...product.markets] };
  const roomEntries = Object.entries(hotelARI), ariDiagnostics: ARIMatchDiagnostic[] = [];
  const roomsDerivation = roomEntries.map(([roomCode, roomRawData]: [string, any]) => {
    const sourceOccs = new Set<string>(), sourceDurs = new Set<number>(); let sourceMin = '9999-12-31', sourceMax = '0000-01-01';
    Object.keys(roomRawData).forEach(mp => Object.values(roomRawData[mp]).forEach((days: any) => days.forEach((day: ARIData) => { sourceDurs.add(day.stayDuration || 1); if (day.date < sourceMin) sourceMin = day.date; if (day.date > sourceMax) sourceMax = day.date; })));
    Object.keys(roomRawData).forEach(mp => Object.keys(roomRawData[mp]).forEach(occ => sourceOccs.add(occ)));
    const diag: ARIMatchDiagnostic = {
      hotelId: hotel.hgId, roomCode,
      requested: { markets: currentProduct.markets, mealPlans: currentProduct.mealPlans, occupancies: currentProduct.occupancies.map(o => mapOccupancyToARICode(o)), stayDurations: currentProduct.stayDurations, dateWindow: { start: '2025-01-01', end: '2026-12-31' } },
      available: { markets: ['GLOBAL'], mealPlans: Object.keys(roomRawData).sort(), occupancies: Array.from(sourceOccs).sort(), stayDurations: Array.from(sourceDurs).sort((a,b)=>a-b), dateRange: { start: sourceMin, end: sourceMax } },
      strictMatch: { marketMatched: true, mealPlanMatched: currentProduct.mealPlans.some(mp => roomRawData[mp]), occupancyMatched: currentProduct.occupancies.some(o => sourceOccs.has(mapOccupancyToARICode(o))), durationMatched: currentProduct.stayDurations.every(d => sourceDurs.has(d)), dateOverlapMatched: sourceMin <= '2026-12-31' && sourceMax >= '2025-01-01' }
    };
    let filteredData: Record<string, Record<string, ARIData[]>> = {}, fbApplied = false, fbLevel: ARIMatchDiagnostic['fallback']['level'] = 'NONE';
    currentProduct.mealPlans.forEach(mp => { if (roomRawData[mp]) currentProduct.occupancies.forEach(occ => { const occCode = mapOccupancyToARICode(occ); if (roomRawData[mp][occCode]) { if (!filteredData[mp]) filteredData[mp] = {}; filteredData[mp][occCode] = roomRawData[mp][occCode]; } }); });
    if (Object.keys(filteredData).length === 0 && fallbackPolicy.allowOccupancyFallback) { for (const mp of [...currentProduct.mealPlans].sort()) { if (roomRawData[mp]) { const avail = Object.keys(roomRawData[mp]).sort(); if (avail.length > 0) { fbApplied = true; fbLevel = 'OCCUPANCY_FALLBACK'; filteredData[mp] = { [avail[0]]: roomRawData[mp][avail[0]] }; break; } } } }
    if (Object.keys(filteredData).length === 0 && fallbackPolicy.allowMealPlanFallback) { const mps = Object.keys(roomRawData).sort(); if (mps.length > 0) { const fbMP = mps[0], occs = Object.keys(roomRawData[fbMP]).sort(); if (occs.length > 0) { fbApplied = true; fbLevel = 'MEALPLAN_FALLBACK'; filteredData[fbMP] = { [occs[0]]: roomRawData[fbMP][occs[0]] }; } } }
    if (fbApplied) diag.fallback = { applied: true, level: fbLevel, allowedByPolicy: true, reason: 'Fallback applied' };
    if (Object.keys(filteredData).length === 0) { ariDiagnostics.push(diag); return { roomCode, seasons: [], roomChargeblocks: 0, ariRowsMatched: 0 }; }
    const derivation = deriveSeasonsForRoom(filteredData, currentProduct.stayDurations, hotel, 0.05, complexity, variationSeed, fallbackPolicy);
    diag.finalMatch = { market: 'GLOBAL', mealPlan: Object.keys(filteredData)[0], occupancy: Object.keys(filteredData[Object.keys(filteredData)[0]])[0], ariRowsMatched: derivation.ariRowsMatched || 0, seasonsGenerated: derivation.seasons.length, chargeblocksGenerated: 0 };
    ariDiagnostics.push(diag); return { roomCode, ...derivation, roomChargeblocks: 0 };
  });
  const { processedRooms, compliance, decisions } = enforcePeakworkConstraints(roomsDerivation, strategy, hotel);
  processedRooms.forEach(room => { const diag = ariDiagnostics.find(d => d.roomCode === room.roomCode); if (diag?.finalMatch) diag.finalMatch.chargeblocksGenerated = room.roomChargeblocks || 0; });
  return { processedRooms, compliance, decisions, actualProduct: currentProduct, complexity, diagnosticStats: { totalRooms: roomsDerivation.length, roomsWithSeasons: roomsDerivation.filter(r => r.seasons.length > 0).length, roomsWithNoSeasons: roomsDerivation.filter(r => r.seasons.length === 0).length, ariRowsMatched: roomsDerivation.reduce((acc, r) => acc + (r.ariRowsMatched || 0), 0), ariDiagnostics }, debugLogs: [] };
}

export function estimateSeasonsCount(
  roomARI: Record<string, Record<string, ARIData[]>>,
  stayDurations: number[],
  hotel: Hotel,
  complexity: 'SIMPLE' | 'MEDIUM' | 'COMPLEX'
): number {
  const result = deriveSeasonsForRoom(roomARI as any, stayDurations, hotel, 0.20, complexity, 0, DEFAULT_FALLBACK_POLICY);
  return result.mergedCount;
}
