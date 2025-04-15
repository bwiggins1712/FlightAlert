import { Flight } from '../models/flight';

const alertedFlights = new Map<string, number>();

export function shouldAlert(flight: Flight): boolean {
  if (!flight?.id) return false;

  const lastAlertTime = alertedFlights.get(flight.id);
  const currentTime = Date.now();
  
  if (!lastAlertTime) {
    alertedFlights.set(flight.id, currentTime);
    return true;
  }

  const minutesSinceLastAlert = (currentTime - lastAlertTime) / (1000 * 60);
  const cooldown = parseInt(process.env.ALERT_COOLDOWN_MINUTES || '30');
  
  if (minutesSinceLastAlert >= cooldown) {
    alertedFlights.set(flight.id, currentTime);
    return true;
  }

  return false;
}

export function clearOldAlerts(): void {
  const hoursToKeep = 6;
  const currentTime = Date.now();
  
  for (const [flightId, alertTime] of alertedFlights.entries()) {
    if ((currentTime - alertTime) > (hoursToKeep * 60 * 60 * 1000)) {
      alertedFlights.delete(flightId);
    }
  }
}