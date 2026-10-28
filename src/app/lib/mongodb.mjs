// Bản .mjs của lib/mongodb.js - dùng cho script Node standalone (scripts/*.mjs)
// để không bị warning MODULE_TYPELESS_PACKAGE_JSON.
// Next.js vẫn dùng bản .js gốc (src/app/lib/mongodb.js).

import { Resolver } from "dns/promises";
import { MongoClient } from "mongodb";
import { URL, URLSearchParams } from "url";

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your MongoDB URI to .env.local");
}

const uri = process.env.MONGODB_URI.trim();
const dbName = process.env.MONGODB_DB?.trim() || "myDatabase";

const options = {
  serverSelectionTimeoutMS: 15000,
  connectTimeoutMS: 15000,
  socketTimeoutMS: 30000,
  maxPoolSize: 5,
  retryWrites: true,
};

async function resolveSrvMongoUri(rawUri) {
  if (!rawUri.startsWith("mongodb+srv://")) return rawUri;
  const url = new URL(rawUri);
  const auth = url.username
    ? `${encodeURIComponent(url.username)}${url.password ? `:${encodeURIComponent(url.password)}` : ""}@`
    : "";
  const pathname = url.pathname === "/" ? "" : url.pathname;
  const params = new URLSearchParams(url.searchParams);
  if (!params.has("tls") && !params.has("ssl")) params.set("tls", "true");

  const resolver = new Resolver();
  resolver.setServers(["8.8.8.8", "1.1.1.1"]);
  const srvRecords = await resolver.resolveSrv(`_mongodb._tcp.${url.hostname}`);
  const hosts = srvRecords.map((r) => `${r.name}:${r.port}`).join(",");
  if (!params.has("authSource")) params.set("authSource", "admin");

  const query = params.toString();
  return `mongodb://${auth}${hosts}${pathname}${query ? `?${query}` : ""}`;
}

let clientPromise;

async function createFreshClient() {
  const resolvedUri = await resolveSrvMongoUri(uri);
  const c = new MongoClient(resolvedUri, options);
  await c.connect();
  return c;
}

clientPromise = createFreshClient();

export async function connectToDatabase() {
  const c = await clientPromise;
  return { client: c, db: c.db(dbName) };
}
