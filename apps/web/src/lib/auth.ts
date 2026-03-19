import NextAuth from 'next-auth';
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';

const AZURE_AD_SCOPES =
  'openid profile email offline_access User.Read.All Organization.Read.All Policy.Read.All Directory.Read.All MailboxSettings.Read DeviceManagementManagedDevices.Read.All DeviceManagementApps.Read.All DeviceManagementConfiguration.Read.All DeviceLocalCredential.ReadBasic.All Place.Read.All';

/**
 * Use the refresh token to obtain a new access token from Microsoft Entra ID.
 * Returns the updated token fields on success, or an error marker on failure.
 */
async function refreshAccessToken(token: Record<string, unknown>): Promise<Record<string, unknown>> {
  const tenantId = process.env.AZURE_AD_TENANT_ID;
  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: process.env.AZURE_AD_CLIENT_ID!,
    client_secret: process.env.AZURE_AD_CLIENT_SECRET!,
    refresh_token: token.refreshToken as string,
    scope: AZURE_AD_SCOPES,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    console.error('Failed to refresh access token:', data);
    // Clear tokens so downstream code returns a clean 401 instead of silently failing
    return {
      ...token,
      accessToken: undefined,
      refreshToken: undefined,
      expiresAt: undefined,
      error: 'RefreshTokenError',
    };
  }

  return {
    ...token,
    accessToken: data.access_token as string,
    refreshToken: (data.refresh_token as string) ?? token.refreshToken, // Microsoft may or may not rotate
    expiresAt: Math.floor(Date.now() / 1000) + (data.expires_in as number),
    error: undefined,
  };
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
      authorization: {
        url: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/authorize`,
        params: {
          scope: AZURE_AD_SCOPES,
        },
      },
      token: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/token`,
      userinfo: 'https://graph.microsoft.com/oidc/userinfo',
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist the access token and tenant ID from the initial sign-in
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        // Extract tenant ID from the id_token tid claim, or from the issuer URL
        const tid = (profile as any)?.tid
          ?? (account as any)?.tid
          ?? String(account.provider_account_id ?? '').split('.')[1]
          ?? process.env.AZURE_AD_TENANT_ID
          ?? '';
        token.tenantId = tid;
        return token;
      }

      // On subsequent requests, refresh the access token if it is expired or
      // within 60 seconds of expiry.
      const expiresAt = token.expiresAt as number | undefined;
      const bufferSeconds = 60;
      if (expiresAt && Date.now() / 1000 >= expiresAt - bufferSeconds) {
        if (token.refreshToken) {
          return await refreshAccessToken(token);
        }
        // No refresh token available — clear access token for a clean re-auth
        token.accessToken = undefined;
        token.expiresAt = undefined;
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
    error?: string;
  }
}
