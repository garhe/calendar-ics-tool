const calendarEventTimes = (() => {
  function wallTime(date, time) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time || '')) {
      throw new Error('Choose valid start and end dates and times.');
    }
    const timestamp = Date.parse(`${date}T${time}:00Z`);
    if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== date) {
      throw new Error('Choose valid start and end dates and times.');
    }
    return timestamp;
  }

  function toUtc(date, time, timezone) {
    const intendedWallTime = wallTime(date, time);
    if (!timezone) throw new Error('Start and end timezones are required.');
    const offset = timezone.match(/^UTC([+-])(\d{2}):(\d{2})$/);
    if (offset) {
      const hours = Number(offset[2]);
      const minutes = Number(offset[3]);
      if (hours > 14 || minutes > 59 || (hours === 14 && minutes)) throw new Error('Choose a valid timezone.');
      return new Date(intendedWallTime - (offset[1] === '+' ? 1 : -1) * (hours * 60 + minutes) * 60000)
        .toISOString().replace(/[-:]/g, '').replace('.000Z', 'Z');
    }
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    const representedTime = (timestamp) => {
      const parts = Object.fromEntries(formatter.formatToParts(new Date(timestamp))
        .filter(({ type }) => type !== 'literal').map(({ type, value }) => [type, Number(value)]));
      return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
    };
    let utcTime = intendedWallTime;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      utcTime += intendedWallTime - representedTime(utcTime);
    }
    if (representedTime(utcTime) !== intendedWallTime) {
      throw new Error('This local time does not exist in the selected timezone.');
    }
    return new Date(utcTime).toISOString().replace(/[-:]/g, '').replace('.000Z', 'Z');
  }

  function range(event) {
    const start = toUtc(event.date, event.startTime, event.timezone);
    const endTimezone = event.endTimezone === undefined ? event.timezone : event.endTimezone;
    let endDate = event.endDate || event.date;
    let end = toUtc(endDate, event.endTime, endTimezone);
    if (!event.endDate) {
      // Infer the earliest arrival date after departure, including date-line crossings.
      while (end <= start) {
        endDate = new Date(wallTime(endDate, '00:00') + 86400000).toISOString().slice(0, 10);
        end = toUtc(endDate, event.endTime, endTimezone);
      }
    }
    if (end <= start) throw new Error('Arrival must be after departure. Check the end date and timezones.');
    return { start, end, endDate };
  }

  return { toUtc, range };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = calendarEventTimes;
