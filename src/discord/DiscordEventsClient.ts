/**
 * @file This file exposes a Discord events HTTP API client.
 */

import type { AxiosError } from "axios";
import {
  BaseDiscordClient,
  IBaseDiscordClientParams,
} from "./BaseDiscordClient";

export enum EventEntityType {
  STAGE_INSTANCE = 1,
  VOICE = 2,
  EXTERNAL = 3,
}

export enum EventStatus {
  SCHEDULED = 1,
  ACTIVE = 2,
  COMPLETED = 3,
  CANCELLED = 4,
}

export enum EventPrivacyLevel {
  GUILD_ONLY = 2,
}

export interface IEntityMetadata {
  /** Event location, present when {@link entity_type} is {@link EventEntityType.EXTERNAL} */
  location?: string;
}

export interface IDiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
}

export type ICreateEventRequestData = Pick<
  IEvent,
  | "channel_id"
  | "entity_metadata"
  | "name"
  | "privacy_level"
  | "scheduled_end_time"
  | "scheduled_start_time"
  | "description"
  | "entity_type"
>;

export type IPatchEventRequestData =
  & Pick<IEvent, "status">
  & ICreateEventRequestData;

export interface IEvent {
  /** the name of the scheduled event (1-100 characters) */
  name: string;
  /** the description of the scheduled event (1-1000 characters) */
  description: string;
  /** the privacy level of the scheduled event */
  privacy_level: EventPrivacyLevel;
  /** the time the scheduled event will start */
  scheduled_start_time: string;
  /** the time the scheduled event will end. Required when {@link entity_type} is {@link EventEntityType.EXTERNAL}. */
  scheduled_end_time: string | null;
  /** the type of the scheduled event. {@link EventEntityType} */
  entity_type: EventEntityType;
  /** the channel id in which the scheduled event will be hosted. Null when {@link entity_type} is {@link EventEntityType.EXTERNAL} */
  channel_id: string | null;
  /** additional metadata for the guild scheduled event */
  entity_metadata: IEntityMetadata | null;
  /** the id of the scheduled event */
  id: string;
  /** the guild id which the scheduled event belongs to */
  guild_id: string;
  /** the id of the user that created the scheduled event */
  creator_id: string;
  /** the status of the scheduled event. {@link EventStatus} */
  status: EventStatus;
  /** the id of an entity associated with a guild scheduled event */
  entity_id: string | null;
  /** the user that created the scheduled event */
  creator: IDiscordUser | null;
  /** the number of users subscribed to the scheduled event */
  user_count?: number;
}

export interface IGetEventUsersParams {
  limit?: number;
  with_member?: boolean;
  before?: string;
  after?: string;
}
export interface IEventUser {
  user: IDiscordUser;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  member?: any;
  guild_scheduled_event_id: string;
}

export type IGetEventUsersResponse = IEventUser[];

export type ICreateEventResponse = IEvent;

export type IPatchEventResponse = IEvent;

export type IDeleteEventResponse = Record<string, never>;

export interface IGetEventsParams {
  with_user_count?: boolean;
}

export interface ICreateEventParams {
  eventData: ICreateEventRequestData;
}

export interface IDeleteEventParams {
  id: string;
}

export interface IPatchEventParams {
  id: string;
  eventData: IPatchEventRequestData;
}

/**
 * Discord Events API Client.
 * Required Bot Permissions: MANAGE_EVENTS
 */
export class DiscordEventsClient extends BaseDiscordClient {
  public constructor(config: IBaseDiscordClientParams) {
    super({
      ...config,
      basePath: `/guilds/${config.guildId}/scheduled-events`,
      name: "DiscordEventsClient",
    });
  }

  /**
   * Get events on a Discord server.
   *
   * @throws Will throw error if HTTP request was not successful.
   * @param withUserCount Request number of "interested" users. Default response included user count. Set value to `false` to disable.
   * @returns Array of events if successful
   */
  public async getEvents<O extends IGetEventsParams>(
    params: O,
  ): Promise<
    O extends { withUserCount: false } ? Omit<IEvent, "user_count">[] : IEvent[]
  > {
    try {
      return (
        await this._apiClient.get<
          O extends { withUserCount: false } ? Omit<IEvent, "user_count">[]
            : IEvent[]
        >("", {
          params,
        })
      ).data;
    } catch (e) {
      this._logError(
        `Error getting events from discord. Response: ${
          JSON.stringify((e as AxiosError).response?.data)
        }`,
      );
      throw e;
    }
  }

  /**
   * Create event in the discord server.
   * @throws Will throw error if HTTP request was not successful.
   * @param params Event information
   * @returns Event data if successful
   */
  public async createEvent(
    params: ICreateEventParams,
  ): Promise<ICreateEventResponse> {
    const { eventData } = params;
    try {
      return (await this._apiClient.post<ICreateEventResponse>("", eventData))
        .data;
    } catch (e) {
      this._logError(
        `Error creating event in discord. Event information ${
          JSON.stringify(eventData)
        }. Response: ${
          JSON.stringify(
            (e as AxiosError).response?.data,
          )
        }`,
      );
      throw e;
    }
  }

  /**
   * Delete event in the discord server.
   * @throws Will throw error if HTTP request was not successful.
   * @param params Event ID to delete
   * @returns Blank response if successful. Status 204.
   */
  public async deleteEvent(
    params: IDeleteEventParams,
  ): Promise<IDeleteEventResponse> {
    const { id } = params;
    try {
      return (await this._apiClient.delete<IDeleteEventResponse>(id)).data;
    } catch (e) {
      this._logError(
        `Error deleting event in discord. Event id ${id}. Response: ${
          JSON.stringify((e as AxiosError).response?.data)
        }`,
      );
      throw e;
    }
  }

  /**
   * Patch event in the discord server.
   * @throws Will throw error if HTTP request was not successful.
   * @param params Event ID to patch and updated event information
   * @returns Event data if successful
   */
  public async patchEvent(
    params: IPatchEventParams,
  ): Promise<IPatchEventResponse> {
    const { id, eventData } = params;
    try {
      return (await this._apiClient.patch<IPatchEventResponse>(id, eventData))
        .data;
    } catch (e) {
      this._logError(
        `Error patching event in discord. Event id: ${id}. Event information: ${
          JSON.stringify(eventData)
        }. Response: ${(e as AxiosError).response?.data}`,
      );
      throw e;
    }
  }
}
