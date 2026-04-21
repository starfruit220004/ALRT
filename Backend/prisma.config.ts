import "dotenv/config";
import { defineConfig } from "prisma/config";

// prisma.config.ts
// During Render build phase, DATABASE_URL might not be available
// to 'prisma generate'. We provide a placeholder to prevent build failure.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://placeholder:5432/db",
  },
});
