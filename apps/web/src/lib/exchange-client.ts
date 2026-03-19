/**
 * Exchange Online REST API client for Get-CalendarProcessing.
 *
 * Uses the same REST endpoint that the Exchange Online Management v3 module
 * calls under the hood: POST /adminapi/beta/{tenantId}/InvokeCommand
 */

export interface CalendarProcessingResult {
  identity: string;
  automateProcessing: string;
  deleteComments: boolean;
  deleteSubject: boolean;
  addOrganizerToSubject: boolean;
  removePrivateProperty: boolean;
  processExternalMeetingMessages: boolean;
}

/**
 * Fetch calendar processing settings for a room mailbox via the Exchange
 * Online Admin REST API.
 *
 * Returns null on any error (permissions, network, bad identity, etc.)
 * so the caller can fall back to the pending / manual-upload path.
 */
export async function getCalendarProcessing(
  exchangeToken: string,
  tenantId: string,
  roomUpn: string,
): Promise<CalendarProcessingResult | null> {
  try {
    const url = `https://outlook.office365.com/adminapi/beta/${tenantId}/InvokeCommand`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${exchangeToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        CmdletInput: {
          CmdletName: 'Get-CalendarProcessing',
          Parameters: { Identity: roomUpn },
        },
      }),
    });

    if (!response.ok) {
      console.warn(
        `[exchange-client] Get-CalendarProcessing failed for ${roomUpn}: ${response.status} ${response.statusText}`,
      );
      return null;
    }

    const data = await response.json();

    // The EXO REST API returns the cmdlet output in a `value` array
    const result = Array.isArray(data.value) ? data.value[0] : data;
    if (!result) return null;

    return {
      identity: roomUpn,
      automateProcessing: String(result.AutomateProcessing ?? ''),
      deleteComments: Boolean(result.DeleteComments),
      deleteSubject: Boolean(result.DeleteSubject),
      addOrganizerToSubject: Boolean(result.AddOrganizerToSubject),
      removePrivateProperty: Boolean(result.RemovePrivateProperty),
      processExternalMeetingMessages: Boolean(result.ProcessExternalMeetingMessages),
    };
  } catch (error) {
    console.warn(
      `[exchange-client] Error querying calendar processing for ${roomUpn}: ${error instanceof Error ? error.message : error}`,
    );
    return null;
  }
}
