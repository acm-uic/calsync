/** Discord API base URL. */
export const DISCORD_API_BASE = "https://discord.com/api";

/**
 * Base64 encoded string that has info about OS, browser, user agent, etc.
 * We need it for some reason to access the /events API endpoint.
 * Decoded JSON
 * {
 *   "os": "Windows",
 *   "browser": "Chrome",
 *   "device": "",
 *   "browser_user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36 Edg/94.0.992.47",
 *   "browser_version": "94.0.4606.81",
 *   "os_version": "10",
 *   "referrer": "",
 *   "referring_domain": "",
 *   "referrer_current": "",
 *   "referring_domain_current": "",
 *   "release_channel": "stable",
 *   "client_build_number": 101329,
 *   "client_event_source": null
 * }
 */
export const DISCORD_SUPER_PROPERTIES =
  "eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiQ2hyb21lIiwiZGV2aWNlIjoiIiwiYnJvd3Nlcl91c2VyX2FnZW50IjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzk0LjAuNDYwNi44MSBTYWZhcmkvNTM3LjM2IEVkZy85NC4wLjk5Mi40NyIsImJyb3dzZXJfdmVyc2lvbiI6Ijk0LjAuNDYwNi44MSIsIm9zX3ZlcnNpb24iOiIxMCIsInJlZmVycmVyIjoiIiwicmVmZXJyaW5nX2RvbWFpbiI6IiIsInJlZmVycmVyX2N1cnJlbnQiOiIiLCJyZWZlcnJpbmdfZG9tYWluX2N1cnJlbnQiOiIiLCJyZWxlYXNlX2NoYW5uZWwiOiJzdGFibGUiLCJjbGllbnRfYnVpbGRfbnVtYmVyIjoxMDEzMjksImNsaWVudF9ldmVudF9zb3VyY2UiOm51bGx9";
