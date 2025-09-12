import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import jwt from "jsonwebtoken";
import { JWT } from "next-auth/jwt";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      // Initial sign in - store the Google access token
      if (account && user) {
        token.accessToken = account.access_token;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      if (token?.sub) {
        session.user.id = token.sub;
        session.accessToken = token.accessToken;
      }
      return session;
    },
    async redirect({ baseUrl }) {
      // Always redirect to the dashboard after successful sign-in
      return baseUrl + '/dashboard';
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    encode: async ({ token, secret }) => {
      if (!token) {
        throw new Error("Token is undefined during encoding.");
      }
      return jwt.sign(token, secret);
    },
    decode: async ({ token, secret }): Promise<JWT | null> => {
      if (!token) {
        return null;
      }
      try {
        const decoded = jwt.verify(token, secret);

        if (typeof decoded === 'string') {
          return null;
        }

        const payload = decoded as jwt.JwtPayload;

        const customJwt: JWT = {
          ...payload,
          id: payload.sub as string,
          sub: payload.sub as string,
          accessToken: payload.accessToken as string,
        };
        return customJwt;

      } catch (error) {
        console.error("JWT Decode Error:", error);
        return null;
      }
    },
  },
});

export { handler as GET, handler as POST };