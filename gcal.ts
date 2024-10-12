const API_BASE_URL = "https://content.googleapis.com/calendar/v3";

export interface IGetCalendarEventsParams {
  /** Breakup recurring events into instances */
  singleEvents: boolean;
  /** ISO Date string */
  timeMin: Date;
  /** ISO Date string */
  timeMax: Date;
  /** Number of events to return */
  maxResults: number;
  /** Sort events by startTime or updated (last modification time) */
  orderBy: "startTime" | "updated";
}

export class GoogleCalendarClient {
  #calendarId: string;
  #apiKey: string | undefined;
  #serviceAccountKeyJson:
    | {
      private_key: string;
      client_email: string;
    }
    | undefined;

  constructor(
    options:
      | { calendarId: string; apiKey: string }
      | {
        calendarId: string;
        serviceAccountKeyJson: string;
      },
  ) {
    if ("serviceAccountKeyJson" in options) {
      const { calendarId, serviceAccountKeyJson } = options;
      this.#calendarId = calendarId;
      this.#serviceAccountKeyJson = JSON.parse(serviceAccountKeyJson);
    } else {
      const { calendarId, apiKey } = options;
      this.#calendarId = calendarId;
      this.#apiKey = apiKey;
    }
  }

  private async getAccessToken() {
    if (!this.#serviceAccountKeyJson) {
      throw new Error("Service Account Key JSON not provided.");
    }

    const { client_email, private_key } = this.#serviceAccountKeyJson;
    console.log(`Getting access token for ${client_email}`);

    const header = { alg: "RS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const claims = {
      iss: client_email,
      scope: "https://www.googleapis.com/auth/calendar.events.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    };

    const encodeBase64Url = (data: string): string => {
      return btoa(data)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
    };
    const base64UrlHeader = encodeBase64Url(JSON.stringify(header));
    const base64UrlClaims = encodeBase64Url(JSON.stringify(claims));
    const unsignedJwt = `${base64UrlHeader}.${base64UrlClaims}`;

    const b64 = private_key
      .replace(/-----\w+ PRIVATE KEY-----/g, "")
      .replace(/\n/g, "");
    const binary = atob(b64);
    const buffer = new ArrayBuffer(binary.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < binary.length; i++) {
      view[i] = binary.charCodeAt(i);
    }
    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      buffer,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      new TextEncoder().encode(unsignedJwt),
    );
    const signedJwt = `${unsignedJwt}.${
      encodeBase64Url(
        new Uint8Array(signature).reduce(
          (str, byte) => str + String.fromCharCode(byte),
          "",
        ),
      )
    }`;

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: signedJwt,
      }),
    });

    const tokenResponse = await response.json();
    return tokenResponse as {
      access_token: string;
      expires_in: number;
      token_type: string;
    };
  }

  public async getEvents({
    singleEvents,
    timeMax,
    timeMin,
    maxResults,
    orderBy,
  }: IGetCalendarEventsParams) {
    try {
      const calendarRequestParams: Record<string, string> = {
        singleEvents: singleEvents.toString(),
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        maxResults: `${maxResults}`,
        orderBy,
      };

      const calendarRequestHeaders: Record<string, string> = {
        Referer: "discord-events-sync",
      };

      if (this.#serviceAccountKeyJson) {
        const accessToken = await this.getAccessToken();
        calendarRequestHeaders[
          "Authorization"
        ] = `${accessToken.token_type} ${accessToken.access_token}`;
      } else if (this.#apiKey) {
        calendarRequestParams["key"] = this.#apiKey;
      }

      const calendarResponse = await fetch(
        `${API_BASE_URL}/calendars/${this.#calendarId}/events?${new URLSearchParams(calendarRequestParams).toString()}`,
        { headers: calendarRequestHeaders },
      );
      if (!calendarResponse.ok) {
        throw new Error(
          `Error getting events from Google Calendar API. Status: ${calendarResponse.status}. Response: ${await calendarResponse
            .text()}`,
        );
      }
      const parsed = await calendarResponse.json();
      return parsed;
    } catch (e) {
      console.error(`Error getting events from Google Calendar API.`);
      throw e;
    }
  }
}
