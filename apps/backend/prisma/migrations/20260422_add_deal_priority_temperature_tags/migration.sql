-- CreateEnum
CREATE TYPE "DealPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "DealTemperature" AS ENUM ('HOT', 'WARM', 'COLD');

-- AlterTable
ALTER TABLE "Deal"
  ADD COLUMN "priority" "DealPriority" NOT NULL DEFAULT 'MEDIUM',
  ADD COLUMN "temperature" "DealTemperature",
  ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "lastActivityAt" TIMESTAMP(3);
