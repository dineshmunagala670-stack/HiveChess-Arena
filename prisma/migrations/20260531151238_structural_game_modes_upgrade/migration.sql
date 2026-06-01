-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('MATCHMAKING', 'ACTIVE', 'DRAW', 'WHITE_WINS', 'BLACK_WINS');

-- CreateEnum
CREATE TYPE "GameMode" AS ENUM ('AI_VS_AI', 'AI_VS_BOT', 'AI_VS_HUMAN', 'HUMAN_VS_AI');

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'MATCHMAKING',
    "mode" "GameMode" NOT NULL DEFAULT 'AI_VS_AI',
    "whiteBotId" TEXT,
    "blackBotId" TEXT,
    "whiteHumanId" TEXT,
    "blackHumanId" TEXT,
    "currentFen" TEXT NOT NULL DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    "moveHistory" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "activeTurn" TEXT NOT NULL DEFAULT 'WHITE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Game_whiteBotId_idx" ON "Game"("whiteBotId");

-- CreateIndex
CREATE INDEX "Game_blackBotId_idx" ON "Game"("blackBotId");
