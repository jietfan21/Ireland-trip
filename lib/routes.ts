// Real road routes for each day, fetched from the public OSRM server on the family's phones
// and kept in localStorage so the map still draws them offline. Straight lines until then.

export type LngLat = [number, number];
export type Route = { coords: LngLat[]; road: boolean };

const KEY = "route-v1:";
const OSRM = "https://router.project-osrm.org/route/v1/driving/";

function cacheKey(stops: LngLat[]) {
  return KEY + stops.map(([x, y]) => `${x.toFixed(4)},${y.toFixed(4)}`).join(";");
}

export function cachedRoute(stops: LngLat[]): Route {
  try {
    const hit = localStorage.getItem(cacheKey(stops));
    if (hit) return { coords: JSON.parse(hit), road: true };
  } catch {}
  return { coords: stops, road: false };
}

export async function fetchRoute(stops: LngLat[]): Promise<Route> {
  const cached = cachedRoute(stops);
  if (cached.road || stops.length < 2) return cached;
  try {
    const path = stops.map(([x, y]) => `${x},${y}`).join(";");
    const res = await fetch(`${OSRM}${path}?overview=full&geometries=geojson`);
    if (!res.ok) return cached;
    const json = await res.json();
    const coords: LngLat[] | undefined = json.routes?.[0]?.geometry?.coordinates;
    if (!coords?.length) return cached;
    try {
      localStorage.setItem(cacheKey(stops), JSON.stringify(coords));
    } catch {}
    return { coords, road: true };
  } catch {
    return cached;
  }
}
