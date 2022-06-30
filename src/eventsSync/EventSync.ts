import {
  EventEntityType,
  DiscordEventsClient,
  ICreateEventRequestData,
  IEntityMetadata,
  IPatchEventRequestData,
  EventPrivacyLevel,
  IEvent,
} from "../discord/DiscordEventsClient";
import { DiscordChannelsClient, IBaseChannel, ChannelType } from "../discord/DiscordChannelsClient";
import type {
  GoogleCalendarClient,
  ICalendarEvent,
  ICalendarEventDateTime,
} from "../googleCalendar/GoogleCalendarClient";
import logger from "../util/logger";

export interface IEventSyncParams {
  discordEventsClient: DiscordEventsClient;
  discordChannelsClient: DiscordChannelsClient;
  googleCalendar: GoogleCalendarClient;
  discordApplicationId: string;
  syncDateRange: { from: Date; to: Date };
}

export interface IDiscordEventMeta {
  gcalId: string;
}

export class EventSync {
  private _gCalClient: GoogleCalendarClient;
  private _discordEventsClient: DiscordEventsClient;
  private _discordChannelsClient: DiscordChannelsClient;
  private _discordApplicationId: string;
  private _syncDateRange: { from: Date; to: Date };
  private _discordChannels?: IBaseChannel[];

  public constructor({
    googleCalendar,
    discordChannelsClient,
    discordEventsClient,
    discordApplicationId,
    syncDateRange,
  }: IEventSyncParams) {
    this._gCalClient = googleCalendar;
    this._discordEventsClient = discordEventsClient;
    this._discordChannelsClient = discordChannelsClient;
    this._discordApplicationId = discordApplicationId;
    this._syncDateRange = syncDateRange;
  }

  private async _getDiscordEvents() {
    return this._discordEventsClient.getEvents({ with_user_count: false });
  }

  private _calendarToDiscordEvent = (
    calEvent: ICalendarEvent
  ): IPatchEventRequestData | ICreateEventRequestData | undefined => {
    const parseDates = (start: ICalendarEventDateTime, end: ICalendarEventDateTime) => {
      let startParsed: Date | undefined = undefined;
      let endParsed: Date | undefined = undefined;
      if (start.date && end.date) {
        startParsed = new Date(start.date);
        endParsed = new Date(end.date);
      }
      if (start.dateTime && end.dateTime) {
        startParsed = new Date(start.dateTime);
        endParsed = new Date(end.dateTime);
      }
      return [startParsed, endParsed];
    };
    const parseEventLocation = (location: string): [EventEntityType | undefined, string | undefined] => {
      if (!location.startsWith("Discord")) {
        return [EventEntityType.EXTERNAL, location.trim()];
      }
      if (location.startsWith("Discord Voice:")) {
        return [EventEntityType.VOICE, location.split("Discord Voice:")[1]?.trim()];
      }
      if (location.startsWith("Discord Stage:")) {
        return [EventEntityType.STAGE_INSTANCE, location.split("Discord Stage:")[1]?.trim()];
      }
      return [undefined, undefined];
    };
    const getChannelId = (location: string) => {
      return this._discordChannels?.find((c) => c.name.toLowerCase().includes(location.toLowerCase()))?.id;
    };

    if (!calEvent.id || !calEvent.summary || !calEvent.start || !calEvent.end || !calEvent.htmlLink) {
      return undefined;
    }
    const [startDate, endDate] = parseDates(calEvent.start, calEvent.end);
    if (!startDate || !endDate) {
      return undefined;
    }
    const [entity_type, eventLocation] = calEvent.location
      ? parseEventLocation(calEvent.location)
      : [EventEntityType.EXTERNAL, "🤷"];

    if (!entity_type || !eventLocation) {
      return undefined;
    }

    let channel_id: string | null = null;
    let entity_metadata: IEntityMetadata | null = null;

    const channelIdFromLocation = getChannelId(eventLocation);
    switch (entity_type) {
      case EventEntityType.EXTERNAL:
        channel_id = null;
        entity_metadata = { location: eventLocation };
        break;
      case EventEntityType.VOICE:
        entity_metadata = null;
        if (channelIdFromLocation) {
          channel_id = channelIdFromLocation;
        } else {
          return undefined;
        }
        break;
      case EventEntityType.STAGE_INSTANCE:
        if (channelIdFromLocation) {
          channel_id = channelIdFromLocation;
        } else {
          return undefined;
        }
        break;
    }
    const description: string = `${calEvent.description ?? ""}\nCalendar event link: ${calEvent.htmlLink}`.trim();

    const discordEventData: ICreateEventRequestData | IPatchEventRequestData = {
      name: calEvent.summary,
      description,
      privacy_level: EventPrivacyLevel.GUILD_ONLY,
      channel_id,
      entity_metadata,
      scheduled_start_time: startDate.toISOString(),
      scheduled_end_time: endDate.toISOString(),
      entity_type,
    };

    return discordEventData;
  };

