import { Resolver } from 'dns/promises';
import { MongoClient } from 'mongodb';
import { URL, URLSearchParams } from 'url';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

const uri = process.env.MONGODB_URI.trim();
const dbName = process.env.MONGODB_DB?.trim() || 'myDatabase';

const options = {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000,
  socketTimeoutMS: 10000,
  maxPoolSize: 10,
  retryWrites: true,
};

async function resolveSrvMongoUri(rawUri) {
  if (!rawUri.startsWith('mongodb+srv://')) return rawUri;
  const url = new URL(rawUri);
  const auth = url.username
    ? `${encodeURIComponent(url.username)}${url.password ? `:${encodeURIComponent(url.password)}` : ''}@`
    : '';
  const pathname = url.pathname === '/' ? '' : url.pathname;
  const params = new URLSearchParams(url.searchParams);
  if (!params.has('tls') && !params.has('ssl')) params.set('tls', 'true');

  const resolver = new Resolver();
  resolver.setServers(['8.8.8.8', '1.1.1.1']);
  const srvRecords = await resolver.resolveSrv(`_mongodb._tcp.${url.hostname}`);
  const hosts = srvRecords.map(r => `${r.name}:${r.port}`).join(',');
  if (!params.has('authSource')) params.set('authSource', 'admin');

  const query = params.toString();
  return `mongodb://${auth}${hosts}${pathname}${query ? `?${query}` : ''}`;
}

// Tạo client mới hoàn toàn, kèm await connect() ready
async function createFreshClient() {
  const resolvedUri = await resolveSrvMongoUri(uri);
  const c = new MongoClient(resolvedUri, options);
  await c.connect();
  return c;
}

let client;
let clientPromise;

function createClientPromise() {
  return createFreshClient();
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) global._mongoClientPromise = createClientPromise();
  clientPromise = global._mongoClientPromise;
} else {
  clientPromise = createClientPromise();
}

// Chờ topology sẵn sàng với timeout ngắn. Trả về client tươi.
export async function ensureReady(timeoutMs = 3000) {
  let c;
  try {
    c = await clientPromise;
  } catch (err) {
    // Promise cũ đã fail → tạo promise mới
    clientPromise = createClientPromise();
    if (process.env.NODE_ENV === 'development') global._mongoClientPromise = clientPromise;
    c = await clientPromise;
  }

  // Nếu topology chưa sẵn sàng hoặc đã lỗi → reset
  const t = c.topology;
  if (!t || t.isDestroyed?.() || t.description?.type === 'Unknown' || t.s?.error) {
    try { await c.close(true); } catch {}
    clientPromise = createClientPromise();
    if (process.env.NODE_ENV === 'development') global._mongoClientPromise = clientPromise;
    c = await clientPromise;
  }

  // Đợi topology thật sự connected (timeout ngắn)
  if (c.topology && c.topology.isConnected?.() === false) {
    await Promise.race([
      c.topology.waitForState?.('connected'),
      new Promise((_, rej) => setTimeout(() => rej(new Error('waitForState timeout')), timeoutMs)),
    ]).catch(() => {
      try { c.close(true); } catch {}
      clientPromise = createClientPromise();
      if (process.env.NODE_ENV === 'development') global._mongoClientPromise = clientPromise;
      // Fallthrough sẽ được caller retry
    });
  }
  return c;
}

export async function connectToDatabase() {
  const c = await ensureReady();
  return { client: c, db: c.db(dbName) };
}
