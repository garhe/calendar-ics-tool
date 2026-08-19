const pasteZone = document.getElementById('pasteZone');
const imagePreview = document.getElementById('imagePreview');
const ocrButton = document.getElementById('ocrButton');
const rawText = document.getElementById('rawText');
const parseButton = document.getElementById('parseButton');
const toggleEventsButton = document.getElementById('toggleEventsButton');
const eventsRegion = document.getElementById('eventsRegion');
const eventsContainer = document.getElementById('eventsContainer');
const addEventButton = document.getElementById('addEventButton');
const pickFolderButton = document.getElementById('pickFolderButton');
const exportButton = document.getElementById('exportButton');
const folderStatus = document.getElementById('folderStatus');
const statusEl = document.getElementById('status');
const birthdayName = document.getElementById('birthdayName');
const birthDate = document.getElementById('birthDate');
const lunarBirthday = document.getElementById('lunarBirthday');
const birthdayTimezone = document.getElementById('birthdayTimezone');
const timezoneOptions = document.getElementById('timezoneOptions');
const generateBirthdayButton = document.getElementById('generateBirthdayButton');
const lunarStatus = document.getElementById('lunarStatus');

let pastedImageBlob = null;
let folderHandle = null;

const state = {
  events: []
};

const defaultTimezone = 'Asia/Ho_Chi_Minh';
const defaultTimezoneLabel = 'UTC+7 Ho Chi Minh City';
const supportedTimezones = typeof Intl.supportedValuesOf === 'function'
  ? Intl.supportedValuesOf('timeZone')
  : [defaultTimezone];
const timezoneAliases = [
  { label: 'HCMC / Ho Chi Minh City', timezone: defaultTimezone, terms: 'hcmc saigon vietnam' },
  { label: 'Hanoi', timezone: defaultTimezone, terms: 'ha noi vietnam' }
];

birthdayTimezone.value = defaultTimezoneLabel;

function normalizeTimezoneSearch(value) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function timezoneSearchResults(value) {
  const searchValue = normalizeTimezoneSearch(value);
  if (!searchValue) return timezoneAliases;

  const aliases = timezoneAliases.filter(({ label, terms }) =>
    normalizeTimezoneSearch(`${label} ${terms}`).includes(searchValue)
  );
  const cities = supportedTimezones
    .filter((timezone) => normalizeTimezoneSearch(timezone).includes(searchValue))
    .map((timezone) => ({
      label: timezone.replaceAll('_', ' ').replace('/', ' / '),
      timezone
    }));

  return [...aliases, ...cities]
    .filter((result, index, results) =>
      results.findIndex(({ timezone }) => timezone === result.timezone) === index
    )
    .slice(0, 8);
}

function hideTimezoneOptions() {
  timezoneOptions.hidden = true;
  birthdayTimezone.setAttribute('aria-expanded', 'false');
}

function showTimezoneOptions() {
  const results = timezoneSearchResults(birthdayTimezone.value);
  timezoneOptions.replaceChildren(...results.map(({ label, timezone }) => {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'timezone-option';
    option.setAttribute('role', 'option');
    option.dataset.timezone = timezone;
    option.textContent = `${label} (${timezone})`;
    return option;
  }));
  timezoneOptions.hidden = results.length === 0;
  birthdayTimezone.setAttribute('aria-expanded', String(results.length > 0));
}

birthdayTimezone.addEventListener('input', showTimezoneOptions);
birthdayTimezone.addEventListener('focus', showTimezoneOptions);
birthdayTimezone.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') hideTimezoneOptions();
});
timezoneOptions.addEventListener('mousedown', (event) => {
  const option = event.target.closest('.timezone-option');
  if (!option) return;
  event.preventDefault();
  birthdayTimezone.value = option.dataset.timezone;
  hideTimezoneOptions();
});
document.addEventListener('mousedown', (event) => {
  if (!event.target.closest('.timezone-field')) hideTimezoneOptions();
});

