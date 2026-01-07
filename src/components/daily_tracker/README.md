# Daily Tracker

A daily tracker app for monitoring completed tasks from the planner.

## Features

- **Auto-populated Reports**: Automatically fetches completed tasks from the planner for each date
- **Structured Format**: Daily reports follow a consistent format:
  - Time started / finished
  - Work done (bullet points)
  - Testing information
  - Blockers
  - Status

- **Dark Theme**: Uses the same dark theme as the main website (no white backgrounds)
- **Real-time Sync**: As tasks are completed in the planner, they automatically appear in the daily tracker
- **PDF Export**: Export daily reports as PDFs

## Routes

- `/daily-tracker` - main daily tracker view (Admin only)

## Database Tables

- `tasks` - Planner tasks with completion dates
- `daily_summaries` - Daily summary reports
- `daily_task_notes` - Task-specific notes for each day
- `daily_task_note_attachments` - File attachments for daily notes

## Integration

The daily tracker integrates with the planner's `tasks` table. When a task is marked as "Done" and has a `completed_date`, it will automatically appear in the daily tracker for that date.

## Usage

1. Navigate to `/daily-tracker`
2. Select a date from the calendar
3. View auto-populated completed tasks
4. Review and edit the daily summary
5. Export as PDF if needed
