import { ARIData, Hotel } from '../types';

export interface SimulationHotel extends Hotel {
  region: 'Europe' | 'Middle East' | 'Asia' | 'North America' | 'Africa';
  tier: 'Luxury' | 'Upper Upscale' | 'Midscale' | 'Economy';
  chain: string;
  brand: string;
  seasonProfile: 'HIGH' | 'LOW' | 'MIXED';
  basePrice: number;
}

export const SIMULATED_HOTELS: SimulationHotel[] = [
  // EUROPE (30)
  { id: 'sim_001', hgId: 'HG_SIM_001', giataId: 'UNMAPPED', peakworkId: 'PAR001', name: 'Four Seasons Hotel George V', city: 'Paris', country: 'FR', destination: 'PAR', starRating: 5, region: 'Europe', tier: 'Luxury', chain: 'Four Seasons', brand: 'Four Seasons', seasonProfile: 'HIGH', basePrice: 1200 },
  { id: 'sim_002', hgId: 'HG_SIM_002', giataId: 'UNMAPPED', peakworkId: 'LON001', name: 'The Savoy', city: 'London', country: 'GB', destination: 'LON', starRating: 5, region: 'Europe', tier: 'Luxury', chain: 'Fairmont', brand: 'Fairmont', seasonProfile: 'HIGH', basePrice: 850 },
  { id: 'sim_003', hgId: 'HG_SIM_003', giataId: 'UNMAPPED', peakworkId: 'ROM001', name: 'Hotel de Russie', city: 'Rome', country: 'IT', destination: 'ROM', starRating: 5, region: 'Europe', tier: 'Luxury', chain: 'Rocco Forte', brand: 'Rocco Forte', seasonProfile: 'HIGH', basePrice: 900 },
  { id: 'sim_004', hgId: 'HG_SIM_004', giataId: 'UNMAPPED', peakworkId: 'AMS001', name: 'W Amsterdam', city: 'Amsterdam', country: 'NL', destination: 'AMS', starRating: 5, region: 'Europe', tier: 'Upper Upscale', chain: 'Marriott', brand: 'W Hotels', seasonProfile: 'MIXED', basePrice: 450 },
  { id: 'sim_005', hgId: 'HG_SIM_005', giataId: 'UNMAPPED', peakworkId: 'BER001', name: 'Hotel Adlon Kempinski', city: 'Berlin', country: 'DE', destination: 'BER', starRating: 5, region: 'Europe', tier: 'Luxury', chain: 'Kempinski', brand: 'Kempinski', seasonProfile: 'MIXED', basePrice: 400 },
  { id: 'sim_006', hgId: 'HG_SIM_006', giataId: 'UNMAPPED', peakworkId: 'MAD001', name: 'The Westin Palace', city: 'Madrid', country: 'ES', destination: 'MAD', starRating: 5, region: 'Europe', tier: 'Upper Upscale', chain: 'Marriott', brand: 'Westin', seasonProfile: 'MIXED', basePrice: 350 },
  { id: 'sim_007', hgId: 'HG_SIM_007', giataId: 'UNMAPPED', peakworkId: 'BCN001', name: 'Majestic Hotel & Spa', city: 'Barcelona', country: 'ES', destination: 'BCN', starRating: 5, region: 'Europe', tier: 'Upper Upscale', chain: 'Independent', brand: 'Majestic', seasonProfile: 'HIGH', basePrice: 320 },
  { id: 'sim_008', hgId: 'HG_SIM_008', giataId: 'UNMAPPED', peakworkId: 'VIE001', name: 'Hotel Sacher Wien', city: 'Vienna', country: 'AT', destination: 'VIE', starRating: 5, region: 'Europe', tier: 'Luxury', chain: 'Independent', brand: 'Sacher', seasonProfile: 'HIGH', basePrice: 500 },
  { id: 'sim_009', hgId: 'HG_SIM_009', giataId: 'UNMAPPED', peakworkId: 'MUC001', name: 'Bayerischer Hof', city: 'Munich', country: 'DE', destination: 'MUC', starRating: 5, region: 'Europe', tier: 'Luxury', chain: 'Independent', brand: 'Bayerischer Hof', seasonProfile: 'MIXED', basePrice: 380 },
  { id: 'sim_010', hgId: 'HG_SIM_010', giataId: 'UNMAPPED', peakworkId: 'PRA001', name: 'Augustine, a Luxury Collection Hotel', city: 'Prague', country: 'CZ', destination: 'PRG', starRating: 5, region: 'Europe', tier: 'Luxury', chain: 'Marriott', brand: 'Luxury Collection', seasonProfile: 'MIXED', basePrice: 300 },
  { id: 'sim_011', hgId: 'HG_SIM_011', giataId: 'UNMAPPED', peakworkId: 'ATH001', name: 'Hotel Grande Bretagne', city: 'Athens', country: 'GR', destination: 'ATH', starRating: 5, region: 'Europe', tier: 'Luxury', chain: 'Marriott', brand: 'Luxury Collection', seasonProfile: 'HIGH', basePrice: 450 },
  { id: 'sim_012', hgId: 'HG_SIM_012', giataId: 'UNMAPPED', peakworkId: 'CPH001', name: 'Hotel D\'Angleterre', city: 'Copenhagen', country: 'DK', destination: 'CPH', starRating: 5, region: 'Europe', tier: 'Luxury', chain: 'Independent', brand: 'D\'Angleterre', seasonProfile: 'HIGH', basePrice: 600 },
  { id: 'sim_013', hgId: 'HG_SIM_013', giataId: 'UNMAPPED', peakworkId: 'OSL001', name: 'Grand Hotel Oslo', city: 'Oslo', country: 'NO', destination: 'OSL', starRating: 5, region: 'Europe', tier: 'Upper Upscale', chain: 'Scandic', brand: 'Grand Hotel', seasonProfile: 'MIXED', basePrice: 280 },
  { id: 'sim_014', hgId: 'HG_SIM_014', giataId: 'UNMAPPED', peakworkId: 'STO001', name: 'Grand Hôtel Stockholm', city: 'Stockholm', country: 'SE', destination: 'STO', starRating: 5, region: 'Europe', tier: 'Luxury', chain: 'Independent', brand: 'Grand Hôtel', seasonProfile: 'HIGH', basePrice: 420 },
  { id: 'sim_015', hgId: 'HG_SIM_015', giataId: 'UNMAPPED', peakworkId: 'ZRH001', name: 'Baur au Lac', city: 'Zurich', country: 'CH', destination: 'ZRH', starRating: 5, region: 'Europe', tier: 'Luxury', chain: 'Independent', brand: 'Baur au Lac', seasonProfile: 'HIGH', basePrice: 750 },
  { id: 'sim_016', hgId: 'HG_SIM_016', giataId: 'UNMAPPED', peakworkId: 'MIL001', name: 'Park Hyatt Milan', city: 'Milan', country: 'IT', destination: 'MIL', starRating: 5, region: 'Europe', tier: 'Luxury', chain: 'Hyatt', brand: 'Park Hyatt', seasonProfile: 'HIGH', basePrice: 800 },
  { id: 'sim_017', hgId: 'HG_SIM_017', giataId: 'UNMAPPED', peakworkId: 'LIS001', name: 'Four Seasons Hotel Ritz Lisbon', city: 'Lisbon', country: 'PT', destination: 'LIS', starRating: 5, region: 'Europe', tier: 'Luxury', chain: 'Four Seasons', brand: 'Four Seasons', seasonProfile: 'MIXED', basePrice: 550 },
  { id: 'sim_018', hgId: 'HG_SIM_018', giataId: 'UNMAPPED', peakworkId: 'WAR001', name: 'Hotel Bristol', city: 'Warsaw', country: 'PL', destination: 'WAW', starRating: 5, region: 'Europe', tier: 'Upper Upscale', chain: 'Marriott', brand: 'Luxury Collection', seasonProfile: 'LOW', basePrice: 180 },
  { id: 'sim_019', hgId: 'HG_SIM_019', giataId: 'UNMAPPED', peakworkId: 'BUD001', name: 'Four Seasons Hotel Gresham Palace', city: 'Budapest', country: 'HU', destination: 'BUD', starRating: 5, region: 'Europe', tier: 'Luxury', chain: 'Four Seasons', brand: 'Four Seasons', seasonProfile: 'MIXED', basePrice: 480 },
  { id: 'sim_020', hgId: 'HG_SIM_020', giataId: 'UNMAPPED', peakworkId: 'DUB001', name: 'The Shelbourne', city: 'Dublin', country: 'IE', destination: 'DUB', starRating: 5, region: 'Europe', tier: 'Upper Upscale', chain: 'Marriott', brand: 'Autograph Collection', seasonProfile: 'HIGH', basePrice: 350 },
  { id: 'sim_021', hgId: 'HG_SIM_021', giataId: 'UNMAPPED', peakworkId: 'LON002', name: 'Hilton London Metropole', city: 'London', country: 'GB', destination: 'LON', starRating: 4, region: 'Europe', tier: 'Midscale', chain: 'Hilton', brand: 'Hilton', seasonProfile: 'HIGH', basePrice: 220 },
  { id: 'sim_022', hgId: 'HG_SIM_022', giataId: 'UNMAPPED', peakworkId: 'PAR002', name: 'Novotel Paris Centre Tour Eiffel', city: 'Paris', country: 'FR', destination: 'PAR', starRating: 4, region: 'Europe', tier: 'Midscale', chain: 'Accor', brand: 'Novotel', seasonProfile: 'HIGH', basePrice: 200 },
  { id: 'sim_023', hgId: 'HG_SIM_023', giataId: 'UNMAPPED', peakworkId: 'BER002', name: 'Holiday Inn Berlin City Center', city: 'Berlin', country: 'DE', destination: 'BER', starRating: 4, region: 'Europe', tier: 'Midscale', chain: 'IHG', brand: 'Holiday Inn', seasonProfile: 'MIXED', basePrice: 130 },
  { id: 'sim_024', hgId: 'HG_SIM_024', giataId: 'UNMAPPED', peakworkId: 'ROM002', name: 'Ibis Styles Roma Eur', city: 'Rome', country: 'IT', destination: 'ROM', starRating: 3, region: 'Europe', tier: 'Economy', chain: 'Accor', brand: 'Ibis Styles', seasonProfile: 'HIGH', basePrice: 95 },
  { id: 'sim_025', hgId: 'HG_SIM_025', giataId: 'UNMAPPED', peakworkId: 'MAD002', name: 'Premier Inn Madrid Center', city: 'Madrid', country: 'ES', destination: 'MAD', starRating: 3, region: 'Europe', tier: 'Economy', chain: 'Whitbread', brand: 'Premier Inn', seasonProfile: 'MIXED', basePrice: 85 },
  { id: 'sim_026', hgId: 'HG_SIM_026', giataId: 'UNMAPPED', peakworkId: 'EDI001', name: 'The Balmoral', city: 'Edinburgh', country: 'GB', destination: 'EDI', starRating: 5, region: 'Europe', tier: 'Luxury', chain: 'Rocco Forte', brand: 'Rocco Forte', seasonProfile: 'HIGH', basePrice: 450 },
  { id: 'sim_027', hgId: 'HG_SIM_027', giataId: 'UNMAPPED', peakworkId: 'NIC001', name: 'Hotel Negresco', city: 'Nice', country: 'FR', destination: 'NCE', starRating: 5, region: 'Europe', tier: 'Luxury', chain: 'Independent', brand: 'Negresco', seasonProfile: 'HIGH', basePrice: 550 },
  { id: 'sim_028', hgId: 'HG_SIM_028', giataId: 'UNMAPPED', peakworkId: 'VCE001', name: 'Hotel Danieli', city: 'Venice', country: 'IT', destination: 'VCE', starRating: 5, region: 'Europe', tier: 'Luxury', chain: 'Marriott', brand: 'Luxury Collection', seasonProfile: 'HIGH', basePrice: 950 },
  { id: 'sim_029', hgId: 'HG_SIM_029', giataId: 'UNMAPPED', peakworkId: 'PRG002', name: 'Ibis Praha Old Town', city: 'Prague', country: 'CZ', destination: 'PRG', starRating: 3, region: 'Europe', tier: 'Economy', chain: 'Accor', brand: 'Ibis', seasonProfile: 'MIXED', basePrice: 65 },
  { id: 'sim_030', hgId: 'HG_SIM_030', giataId: 'UNMAPPED', peakworkId: 'FRA001', name: 'Marriott Frankfurt Hotel', city: 'Frankfurt', country: 'DE', destination: 'FRA', starRating: 4, region: 'Europe', tier: 'Upper Upscale', chain: 'Marriott', brand: 'Marriott', seasonProfile: 'LOW', basePrice: 190 },
 
   // MIDDLE EAST (20)
   { id: 'sim_031', hgId: 'HG_SIM_031', giataId: 'UNMAPPED', peakworkId: 'DXB001', name: 'Burj Al Arab Jumeirah', city: 'Dubai', country: 'AE', destination: 'DXB', starRating: 5, region: 'Middle East', tier: 'Luxury', chain: 'Jumeirah', brand: 'Jumeirah', seasonProfile: 'HIGH', basePrice: 1800 },
   { id: 'sim_032', hgId: 'HG_SIM_032', giataId: 'UNMAPPED', peakworkId: 'DXB002', name: 'Atlantis The Royal', city: 'Dubai', country: 'AE', destination: 'DXB', starRating: 5, region: 'Middle East', tier: 'Luxury', chain: 'Kerzner', brand: 'Atlantis', seasonProfile: 'HIGH', basePrice: 1400 },
   { id: 'sim_033', hgId: 'HG_SIM_033', giataId: 'UNMAPPED', peakworkId: 'AUH001', name: 'Emirates Palace Mandarin Oriental', city: 'Abu Dhabi', country: 'AE', destination: 'AUH', starRating: 5, region: 'Middle East', tier: 'Luxury', chain: 'Mandarin Oriental', brand: 'Mandarin Oriental', seasonProfile: 'HIGH', basePrice: 850 },
   { id: 'sim_034', hgId: 'HG_SIM_034', giataId: 'UNMAPPED', peakworkId: 'DOH001', name: 'The Ritz-Carlton, Doha', city: 'Doha', country: 'QA', destination: 'DOH', starRating: 5, region: 'Middle East', tier: 'Luxury', chain: 'Marriott', brand: 'Ritz-Carlton', seasonProfile: 'HIGH', basePrice: 350 },
   { id: 'sim_035', hgId: 'HG_SIM_035', giataId: 'UNMAPPED', peakworkId: 'RUH001', name: 'Four Seasons Resort Riyadh', city: 'Riyadh', country: 'SA', destination: 'RUH', starRating: 5, region: 'Middle East', tier: 'Luxury', chain: 'Four Seasons', brand: 'Four Seasons', seasonProfile: 'HIGH', basePrice: 700 },
   { id: 'sim_036', hgId: 'HG_SIM_036', giataId: 'UNMAPPED', peakworkId: 'JED001', name: 'Rosewood Jeddah', city: 'Jeddah', country: 'SA', destination: 'JED', starRating: 5, region: 'Middle East', tier: 'Luxury', chain: 'Rosewood', brand: 'Rosewood', seasonProfile: 'HIGH', basePrice: 400 },
   { id: 'sim_037', hgId: 'HG_SIM_037', giataId: 'UNMAPPED', peakworkId: 'MCT001', name: 'Al Bustan Palace, a Ritz-Carlton Hotel', city: 'Muscat', country: 'OM', destination: 'MCT', starRating: 5, region: 'Middle East', tier: 'Luxury', chain: 'Marriott', brand: 'Ritz-Carlton', seasonProfile: 'HIGH', basePrice: 420 },
   { id: 'sim_038', hgId: 'HG_SIM_038', giataId: 'UNMAPPED', peakworkId: 'BAH001', name: 'Four Seasons Hotel Bahrain Bay', city: 'Manama', country: 'BH', destination: 'BAH', starRating: 5, region: 'Middle East', tier: 'Luxury', chain: 'Four Seasons', brand: 'Four Seasons', seasonProfile: 'HIGH', basePrice: 480 },
   { id: 'sim_039', hgId: 'HG_SIM_039', giataId: 'UNMAPPED', peakworkId: 'AMM001', name: 'The St. Regis Amman', city: 'Amman', country: 'JO', destination: 'AMM', starRating: 5, region: 'Middle East', tier: 'Luxury', chain: 'Marriott', brand: 'St. Regis', seasonProfile: 'MIXED', basePrice: 280 },
   { id: 'sim_040', hgId: 'HG_SIM_040', giataId: 'UNMAPPED', peakworkId: 'KWI001', name: 'Four Seasons Hotel Kuwait at Burj Alshaya', city: 'Kuwait City', country: 'KW', destination: 'KWI', starRating: 5, region: 'Middle East', tier: 'Luxury', chain: 'Four Seasons', brand: 'Four Seasons', seasonProfile: 'MIXED', basePrice: 450 },
   { id: 'sim_041', hgId: 'HG_SIM_041', giataId: 'UNMAPPED', peakworkId: 'DXB003', name: 'JW Marriott Marquis Hotel Dubai', city: 'Dubai', country: 'AE', destination: 'DXB', starRating: 5, region: 'Middle East', tier: 'Upper Upscale', chain: 'Marriott', brand: 'JW Marriott', seasonProfile: 'HIGH', basePrice: 220 },
   { id: 'sim_042', hgId: 'HG_SIM_042', giataId: 'UNMAPPED', peakworkId: 'DXB004', name: 'Hilton Dubai Jumeirah', city: 'Dubai', country: 'AE', destination: 'DXB', starRating: 5, region: 'Middle East', tier: 'Upper Upscale', chain: 'Hilton', brand: 'Hilton', seasonProfile: 'HIGH', basePrice: 200 },
   { id: 'sim_043', hgId: 'HG_SIM_043', giataId: 'UNMAPPED', peakworkId: 'AUH002', name: 'W Abu Dhabi - Yas Island', city: 'Abu Dhabi', country: 'AE', destination: 'AUH', starRating: 5, region: 'Middle East', tier: 'Upper Upscale', chain: 'Marriott', brand: 'W Hotels', seasonProfile: 'HIGH', basePrice: 180 },
   { id: 'sim_044', hgId: 'HG_SIM_044', giataId: 'UNMAPPED', peakworkId: 'RUH002', name: 'Novotel Riyadh Al Anoud', city: 'Riyadh', country: 'SA', destination: 'RUH', starRating: 4, region: 'Middle East', tier: 'Midscale', chain: 'Accor', brand: 'Novotel', seasonProfile: 'HIGH', basePrice: 140 },
   { id: 'sim_045', hgId: 'HG_SIM_045', giataId: 'UNMAPPED', peakworkId: 'DXB005', name: 'Holiday Inn Express Dubai Airport', city: 'Dubai', country: 'AE', destination: 'DXB', starRating: 3, region: 'Middle East', tier: 'Economy', chain: 'IHG', brand: 'Holiday Inn Express', seasonProfile: 'HIGH', basePrice: 75 },
   { id: 'sim_046', hgId: 'HG_SIM_046', giataId: 'UNMAPPED', peakworkId: 'DOH002', name: 'Ibis Doha', city: 'Doha', country: 'QA', destination: 'DOH', starRating: 3, region: 'Middle East', tier: 'Economy', chain: 'Accor', brand: 'Ibis', seasonProfile: 'HIGH', basePrice: 70 },
   { id: 'sim_047', hgId: 'HG_SIM_047', giataId: 'UNMAPPED', peakworkId: 'MCT002', name: 'Radisson Blu Hotel, Muscat', city: 'Muscat', country: 'OM', destination: 'MCT', starRating: 4, region: 'Middle East', tier: 'Midscale', chain: 'Radisson', brand: 'Radisson Blu', seasonProfile: 'HIGH', basePrice: 95 },
   { id: 'sim_048', hgId: 'HG_SIM_048', giataId: 'UNMAPPED', peakworkId: 'SHJ001', name: 'The Chedi Al Bait, Sharjah', city: 'Sharjah', country: 'AE', destination: 'SHJ', starRating: 5, region: 'Middle East', tier: 'Luxury', chain: 'GHM', brand: 'Chedi', seasonProfile: 'HIGH', basePrice: 320 },
   { id: 'sim_049', hgId: 'HG_SIM_049', giataId: 'UNMAPPED', peakworkId: 'CAI001', name: 'The Ritz-Carlton, Cairo', city: 'Cairo', country: 'EG', destination: 'CAI', starRating: 5, region: 'Middle East', tier: 'Luxury', chain: 'Marriott', brand: 'Ritz-Carlton', seasonProfile: 'MIXED', basePrice: 300 },
   { id: 'sim_050', hgId: 'HG_SIM_050', giataId: 'UNMAPPED', peakworkId: 'TLV001', name: 'The Norman Tel Aviv', city: 'Tel Aviv', country: 'IL', destination: 'TLV', starRating: 5, region: 'Middle East', tier: 'Luxury', chain: 'Independent', brand: 'The Norman', seasonProfile: 'HIGH', basePrice: 650 },


  // ASIA (20)
  { id: 'sim_051', hgId: 'HG_SIM_051', giataId: 'UNMAPPED', peakworkId: 'SIN001', name: 'Raffles Singapore', city: 'Singapore', country: 'SG', destination: 'SIN', starRating: 5, region: 'Asia', tier: 'Luxury', chain: 'Accor', brand: 'Raffles', seasonProfile: 'HIGH', basePrice: 900 },
  { id: 'sim_052', hgId: 'HG_SIM_052', giataId: 'UNMAPPED', peakworkId: 'SIN002', name: 'Marina Bay Sands', city: 'Singapore', country: 'SG', destination: 'SIN', starRating: 5, region: 'Asia', tier: 'Luxury', chain: 'Sands', brand: 'Marina Bay Sands', seasonProfile: 'HIGH', basePrice: 750 },
  { id: 'sim_053', hgId: 'HG_SIM_053', giataId: 'UNMAPPED', peakworkId: 'TYO001', name: 'Aman Tokyo', city: 'Tokyo', country: 'JP', destination: 'TYO', starRating: 5, region: 'Asia', tier: 'Luxury', chain: 'Aman', brand: 'Aman', seasonProfile: 'HIGH', basePrice: 1500 },
  { id: 'sim_054', hgId: 'HG_SIM_054', giataId: 'UNMAPPED', peakworkId: 'TYO002', name: 'Park Hyatt Tokyo', city: 'Tokyo', country: 'JP', destination: 'TYO', starRating: 5, region: 'Asia', tier: 'Luxury', chain: 'Hyatt', brand: 'Park Hyatt', seasonProfile: 'HIGH', basePrice: 1100 },
  { id: 'sim_055', hgId: 'HG_SIM_055', giataId: 'UNMAPPED', peakworkId: 'HKG001', name: 'The Peninsula Hong Kong', city: 'Hong Kong', country: 'HK', destination: 'HKG', starRating: 5, region: 'Asia', tier: 'Luxury', chain: 'Peninsula', brand: 'Peninsula', seasonProfile: 'HIGH', basePrice: 850 },
  { id: 'sim_056', hgId: 'HG_SIM_056', giataId: 'UNMAPPED', peakworkId: 'BKK001', name: 'Mandarin Oriental, Bangkok', city: 'Bangkok', country: 'TH', destination: 'BKK', starRating: 5, region: 'Asia', tier: 'Luxury', chain: 'Mandarin Oriental', brand: 'Mandarin Oriental', seasonProfile: 'HIGH', basePrice: 550 },
  { id: 'sim_057', hgId: 'HG_SIM_057', giataId: 'UNMAPPED', peakworkId: 'DPS001', name: 'Four Seasons Resort Bali at Sayan', city: 'Bali', country: 'ID', destination: 'DPS', starRating: 5, region: 'Asia', tier: 'Luxury', chain: 'Four Seasons', brand: 'Four Seasons', seasonProfile: 'HIGH', basePrice: 950 },
  { id: 'sim_058', hgId: 'HG_SIM_058', giataId: 'UNMAPPED', peakworkId: 'SEL001', name: 'The Shilla Seoul', city: 'Seoul', country: 'KR', destination: 'SEL', starRating: 5, region: 'Asia', tier: 'Luxury', chain: 'Samsung', brand: 'The Shilla', seasonProfile: 'HIGH', basePrice: 420 },
  { id: 'sim_059', hgId: 'HG_SIM_059', giataId: 'UNMAPPED', peakworkId: 'PEK001', name: 'The Peninsula Beijing', city: 'Beijing', country: 'CN', destination: 'PEK', starRating: 5, region: 'Asia', tier: 'Luxury', chain: 'Peninsula', brand: 'Peninsula', seasonProfile: 'MIXED', basePrice: 380 },
  { id: 'sim_060', hgId: 'HG_SIM_060', giataId: 'UNMAPPED', peakworkId: 'SHA001', name: 'The Ritz-Carlton Shanghai, Pudong', city: 'Shanghai', country: 'CN', destination: 'SHA', starRating: 5, region: 'Asia', tier: 'Luxury', chain: 'Marriott', brand: 'Ritz-Carlton', seasonProfile: 'HIGH', basePrice: 450 },
  { id: 'sim_061', hgId: 'HG_SIM_061', giataId: 'UNMAPPED', peakworkId: 'BKK002', name: 'W Bangkok', city: 'Bangkok', country: 'TH', destination: 'BKK', starRating: 5, region: 'Asia', tier: 'Upper Upscale', chain: 'Marriott', brand: 'W Hotels', seasonProfile: 'HIGH', basePrice: 180 },
  { id: 'sim_062', hgId: 'HG_SIM_062', giataId: 'UNMAPPED', peakworkId: 'HKT001', name: 'Amanpuri', city: 'Phuket', country: 'TH', destination: 'HKT', starRating: 5, region: 'Asia', tier: 'Luxury', chain: 'Aman', brand: 'Aman', seasonProfile: 'HIGH', basePrice: 1200 },
  { id: 'sim_063', hgId: 'HG_SIM_063', giataId: 'UNMAPPED', peakworkId: 'DEL001', name: 'The Oberoi, New Delhi', city: 'New Delhi', country: 'IN', destination: 'DEL', starRating: 5, region: 'Asia', tier: 'Luxury', chain: 'Oberoi', brand: 'Oberoi', seasonProfile: 'HIGH', basePrice: 320 },
  { id: 'sim_064', hgId: 'HG_SIM_064', giataId: 'UNMAPPED', peakworkId: 'BOM001', name: 'The Taj Mahal Palace', city: 'Mumbai', country: 'IN', destination: 'BOM', starRating: 5, region: 'Asia', tier: 'Luxury', chain: 'Taj', brand: 'Taj', seasonProfile: 'HIGH', basePrice: 400 },
  { id: 'sim_065', hgId: 'HG_SIM_065', giataId: 'UNMAPPED', peakworkId: 'HAN001', name: 'Sofitel Legend Metropole Hanoi', city: 'Hanoi', country: 'VN', destination: 'HAN', starRating: 5, region: 'Asia', tier: 'Luxury', chain: 'Accor', brand: 'Sofitel', seasonProfile: 'MIXED', basePrice: 280 },
  { id: 'sim_066', hgId: 'HG_SIM_066', giataId: 'UNMAPPED', peakworkId: 'KUL001', name: 'Mandarin Oriental, Kuala Lumpur', city: 'Kuala Lumpur', country: 'MY', destination: 'KUL', starRating: 5, region: 'Asia', tier: 'Upper Upscale', chain: 'Mandarin Oriental', brand: 'Mandarin Oriental', seasonProfile: 'MIXED', basePrice: 200 },
  { id: 'sim_067', hgId: 'HG_SIM_067', giataId: 'UNMAPPED', peakworkId: 'MNL001', name: 'The Peninsula Manila', city: 'Manila', country: 'PH', destination: 'MNL', starRating: 5, region: 'Asia', tier: 'Upper Upscale', chain: 'Peninsula', brand: 'Peninsula', seasonProfile: 'MIXED', basePrice: 160 },
  { id: 'sim_068', hgId: 'HG_SIM_068', giataId: 'UNMAPPED', peakworkId: 'KTM001', name: 'Dwarika\'s Hotel', city: 'Kathmandu', country: 'NP', destination: 'KTM', starRating: 5, region: 'Asia', tier: 'Luxury', chain: 'Independent', brand: 'Dwarika\'s', seasonProfile: 'MIXED', basePrice: 250 },
  { id: 'sim_069', hgId: 'HG_SIM_069', giataId: 'UNMAPPED', peakworkId: 'SGN001', name: 'Caravelle Saigon', city: 'Ho Chi Minh City', country: 'VN', destination: 'SGN', starRating: 5, region: 'Asia', tier: 'Midscale', chain: 'Independent', brand: 'Caravelle', seasonProfile: 'MIXED', basePrice: 140 },
  { id: 'sim_070', hgId: 'HG_SIM_070', giataId: 'UNMAPPED', peakworkId: 'REP001', name: 'Raffles Grand Hotel d\'Angkor', city: 'Siem Reap', country: 'KH', destination: 'REP', starRating: 5, region: 'Asia', tier: 'Luxury', chain: 'Accor', brand: 'Raffles', seasonProfile: 'HIGH', basePrice: 350 },

  // NORTH AMERICA (20)
  { id: 'sim_071', hgId: 'HG_SIM_071', giataId: 'UNMAPPED', peakworkId: 'NYC001', name: 'The Plaza', city: 'New York', country: 'US', destination: 'NYC', starRating: 5, region: 'North America', tier: 'Luxury', chain: 'Fairmont', brand: 'Plaza', seasonProfile: 'HIGH', basePrice: 1100 },
  { id: 'sim_072', hgId: 'HG_SIM_072', giataId: 'UNMAPPED', peakworkId: 'NYC002', name: 'The St. Regis New York', city: 'New York', country: 'US', destination: 'NYC', starRating: 5, region: 'North America', tier: 'Luxury', chain: 'Marriott', brand: 'St. Regis', seasonProfile: 'HIGH', basePrice: 1300 },
  { id: 'sim_073', hgId: 'HG_SIM_073', giataId: 'UNMAPPED', peakworkId: 'LAX001', name: 'Beverly Hills Hotel', city: 'Los Angeles', country: 'US', destination: 'LAX', starRating: 5, region: 'North America', tier: 'Luxury', chain: 'Dorchester', brand: 'Beverly Hills', seasonProfile: 'HIGH', basePrice: 1400 },
  { id: 'sim_074', hgId: 'HG_SIM_074', giataId: 'UNMAPPED', peakworkId: 'SFO001', name: 'Fairmont San Francisco', city: 'San Francisco', country: 'US', destination: 'SFO', starRating: 5, region: 'North America', tier: 'Upper Upscale', chain: 'Fairmont', brand: 'Fairmont', seasonProfile: 'HIGH', basePrice: 550 },
  { id: 'sim_075', hgId: 'HG_SIM_075', giataId: 'UNMAPPED', peakworkId: 'CHI001', name: 'The Peninsula Chicago', city: 'Chicago', country: 'US', destination: 'CHI', starRating: 5, region: 'North America', tier: 'Luxury', chain: 'Peninsula', brand: 'Peninsula', seasonProfile: 'HIGH', basePrice: 650 },
  { id: 'sim_076', hgId: 'HG_SIM_076', giataId: 'UNMAPPED', peakworkId: 'LAS001', name: 'Bellagio Las Vegas', city: 'Las Vegas', country: 'US', destination: 'LAS', starRating: 5, region: 'North America', tier: 'Upper Upscale', chain: 'MGM', brand: 'Bellagio', seasonProfile: 'MIXED', basePrice: 350 },
  { id: 'sim_077', hgId: 'HG_SIM_077', giataId: 'UNMAPPED', peakworkId: 'LAS002', name: 'Caesars Palace', city: 'Las Vegas', country: 'US', destination: 'LAS', starRating: 4, region: 'North America', tier: 'Midscale', chain: 'Caesars', brand: 'Caesars Palace', seasonProfile: 'MIXED', basePrice: 180 },
  { id: 'sim_078', hgId: 'HG_SIM_078', giataId: 'UNMAPPED', peakworkId: 'MCO001', name: 'Disney\'s Grand Floridian Resort', city: 'Orlando', country: 'US', destination: 'MCO', starRating: 5, region: 'North America', tier: 'Upper Upscale', chain: 'Disney', brand: 'Grand Floridian', seasonProfile: 'HIGH', basePrice: 750 },
  { id: 'sim_079', hgId: 'HG_SIM_079', giataId: 'UNMAPPED', peakworkId: 'MIA001', name: 'Fontainebleau Miami Beach', city: 'Miami', country: 'US', destination: 'MIA', starRating: 4, region: 'North America', tier: 'Upper Upscale', chain: 'Independent', brand: 'Fontainebleau', seasonProfile: 'HIGH', basePrice: 450 },
  { id: 'sim_080', hgId: 'HG_SIM_080', giataId: 'UNMAPPED', peakworkId: 'MEX001', name: 'Four Seasons Hotel Mexico City', city: 'Mexico City', country: 'MX', destination: 'MEX', starRating: 5, region: 'North America', tier: 'Luxury', chain: 'Four Seasons', brand: 'Four Seasons', seasonProfile: 'MIXED', basePrice: 480 },
  { id: 'sim_081', hgId: 'HG_SIM_081', giataId: 'UNMAPPED', peakworkId: 'MEX002', name: 'JW Marriott Hotel Mexico City', city: 'Mexico City', country: 'MX', destination: 'MEX', starRating: 5, region: 'North America', tier: 'Upper Upscale', chain: 'Marriott', brand: 'JW Marriott', seasonProfile: 'MIXED', basePrice: 320 },
  { id: 'sim_082', hgId: 'HG_SIM_082', giataId: 'UNMAPPED', peakworkId: 'CUN001', name: 'Grand Fiesta Americana Coral Beach', city: 'Cancun', country: 'MX', destination: 'CUN', starRating: 5, region: 'North America', tier: 'Upper Upscale', chain: 'Posadas', brand: 'Fiesta Americana', seasonProfile: 'HIGH', basePrice: 400 },
  { id: 'sim_083', hgId: 'HG_SIM_083', giataId: 'UNMAPPED', peakworkId: 'YYZ001', name: 'Fairmont Royal York', city: 'Toronto', country: 'CA', destination: 'YYZ', starRating: 4, region: 'North America', tier: 'Upper Upscale', chain: 'Fairmont', brand: 'Fairmont', seasonProfile: 'MIXED', basePrice: 280 },
  { id: 'sim_084', hgId: 'HG_SIM_084', giataId: 'UNMAPPED', peakworkId: 'YUL001', name: 'The Ritz-Carlton, Montreal', city: 'Montreal', country: 'CA', destination: 'YUL', starRating: 5, region: 'North America', tier: 'Luxury', chain: 'Marriott', brand: 'Ritz-Carlton', seasonProfile: 'MIXED', basePrice: 450 },
  { id: 'sim_085', hgId: 'HG_SIM_085', giataId: 'UNMAPPED', peakworkId: 'YVR001', name: 'Fairmont Hotel Vancouver', city: 'Vancouver', country: 'CA', destination: 'YVR', starRating: 4, region: 'North America', tier: 'Upper Upscale', chain: 'Fairmont', brand: 'Fairmont', seasonProfile: 'MIXED', basePrice: 260 },
  { id: 'sim_086', hgId: 'HG_SIM_086', giataId: 'UNMAPPED', peakworkId: 'NYC003', name: 'Hilton New York Midtown', city: 'New York', country: 'US', destination: 'NYC', starRating: 4, region: 'North America', tier: 'Midscale', chain: 'Hilton', brand: 'Hilton', seasonProfile: 'HIGH', basePrice: 300 },
  { id: 'sim_087', hgId: 'HG_SIM_087', giataId: 'UNMAPPED', peakworkId: 'NYC004', name: 'Holiday Inn Express New York City Times Square', city: 'New York', country: 'US', destination: 'NYC', starRating: 3, region: 'North America', tier: 'Economy', chain: 'IHG', brand: 'Holiday Inn Express', seasonProfile: 'HIGH', basePrice: 180 },
  { id: 'sim_088', hgId: 'HG_SIM_088', giataId: 'UNMAPPED', peakworkId: 'WAS001', name: 'The Willard InterContinental', city: 'Washington', country: 'US', destination: 'WAS', starRating: 5, region: 'North America', tier: 'Luxury', chain: 'IHG', brand: 'InterContinental', seasonProfile: 'HIGH', basePrice: 420 },
  { id: 'sim_089', hgId: 'HG_SIM_089', giataId: 'UNMAPPED', peakworkId: 'SEA001', name: 'Fairmont Olympic Hotel', city: 'Seattle', country: 'US', destination: 'SEA', starRating: 5, region: 'North America', tier: 'Upper Upscale', chain: 'Fairmont', brand: 'Fairmont', seasonProfile: 'MIXED', basePrice: 350 },
  { id: 'sim_090', hgId: 'HG_SIM_090', giataId: 'UNMAPPED', peakworkId: 'HNL001', name: 'The Royal Hawaiian', city: 'Honolulu', country: 'US', destination: 'HNL', starRating: 5, region: 'North America', tier: 'Luxury', chain: 'Marriott', brand: 'Luxury Collection', seasonProfile: 'HIGH', basePrice: 600 },

  // AFRICA (10)
  { id: 'sim_091', hgId: 'HG_SIM_091', giataId: 'UNMAPPED', peakworkId: 'CPT001', name: 'The Silo Hotel', city: 'Cape Town', country: 'ZA', destination: 'CPT', starRating: 5, region: 'Africa', tier: 'Luxury', chain: 'Independent', brand: 'Silo', seasonProfile: 'HIGH', basePrice: 1200 },
  { id: 'sim_092', hgId: 'HG_SIM_092', giataId: 'UNMAPPED', peakworkId: 'CPT002', name: 'Belmond Mount Nelson Hotel', city: 'Cape Town', country: 'ZA', destination: 'CPT', starRating: 5, region: 'Africa', tier: 'Luxury', chain: 'Belmond', brand: 'Belmond', seasonProfile: 'HIGH', basePrice: 850 },
  { id: 'sim_093', hgId: 'HG_SIM_093', giataId: 'UNMAPPED', peakworkId: 'JNB001', name: 'The Saxon Hotel, Villas and Spa', city: 'Johannesburg', country: 'ZA', destination: 'JNB', starRating: 5, region: 'Africa', tier: 'Luxury', chain: 'Independent', brand: 'Saxon', seasonProfile: 'MIXED', basePrice: 650 },
  { id: 'sim_094', hgId: 'HG_SIM_094', giataId: 'UNMAPPED', peakworkId: 'RAK001', name: 'La Mamounia', city: 'Marrakech', country: 'MA', destination: 'RAK', starRating: 5, region: 'Africa', tier: 'Luxury', chain: 'Independent', brand: 'La Mamounia', seasonProfile: 'HIGH', basePrice: 900 },
  { id: 'sim_095', hgId: 'HG_SIM_095', giataId: 'UNMAPPED', peakworkId: 'RAK002', name: 'Royal Mansour Marrakech', city: 'Marrakech', country: 'MA', destination: 'RAK', starRating: 5, region: 'Africa', tier: 'Luxury', chain: 'Independent', brand: 'Royal Mansour', seasonProfile: 'HIGH', basePrice: 1800 },
  { id: 'sim_096', hgId: 'HG_SIM_096', giataId: 'UNMAPPED', peakworkId: 'CAS001', name: 'Four Seasons Hotel Casablanca', city: 'Casablanca', country: 'MA', destination: 'CAS', starRating: 5, region: 'Africa', tier: 'Luxury', chain: 'Four Seasons', brand: 'Four Seasons', seasonProfile: 'MIXED', basePrice: 400 },
  { id: 'sim_097', hgId: 'HG_SIM_097', giataId: 'UNMAPPED', peakworkId: 'NBO001', name: 'Giraffe Manor', city: 'Nairobi', country: 'KE', destination: 'NBO', starRating: 5, region: 'Africa', tier: 'Luxury', chain: 'The Safari Collection', brand: 'Giraffe Manor', seasonProfile: 'HIGH', basePrice: 1100 },
  { id: 'sim_098', hgId: 'HG_SIM_098', giataId: 'UNMAPPED', peakworkId: 'NBO002', name: 'Tribe Hotel', city: 'Nairobi', country: 'KE', destination: 'NBO', starRating: 5, region: 'Africa', tier: 'Upper Upscale', chain: 'Design Hotels', brand: 'Tribe', seasonProfile: 'MIXED', basePrice: 220 },
  { id: 'sim_099', hgId: 'HG_SIM_099', giataId: 'UNMAPPED', peakworkId: 'VIC001', name: 'The Victoria Falls Hotel', city: 'Victoria Falls', country: 'ZW', destination: 'VFA', starRating: 5, region: 'Africa', tier: 'Luxury', chain: 'Independent', brand: 'Victoria Falls Hotel', seasonProfile: 'HIGH', basePrice: 450 },
  { id: 'sim_100', hgId: 'HG_SIM_100', giataId: 'UNMAPPED', peakworkId: 'ZNZ001', name: 'Zuri Zanzibar', city: 'Zanzibar', country: 'TZ', destination: 'ZNZ', starRating: 5, region: 'Africa', tier: 'Luxury', chain: 'Design Hotels', brand: 'Zuri', seasonProfile: 'HIGH', basePrice: 650 },
];

