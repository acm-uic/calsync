/**
 * @file Discord REST API base client
 */

import axios, { AxiosError, AxiosInstance } from "axios";
import logger from "../util/logger";

/** Discord API base URL. */
const DISCORD_API_BASE_URL = "https://discord.com/api/v10";

export interface IBaseDiscordClientParams {
  /** Discord bot token with appropriate permissions. */
  botToken: string;
  /** Guild / Server ID */
  guildId: string;
  /** Base path of endpoint */
  basePath?: string;
  /** Name of client (for logging) */
  name?: string;
}

/**
 * Discord API client base class.
 */
export abstract class BaseDiscordClient {
  protected _config: IBaseDiscordClientParams;
  protected _apiClient: AxiosInstance;

  public constructor(config: IBaseDiscordClientParams) {
    this._config = config;
    this._apiClient = axios.create({
      baseURL: `${DISCORD_API_BASE_URL}${this._config.basePath}`,
    });
    this._apiClient.defaults.headers.common["Content-Type"] =
      "application/json";
    this._apiClient.defaults.headers.common["Authorization"] =
      `Bot ${this._config.botToken}`;
    this._apiClient.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const rateLimitResetAfter = error?.response?.headers
          ?.["x-ratelimit-reset-after"];
        const status = error?.response?.status;
        const config = error?.config;
        if (
          status === 429 && config !== undefined &&
          rateLimitResetAfter !== undefined
        ) {
          logger.warn(
            `Request rate limited. Retrying after ${rateLimitResetAfter} seconds.`,
          );
          await new Promise((resolve) =>
            setTimeout(resolve, parseFloat(rateLimitResetAfter) * 1000 + 1000)
          );
          return this._apiClient.request(error.config);
        } else {
          throw error;
        }
      },
    );
  }

  protected _logError(message: string) {
    logger.error(message, { service: this._config.name });
  }
}
