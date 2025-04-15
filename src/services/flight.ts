import axios from 'axios';
import dotenv from 'dotenv';
import { Flight } from '../models/flight';

dotenv.config();

interface Aircraft {
  flight?: string;
  hex?: string;
  lat?: number;
  lon?: number;
  alt_baro?: number;
  t?: string;
  r?: string;
  gs?: number;
  track?: number;
  squawk?: string;
  geom_rate?: number;
  from?: string;
  to?: string;
}

const API_CONFIG = {
  baseUrl: 'https://adsbexchange-com1.p.rapidapi.com',
  version: 'v2',
  timeout: 15000,
  maxRetries: 2,
  retryDelay: 1000
};

export async function getLiveFlights(lat: number, lon: number, radiusNm: number): Promise<Flight[]> {
  let retryCount = 0;
  
  while (retryCount <= API_CONFIG.maxRetries) {
    try {
      const url = `${API_CONFIG.baseUrl}/${API_CONFIG.version}/lat/${lat}/lon/${lon}/dist/${radiusNm}/`;
      console.log(`[API] Fetching: ${lat},${lon} (${radiusNm}NM radius)`);

      const response = await axios.get(url, {
        headers: {
          'x-rapidapi-key': process.env.RAPIDAPI_KEY!,
          'x-rapidapi-host': process.env.RAPIDAPI_HOST!
        },
        timeout: API_CONFIG.timeout
      });

      if (response.status !== 200) {
        throw new Error(`API responded with status ${response.status}`);
      }

      if (!response.data?.ac) {
        console.warn('[API] Unexpected response format');
        return [];
      }

      // Explicitly type the aircraft parameter
      return response.data.ac
        .filter((ac: Aircraft) => isValidAircraft(ac))
        .map((ac: Aircraft) => createFlightObject(ac, lat, lon))
        .filter((flight: Flight) => {
          const distanceMiles = flight.distanceFromUser * 1.15078;
          return distanceMiles <= 1;
        });

    } catch (error) {
      retryCount++;
      if (retryCount > API_CONFIG.maxRetries) {
        console.error('[API] Failed after retries:', error instanceof Error ? error.message : error);
        return [];
      }
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay));
    }
  }
  return [];
}

function isValidAircraft(ac: Aircraft): boolean {
  return !!ac.flight?.trim() && 
         !isNaN(ac.lat!) && 
         !isNaN(ac.lon!) && 
         !isNaN(ac.alt_baro!);
}

function createFlightObject(ac: Aircraft, userLat: number, userLon: number): Flight {
  const distanceNm = calculateDistance(userLat, userLon, ac.lat!, ac.lon!);
  
  return {
    id: ac.hex || ac.flight?.trim() || 'UNKNOWN',
    callsign: ac.flight?.trim() || 'UNKNOWN',
    model: ac.t?.trim(),
    registration: ac.r?.trim(),
    latitude: ac.lat!,
    longitude: ac.lon!,
    altitude: ac.alt_baro || 0,
    speed: ac.gs || 0,
    heading: ac.track || 0,
    squawk: ac.squawk?.toString(),
    verticalSpeed: ac.geom_rate || 0,
    distanceFromUser: distanceNm,
    origin: ac.from,
    destination: ac.to
  };
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c * 0.539957;
}