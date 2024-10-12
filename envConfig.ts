import "@std/dotenv/load";

/** Prefix used for environment variable config options */
const ENVIRONMENT_VARIABLE_PREFIX = "DISCORD_EVENTS_SYNC_";

const getEnv = (name: string, required: boolean = true) => {
  const envName = ENVIRONMENT_VARIABLE_PREFIX + name;
  const value = Deno.env.get(envName);
  if (value) {
    return value;
  }
  if (required) {
    const message = `Environment {${envName}} not found.`;
    throw new Error(message);
  }
};

export const loadEnvConfig = () => {
  const serviceAccountKeyJson = getEnv(
    "GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_JSON",
    false,
  );

  const apiKey = getEnv("GOOGLE_CALENDAR_API_KEY", false);

  if (!serviceAccountKeyJson && !apiKey) {
    throw new Error(
      `Either {${ENVIRONMENT_VARIABLE_PREFIX}GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_JSON} or {${ENVIRONMENT_VARIABLE_PREFIX}GOOGLE_CALENDAR_API_KEY} must be provided.`,
    );
  }

  const config = {
    discord: {
      guildId: getEnv("DISCORD_GUILD_ID")!,
      botToken: getEnv("DISCORD_BOT_TOKEN")!,
      applicationId: getEnv("DISCORD_APPLICATION_ID")!,
    },
    googleCalendar: {
      calendarId: getEnv("GOOGLE_CALENDAR_CALENDAR_ID")!,
      ...(serviceAccountKeyJson ? { serviceAccountKeyJson: serviceAccountKeyJson! } : { apiKey: apiKey! }),
    },
  };

  return config;
};
