import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import crypto from "crypto";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { prisma } from "../../../../../lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized access token request." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { botProfile: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User profile node not found." }, { status: 404 });
    }

    let botProfile = user.botProfile;

    if (!botProfile) {
      const defaultUsername = `bot_${user.id.substring(0, 8)}_${Math.floor(Math.random() * 1000)}`;
      botProfile = await prisma.botProfile.create({
        data: {
          userId: user.id,
          username: defaultUsername,
          aiElo: 0,
        }
      });
    }

    const generatedKey = "hive_" + crypto.randomBytes(24).toString("hex");

    await prisma.apiKey.create({
      data: {
        key: generatedKey,
        userId: user.id,
        botProfileId: botProfile.id,
        isActive: true
      }
    });

    return NextResponse.json({ key: generatedKey });
  } catch (err: any) {
    console.error("API Key Generation Engine Failure:", err);
    return NextResponse.json({ error: err.message || "Internal network system error." }, { status: 500 });
  }
}