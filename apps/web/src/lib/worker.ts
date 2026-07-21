import { Worker } from "bullmq";
import IORedis from "ioredis";
import { prisma } from "./prisma";

const redisConnection = new IORedis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379",
  {
    maxRetriesPerRequest: null,
  },
);

const createEventWorker = () => {
  return new Worker(
    "event-queue",
    async (job) => {
      console.log(`Processing job ${job.id} of type ${job.name}`);

      const targetJob = await prisma.job.findFirst({
        where: { bullJobId: job.id },
      });

      if (!targetJob) {
        console.error(`Job record not found for bullJobId: ${job.id}`);
        return;
      }

      try {
        await prisma.job.update({
          where: { id: targetJob.id },
          data: { status: "PROCESSING" },
        });

        console.log(`Successfully processed event payload:`, job.data.payload);

        await prisma.job.update({
          where: { id: targetJob.id },
          data: { status: "COMPLETED" },
        });
      } catch (error) {
        console.error(`Failed to process job ${job.id}:`, error);

        await prisma.job.update({
          where: { id: targetJob.id },
          data: {
            status: "FAILED",
            logs: {
              create: {
                message:
                  error instanceof Error ? error.message : "Unknown error",
              },
            },
          },
        });

        throw error;
      }
    },
    {
      connection: redisConnection,
      concurrency: 5,
    },
  );
};

declare global {
  var globalWorker: undefined | ReturnType<typeof createEventWorker>;
}

export const eventWorker = globalThis.globalWorker ?? createEventWorker();

if (process.env.NODE_ENV !== "production")
  globalThis.globalWorker = eventWorker;
