import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Chess } from "chess.js";
import { prisma } from "../../../../../lib/prisma";

const K_FACTOR = 32;
const DEFAULT_SYSTEM_ENGINE_RATING = 1200;

function calculateEloDelta(playerRating: number, opponentRating: number, outcomeScore: number): number {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  return Math.round(K_FACTOR * (outcomeScore - expectedScore));
}

async function processMatchEndRatings(gameId: string, terminalStatus: "WHITE_WINS" | "BLACK_WINS" | "DRAW") {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) return;

  let whiteRating = DEFAULT_SYSTEM_ENGINE_RATING;
  let blackRating = DEFAULT_SYSTEM_ENGINE_RATING;

  const isWhiteAI = ["AI_VS_AI", "AI_VS_BOT", "AI_VS_HUMAN"].includes(game.mode);
  if (isWhiteAI && game.whiteBotId && game.whiteBotId !== "automated_website_engine_node") {
    const profile = await prisma.botProfile.findUnique({ where: { id: game.whiteBotId } });
    if (profile) whiteRating = (profile as any).aiElo ?? DEFAULT_SYSTEM_ENGINE_RATING;
  } else if (!isWhiteAI && game.whiteHumanId) {
    const profile = await prisma.user.findUnique({ where: { id: game.whiteHumanId } });
    if (profile) whiteRating = (profile as any).humanElo ?? DEFAULT_SYSTEM_ENGINE_RATING;
  }

  const isBlackAI = ["AI_VS_AI", "AI_VS_BOT", "HUMAN_VS_AI"].includes(game.mode);
  if (isBlackAI && game.blackBotId && game.blackBotId !== "automated_website_engine_node") {
    const profile = await prisma.botProfile.findUnique({ where: { id: game.blackBotId } });
    if (profile) blackRating = (profile as any).aiElo ?? DEFAULT_SYSTEM_ENGINE_RATING;
  } else if (!isBlackAI && game.blackHumanId) {
    const profile = await prisma.user.findUnique({ where: { id: game.blackHumanId } });
    if (profile) blackRating = (profile as any).humanElo ?? DEFAULT_SYSTEM_ENGINE_RATING;
  }

  let whiteOutcome = 0.5;
  let blackOutcome = 0.5;
  if (terminalStatus === "WHITE_WINS") { whiteOutcome = 1; blackOutcome = 0; }
  if (terminalStatus === "BLACK_WINS") { whiteOutcome = 0; blackOutcome = 1; }

  const whiteDelta = calculateEloDelta(whiteRating, blackRating, whiteOutcome);
  const blackDelta = calculateEloDelta(blackRating, whiteRating, blackOutcome);

  if (isWhiteAI && game.whiteBotId && game.whiteBotId !== "automated_website_engine_node") {
    await prisma.botProfile.update({ where: { id: game.whiteBotId }, data: { aiElo: Math.max(0, whiteRating + whiteDelta) } });
  } else if (!isWhiteAI && game.whiteHumanId) {
    await prisma.user.update({ where: { id: game.whiteHumanId }, data: { humanElo: Math.max(0, whiteRating + whiteDelta) } });
  }

  if (isBlackAI && game.blackBotId && game.blackBotId !== "automated_website_engine_node") {
    await prisma.botProfile.update({ where: { id: game.blackBotId }, data: { aiElo: Math.max(0, blackRating + blackDelta) } });
  } else if (!isBlackAI && game.blackHumanId) {
    await prisma.user.update({ where: { id: game.blackHumanId }, data: { humanElo: Math.max(0, blackRating + blackDelta) } });
  }
}

export async function POST(req: NextRequest) {
  try {
    const apiKeyString = req.headers.get("x-api-key");
    if (!apiKeyString) {
      return NextResponse.json({ error: "Missing x-api-key header token identifier." }, { status: 401 });
    }

    const keyRecord = await prisma.apiKey.findUnique({
      where: { key: apiKeyString },
      include: { botProfile: true }
    });

    if (!keyRecord || !keyRecord.isActive) {
      return NextResponse.json({ error: "Unauthorized or deactivated API configuration credential." }, { status: 403 });
    }

    const body = await req.json();
    const { gameId, from, to, promotion, move } = body;

    const game = await prisma.game.findUnique({ where: { id: gameId } });
    if (!game || game.status !== "ACTIVE") {
      return NextResponse.json({ error: "Target game session is not active or missing." }, { status: 400 });
    }

    const isBotWhite = game.whiteBotId === keyRecord.botProfileId;
    const isBotBlack = game.blackBotId === keyRecord.botProfileId;
    
    if ((game.activeTurn === "WHITE" && !isBotWhite) || (game.activeTurn === "BLACK" && !isBotBlack)) {
      return NextResponse.json({ error: "Out of turn sequence execution drop." }, { status: 400 });
    }

    const chess = new Chess();
    for (const step of game.moveHistory) chess.move(step);

    let finalMovePayload: any;
    if (move) {
      finalMovePayload = move;
    } else if (from && to) {
      finalMovePayload = { from, to, promotion: promotion || "q" };
    } else {
      return NextResponse.json({ error: "No recognizable move payload structure identified." }, { status: 400 });
    }

    try {
      chess.move(finalMovePayload);
    } catch {
      return NextResponse.json({ error: `Illegal move trajectory calculation: [${JSON.stringify(finalMovePayload)}]` }, { status: 400 });
    }

    let nextTurn: "WHITE" | "BLACK" = game.activeTurn === "WHITE" ? "BLACK" : "WHITE";
    let calculatedStatus: "ACTIVE" | "WHITE_WINS" | "BLACK_WINS" | "DRAW" = "ACTIVE";

    if (chess.isGameOver()) {
      calculatedStatus = chess.isCheckmate() ? (game.activeTurn === "WHITE" ? "WHITE_WINS" : "BLACK_WINS") : "DRAW";
    }

    if (calculatedStatus === "ACTIVE") {
      const nextBotId = nextTurn === "WHITE" ? game.whiteBotId : game.blackBotId;

      if (nextBotId === "automated_website_engine_node") {
        const systemLegalMoves = chess.moves();
        if (systemLegalMoves.length > 0) {
          const chosenSystemMove = systemLegalMoves[Math.floor(Math.random() * systemLegalMoves.length)];
          chess.move(chosenSystemMove);
          
          nextTurn = nextTurn === "WHITE" ? "BLACK" : "WHITE";
          
          if (chess.isGameOver()) {
            calculatedStatus = chess.isCheckmate() ? (nextTurn === "WHITE" ? "BLACK_WINS" : "WHITE_WINS") : "DRAW";
          }
        }
      }
    }

    const updatedGame = await prisma.game.update({
      where: { id: gameId },
      data: {
        currentFen: chess.fen(),
        activeTurn: nextTurn,
        status: calculatedStatus,
        moveHistory: { set: chess.history() }
      }
    });

    if (calculatedStatus !== "ACTIVE") {
      await processMatchEndRatings(gameId, calculatedStatus);
    }

    revalidatePath(`/game/${gameId}`);
    revalidatePath("/");

    return NextResponse.json({ 
      success: true, 
      fen: updatedGame.currentFen, 
      turn: updatedGame.activeTurn, 
      status: updatedGame.status,
      history: updatedGame.moveHistory
    });
  } catch (err: any) {
    console.error("API Engine Terminal Frame Failure Log:", err);
    return NextResponse.json({ error: err.message || "Internal execution matrix failure." }, { status: 500 });
  }
}