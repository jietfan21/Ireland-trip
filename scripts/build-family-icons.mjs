// Build the app's icon family from the original head stickers. Run before dev/build.
// Sharp is supplied by Next.js; no external images, fonts or network calls are needed.
import { createRequire } from "node:module";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve("next/package.json"))("sharp");
const publicDir = new URL("../public/", import.meta.url);
const heads = [
  ["dad", 88, 58, 160, -5], ["mom", 264, 58, 160, 5],
  ["rong", 20, 198, 156, -5], ["yao", 178, 190, 156, 0], ["jiet", 336, 198, 156, 5],
  ["ying", 100, 326, 156, -5], ["hui", 260, 326, 156, 5],
];
const images = [];
for (const [id, x, y, size, rotation] of heads) {
  const sticker = await sharp(await readFile(new URL(`avatars/${id}.webp`, publicDir)))
    .resize(192, 192).png({ palette: true, colors: 128 }).toBuffer();
  images.push(`<image data-member="${id}" x="${x}" y="${y}" width="${size}" height="${size}" transform="rotate(${rotation} ${x + size / 2} ${y + size / 2})" href="data:image/png;base64,${sticker.toString("base64")}"/>`);
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512">
<defs><linearGradient id="emerald" x2="0.8" y2="1"><stop stop-color="#258565"/><stop offset="1" stop-color="#123e36"/></linearGradient></defs>
<rect width="512" height="512" rx="108" fill="url(#emerald)"/>
<rect x="10" y="10" width="492" height="492" rx="100" fill="none" stroke="#fae9b2" stroke-opacity=".25" stroke-width="3"/>
<g fill="#f3d487"><circle cx="256" cy="34" r="11"/><circle cx="246" cy="47" r="11"/><circle cx="266" cy="47" r="11"/><path d="M256 49q8 12 1 22" fill="none" stroke="#f3d487" stroke-width="6" stroke-linecap="round"/></g>
${images.join("\n")}
</svg>\n`;
await writeFile(new URL("icon.svg", publicDir), svg);
const master = sharp(Buffer.from(svg));
for (const [name, size] of [["family-icon-192.png", 192], ["family-icon-512.png", 512], ["family-apple-touch-icon.png", 180], ["apple-touch-icon.png", 180]]) {
  // iOS supplies its own corner mask; an opaque square avoids black transparent corners.
  await master.clone().resize(size, size).flatten({ background: "#175b48" }).png({ palette: true, colors: 256 }).toFile(fileURLToPath(new URL(name, publicDir)));
}
const favicons = [];
for (const size of [16, 32, 48]) {
  const png = await master.clone().resize(size, size).png().toBuffer();
  favicons.push({ size, png });
  if (size !== 16) await writeFile(new URL(`family-favicon-${size}.png`, publicDir), png);
}
// A standard multi-size ICO, with PNG payloads for modern browsers and pinned tabs.
const header = Buffer.alloc(6 + favicons.length * 16);
header.writeUInt16LE(1, 2); header.writeUInt16LE(favicons.length, 4);
let offset = header.length;
favicons.forEach(({ size, png }, i) => {
  const at = 6 + i * 16;
  header[at] = size; header[at + 1] = size;
  header.writeUInt16LE(1, at + 4); header.writeUInt16LE(32, at + 6);
  header.writeUInt32LE(png.length, at + 8); header.writeUInt32LE(offset, at + 12);
  offset += png.length;
});
await writeFile(new URL("family-favicon.ico", publicDir), Buffer.concat([header, ...favicons.map(({ png }) => png)]));
console.log("Built family icons with all seven original head stickers.");
