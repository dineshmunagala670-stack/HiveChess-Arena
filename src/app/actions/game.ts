"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Chess } from "chess.js";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { prisma } from "../../lib/prisma";

const MOVE_INCREMENT_BONUS = 2;
const K_FACTOR = 32;

function calculateEloDelta(playerRating: number, opponentRating: number, outcomeScore: number): number {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  return Math.round(K_FACTOR * (outcomeScore - expectedScore));
}

async function processMatchEndRatings(gameId: string, terminalStatus: "WHITE_WINS" | "BLACK_WINS" | "DRAW") {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) return;

  // ⚡ PROGRESSION SYSTEM UPDATE: Base entry levels reset strictly to 0 Elo
  let whiteRating = 0;
  let blackRating = 0;

  const isWhiteAI = ["AI_VS_AI", "AI_VS_BOT", "AI_VS_HUMAN"].includes(game.mode);
  if (isWhiteAI && game.whiteBotId && game.whiteBotId !== "automated_website_engine_node") {
    const profile = await prisma.botProfile.findUnique({ where: { id: game.whiteBotId } });
    if (profile) whiteRating = (profile as any).aiElo ?? 0;
  } else if (!isWhiteAI && game.whiteHumanId) {
    const profile = await prisma.user.findUnique({ where: { id: game.whiteHumanId } });
    if (profile) whiteRating = (profile as any).humanElo ?? 0;
  }

  const isBlackAI = ["AI_VS_AI", "AI_VS_BOT", "HUMAN_VS_AI"].includes(game.mode);
  if (isBlackAI && game.blackBotId && game.blackBotId !== "automated_website_engine_node") {
    const profile = await prisma.botProfile.findUnique({ where: { id: game.blackBotId } });
    if (profile) blackRating = (profile as any).aiElo ?? 0;
  } else if (!isBlackAI && game.blackHumanId) {
    const profile = await prisma.user.findUnique({ where: { id: game.blackHumanId } });
    if (profile) blackRating = (profile as any).humanElo ?? 0;
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

export async function createGameRoom(
  mode: "AI_VS_AI" | "AI_VS_BOT" | "AI_VS_HUMAN" | "HUMAN_VS_AI" | "HUMAN_VS_HUMAN" | "HUMAN_VS_COMPUTER",
  timeControl: "INFINITE" | "BULLET" | "BLITZ" | "RAPID" = "INFINITE"
) {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).userId) throw new Error("Unauthenticated request setup.");
  const userId = (session as any).userId;

  const userProfile = await prisma.user.findUnique({
    where: { id: userId },
    include: { botProfile: true }
  });

  const botProfileId = userProfile?.botProfile?.id || null;

  let durationSeconds = 0;
  if (timeControl === "BULLET") durationSeconds = 60;
  if (timeControl === "BLITZ") durationSeconds = 180;
  if (timeControl === "RAPID") durationSeconds = 600;

  // ⚔️ LOBBY 1: Human (You White) vs Another Dev's AI Engine (Black)
  if (mode === "HUMAN_VS_AI") {
    const openBotLobby = await prisma.game.findFirst({
      where: { mode: "HUMAN_VS_AI", status: "MATCHMAKING", whiteHumanId: null, blackBotId: { not: null } }
    });

    if (openBotLobby) {
      await prisma.game.update({
        where: { id: openBotLobby.id },
        data: { whiteHumanId: userId, status: "ACTIVE" }
      });
      return openBotLobby.id;
    } else {
      const game = await prisma.game.create({
        data: { mode, timeControl, whiteTime: durationSeconds, blackTime: durationSeconds, status: "MATCHMAKING", whiteHumanId: userId, blackBotId: null, activeTurn: "WHITE" }
      });
      return game.id;
    }
  }

  // 🧠 LOBBY 2: Your AI Engine (White) vs Another Dev (Human Black)
  if (mode === "AI_VS_HUMAN") {
    if (!botProfileId) throw new Error("Please configure a Bot Profile username first before hosting an AI lobby.");

    const openHumanLobby = await prisma.game.findFirst({
      where: { mode: "AI_VS_HUMAN", status: "MATCHMAKING", whiteBotId: null, blackHumanId: { not: null } }
    });

    if (openHumanLobby) {
      await prisma.game.update({
        where: { id: openHumanLobby.id },
        data: { whiteBotId: botProfileId, status: "ACTIVE" }
      });
      return openHumanLobby.id;
    } else {
      const game = await prisma.game.create({
        data: { mode, timeControl, whiteTime: durationSeconds, blackTime: durationSeconds, status: "MATCHMAKING", whiteBotId: botProfileId, blackHumanId: null, activeTurn: "WHITE" }
      });
      return game.id;
    }
  }

  // ⚡ LOBBY 3: AI Engine vs AI Engine (Global Bot Arena Lobby)
  if (mode === "AI_VS_AI") {
    if (!botProfileId) throw new Error("Please configure a Bot Profile username first before joining the AI vs AI Arena.");

    const openBotArenaLobby = await prisma.game.findFirst({
      where: { mode: "AI_VS_AI", status: "MATCHMAKING", whiteBotId: { not: botProfileId }, blackBotId: null }
    });

    if (openBotArenaLobby) {
      await prisma.game.update({
        where: { id: openBotArenaLobby.id },
        data: { blackBotId: botProfileId, status: "ACTIVE" }
      });
      return openBotArenaLobby.id;
    } else {
      const game = await prisma.game.create({
        data: { mode, timeControl, whiteTime: durationSeconds, blackTime: durationSeconds, status: "MATCHMAKING", whiteBotId: botProfileId, blackBotId: null, activeTurn: "WHITE" }
      });
      return game.id;
    }
  }

  // Pure Offline Sandbox Practice fallbacks
  let whiteBotId: string | null = null;
  let blackBotId: string | null = null;
  let whiteHumanId: string | null = null;
  let blackHumanId: string | null = null;

  if (mode === "HUMAN_VS_COMPUTER") { whiteHumanId = userId; blackBotId = "automated_website_engine_node"; }
  else if (mode === "AI_VS_BOT") { whiteBotId = botProfileId; blackBotId = "automated_website_engine_node"; }

  const game = await prisma.game.create({
    data: { mode, timeControl, whiteTime: durationSeconds, blackTime: durationSeconds, status: "ACTIVE", whiteBotId, blackBotId, whiteHumanId, blackHumanId, activeTurn: "WHITE" }
  });

  revalidatePath("/");
  return game.id;
}

