const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

// 1. Setup the connection pool using your environment variable
const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL 
});

// 2. Initialize the adapter
const adapter = new PrismaPg(pool);

// 3. Pass the adapter to the PrismaClient constructor
const prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
});

module.exports = prisma;