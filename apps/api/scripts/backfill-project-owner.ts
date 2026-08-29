import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

const projectId =
  "cmt67gdkv0002u4vhrcm0ajrb";

async function main() {
  const project =
    await prisma.project.findUnique({
      where: {
        id: projectId,
      },
      select: {
        id: true,
        ownerId: true,
      },
    });

  if (!project) {
    throw new Error(
      "Project not found",
    );
  }

  const existing =
    await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: project.id,
          userId: project.ownerId,
        },
      },
    });

  if (existing) {
    console.log(
      "Owner membership already exists:",
      existing.id,
    );
    return;
  }

  const member =
    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: project.ownerId,
        role: "OWNER",
      },
    });

  console.log(
    "Created owner membership:",
    member,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });