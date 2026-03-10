import { Client } from '@microsoft/microsoft-graph-client';

/**
 * Creates an authenticated Microsoft Graph client.
 * This must only be called from server-side code (API routes, server components).
 */
export function createGraphClient(accessToken: string): Client {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
}
