import { Resolver } from 'dns/promises';
import { MongoClient } from 'mongodb';
import { URL, URLSearchParams } from 'url';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

const uri = process.env.MONGODB_URI.trim();
const dbName = process.env.MONGODB_DB?.trim() || 'myDatabase';

const options = {
  serverSelectionTimeoutMS: 10000,
};

async function resolveSrvMongoUri(rawUri) {
  if (!rawUri.startsWith('mongodb+srv://')) {
    return rawUri;
  }

  const url = new URL(rawUri);
  const auth = url.username
    ? `${encodeURIComponent(url.username)}${url.password ? `:${encodeURIComponent(url.password)}` : ''}@`
    : '';
  const pathname = url.pathname === '/' ? '' : url.pathname;
  const params = new URLSearchParams(url.searchParams);

  if (!params.has('tls') && !params.has('ssl')) {
    params.set('tls', 'true');
  }

  const resolver = new Resolver();
  resolver.setServers(['8.8.8.8', '1.1.1.1']);

  const srvRecords = await resolver.resolveSrv(`_mongodb._tcp.${url.hostname}`);
  const hosts = srvRecords.map(record => `${record.name}:${record.port}`).join(',');
  if (!params.has('authSource')) {
    params.set('authSource', 'admin');
  }

  const query = params.toString();
  const finalUri = `mongodb://${auth}${hosts}${pathname}${query ? `?${query}` : ''}`;
  console.log('Mongo connect URI (sanitized):', finalUri.replace(/:\/\/(.*?):.*?@/, '://$1:***@'));

  return finalUri;
}

let client;
let clientPromise;

async function createClientPromise() {
  const resolvedUri = await resolveSrvMongoUri(uri);
  client = new MongoClient(resolvedUri, options);
  const promise = client.connect().catch(error => {
    if (process.env.NODE_ENV === 'development' && global._mongoClientPromise === promise) {
      global._mongoClientPromise = undefined;
    }
    throw error;
  });
  return promise;
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = createClientPromise();
  }
  clientPromise = global._mongoClientPromise;
} else {
  clientPromise = createClientPromise();
}

export async function connectToDatabase() {
  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    console.log('Mongo connected to DB:', dbName);
    return { client, db };
  } catch (error) {
    console.error('MongoDB connect error:', error);
    throw error;
  }
}