/*
  Warnings:

  - You are about to drop the `TransferQueue` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "TransferQueue";

-- CreateTable
CREATE TABLE "AssetTransferTemp" (
    "transfer_id" TEXT NOT NULL,
    "from_user_id" TEXT NOT NULL,
    "to_user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "from_before_amount" DOUBLE PRECISION NOT NULL,
    "from_after_amount" DOUBLE PRECISION NOT NULL,
    "to_before_amount" DOUBLE PRECISION NOT NULL,
    "to_after_amount" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "remark" TEXT NOT NULL,
    "is_handled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetTransferTemp_pkey" PRIMARY KEY ("transfer_id")
);
