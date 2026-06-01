import NextAuth, { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { prisma } from "../../../../lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
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
        // Safe database upsert matching the current 0 Elo database model definitions
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
            githubId: user.id, // Stores cast string ID securely
            humanElo: 0,       // Synchronized platform baseline floor
          },
        });
        return true;
      } catch (dbError) {
        console.error("NextAuth Prisma Engine transaction crash during signIn:", dbError);
        return false; // Rejects authorization flow and appends ?error=AccessDenied
      }
    },
    async jwt({ token, user }) {
      if (user) {
        try {
          const databaseUserProfile = await prisma.user.findUnique({
            where: { email: token.email! },
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
    error: "/", // Gracefully redirects auth exceptions right back to your home card layout
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };