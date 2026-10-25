const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function fixture({ rect = { left: 100, top: 100, bottom: 144, width: 300 },
  height = 240, calendar = false, picker = false, viewport = null } = {}) {
  const listeners = {};
  const anchor = {
    isConnected: true,
    getBoundingClientRect: () => rect,
    getClientRects: () => [rect]
  };
  let open = false;
  const panel = {
    hidden: true, style: {}, scrollHeight: height - 2,
    classList: { add() {}, contains: (name) => name === 'date-picker' ? calendar : name === 'input-picker' && picker },
    setAttribute() {},
    showPopover: () => { open = true; },
    hidePopover: () => { open = false; },
    matches: () => open,
    contains: () => false
  };
  const context = vm.createContext({
    Node: class {},
    document: { addEventListener: (name, callback) => { listeners[name] = callback; } },
    window: { innerWidth: 800, innerHeight: 600, visualViewport: viewport, addEventListener() {} },
    getComputedStyle: () => ({ maxHeight: calendar ? 'none' : '240px' })
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/anchored-popover.js'), 'utf8'), context);
  const popover = vm.runInContext('calendarPopover', context);
  popover.show(anchor, panel);
  return { popover, anchor, panel, listeners, rect };
}

test('aligns suggestions below the full input bounds without overlap', () => {
  const { panel } = fixture();
  assert.equal(panel.style.left, '100px');
  assert.equal(panel.style.top, '150px');
  assert.equal(panel.style.width, '300px');
  assert.equal(panel.hidden, false);
});

test('flips above the input when the bottom of the viewport is near', () => {
  const { panel } = fixture({ rect: { left: 100, top: 500, bottom: 544, width: 300 } });
  assert.equal(panel.style.top, '254px');
  assert.equal(panel.style.maxHeight, '240px');
});

test('keeps a calendar within a narrow viewport and caps its height', () => {
  const { panel } = fixture({
    rect: { left: 250, top: 100, bottom: 144, width: 300 },
    calendar: true, height: 400,
    viewport: { width: 320, height: 300, offsetLeft: 0, offsetTop: 0, addEventListener() {} }
  });

  assert.equal(panel.style.width, '304px');
  assert.equal(panel.style.left, '8px');
  assert.equal(panel.style.top, '150px');
  assert.equal(panel.style.maxHeight, '142px');
});

test('time and color pickers have usable widths even for small color swatches', () => {
  const { panel } = fixture({
    rect: { left: 720, top: 100, bottom: 144, width: 44 },
    picker: true
  });
  assert.equal(panel.style.width, '336px');
  assert.equal(panel.style.left, '456px');
  assert.equal(panel.style.top, '150px');
});

test('repositions after scrolling and animations, and closes removed anchors', () => {
  const { panel, anchor, rect, listeners } = fixture();
  rect.top = 200;
  rect.bottom = 244;
  listeners.scroll({});
  assert.equal(panel.style.top, '250px');
  rect.bottom = 252;
  listeners.animationend({});
  assert.equal(panel.style.top, '258px');
  rect.bottom = 260;
  listeners.scroll({ target: { constructor: { name: 'VisualViewport' } } });
  assert.equal(panel.style.top, '266px');
  anchor.isConnected = false;
  listeners.scroll({});
  assert.equal(panel.hidden, true);
  assert.equal(panel.matches(), false);
});

test('supports browsers without the popover API', () => {
  const { panel, anchor, popover } = fixture();
  popover.hide(panel);
  panel.showPopover = undefined;
  panel.hidePopover = undefined;
  panel.matches = () => { throw new Error('Popover selectors are unsupported'); };
  popover.show(anchor, panel);
  assert.equal(panel.hidden, false);
  assert.equal(panel.style.top, '150px');
  popover.hide(panel);
  assert.equal(panel.hidden, true);
});
