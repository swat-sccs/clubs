import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { deleteImage } from "@/lib/storage";

export async function queueImageDeletion(
  tx: Prisma.TransactionClient,
  objectKey: string | null | undefined,
) {
  if (!objectKey) return;
  await tx.pendingObjectDeletion.upsert({
    where: { objectKey },
    create: { objectKey },
    update: {},
  });
}

export async function queueDetachedImage(
  objectKey: string | null | undefined,
) {
  if (!objectKey) return;
  await prisma.pendingObjectDeletion.upsert({
    where: { objectKey },
    create: { objectKey },
    update: {},
  });
}

export async function attemptQueuedImageDeletion(
  objectKey: string | null | undefined,
) {
  if (!objectKey) return;
  try {
    await deleteImage(objectKey);
    await prisma.pendingObjectDeletion.deleteMany({ where: { objectKey } });
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 1000) : "Unknown storage error";
    await prisma.pendingObjectDeletion.updateMany({
      where: { objectKey },
      data: { attempts: { increment: 1 }, lastError: message },
    });
  }
}

export async function discardDetachedImage(
  objectKey: string | null | undefined,
) {
  if (!objectKey) return;
  await queueDetachedImage(objectKey);
  await attemptQueuedImageDeletion(objectKey);
}

export async function retryPendingImageDeletions(limit = 20) {
  const pending = await prisma.pendingObjectDeletion.findMany({
    orderBy: { createdAt: "asc" },
    take: Math.max(1, Math.min(100, limit)),
    select: { objectKey: true },
  });
  await Promise.all(
    pending.map(({ objectKey }) => attemptQueuedImageDeletion(objectKey)),
  );
}
