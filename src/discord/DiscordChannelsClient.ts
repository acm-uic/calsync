/**
 * @file This file exposes a Discord guild channels HTTP API client.
 */

import type { AxiosError } from "axios";
import { BaseDiscordClient, IBaseDiscordClientParams } from "./BaseDiscordClient";

export enum ChannelType {
  GUILD_VOICE = 2,
  GUILD_STAGE_VOICE = 13,
}

export interface IBaseChannel {
  id: string;
  type: ChannelType;
  name: string;
}

/**
 * Discord channels API Client
 * Required Bot Permissions: VIEW_CHANNEL
 */
export class DiscordChannelsClient extends BaseDiscordClient {
  public constructor(config: IBaseDiscordClientParams) {
    super({ ...config, basePath: `/guilds/${config.guildId}/channels`, name: "DiscordChannelsClient" });
  }

  /**
   * Get channels on a Discord server.
   * @throws Will throw error if HTTP request was not successful.
   * @returns Array of pruned channels (id, type) if successful
   */
  public async getChannels(): Promise<IBaseChannel[]> {
    try {
      return (await this._apiClient.get<IBaseChannel[]>("")).data.map(
        ({ id, type, name }): IBaseChannel => ({ id, type, name })
      );
    } catch (e) {
      this._logError(
        `Error getting channels from discord. Response: ${JSON.stringify((e as AxiosError).response?.data)}`
      );
      throw e;
    }
  }
}
