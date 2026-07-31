import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

declare module "next-auth" {
  interface User { tier?: string }
  interface Session { user: { id: string; email?: string | null; name?: string | null; image?: string | null; tier?: string } }
}

declare module "@auth/core/jwt" {
  interface JWT { id?: string; tier?: string }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        name: { label: "Nama", type: "text" },
        tier: { label: "Tier", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        if (!email) return null;
        return {
          id: email,
          email,
          name: (credentials?.name as string) || email.split("@")[0],
          tier: (credentials?.tier as string) || "free",
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
