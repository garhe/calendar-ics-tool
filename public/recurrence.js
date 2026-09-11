const recurrenceForm = document.getElementById('recurrenceForm');
const recurrenceFields = recurrenceForm.elements;
const recurrenceSummary = document.getElementById('recurrenceSummary');
const recurrencePreview = document.getElementById('recurrencePreview');
const recurrenceStatus = document.getElementById('recurrenceStatus');
let recurrenceEditingEvent = null;
let recurrenceExcludedDates = [];
const recurrenceWeekdayCodes = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

function recurrenceDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Choose a valid first date.');
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error('Choose a valid date.');
  }
  return date;
}

function recurrenceChoices(name) {
  return [...recurrenceForm.querySelectorAll(`input[name="${name}"]:checked`)].map((input) => input.value);
}

function recurrenceInteger(value, maximum, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > maximum) {
    throw new Error(`${label} must be between 1 and ${maximum}.`);
  }
  return number;
}

function recurrenceSettings() {
  const settings = Object.fromEntries(new FormData(recurrenceForm));
  settings.allDay = recurrenceFields.allDay.checked;
  settings.nextDay = recurrenceFields.nextDay.checked;
  settings.weekdays = recurrenceChoices('weekday');
  settings.months = recurrenceChoices('month');
  settings.monthDays = recurrenceChoices('monthDay');
  settings.excludedDates = [...recurrenceExcludedDates];
  return settings;
}

