// utils/geocoding.ts
import { GEOAPIFY_API_KEY } from "../config/geoapify";

export type Coordinate = {
  latitude: number;
  longitude: number;
};

/**
 * Geocodifica un texto (dirección o lugar) usando Geoapify
 * y devuelve lat/lng del primer resultado.
 */
export const geocodePlace = async (
  text: string
): Promise<Coordinate | null> => {
  try {
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
      text
    )}&format=json&apiKey=${GEOAPIFY_API_KEY}`;

    const res = await fetch(url);
    if (!res.ok) {
      console.log("❌ Error HTTP geocoding:", res.status, res.statusText);
      return null;
    }

    const data: any = await res.json();

    if (!data.results || data.results.length === 0) {
      console.log("⚠️ Sin resultados para:", text);
      return null;
    }

    const first = data.results[0];

    return {
      latitude: first.lat,
      longitude: first.lon,
    };
  } catch (err) {
    console.error("❌ Error geocoding:", err);
    return null;
  }
};
