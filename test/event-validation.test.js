const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validDate, validTimezone, validate } = require('../public/event-validation.js');

const event = {
  title: 'Flight', date: '2026-12-07', startTime: '11:05', endTime: '12:10',
  timezone: 'Europe/Paris', endTimezone: 'Europe/Paris'
};
const fields = (value, options) => validate(value, options).map(({ field }) => field);

test('reports every incomplete field instead of omitting the event', () => {
  assert.deepEqual(new Set(fields({})), new Set([
    'title', 'date', 'timezone', 'endTimezone', 'startTime', 'endTime'
  ]));
  assert.deepEqual(fields(event), []);
  assert.deepEqual(fields({ ...event, title: '   ' }), ['title']);
});

test('validates real dates and all-day exclusive end dates', () => {
  assert.equal(validDate('2028-02-29'), true);
  for (const date of ['', '0000-01-01', '2026-02-29', '2026-13-01', '2026-04-31']) assert.equal(validDate(date), false);
  assert.deepEqual(fields({ ...event, date: '2026-02-30' }), ['date']);
  assert.deepEqual(fields({ title: 'Stay', date: event.date, allDay: true }), []);
  assert.deepEqual(fields({ title: 'Stay', date: event.date, endDate: event.date, allDay: true }), ['endDate']);
  assert.deepEqual(fields({ title: 'Stay', date: event.date, endDate: '2026-12-06', allDay: true }), ['endDate']);
  assert.deepEqual(fields({ title: 'Stay', date: event.date, endDate: '2026-12-08', allDay: true }), []);
});

test('validates timezone identifiers and offset limits independently at both endpoints', () => {
  for (const zone of ['Europe/Madrid', 'UTC', 'UTC+14:00', 'UTC-05:30']) assert.equal(validTimezone(zone), true, zone);
  for (const zone of ['', 'Bilbao', 'Europe/Unknown', 'UTC+14:01', 'UTC+99:00', 'UTC+01:60']) {
    assert.equal(validTimezone(zone), false, zone);
  }
  assert.deepEqual(fields({ ...event, timezone: '', endTimezone: 'UTC+99:00' }), ['timezone', 'endTimezone']);
  assert.deepEqual(fields({ ...event, allDay: true, timezone: '', endTimezone: '' }), []);
  assert.deepEqual(fields({ ...event, allDay: true, endTimezone: 'invalid' }), ['endTimezone']);
});

test('timed recurring events require IANA zones rather than fixed offsets', () => {
  assert.equal(validTimezone('UTC+01:00', true), false);
  assert.deepEqual(fields({ ...event, timezone: 'UTC+01:00' }, { requireIana: true }), ['timezone']);
  assert.deepEqual(fields({ ...event, allDay: true, timezone: 'UTC+01:00' }, { requireIana: true }), []);
});

test('attributes malformed and nonexistent local times to the correct endpoint', () => {
  assert.deepEqual(fields({ ...event, startTime: '', endTime: '24:00' }), ['startTime', 'endTime']);
  assert.deepEqual(fields({ ...event, date: '2026-03-29', startTime: '02:30' }), ['startTime']);
  assert.deepEqual(fields({ ...event, date: '2026-03-29', endTime: '02:30' }), ['endTime']);
  assert.deepEqual(fields({ ...event, startTime: '11:05:30' }), ['startTime']);
});

test('highlights invalid explicit chronology but preserves inferred overnight dates', () => {
  assert.deepEqual(fields({ ...event, endDate: event.date, endTime: '09:00' }), ['endDate']);
  assert.deepEqual(fields({ ...event, endDate: '', endTime: '09:00' }), []);
  assert.deepEqual(fields({ ...event, endDate: '2026-02-30' }), ['endDate']);
});

test('can validate recurrence draft syntax without testing an unmatched DST date', () => {
  const draft = { ...event, date: '2026-03-29', startTime: '02:30' };
  assert.deepEqual(fields(draft, { checkTiming: false }), []);
  assert.deepEqual(fields(draft), ['startTime']);
  assert.deepEqual(fields({ ...event, title: '' }, { requireTitle: false }), []);
});
