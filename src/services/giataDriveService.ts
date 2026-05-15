import { GiataProperty, Hotel, NormalizationResult, NormalizationStatus } from '../types';

const API_BASE = 'https://giatadrive.com/api/v1';

export class GiataDriveService {
  private static get apiKey() {
    return import.meta.env.VITE_GIATA_DRIVE_API_KEY;
  }

  private static getHeaders() {
    if (!this.apiKey) {
      throw new Error('GIATA_API_KEY_MISSING');
    }
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
  }

  /**
   * Fetches properties from GIATA Drive.
   * Optional countryCode filter (e.g. 'DE').
   */
  static async fetchGiataProperties(countryCode?: string): Promise<GiataProperty[]> {
    try {
      const url = new URL(`${API_BASE}/properties`);
      if (countryCode) {
        url.searchParams.append('countryCode', countryCode);
      }

      const response = await fetch(url.toString(), {
        headers: this.getHeaders()
      });

      if (response.status === 401) throw new Error('GIATA_UNAUTHORIZED');
      if (!response.ok) throw new Error(`GIATA_ERROR_${response.status}`);

      const data = await response.json();
      const propertiesRaw = Array.isArray(data) ? data : (data.properties || []);

      return propertiesRaw.map(this.mapProperty);
    } catch (error) {
      console.error('GIATA fetchProperties error:', error);
      throw error;
    }
  }

  /**
   * Fetches detailed property info for a specific giataId.
   */
  static async fetchGiataProperty(giataId: number): Promise<GiataProperty> {
    try {
      const response = await fetch(`${API_BASE}/properties/${giataId}`, {
        headers: this.getHeaders()
      });

      if (response.status === 401) throw new Error('GIATA_UNAUTHORIZED');
      if (response.status === 404) throw new Error('GIATA_NOT_FOUND');
      if (!response.ok) throw new Error(`GIATA_ERROR_${response.status}`);

      const data = await response.json();
      return this.mapProperty(data);
    } catch (error) {
      console.error('GIATA fetchProperty error:', error);
      throw error;
    }
  }

