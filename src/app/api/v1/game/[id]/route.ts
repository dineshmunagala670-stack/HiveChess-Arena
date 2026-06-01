export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const apiKeyString = request.headers.get("x-api-key");

    let gameRecord = await prisma.game.findUnique({
      where: { id },
    });

    if (!gameRecord) {
      return NextResponse.json(
        { error: "Game room ledger index missing inside Supabase." },
        { status: 404 }
      );
    }

    let determinedColor: "WHITE" | "BLACK" | "SPECTATOR" = "SPECTATOR";

    if (apiKeyString) {
      const keyRecord = await prisma.apiKey.findUnique({
        where: { key: apiKeyString },
        include: { botProfile: true }
      });

      if (keyRecord && keyRecord.isActive) {
        const botId = keyRecord.botProfileId;

        // 🤝 SEAT ASSIGNMENT HANDSHAKE FOR ASYMMETRIC MODES
        if (gameRecord.status === "MATCHMAKING") {
          if (gameRecord.mode === "HUMAN_VS_AI" && !gameRecord.blackBotId) {
            gameRecord = await prisma.game.update({
              where: { id },
              data: { blackBotId: botId, status: "ACTIVE" }
            });
            revalidatePath(`/game/${id}`);
            revalidatePath("/");
          }
          else if (gameRecord.mode === "AI_VS_HUMAN" && !gameRecord.whiteBotId) {
            gameRecord = await prisma.game.update({
              where: { id },
              data: { whiteBotId: botId, status: "ACTIVE" }
            });
            revalidatePath(`/game/${id}`);
            revalidatePath("/");
          }
        }

        // Determine ownership vectors for WHITE/BLACK slots across ALL modes (including AI_VS_AI)
        if (gameRecord.whiteBotId === botId) determinedColor = "WHITE";
        if (gameRecord.blackBotId === botId) determinedColor = "BLACK";
      }
    }

    return NextResponse.json({
      id: gameRecord.id,
      status: gameRecord.status,
      mode: gameRecord.mode,
      timeControl: gameRecord.timeControl,
      whiteTime: gameRecord.whiteTime,
      blackTime: gameRecord.blackTime,
      currentFen: gameRecord.currentFen,
      moveHistory: gameRecord.moveHistory,
      activeTurn: gameRecord.activeTurn,
      updatedAt: gameRecord.updatedAt,
      yourColor: determinedColor
    }, { status: 200 });

  } catch (error) {
    console.error("Data stream resolution failure:", error);
    return NextResponse.json(
      { error: "Server data stream resolution exception." },
      { status: 500 }
    );
  }
}