export function generateRealisticARIForHotel(
  hotel: SimulationHotel,
  startDate: string,
  endDate: string
): Record<string, Record<string, Record<string, ARIData[]>>> {
  const result: Record<string, Record<string, Record<string, ARIData[]>>> = {};
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Deterministic RNG based on hotel ID
  const seed = hotel.id.split('_')[1];
  const lcg = (s: number) => {
    let current = s;
    return () => {
      current = (current * 1664525 + 1013904223) % 4294967296;
      return current / 4294967296;
    };
  };
  const rng = lcg(parseInt(seed) || 42);

  // Room / MealPlan / Occupancy configurations
  const rooms = [
    { code: 'DBL', name: 'Standard Double Room' },
    { code: 'SUP', name: 'Superior Room' },
    { code: 'DLX', name: 'Deluxe Room' }
  ].slice(0, hotel.tier === 'Luxury' ? 3 : (hotel.tier === 'Economy' ? 1 : 2));

  const mealPlans = ['RO', 'BB', 'HB'].slice(0, hotel.tier === 'Economy' ? 2 : 3);
  const occupancies = ['ADL-1', 'ADL-2', 'ADL-2-CHD-1'];

  rooms.forEach((room, rIdx) => {
    result[room.code] = {};
    mealPlans.forEach((mp, mIdx) => {
      result[room.code][mp] = {};
      occupancies.forEach((occ, oIdx) => {
        const days: ARIData[] = [];
        let currentDate = new Date(start);
        
        while (currentDate <= end) {
          const dateStr = currentDate.toISOString().split('T')[0];
          const dayOfWeek = currentDate.getDay(); // 0-6 (Sun-Sat)
          const month = currentDate.getMonth(); // 0-11
          
          // --- LOGIC A: SEASONALITY ---
          let seasonMultiplier = 1.0;
          let isHighSeason = false;
          
          if (hotel.seasonProfile === 'HIGH') {
            // Summer peak (June-August) or Local peak
            if (month >= 5 && month <= 7) { seasonMultiplier = 1.5 + (rng() * 0.3); isHighSeason = true; }
            else if (month === 11 || month === 0) { seasonMultiplier = 1.4 + (rng() * 0.2); isHighSeason = true; }
            else { seasonMultiplier = 1.0 + (rng() * 0.1); }
          } else if (hotel.seasonProfile === 'LOW') {
            if (month >= 5 && month <= 7) { seasonMultiplier = 0.7 + (rng() * 0.1); }
            else { seasonMultiplier = 0.9 + (rng() * 0.1); }
          } else {
            // Mixed / Business City
            if (month === 8 || month === 9 || month === 3 || month === 4) { seasonMultiplier = 1.2; }
            else if (month === 0 || month === 1) { seasonMultiplier = 0.8; }
          }
          
          // Weekend bump for leisure destinations
          if ((dayOfWeek === 5 || dayOfWeek === 6) && (hotel.region === 'Europe' || hotel.tier === 'Luxury')) {
            seasonMultiplier *= 1.25;
          }

          // --- LOGIC B: HOTEL TIER ADR ---
          let basePrice = hotel.basePrice;
          // Room upgrades
          if (room.code === 'SUP') basePrice *= 1.2;
          if (room.code === 'DLX') basePrice *= 1.45;
          
          // Meal plan increments
          if (mp === 'BB') basePrice += 25;
          if (mp === 'HB') basePrice += 65;
          
          // Occupancy increments
          if (occ === 'ADL-2') basePrice *= 1.1;
          if (occ === 'ADL-2-CHD-1') basePrice *= 1.25;

          // Apply all multipliers
          const finalPrice = Math.round(basePrice * seasonMultiplier * 100) / 100;

          // --- LOGIC C: RESTRICTIONS ---
          let minLOS = 1;
          let stopSell = false;
          let alloc = 10;
          
          // High demand -> longer MinLOS, lower alloc
          if (isHighSeason || (dayOfWeek === 5 && hotel.tier === 'Luxury')) {
            if (rng() > 0.7) minLOS = 2;
            if (rng() > 0.9) minLOS = 3;
            alloc = Math.floor(rng() * 5) + 1;
          } else {
            alloc = Math.floor(rng() * 20) + 5;
          }
          
          // Random StopSell (e.g. maintenance or full)
          if (rng() > 0.98) stopSell = true;

          days.push({
            date: dateStr,
            price: finalPrice,
            stayDuration: 0, // Not used in this map structure, but required by type
            minLOS,
            maxLOS: 21,
            stopSell,
            alloc
          });

          currentDate.setDate(currentDate.getDate() + 1);
        }
        result[room.code][mp][occ] = days;
      });
    });
  });

  return result;
}
