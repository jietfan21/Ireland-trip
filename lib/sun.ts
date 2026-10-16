// Sunrise/sunset (NOAA approximation), returned as "HH:MM" in the given IANA timezone.
const rad = Math.PI / 180;

function sunTimes(date: string, lat: number, lng: number) {
  const d = new Date(`${date}T12:00:00Z`);
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  const n = Math.floor((d.getTime() - start) / 86400000);
  const g = ((2 * Math.PI) / 365) * (n - 1);
  const eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const cosH = (Math.cos(90.833 * rad) - Math.sin(lat * rad) * Math.sin(decl)) / (Math.cos(lat * rad) * Math.cos(decl));
  if (cosH > 1 || cosH < -1) return null;
  const ha = Math.acos(cosH) / rad;
  const noon = 720 - 4 * lng - eq; // minutes UTC
  const base = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return { rise: new Date(base + (noon - 4 * ha) * 60000), set: new Date(base + (noon + 4 * ha) * 60000) };
}

export function sunHHMM(date: string, lat: number, lng: number, timeZone: string) {
  const t = sunTimes(date, lat, lng);
  if (!t) return null;
  const f = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone });
  return { rise: f.format(t.rise), set: f.format(t.set) };
}
