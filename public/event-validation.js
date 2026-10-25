const calendarEventValidation = (() => {
  const times = typeof module !== 'undefined' && module.exports ? require('./event-times.js') : calendarEventTimes;

  function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
    if (Number(value.slice(0, 4)) < 1) return false;
    const date = new Date(`${value}T12:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }

  function validTimezone(value, requireIana = false) {
    if (typeof value !== 'string' || !value.trim()) return false;
    const offset = value.match(/^UTC([+-])(\d{2}):(\d{2})$/);
    if (offset) {
      const hours = Number(offset[2]);
      const minutes = Number(offset[3]);
      return !requireIana && hours <= 14 && minutes < 60 && (hours < 14 || minutes === 0);
    }
    if (!value.includes('/') && value !== 'UTC') return false;
    try {
      new Intl.DateTimeFormat('en', { timeZone: value }).format();
      return true;
    } catch (error) {
      if (error instanceof RangeError) return false;
      throw error;
    }
  }

  function validate(event, { requireTitle = true, requireIana = false, checkTiming = true } = {}) {
    const issues = [];
    const add = (field, message) => issues.push({ field, message });
    if (requireTitle && !String(event.title || '').trim()) add('title', 'Enter an event title.');
    if (!validDate(event.date)) add('date', 'Choose a valid start date.');
    if (event.endDate && !validDate(event.endDate)) add('endDate', 'Choose a valid end date.');
    for (const field of ['timezone', 'endTimezone']) {
      const value = event[field];
      if (!value && !event.allDay) {
        add(field, 'Timezone not detected. Enter a city or choose a timezone manually.');
      } else if (value && !validTimezone(value, requireIana && !event.allDay)) {
        add(field, requireIana && !event.allDay
          ? 'Choose a city/IANA timezone, for example Europe/Paris.'
          : 'Choose a valid timezone, for example Europe/Paris or UTC+01:00.');
      }
    }
    if (event.allDay) {
      if (validDate(event.date) && validDate(event.endDate) && event.endDate <= event.date) {
        add('endDate', 'The all-day end date must be after the start date (exclusive end).');
      }
      return issues;
    }
    for (const field of ['startTime', 'endTime']) {
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(event[field] || '')) {
        add(field, 'Choose a valid time in HH:MM format.');
      }
    }
    if (!checkTiming || issues.some(({ field }) => field !== 'title')) return issues;
    for (const [field, date, zone] of [
      ['startTime', event.date, event.timezone],
      ['endTime', event.endDate || event.date, event.endTimezone]
    ]) {
      try {
        times.toUtc(date, event[field], zone);
      } catch (error) {
        add(field, error.message);
      }
    }
    if (issues.some(({ field }) => field !== 'title')) return issues;
    try {
      times.range(event);
    } catch (error) {
      if (error.message === 'Arrival must be after departure. Check the end date and timezones.') {
        add('endDate', error.message);
      } else {
        add('endTime', error.message);
      }
    }
    return issues;
  }

  return { validDate, validTimezone, validate };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = calendarEventValidation;