function resolveTimezone(value) {
  const enteredValue = String(value || '').trim();
  if (!enteredValue) return defaultTimezone;

  const normalizedValue = normalizeTimezoneSearch(enteredValue);
  if (
    normalizedValue === 'hcmc'
    || normalizedValue === 'hanoi'
    || normalizedValue === 'hanoivietnam'
    || normalizedValue.includes('hochiminh')
  ) {
    return defaultTimezone;
  }

  const exactTimezone = supportedTimezones.find(
    (timezone) => timezone.toLowerCase() === enteredValue.toLowerCase()
  );
  if (exactTimezone) return exactTimezone;

  const cityTimezone = supportedTimezones.find((timezone) => {
    const city = timezone.split('/').at(-1);
    return normalizeTimezoneSearch(city) === normalizedValue;
  });
  if (cityTimezone) return cityTimezone;

  const offsetMatch = enteredValue.match(/^(?:utc|gmt)\s*([+-])\s*(\d{1,2})(?::?(\d{2}))?$/i);
  if (offsetMatch) {
    const hours = Number(offsetMatch[2]);
    const minutes = Number(offsetMatch[3] || 0);
    if (hours <= 14 && minutes < 60 && (hours < 14 || minutes === 0)) {
      return `UTC${offsetMatch[1]}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
  }

  return enteredValue;
}

function setStatus(message) {
  statusEl.textContent = message;
}

function sanitizeFilename(name, fallback = 'event') {
  const cleaned = String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return cleaned || fallback;
}

function lunarCalendarFilename(event) {
  const person = String(event.calendarOwner || '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '_')
    .replace(/^_+|_+$/g, '');

  return `${person || 'birthday'}_lunar_calendar.ics`;
}

function escapeIcsText(text) {
  return String(text || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function toIcsDateTime(date, time) {
  if (!date || !time) {
    return null;
  }

  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  const dt = new Date(year, (month || 1) - 1, day || 1, hours || 0, minutes || 0, 0);

  const pad = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
}

function formatNowUtcStamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
}

function toIcsDate(date) {
  return date.replace(/-/g, '');
}

function nextDate(date) {
  const [year, month, day] = date.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return next.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

function isIanaTimezone(timezone) {
  try {
    new Intl.DateTimeFormat('en', { timeZone: timezone }).format();
    return timezone.includes('/') || timezone === 'UTC';
  } catch {
    return false;
  }
}

function fixedTimezoneOffsetMinutes(timezone) {
  const match = timezone.match(/^UTC([+-])(\d{2}):(\d{2})$/);
  if (!match) return null;
  const minutes = Number(match[2]) * 60 + Number(match[3]);
  return match[1] === '+' ? minutes : -minutes;
}

function toIcsUtcDateTime(date, time, offsetMinutes) {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes) - offsetMinutes * 60000);
  return utcDate.toISOString().replace(/[-:]/g, '').replace(/\.000Z$/, 'Z');
}

function eventToIcsBlock(event, timezone = resolveTimezone(birthdayTimezone.value)) {
  const eventTimezone = resolveTimezone(event.timezone || timezone);
  const fixedOffsetMinutes = fixedTimezoneOffsetMinutes(eventTimezone);
  const dtStart = event.allDay
    ? toIcsDate(event.date)
    : fixedOffsetMinutes === null
      ? toIcsDateTime(event.date, event.startTime)
      : toIcsUtcDateTime(event.date, event.startTime, fixedOffsetMinutes);
  const dtEnd = event.allDay
    ? toIcsDate(event.endDate || nextDate(event.date))
    : fixedOffsetMinutes === null
      ? toIcsDateTime(event.date, event.endTime)
      : toIcsUtcDateTime(event.date, event.endTime, fixedOffsetMinutes);

  if (!dtStart || !dtEnd) {
    return null;
  }

  const uid = `${crypto.randomUUID()}@calendar-ics-tool`;
  const timezoneParameter = isIanaTimezone(eventTimezone) ? `;TZID=${eventTimezone}` : '';

  const lines = [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatNowUtcStamp()}`,
    event.allDay ? `DTSTART;VALUE=DATE:${dtStart}` : `DTSTART${timezoneParameter}:${dtStart}`,
    event.allDay ? `DTEND;VALUE=DATE:${dtEnd}` : `DTEND${timezoneParameter}:${dtEnd}`,
    `SUMMARY:${escapeIcsText(event.title || 'Untitled Event')}`,
    `LOCATION:${escapeIcsText(event.location || '')}`,
    `DESCRIPTION:${escapeIcsText(event.description || '')}`
  ];

  if (Number.isFinite(event.alarmMinutes)) {
    const trigger = event.allDay && event.alarmMinutes === 1440
      ? '-P1D'
      : event.alarmMinutes === 0 ? 'PT0M' : `-PT${event.alarmMinutes}M`;
    lines.push(
      'BEGIN:VALARM',
      `TRIGGER:${trigger}`,
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeIcsText(event.title || 'Reminder')}`,
      'END:VALARM'
    );
  }

  lines.push('END:VEVENT');
  return lines.join('\r\n');
}

function getLunarDate(year, month, day) {
  const lunar = Solar.fromYmd(year, month, day).getLunar();
  return {
    year: lunar.getYear(),
    month: Math.abs(lunar.getMonth()),
    day: lunar.getDay(),
    isLeapMonth: lunar.getMonth() < 0
  };
}

function parseCalendarDate(value) {
  const match = value.trim().match(/^(\d{1,2})\s*[-/]\s*(\d{1,2})\s*[-/]\s*(\d{4})$/);
  if (!match) {
    return null;
  }

  return {
    day: Number(match[1]),
    month: Number(match[2]),
    year: Number(match[3])
  };
}

function isValidGregorianDate(date) {
  if (!date) {
    return false;
  }

  const check = new Date(Date.UTC(date.year, date.month - 1, date.day));
  return check.getUTCFullYear() === date.year
    && check.getUTCMonth() + 1 === date.month
    && check.getUTCDate() === date.day;
}

function formatDisplayDate(date) {
  return [
    String(date.day).padStart(2, '0'),
    String(date.month).padStart(2, '0'),
    date.year
  ].join('-');
}

function formatCalendarDateInput(event) {
  const digits = event.target.value.replace(/\D/g, '').slice(0, 8);
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean);
  event.target.value = parts.join('-');
}

function updateLunarBirthdayFromGregorian(event) {
  formatCalendarDateInput(event);
  const gregorianDate = parseCalendarDate(birthDate.value);

  if (!isValidGregorianDate(gregorianDate) || typeof Solar === 'undefined') {
    lunarBirthday.value = '';
    return;
  }

  lunarBirthday.value = formatDisplayDate(
    getLunarDate(gregorianDate.year, gregorianDate.month, gregorianDate.day)
  );
}

birthDate.addEventListener('input', updateLunarBirthdayFromGregorian);
lunarBirthday.addEventListener('input', formatCalendarDateInput);

function findGregorianDateForLunarYear(lunarYear, lunarBirthDate, requireLeapMonth) {
  const lunarMonth = requireLeapMonth ? -lunarBirthDate.month : lunarBirthDate.month;

  try {
    return Lunar.fromYmd(lunarYear, lunarMonth, lunarBirthDate.day).getSolar().toYmd();
  } catch {
    return null;
  }
}

function makeCalendarIcs(events) {
  const timezone = resolveTimezone(birthdayTimezone.value);
  const blocks = events
    .map((event) => eventToIcsBlock(event, timezone))
    .filter(Boolean)
    .join('\r\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Calendar ICS Tool//EN',
    'CALSCALE:GREGORIAN',
    `X-WR-TIMEZONE:${timezone}`,
    blocks,
    'END:VCALENDAR',
    ''
  ].join('\r\n');
}

async function exportIcsFile(filename, content) {
  if (folderHandle) {
    try {
      const file = await folderHandle.getFileHandle(filename, { create: true });
      const writable = await file.createWritable();
      await writable.write(content);
      await writable.close();
      return;
    } catch (error) {
      if (error?.name !== 'NotAllowedError' && error?.name !== 'SecurityError') throw error;
      folderHandle = null;
      folderStatus.textContent = 'Folder access unavailable; exporting to browser Downloads';
    }
  }

  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function inferEventsFromText(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const events = [];

  for (const line of lines) {
    const parts = line.split('|').map((p) => p.trim());
    if (parts.length < 2) {
      const itineraryEvent = inferItineraryEvent(line);
      if (itineraryEvent) events.push(itineraryEvent);
      continue;
    }

    const title = parts[0];
    const dateTime = parts[1] || '';
    const location = parts[2] || '';
    const description = parts[3] || '';
    const timezone = parts[4] || '';

    const dateMatch = dateTime.match(/(\d{4}-\d{2}-\d{2})/);
    const timeMatch = dateTime.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);

    const date = dateMatch ? dateMatch[1] : '';
    const startTime = timeMatch ? normalizeTime(timeMatch[1]) : '';
    const endTime = timeMatch ? normalizeTime(timeMatch[2]) : '';

    events.push({ title, date, startTime, endTime, timezone, location, description });
  }

  return events;
}

const monthNumbers = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12
};

function itineraryDate(day, monthName, year = new Date().getFullYear()) {
  const month = monthNumbers[monthName.toLowerCase()];
  if (!month) return '';
  return `${year}-${String(month).padStart(2, '0')}-${String(Number(day)).padStart(2, '0')}`;
}

function inferItineraryEvent(line) {
  const timedMatch = line.match(/^(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?\s+(\d{1,2})h(\d{2})\s*>\s*(\d{1,2})h(\d{2})\s*:\s*(.+)$/i);
  if (timedMatch) {
    const [, day, month, year, startHour, startMinute, endHour, endMinute, details] = timedMatch;
    const transportMatch = details.match(/^(Train|Bus)\s+(.+?\d+)\s+(.+?)\s*>\s*(.+?)(?:\s+(Included\b.*|\d+(?:[.,]\d+)?\s*€.*))?$/iu);
    if (!transportMatch) return null;

    const [, mode, service, origin, destination, fare = ''] = transportMatch;
    return {
      title: `${mode} ${service}: ${origin} to ${destination}`,
      date: itineraryDate(day, month, year ? Number(year) : undefined),
      startTime: `${String(Number(startHour)).padStart(2, '0')}:${startMinute}`,
      endTime: `${String(Number(endHour)).padStart(2, '0')}:${endMinute}`,
      timezone: 'Europe/Paris',
      location: `${origin} to ${destination}`,
      description: fare
    };
  }

  const stayMatch = line.match(/^(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?\s*>\s*\d{1,2}\s+[a-z]+(?:\s+\d{4})?\s*:\s*(\d+)\s+nights?\s+in\s+(.+?)(?:\s+(\d+(?:[.,]\d+)?\s*€.*))?$/iu);
  if (!stayMatch) return null;

  const [, day, month, year, nightCount, location, price = ''] = stayMatch;
  const date = itineraryDate(day, month, year ? Number(year) : undefined);
  const nights = Number(nightCount);
  return {
    title: `${nights}-night stay in ${location}`,
    date,
    endDate: addDays(date, nights),
    allDay: true,
    timezone: 'Europe/Paris',
    location,
    description: price
  };
}

function normalizeTime(value) {
  const [h, m] = value.split(':').map((n) => Number(n));
  if (Number.isNaN(h) || Number.isNaN(m)) {
    return '';
  }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function renderEvents() {
  eventsContainer.innerHTML = '';
  const expanded = toggleEventsButton.getAttribute('aria-expanded') === 'true';
  toggleEventsButton.textContent = `${expanded ? 'Hide' : 'Show'} events (${state.events.length})`;

  if (state.events.length === 0) {
    eventsContainer.innerHTML = '<p class="hint">No events yet. Extract from text or add one manually.</p>';
    return;
  }

  state.events.forEach((event, index) => {
    const card = document.createElement('div');
    card.className = 'event-card';
    card.innerHTML = `
      <div class="event-head">
        <strong>Event ${index + 1}</strong>
        <button type="button" data-remove="${index}">Remove</button>
      </div>
      <label>Title<input data-key="title" data-index="${index}" type="text" value="${escapeHtml(event.title)}"></label>
      <div class="event-grid">
        <label>Date<input data-key="date" data-index="${index}" type="date" value="${escapeHtml(event.date)}"></label>
        <label>Location<input data-key="location" data-index="${index}" type="text" value="${escapeHtml(event.location)}"></label>
        ${event.allDay
          ? '<div class="all-day-label">All-day event</div>'
          : `<label>Start<input data-key="startTime" data-index="${index}" type="time" value="${escapeHtml(event.startTime)}"></label>
             <label>End<input data-key="endTime" data-index="${index}" type="time" value="${escapeHtml(event.endTime)}"></label>
             <label>Timezone (required)<input data-key="timezone" data-index="${index}" type="text" required placeholder="City or UTC offset" value="${escapeHtml(event.timezone)}"></label>`}
      </div>
      <label>Description<input data-key="description" data-index="${index}" type="text" value="${escapeHtml(event.description)}"></label>
    `;

    eventsContainer.appendChild(card);
  });
}

toggleEventsButton.addEventListener('click', () => {
  const expanded = toggleEventsButton.getAttribute('aria-expanded') === 'true';
  toggleEventsButton.setAttribute('aria-expanded', String(!expanded));
  eventsRegion.hidden = expanded;
  toggleEventsButton.textContent = `${expanded ? 'Show' : 'Hide'} events (${state.events.length})`;
});

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

document.addEventListener('paste', (event) => {
  const items = event.clipboardData?.items || [];
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      pastedImageBlob = item.getAsFile();
      const url = URL.createObjectURL(pastedImageBlob);
      const img = new Image();
      img.onload = () => {
        imagePreview.width = img.width;
        imagePreview.height = img.height;
        const ctx = imagePreview.getContext('2d');
        ctx.drawImage(img, 0, 0);
        imagePreview.hidden = false;
        ocrButton.disabled = false;
        setStatus('Screenshot pasted. Click "Run OCR on Pasted Screenshot".');
        URL.revokeObjectURL(url);
      };
      img.src = url;
      event.preventDefault();
      return;
    }
  }
});

parseButton.addEventListener('click', () => {
  const text = rawText.value.trim();
  if (!text) {
    setStatus('Paste or type event text first.');
    return;
  }

  state.events = inferEventsFromText(text);
  renderEvents();

  setStatus(`Extracted ${state.events.length} event(s). Review and edit before export.`);
});

document.addEventListener('input', (event) => {
  const target = event.target;
  const index = Number(target.dataset.index);
  const key = target.dataset.key;

  if (Number.isInteger(index) && key && state.events[index]) {
    state.events[index][key] = target.value;
  }
});

eventsContainer.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-remove]');
  if (!button) {
    return;
  }

  const index = Number(button.dataset.remove);
  if (Number.isInteger(index)) {
    state.events.splice(index, 1);
    renderEvents();
  }
});

addEventButton.addEventListener('click', () => {
  state.events.push({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    timezone: '',
    location: '',
    description: ''
  });
  renderEvents();
});

generateBirthdayButton.addEventListener('click', () => {
  const name = birthdayName.value.trim();
  const enteredLunarBirthDate = parseCalendarDate(lunarBirthday.value);

  if (!name || !enteredLunarBirthDate) {
    lunarStatus.textContent = 'Enter a name and lunar birthday as DD-MM-YYYY.';
    return;
  }

  if (typeof Solar === 'undefined' || typeof Lunar === 'undefined') {
    lunarStatus.textContent = 'The lunar calendar library did not load. Check your internet connection and reload.';
    return;
  }

  let validatedLunarDate;
  try {
    validatedLunarDate = Lunar.fromYmd(
      enteredLunarBirthDate.year,
      enteredLunarBirthDate.month,
      enteredLunarBirthDate.day
    );
  } catch {
    lunarStatus.textContent = 'Enter a valid lunar birthday as DD-MM-YYYY.';
    return;
  }

  const lunarBirthDate = {
    year: validatedLunarDate.getYear(),
    month: Math.abs(validatedLunarDate.getMonth()),
    day: validatedLunarDate.getDay(),
    isLeapMonth: validatedLunarDate.getMonth() < 0
  };

  const generatedEvents = [];
  let skippedYears = 0;
  const today = new Date();
  const todayYmd = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0')
  ].join('-');

  for (let lunarYear = today.getFullYear(); generatedEvents.length < 60; lunarYear += 1) {
    const date = findGregorianDateForLunarYear(lunarYear, lunarBirthDate, false);
    if (!date) {
      skippedYears += 1;
      continue;
    }
    if (date < todayYmd) {
      continue;
    }

    generatedEvents.push({
      title: `${name}'s Lunar Birthday`,
      date,
      allDay: true,
      calendarOwner: name,
      calendarType: 'lunar-birthday',
      timezone: resolveTimezone(birthdayTimezone.value),
      location: '',
      description: `Annual lunar birthday: month ${lunarBirthDate.month}, day ${lunarBirthDate.day}${lunarBirthDate.isLeapMonth ? ' (born in leap month)' : ''}.`,
      alarmMinutes: 1440
    });
  }

  state.events = generatedEvents;
  renderEvents();

  const lunarLabel = `${lunarBirthDate.isLeapMonth ? 'leap ' : ''}month ${lunarBirthDate.month}, day ${lunarBirthDate.day}`;
  const skippedLabel = skippedYears ? ` Skipped ${skippedYears} year(s) where that lunar date does not occur.` : '';
  lunarStatus.textContent = `Added 60 future all-day reminders for lunar ${lunarLabel}.${skippedLabel}`;
  setStatus('Added 60 lunar birthday reminders with one-day alerts. Review them before export.');
});

