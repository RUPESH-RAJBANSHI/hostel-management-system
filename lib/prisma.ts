import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Errors that mean "the database connection dropped", not "your query is wrong".
function isDroppedConnection(e: unknown) {
  const err = e as { code?: string; message?: string };
  if (err?.code === "P1017" || err?.code === "P1001" || err?.code === "P1008") {
    return true;
  }
  return /closed the connection|Connection terminated|ECONNRESET|ECONNREFUSED|ETIMEDOUT|timeout|Can't reach database/i.test(
    String(err?.message ?? e),
  );
}

function createClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
    max: 3,
    connectionTimeoutMillis: 60000,
    idleTimeoutMillis: 5000,
    keepAlive: true,
  });

  return new PrismaClient({ adapter }).$extends({
    query: {
      async $allOperations({ args, query }) {
        for (let attempt = 1; ; attempt++) {
          try {
            return await query(args);
          } catch (e) {
            if (!isDroppedConnection(e) || attempt >= 4) throw e;
            await sleep(1000 * attempt);
          }
        }
      },
    },
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createClient>;
};

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
