"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * Securely generates a brand new API key for the authenticated developer node
 */
export async function generateApiKey() {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).userId || !(session as any).botProfile) {
    throw new Error("Unauthenticated configuration adjustment request.");
  }

  const userId = (session as any).userId;
  const botProfileId = (session as any).botProfile.id;

  // Revoke any existing active keys first to enforce a single-token architecture
  await prisma.apiKey.updateMany({
    where: { botProfileId, isActive: true },
    data: { isActive: false },
  });

  // Generate a secure, high-entropy 32-byte cryptographic token string
  const secureToken = `hc_live_${crypto.randomBytes(24).toString("hex")}`;

  // Persist the new key straight down to Supabase via Prisma 7
  await prisma.apiKey.create({
    data: {
      key: secureToken,
      userId,
      botProfileId,
      isActive: true,
    },
  });

  // Purge the Next.js data cache to instantly update the Bento Grid UI layout state
  revalidatePath("/");
}

/**
 * Deactivates all active API tokens for the current developer node instantly blocking API routing access
 */
export async function revokeApiKeys() {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).botProfile) {
    throw new Error("Unauthenticated configuration adjustment request.");
  }

  const botProfileId = (session as any).botProfile.id;

  await prisma.apiKey.updateMany({
    where: { botProfileId, isActive: true },
    data: { isActive: false },
  });

  // Take the bot profile offline instantly upon key revocation
  await prisma.botProfile.update({
    where: { id: botProfileId },
    data: { isOnline: false },
  });

  revalidatePath("/");
}