ocrButton.addEventListener('click', async () => {
  if (!pastedImageBlob) {
    setStatus('Paste a screenshot first.');
    return;
  }

  setStatus('Running OCR...');

  try {
    const { data } = await Tesseract.recognize(pastedImageBlob, 'eng');
    rawText.value = data.text;
    setStatus('OCR done. Review text and click "Extract Events".');
  } catch (error) {
    console.error(error);
    setStatus('OCR failed. Try a clearer screenshot or paste text manually.');
  }
});

pickFolderButton.addEventListener('click', async () => {
  if (!('showDirectoryPicker' in window)) {
    setStatus('Folder selection is unavailable here. Export will use your browser Downloads folder.');
    return;
  }

  try {
    folderHandle = await window.showDirectoryPicker();
    folderStatus.textContent = `Selected: ${folderHandle.name}`;
    setStatus('Output folder selected. Choose file mode and export.');
  } catch {
    setStatus('Folder selection canceled. Export will use your browser Downloads folder.');
  }
});

exportButton.addEventListener('click', async () => {
  const invalidTimezoneEvent = state.events.find((event) => {
    if (event.allDay) return false;
    const timezone = resolveTimezone(event.timezone);
    return !event.timezone || (!isIanaTimezone(timezone) && fixedTimezoneOffsetMinutes(timezone) === null);
  });
  if (invalidTimezoneEvent) {
    setStatus('Every timed event requires a valid city/IANA timezone or UTC offset.');
    return;
  }

  const validEvents = state.events.filter((event) => (
    event.title && event.date && (event.allDay || (event.startTime && event.endTime && event.timezone))
  ));
  if (validEvents.length === 0) {
    setStatus('Need at least one complete event with a title and date.');
    return;
  }

  const mode = document.querySelector('input[name="mode"]:checked').value;

  try {
    if (mode === 'single') {
      const ics = makeCalendarIcs(validEvents);
      const filename = validEvents.every((event) => event.calendarType === 'lunar-birthday')
        ? lunarCalendarFilename(validEvents[0])
        : 'calendar-events.ics';
      await exportIcsFile(filename, ics);
      setStatus(`${folderHandle ? 'Saved' : 'Downloaded'} 1 file with ${validEvents.length} event(s).`);
      return;
    }

    let created = 0;
    for (const event of validEvents) {
      const name = `${sanitizeFilename(event.title, 'event')}-${event.date || 'date'}.ics`;
      await exportIcsFile(name, makeCalendarIcs([event]));
      created += 1;
    }

    setStatus(`${folderHandle ? 'Saved' : 'Downloaded'} ${created} file(s), one per event.`);
  } catch (error) {
    console.error(error);
    setStatus('Failed to write file(s). Check folder permissions and try again.');
  }
});

pasteZone.addEventListener('click', () => {
  pasteZone.focus();
});

renderEvents();
