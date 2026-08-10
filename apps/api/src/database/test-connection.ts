import { prisma } from "./prisma.js";

async function main() {
  await prisma.$connect();

  console.log("✅ PostgreSQL connected successfully");

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("❌ Database connection failed:", error);

  await prisma.$disconnect();
  process.exit(1);
});