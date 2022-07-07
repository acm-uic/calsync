import { EventSync } from "./eventsSync/EventSync";
import { DiscordChannelsClient } from "./discord/DiscordChannelsClient";
import { DiscordEventsClient } from "./discord/DiscordEventsClient";
import { GoogleCalendarClient } from "./googleCalendar/GoogleCalendarClient";
import loadEnvConfig from "./util/loadEnvConfig";
import logger from "./util/logger";

logger.info("App Boot");

const A_WEEK = 1000 * 3600 * 24 * 7;

const envConfig = loadEnvConfig();
const discordChannelsClient = new DiscordChannelsClient(envConfig.discord);
const discordEventsClient = new DiscordEventsClient(envConfig.discord);
const googleCalendar = new GoogleCalendarClient(envConfig.googleCalendar);

new EventSync({
  googleCalendar,
  discordChannelsClient,
  discordEventsClient,
  discordApplicationId: envConfig.discord.applicationId,
  syncDateRange: {
    from: new Date(),
    to: new Date(Date.now() + A_WEEK),
  },
}).sync();
