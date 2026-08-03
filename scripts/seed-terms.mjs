// Seed the `terms` collection from public/terms/data-usage/*.pdf into dev + prod.
// Usage: node scripts/seed-terms.mjs
// Reads .env.dev and .env.prod for MONGODB_URI + MONGO_DB_NAME. Idempotent (upserts by version).
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv(path) {
  const vars = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) vars[m[1]] = m[2];
  }
  return vars;
}

function parseTermsDir() {
  return readdirSync(join(root, "public/terms/data-usage"))
    .filter((f) => f.endsWith(".pdf"))
    .map((f) => {
      const version = f.replace(".pdf", ""); // YYYYMMDD
      const y = +version.slice(0, 4), mo = +version.slice(4, 6) - 1, d = +version.slice(6, 8);
      return {
        version,
        link: `/terms/data-usage/${f}`,
        // createdAt from version so newest PDF always sorts last -> wins
        createdAt: new Date(Date.UTC(y, mo, d, 12)),
      };
    })
    .sort((a, b) => a.createdAt - b.createdAt);
}

async function seed(envPath, terms) {
  const env = loadEnv(envPath);
  const uri = env.MONGODB_URI;
  const dbName = env.MONGO_DB_NAME;
  if (!uri || !dbName) throw new Error(`${envPath}: missing MONGODB_URI/MONGO_DB_NAME`);

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const col = client.db(dbName).collection("terms");
    let inserted = 0, updated = 0;
    for (const t of terms) {
      const res = await col.replaceOne({ version: t.version }, t, { upsert: true });
      if (res.upsertedCount) inserted++;
      else if (res.modifiedCount) updated++;
    }
    console.log(`[${dbName}] terms: ${inserted} inserted, ${updated} updated, total ${await col.countDocuments()}`);
  } finally {
    await client.close();
  }
}

const terms = parseTermsDir();
console.log(`Found ${terms.length} term(s): ${terms.map((t) => t.version).join(", ")}`);
for (const envPath of [".env.dev", ".env.prod"]) {
  await seed(envPath, terms);
}