export async function submitHumanMove(gameId: string, movePayload: any) {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game || game.status !== "ACTIVE") throw new Error("Inactive game session state.");

  const chess = new Chess();
  for (const step of game.moveHistory) chess.move(step);
  try { chess.move(movePayload); } catch { throw new Error("Illegal movement trajectory setup."); }

  const elapsedSeconds = game.moveHistory.length === 0 
    ? 0 
    : Math.floor((Date.now() - new Date(game.updatedAt).getTime()) / 1000);

  let nextWhiteTime = game.whiteTime;
  let nextBlackTime = game.blackTime;
  let status: any = game.status;

  if (game.timeControl !== "INFINITE") {
    if (game.activeTurn === "WHITE") {
      nextWhiteTime = Math.max(0, game.whiteTime - elapsedSeconds) + MOVE_INCREMENT_BONUS;
      if (nextWhiteTime - MOVE_INCREMENT_BONUS <= 0) status = "BLACK_WINS";
    } else {
      nextBlackTime = Math.max(0, game.blackTime - elapsedSeconds) + MOVE_INCREMENT_BONUS;
      if (nextBlackTime - MOVE_INCREMENT_BONUS <= 0) status = "WHITE_WINS";
    }
  }

  if (status === "ACTIVE" && chess.isGameOver()) {
    status = chess.isCheckmate() ? (game.activeTurn === "WHITE" ? "WHITE_WINS" : "BLACK_WINS") : "DRAW";
  }

  await prisma.game.update({
    where: { id: gameId },
    data: {
      currentFen: chess.fen(),
      activeTurn: game.activeTurn === "WHITE" ? "BLACK" : "WHITE",
      status: status as any,
      whiteTime: nextWhiteTime,
      blackTime: nextBlackTime,
      moveHistory: { set: chess.history() }
    }
  });

  if (status !== "ACTIVE") {
    await processMatchEndRatings(gameId, status);
  }

  revalidatePath(`/game/${gameId}`);
}

export async function triggerComputerResponse(gameId: string) {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game || game.status !== "ACTIVE" || game.activeTurn !== "BLACK") return;

  const chess = new Chess();
  for (const step of game.moveHistory) chess.move(step);

  const legalMoves = chess.moves();
  if (legalMoves.length === 0) return;

  chess.move(legalMoves[Math.floor(Math.random() * legalMoves.length)]);

  const elapsedSeconds = game.moveHistory.length === 0
    ? 0
    : Math.floor((Date.now() - new Date(game.updatedAt).getTime()) / 1000);
    
  let nextBlackTime = game.blackTime;
  let status: any = game.status;

  if (game.timeControl !== "INFINITE") {
    nextBlackTime = Math.max(0, game.blackTime - elapsedSeconds) + MOVE_INCREMENT_BONUS;
    if (nextBlackTime - MOVE_INCREMENT_BONUS <= 0) status = "WHITE_WINS";
  }

  if (status === "ACTIVE" && chess.isGameOver()) {
    status = chess.isCheckmate() ? "BLACK_WINS" : "DRAW";
  }

  await prisma.game.update({
    where: { id: gameId },
    data: {
      currentFen: chess.fen(),
      activeTurn: "WHITE",
      status: status as any,
      blackTime: nextBlackTime,
      moveHistory: { set: chess.history() }
    }
  });

  if (status !== "ACTIVE") {
    await processMatchEndRatings(gameId, status);
  }

  revalidatePath(`/game/${gameId}`);
}

export async function abortActiveMatch(gameId: string) {
  try {
    await prisma.game.delete({ where: { id: gameId } });
  } catch (err) {
    console.error("Supabase record delete error:", err);
  }
  revalidatePath("/");
  redirect("/");
}

export async function claimMatchDraw(gameId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized action request.");

  try {
    await processMatchEndRatings(gameId, "DRAW");
    await prisma.game.delete({ where: { id: gameId } });
  } catch (err) {
    console.error("Supabase record delete error:", err);
  }
  revalidatePath("/");
  redirect("/"); 
}