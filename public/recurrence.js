const recurrenceForm = document.getElementById('recurrenceForm');
const recurrenceFields = recurrenceForm.elements;
const recurrenceSummary = document.getElementById('recurrenceSummary');
const recurrencePreview = document.getElementById('recurrencePreview');
const recurrenceStatus = document.getElementById('recurrenceStatus');
recurrenceForm.noValidate = true;
let recurrenceValidationRequested = false;
let recurrenceEditingEvent = null;
let recurrenceExcludedDates = [];
const recurrenceWeekdayCodes = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

function recurrenceFieldError(field, message) {
  return Object.assign(new Error(message), { field });
}

function recurrenceDate(value, field = 'date') {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw recurrenceFieldError(field, 'Choose a valid first date.');
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw recurrenceFieldError(field, 'Choose a valid date.');
  }
  return date;
}

function recurrenceChoices(name) {
  return [...recurrenceForm.querySelectorAll(`input[name="${name}"]:checked`)].map((input) => input.value);
}

function recurrenceInteger(value, maximum, label, field) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > maximum) {
    throw recurrenceFieldError(field, `${label} must be between 1 and ${maximum}.`);
  }
  return number;
}

function recurrenceSettings() {
  const settings = Object.fromEntries(new FormData(recurrenceForm));
  settings.allDay = recurrenceFields.allDay.checked;
  settings.nextDay = recurrenceFields.nextDay.checked;
  settings.timezoneAutomatic = recurrenceFields.timezoneAutomatic.checked;
  settings.endTimezoneAutomatic = recurrenceFields.endTimezoneAutomatic.checked;
  settings.weekdays = recurrenceChoices('weekday');
  settings.months = recurrenceChoices('month');
  settings.monthDays = recurrenceChoices('monthDay');
  settings.excludedDates = [...recurrenceExcludedDates];
  return settings;
}

