/**
 * @file This file exposes a Discord HTTP API Client.
 */

import axios, { AxiosError, AxiosInstance } from "axios";
import { DISCORD_API_BASE, DISCORD_SUPER_PROPERTIES } from "../config";
import logger from "../util/logger";

export enum EventEntityType {
  STAGE_CHANNEL = 1,
  VOICE_CHANNEL = 2,
  SOMEWHERE_ELSE = 3,
}

export enum EventStatus {
  UPCOMING = 1,
  ONGOING = 2,
}

export interface IDiscordClientParams {
  /**
   * Discord auth header with appropriate permissions.
   * Bot headers look like: `Bot TOKEN_GOES_HERE`
   */
  authHeader: string;
  /** Guild / Server ID */
  guildId: string;
}

export interface ICreateEventRequestData {
  /** Event name. */
  name: string;
  /** Event description. Null when description is empty. */
  description: string;
  /** TBD. Seems to always be 2 */
  privacy_level: number;
  /** Event start time in ISO Format. */
  scheduled_start_time: string;
  /** Event end time in ISO Format. Null when {@link entity_type} is {@link EventEntityType.VOICE_CHANNEL}. */
  scheduled_end_time?: string | null;
  /** Discord event type. {@link EventEntityType} */
  entity_type: EventEntityType;
  /** Voice channel id. Null when {@link entity_type} is {@link EventEntityType.SOMEWHERE_ELSE} */
  channel_id: string | null;
  /** Discord event metadata. */
  entity_metadata?: {
    /** Event location, present when {@link entity_type} is {@link EventEntityType.SOMEWHERE_ELSE} */
    location?: string;
    /** , present when {@link entity_type} is {@link EventEntityType.STAGE_CHANNEL} */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    speaker_ids?: any[];
  } | null;
}

export interface IEvent extends ICreateEventRequestData {
  /** Unique event id. */
  id: string;
  /** Discord guild/server associated with the event. */
  guild_id: string;
  /** TDB. Always seems to be null. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  image: any | null;
  /** Discord event status. {@link EventStatus} */
  status: EventStatus;
  /** TBD. Seems to always be null. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entity_id: any | null;
  /** Discord event metadata. */
  /** TDB. always seems to be an empty array. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sku_ids: any[];
  /** TDB. always seems to be an empty array. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  skus: any[];
}
export interface IEventWithUserCount extends IEvent {
  /** Available when passing with_user_count query string parameter. */
  user_count: number;
}

export type ICreatePatchEventResponse = Omit<IEvent, "skus">;
export type IDeleteEventResponse = Record<string, never>;

export interface IGetEventsParams {
  withUserCount: boolean;
}

export interface ICreateEventParams {
  eventData: ICreateEventRequestData;
}

export interface IDeleteEventParams {
  id: string;
}

export interface IPatchEventParams extends ICreateEventParams {
  id: string;
}

export enum ChannelType {
  GUILD_VOICE = 2,
  GUILD_STAGE_VOICE = 13,
}

export interface IBaseChannel {
  id: string;
  type: number;
  name: string;
}

/**
 * Discord Events API Client
 *
 * @remarks
 * Discord events API is currently not publicly available, see {@link https://support.discord.com/hc/en-us/community/posts/4410436617879-Scheduled-Events-Bot-API}
 *
 * @public
 */
export class DiscordClient {
  private _config: IDiscordClientParams;
  private _apiClient: AxiosInstance;

  public constructor(config: IDiscordClientParams) {
    this._config = config;
    this._apiClient = axios.create({
      baseURL: `${DISCORD_API_BASE}/v9`,
    });
    this._apiClient.defaults.headers.common["Authorization"] = this._config.authHeader;
    this._apiClient.defaults.headers.common["x-super-properties"] = DISCORD_SUPER_PROPERTIES;
  }

  /**
   * Get events on a Discord server.
   * @throws Will throw error if HTTP request was not successful.
   * @param withUserCount Request number of "interested" users.
   * @returns Array of events if successful
   */
  public async getEvents<O extends IGetEventsParams>(
    params: O
  ): Promise<O extends { withUserCount: true } ? IEventWithUserCount[] : IEvent[]> {
    try {
      return (
        await this._apiClient.get<O extends { withUserCount: true } ? IEventWithUserCount[] : IEvent[]>(
          `/guilds/${this._config.guildId}/events?with_user_count=${params.withUserCount}`
        )
      ).data;
    } catch (e) {
      logger.error(`Error getting events from discord. Response: ${JSON.stringify((e as AxiosError).response?.data)}`);
      throw e;
    }
  }

  /**
   * Create event in the discord server.
   * Note: this API is currently not available to bots.
   * @throws Will throw error if HTTP request was not successful.
   * @param params Event information
   * @returns Event data if successful
   */
  public async createEvent(params: ICreateEventParams): Promise<ICreatePatchEventResponse> {
    const { eventData } = params;
    try {
      return (
        await this._apiClient.post<ICreatePatchEventResponse>(`/guilds/${this._config.guildId}/events`, eventData, {
          headers: {
            "Content-Type": "application/json",
          },
        })
      ).data;
    } catch (e) {
      logger.error(
        `Error creating event in discord. Event information ${JSON.stringify(eventData)}. Response: ${JSON.stringify(
          (e as AxiosError).response?.data
        )}`
      );
      throw e;
    }
  }

  /**
   * Delete event in the discord server.
   * Note: this API is currently not available to bots.
   * @throws Will throw error if HTTP request was not successful.
   * @param params Event ID to delete
   * @returns Blank response if successful
   */
  public async deleteEvent(params: IDeleteEventParams): Promise<IDeleteEventResponse> {
    const { id } = params;
    try {
      return (await this._apiClient.delete<IDeleteEventResponse>(`/guild-events/${id}`)).data;
    } catch (e) {
      logger.error(
        `Error deleting event in discord. Event id ${id}. Response: ${JSON.stringify((e as AxiosError).response?.data)}`
      );
      throw e;
    }
  }

  /**
   * Patch event in the discord server.
   * Note: this API is currently not available to bots.
   * @throws Will throw error if HTTP request was not successful.
   * @param params Event ID to patch and updated event information
   * @returns Event data if successful
   */
  public async patchEvent(params: IPatchEventParams): Promise<ICreatePatchEventResponse> {
    const { id, eventData } = params;
    try {
      return (
        await this._apiClient.patch<ICreatePatchEventResponse>(`/guild-events/${id}`, eventData, {
          headers: {
            "Content-Type": "application/json",
          },
        })
      ).data;
    } catch (e) {
      logger.error(
        `Error patching event in discord. Event id: ${id}. Event information: ${JSON.stringify(eventData)}. Response: ${
          (e as AxiosError).response?.data
        }`
      );
      throw e;
    }
  }

  /**
   * Get channels on a Discord server.
   * @throws Will throw error if HTTP request was not successful.
   * @returns Array of pruned channels (id, type) if successful
   */
  public async getChannels(): Promise<IBaseChannel[]> {
    try {
      return (await this._apiClient.get<IBaseChannel[]>(`/guild/${this._config.guildId}/channels`)).data.map(
        ({ id, type, name }): IBaseChannel => ({ id, type, name })
      );
    } catch (e) {
      logger.error(`Error getting channels from discord. Response: ${(e as AxiosError).response?.data}`);
      throw e;
    }
  }
}
