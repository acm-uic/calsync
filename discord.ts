import {
  BaseChannel,
  CreateEventParams,
  CreateEventResponse,
  DeleteEventParams,
  DeleteEventResponse,
  DiscordEvent,
  GetDiscordEventsParams,
  PatchEventParams,
  PatchEventResponse,
} from "./interfaces.ts";

/** Discord API base URL. */
const DISCORD_API_BASE_URL = "https://discord.com/api/v10";

type DiscordFetchParams = {
  endpoint: string;
  method?: string;
  // deno-lint-ignore no-explicit-any
  body?: any;
  headers?: Record<string, string>;
};

/**
 * Discord Events API Client.
 * Required Bot Permissions: MANAGE_EVENTS
 */
export class DiscordClient {
  #guildId: string;
  #botToken: string;

  constructor({ guildId, botToken }: { guildId: string; botToken: string }) {
    this.#guildId = guildId;
    this.#botToken = botToken;
  }

  async #fetch({ endpoint, method, body, headers }: DiscordFetchParams): Promise<Response> {
    const res = await fetch(`${DISCORD_API_BASE_URL}${endpoint}`, {
      method,
      body: JSON.stringify(body),
      headers: {
        Authorization: `Bot ${this.#botToken}`,
        "Content-Type": "application/json",
        ...headers,
      },
    });
    if (res.status === 429) {
      const retryAfter = res.headers.get("x-ratelimit-reset-after");
      if (retryAfter) {
        await new Promise((resolve) => setTimeout(resolve, parseFloat(retryAfter) * 1000 + 1000));
        return this.#fetch({ endpoint, method, body, headers });
      } else {
        throw new Error("Discord Response Error");
      }
    }
    return res;
  }

  /**
   * Get events on a Discord server.
   *
   * @throws Will throw error if HTTP request was not successful.
   * @param params Used to generate query params for Discord API request.
   * @returns Array of events if successful
   */
  public async getEvents<O extends GetDiscordEventsParams>(
    params: O,
  ): Promise<
    O extends { withUserCount: "false" } ? Omit<DiscordEvent, "user_count">[] : DiscordEvent[]
  > {
    try {
      const res = await this.#fetch({
        endpoint: `/guilds/${this.#guildId}/scheduled-events?${(new URLSearchParams(params)).toString()}`,
      });
      const parsed = await res.json() as O extends { withUserCount: "false" } ? Omit<DiscordEvent, "user_count">[]
        : DiscordEvent[];

      return parsed;
    } catch (e) {
      console.error(
        `Error getting events from discord`,
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
    params: CreateEventParams,
  ): Promise<CreateEventResponse> {
    const { eventData } = params;
    try {
      const res = await this.#fetch({
        endpoint: `/guilds/${this.#guildId}/scheduled-events`,
        body: eventData,
        method: "POST",
      });
      const parsed = await res.json() as CreateEventResponse;

      return parsed;
    } catch (e) {
      console.error(
        `Error creating event in discord.`,
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
    params: DeleteEventParams,
  ): Promise<DeleteEventResponse> {
    const { id } = params;
    try {
      await this.#fetch({
        endpoint: `/guilds/${this.#guildId}/scheduled-events/${id}`,
        method: "DELETE",
      });

      return {};
    } catch (e) {
      console.error(
        `Error deleting event in discord.`,
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
    params: PatchEventParams,
  ): Promise<PatchEventResponse> {
    const { id, eventData } = params;
    try {
      const res = await this.#fetch({
        endpoint: `/guilds/${this.#guildId}/scheduled-events/${id}`,
        method: "PATCH",
        body: eventData,
      });
      const parsed = await res.json() as PatchEventResponse;

      return parsed;
    } catch (e) {
      console.error(
        `Error patching event in discord.`,
      );
      throw e;
    }
  }

  /**
   * Get channels on a Discord server.
   * @throws Will throw error if HTTP request was not successful.
   * @returns Array of pruned channels (id, type) if successful
   */
  public async getChannels(): Promise<BaseChannel[]> {
    try {
      const res = await this.#fetch({ endpoint: `/guilds/${this.#guildId}/channels` });
      const parsed = await res.json() as BaseChannel[];
      return parsed.map(
        ({ id, type, name }): BaseChannel => ({ id, type, name }),
      );
    } catch (e) {
      console.error(
        `Error getting channels from discord.`,
      );
      throw e;
    }
  }
}
