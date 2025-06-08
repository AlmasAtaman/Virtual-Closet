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
    async session({ session, token }) {
      if (token?.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
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
