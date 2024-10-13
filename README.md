# CalSync

[![ci](https://github.com/acm-uic/calsync/actions/workflows/ci.yml/badge.svg)](https://github.com/acm-uic/calsync/actions/workflows/ci.yml)
[![calsync](https://github.com/acm-uic/calsync/actions/workflows/calsync.yml/badge.svg)](https://github.com/acm-uic/calsync/actions/workflows/calsync.yml)

🔁 Sync Google Calendar events to Discord Scheduled Events.

🤖 Designed to run as a scheduled job in GitHub Actions as a GitHub Action.

## Getting Started

```yml
# .github/workflows/calsync.yml
name: calsync

on:
  schedule:
    - cron: "0 * * * *" # hourly
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    name: 🔁 Sync Events
    steps:
      - uses: acm-uic/calsync@main
        with:
          discord-guild-id: ${{ secrets.DISCORD_GUILD_ID }}
          discord-bot-token: ${{ secrets.DISCORD_BOT_TOKEN }} # needs "bot" scope and "View Channels", "Manage Events", "Create Events" bot permissions. permissions=17600775980032
          discord-application-id: ${{ secrets.DISCORD_APPLICATION_ID }}
          google-calendar-id: ${{ secrets.GOOGLE_CALENDAR_CALENDAR_ID }}
          google-service-account-key-json: ${{ secrets.GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_JSON }} # either use google-api-key or google-service-account-key-json
          google-api-key: ${{ secrets.GOOGLE_CALENDAR_API_KEY }} # either use google-api-key or google-service-account-key-json
```

## How does it work?

The program fetches upcoming events using the Google Calendar API and then create or updates (events are mapped using
the Google calendar event link in the Discord event's description) events if necessary.

The remaining events in Discord that were created by the bot are removed.

## Configuring

Refer to [.env.example](.env.example) for configuration options. Configuration can be set either in system environment
variables or in `.env.` file in the root of the repository.

## Discord bot permissions

The Discord bot needs "Read Messages/View Channels", "Manage Events" permissions.

## Google Cloud setup

1. Enable the Google Calendar API for the Google Cloud project.
2. Create a service account and download the JSON key.
   1. Credentials -> Create Credentials -> Service Account -> JSON key
   2. In Step 2 (Grant this service account access to project): Add "Service Account Token Creator" role
   3. After creation, click on the service account, go to "Keys" tab, and create a new JSON key.
   4. Save the JSON key as a secret in the GitHub repository.
3. Share the Google Calendar with the service account email. "Settings and sharing" -> "Share with specific people" ->
   Add the service account email. Give it "See all event details" permission.
