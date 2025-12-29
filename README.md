# Google Calendar Dispatch Action

[![GitHub Super-Linter](https://github.com/zumix/google-calendar-dispatch-action/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
[![CI](https://github.com/zumix/google-calendar-dispatch-action/actions/workflows/ci.yml/badge.svg)](https://github.com/zumix/google-calendar-dispatch-action/actions/workflows/ci.yml)

A GitHub Action that retrieves incomplete events/tasks from Google Calendar
around the current time, and sends a repository dispatch for each event/task
whose scheduled time has passed.

## Features

- 📅 **Google Calendar Integration**: Fetch events from multiple calendars
- ✅ **Google Tasks Support**: Process tasks from multiple task lists
- 🚀 **Repository Dispatch**: Trigger workflows based on calendar events
- 🏷️ **Custom Event Types**: Define event types per calendar item
- 📦 **Custom Payloads**: Include JSON data from event descriptions
- 🔄 **Duplicate Prevention**: Automatic completion markers prevent re-dispatch

## Quick Start

```yaml
name: Calendar Dispatch
on:
  schedule:
    - cron: '*/15 * * * *' # Every 15 minutes
  workflow_dispatch:

jobs:
  dispatch:
    runs-on: ubuntu-latest
    steps:
      - uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GOOGLE_CREDENTIALS }}

      - uses: zumix/google-calendar-dispatch-action@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          calendar-ids: 'primary,your-calendar-id@group.calendar.google.com'
          time-range: '30'
```

## Inputs

| Input                | Required | Default             | Description                                                                              |
| -------------------- | -------- | ------------------- | ---------------------------------------------------------------------------------------- |
| `github-token`       | ✅       | -                   | GitHub token for repository dispatch (requires `repo` scope)                             |
| `time-range`         | ❌       | `30`                | Time range in minutes to look back for events                                            |
| `calendar-ids`       | ❌       | -                   | Comma-separated list of Google Calendar IDs                                              |
| `task-list-ids`      | ❌       | -                   | Comma-separated list of Google Tasks list IDs                                            |
| `google-credentials` | ❌       | -                   | Google credentials JSON. Falls back to `GOOGLE_APPLICATION_CREDENTIALS` if not specified |
| `repository`         | ❌       | Current repo        | Target repository for dispatch (format: `owner/repo`)                                    |
| `event-type`         | ❌       | `calendar-dispatch` | Default event type for repository dispatch                                               |

## Outputs

| Output             | Description                                                       |
| ------------------ | ----------------------------------------------------------------- |
| `dispatched-count` | Number of successfully dispatched events/tasks                    |
| `skipped-count`    | Number of skipped events/tasks (already completed or not yet due) |
| `error-count`      | Number of events/tasks that encountered errors                    |

## Authentication

### Google APIs

This action supports two authentication methods:

#### 1. Using `google-github-actions/auth` (Recommended)

```yaml
- uses: google-github-actions/auth@v2
  with:
    credentials_json: ${{ secrets.GOOGLE_CREDENTIALS }}

- uses: zumix/google-calendar-dispatch-action@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    calendar-ids: 'primary'
```

#### 2. Direct credentials input

```yaml
- uses: zumix/google-calendar-dispatch-action@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    google-credentials: ${{ secrets.GOOGLE_CREDENTIALS }}
    calendar-ids: 'primary'
```

### Setting up Google Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Calendar API** and **Google Tasks API**
4. Create a Service Account:
   - Go to **IAM & Admin** > **Service Accounts**
   - Click **Create Service Account**
   - Download the JSON key file
5. Share your calendar with the service account email
6. Store the JSON key as a GitHub secret

### GitHub Token

The `github-token` requires the `repo` scope for repository dispatch. The
default `GITHUB_TOKEN` works for dispatching to the same repository.

For cross-repository dispatch, use a Personal Access Token (PAT) with `repo`
scope.

## Event Type Configuration

You can specify a custom event type for each calendar event or task. The event
type is resolved in the following priority order:

1. **Title**: `{event_type: my-event}` in the event/task title
2. **Description**: `{event_type: my-event}` in the description/notes
3. **Default**: The `event-type` input parameter

### Example

Calendar event title:

```
Deploy to production {event_type: deploy-production}
```

This will trigger a `repository_dispatch` with event type `deploy-production`.

## Custom Payload

You can include custom JSON data in the dispatch payload by adding a JSON code
block to the event description or task notes:

````markdown
Meeting details here...

```json
{
  "environment": "production",
  "version": "1.2.3",
  "notify": true
}
```
````

## Repository Dispatch Payload

When this action sends a repository dispatch, the payload structure is:

```json
{
  "event": {
    "id": "event-id",
    "summary": "Event title",
    "start": { "dateTime": "2025-01-01T10:00:00Z" },
    "description": "Event description..."
  },
  "custom": {
    "environment": "production",
    "version": "1.2.3"
  },
  "source_type": "event"
}
```

### Receiving the Dispatch

```yaml
name: Handle Calendar Event
on:
  repository_dispatch:
    types: [calendar-dispatch, deploy-production]

jobs:
  process:
    runs-on: ubuntu-latest
    steps:
      - name: Process event
        run: |
          echo "Source: ${{ github.event.client_payload.source_type }}"
          echo "Event: ${{ github.event.client_payload.event.summary }}"
          echo "Custom: ${{ toJson(github.event.client_payload.custom) }}"
```

## Completion Marker

After successful dispatch, this action appends a marker to the event description
or task notes:

```
--- google-calendar-dispatch-action
[GitHub Actions Run]: https://github.com/owner/repo/actions/runs/123456789
```

This marker:

- Prevents duplicate dispatches for the same event
- Provides a link to the triggered workflow run

## Time Range Behavior

```
          time_range                    buffer
    ◄─────────────────────►     ◄────────────────►
    │                       │                      │
────┴───────────────────────┴──────────────────────┴────
past                      now                    future
    │                       │
    └─── Events retrieved ──┘
         (dispatched if start_time < now)
```

- **Past range**: Controlled by `time-range` input (default: 30 minutes)
- **Future buffer**: Internal fixed value (~10 minutes) for processing delays
- Only events where `start_time < current_time` are dispatched

## Examples

### Scheduled Deployment

```yaml
name: Scheduled Deploy
on:
  repository_dispatch:
    types: [scheduled-deploy]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy
        run: |
          echo "Deploying version ${{ github.event.client_payload.custom.version }}"
```

Calendar event:

````
Title: Deploy v1.5.0 {event_type: scheduled-deploy}
Description:
```json
{
  "version": "1.5.0",
  "environment": "production"
}
````

````

### Task-Based Reminders

```yaml
- uses: zumix/google-calendar-dispatch-action@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    task-list-ids: 'your-task-list-id'
    event-type: 'task-reminder'
````

## Troubleshooting

### "No events found"

- Verify the service account has access to the calendar
- Check that `calendar-ids` are correct
- Ensure events exist within the `time-range`

### "Authentication failed"

- Verify the Google credentials JSON is valid
- Check that Calendar API and Tasks API are enabled
- Ensure the service account has the necessary permissions

### "Dispatch failed"

- Verify the `github-token` has `repo` scope
- For cross-repo dispatch, use a PAT instead of `GITHUB_TOKEN`
- Check that the target repository exists and is accessible

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for
guidelines.

### Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run bundle

# Lint
npm run lint
```

## License

[MIT](LICENSE)
