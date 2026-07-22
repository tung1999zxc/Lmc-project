require("dotenv").config({
  path: ".env.local",
});

const dns = require("dns");
const { MongoClient } = require("mongodb");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Khong tim thay MONGODB_URI trong file .env.local");
}

const COLLECTIONS_TO_SYNC = [
  "attendance",
  "chat_messages",
  "counters",
  "notifications",
  "orderHistory",
  "orders",
  "pageName",
  "products",
  "recordsMKT",
  "recordsSale",
];

const SOURCE_DB_NAME = process.env.SOURCE_DB_NAME || "myDatabase";
const TARGET_DB_NAME = process.env.TARGET_DB_NAME || "datatest";
const BATCH_SIZE = 1000;

const client = new MongoClient(uri);

async function syncCollection(sourceDb, targetDb, name) {
  const source = sourceDb.collection(name);
  const targetExists = await targetDb.listCollections({ name }).hasNext();

  if (targetExists) {
    await targetDb.collection(name).drop();
  }

  const target = targetDb.collection(name);
  const cursor = source.find();

  let batch = [];
  let insertedCount = 0;

  while (await cursor.hasNext()) {
    batch.push(await cursor.next());

    if (batch.length === BATCH_SIZE) {
      const result = await target.insertMany(batch, { ordered: false });
      insertedCount += result.insertedCount;
      batch = [];
    }
  }

  if (batch.length > 0) {
    const result = await target.insertMany(batch, { ordered: false });
    insertedCount += result.insertedCount;
  }

  return insertedCount;
}

async function syncDatabases() {
  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas");

    const sourceDb = client.db(SOURCE_DB_NAME);
    const targetDb = client.db(TARGET_DB_NAME);

    const sourceCollections = await sourceDb.listCollections().toArray();
    const sourceNames = new Set(sourceCollections.map((collection) => collection.name));

    console.log(`\nDong bo tu "${sourceDb.databaseName}" -> "${targetDb.databaseName}"`);

    for (const name of COLLECTIONS_TO_SYNC) {
      if (!sourceNames.has(name)) {
        console.log(`Bo qua: ${name} khong ton tai trong ${sourceDb.databaseName}`);
        continue;
      }

      console.log(`\nDang lam moi collection: ${name}`);
      const insertedCount = await syncCollection(sourceDb, targetDb, name);
      console.log(`Hoan tat: ${name} (${insertedCount} document)`);
    }

    console.log("\nDong bo hoan tat!");
  } catch (err) {
    console.error("Loi:", err);
    process.exitCode = 1;
  } finally {
    await client.close();
    console.log("Da dong ket noi MongoDB");
  }
}

syncDatabases();
