import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username?: string;
      name?: string;
      email?: string;
    };
    accessToken?: string;
    refreshToken?: string;
    error?: string;
    expiresAt?: number;
    newAccessToken?: string;
    newRefreshToken?: string;
  }

  interface User {
    id: string;
    username?: string;
    accessToken?: string;
    refreshToken?: string;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username?: string;
    name?: string;
    email?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    error?: string;
  }
}