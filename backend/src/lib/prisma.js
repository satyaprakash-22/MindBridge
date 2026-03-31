const { PrismaClient } = require('@prisma/client');

// Reuse one Prisma client across the process to avoid exhausting DB connection limits.
const globalForPrisma = global;

const buildDatasourceUrl = () => {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    return undefined;
  }

  try {
    const parsed = new URL(rawUrl);
    if (!parsed.searchParams.has('pgbouncer')) {
      parsed.searchParams.set('pgbouncer', 'true');
    }

    if (!parsed.searchParams.has('connection_limit')) {
      // Keep the client footprint small for managed poolers with strict limits.
      parsed.searchParams.set('connection_limit', process.env.PRISMA_CONNECTION_LIMIT || '1');
    }

    if (!parsed.searchParams.has('pool_timeout')) {
      parsed.searchParams.set('pool_timeout', process.env.PRISMA_POOL_TIMEOUT || '20');
    }

    return parsed.toString();
  } catch (error) {
    return rawUrl;
  }
};

const datasourceUrl = buildDatasourceUrl();

if (datasourceUrl) {
  process.env.DATABASE_URL = datasourceUrl;
}

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = new PrismaClient();
}

module.exports = globalForPrisma.prisma;
