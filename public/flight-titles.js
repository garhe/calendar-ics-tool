const calendarFlightTitles = (() => {
  const places = typeof module !== 'undefined' && module.exports
    ? require('./place-timezones.js') : calendarPlaceTimezones;
  const nonFlightCodes = new Set([
    'IC', 'ICE', 'TGV', 'TER', 'RE', 'RJ', 'EC', 'EN', 'NJ',
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
    'UTC', 'GMT'
  ]);
  const flightWords = /\b(?:flight|flying|airline|vol)\b/i;
  const otherTransport = /\b(?:train|bus|ferry|hotel|nights?)\b/i;

  function update(event) {
    let title = String(event.title || '');
    if (event.flightTitleSuffix && title.endsWith(event.flightTitleSuffix)) {
      title = title.slice(0, -event.flightTitleSuffix.length);
    }
    const details = `${title} ${event.location || ''} ${event.description || ''}`;
    const numbers = [...details.matchAll(/\b([a-z]{3}|[a-z][a-z0-9]|[0-9][a-z])\s*(\d{1,4}[a-z]?)\b/gi)]
      .filter((match) => !nonFlightCodes.has(match[1].toUpperCase())
        && !places.airportCodes.includes(match[1].toUpperCase()));
    const flight = flightWords.test(details) || (numbers.length > 0 && !otherTransport.test(details));
    event.flightTitleSuffix = '';
    if (!flight) {
      event.title = title;
      return event;
    }

    title = title.replace(/\s+\(\d{2}:\d{2}(?:-\d{2}:\d{2})?\)$/, '');
    const number = numbers[0];
    let suffix = '';
    if (number) {
      const flightNumber = `${number[1]}${number[2]}`.toUpperCase();
      const inTitle = new RegExp(`\\b${number[1]}\\s*${number[2]}\\b`, 'i');
      if (inTitle.test(title)) title = title.replace(inTitle, flightNumber);
      else suffix += ` - ${flightNumber}`;
    }
    if (!event.allDay && event.startTime) {
      suffix += ` (${event.startTime}${event.endTime ? `-${event.endTime}` : ''})`;
    }
    event.flightTitleSuffix = suffix;
    event.title = title + suffix;
    return event;
  }

  return { update };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = calendarFlightTitles;
