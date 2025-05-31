import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { login } from "./actions/auth/login-server-action";
import { validateJwtToken } from "./lib/jwt-token";
import { logoutServerAction } from "./actions/auth/logout-server-action";

// Static credentials for demo purposes
const VALID_USERNAME = "admin";
const VALID_PASSWORD = "password123";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "admin" },
        password: { label: "Password", type: "password", placeholder: "password123" }
      },
      async authorize(credentials) {
        console.log("Authorize called with:", credentials);
        
        // Validate credentials presence
        if (!credentials?.username || !credentials?.password) {
          console.error("Missing username or password");
          return null;
        }
        
        const loginResponse = await login(credentials.username, credentials.password);
        // Static validation
        if (loginResponse?.data?.access_token && loginResponse?.data?.refresh_token) {
          console.log("Credentials valid, returning user");
          return {
            id: "1",
            name: VALID_USERNAME,
            username: VALID_USERNAME,
            email: `${VALID_USERNAME}@example.com`,
            accessToken: loginResponse?.data?.access_token,
            refreshToken: loginResponse?.data?.refresh_token
          };
        }
        
        console.error("Invalid credentials");
        return null;
      }
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      console.log("Redirect callback - url:", url, "baseUrl:", baseUrl);
      
      // Handle relative URLs (like /aboutme)
      if (url.startsWith("/")) {
        const redirectUrl = `${baseUrl}${url}`;
        console.log("Relative URL, redirecting to:", redirectUrl);
        return redirectUrl;
      }
      
      // Handle same origin URLs
      try {
        const urlObj = new URL(url);
        const baseUrlObj = new URL(baseUrl);
        
        if (urlObj.origin === baseUrlObj.origin) {
          console.log("Same origin URL, redirecting to:", url);
          return url;
        }
      } catch (error) {
        console.error("Error parsing URLs:", error);
      }
      
      // Default fallback to /aboutme
      const fallbackUrl = `${baseUrl}/aboutme`;
      console.log("Fallback, redirecting to:", fallbackUrl);
      return fallbackUrl;
    },

    async jwt({ token, user }) {
      console.log("JWT callback - token:", token, "user:", user);
      
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
        token.name = user.name ?? "test";
        token.email = user.email ?? "Test";
        token.accessToken = user.accessToken ?? "";
        token.refreshToken = user.refreshToken ?? "";
      }
      
      return token;
    },

    async session({ session, token }) {
      console.log(`<===================[session 96]===================>`)
      console.log("Session callback - session:", session, "token:", token);
      const isValidToken = await validateJwtToken(token.accessToken as string)
      console.log("isValidToken:", isValidToken)
      // if(!isValidToken){
      //   return logoutServerAction()
      // }
      // Send properties to the client
      session.user.id = token.id as string;
      session.user.username = token.username as string;
      session.user.image = "https://avatars.githubusercontent.com/u/10804532?s=400&u=5c8037219381146b169091776c4100635b9b7661&v=4"
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      return session;
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

// The route handler for NextAuth.js
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };