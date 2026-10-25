# Calendar ICS Tool

A local web tool that lets you:

- paste a screenshot directly (Ctrl+V) and OCR it
- paste plain text with event details
- enter a name and lunar birthday using `DD-MM-YYYY`; Gregorian birthdate is optional
- generate 60 future all-day lunar birthday reminders with one-day alerts
- type UTC offsets or city/IANA timezones; the lunar birthday timezone defaults to UTC+7 Ho Chi Minh City
- apply each selected city's daylight-saving rules on the event date; all-day birthdays remain on their date
- automatically detect separate start and end timezones from each event's departure and arrival places, with independent manual overrides
- review parsed events
- choose one ICS file for all events or one file per event
- pick an output folder and save files

## Run

```bash
npm install
npm start
```

Then open `http://localhost:3000`.

## Publish with GitHub Pages

1. Create a GitHub repository and push this project to its `main` branch.
2. Open the repository's **Settings > Pages**.
3. Under **Build and deployment**, choose **GitHub Actions** as the source.
4. Run the **Deploy to GitHub Pages** workflow or push another change to `main`.

The published site is installable from the browser. On iPhone, use **Share > Add to Home Screen**. On Android, use **Install app** from the browser menu.

The deployment workflow publishes the static `public/` directory. No hosted Node.js server is required.

## Notes

- The event workspace menu chooses text/screenshot, lunar birthday, or recurring event. Each creation has a **Details** step followed by an inline **Review & export** step. Switching event types preserves their separate drafts and event lists; export includes only the active creation type. Returning to recurring-event details updates the current series instead of duplicating it. Schedule details and description/skipped dates are collapsible.
- All timezone fields suggest matching city/IANA timezones while typing. Choose a suggestion with a pointer or Arrow Up/Down and Enter; Escape dismisses the list. Common city aliases such as Edinburgh, Rennes, Kyoto, Hanoi, and Seattle are included alongside the browser's supported IANA cities. Selection updates the event or recurrence preview immediately; unrecognized cities are not guessed.
- Text/screenshot events and recurring schedules have separate **Start timezone** and **End timezone** fields. Ordered routes such as `Paris CDG2E to Toronto YYZ3`, `CDG → YYZ`, or `CDG-YYZ` detect departure and arrival zones independently. Detection checks routes in the location, title, then description; a single recognizable venue uses the same zone for both endpoints. Each endpoint has its own automatic-detection checkbox; manually typing/selecting one zone does not disable detection for the other.
- All-day events (including hotel stays and recurring all-day schedules) show the same timezone fields, with automatic detection and manual overrides. Their calendar dates remain fixed: ICS all-day `DTSTART`/`DTEND` remain `VALUE=DATE`, without `TZID`. Selected zones are preserved in supplemental `X-START-TIMEZONE` and `X-END-TIMEZONE` properties; calendar apps may ignore these custom fields. Empty zones are allowed for all-day events; invalid nonempty zones must be corrected before export.
- Locations keep cities or addresses, not fare notes or prices. For example, `Paris CDG-2G to Rennes RNS included in above fare` becomes `Paris to Rennes`; airport-only routes such as `CDG → YYZ` become `Paris to Toronto`. Street addresses retain their numbers and punctuation. The original source/location text stays in the description. Extraction, review edits (on leaving the location field), recurring forms, and ICS export apply the same cleanup.
- Detection uses the browser's IANA city list, common city aliases, selected single-timezone country names, and a bundled list of common airport codes (including terminal suffixes), not a worldwide flight/address database. Unknown endpoints and ambiguous multi-leg routes require manual choices. Flight numbers alone do not identify a route, and no flight-tracking or geocoding requests are made; detection works offline. All-day dates are unchanged.
- Pasted columns are `Title | Date and times | Location | Description | Start timezone | End timezone`. The last two columns are optional. A single explicit fifth timezone column overrides both zones for backward compatibility; supply a sixth column for a different arrival zone. Without overrides, route detection fills both fields.
- Keep departure and arrival times in their respective local timezones; export converts each endpoint separately to UTC, applying daylight saving on its own date. **End date** defaults to the earliest date making arrival later than departure; review it for overnight/date-line flights and edit it if needed. Clearing it resumes inference. A `+1` or `(+1)` immediately after an arrival time explicitly sets the following date. Recurring schedules use their **Ends the next day** control instead.
- Flight-event titles include the available flight number and local time range, for example `Flight AF1290: Paris to Catania (09:20-12:05)`. Numbers can be extracted from the title, location, or description; missing flight numbers or times are not invented. Editing the event times updates the title and exported ICS summary. The first time is local to departure and the second to arrival.
- Recurrence can be configured with the dropdowns or filled from English text, for example `Tom's birthday every year on Jun 5`, `Team sync every Monday and Wednesday`, `Rent every month on the 1st`, or `Payroll every month on the last Friday`. Intervals, quarterly schedules, `for 5 occurrences`, and explicit end dates such as `until December 31 2026` are supported. Filling a schedule does not add it to the calendar until you confirm it.
- Natural-language recurrence is a local, rule-based parser, not AI. It creates all-day drafts starting at the next matching date from today; times, timezones, reminders, and exceptions remain editable in the form. Unsupported or ambiguous wording is rejected without changing the draft. Yearly dates without a year use the current-year interval anchor; nonexistent dates are skipped.
- Recurring events support daily, weekly, monthly, quarterly (every three months), and yearly schedules, with custom intervals, multiple weekdays/months/month dates, first-to-fifth or last weekday patterns, and Monday/Sunday week starts.
- Series can be all-day or timed, include reminders and skipped dates, and end never, on an inclusive date, or after a set number of occurrences. The preview shows the first five non-skipped occurrences. Count limits apply before skipped dates are removed.
- The first exported date is the first matching schedule date on or after the chosen first date. Nonexistent dates (such as February 30 or a fifth Monday that does not occur) are skipped, not shifted. Choose "Last" for the last day of every month.
- Timed series require city/IANA timezones (such as `Europe/Paris`) at both endpoints, not fixed UTC offsets, to preserve daylight-saving rules. Overnight events can end the next day. Calendar applications interpret `DTSTART` in the departure zone, `DTEND` in the arrival zone, and the exported `RRULE` and departure-zone `EXDATE` properties.
- Use **Edit recurrence** in event review to update an existing series. Each series exports as one recurring VEVENT. The bundled `rrule` 2.8.1 library computes schedules locally; no server or AI is required.
- Output-folder save uses the browser File System Access API (supported in Chromium-based browsers).
- OCR is done in-browser with the bundled Tesseract.js client.
- Lunar birthday conversion uses the bundled `lunar-javascript` library and supports years 1901–2099.
- The service worker caches the app after its first successful online load for offline use.
- OCR downloads additional worker and language-model files on first use, so run OCR online once before relying on it offline.
