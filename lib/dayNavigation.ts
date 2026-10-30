import { places, stayById, type Day } from "./trip";

// Each route URL contains the day's stops in their saved order.
function stopLocation(id: string): string | null {
  if (id.startsWith("@")) {
    const stay = stayById(id.slice(1));
    return stay ? (stay.approx ? stay.address : `${stay.lat},${stay.lng}`) : null;
  }
  const place = places[id];
  return place ? (place.q ?? `${place.lat},${place.lng}`) : null;
}

function directionsUrl(locations: string[]): string {
  const params = new URLSearchParams({
    api: "1",
    origin: locations[0],
    destination: locations[locations.length - 1],
    travelmode: "driving",
  });
  if (locations.length > 2) {
    params.set("waypoints", locations.slice(1, -1).join("|"));
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export type DayNavigation = {
  fullUrl: string;
  partUrls: string[];
  stopCount: number;
};

export function dayNavigation(day: Day): DayNavigation | null {
  const locations = day.stops.map(stopLocation);
  // Don't produce a route with an accidentally missing stop.
  if (locations.length < 2 || locations.some((location) => location === null)) return null;
  const stops = locations as string[];

  // Google Maps in a mobile browser supports only three intermediate waypoints.
  // Overlap the last point of each leg with the first point of the next one.
  const partUrls: string[] = [];
  for (let i = 0; i < stops.length - 1; i += 4) {
    partUrls.push(directionsUrl(stops.slice(i, i + 5)));
  }

  return {
    fullUrl: directionsUrl(stops),
    partUrls,
    stopCount: stops.length,
  };
}
