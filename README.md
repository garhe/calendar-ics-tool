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

- Output-folder save uses the browser File System Access API (supported in Chromium-based browsers).
- OCR is done in-browser with the bundled Tesseract.js client.
- Lunar birthday conversion uses the bundled `lunar-javascript` library and supports years 1901–2099.
- The service worker caches the app after its first successful online load for offline use.
- OCR downloads additional worker and language-model files on first use, so run OCR online once before relying on it offline.
