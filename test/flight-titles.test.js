const { test } = require('node:test');
const assert = require('node:assert/strict');
const { update } = require('../public/flight-titles.js');

test('includes the flight number and time range without duplication', () => {
  const event = { title: 'Flight AF 1290: Paris to Catania', startTime: '09:20', endTime: '12:05' };
  update(event);
  assert.equal(event.title, 'Flight AF1290: Paris to Catania (09:20-12:05)');
  update(event);
  assert.equal(event.title, 'Flight AF1290: Paris to Catania (09:20-12:05)');
  event.startTime = '10:00';
  event.endTime = '12:45';
  update(event);
  assert.equal(event.title, 'Flight AF1290: Paris to Catania (10:00-12:45)');
});

test('finds numbers in descriptions, including mixed alphanumeric airline codes', () => {
  const event = {
    title: 'Flight to Naples', description: '15 Nov 2026, flight U2 4104',
    startTime: '23:30', endTime: '01:00'
  };
  update(event);
  assert.equal(event.title, 'Flight to Naples - U24104 (23:30-01:00)');
  event.description = 'Flight AC306';
  update(event);
  assert.equal(event.title, 'Flight to Naples - AC306 (23:30-01:00)');
});

test('preserves custom titles while updating generated flight details', () => {
  const event = { title: 'Flight AF356', startTime: '13:00', endTime: '15:00' };
  update(event);
  event.title = 'My holiday flight AF356';
  update(event);
  assert.equal(event.title, 'My holiday flight AF356 (13:00-15:00)');
  const edited = { title: event.title, startTime: '14:00', endTime: '16:00' };
  update(edited);
  assert.equal(edited.title, 'My holiday flight AF356 (14:00-16:00)');
});

test('does not invent missing flight data or change non-flight events', () => {
  for (const title of ['Meeting', 'Train TGV7035', 'IC2334: Kortrijk to Bruges', 'Hotel in Tokyo']) {
    const event = { title, startTime: '09:00', endTime: '10:00' };
    update(event);
    assert.equal(event.title, title);
  }
  assert.equal(update({ title: 'Flight to Paris', startTime: '09:00' }).title, 'Flight to Paris (09:00)');
  assert.equal(update({ title: 'Flight AF1290', allDay: true }).title, 'Flight AF1290');
  assert.equal(update({ title: 'Flight to Paris' }).title, 'Flight to Paris');
  assert.equal(update({
    title: 'Flight Paris CDG2E to Toronto YYZ3', startTime: '14:05', endTime: '16:25'
  }).title, 'Flight Paris CDG2E to Toronto YYZ3 (14:05-16:25)');
});
