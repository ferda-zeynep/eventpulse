/*
  Warnings:

  - A unique constraint covering the columns `[bullJobId]` on the table `Job` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Job_bullJobId_key" ON "Job"("bullJobId");