function buildRecurringEvent(settings) {
  if (typeof rrule === 'undefined') throw new Error('The recurrence library is unavailable. Reload the page.');
  const firstDate = recurrenceDate(settings.date);
  const interval = recurrenceInteger(settings.interval, 99, 'Repeat interval');
  const quarterly = settings.frequency === 'QUARTERLY';
  const frequency = quarterly ? 'MONTHLY' : settings.frequency;
  const options = {
    freq: rrule.RRule[frequency],
    interval: interval * (quarterly ? 3 : 1),
    dtstart: firstDate,
    wkst: rrule.RRule[settings.weekStart || 'MO']
  };
  if (!['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(frequency)) throw new Error('Choose a repeat frequency.');
  if (frequency === 'WEEKLY') {
    if (!settings.weekdays.length) throw new Error('Select at least one weekday.');
    options.byweekday = settings.weekdays.map((day) => rrule.RRule[day]);
  }
  if (frequency === 'YEARLY') {
    if (!settings.months.length) throw new Error('Select at least one month.');
    options.bymonth = settings.months.map(Number);
  }
  if (frequency === 'MONTHLY' || frequency === 'YEARLY') {
    if (settings.pattern === 'weekday') {
      options.byweekday = [rrule.RRule[settings.positionDay].nth(Number(settings.position))];
    } else {
      if (!settings.monthDays.length) throw new Error('Select at least one date of the month.');
      options.bymonthday = settings.monthDays.map(Number);
    }
  }
  if (settings.ending === 'count') options.count = recurrenceInteger(settings.count, 9999, 'Occurrence count');
  if (settings.ending === 'until') {
    const lastDate = recurrenceDate(settings.until);
    if (lastDate < firstDate) throw new Error('The last date must not be before the first date.');
    lastDate.setUTCHours(23, 59, 59);
    options.until = lastDate;
  }
  const timezone = resolveTimezone(settings.timezone);
  if (!settings.allDay) {
    if (!settings.timezone || !isIanaTimezone(timezone)) throw new Error('Choose a city or IANA timezone, such as Europe/Paris.');
    if (![settings.startTime, settings.endTime].every((time) => /^([01]\d|2[0-3]):[0-5]\d$/.test(time))) {
      throw new Error('Choose valid start and end times.');
    }
    if (!settings.nextDay && settings.endTime <= settings.startTime) throw new Error('End time must follow start time, or select next day.');
  }
  let rule = new rrule.RRule(options);
  const first = rule.after(new Date(firstDate.getTime() - 1));
  if (!first) throw new Error('No matching dates in this schedule.');
  rule = new rrule.RRule({ ...options, dtstart: first });
  const preview = [];
  rule.all((date) => {
    const dateString = date.toISOString().slice(0, 10);
    if (!settings.excludedDates.includes(dateString)) preview.push(dateString);
    return preview.length < 5;
  });
  if (!preview.length) throw new Error('No occurrences remain after skipped dates.');
  const date = first.toISOString().slice(0, 10);
  return {
    title: settings.title.trim(), location: settings.location, description: settings.description,
    date, allDay: settings.allDay, startTime: settings.startTime, endTime: settings.endTime,
    endDate: settings.allDay || settings.nextDay ? nextDate(date) : date,
    timezone,
    alarmMinutes: settings.alarm === '' ? undefined : Number(settings.alarm),
    recurrence: {
      settings: structuredClone(settings),
      rule: rule.toString().split('\n').find((line) => line.startsWith('RRULE:')),
      summary: `${rule.toText()}${settings.excludedDates.length ? `; ${settings.excludedDates.length} skipped date(s)` : ''}`, preview
    }
  };
}

function recurrenceIcsLines(event) {
  const settings = event.recurrence.settings;
  let rule = event.recurrence.rule;
  if (settings.ending === 'until') {
    const until = event.allDay ? toIcsDate(settings.until)
      : toIcsIanaUtcDateTime(settings.until, '23:59', event.timezone).replace(/00Z$/, '59Z');
    rule = rule.replace(/UNTIL=[^;]+/, `UNTIL=${until}`);
  }
  const lines = [rule];
  if (settings.excludedDates.length) {
    const dates = settings.excludedDates.map((date) => event.allDay
      ? toIcsDate(date) : `${toIcsDate(date)}T${event.startTime.replace(':', '')}00`);
    const prefix = event.allDay ? 'EXDATE;VALUE=DATE' : `EXDATE;TZID=${event.timezone}`;
    for (const date of dates) lines.push(`${prefix}:${date}`);
  }
  return lines.map((line) => {
    const folded = [line.slice(0, 75)];
    for (let offset = 75; offset < line.length; offset += 74) {
      folded.push(` ${line.slice(offset, offset + 74)}`);
    }
    return folded.join('\r\n');
  });
}

function refreshRecurrencePreview() {
  const frequency = recurrenceFields.frequency.value;
  const monthPattern = ['MONTHLY', 'QUARTERLY', 'YEARLY'].includes(frequency);
  document.getElementById('recurrenceTimes').hidden = recurrenceFields.allDay.checked;
  for (const name of ['startTime', 'endTime', 'timezone']) {
    recurrenceFields[name].required = !recurrenceFields.allDay.checked;
    recurrenceFields[name].disabled = recurrenceFields.allDay.checked;
  }
  document.getElementById('recurrenceWeekStart').hidden = frequency !== 'WEEKLY';
  document.getElementById('recurrenceWeekdays').hidden = frequency !== 'WEEKLY';
  document.getElementById('recurrenceMonths').hidden = frequency !== 'YEARLY';
  document.getElementById('recurrencePattern').hidden = !monthPattern;
  document.getElementById('recurrenceMonthDays').hidden = recurrenceFields.pattern.value !== 'dates';
  document.getElementById('recurrenceOrdinal').hidden = recurrenceFields.pattern.value !== 'weekday';
  document.getElementById('recurrenceUntil').hidden = recurrenceFields.ending.value !== 'until';
  document.getElementById('recurrenceCount').hidden = recurrenceFields.ending.value !== 'count';
  recurrenceFields.until.required = recurrenceFields.ending.value === 'until';
  recurrenceFields.until.disabled = recurrenceFields.ending.value !== 'until';
  recurrenceFields.until.min = recurrenceFields.date.value;
  recurrenceFields.count.required = recurrenceFields.ending.value === 'count';
  recurrenceFields.count.disabled = recurrenceFields.ending.value !== 'count';
  document.getElementById('recurrenceUnit').textContent = t({ DAILY: 'day(s)', WEEKLY: 'week(s)', MONTHLY: 'month(s)', QUARTERLY: 'quarter(s)', YEARLY: 'year(s)' }[frequency]);
  recurrencePreview.replaceChildren();
  try {
    const event = buildRecurringEvent(recurrenceSettings());
    recurrenceSummary.textContent = event.recurrence.summary;
    for (const date of event.recurrence.preview) {
      const item = document.createElement('li');
      item.textContent = new Intl.DateTimeFormat(window.calendarI18n.language, { dateStyle: 'full', timeZone: 'UTC' }).format(recurrenceDate(date));
      recurrencePreview.append(item);
    }
  } catch (error) {
    recurrenceSummary.textContent = t(error.message);
  }
}

function renderRecurrenceExclusions() {
  document.getElementById('recurrenceSkipped').replaceChildren(...recurrenceExcludedDates.map((date) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'secondary-button';
    button.textContent = t('{date} / Remove', { date });
    button.setAttribute('aria-label', t('Remove skipped date {date}', { date }));
    button.addEventListener('click', () => {
      recurrenceExcludedDates = recurrenceExcludedDates.filter((candidate) => candidate !== date);
      renderRecurrenceExclusions();
      refreshRecurrencePreview();
    });
    return button;
  }));
}

for (const [containerId, name, choices] of [
  ['recurrenceMonths', 'month', Array.from({ length: 12 }, (_, index) => [index + 1, new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, index, 1)))])],
  ['recurrenceMonthDays', 'monthDay', [...Array.from({ length: 31 }, (_, index) => [index + 1, String(index + 1)]), [-1, 'Last']]]
]) {
  for (const [value, text] of choices) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = name;
    input.value = String(value);
    label.append(input, text);
    document.getElementById(containerId).append(label);
  }
}

