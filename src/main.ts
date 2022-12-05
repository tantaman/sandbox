import * as SQLite from 'wa-sqlite';
import SQLiteAsyncESMFactory from 'wa-sqlite/dist/wa-sqlite-async.mjs';
// @ts-ignore
import { IDBBatchAtomicVFS } from 'wa-sqlite/src/examples/IDBBatchAtomicVFS.js';

// @ts-ignore
import wasmUrl from "wa-sqlite/dist/wa-sqlite-async.wasm?url";

let api: SQLiteAPI | null = null;
export default async function getSqliteApi(): Promise<SQLiteAPI> {
  if (api != null) {
    return api;
  }

  const module = await SQLiteAsyncESMFactory({
    locateFile(file: string) {
      return wasmUrl;
    },
  });
  const sqlite3 = SQLite.Factory(module);
  sqlite3.vfs_register(new IDBBatchAtomicVFS('idb-batch-atomic', { durability: 'relaxed' }));

  return sqlite3;
}

const sqlite3 = await getSqliteApi();
const db = await sqlite3.open_v2(
  'aname',
  SQLite.SQLITE_OPEN_CREATE | SQLite.SQLITE_OPEN_READWRITE | SQLite.SQLITE_OPEN_URI,
  'idb-batch-atomic',
);

(window as any).db = db;
(window as any).sqlite3 = sqlite3;

async function sql(strings: TemplateStringsArray, ...values: any[]) {
  // Assemble the template string components.
  const interleaved: any[] = [];
  strings.forEach((s, i) => {
    interleaved.push(s, values[i]);
  });
  const sql = interleaved.join('');

  // Loop over the SQL statements. sqlite3.statements is an API
  // convenience function (not in the C API) that iterates over
  // compiled statements, automatically managing resources.
  const results = [];
  for await (const stmt of sqlite3.statements(db, sql)) {
    const rows = [];
    const columns = sqlite3.column_names(stmt);
    while (await sqlite3.step(stmt) === SQLite.SQLITE_ROW) {
      // Collect row elements. sqlite3.row is an API convenience
      // function (not in the C API) that extracts values for all
      // the columns of the row.
      const row = sqlite3.row(stmt);
      rows.push(row);
    }
    if (columns.length) {
      results.push({ columns, rows });
    }
  }
  return results;
}

(window as any).sql = sql;

await sql`DROP TABLE IF EXISTS foo`;
await sql`CREATE TABLE IF NOT EXISTS foo (a)`

console.log('INSERTING 010203');
await sql`INSERT INTO foo VALUES (X'010203')`

console.log('SELECTING');
let result = await sql`SELECT * FROM foo`;
printBytesResult(result);

console.log('INSERTING 01020304');
await sql`INSERT INTO foo VALUES (X'01020304')`

console.log('SELECTING');
result = await sql`SELECT * FROM foo`;
printBytesResult(result);

console.log('INSERTING 01020304');
await sql`INSERT INTO foo VALUES (X'01020304')`

console.log('SELECTING');
result = await sql`SELECT * FROM foo`;
printBytesResult(result);

result = await sql`SELECT quote(a) FROM foo`;
printHexResult(result);

function printBytesResult(result: {rows: any[], columns: string[]}[]) {
  result[0].rows.forEach(r => {
    console.log('raw bytes', r[0])
    console.log('hex', bytesToHex(r[0]));
  });
}

function printHexResult(result: {rows: any[], columns: string[]}[]) {
  result[0].rows.forEach(r => {
    console.log('raw bytes', hexToBytes(r[0].substring(2, r[0].length - 1)))
    console.log('hex', r[0]);
  });
}

function bytesToHex(bytes: any[]) {
  for (var hex = [], i = 0; i < bytes.length; i++) {
      var current = bytes[i] < 0 ? bytes[i] + 256 : bytes[i];
      hex.push((current >>> 4).toString(16));
      hex.push((current & 0xF).toString(16));
  }
  return hex.join("");
}

function hexToBytes(hex: string) {
  for (var bytes = [], c = 0; c < hex.length; c += 2)
      bytes.push(parseInt(hex.substr(c, 2), 16));
  return bytes;
}