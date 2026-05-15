import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock Hotel Data Generation (50,000 hotels)
const CITIES = ['DXB', 'LHR', 'JFK', 'SIN', 'CDG', 'HND', 'AMS', 'FRA', 'IST', 'BCN', 'MAD', 'VCE', 'ROM', 'MIL', 'PAR', 'LON', 'NYC', 'LAX', 'SFO', 'MIA'];
const COUNTRIES = ['AE', 'UK', 'US', 'SG', 'FR', 'JP', 'NL', 'DE', 'TR', 'ES', 'ES', 'IT', 'IT', 'IT', 'FR', 'UK', 'US', 'US', 'US', 'US'];
const CHAINS = ['Marriott', 'Hilton', 'IHG', 'Accor', 'Hyatt', 'Radisson', 'Wyndham', 'Choice', 'Independent'];
const TIERS = ['Luxury', 'Upper Upscale', 'Upscale', 'Upper Midscale', 'Midscale', 'Economy'];

// Enhanced Location Dataset for Global Coverage (Countries, Cities, IATA codes)
const LOCATIONS = [
  // Middle East
  { type: "city", name: "Dubai", iata: "DXB", country: "United Arab Emirates", iso: "AE", region: "Middle East" },
  { type: "city", name: "Hurghada", iata: "HRG", country: "Egypt", iso: "EG", region: "Middle East" },
  { type: "city", name: "Cairo", iata: "CAI", country: "Egypt", iso: "EG", region: "Middle East" },
  { type: "city", name: "Sharm El Sheikh", iata: "SSH", country: "Egypt", iso: "EG", region: "Middle East" },
  { type: "city", name: "Doha", iata: "DOH", country: "Qatar", iso: "QA", region: "Middle East" },
  { type: "city", name: "Abu Dhabi", iata: "AUH", country: "United Arab Emirates", iso: "AE", region: "Middle East" },
  
  // Europe
  { type: "city", name: "London", iata: "LHR", country: "United Kingdom", iso: "GB", region: "Europe" },
  { type: "city", name: "Paris", iata: "CDG", country: "France", iso: "FR", region: "Europe" },
  { type: "city", name: "Amsterdam", iata: "AMS", country: "Netherlands", iso: "NL", region: "Europe" },
  { type: "city", name: "Frankfurt", iata: "FRA", country: "Germany", iso: "DE", region: "Europe" },
  { type: "city", name: "Rome", iata: "FCO", country: "Italy", iso: "IT", region: "Europe" },
  { type: "city", name: "Barcelona", iata: "BCN", country: "Spain", iso: "ES", region: "Europe" },
  { type: "city", name: "Berlin", iata: "BER", country: "Germany", iso: "DE", region: "Europe" },
  
  // Americas
  { type: "city", name: "New York", iata: "JFK", country: "United States", iso: "US", region: "Americas" },
  { type: "city", name: "San Francisco", iata: "SFO", country: "United States", iso: "US", region: "Americas" },
  { type: "city", name: "Los Angeles", iata: "LAX", country: "United States", iso: "US", region: "Americas" },
  { type: "city", name: "Miami", iata: "MIA", country: "United States", iso: "US", region: "Americas" },
  { type: "city", name: "Cancun", iata: "CUN", country: "Mexico", iso: "MX", region: "Americas" },

  // Asia/Oceania
  { type: "city", name: "Singapore", iata: "SIN", country: "Singapore", iso: "SG", region: "Asia" },
  { type: "city", name: "Tokyo", iata: "HND", country: "Japan", iso: "JP", region: "Asia" },
  { type: "city", name: "Bangkok", iata: "BKK", country: "Thailand", iso: "TH", region: "Asia" },
  { type: "city", name: "Hong Kong", iata: "HKG", country: "Hong Kong", iso: "HK", region: "Asia" },
  { type: "city", name: "Sydney", iata: "SYD", country: "Australia", iso: "AU", region: "Oceania" },

  // Countries (Global)
  { type: "country", name: "Egypt", iso: "EG", region: "Africa/Middle East" },
  { type: "country", name: "United Arab Emirates", iso: "AE", region: "Middle East" },
  { type: "country", name: "United Kingdom", iso: "GB", region: "Europe" },
  { type: "country", name: "United States", iso: "US", region: "Americas" },
  { type: "country", name: "France", iso: "FR", region: "Europe" },
  { type: "country", name: "Singapore", iso: "SG", region: "Asia" },
  { type: "country", name: "Japan", iso: "JP", region: "Asia" },
  { type: "country", name: "Germany", iso: "DE", region: "Europe" },
  { type: "country", name: "Spain", iso: "ES", region: "Europe" },
  { type: "country", name: "Italy", iso: "IT", region: "Europe" },
  { type: "country", name: "Thailand", iso: "TH", region: "Asia" },
  { type: "country", name: "Mexico", iso: "MX", region: "Americas" },
  { type: "country", name: "Australia", iso: "AU", region: "Oceania" },

  // Airports
  { type: "airport", name: "Dubai Intl", iata: "DXB", country: "UAE" },
  { type: "airport", name: "Heathrow", iata: "LHR", country: "UK" },
  { type: "airport", name: "Charles de Gaulle", iata: "CDG", country: "France" },
  { type: "airport", name: "John F. Kennedy", iata: "JFK", country: "US" },
  { type: "airport", name: "Changi", iata: "SIN", country: "Singapore" },
  { type: "airport", name: "Cairo Intl", iata: "CAI", country: "Egypt" }
];

