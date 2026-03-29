# Jira Standup Widget

A Chrome extension that turns Jira sprint standups into a fun, randomized and automated process. 

## What it does

When you're running a standup and want to let everyone speak:

1. **Setup**: Visit your Jira sprint board → click the extension icon → see all assignees from sprint cards
2. **Start**: Uncheck anyone who's not attending, then click **Start Standup**
3. **Navigate**: Navigate to each person on the board randomly
4. **No repeats**: Each person is only picked once—the extension tracks who's spoken
5. **Discussions**: Discussions outside of the board

## Installation

1. **Clone or download** this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (toggle in top right)
4. Click **Load unpacked**
5. Select this repository folder
6. Navigate to any **Jira sprint board** (URL contains `jira/software/projects/.../board`)
7. Click the extension icon to start the standup

## Usage

### Setup Phase
- The extension scrapes assignees from sprint cards on the board
- All attendees are pre-checked by default
- Use **All** / **None** shortcuts to quickly select or deselect everyone
- Uncheck anyone absent (not attending the standup)

### Picking Phase
- Click **Start Standup** to begin
- A randomly selected person is immediately shown on their own card
- The Jira board is automatically filtered to that person's tickets
- Click **Next Person** to pick the next attendee
- A progress bar shows how many people remain

### Celebration Phase
- When the last person is picked, an "Ohne Tickets?" screen prompts updates for people without any cards on the board
- Then an "Any discussion?" screen covers other discussions, blockers, shoutouts, or announcements
- Finally a celebration screen appears — click **Start Over** to reset and run another standup

## How it works

The extension uses two scripts injected on Jira board pages:

- **widget.js**: Content script that scrapes assignee names from sprint cards via DOM queries and manages the floating widget UI state machine
- **background.js**: Service worker that listens for extension icon clicks and sends toggle messages to the content script

State Machine (5 phases):
```
SETUP ──(Start clicked, ≥1 selected)──► PICKING ──(all picked)──► NOT-ON-BOARD ──(Continue)──► ANY-DISCUSSION ──(End)──► COMPLETE
  ▲                                         ▲                                                                            │
  │                                         └─────────(Back)─────────────────────────────────────────────────────────────┤
  └────────────────────────────────────────────────────────────(Start Over)──────────────────────────────────────────────┘
```

## Testing

The extension logic is covered by unit and integration tests using [Vitest](https://vitest.dev/) with a jsdom environment.

### Run tests

```bash
npm install
npm run test              # single run
npm run test:watch        # watch mode
```

### Test structure

| Directory | What it covers |
|---|---|
| `tests/unit/` | Pure functions: `isValidAssignee`, `scrapeAssignees`, `addStyles`, `createWidget` |
| `tests/integration/` | State machine phases and transitions, Chrome toggle message handler |

## Limitations

- **Jira Cloud only** — works on atlassian.net, not self-hosted Jira
- **Assigned cards only** — only picks people who have sprint cards assigned to them
- **No persistence** — picking order is not saved between sessions
- **No favorites** — can't pin someone to always go first (use All/None to customize)
- **Manual reload** — if you add/remove people from the board mid-standup, reload the extension popup

## Files

| File | Purpose |
|------|---------|
| `widget.js` | Content script injected on Jira pages; creates floating widget, scrapes assignees, manages state machine, handles filtering |
| `background.js` | Service worker that listens for extension icon clicks and sends `TOGGLE_WIDGET` messages to content scripts |
| `manifest.json` | MV3 extension config (permissions, content script injection, action handler) |
| `icons/` | Extension icons (16px, 48px, 128px) |
| `tests/` | Vitest unit and integration tests |
| `vitest.config.js` | Test runner configuration (jsdom environment) |
| `package.json` | npm scripts and dev dependencies (Vitest, coverage) |
