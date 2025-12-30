# Google Calendar Dispatch Action Specification

## Overview

A GitHub Action that retrieves incomplete events/tasks from Google Calendar
around the current time, and sends a repository dispatch for each event/task
whose scheduled time has passed.

## Trigger

- Designed as a generic GitHub Action that can be invoked from any workflow
  event (cron, workflow_dispatch, push, etc.)
- The action does not depend on any specific trigger type

## Time Range

### Event Retrieval Range

- **Past range**: Configurable via `time_range` parameter (in minutes)
- **Future buffer**: Internal fixed value (~10 minutes) to handle processing
  delays
- **Retrieval window**: `(current_time - time_range)` to
  `(current_time + buffer)`

### Dispatch Target Criteria

- Only events/tasks where `start_time < current_time` at the moment of
  evaluation are dispatched
- This ensures the action only processes events that have actually passed their
  start time

## Target Sources

### Google Calendar Events

- Target: Google Calendar Events API
- **Incomplete criteria**: Event description does NOT contain the run URL marker
- **Completion marker format**:

  ```text
  --- google-calendar-dispatch-action
  [GitHub Actions Run]: https://github.com/owner/repo/actions/runs/xxxxx
  ```

- Run URL is appended to the end of the event description after dispatch

### Google Tasks

- Target: Google Tasks API
- **Incomplete criteria**: Task status is NOT completed
- Run URL is appended to the end of the task notes after dispatch
- Task completion status is NOT automatically changed by this action

## Input Parameters

### Required Parameters

| Parameter      | Description                                                  |
| -------------- | ------------------------------------------------------------ |
| `github-token` | GitHub token for repository dispatch (requires `repo` scope) |

### Optional Parameters

| Parameter            | Default                    | Description                                                                                                   |
| -------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `time-range`         | TBD                        | Time range in minutes to look back for events                                                                 |
| `calendar-ids`       | -                          | Comma-separated list of Google Calendar IDs                                                                   |
| `task-list-ids`      | -                          | Comma-separated list of Google Tasks list IDs                                                                 |
| `google-credentials` | -                          | Google credentials JSON. Falls back to `GOOGLE_APPLICATION_CREDENTIALS` environment variable if not specified |
| `repository`         | `${{ github.repository }}` | Target repository for dispatch (format: `owner/repo`)                                                         |
| `event-type`         | TBD                        | Default event type for repository dispatch                                                                    |

## Authentication

### Google APIs

1. If `google-credentials` input is provided, use it directly
2. Otherwise, use `GOOGLE_APPLICATION_CREDENTIALS` environment variable
3. Designed to work with
   [google-github-actions/auth](https://github.com/google-github-actions/auth)

### GitHub API

- Uses `github_token` input for repository dispatch API calls

## Event Type Resolution

Event type for repository dispatch is determined in the following priority
order:

1. **Title**: Extract from event/task title using format `{event_type: xxx}`
2. **Description**: Extract from description/notes using format
   `{event_type: xxx}`
3. **Default**: Use `event_type` input parameter

### Format

```text
{event_type: my-custom-event}
```

## Repository Dispatch Payload

The payload contains two main sections:

### 1. Calendar/Task Information

Raw API response data from Google Calendar/Tasks API, including:

- Event/Task ID
- Title/Summary
- Start time
- End time
- Description/Notes
- Calendar ID / Task List ID
- All other fields returned by the API

### 2. Custom Data from Description

JSON data extracted from description/notes using code block format:

````markdown
```json
{
  "key": "value",
  "custom_field": "custom_value"
}
```
````

### Payload Structure

```json
{
  "event": {
    // Raw Google Calendar/Tasks API response
  },
  "custom": {
    // Extracted JSON from description code block
  },
  "source_type": "event" | "task"
}
```

## Processing Flow

1. **Authenticate** with Google APIs
2. **Retrieve events** from specified calendars within the time range
3. **Retrieve tasks** from specified task lists within the time range
4. **Filter** incomplete events/tasks:
   - Events: description does not contain run URL marker
   - Tasks: status is not completed
5. **For each** filtered event/task where `start_time < current_time`: a.
   Extract event type from title/description or use default b. Extract custom
   JSON payload from description c. Send repository dispatch d. Append run URL
   to event description / task notes
6. **Report** summary of processed items

## Completion Marker Format

After successful dispatch, the following is appended to the event description or
task notes:

```text
--- google-calendar-dispatch-action
[GitHub Actions Run]: https://github.com/owner/repo/actions/runs/123456789
```

This marker serves two purposes:

1. Prevents duplicate dispatches for the same event
2. Provides visible confirmation of execution in the calendar UI

## Error Handling

- **Strategy**: Continue processing on errors, skip failed items
- Individual event/task failures do not stop the entire action
- Errors are logged but do not cause the action to fail
- Summary includes count of successful and failed dispatches

## Outputs

| Output             | Description                                                  |
| ------------------ | ------------------------------------------------------------ |
| `dispatched-count` | Number of successfully dispatched events/tasks               |
| `skipped-count`    | Number of skipped events/tasks (already completed or errors) |
| `error-count`      | Number of events/tasks that encountered errors               |