const generateHotels = (count: number, source: 'GIATA' | 'HG_ONLY') => {
  const hotels = [];
  const locationPool = LOCATIONS.filter(l => l.type === 'city');
  
  for (let i = 1; i <= count; i++) {
    const loc = locationPool[Math.floor(Math.random() * locationPool.length)];
    const chainIndex = Math.floor(Math.random() * CHAINS.length);
    const tierIndex = Math.floor(Math.random() * TIERS.length);
    const stars = Math.floor(Math.random() * 3) + 3;
    
    if (source === 'GIATA') {
      const hasHG = Math.random() > 0.4;
      const id = `giata_${i}`;
      const giataId = `${100000 + i}`;
      
      hotels.push({
        id,
        hgId: hasHG ? `HG_MAPPED_${giataId}` : null,
        giataId,
        peakworkId: `${loc.iata}${String(i).padStart(4, '0')}`,
        name: `${CHAINS[chainIndex]} ${TIERS[tierIndex]} ${loc.name} ${i}`,
        starRating: stars,
        category: stars,
        city: loc.name,
        country: loc.iso,
        destination: loc.name,
        resolvedIata: loc.iata,
        roomCount: Math.floor(Math.random() * 400) + 50,
        status: Math.random() > 0.95 ? 'warning' : 'safe',
        normalization: {
          status: hasHG ? 'MATCHED' : 'UNMAPPED',
          matchStatus: hasHG ? 'MATCHED' : 'UNMAPPED',
          matchConfidence: hasHG ? 1.0 : 0,
          matchMethod: hasHG ? 'GIATA_VERIFIED' : 'NONE',
          lastUpdated: new Date().toISOString()
        }
      });
    } else {
      // HG ONLY - Real HG IDs, NO GIATA ID
      const hgId = `HG_REAL_${1000 + i}`;
      hotels.push({
        id: `hg_${i}`,
        hgId: hgId,
        giataId: null,
        peakworkId: `${loc.iata}${String(i).padStart(4, '0')}`,
        name: `HG Boutique ${loc.name} ${i}`,
        starRating: stars,
        category: stars,
        city: loc.name,
        country: loc.iso,
        destination: loc.name,
        resolvedIata: loc.iata,
        roomCount: Math.floor(Math.random() * 200) + 20,
        status: 'safe',
        normalization: {
          status: 'UNMAPPED',
          matchStatus: 'UNMAPPED',
          matchConfidence: 0,
          matchMethod: 'NONE',
          lastUpdated: new Date().toISOString()
        }
      });
    }
  }
  return hotels;
};

const GIATA_HOTELS = generateHotels(50000, 'GIATA');
const HG_ONLY_HOTELS = generateHotels(5000, 'HG_ONLY');
const ALL_HOTELS = [...GIATA_HOTELS, ...HG_ONLY_HOTELS];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Endpoints
  app.get("/api/locations", (req, res) => {
    const q = (req.query.q as string || '').toLowerCase();
    if (q.length < 2) return res.json([]);

    const results = LOCATIONS.filter(l => 
      l.name.toLowerCase().includes(q) || 
      (l.iata && l.iata.toLowerCase().includes(q)) ||
      (l.iso && l.iso.toLowerCase().includes(q)) ||
      (l.country && l.country.toLowerCase().includes(q))
    );

    res.json(results.slice(0, 10));
  });

  app.get("/api/giata-hotels", (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 150);
    const search = (req.query.search as string || '').toLowerCase();
    const destinations = req.query.destinations ? (req.query.destinations as string).split(',') : [];
    const cities = req.query.cities ? (req.query.cities as string).split(',') : [];
    const stars = req.query.stars ? (req.query.stars as string).split(',').map(Number) : [];
    const normalization = req.query.normalization as string || 'ALL';

    let filtered = ALL_HOTELS;

    // 1. Destination Filter (Global Scope - supports IATA, ISO, or Name)
    if (destinations.length > 0) {
      filtered = filtered.filter(h => 
        destinations.includes(h.resolvedIata) || 
        destinations.includes(h.country) || 
        destinations.includes(h.city)
      );
    }

    // 2. City Filter (Local refinement)
    if (cities.length > 0) {
      filtered = filtered.filter(h => cities.includes(h.city));
    }

    // 2. Mapping Filter
    if (normalization === 'MATCHED') {
      // GIATA hotels with HG mapping
      filtered = filtered.filter(h => h.giataId && h.hgId);
    } else if (normalization === 'UNMAPPED') {
      // GIATA without HG mapping OR HG-only hotels
      filtered = filtered.filter(h => !h.giataId || (h.giataId && !h.hgId));
    }

    // 3. Search Filter
    if (search.length >= 2) {
      filtered = filtered.filter(h => 
        h.name.toLowerCase().includes(search) || 
        h.city.toLowerCase().includes(search) || 
        (h.giataId && h.giataId.includes(search)) ||
        (h.hgId && h.hgId.toLowerCase().includes(search))
      );
    }

    // 4. Star Filter
    if (stars.length > 0) {
      filtered = filtered.filter(h => stars.includes(h.starRating));
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const items = filtered.slice(offset, offset + limit);

    res.json({
      items,
      total,
      page,
      limit,
      totalPages
    });
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", hotels: ALL_HOTELS.length });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
