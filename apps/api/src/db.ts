import { PrismaClient } from '@prisma/client';

let client: PrismaClient | undefined;

export function db(): PrismaClient {
  if (!client) client = new PrismaClient();
  return client;
}
