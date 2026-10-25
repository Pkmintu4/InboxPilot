# InboxPilot — Smart Gmail Follow-up & Reminder Automation

InboxPilot is a free, automated email productivity system built using Google Apps Script, Gmail, and Google Calendar. It periodically scans email conversations to identify messages that may require a response or follow-up and creates calendar reminders so important tasks don't get forgotten.

The system runs on Google's servers using scheduled triggers, meaning it can continue working even when your computer and ChatGPT are closed.

## Key Features

- **Automated Inbox Monitoring:** Periodically checks recent Gmail conversations.
- **Actionable Email Detection:** Identifies messages that may require a reply, confirmation, approval, or other action.
- **Follow-up Tracking:** Flags selected sent emails when a response may be overdue.
- **Calendar Integration:** Creates Google Calendar events with links to the relevant Gmail conversations.
- **Automated Notifications:** Uses Calendar popup reminders to bring pending email tasks to your attention.
- **Duplicate Prevention:** Tracks existing reminders to reduce duplication.
- **Privacy-Conscious Design:** Processes email within the user's own Google account using authorized Google Apps Script services.
- **No Automatic Email Sending:** Keeps the user in control of all outgoing communication.

## Technology Stack

- Google Apps Script
- Gmail
- Google Calendar
- JavaScript
- Time-driven triggers

## How It Works

1. A scheduled trigger runs the script periodically.
2. The script searches recent inbox and sent-mail conversations.
3. Rule-based logic evaluates whether a conversation may require action.
4. Qualifying conversations are added to a pending-reminder list.
5. Google Calendar events are created with relevant conversation links.
6. Users review their emails and decide how to respond.

## Cost

Designed to run using free Google services within their applicable usage quotas. No paid AI API is required for the current rule-based implementation.

## Current Limitations

- Action detection uses keywords and rules, so it may miss some requests or flag messages that do not require action.
- The current implementation creates reminders, not AI-generated email drafts.
- Calendar notifications depend on the user's notification settings.
- The script requires authorization to access Gmail and Google Calendar.
- Gmail search results are limited by the configured thread limit.

## Future Enhancements

- Context-aware email reply drafting.
- Better detection of resolved conversations.
- Configurable follow-up intervals.
- Priority classification and deadline detection.
- A daily summary of pending email actions.
- A dashboard for tracking outstanding replies and follow-ups.

## Goal

InboxPilot aims to reduce missed email responses, improve follow-up discipline, and help users manage their inbox through free, automated workflows.
