import { Worker } from "bullmq";
import IORedis from "ioredis";
import { prisma } from "./prisma";

const redisConnection = new IORedis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379",
  {
    maxRetriesPerRequest: null,
  },
);

export const eventWorker = new Worker(
  "event-queue",
  async (job) => {
    console.log(`Processing job ${job.id} of type ${job.name}`);

    try {
      await prisma.job.update({
        where: { bullJobId: job.id },
        data: { status: "PROCESSING" },
      });

      console.log(`Successfully processed event payload:`, job.data.payload);

      await prisma.job.update({
        where: { bullJobId: job.id },
        data: { status: "COMPLETED" },
      });
    } catch (error) {
      console.error(`Failed to process job ${job.id}:`, error);

      await prisma.job.update({
        where: { bullJobId: job.id },
        data: {
          status: "FAILED",
          logs: {
            create: {
              message: error instanceof Error ? error.message : "Unknown error",
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
