import { createServer } from 'node:http';
import { stat, mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { database } from './sqlite-adapter.mjs';
const root = new URL('../', import.meta.url);
const built = spawnSync(process.execPath, ['scripts/build.mjs'], { cwd: root, stdio: 'inherit' });
if (built.status !== 0) process.exit(built.status);
await mkdir(new URL('.preview-state/', root), { recursive: true });
const DB = database(new URL('.preview-state/demo.sqlite', root).pathname);
let worker, version;
async function getWorker() {
  const file = new URL('dist/server/index.js', root), mtime = (await stat(file)).mtimeMs;
  if (mtime !== version) { version = mtime; worker = (await import(file.href + '?v=' + mtime)).default; }
  return worker;
}
const port = Number(process.env.PORT || 3000);
createServer(async (req, res) => {
  try {
    const chunks = []; for await (const chunk of req) chunks.push(chunk);
    const origin = req.headers.origin || 'http://' + req.headers.host;
    const request = new Request(origin + req.url, { method: req.method, headers: req.headers, ...(!['GET', 'HEAD'].includes(req.method) ? { body: Buffer.concat(chunks) } : {}) });
    const response = await (await getWorker()).fetch(request, { DB });
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) { console.error(error); res.writeHead(500); res.end('Preview error'); }
}).listen(port, '0.0.0.0', () => console.log('Local: http://localhost:' + port));
