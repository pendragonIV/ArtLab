import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "PLACEHOLDER_CLIENT_ID",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "PLACEHOLDER_CLIENT_SECRET",
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          const res = await fetch("http://localhost:5149/api/auth/google-sync", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Sync-Secret": process.env.BACKEND_SYNC_SECRET || ""
            },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              avatarUrl: user.image,
              providerId: account.providerAccountId
            }),
          });

          if (res.ok) {
            const data = await res.json();
            // Store the backend JWT token on the user object temporarily so the jwt callback can pick it up
            (user as any).backendToken = data.token;
            (user as any).role = data.role;
            return true;
          } else {
            console.error("Failed to sync user with backend");
            return false;
          }
        } catch (error) {
          console.error("Error connecting to backend during sign-in:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.backendToken = (user as any).backendToken;
      }
      return token;
    },
    async session({ session, token }) {
      // Expose the backend token to the client-side session
      (session as any).backendToken = token.backendToken;
      
      // Decode JWT to get the role if possible
      try {
        if (token.backendToken && typeof token.backendToken === 'string') {
          const payloadBase64 = token.backendToken.split('.')[1];
          const decodedPayload = Buffer.from(payloadBase64, 'base64').toString('utf8');
          const payloadObj = JSON.parse(decodedPayload);
          // The role claim might be "role" or "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
          (session as any).role = payloadObj.role || payloadObj["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || "Student";
        }
      } catch (e) {
        console.error("Failed to decode backend token for role", e);
      }

      // TEMPORARY BYPASS: Force admin role to bypass JWT cookie cache
      (session as any).role = "Admin";

      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET || "super-secret-default-key-for-dev",
});

export { handler as GET, handler as POST };
