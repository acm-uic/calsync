/// <reference types="gapi.client.calendar" />

import axios, { AxiosError, AxiosInstance } from "axios";
import logger from "../util/logger";

export type ICalendarEvent = gapi.client.calendar.Event;
export type ICalendarEventDateTime = gapi.client.calendar.EventDateTime;
export type ICalendarEventsResponse = gapi.client.calendar.Events;

export interface IGoogleCalendarClientParams {
  apiKey: string;
  calendarId: string;
}

export interface IGetEventsParams {
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
  private _apiClient: AxiosInstance;
  private _apiKey: string;
  private _calendarId: string;

  public constructor({ calendarId, apiKey }: IGoogleCalendarClientParams) {
    this._apiKey = apiKey;
    this._calendarId = calendarId;
    this._apiClient = axios.create({ baseURL: "https://content.googleapis.com/calendar/v3" });
    this._apiClient.defaults.headers.common["Referer"] = "discord-events-sync";
    this._apiClient.defaults.params = {};
    this._apiClient.defaults.params["key"] = this._apiKey;
  }

  /**
   * Get events list for a specific calendar from google calendar api.
   * Events in the past and a year from "now" are filtered and recurring events are expanded into single events.
   * @throws Will throw error if HTTP request was not successful.
   * @returns Google Calendar Events
   */
  public async getEvents({
    singleEvents,
    timeMax,
    timeMin,
    maxResults,
    orderBy,
  }: IGetEventsParams): Promise<ICalendarEventsResponse> {
    try {
      const calendarRequestParams = {
        singleEvents: singleEvents.toString(),
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        maxResults: `${maxResults}`,
        orderBy,
      };
      const calendarResponse = (
        await this._apiClient.get<ICalendarEventsResponse>(`/calendars/${this._calendarId}/events`, {
          params: calendarRequestParams,
        })
      ).data;
      return calendarResponse;
    } catch (e) {
      logger.error(`Error getting events from Google Calendar API. Response: ${(e as AxiosError).response?.data}`, {
        service: "GoogleCalendarClient",
      });
      throw e;
    }
  }
}
