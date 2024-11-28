-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'public',
    "password" TEXT,
    "status" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "players" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Casino" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "minBet" DOUBLE PRECISION NOT NULL,
    "maxBet" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Casino_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Casino_name_key" ON "Casino"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Casino_level_key" ON "Casino"("level");