function buildRecurringEvent(settings) {
  settings = calendarPlaceTimezones.cleanEventLocation({ ...settings });
  if (typeof rrule === 'undefined') throw new Error('The recurrence library is unavailable. Reload the page.');
  const firstDate = recurrenceDate(settings.date);
  const interval = recurrenceInteger(settings.interval, 99, 'Repeat interval', 'interval');
  const quarterly = settings.frequency === 'QUARTERLY';
  const frequency = quarterly ? 'MONTHLY' : settings.frequency;
  const options = {
    freq: rrule.RRule[frequency],
    interval: interval * (quarterly ? 3 : 1),
    dtstart: firstDate,
    wkst: rrule.RRule[settings.weekStart || 'MO']
  };
  if (!['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(frequency)) throw recurrenceFieldError('frequency', 'Choose a repeat frequency.');
  if (frequency === 'WEEKLY') {
    if (!settings.weekdays.length) throw recurrenceFieldError('weekday', 'Select at least one weekday.');
    options.byweekday = settings.weekdays.map((day) => rrule.RRule[day]);
  }
  if (frequency === 'YEARLY') {
    if (!settings.months.length) throw recurrenceFieldError('month', 'Select at least one month.');
    options.bymonth = settings.months.map(Number);
  }
  if (frequency === 'MONTHLY' || frequency === 'YEARLY') {
    if (settings.pattern === 'weekday') {
      options.byweekday = [rrule.RRule[settings.positionDay].nth(Number(settings.position))];
    } else {
      if (!settings.monthDays.length) throw recurrenceFieldError('monthDay', 'Select at least one date of the month.');
      options.bymonthday = settings.monthDays.map(Number);
    }
  }
  if (settings.ending === 'count') options.count = recurrenceInteger(settings.count, 9999, 'Occurrence count', 'count');
  if (settings.ending === 'until') {
    const lastDate = recurrenceDate(settings.until, 'until');
    if (lastDate < firstDate) throw recurrenceFieldError('until', 'The last date must not be before the first date.');
    lastDate.setUTCHours(23, 59, 59);
    options.until = lastDate;
  }
  const timezone = settings.timezone ? resolveTimezone(settings.timezone) : '';
  const endTimezone = settings.endTimezone ? resolveTimezone(settings.endTimezone) : '';
  if (settings.allDay && [settings.timezone, settings.endTimezone].some((value) => value && !isValidTimezoneValue(value))) {
    throw new Error('Choose a valid timezone.');
  }
  if (!settings.allDay) {
    if (![settings.timezone, settings.endTimezone].every((value) => value && isIanaTimezone(resolveTimezone(value)))) {
      throw new Error('Choose city/IANA timezones for both start and end.');
    }
    if (![settings.startTime, settings.endTime].every((time) => /^([01]\d|2[0-3]):[0-5]\d$/.test(time))) {
      throw new Error('Choose valid start and end times.');
    }
  }
  let rule = new rrule.RRule(options);
  const first = rule.after(new Date(firstDate.getTime() - 1));
  if (!first) throw recurrenceFieldError(settings.ending === 'until' ? 'until' : 'date', 'No matching dates in this schedule.');
  rule = new rrule.RRule({ ...options, dtstart: first });
  const preview = [];
  rule.all((date) => {
    const dateString = date.toISOString().slice(0, 10);
    if (!settings.excludedDates.includes(dateString)) preview.push(dateString);
    return preview.length < 5;
  });
  if (!preview.length) throw recurrenceFieldError('recurrenceSkipDate', 'No occurrences remain after skipped dates.');
  const date = first.toISOString().slice(0, 10);
  const endDate = settings.allDay || settings.nextDay ? nextDate(date) : date;
  if (!settings.allDay) {
    const issues = calendarEventValidation.validate({
      date, endDate, startTime: settings.startTime, endTime: settings.endTime, timezone, endTimezone
    }, { requireTitle: false, requireIana: true });
    if (issues.length) throw recurrenceFieldError(issues[0].field === 'endDate' ? 'nextDay' : issues[0].field, issues[0].message);
  }
  return {
    title: settings.title.trim(), location: settings.location, description: settings.description,
    date, allDay: settings.allDay, startTime: settings.startTime, endTime: settings.endTime,
    endDate,
    timezone, endTimezone,
    timezoneAutomatic: settings.timezoneAutomatic, endTimezoneAutomatic: settings.endTimezoneAutomatic,
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
  const detected = calendarPlaceTimezones.update({
    title: recurrenceFields.title.value, location: recurrenceFields.location.value, description: recurrenceFields.description.value,
    timezone: recurrenceFields.timezone.value, endTimezone: recurrenceFields.endTimezone.value,
    timezoneAutomatic: recurrenceFields.timezoneAutomatic.checked,
    endTimezoneAutomatic: recurrenceFields.endTimezoneAutomatic.checked
  });
  recurrenceFields.timezone.value = detected.timezone;
  recurrenceFields.endTimezone.value = detected.endTimezone;
  document.getElementById('recurrenceTimezoneStatus').textContent =
    !detected.timezone || !detected.endTimezone
      ? t(recurrenceFields.allDay.checked
        ? 'Timezone not detected. Enter a city or choose a timezone manually.'
        : 'Start and end timezones are required.') : '';
  const frequency = recurrenceFields.frequency.value;
  const monthPattern = ['MONTHLY', 'QUARTERLY', 'YEARLY'].includes(frequency);
  document.getElementById('recurrenceTimes').hidden = recurrenceFields.allDay.checked;
  document.getElementById('recurrenceAllDayTimezoneHint').hidden = !recurrenceFields.allDay.checked;
  for (const name of ['startTime', 'endTime']) {
    recurrenceFields[name].required = !recurrenceFields.allDay.checked;
    recurrenceFields[name].disabled = recurrenceFields.allDay.checked;
  }
  for (const name of ['timezone', 'endTimezone']) {
    recurrenceFields[name].required = !recurrenceFields.allDay.checked;
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
  if (recurrenceValidationRequested) showRecurrenceValidation();
}

function recurrenceControl(field) {
  const groups = { weekday: 'recurrenceWeekdays', month: 'recurrenceMonths', monthDay: 'recurrenceMonthDays', recurrenceSkipDate: 'recurrenceSkipDate' };
  return groups[field] ? document.getElementById(groups[field]) : recurrenceFields[field];
}

function showRecurrenceValidation(locate = false) {
  if (locate) recurrenceValidationRequested = true;
  const settings = recurrenceSettings();
  const issues = calendarValidation.nativeIssues(recurrenceForm);
  const date = calendarEventValidation.validDate(settings.date) ? settings.date : '';
  const endDate = date && (settings.allDay || settings.nextDay) ? nextDate(date) : date;
  for (const issue of eventIssues({ ...settings, endDate, recurrence: {} }, { checkTiming: false })) {
    issues.push({ ...issue, control: recurrenceControl(issue.field === 'endDate' ? 'nextDay' : issue.field) });
  }
  const frequency = settings.frequency;
  for (const [needed, field, message] of [
    [frequency === 'WEEKLY' && !settings.weekdays.length, 'weekday', 'Select at least one weekday.'],
    [frequency === 'YEARLY' && !settings.months.length, 'month', 'Select at least one month.'],
    [['MONTHLY', 'QUARTERLY', 'YEARLY'].includes(frequency) && settings.pattern === 'dates' && !settings.monthDays.length, 'monthDay', 'Select at least one date of the month.']
  ]) {
    if (needed) issues.push({ control: recurrenceControl(field), message });
  }
  if (!issues.length) {
    try {
      buildRecurringEvent(settings);
    } catch (error) {
      issues.push({ control: recurrenceControl(error.field) || recurrenceStatus, message: error.message });
    }
  }
  const shown = calendarValidation.show(recurrenceForm, issues);
  recurrenceStatus.textContent = shown.length ? t('Correct the highlighted fields before continuing.') : '';
  if (locate) calendarValidation.focus(shown[0]?.control || recurrenceFields.title);
  return shown;
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
  recurrenceFields.timezoneAutomatic.checked = Boolean(settings.timezoneAutomatic);
  recurrenceFields.endTimezoneAutomatic.checked = Boolean(settings.endTimezoneAutomatic ?? settings.timezoneAutomatic);
  recurrenceFields.endTimezone.value = settings.endTimezone ?? settings.timezone ?? '';
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
    startTime: '09:00', endTime: '10:00', timezone: '', endTimezone: '',
    timezoneAutomatic: true, endTimezoneAutomatic: true,
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

const recurrenceTextForm = document.getElementById('recurrenceTextForm');
recurrenceTextForm.noValidate = true;
recurrenceTextForm.addEventListener('submit', (event) => {
  event.preventDefault();
  calendarValidation.clear(recurrenceTextForm);
  const status = document.getElementById('recurrenceTextStatus');
  try {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const settings = parseRecurrenceText(document.getElementById('recurrenceText').value, today);
    fillRecurrenceSettings(settings);
    status.textContent = `Schedule ready: ${recurrenceSummary.textContent}.`;
    recurrenceStatus.textContent = '';
  } catch (error) {
    status.textContent = t(error.message);
    const input = document.getElementById('recurrenceText');
    calendarValidation.show(recurrenceTextForm, [{ control: input, message: error.message }]);
    calendarValidation.focus(input);
  }
});

recurrenceFields.date.addEventListener('change', setRecurrenceDateDefaults);
recurrenceFields.location.addEventListener('change', () => {
  const event = calendarPlaceTimezones.cleanEventLocation({
    location: recurrenceFields.location.value, description: recurrenceFields.description.value
  });
  recurrenceFields.location.value = event.location;
  recurrenceFields.description.value = event.description || '';
});
recurrenceFields.timezone.addEventListener('input', () => {
  recurrenceFields.timezoneAutomatic.checked = false;
});
recurrenceFields.endTimezone.addEventListener('input', () => {
  recurrenceFields.endTimezoneAutomatic.checked = false;
});
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
  if (!calendarEventValidation.validDate(input.value)) {
    calendarValidation.show(input.parentElement, [{ control: input, message: 'Choose a valid date.' }]);
    calendarValidation.focus(input);
    return;
  }
  calendarValidation.clear(input.parentElement);
  recurrenceExcludedDates = [...new Set([...recurrenceExcludedDates, input.value])].sort();
  input.value = '';
  renderRecurrenceExclusions();
  refreshRecurrencePreview();
});
recurrenceForm.addEventListener('submit', (submitEvent) => {
  submitEvent.preventDefault();
  recurrenceValidationRequested = true;
  if (showRecurrenceValidation(true).length) return;
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
    const control = recurrenceControl(error.field) || recurrenceStatus;
    calendarValidation.show(recurrenceForm, [{ control, message: error.message }]);
    calendarValidation.focus(control);
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
setRecurrenceDateDefaults();
refreshRecurrencePreview();
document.addEventListener('languagechange', () => {
  refreshRecurrencePreview();
  renderRecurrenceExclusions();
});