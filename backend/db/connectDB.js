import "dotenv/config";

import pg from "pg";
import { PrismaClient } from "../generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";

const { Pool } = pg;

// ─────────────────────────────────────────────
// MASTER DATABASE
// ─────────────────────────────────────────────
const masterPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const masterAdapter = new PrismaPg(masterPool);

export const masterClient = new PrismaClient({
  adapter: masterAdapter,
});

// ─────────────────────────────────────────────
// REPLICA DATABASE
// ─────────────────────────────────────────────
const replicaPool = new Pool({
  connectionString:
    process.env.REPLICA_DATABASE_URL || process.env.DATABASE_URL,
});

const replicaAdapter = new PrismaPg(replicaPool);

export const replicaClient = new PrismaClient({
  adapter: replicaAdapter,
});

// ─────────────────────────────────────────────
// CONNECT DATABASES
// ─────────────────────────────────────────────
export const connectDB = async () => {
  try {
    await masterClient.$connect();
    await replicaClient.$connect();

    console.log("✅ Master database connected");
    console.log("✅ Replica database connected");
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  }
};