function setRecurrenceDateDefaults() {
  if (!recurrenceFields.date.value) return;
  const date = recurrenceDate(recurrenceFields.date.value);
  for (const [name, value] of [['weekday', recurrenceWeekdayCodes[date.getUTCDay()]], ['monthDay', String(date.getUTCDate())], ['month', String(date.getUTCMonth() + 1)]]) {
    recurrenceForm.querySelectorAll(`input[name="${name}"]`).forEach((input) => { input.checked = input.value === value; });
  }
  recurrenceFields.positionDay.value = recurrenceWeekdayCodes[date.getUTCDay()];
}

function cancelRecurrenceEdit() {
  recurrenceEditingEvent = null;
  document.getElementById('recurrenceSave').textContent = t('Review recurring event');
  document.getElementById('recurrenceCancel').hidden = true;
}

function fillRecurrenceSettings(settings) {
  for (const [name, value] of Object.entries(settings)) {
    const field = recurrenceFields.namedItem(name);
    if (!field || Array.isArray(value)) continue;
    if (field.type === 'checkbox') field.checked = value;
    else field.value = value;
  }
  for (const [name, values] of [['weekday', settings.weekdays], ['month', settings.months], ['monthDay', settings.monthDays]]) {
    recurrenceForm.querySelectorAll(`input[name="${name}"]`).forEach((input) => { input.checked = values.includes(input.value); });
  }
  recurrenceExcludedDates = [...settings.excludedDates];
  renderRecurrenceExclusions();
  refreshRecurrencePreview();
}

