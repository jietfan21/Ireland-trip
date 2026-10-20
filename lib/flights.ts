import { flights, people } from "./trip.ts";

// Compare actual departure instants, not airport-local display strings.
export function orderedFlights() {
  return Object.entries(flights).flatMap(([group, info]) => info.legs.map((leg, index) => ({
    ...leg, group, title: info.title, groupNote: info.note, showGroup: index === 0,
    passengers: people.filter((person) => info.passengers.includes(person.id)),
  }))).sort((a, b) => Date.parse(a.departsAt) - Date.parse(b.departsAt));
}
