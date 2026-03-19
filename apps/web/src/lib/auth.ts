import NextAuth from 'next-auth';
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
      authorization: {
        url: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/authorize`,
        params: {
          scope: 'openid profile email offline_access User.Read.All Organization.Read.All Policy.Read.All Directory.Read.All MailboxSettings.Read DeviceManagementManagedDevices.Read.All',
        },
      },
      token: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/token`,
      userinfo: 'https://graph.microsoft.com/oidc/userinfo',
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Persist the access token and tenant ID from the initial sign-in
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.tenantId = String(account.provider_account_id ?? '').split('.')[1] ?? '';
      }
      return token;
    },
    async session({ session, token }) {
      // Expose tenant ID to the client (but NOT access tokens)
      session.tenantId = token.tenantId as string;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
});

// Extend session types
declare module 'next-auth' {
  interface Session {
    tenantId: string;
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    tenantId?: string;
  }
}
