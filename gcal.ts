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
  #apiKey: string;

  constructor({ calendarId, apiKey }: { calendarId: string; apiKey: string }) {
    this.#calendarId = calendarId;
    this.#apiKey = apiKey;
  }

  public async getEvents(
    { singleEvents, timeMax, timeMin, maxResults, orderBy }: IGetCalendarEventsParams,
  ) {
    try {
      const calendarRequestParams = {
        singleEvents: singleEvents.toString(),
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        maxResults: `${maxResults}`,
        orderBy,
        key: this.#apiKey,
      };
      const calendarResponse = await fetch(
        `${API_BASE_URL}/calendars/${this.#calendarId}/events?${
          (new URLSearchParams(calendarRequestParams)).toString()
        }`,
        { headers: { Referer: "discord-events-sync" } },
      );
      const parsed = await calendarResponse.json();

      return parsed;
    } catch (e) {
      console.error(
        `Error getting events from Google Calendar API.`,
      );
      throw e;
    }
  }
}
