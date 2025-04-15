import dotenv from 'dotenv';
import { getLiveFlights } from './services/flight';
import { sendWhatsAppAlert } from './services/notify';
import { shouldAlert, clearOldAlerts } from './utils/rateLimit';

dotenv.config();

// Validate environment variables
const requiredVars = [
  'RAPIDAPI_KEY', 'RAPIDAPI_HOST',
  'YOUR_LAT', 'YOUR_LON',
  'TWILIO_SID', 'TWILIO_TOKEN',
  'TWILIO_PHONE', 'YOUR_PHONE'
];

for (const varName of requiredVars) {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
}

async function monitorFlights() {
  try {
    clearOldAlerts();
    const lat = parseFloat(process.env.YOUR_LAT!);
    const lon = parseFloat(process.env.YOUR_LON!);
    const radius = parseFloat(process.env.SEARCH_RADIUS_NM!);
    
    console.log(`\n=== Checking flights at ${new Date().toLocaleTimeString()} ===`);
    console.log(`Location: ${lat},${lon} | Radius: ${radius}NM`);

    const flights = await getLiveFlights(lat, lon, radius);
    console.log(`Found ${flights.length} valid flights`);

    for (const flight of flights) {
      try {
        if (shouldAlert(flight)) {
          console.log(`New flight: ${flight.callsign} (${flight.distanceFromUser.toFixed(1)}NM)`);
          await sendWhatsAppAlert(flight);
        }
      } catch (error) {
        console.error('Error processing flight:', flight, error);
      }
    }
  } catch (error) {
    console.error('Monitoring error:', error instanceof Error ? error.message : error);
  } finally {
    setTimeout(monitorFlights, 60000); // Check every minute
  }
}

console.log('Starting ADSBExchange Flight Monitor...');
monitorFlights();