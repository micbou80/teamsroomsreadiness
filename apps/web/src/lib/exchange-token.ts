/**
 * Acquires an Exchange Online access token using the client credentials flow.
 * Uses the same Azure AD app registration (client ID / secret) as the main auth.
 *
 * Requires:
 *  - EXCHANGE_ENABLED=true in .env
 *  - Exchange.ManageAsApp application permission on the app registration
 *  - Exchange Administrator role assigned to the app's service principal
 */
export async function getExchangeToken(tenantId: string): Promise<string | null> {
  if (process.env.EXCHANGE_ENABLED !== 'true') {
    return null;
  }

  const clientId = process.env.AZURE_AD_CLIENT_ID;
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  try {
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://outlook.office365.com/.default',
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      console.warn(
        `[exchange-token] Failed to acquire Exchange token: ${response.status} ${response.statusText}`,
      );
      return null;
    }

    const data = await response.json();
    return data.access_token ?? null;
  } catch (error) {
    console.warn(
      `[exchange-token] Error acquiring Exchange token: ${error instanceof Error ? error.message : error}`,
    );
    return null;
  }
}
