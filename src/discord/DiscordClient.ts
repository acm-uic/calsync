/**
 * @file This file exposes a discord client that can query and create events from a discord server.
 */

import axios, { AxiosInstance } from "axios";
import { DISCORD_API_BASE, DISCORD_SUPER_PROPERTIES } from "../config";
import logger from "../util/logger";

export enum DiscordEventEntityType {
  VOICE_CHANNEL = 2,
  SOMEWHERE_ELSE = 3,
}

export enum DiscordEventStatus {
  UPCOMING = 1,
  ONGOING = 2,
}

export interface IDiscordClientConfig {
  // TODO: add bot permissions to jsdoc. Permissions are currently unknown as the events api is not documented. It works with Administrator permissions.
  /** Discord bot token. */
  botToken: string;
  /** Guild / Server ID */
  guildId: string;
}

export interface IDiscordEvent {
  /** Unique event id. */
  id: string;
  /** Discord guild/server associated with the event. */
  guild_id: string;
  /** Voice channel id. Null when {@link entity_type} is VOICE_CHANNEL. */
  channel_id: string | null;
  /** Event name. */
  name: string;
  /** Event description. Null when description is empty. */
  description: string | null;
  /** TDB. Always seems to be null. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  image: any | null;
  /** Event start time in ISO Format. */
  scheduled_start_time: string;
  /** Event end time in ISO Format. Null when {@link entity_type} is VOICE_CHANNEL. */
  scheduled_end_time: string | null;
  /** TBD. Seems to always be 2. */
  privacy_level: number;
  /** Discord event status. {@link DiscordEventStatus} */
  status: DiscordEventStatus;
  /** Discord event type. {@link DiscordEventEntityType} */
  entity_type: DiscordEventEntityType;
  /** TBD. Seems to always be null. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entity_id: any | null;
  /** Discord event metadata. Describes event location when {@link entity_type} is SOMEWHERE_ELSE, null otherwise. */
  entity_metadata: {
    location: string;
  } | null;
  /** TDB. always seems to be an empty array. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sku_ids: any[];
  /** TDB. always seems to be an empty array. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  skus: any[];
}
export interface IDiscordEventWithUserCount extends IDiscordEvent {
  /** Available when passing with_user_count query string parameter. */
  user_count: number;
}

export type IDiscordCreateEventResponse = Omit<IDiscordEvent, "skus">;

export interface ICreateEventRequestData {
  /** Event name. */
  name: string;
  /** Event description. Null when description is empty. */
  description: string;
  /** TBD. Seems to always be 2 */
  privacy_level: number;
  /** Event start time in ISO Format. */
  scheduled_start_time: string;
  /** Event end time in ISO Format. Null when {@link entity_type} is VOICE_CHANNEL. */
  scheduled_end_time: string;
  /** Discord event type. {@link DiscordEventEntityType} */
  entity_type: DiscordEventEntityType;
  /** Voice channel id. Null when event_type is not 2 (voice channel) */
  channel_id: string | null;
  /** Discord event metadata. Describes event location when {@link entity_type} is SOMEWHERE_ELSE, null otherwise. */
  entity_metadata: {
    location: string;
  } | null;
}

export interface IGetEventsParams {
  withUserCount: boolean;
}

export class DiscordClient {
  private _config: IDiscordClientConfig;
  private _apiClient: AxiosInstance;

  public constructor(config: IDiscordClientConfig) {
    this._config = config;
    this._apiClient = axios.create({ headers: { Authorization: `bot ${this._config.botToken}` } });
  }

  /**
   * Get events on a Discord server.
   * @throws Will throw error if HTTP request was not successful.
   * @param withUserCount Request number of "interested" users.
   * @returns Array of events if successful
   */
  public async getEvents<O extends IGetEventsParams>(
    params: O
  ): Promise<O extends { withUserCount: true } ? IDiscordEventWithUserCount[] : IDiscordEvent[]> {
    try {
      return (
        await this._apiClient.get<O extends { withUserCount: true } ? IDiscordEventWithUserCount[] : IDiscordEvent[]>(
          `${DISCORD_API_BASE}/v9/guilds/${this._config.guildId}/events?with_user_count=${params.withUserCount}`,
          {
            headers: {
              // API does not seem to work without passing x-super-properties
              "x-super-properties": DISCORD_SUPER_PROPERTIES,
            },
          }
        )
      ).data;
    } catch (e) {
      logger.error(`Error getting events from discord. Error message: ${(e as Error).message}`);
      throw e;
    }
  }

  /**
   * Create event in the discord server.
   * Note: this API is currently not available to bots.
   * @see {@link https://support.discord.com/hc/en-us/community/posts/4410436617879-Scheduled-Events-Bot-API}
   * @throws Will throw error if HTTP request was not successful.
   * @param eventData Event information
   * @returns Event data if successful
   */
  public async createEvent(eventData: ICreateEventRequestData): Promise<IDiscordCreateEventResponse> {
    try {
      return (
        await this._apiClient.post<IDiscordCreateEventResponse>(
          `${DISCORD_API_BASE}/v9/guilds/${this._config.guildId}/events?with_user_count=true`,
          eventData,
          {
            headers: {
              // API does not seem to work without passing x-super-properties
              "x-super-properties": DISCORD_SUPER_PROPERTIES,
              "Content-Type": "application/json",
            },
          }
        )
      ).data;
    } catch (e) {
      logger.error(
        `Error creating event in discord. Event information ${JSON.stringify(eventData)}. Error message: ${
          (e as Error).message
        }`
      );
      throw e;
    }
  }
}
