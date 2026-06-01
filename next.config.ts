import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Safely flags Prisma and PostgreSQL drivers to resolve as external native modules */
  serverExternalPackages: ["@prisma/client", "pg"],
};

export default nextConfig;