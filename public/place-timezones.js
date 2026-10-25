const calendarPlaceTimezones = (() => {
  const aliases = [
    { label: 'HCMC / Ho Chi Minh City', timezone: 'Asia/Ho_Chi_Minh', terms: 'hcmc saigon vietnam', places: ['Ho Chi Minh', 'Saigon'] },
    { label: 'Hanoi', timezone: 'Asia/Ho_Chi_Minh', terms: 'ha noi vietnam', places: ['Ha Noi'] },
    { label: 'Edinburgh', timezone: 'Europe/London', terms: 'scotland', places: ['Edinburg'] },
    { label: 'Rennes', timezone: 'Europe/Paris', terms: 'france' },
    { label: 'Lille', timezone: 'Europe/Paris', terms: 'france' },
    { label: 'Metz', timezone: 'Europe/Paris', terms: 'france' },
    { label: 'Redon', timezone: 'Europe/Paris', terms: 'france' },
    { label: 'Bruges', timezone: 'Europe/Brussels', terms: 'belgium', places: ['Brugge'] },
    { label: 'Kortrijk', timezone: 'Europe/Brussels', terms: 'belgium' },
    { label: 'Kyoto', timezone: 'Asia/Tokyo', terms: 'japan' },
    { label: 'Osaka', timezone: 'Asia/Tokyo', terms: 'japan' },
    { label: 'Beijing', timezone: 'Asia/Shanghai', terms: 'china' },
    { label: 'Seattle', timezone: 'America/Los_Angeles', terms: 'washington' },
    { label: 'Boston', timezone: 'America/New_York', terms: 'massachusetts' },
    { label: 'Montreal', timezone: 'America/Toronto', terms: 'quebec' },
    { label: 'Hamburg', timezone: 'Europe/Berlin', terms: 'germany' },
    { label: 'Bilbao', timezone: 'Europe/Madrid', terms: 'bilbo spain bio', places: ['Bilbo'] },
    ...['Naples', 'Palermo', 'Catania', 'Amalfi', 'Positano'].map((label) => ({
      label, timezone: 'Europe/Rome', terms: 'italy'
    }))
  ];
  const countries = [
    ['France', 'Europe/Paris'], ['Belgium', 'Europe/Brussels'],
    ['Luxembourg', 'Europe/Luxembourg'], ['Germany', 'Europe/Berlin'],
    ['Italy', 'Europe/Rome'], ['Japan', 'Asia/Tokyo'],
    ['Vietnam', 'Asia/Ho_Chi_Minh'], ['England', 'Europe/London'],
    ['Scotland', 'Europe/London'], ['UK', 'Europe/London']
  ];
  const airports = [
    ['CDG', 'Europe/Paris', 'Paris'], ['ORY', 'Europe/Paris', 'Paris'], ['RNS', 'Europe/Paris', 'Rennes'],
    ['YYZ', 'America/Toronto', 'Toronto'], ['YUL', 'America/Toronto', 'Montreal'], ['YVR', 'America/Vancouver', 'Vancouver'],
    ['LHR', 'Europe/London', 'London'], ['LGW', 'Europe/London', 'London'], ['EDI', 'Europe/London', 'Edinburgh'],
    ['BER', 'Europe/Berlin', 'Berlin'], ['HAM', 'Europe/Berlin', 'Hamburg'],
    ['BIO', 'Europe/Madrid', 'Bilbao'],
    ['FCO', 'Europe/Rome', 'Rome'], ['NAP', 'Europe/Rome', 'Naples'], ['CTA', 'Europe/Rome', 'Catania'], ['PMO', 'Europe/Rome', 'Palermo'],
    ['JFK', 'America/New_York', 'New York'], ['EWR', 'America/New_York', 'Newark'], ['BOS', 'America/New_York', 'Boston'],
    ['LAX', 'America/Los_Angeles', 'Los Angeles'], ['SFO', 'America/Los_Angeles', 'San Francisco'], ['SEA', 'America/Los_Angeles', 'Seattle'],
    ['HND', 'Asia/Tokyo', 'Tokyo'], ['NRT', 'Asia/Tokyo', 'Tokyo'], ['KIX', 'Asia/Tokyo', 'Osaka'],
    ['SGN', 'Asia/Ho_Chi_Minh', 'Ho Chi Minh City'], ['HAN', 'Asia/Ho_Chi_Minh', 'Hanoi'],
    ['SIN', 'Asia/Singapore', 'Singapore'], ['DXB', 'Asia/Dubai', 'Dubai'],
    ['SYD', 'Australia/Sydney', 'Sydney'], ['AKL', 'Pacific/Auckland', 'Auckland']
  ];
  const normalize = (value) => String(value || '').toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[_/]/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
  const zones = typeof Intl.supportedValuesOf === 'function'
    ? Intl.supportedValuesOf('timeZone') : [];
  const cities = [
    ...zones.filter((zone) => /^(Africa|America|Antarctica|Arctic|Asia|Atlantic|Australia|Europe|Indian|Pacific)\//.test(zone))
      .map((zone) => [zone.split('/').at(-1), zone]),
    ...aliases.flatMap((alias) => [...alias.label.split(' / '), ...(alias.places || [])]
      .map((name) => [name, alias.timezone])),
    ...airports.map(([, zone, city]) => [city, zone]),
    ...['London', 'Paris', 'Tokyo', 'Berlin', 'Rome', 'Toronto', 'Vancouver', 'Brussels', 'Luxembourg']
      .map((name) => [name, {
        London: 'Europe/London', Paris: 'Europe/Paris', Tokyo: 'Asia/Tokyo',
        Berlin: 'Europe/Berlin', Rome: 'Europe/Rome', Toronto: 'America/Toronto',
        Vancouver: 'America/Vancouver', Brussels: 'Europe/Brussels', Luxembourg: 'Europe/Luxembourg'
      }[name]])
  ];
  // Intl may expose legacy zone names; deduplicate equivalent IANA identifiers.
  const canonical = (zone) => new Intl.DateTimeFormat('en', { timeZone: zone }).resolvedOptions().timeZone;
  const candidates = cities.map(([name, zone]) => [normalize(name), canonical(zone)]);

  function cleanLocation(value) {
    const location = String(value || '').trim()
      .replace(/\s*[,;|(-]*\s*\bincluded\s+in\s+(?:the\s+)?(?:above\s+)?(?:fare|price|rate)\b.*$/i, '')
      .replace(/\s+(?:(?:[€£$]|eur\b|usd\b|gbp\b|cad\b)\s*\d+(?:[.,]\d+)?|\d+(?:[.,]\d+)?\s*(?:€|£|\$|eur\b|usd\b|gbp\b|cad\b)).*$/i, '')
      .replace(/(?:-+|=)>|[›»➜➡→]/g, '>')
      .replace(/\b([A-Z]{3}(?:-?\d[A-Za-z0-9]*)?)-(?=[A-Z]{3}\b)/g, '$1 to ');
    return location.split(/\s*>\s*|\s+to\s+/i).map((place) => {
      let cleaned = place.trim();
      const address = /^(?:\d+[a-z]?(?:[-/]\d+[a-z]?)?\s+|(?:apartment|apt|suite|unit)\b)/i.test(cleaned)
        || /\b(?:street|road|avenue|boulevard|rue|chemin|lane|drive|quai)\b/i.test(cleaned);
      for (const [code, , city] of airports) {
        if (address) break;
        const codePattern = new RegExp(`\\b${code}(?:-?\\d[A-Za-z0-9]*)?\\b`, 'g');
        const exactCode = new RegExp(`^${code}(?:-?\\d[a-z0-9]*)?$`, 'i');
        if (exactCode.test(cleaned)) {
          cleaned = city;
          break;
        }
        if (!codePattern.test(cleaned)) continue;
        codePattern.lastIndex = 0;
        const remainder = cleaned.replace(codePattern, '').trim();
        codePattern.lastIndex = 0;
        cleaned = ` ${normalize(remainder)} `.includes(` ${normalize(city)} `)
          ? remainder : cleaned.replace(codePattern, city);
      }
      return cleaned.replace(/\s+([,;])/g, '$1').replace(/[\s,;]+$/g, '').replace(/\s+/g, ' ').trim();
    }).join(' to ').trim();
  }

  function cleanEventLocation(event) {
    const original = String(event.location || '').trim();
    event.location = cleanLocation(original);
    if (original !== event.location && !String(event.description || '').includes(original)) {
      event.description = [event.description, original].filter(Boolean).join('\n');
    }
    return event;
  }

  function detect(location) {
    const text = ` ${normalize(location)} `;
    const matches = candidates.filter(([name]) => text.includes(` ${name} `));
    const matchedCountries = countries.filter(([name]) => text.includes(` ${normalize(name)} `));
    const matchedAirports = airports.filter(([code]) =>
      new RegExp(`\\b${code}(?:\\d[a-z0-9]*)?\\b`, 'i').test(location || ''));
    const matchedZones = new Set([
      ...matches.map(([, zone]) => zone),
      ...matchedCountries.map(([, zone]) => canonical(zone)),
      ...matchedAirports.map(([, zone]) => canonical(zone))
    ]);
    return matchedZones.size === 1 ? [...matchedZones][0] : '';
  }

  function endpoints(event) {
    const flight = /\b(?:flight|flying|airline|vol)\b/i.test(`${event.title || ''} ${event.description || ''}`);
    for (const value of [event.location, event.title, event.description]) {
      const text = String(value || '')
        .replace(/\b\d{1,2}(?:[:h.][0-5]\d)?\s*(?:am|pm)?\s*(?:to|until|[-–—>])\s*\d{1,2}(?:[:h.][0-5]\d)?\s*(?:am|pm)?\b/gi, ' ')
        .replace(/(?:-+|=)>|[›»➜➡→]/g, '>');
      const labeled = text.match(/\b(?:departure|departing|origin)\s*:\s*(.+?)\s*[,;]?\s*\b(?:arrival|arriving|destination)\s*:\s*(.+)/i);
      const places = labeled ? labeled.slice(1) : text.split(/\s*(?:>|\bto\b)\s*|\s+[-–—]\s+|(?<=\b[A-Z]{3})-(?=[A-Z]{3}\b)/i);
      if (places.length > 1) {
        if (places.length > 2) {
          if (value === event.location) return { start: '', end: '' };
          continue;
        }
        const start = detect(places[0]);
        const end = detect(places[1]);
        if (!start && !end && value !== event.location) continue;
        if (value !== event.location && !labeled && (!start || !end) && !flight) continue;
        return {
          start: start || (value !== event.location && flight ? detect(event.location) : ''),
          end
        };
      }
    }
    const timezone = detect(event.location);
    return { start: timezone, end: timezone };
  }

  function update(event) {
    if (event.endTimezoneAutomatic === undefined) event.endTimezoneAutomatic = Boolean(event.timezoneAutomatic);
    if (event.endTimezone === undefined) event.endTimezone = event.timezone || '';
    const detected = endpoints(event);
    if (event.timezoneAutomatic) event.timezone = detected.start;
    if (event.endTimezoneAutomatic) event.endTimezone = detected.end;
    return event;
  }

  return { aliases, airportCodes: airports.map(([code]) => code), cleanLocation, cleanEventLocation, detect, endpoints, update };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = calendarPlaceTimezones;
