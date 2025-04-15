import axios from 'axios';
import dotenv from 'dotenv';
import { URLSearchParams } from 'url';
import { Flight } from '../models/flight';

dotenv.config();

export async function sendWhatsAppAlert(flight: Flight): Promise<void> {
  try {
    // Validate flight data
    if (!flight || typeof flight.distanceFromUser !== 'number') {
      throw new Error('Invalid flight data provided');
    }

    const accountSid = process.env.TWILIO_SID;
    const authToken = process.env.TWILIO_TOKEN;
    const from = `whatsapp:${process.env.TWILIO_PHONE}`;
    const to = `whatsapp:${process.env.YOUR_PHONE}`;

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }

    const message = `🚨 Flight Alert! 🚨
✈️ ${flight.callsign} (${flight.model || 'Unknown'})
📍 ${flight.distanceFromUser.toFixed(1)}NM from you
⬆️ Alt: ${Math.round(flight.altitude)}ft | ➡️ ${flight.heading}°
📌 Pos: ${flight.latitude.toFixed(4)}, ${flight.longitude.toFixed(4)}
🛫 ${flight.origin || '?'} → 🛬 ${flight.destination || '?'}`;

    const params = new URLSearchParams();
    params.append('Body', message);
    params.append('From', from);
    params.append('To', to);

    const response = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      params,
      {
        auth: { username: accountSid, password: authToken },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    console.log(`Notification sent for ${flight.callsign}`, response.data.sid);
  } catch (error) {
    console.error('Failed to send alert:', error instanceof Error ? error.message : error);
  }
}
