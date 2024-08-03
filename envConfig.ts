import "@std/dotenv/load";

/** Prefix used for environment variable config options */
const ENVIRONMENT_VARIABLE_PREFIX = "DISCORD_EVENTS_SYNC_";

const getEnv = (name: string) => {
  const envName = ENVIRONMENT_VARIABLE_PREFIX + name;
  const value = Deno.env.get(envName);
  if (value) {
    return value;
  }

  const message = `Environment {${envName}} not found.`;
  console.error(message);
  throw new Error(message);
};

export const loadEnvConfig = () => {
  const config = {
    discord: {
      guildId: getEnv("DISCORD_GUILD_ID"),
      botToken: getEnv("DISCORD_BOT_TOKEN"),
      applicationId: getEnv("DISCORD_APPLICATION_ID"),
    },
    googleCalendar: {
      calendarId: getEnv("GOOGLE_CALENDAR_CALENDAR_ID"),
      apiKey: getEnv("GOOGLE_CALENDAR_API_KEY"),
    },
  };
  return config;
};
