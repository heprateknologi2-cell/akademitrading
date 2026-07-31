import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import { db, users } from "@/lib/db";

declare module "next-auth" {
  interface User { tier?: string }
  interface Session { user: { id: string; email?: string | null; name?: string | null; image?: string | null; tier?: string } }
}

declare module "@auth/core/jwt" {
  interface JWT { id?: string; tier?: string }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = (credentials?.password as string) || "";
        if (!email) return null;

        let user: { id: number; email: string | null; name: string | null; tier: string | null; password: string | null } | undefined;
        try {
          const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
          user = rows[0];
        } catch {
          user = undefined;
        }

        if (user) {
          if (user.password && user.password !== password) return null;
          return {
            id: String(user.id),
            email: user.email || email,
            name: user.name || email.split("@")[0],
            tier: user.tier || "free",
          };
        }

        return {
          id: email,
          email,
          name: email.split("@")[0],
          tier: "free",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.id = user.id; token.tier = user.tier || "free"; }
      return token;
    },
    async session({ session, token }) {
      if (session.user) { session.user.id = token.id as string; session.user.tier = token.tier as string; }
      return session;
    },
  },
  pages: { signIn: "/auth/login" },
  session: { strategy: "jwt" },
});
