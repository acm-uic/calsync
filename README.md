# CalSync

[![ci](https://github.com/acm-uic/calsync/actions/workflows/ci.yml/badge.svg)](https://github.com/acm-uic/calsync/actions/workflows/ci.yml)
[![sync](https://github.com/acm-uic/calsync/actions/workflows/sync.yml/badge.svg)](https://github.com/acm-uic/calsync/actions/workflows/sync.yml)

🔁 Sync Google Calendar events to Discord Scheduled Events.

🤖 Designed to run as a scheduled job in GitHub Actions as a GitHub Action.

## Getting Started

```yml
# .github/workflows/calsync.yml
name: calsync

on:
  schedule:
    - cron: '0 * * * *' # hourly
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    name: 🔁 Sync Events
    steps:
      - uses: acm-uic/calsync@main
        with:
          discord-guild-id: ${{ secrets.DISCORD_GUILD_ID }}
          discord-bot-token: ${{ secrets.DISCORD_BOT_TOKEN }} # needs "Read Messages/View Channels", "Manage Events" permissions
          discord-application-id: ${{ secrets.DISCORD_APPLICATION_ID }}
          google-calendar-id: ${{ secrets.GOOGLE_CALENDAR_CALENDAR_ID }}
          google-api-key: ${{ secrets.GOOGLE_CALENDAR_API_KEY }}
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
