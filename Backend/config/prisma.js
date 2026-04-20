/*
  ═══════════════════════════════════════════════════════
  config/prisma.js
  ───────────────────────────────────────────────────────
  FIXES:
  1. Added graceful shutdown — pool.end() on SIGINT/SIGTERM
     to prevent connection leaks on Render restarts.
  2. NOTE: schema.prisma MUST have previewFeatures = ["driverAdapters"]
     in the generator block, or this adapter is silently ignored.
  ═══════════════════════════════════════════════════════
*/

const { Pool }      = require('pg');
const { PrismaPg }  = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

// 1. Setup the connection pool using your environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 2. Initialize the adapter
const adapter = new PrismaPg(pool);

// 3. Pass the adapter to the PrismaClient constructor
const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'warn', 'error']
    : ['warn', 'error'],
});

// ✅ FIX: Graceful shutdown — close pool on process exit
//    Without this, Render restarts leave dangling pg connections
//    that count against your connection limit (especially on free tier).
async function shutdown() {
  console.log('[Prisma] Disconnecting...');
  await prisma.$disconnect();
  await pool.end();
  console.log('[Prisma] Pool closed.');
  process.exit(0);
}

process.on('SIGINT',  shutdown);
process.on('SIGTERM', shutdown);

module.exports = prisma;