import { Pool } from "pg";
import { PrismaClient } from "@prisma/client";

export async function resetSQLDB(pg: Pool) {
  await pg.query(`
    DELETE FROM "Message";
    DELETE FROM "Chat";
    DELETE FROM "User"`);
}

export async function resetORMDB(prisma: PrismaClient) {
  await prisma.$transaction([
    prisma.message.deleteMany(),
    prisma.chat.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}
