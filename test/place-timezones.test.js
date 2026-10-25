const { test } = require('node:test');
const assert = require('node:assert/strict');
const { detect, endpoints, update } = require('../public/place-timezones.js');

const canonical = (zone) => new Intl.DateTimeFormat('en', { timeZone: zone }).resolvedOptions().timeZone;

test('detects individual cities, addresses, aliases and country hints', () => {
  for (const [location, zone] of [
    ['Hotel in Paris, France', 'Europe/Paris'],
    ['Conference, Seattle', 'America/Los_Angeles'],
    ['123 Main Street, Vancouver, Canada', 'America/Vancouver'],
    ['Montréal, Québec', 'America/Toronto'],
    ['Kyoto Station, Japan', 'Asia/Tokyo'],
    ['Edinburgh hotel', 'Europe/London'],
    ['Ho Chi Minh City', 'Asia/Ho_Chi_Minh'],
    ['HCMC', 'Asia/Ho_Chi_Minh'],
    ['Bruges', 'Europe/Brussels'],
    ['Amalfi', 'Europe/Rome'],
    ['Sydney', 'Australia/Sydney'],
    ['France', 'Europe/Paris'],
    ['Europe/Paris', 'Europe/Paris'],
    ['New York', 'America/New_York']
  ]) assert.equal(detect(location), canonical(zone), location);
});

test('does not invent timezones for missing, unknown or conflicting locations', () => {
  for (const location of ['', undefined, 'Teams', 'Unknown venue', 'Londonderry',
    'Paris to Toronto', 'Toronto to Vancouver', 'France / Japan', 'Tokyo / France']) {
    assert.equal(detect(location), '', String(location));
  }
  assert.equal(detect('Tokyo to Kyoto'), canonical('Asia/Tokyo'));
});

test('updates each event independently and preserves manual overrides', () => {
  const paris = { location: 'Paris', timezone: '', timezoneAutomatic: true };
  const tokyo = { location: 'Tokyo', timezone: '', timezoneAutomatic: true };
  update(paris);
  update(tokyo);
  assert.equal(paris.timezone, canonical('Europe/Paris'));
  assert.equal(tokyo.timezone, canonical('Asia/Tokyo'));
  paris.location = 'Vancouver';
  update(paris);
  assert.equal(paris.timezone, canonical('America/Vancouver'));
  paris.location = 'Teams';
  update(paris);
  assert.equal(paris.timezone, '');
  paris.timezone = 'UTC+07:00';
  paris.timezoneAutomatic = false;
  paris.location = 'Paris';
  update(paris);
  assert.equal(paris.timezone, 'UTC+07:00');
  paris.timezoneAutomatic = true;
  update(paris);
  assert.equal(paris.timezone, canonical('Europe/Paris'));
});

test('detected IANA zones retain date-specific daylight saving rules', () => {
  const zone = detect('Seattle');
  const formatter = new Intl.DateTimeFormat('en', {
    timeZone: zone, hour: '2-digit', hourCycle: 'h23'
  });
  assert.equal(formatter.format(new Date('2026-01-15T12:00:00Z')), '04');
  assert.equal(formatter.format(new Date('2026-07-15T12:00:00Z')), '05');
});

test('detects independent departure and arrival zones from flight information', () => {
  for (const location of [
    'Paris CDG2E to Toronto YYZ3 included in above fare',
    'CDG → YYZ', 'CDG-YYZ', 'from Paris to Toronto',
    'Departure: Paris; Arrival: Toronto'
  ]) {
    assert.deepEqual(endpoints({ location }), {
      start: canonical('Europe/Paris'), end: canonical('America/Toronto')
    }, location);
  }
  assert.deepEqual(endpoints({ location: 'Airport', title: 'Flight AF356: Paris to Toronto (14:05-16:25)' }), {
    start: canonical('Europe/Paris'), end: canonical('America/Toronto')
  });
  assert.deepEqual(endpoints({ location: '', title: 'Flight AF356', description: 'CDG to YYZ' }), {
    start: canonical('Europe/Paris'), end: canonical('America/Toronto')
  });
  assert.deepEqual(endpoints({ location: 'Unknown airport to Toronto' }), {
    start: '', end: canonical('America/Toronto')
  });
  assert.deepEqual(endpoints({ location: 'Paris to Toronto to Vancouver' }), { start: '', end: '' });
  assert.deepEqual(endpoints({ location: 'Paris' }), {
    start: canonical('Europe/Paris'), end: canonical('Europe/Paris')
  });
  assert.deepEqual(endpoints({ location: 'Paris', title: 'Meeting to discuss Tokyo' }), {
    start: canonical('Europe/Paris'), end: canonical('Europe/Paris')
  });
  assert.deepEqual(endpoints({ location: 'Paris', title: 'Flight to Toronto' }), {
    start: canonical('Europe/Paris'), end: canonical('America/Toronto')
  });
  assert.deepEqual(endpoints({
    location: 'Airport', title: 'Flight AF356',
    description: 'AF356 Paris to Toronto, 7 Nov 2026, 14:05 to 16:25'
  }), { start: canonical('Europe/Paris'), end: canonical('America/Toronto') });
  assert.deepEqual(endpoints({
    location: 'Paris', title: 'Flight AF356', description: 'Flight AF356, 14:05 to 16:25'
  }), { start: canonical('Europe/Paris'), end: canonical('Europe/Paris') });
});

test('keeps independent endpoint overrides when a route changes', () => {
  const event = {
    location: 'CDG to YYZ', timezone: '', endTimezone: '',
    timezoneAutomatic: true, endTimezoneAutomatic: true
  };
  update(event);
  assert.equal(event.timezone, canonical('Europe/Paris'));
  assert.equal(event.endTimezone, canonical('America/Toronto'));
  event.endTimezone = 'UTC-05:00';
  event.endTimezoneAutomatic = false;
  event.location = 'YVR to YUL';
  update(event);
  assert.equal(event.timezone, canonical('America/Vancouver'));
  assert.equal(event.endTimezone, 'UTC-05:00');
  event.endTimezoneAutomatic = true;
  update(event);
  assert.equal(event.endTimezone, canonical('America/Toronto'));
  event.timezone = 'UTC+01:00';
  event.timezoneAutomatic = false;
  event.location = 'SEA to NRT';
  update(event);
  assert.equal(event.timezone, 'UTC+01:00');
  assert.equal(event.endTimezone, canonical('Asia/Tokyo'));
});

test('legacy manual single-zone events keep the same zone at both endpoints', () => {
  const event = { timezone: 'UTC+07:00', timezoneAutomatic: false, location: 'CDG to YYZ' };
  update(event);
  assert.equal(event.timezone, 'UTC+07:00');
  assert.equal(event.endTimezone, 'UTC+07:00');
});
