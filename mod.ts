import {
  BaseChannel,
  CalendarEvent,
  CalendarEventDateTime,
  CalendarEventsResponse,
  ChannelType,
  CreateEventRequestData,
  DiscordEvent,
  EntityMetadata,
  EventEntityType,
  EventPrivacyLevel,
  PatchEventRequestData,
} from "./interfaces.ts";
import { DiscordClient } from "./discord.ts";
import { loadEnvConfig } from "./envConfig.ts";
import { GoogleCalendarClient } from "./gcal.ts";

const A_WEEK = 1000 * 3600 * 24 * 7;

const envConfig = loadEnvConfig();
const discordClient = new DiscordClient(envConfig.discord);
const gCalClient = new GoogleCalendarClient(envConfig.googleCalendar);

const discordApplicationId = envConfig.discord.applicationId;
const syncDateRange = {
  from: new Date(),
  to: new Date(Date.now() + A_WEEK),
};

const calendarToDiscordEvent = (
  discordChannels: BaseChannel[],
  calEvent: CalendarEvent,
): PatchEventRequestData | CreateEventRequestData | undefined => {
  const parseDates = (
    start: CalendarEventDateTime,
    end: CalendarEventDateTime,
  ) => {
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
  const parseEventLocation = (
    location: string,
  ): [EventEntityType | undefined, string | undefined] => {
    if (!location.startsWith("Discord")) {
      return [EventEntityType.EXTERNAL, location.trim()];
    }
    if (location.startsWith("Discord Voice:")) {
      return [
        EventEntityType.VOICE,
        location.split("Discord Voice:")[1]?.trim(),
      ];
    }
    if (location.startsWith("Discord Stage:")) {
      return [
        EventEntityType.STAGE_INSTANCE,
        location.split("Discord Stage:")[1]?.trim(),
      ];
    }
    return [undefined, undefined];
  };

  if (
    !calEvent.id || !calEvent.summary || !calEvent.start || !calEvent.end ||
    !calEvent.htmlLink
  ) {
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
  let entity_metadata: EntityMetadata | null = null;

  const channelIdFromLocation = discordChannels?.find((c) => c.name.toLowerCase().includes(eventLocation.toLowerCase()))
    ?.id;
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

  const discordEventData: CreateEventRequestData | PatchEventRequestData = {
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

const getDiscordEvents = async (): Promise<DiscordEvent[]> => {
  return await discordClient.getEvents({ with_user_count: "false" });
};
const getDiscordChannels = async () => {
  const discordChannels: BaseChannel[] = await discordClient.getChannels();
  const voiceStageChannels = discordChannels.filter(
    (c) =>
      c.type === ChannelType.GUILD_STAGE_VOICE ||
      c.type === ChannelType.GUILD_VOICE,
  );
  return voiceStageChannels;
};

const getCalendarEvents = async () => {
  const gCalResponse: CalendarEventsResponse = await gCalClient.getEvents({
    singleEvents: true,
    maxResults: 100,
    timeMin: syncDateRange.from,
    timeMax: syncDateRange.to,
    orderBy: "startTime",
  });
  return gCalResponse.items;
};

const discordApiTimeout = async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
};

const compareEvents = (
  event1: CreateEventRequestData | PatchEventRequestData | DiscordEvent,
  event2: CreateEventRequestData | PatchEventRequestData | DiscordEvent,
): boolean => {
  const normalizeDate = (
    dateStr: string | null,
  ) => (dateStr ? new Date(dateStr).getTime() : undefined);
  return !(
    event1.name !== event2.name ||
    event1.description !== event2.description ||
    event1.channel_id !== event2.channel_id ||
    event1.privacy_level !== event2.privacy_level ||
    event1.entity_type !== event2.entity_type ||
    event1.entity_metadata?.location !== event2.entity_metadata?.location ||
    normalizeDate(event1.scheduled_end_time) !==
      normalizeDate(event2.scheduled_end_time) ||
    normalizeDate(event1.scheduled_start_time) !==
      normalizeDate(event2.scheduled_start_time)
  );
};

const syncEvents = async () => {
  console.info("syncing events");
  const discordChannels = await getDiscordChannels();
  const gCalEvents = await getCalendarEvents();

  // filter events created by the bot
  const discordEvents = (await getDiscordEvents()).filter((e) => e.creator_id === discordApplicationId);

  if (gCalEvents) {
    console.info(`Received ${gCalEvents.length} calendar events.`);
    if (gCalEvents.length === 0) {
      return;
    }
    const convertedEvents = gCalEvents.map((calEvent) => ({
      calEvent,
      discordEvent: calendarToDiscordEvent(discordChannels, calEvent),
    }));
    try {
      const discordEventsProcessed: Record<string, boolean> = {};
      for (const { calEvent, discordEvent } of convertedEvents) {
        if (calEvent === undefined || discordEvent === undefined) {
          continue;
        }

        const existingDiscordEvent = discordEvents.find(
          (discordEvent) =>
            calEvent.htmlLink !== undefined &&
            discordEvent.description.endsWith(calEvent.htmlLink),
        );
        if (existingDiscordEvent) {
          if (compareEvents(discordEvent, existingDiscordEvent)) {
            discordEventsProcessed[existingDiscordEvent.id] = true;
            console.info(
              `${existingDiscordEvent.id}: Event skipped; No update needed.`,
            );
            continue;
          } else {
            const response = await discordClient.patchEvent({
              id: existingDiscordEvent.id,
              eventData: discordEvent as PatchEventRequestData,
            });
            console.info(`${response.id}: Event updated.`);
            discordEventsProcessed[response.id] = true;
          }
        } else {
          const response = await discordClient.createEvent({
            eventData: discordEvent as CreateEventRequestData,
          });
          console.info(`${response.id}: Event created.`);
          discordEventsProcessed[response.id] = true;
        }
        await discordApiTimeout();
      }

      for (const event of discordEvents) {
        if (discordEventsProcessed[event.id]) {
          continue;
        } else {
          // delete all other events
          await discordClient.deleteEvent({ id: event.id });
          console.info(`${event.id}: Event deleted.`);
          await discordApiTimeout();
        }
      }
      console.info("Done processing events.");
    } catch (e) {
      console.error(
        `Error while processing events. Error message: ${(e as Error).message}, Error: ${JSON.stringify(e)}.`,
      );
    }
  }
};

await syncEvents();
