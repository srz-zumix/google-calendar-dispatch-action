# Example Workflows

This directory contains example workflows demonstrating how to use the Google
Calendar Dispatch Action.

## Files

- `example-cron.yml.example` - Scheduled workflow using cron
- `example-dispatch-handler.yml.example` - Workflow that handles the dispatched
  events

## Usage

Copy these files to your `.github/workflows/` directory and rename them (remove
`.example`):

```bash
cp example-cron.yml.example ../.github/workflows/calendar-dispatch.yml
cp example-dispatch-handler.yml.example ../.github/workflows/calendar-handler.yml
```

Then configure:

1. Set up your Google Service Account credentials as a secret
   (`GOOGLE_CREDENTIALS`)
2. Update the `calendar-ids` or `task-list-ids` with your actual IDs
3. Adjust the cron schedule as needed
