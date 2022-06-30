import logger from "./logger";
import "dotenv/config";

/** Prefix used for environment variable config options */
const ENVIRONMENT_VARIABLE_PREFIX = "DISCORD_EVENTS_SYNC_";

export class EnvConfigError extends Error {
  public override name: string = "EnvConfigError";
  public constructor(message: string = "") {
    super(message);
  }
}

const getEnv = (name: string, fallback?: string) => {
  const envName = ENVIRONMENT_VARIABLE_PREFIX + name;
  const value = process.env[envName];
  if (value) {
    return value;
  }
  if (fallback) {
    logger.info(`Environment {${envName}} not found. Using fallback value: ${fallback}.`, { service: "getEnv" });
    return fallback;
  }
  const message = `Environment {${envName}} not found.`;
  logger.error(message, { service: "getEnv" });
  throw new EnvConfigError(message);
};

const loadEnvConfig = () => {
  const config = {
    discord: {
      guildId: getEnv("DISCORD_GUILD_ID"),
      botToken: getEnv("DISCORD_BOT_TOKEN"),
      applicationId: getEnv("DISCORD_APPLICATION_ID"),
    },
    googleCalendar: { calendarId: getEnv("GOOGLE_CALENDAR_CALENDAR_ID"), apiKey: getEnv("GOOGLE_CALENDAR_API_KEY") },
  };
  return config;
};

export default loadEnvConfig;
