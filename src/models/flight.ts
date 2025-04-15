export interface Flight {
  id: string;
  callsign: string;
  model?: string;
  registration?: string;
  latitude: number;
  longitude: number;
  altitude: number;
  speed?: number;
  heading?: number;
  origin?: string;
  destination?: string;
  squawk?: string;
  verticalSpeed?: number;
  distanceFromUser: number;
}