  /**
   * Fetches paginated and filtered hotels from the local API.
   */
  static async fetchPaginatedHotels(filters: {
    page?: number;
    limit?: number;
    search?: string;
    destinations?: string[];
    cities?: string[];
    stars?: number[];
    normalization?: string;
  }): Promise<{
    items: Hotel[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const params = new URLSearchParams();
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.destinations && filters.destinations.length > 0) params.append('destinations', filters.destinations.join(','));
      if (filters.cities && filters.cities.length > 0) params.append('cities', filters.cities.join(','));
      if (filters.stars && filters.stars.length > 0) params.append('stars', filters.stars.join(','));
      if (filters.normalization) params.append('normalization', filters.normalization);

      const response = await fetch(`/api/giata-hotels?${params.toString()}`);
      if (!response.ok) throw new Error(`API_ERROR_${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('fetchPaginatedHotels error:', error);
      throw error;
    }
  }

  /**
   * Fetches location suggestions.
   */
  static async fetchLocations(query: string): Promise<any[]> {
    try {
      const response = await fetch(`/api/locations?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error(`API_ERROR_${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('fetchLocations error:', error);
      return [];
    }
  }

  /**
   * Builds an index for rapid normalization lookups.
   */
  static buildGiataIndex(properties: GiataProperty[]): Map<string, GiataProperty[]> {
    const index = new Map<string, GiataProperty[]>();
    for (const prop of properties) {
      // Index by city and country for group matching
      const key = `${prop.cityName?.toLowerCase() || ''}_${prop.countryCode?.toLowerCase() || ''}`;
      if (!index.has(key)) {
        index.set(key, []);
      }
      index.get(key)!.push(prop);
    }
    return index;
  }

  /**
   * Performs normalization for a list of hotels against the indexed GIATA properties.
   */
  static performNormalization(hotels: Hotel[], giataIndex: Map<string, GiataProperty[]>): Hotel[] {
    return hotels.map(hotel => {
      const key = `${hotel.city?.toLowerCase() || ''}_${hotel.country?.toLowerCase() || ''}`;
      const candidates = giataIndex.get(key) || [];

      if (candidates.length === 0) {
        return {
          ...hotel,
          normalization: {
            hgHotelId: hotel.hgId,
            status: NormalizationStatus.UNMAPPED,
            matchStatus: NormalizationStatus.UNMAPPED,
            matchConfidence: 0,
            matchMethod: 'GIATA_DRIVE_FUZZY',
            lastUpdated: new Date().toISOString()
          }
        };
      }

      // Find best matches based on name similarity
      const scored = candidates.map(c => ({
        property: c,
        score: this.calculateSimilarity(hotel.name, c.name)
      })).sort((a, b) => b.score - a.score);

      const bestMatch = scored[0];
      const secondBest = scored[1];

      let status: NormalizationStatus = NormalizationStatus.UNMAPPED;
      let giataId: number | undefined;
      let matchedProperty: GiataProperty | undefined;
      let confidence: number | undefined;

      // Thresholds for matching
      if (bestMatch && bestMatch.score > 0.85) {
        // High confidence match
        if (secondBest && (bestMatch.score - secondBest.score) < 0.1) {
          status = NormalizationStatus.AMBIGUOUS;
        } else {
          status = NormalizationStatus.MATCHED;
          giataId = bestMatch.property.giataId;
          matchedProperty = bestMatch.property;
          confidence = bestMatch.score;
        }
      } else if (bestMatch && bestMatch.score > 0.6) {
        status = NormalizationStatus.AMBIGUOUS;
      }

      const normalization: NormalizationResult = {
        hgHotelId: hotel.hgId,
        status,
        matchStatus: status,
        giataId,
        matchedProperty,
        matchConfidence: confidence || 0,
        confidence,
        matchMethod: status === NormalizationStatus.MATCHED ? 'GIATA_DRIVE_HIGH_CONFIDENCE' : 'GIATA_DRIVE_FUZZY',
        lastUpdated: new Date().toISOString(),
        candidates: status === NormalizationStatus.AMBIGUOUS ? scored.slice(0, 3).map(s => s.property) : undefined
      };

      return {
        ...hotel,
        normalization
      };
    });
  }

  private static calculateSimilarity(s1: string, s2: string): number {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    if (longer.length === 0) return 1.0;
    return (longer.length - this.editDistance(longer.toLowerCase(), shorter.toLowerCase())) / longer.length;
  }

  private static editDistance(s1: string, s2: string): number {
    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  }

  private static mapProperty(raw: any): GiataProperty {
    const names = raw.names || [];
    const defaultName = names.find((n: any) => n.isDefault)?.name || names[0]?.name || raw.name || 'Unknown Hotel';

    const ratings = raw.ratings || [];
    const defaultRatingData = ratings.find((r: any) => r.isDefault) || ratings[0];
    const ratingValue = defaultRatingData?.value || raw.rating || undefined;

    const geoCodes = raw.geoCodes || [];
    const primaryGeo = geoCodes[0] || raw.geo || {};

    return {
      giataId: raw.giataId,
      name: defaultName,
      cityName: raw.city?.name || raw.cityName,
      cityGiataId: raw.city?.giataId || raw.cityGiataId,
      destinationName: raw.destination?.name || raw.destinationName,
      destinationGiataId: raw.destination?.giataId || raw.destinationGiataId,
      countryCode: raw.country?.code || raw.countryCode,
      countryName: raw.country?.name || raw.countryName,
      rating: ratingValue,
      latitude: primaryGeo.latitude || raw.latitude,
      longitude: primaryGeo.longitude || raw.longitude,
      chainName: raw.chain?.name || raw.chainName,
      chainGiataId: raw.chain?.giataId || raw.chainGiataId,
      roomTypes: (raw.roomTypes || []).map((rt: any) => ({
        code: rt.code,
        name: rt.name,
        variantId: rt.variantId
      }))
    };
  }
}
