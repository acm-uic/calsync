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

export type EntityMetadata = {
  /** Event location, present when {@link entity_type} is {@link EventEntityType.EXTERNAL} */
  location?: string;
};

export type DiscordUser = {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
};

export type CreateEventRequestData = Pick<
  DiscordEvent,
  | "channel_id"
  | "entity_metadata"
  | "name"
  | "privacy_level"
  | "scheduled_end_time"
  | "scheduled_start_time"
  | "description"
  | "entity_type"
>;

export type PatchEventRequestData =
  & Pick<DiscordEvent, "status">
  & CreateEventRequestData;

export type DiscordEvent = {
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
  entity_metadata: EntityMetadata | null;
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
  creator: DiscordUser | null;
  /** the number of users subscribed to the scheduled event */
  user_count?: number;
};

export type GetEventUsersParams = {
  limit?: number;
  with_member?: boolean;
  before?: string;
  after?: string;
};
export type EventUser = {
  user: DiscordUser;
  member?: unknown;
  guild_scheduled_event_id: string;
};

export type GetEventUsersResponse = EventUser[];

export type CreateEventResponse = DiscordEvent;

export type PatchEventResponse = DiscordEvent;

export type DeleteEventResponse = Record<string, never>;

export type GetDiscordEventsParams = {
  with_user_count?: "true" | "false";
};

export type CreateEventParams = {
  eventData: CreateEventRequestData;
};

export type DeleteEventParams = {
  id: string;
};

export type PatchEventParams = {
  id: string;
  eventData: PatchEventRequestData;
};

export enum ChannelType {
  GUILD_VOICE = 2,
  GUILD_STAGE_VOICE = 13,
}

export type BaseChannel = {
  id: string;
  type: ChannelType;
  name: string;
};

export type CalendarEventDateTime = {
  date?: string;
  dateTime?: string;
  timeZone?: string;
};

export type CalendarEvent = {
  id?: string;
  summary?: string;
  start?: CalendarEventDateTime;
  end?: CalendarEventDateTime;
  htmlLink?: string;
  location?: string;
  description?: string;
};

export type CalendarEventsResponse = {
  items: CalendarEvent[];
};

export type GoogleCalendarClientParams = {
  apiKey: string;
  calendarId: string;
};
