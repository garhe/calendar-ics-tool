const { test } = require('node:test');
const assert = require('node:assert/strict');
const { cleanLocation, cleanEventLocation, update } = require('../public/place-timezones.js');

test('keeps only route cities instead of airport terminals and fare notes', () => {
  for (const [original, expected] of [
    ['Paris CDG-2G to Rennes RNS included in above fare', 'Paris to Rennes'],
    ['Paris CDG2E to Toronto YYZ3 included in above fare', 'Paris to Toronto'],
    ['Paris CDG2E to Toronto YYZ3, Included in the above fare', 'Paris to Toronto'],
    ['CDG → YYZ', 'Paris to Toronto'],
    ['CDG-YYZ', 'Paris to Toronto'],
    ['YUL to YVR', 'Montreal to Vancouver'],
    ['Toronto 701€ total', 'Toronto'],
    ['Vancouver CAD 663', 'Vancouver'],
    ['Montreal 525€ total included in above fare', 'Montreal']
  ]) assert.equal(cleanLocation(original), expected, original);
});

test('retains street addresses, unknown places and meaningful punctuation', () => {
  for (const address of [
    '123 Main Street, Toronto, ON M5V 2T6',
    '12-14 Rue de Paris, Rennes',
    'Apartment 2G, 50 King Street, Toronto',
    '12 Ham Lane, London',
    '100 JFK Boulevard, New York',
    'Apartment 2G, 100 SEA Road, Toronto',
    'Unknown Venue'
  ]) assert.equal(cleanLocation(address), address);
  assert.equal(cleanLocation('123 Main Street, Toronto included in above fare'), '123 Main Street, Toronto');
  assert.equal(cleanLocation(''), '');
});

test('preserves original location details in the description without duplicates', () => {
  const original = 'Paris CDG-2G to Rennes RNS included in above fare';
  const event = { location: original, description: 'Flight AF7530' };
  cleanEventLocation(event);
  assert.equal(event.location, 'Paris to Rennes');
  assert.equal(event.description, `Flight AF7530\n${original}`);
  cleanEventLocation(event);
  assert.equal(event.description, `Flight AF7530\n${original}`);
  const parsed = { location: original, description: `Original text: ${original}` };
  cleanEventLocation(parsed);
  assert.equal(parsed.description, `Original text: ${original}`);
});

test('all-day stays and cleaned airport routes retain automatic endpoint timezones', () => {
  for (const [city, zone] of [
    ['Toronto', 'America/Toronto'], ['Vancouver', 'America/Vancouver'], ['Montreal', 'America/Toronto']
  ]) {
    const event = update(cleanEventLocation({
      allDay: true, location: city, date: '2026-11-07', endDate: '2026-11-11',
      timezoneAutomatic: true
    }));
    assert.equal(event.timezone, zone);
    assert.equal(event.endTimezone, zone);
    assert.equal(event.date, '2026-11-07');
    assert.equal(event.endDate, '2026-11-11');
  }
  const event = update(cleanEventLocation({
    location: 'CDG → YYZ', timezoneAutomatic: true
  }));
  assert.equal(event.timezone, 'Europe/Paris');
  assert.equal(event.endTimezone, 'America/Toronto');
});
