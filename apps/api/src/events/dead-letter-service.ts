import { logger } from "../utils/logger.js";

import { requeueDeadLetterEvent } from "./outbox-store.js";

export async function retryDeadLetterEvent(
  eventId: string,
): Promise<void> {
  const requeued =
    await requeueDeadLetterEvent(eventId);

  if (!requeued) {
    throw new Error(
      `Dead-letter event not found or already recovered: ${eventId}`,
    );
  }

  logger.warn(
    {
      eventId,
    },
    "Dead-letter event requeued for processing",
  );
}