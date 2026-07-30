import "next-auth";

declare module "next-auth" {
  interface User {
    tier?: string;
  }
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      tier?: string;
    }
  }
}
