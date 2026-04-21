# Fix: Database URL Disconnection during Deployment

## Issue
Render build phase fails when running `npx prisma generate` because the `DATABASE_URL` is either missing in the build environment or the Prisma 7.x configuration is strictly enforcing the connection check during generation.

## Changes

### 1. Robust Prisma Configuration
Update `Backend/prisma.config.ts` to handle missing environment variables gracefully during build time.

### 2. Connection Pool Hardening
Update `Backend/config/prisma.js` to ensure the connection pool handles Render's specific requirements (SSL and pooling limits).

---

## Step-by-Step Implementation

### Step 1: Update prisma.config.ts
Replace the strict `process.env["DATABASE_URL"]` with a check.

```typescript
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://placeholder:5432/db",
  },
});
```

### Step 2: Update Database Config
Ensure the `pg` Pool is configured for production.

```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10, // Limit connections for Render's free tier
});
```