  public async sync(): Promise<void> {
    const getDiscordChannels = async () => {
      const discordChannels = await this._discordChannelsClient.getChannels();
      const voiceStageChannels = discordChannels.filter(
        (c) => c.type === ChannelType.GUILD_STAGE_VOICE || c.type === ChannelType.GUILD_VOICE
      );
      return voiceStageChannels;
    };

    const getCalendarEvents = async () => {
      const gCalResponse = await this._gCalClient.getEvents({
        singleEvents: true,
        maxResults: 100,
        timeMin: this._syncDateRange.from,
        timeMax: this._syncDateRange.to,
        orderBy: "startTime",
      });
      return gCalResponse.items;
    };

    const discordApiTimeout = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    };

    const compareEvents = (
      event1: ICreateEventRequestData | IPatchEventRequestData | IEvent,
      event2: ICreateEventRequestData | IPatchEventRequestData | IEvent
    ): boolean => {
      const normalizeDate = (dateStr: string | null) => (dateStr ? new Date(dateStr).getTime() : undefined);
      if (
        event1.name !== event2.name ||
        event1.description !== event2.description ||
        event1.channel_id !== event2.channel_id ||
        event1.privacy_level !== event2.privacy_level ||
        event1.entity_type !== event2.entity_type ||
        event1.entity_metadata?.location !== event2.entity_metadata?.location ||
        normalizeDate(event1.scheduled_end_time) !== normalizeDate(event2.scheduled_end_time) ||
        normalizeDate(event1.scheduled_start_time) !== normalizeDate(event2.scheduled_start_time)
      ) {
        return false;
      }
      return true;
    };

    logger.info("syncing events", { service: "EventSync" });
    this._discordChannels = await getDiscordChannels();
    const gCalEvents = await getCalendarEvents();

    // filter events created by the bot
    const discordEvents = (await this._getDiscordEvents()).filter((e) => e.creator_id === this._discordApplicationId);

    if (gCalEvents) {
      logger.info(`Received ${gCalEvents.length} calendar events.`, { service: "EventSync" });
      if (gCalEvents.length === 0) {
        return;
      }
      const convertedEvents = gCalEvents.map((calEvent) => ({
        calEvent,
        discordEvent: this._calendarToDiscordEvent(calEvent),
      }));
      try {
        const discordEventsProcessed: Record<string, boolean> = {};
        for (const { calEvent, discordEvent } of convertedEvents) {
          if (calEvent === undefined || discordEvent === undefined) {
            continue;
          }

          const existingDiscordEvent = discordEvents.find(
            (discordEvent) => calEvent.htmlLink !== undefined && discordEvent.description.endsWith(calEvent.htmlLink)
          );
          if (existingDiscordEvent) {
            if (compareEvents(discordEvent, existingDiscordEvent)) {
              discordEventsProcessed[existingDiscordEvent.id] = true;
              logger.info(`${existingDiscordEvent.id}: Event skipped; No update needed.`, { service: "EventSync" });
              continue;
            } else {
              const response = await this._discordEventsClient.patchEvent({
                id: existingDiscordEvent.id,
                eventData: discordEvent as IPatchEventRequestData,
              });
              logger.info(`${response.id}: Event updated.`, { service: "EventSync" });
              discordEventsProcessed[response.id] = true;
            }
          } else {
            const response = await this._discordEventsClient.createEvent({
              eventData: discordEvent as ICreateEventRequestData,
            });
            logger.info(`${response.id}: Event created.`, { service: "EventSync" });
            discordEventsProcessed[response.id] = true;
          }
          await discordApiTimeout();
        }

        for (const event of discordEvents) {
          if (discordEventsProcessed[event.id]) {
            continue;
          } else {
            // delete all other events
            await this._discordEventsClient.deleteEvent({ id: event.id });
            logger.info(`${event.id}: Event deleted.`, { service: "EventSync" });
            await discordApiTimeout();
          }
        }
        logger.info("Done processing events.", { service: "EventSync" });
      } catch (e) {
        logger.error(
          `Error while processing events. Error message: ${(e as Error).message}, Error: ${JSON.stringify(e)}.`,
          { service: "EventSync" }
        );
      }
    }
  }
}
