import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
export function database(path = ':memory:') {
  const sqlite = new DatabaseSync(path);
  sqlite.exec(readFileSync(new URL('../drizzle/0000_duel_sandbox.sql', import.meta.url), 'utf8').replace('CREATE TABLE ', 'CREATE TABLE IF NOT EXISTS '));
  return {
    sqlite,
    prepare(sql) {
      let params = [];
      return {
        bind(...values) { params = values; return this; },
        async run() { const r = sqlite.prepare(sql).run(...params); return { meta: { changes: Number(r.changes) } }; },
        async first() { return sqlite.prepare(sql).get(...params) ?? null; },
      };
    },
  };
}