function parseRecurrenceText(text, today) {
  const normalized = text.trim().replace(/\s+/g, ' ').replace(/\.$/, '');
  const parts = normalized.match(/^(.+?)\s+(every\s+.+)$/i)
    || normalized.match(/^(.+?)\s+(daily|weekly|monthly|quarterly|yearly)(.*)$/i);
  if (!parts) throw new Error('Include an event name and a repeating schedule.');
  const frequencyWords = { daily: 'day', weekly: 'week', monthly: 'month', quarterly: 'quarter', yearly: 'year' };
  let schedule = parts[2].toLowerCase().startsWith('every ')
    ? parts[2].toLowerCase() : `every ${frequencyWords[parts[2].toLowerCase()]}${parts[3].toLowerCase()}`;
  const firstDate = recurrenceDate(today);
  const settings = {
    title: parts[1].replace(/\bbrithday\b/gi, 'birthday'),
    date: today, location: '', description: '', allDay: true, nextDay: false,
    startTime: '09:00', endTime: '10:00', timezone: recurrenceFields.timezone.value,
    frequency: 'DAILY', interval: '1', weekStart: 'MO', pattern: 'dates',
    weekdays: [recurrenceWeekdayCodes[firstDate.getUTCDay()]],
    months: [String(firstDate.getUTCMonth() + 1)], monthDays: [String(firstDate.getUTCDate())],
    position: '1', positionDay: recurrenceWeekdayCodes[firstDate.getUTCDay()],
    ending: 'never', until: '', count: '10', alarm: '', excludedDates: []
  };
  const count = schedule.match(/\s+for\s+(\d+)\s+(?:times|occurrences)$/);
  const until = schedule.match(/\s+until\s+(.+)$/);
  if (count) {
    settings.count = String(recurrenceInteger(count[1], 9999, 'Occurrence count'));
    settings.ending = 'count';
    schedule = schedule.slice(0, count.index);
  } else if (until) {
    if (!/^(?:\d{4}-\d{2}-\d{2}|[a-z]+\s+\d{1,2}(?:st|nd|rd|th)?[,]?\s+\d{4}|\d{1,2}\s+[a-z]+\s+\d{4})$/.test(until[1])) {
      throw new Error('The end date needs a day, month, and year.');
    }
    const parsed = extractDate(until[1]);
    if (!parsed.date || parsed.remainingText.replace(/[,\s]/g, '')) throw new Error('The end date is not recognized.');
    settings.ending = 'until';
    settings.until = parsed.date;
    schedule = schedule.slice(0, until.index);
  }
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const canonicalWeekday = (value) => weekdays.find((day) => day.toLowerCase() === value || day.slice(0, 3).toLowerCase() === value);
  const parseWeekdays = (value) => {
    const names = value.split(/\s*(?:,\s*(?:and\s+)?|\band\b|&)\s*/).map(canonicalWeekday);
    if (names.some((name) => !name)) throw new Error('The weekday list is not recognized.');
    return [...new Set(names)];
  };
  let canonical;
  let yearlyInterval = 1;
  const frequency = schedule.match(/^every\s+(?:(\d+)\s+)?(days?|weeks?|months?|quarters?|years?|weekdays?)(?:\s+on\s+(.+))?$/);
  if (!frequency) {
    const dayList = schedule.match(/^every\s+(.+)$/);
    if (!dayList) throw new Error('This schedule is not recognized.');
    canonical = `every week on ${parseWeekdays(dayList[1]).join(' and ')}`;
  } else {
    const interval = recurrenceInteger(frequency[1] || '1', 99, 'Repeat interval');
    const unit = frequency[2].replace(/s$/, '');
    if (unit === 'year') yearlyInterval = interval;
    const pattern = frequency[3];
    const quarter = unit === 'quarter';
    canonical = `every ${interval * (quarter ? 3 : 1)} ${quarter ? 'months' : `${unit}s`}`;
    if (unit === 'weekday') {
      if (pattern || interval !== 1) throw new Error('Weekday schedules repeat Monday through Friday every week.');
      canonical = 'every week on Monday and Tuesday and Wednesday and Thursday and Friday';
    } else if (pattern) {
      if (unit === 'week') {
        canonical += ` on ${parseWeekdays(pattern).join(' and ')}`;
      } else if (['month', 'quarter', 'year'].includes(unit)) {
        const ordinal = pattern.match(/^(?:the\s+)?(first|second|third|fourth|fifth|last)\s+([a-z]+)$/);
        const monthFirst = pattern.match(/^([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?$/);
        const dayFirst = pattern.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)$/);
        const monthDate = monthFirst || (dayFirst ? [dayFirst[0], dayFirst[2], dayFirst[1]] : null);
        if (ordinal && canonicalWeekday(ordinal[2])) {
          if (unit === 'year') throw new Error('For yearly weekday patterns, choose the months in Schedule details.');
          canonical += ` on the ${ordinal[1]} ${canonicalWeekday(ordinal[2])}`;
        } else if (/^(?:the\s+)?last\s+day$/.test(pattern)) {
          if (unit === 'year') throw new Error('For a yearly last-day pattern, choose the month in Schedule details.');
          canonical += ' on the last';
        } else if (unit === 'year' && monthDate) {
          const month = months.findIndex((name) => name.toLowerCase() === monthDate[1] || name.slice(0, 3).toLowerCase() === monthDate[1]);
          const day = Number(monthDate[2]);
          if (month < 0 || !validIsoDate(2000, month + 1, day)) throw new Error('Choose a valid month and day.');
          canonical = `every ${months[month]} on the ${day}th`;
        } else if (/^(?:the\s+)?\d{1,2}(?:st|nd|rd|th)?$/.test(pattern) && unit !== 'year') {
          const day = Number(pattern.match(/\d+/)[0]);
          recurrenceInteger(day, 31, 'Day');
          canonical += ` on the ${day}th`;
        } else {
          throw new Error('The date pattern is not recognized. No changes made.');
        }
      } else {
        throw new Error('This schedule is not recognized. No changes made.');
      }
    }
    if (quarter) settings.frequency = 'QUARTERLY';
  }
  const parsed = rrule.RRule.parseText(canonical);
  const frequencyNames = { [rrule.RRule.DAILY]: 'DAILY', [rrule.RRule.WEEKLY]: 'WEEKLY', [rrule.RRule.MONTHLY]: 'MONTHLY', [rrule.RRule.YEARLY]: 'YEARLY' };
  settings.frequency = settings.frequency === 'QUARTERLY' ? 'QUARTERLY' : frequencyNames[parsed.freq];
  settings.interval = settings.frequency === 'YEARLY' ? String(yearlyInterval)
    : String((parsed.interval || 1) / (settings.frequency === 'QUARTERLY' ? 3 : 1));
  if (parsed.bymonth) settings.months = [].concat(parsed.bymonth).map(String);
  if (parsed.bymonthday) settings.monthDays = [].concat(parsed.bymonthday).map(String);
  if (parsed.byweekday) {
    const days = [].concat(parsed.byweekday);
    if (days[0].n) {
      settings.pattern = 'weekday';
      settings.position = String(days[0].n);
      settings.positionDay = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'][days[0].weekday];
    } else {
      settings.weekdays = days.map((day) => ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'][day.weekday]);
    }
  }
  const event = buildRecurringEvent(settings);
  settings.date = event.date;
  return settings;
}

document.getElementById('recurrenceTextForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const status = document.getElementById('recurrenceTextStatus');
  try {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const settings = parseRecurrenceText(document.getElementById('recurrenceText').value, today);
    fillRecurrenceSettings(settings);
    status.textContent = `Schedule ready: ${recurrenceSummary.textContent}.`;
    recurrenceStatus.textContent = '';
  } catch (error) {
    status.textContent = error.message;
  }
});

