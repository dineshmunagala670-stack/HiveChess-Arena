import NextAuth, { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { prisma } from "@/lib/prisma"; // ⚡ Absolute aliased path fix for Vercel

// 🔍 DIAGNOSTIC LOG: Alert shown in Vercel logs if parameters fail to link at runtime
if (!process.env.GITHUB_ID && !process.env.GITHUB_CLIENT_ID) {
  console.warn("⚠️ NextAuth Configuration Alert: Neither GITHUB_ID nor GITHUB_CLIENT_ID was detected in your active runtime environment variables.");
}

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      // ⚡ DUAL ENVIRONMENT KEY FALLBACK: Safely reads regular OR explicit client key styles
      clientId: process.env.GITHUB_ID || process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_SECRET || process.env.GITHUB_CLIENT_SECRET || "",
      // ⚡ SCOPE SECURITY UPGRADE: Forces access to check private emails, eliminating redirect-loops
      authorization: {
        params: {
          scope: "read:user user:email",
        },
      },
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) {
        console.error("Authentication rejected: Profile missing email address pointer.");
        return false;
      }
      
      try {
        // Safe database upsert matching the new progressive level track
        await prisma.user.upsert({
          where: { email: user.email },
          update: {
            name: user.name,
            avatarUrl: user.image,
          },
          create: {
            email: user.email,
            name: user.name,
            avatarUrl: user.image,
            githubId: user.id, 
            humanElo: 0, // ⚡ Progression System Reset: Fresh accounts start explicitly at 0 Elo!
          },
        });
        return true;
      } catch (dbError) {
        console.error("NextAuth Prisma Engine transaction crash during signIn:", dbError);
        return false; 
      }
    },
    async jwt({ token, user }) {
      // LIVE SESSION SYNC: Fetching on token refresh prevents cached/stale botProfile states
      if (token.email) {
        try {
          const databaseUserProfile = await prisma.user.findUnique({
            where: { email: token.email },
            include: { botProfile: true },
          });
          if (databaseUserProfile) {
            token.userId = databaseUserProfile.id;
            token.botProfile = databaseUserProfile.botProfile;
          }
        } catch (err) {
          console.error("JWT sync profile execution exception:", err);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session as any).userId = token.userId;
        (session as any).botProfile = token.botProfile;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/", 
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };