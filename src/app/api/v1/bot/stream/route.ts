export const dynamic = 'force-dynamic';

import { NextRequest } from "next/server";
// Fixed: Added the 5th hop here as well to keep the stream aligned
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get("X-API-Key");

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing authentication header credentials." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const verifiedKey = await prisma.apiKey.findUnique({
    where: { key: apiKey },
    include: { botProfile: true },
  });

  if (!verifiedKey || !verifiedKey.isActive) {
    return new Response(JSON.stringify({ error: "Unauthorized node access credentials." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  await prisma.botProfile.update({
    where: { id: verifiedKey.botProfileId },
    data: { isOnline: true },
  });

  const encoder = new TextEncoder();
  const customStream = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ event: "connected", profile: verifiedKey.botProfile.username })}\n\n`)
      );

      const matchWatcher = setInterval(async () => {
        try {
          const currentBotId = verifiedKey.botProfileId;
          
          const activeGameMatch = await prisma.game.findFirst({
            where: {
              status: "ACTIVE",
              OR: [
                { whiteBotId: currentBotId, activeTurn: "WHITE" },
                { blackBotId: currentBotId, activeTurn: "BLACK" }
              ]
            }
          });

          if (activeGameMatch) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                event: "your_turn",
                game_id: activeGameMatch.id,
                fen: activeGameMatch.currentFen
              })}\n\n`)
            );
          } else {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ event: "heartbeat" })}\n\n`));
          }
        } catch (err) {
          console.error("Match stream tracking error:", err);
        }
      }, 3000);

      request.signal.addEventListener("abort", async () => {
        clearInterval(matchWatcher);
        try {
          await prisma.botProfile.update({
            where: { id: verifiedKey.botProfileId },
            data: { isOnline: false },
          });
        } catch (err) {
          console.error("Failed to disconnect node cleanly:", err);
        }
        controller.close();
      });
    },
  });

  return new Response(customStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}