recurrenceFields.date.addEventListener('change', setRecurrenceDateDefaults);
recurrenceForm.addEventListener('input', refreshRecurrencePreview);
recurrenceForm.addEventListener('change', refreshRecurrencePreview);
document.getElementById('creationDetailsButton').addEventListener('click', () => {
  if (document.getElementById('reviewExportStep').hidden) return;
  if (activeCreation !== 'recurring' || !recurrenceEditingEvent || !state.events.includes(recurrenceEditingEvent)) return;
  for (const name of ['title', 'location', 'description']) {
    recurrenceFields[name].value = recurrenceEditingEvent[name] || '';
  }
}, { capture: true });
document.getElementById('recurrenceCancel').addEventListener('click', () => {
  cancelRecurrenceEdit();
  recurrenceStatus.textContent = t('Edit canceled.');
});
document.getElementById('recurrenceAddSkip').addEventListener('click', () => {
  const input = document.getElementById('recurrenceSkipDate');
  if (!input.value || !input.reportValidity()) return;
  recurrenceExcludedDates = [...new Set([...recurrenceExcludedDates, input.value])].sort();
  input.value = '';
  renderRecurrenceExclusions();
  refreshRecurrencePreview();
});
recurrenceForm.addEventListener('submit', (submitEvent) => {
  submitEvent.preventDefault();
  try {
    const event = buildRecurringEvent(recurrenceSettings());
    if (!event.title) throw new Error('Enter an event title.');
    if (recurrenceEditingEvent) {
      const index = state.events.indexOf(recurrenceEditingEvent);
      if (index < 0) throw new Error('This series was removed. Cancel editing to add a new series.');
      state.events[index] = event;
    } else {
      state.events.push(event);
    }
    recurrenceStatus.textContent = t(recurrenceEditingEvent ? 'Recurring event updated.' : 'Recurring event added.');
    recurrenceEditingEvent = event;
    document.getElementById('recurrenceSave').textContent = t('Save & review');
    document.getElementById('recurrenceCancel').hidden = false;
    toggleEventsButton.setAttribute('aria-expanded', 'true');
    renderEvents();
    showWorkspaceView('review');
    setStatus(recurrenceStatus.textContent);
  } catch (error) {
    recurrenceStatus.textContent = t(error.message);
  }
});
eventsContainer.addEventListener('click', (clickEvent) => {
  const button = clickEvent.target.closest('[data-edit-recurrence]');
  if (!button) return;
  recurrenceEditingEvent = state.events[Number(button.dataset.editRecurrence)];
  const settings = { ...recurrenceEditingEvent.recurrence.settings, title: recurrenceEditingEvent.title, location: recurrenceEditingEvent.location, description: recurrenceEditingEvent.description };
  fillRecurrenceSettings(settings);
  document.getElementById('recurrenceSave').textContent = t('Save & review');
  document.getElementById('recurrenceCancel').hidden = false;
  recurrenceStatus.textContent = '';
  showWorkspaceView('recurring');
  recurrenceFields.title.focus();
});

const recurrenceToday = new Date();
recurrenceFields.date.value = `${recurrenceToday.getFullYear()}-${String(recurrenceToday.getMonth() + 1).padStart(2, '0')}-${String(recurrenceToday.getDate()).padStart(2, '0')}`;
recurrenceFields.timezone.value = Intl.DateTimeFormat().resolvedOptions().timeZone || defaultTimezone;
setRecurrenceDateDefaults();
refreshRecurrencePreview();
document.addEventListener('languagechange', () => {
  refreshRecurrencePreview();
  renderRecurrenceExclusions();
});