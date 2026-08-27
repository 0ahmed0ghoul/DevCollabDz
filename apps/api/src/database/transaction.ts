import {
    prisma,
  } from "./prisma.js";
  
  export async function withTransaction<
    T,
  >(
    operation: (
      tx: typeof prisma,
    ) => Promise<T>,
  ): Promise<T> {
    return prisma.$transaction(
      async (tx) => {
        return operation(tx as typeof prisma);
      },
    );
  }