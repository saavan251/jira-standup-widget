# Jira Standup Picker

A Chrome extension that turns Jira sprint standups into a fun, fairness-enforced random selection process. Pick each team member once in random order, no repeats, and celebrate when everyone's had their turn.

## What it does

When you're running a standup and want to let everyone speak:

1. **Setup**: Visit your Jira sprint board → click the extension icon → see all assignees from sprint cards
2. **Start**: Uncheck anyone who's not attending, then click **Start Standup**
3. **Pick**: Watch a slot machine animation cycle through remaining team members
4. **No repeats**: Each person is only picked once—the extension tracks who's spoken
5. **Celebrate**: When everyone's had their turn, a confetti celebration appears with the full speaking order

Perfect for enforcing equal voice time and keeping standups lively.

## Installation

1. **Clone or download** this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (toggle in top right)
4. Click **Load unpacked**
5. Select this repository folder
6. Navigate to any **Jira sprint board** (URL contains `jira/software/projects/.../board`)
7. Click the extension icon to open the picker

## Usage

### Setup Phase
- The extension scrapes assignees from sprint cards on the board
- All attendees are pre-checked by default
- Use **All** / **None** shortcuts to quickly select or deselect everyone
- Uncheck anyone absent (not attending the standup)

### Picking Phase
- Click **Start Standup** to begin
- The slot machine animation cycles through remaining people
- Click **Next Person** to pick the next attendee
- Picked people are dimmed and crossed out—they can't be re-picked
- A counter shows how many people remain

### Celebration Phase
- When the last person is picked, you'll see a celebration screen
- The complete speaking order is displayed as a numbered list
- Click **Start Over** to reset and run another standup

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

## Limitations

- **Jira Cloud only** — works on atlassian.net, not self-hosted Jira
- **Assigned cards only** — only picks people who have sprint cards assigned to them
- **No persistence** — picking order is not saved between sessions
- **No favorites** — can't pin someone to always go first (use All/None to customize)
- **Manual reload** — if you add/remove people from the board mid-standup, reload the extension popup

## Files

| File | Purpose |
|------|---------|
| `widget.js` | Content script injected on Jira pages; creates floating widget, scrapes assignees, manages state machine, handles filtering and animations |
| `background.js` | Service worker that listens for extension icon clicks and sends `TOGGLE_WIDGET` messages to content scripts |
| `manifest.json` | MV3 extension config (permissions, content script injection, action handler) |
| `icons/` | Extension icons (16px, 48px, 128px) |
