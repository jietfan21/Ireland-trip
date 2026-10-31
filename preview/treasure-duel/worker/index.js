import { initialState, expire, applyAction, publicState } from './game.mjs';
import { PAGE } from './page.mjs';

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
function randomPlan() {
  const plan = [0, 0, 0, 0, 0], words = new Uint32Array(12);
  crypto.getRandomValues(words);
  for (const word of words) {
    const options = plan.map((n, i) => n < 5 ? i : -1).filter(i => i >= 0);
    plan[options[word % options.length]]++;
  }
  return plan;
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) {
      if (url.pathname === '/favicon.ico') return new Response(null, { status: 204 });
      if (url.pathname !== '/') return new Response('Not found', { status: 404 });
      return new Response(PAGE, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'referrer-policy': 'same-origin', 'content-security-policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'self' https://chatgpt.com" } });
    }
    if (!env.DB) return json({ error: 'The preview database is not connected yet.' }, 503);
    if (!['/api/state', '/api/action', '/api/health'].includes(url.pathname)) return json({ error: 'Not found' }, 404);
    if (url.pathname === '/api/health') return json({ ok: true, demo: true });
    const now = Date.now();
    try {
      let body = null;
      if (url.pathname === '/api/action') {
        if (request.method !== 'POST') return json({ error: 'Use POST.' }, 405);
        const origin = request.headers.get('origin');
        if (origin && origin !== url.origin) return json({ error: 'Wrong origin.' }, 403);
        if (Number(request.headers.get('content-length')) > 8192) return json({ error: 'Request too large.' }, 413);
        const text = await request.text();
        if (text.length > 8192) return json({ error: 'Request too large.' }, 413);
        body = JSON.parse(text);
        if (!body || typeof body !== 'object' || typeof body.key !== 'string' || body.key.length < 8 || body.key.length > 100) return json({ error: 'A request key is required.' }, 400);
      } else if (request.method !== 'GET') return json({ error: 'Use GET.' }, 405);
      const actor = body?.actor ?? url.searchParams.get('actor') ?? 'jiet';
      // The Sites owner-only gate protects this sandbox. Captain switching is a
      // deliberate review tool, not production player authentication.
      const fresh = JSON.stringify(initialState(now));
      await env.DB.prepare('INSERT OR IGNORE INTO duel_sandbox (id,version,state) VALUES (?,0,?)').bind('family', fresh).run();
      const newId = crypto.randomUUID(), botPlan = randomPlan();
      for (let attempt = 0; attempt < 8; attempt++) {
        const row = await env.DB.prepare('SELECT version,state FROM duel_sandbox WHERE id=?').bind('family').first();
        const state = JSON.parse(row.state);
        let changed = expire(state, now), result = {};
        if (body) {
          const signature = JSON.stringify({ ...body, key: undefined });
          const receipt = state.receipts[body.key];
          if (receipt && receipt.signature !== signature) return json({ error: 'That request key was already used for a different action.' }, 409);
          if (receipt) result = receipt.result;
          else {
            result = applyAction(state, actor, body, now, newId, botPlan);
            state.receipts[body.key] = { signature, result };
            const keys = Object.keys(state.receipts);
            if (keys.length > 1000) delete state.receipts[keys[0]];
            changed = true;
          }
        }
        const projection = publicState(state, actor, now);
        if (changed) {
          const update = await env.DB.prepare('UPDATE duel_sandbox SET state=?,version=version+1 WHERE id=? AND version=?').bind(JSON.stringify(state), 'family', row.version).run();
          if (update.meta.changes !== 1) continue;
        }
        return json({ ...projection, ...result });
      }
      return json({ error: 'Another captain just made a move. Refresh and try again.' }, 409);
    } catch (error) {
      if (error instanceof SyntaxError) return json({ error: 'Invalid request.' }, 400);
      const message = error?.message ?? '';
      if (/D1|SQLITE|duel_sandbox|database/i.test(message)) return json({ error: 'The preview database is warming up. Please retry shortly.' }, 503);
      return json({ error: message || 'Something went wrong. Please retry.' }, 400);
    }
  },
};
