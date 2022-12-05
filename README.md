# sandbox

Currently this reproduces an error selecting blob values from `wa-sqlite`

The interesting bits are in `src/main.ts`:

```ts
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
```

Instead of getting a byte array of values `010203` or `01020304` we get:

```
INSERTING 010203
main.ts:73 SELECTING
main.ts:96 raw bytes Int8Array(3) [-16, -81, 81, buffer: ArrayBuffer(16777216), byteLength: 3, byteOffset: 5353200, length: 3, Symbol(Symbol.toStringTag): 'Int8Array']
main.ts:97 hex f0af51
main.ts:77 INSERTING 01020304
main.ts:80 SELECTING
main.ts:96 raw bytes Int8Array(3) [-16, -81, 81, buffer: ArrayBuffer(16777216), byteLength: 3, byteOffset: 5350640, length: 3, Symbol(Symbol.toStringTag): 'Int8Array']
main.ts:97 hex f0af51
main.ts:96 raw bytes Int8Array(4) [-16, -81, 81, 0, buffer: ArrayBuffer(16777216), byteLength: 4, byteOffset: 5350640, length: 4, Symbol(Symbol.toStringTag): 'Int8Array']
main.ts:97 hex f0af5100
main.ts:84 INSERTING 01020304
main.ts:87 SELECTING
main.ts:96 raw bytes Int8Array(3) [-16, -81, 81, buffer: ArrayBuffer(16777216), byteLength: 3, byteOffset: 5352176, length: 3, Symbol(Symbol.toStringTag): 'Int8Array']
main.ts:97 hex f0af51
main.ts:96 raw bytes Int8Array(4) [-16, -81, 81, 0, buffer: ArrayBuffer(16777216), byteLength: 4, byteOffset: 5352176, length: 4, Symbol(Symbol.toStringTag): 'Int8Array']
main.ts:97 hex f0af5100
main.ts:96 raw bytes Int8Array(4) [-16, -81, 81, 0, buffer: ArrayBuffer(16777216), byteLength: 4, byteOffset: 5352176, length: 4, Symbol(Symbol.toStringTag): 'Int8Array']
main.ts:97 hex f0af5100
main.ts:103 raw bytes (3) [1, 2, 3]
main.ts:104 hex X'010203'
main.ts:103 raw bytes (4) [1, 2, 3, 4]
main.ts:104 hex X'01020304'
main.ts:103 raw bytes (4) [1, 2, 3, 4]
main.ts:104 hex X'01020304'
```

Notice the `byteOffest` parameter for each row

E.g., `byteOffset: 5352176`

Each blob has the same byte offset which is certainly incorrect.

Doing a sql`SELECT quote(a) FROM foo`; then casting `a` from hex to bytes returns the correct result. So for some strange reason sqlite3_column_text is not impacted by this bug.
