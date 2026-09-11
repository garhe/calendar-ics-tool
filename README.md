# Calendar ICS Tool

A local web tool that lets you:

- paste a screenshot directly (Ctrl+V) and OCR it
- paste plain text with event details
- enter a name and lunar birthday using `DD-MM-YYYY`; Gregorian birthdate is optional
- generate 60 future all-day lunar birthday reminders with one-day alerts
- type a UTC offset or city/IANA timezone, defaulting to UTC+7 Ho Chi Minh City
- apply each selected city's daylight-saving rules on the event date; all-day birthdays remain on their date
- require each timed event to include its own city/IANA timezone or UTC offset
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
- Recurrence can be configured with the dropdowns or filled from English text, for example `Tom's birthday every year on Jun 5`, `Team sync every Monday and Wednesday`, `Rent every month on the 1st`, or `Payroll every month on the last Friday`. Intervals, quarterly schedules, `for 5 occurrences`, and explicit end dates such as `until December 31 2026` are supported. Filling a schedule does not add it to the calendar until you confirm it.
- Natural-language recurrence is a local, rule-based parser, not AI. It creates all-day drafts starting at the next matching date from today; times, timezones, reminders, and exceptions remain editable in the form. Unsupported or ambiguous wording is rejected without changing the draft. Yearly dates without a year use the current-year interval anchor; nonexistent dates are skipped.
- Recurring events support daily, weekly, monthly, quarterly (every three months), and yearly schedules, with custom intervals, multiple weekdays/months/month dates, first-to-fifth or last weekday patterns, and Monday/Sunday week starts.
- Series can be all-day or timed, include reminders and skipped dates, and end never, on an inclusive date, or after a set number of occurrences. The preview shows the first five non-skipped occurrences. Count limits apply before skipped dates are removed.
- The first exported date is the first matching schedule date on or after the chosen first date. Nonexistent dates (such as February 30 or a fifth Monday that does not occur) are skipped, not shifted. Choose "Last" for the last day of every month.
- Timed series require a city/IANA timezone (such as `Europe/Paris`), not a fixed UTC offset, to preserve local times across daylight-saving changes. Overnight events can end the next day. Calendar applications interpret the exported `TZID`, `RRULE`, and `EXDATE` properties.
- Use **Edit recurrence** in event review to update an existing series. Each series exports as one recurring VEVENT. The bundled `rrule` 2.8.1 library computes schedules locally; no server or AI is required.
- Output-folder save uses the browser File System Access API (supported in Chromium-based browsers).
- OCR is done in-browser with the bundled Tesseract.js client.
- Lunar birthday conversion uses the bundled `lunar-javascript` library and supports years 1901–2099.
- The service worker caches the app after its first successful online load for offline use.
- OCR downloads additional worker and language-model files on first use, so run OCR online once before relying on it offline.
