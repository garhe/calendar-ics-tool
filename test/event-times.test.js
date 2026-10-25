const { test } = require('node:test');
const assert = require('node:assert/strict');
const { range, toUtc } = require('../public/event-times.js');

const parisToronto = {
  date: '2026-11-07', startTime: '14:05', endTime: '16:25',
  timezone: 'Europe/Paris', endTimezone: 'America/Toronto'
};

test('converts the departure and arrival wall times independently', () => {
  assert.deepEqual(range(parisToronto), {
    start: '20261107T130500Z', end: '20261107T212500Z', endDate: '2026-11-07'
  });
  assert.deepEqual(range({ ...parisToronto, endTime: '12:25' }), {
    start: '20261107T130500Z', end: '20261107T172500Z', endDate: '2026-11-07'
  });
});

test('uses each endpoint daylight-saving rules on the actual event date', () => {
  assert.deepEqual(range({ ...parisToronto, date: '2026-03-20' }), {
    start: '20260320T130500Z', end: '20260320T202500Z', endDate: '2026-03-20'
  });
  assert.deepEqual(range({ ...parisToronto, date: '2026-07-20' }), {
    start: '20260720T120500Z', end: '20260720T202500Z', endDate: '2026-07-20'
  });
});

test('infers overnight and date-line arrival dates using UTC chronology', () => {
  assert.deepEqual(range({
    date: '2026-11-21', startTime: '18:50', endTime: '08:15',
    timezone: 'America/Toronto', endTimezone: 'Europe/Paris'
  }), { start: '20261121T235000Z', end: '20261122T071500Z', endDate: '2026-11-22' });
  assert.deepEqual(range({
    date: '2026-11-11', startTime: '13:00', endTime: '16:00',
    timezone: 'America/Vancouver', endTimezone: 'Asia/Tokyo'
  }), { start: '20261111T210000Z', end: '20261112T070000Z', endDate: '2026-11-12' });
});

test('honors explicit arrival dates including the previous local day', () => {
  assert.deepEqual(range({
    date: '2026-11-11', endDate: '2026-11-10', startTime: '01:00', endTime: '16:00',
    timezone: 'Asia/Tokyo', endTimezone: 'America/Vancouver'
  }), { start: '20261110T160000Z', end: '20261111T000000Z', endDate: '2026-11-10' });
  assert.throws(() => range({ ...parisToronto, endDate: '2026-11-06' }), /Arrival must be after departure/);
});

test('supports same-zone and independent fixed-offset events', () => {
  assert.deepEqual(range({
    date: '2026-11-07', startTime: '09:00', endTime: '10:00', timezone: 'Europe/Paris'
  }), { start: '20261107T080000Z', end: '20261107T090000Z', endDate: '2026-11-07' });
  assert.deepEqual(range({ ...parisToronto, timezone: 'UTC+01:00', endTimezone: 'UTC-05:00' }), {
    start: '20261107T130500Z', end: '20261107T212500Z', endDate: '2026-11-07'
  });
});

test('rejects missing zones, impossible dates and nonexistent local DST times', () => {
  assert.throws(() => range({ ...parisToronto, endTimezone: '' }), /timezones are required/);
  assert.throws(() => range({ ...parisToronto, date: '2026-02-30' }), /valid start and end dates/);
  assert.throws(() => range({ ...parisToronto, endTime: '25:00' }), /valid start and end dates/);
  assert.throws(() => toUtc('2026-03-29', '02:30', 'Europe/Paris'), /does not exist/);
  assert.throws(() => toUtc('2026-11-07', '14:05', 'UTC+15:00'), /valid timezone/);
});
