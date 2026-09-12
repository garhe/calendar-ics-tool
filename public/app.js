const pasteZone = document.getElementById('pasteZone');
const imagePreview = document.getElementById('imagePreview');
const ocrButton = document.getElementById('ocrButton');
const removeScreenshotButton = document.getElementById('removeScreenshotButton');
const rawText = document.getElementById('rawText');
const parseButton = document.getElementById('parseButton');
const toggleEventsButton = document.getElementById('toggleEventsButton');
const eventsRegion = document.getElementById('eventsRegion');
const eventsContainer = document.getElementById('eventsContainer');
const addEventButton = document.getElementById('addEventButton');
const pickFolderButton = document.getElementById('pickFolderButton');
const exportButton = document.getElementById('exportButton');
const folderStatus = document.getElementById('folderStatus');
const statusEl = document.getElementById('status');
const birthdayName = document.getElementById('birthdayName');
const birthDate = document.getElementById('birthDate');
const lunarBirthday = document.getElementById('lunarBirthday');
const birthdayTimezone = document.getElementById('birthdayTimezone');
const timezoneOptions = document.getElementById('timezoneOptions');
const generateBirthdayButton = document.getElementById('generateBirthdayButton');
const lunarStatus = document.getElementById('lunarStatus');

const themePicker = document.getElementById('themePicker');
const themeSwatches = document.getElementById('themeSwatches');
const themeCurrent = document.getElementById('themeCurrent');
const themeStorageKey = 'calendar-ics-theme';
const customColorInput = document.getElementById('customColor');
const interfaceStorageKey = 'calendar-ics-interface-style';
const themeColors = [
  { id: 'sage', name: 'Sage', hue: 145, saturation: 22 },
  { id: 'lagoon', name: 'Lagoon', hue: 172, saturation: 40 },
  { id: 'sky', name: 'Sky', hue: 205, saturation: 35 },
  { id: 'iris', name: 'Iris', hue: 265, saturation: 24 },
  { id: 'rose', name: 'Rose', hue: 345, saturation: 28 }
];
const themeShades = ['Mist', 'Soft', 'Deep'];

const calendarLogo = document.querySelector('.app-mark');
let calendarArtwork = null;
let activeTheme = { color: themeColors[1], shade: 1 };

function updateCalendarLogo() {
  if (!calendarArtwork) return;
  const { color, shade } = activeTheme;
  const artwork = calendarArtwork.cloneNode(true);
  const materialColors = {
    '#81c9b8': 82 - shade * 16,
    '#419884': 54 - shade * 8,
    '#21695f': 32 - shade * 4,
    '#9cbcb0': 72, '#527d72': 42, '#c6d9d1': 84,
    '#8eaea0': 62, '#c9ebe0': 91, '#164e44': 24,
    '#1b5b50': 28, '#6b9d8f': 54, '#aac5bb': 76,
    '#aac7be': 76, '#e5f1ec': 94, '#89afa0': 66,
    '#f3f7f6': 97, '#d7e6e1': 90, '#284d43': 24
  };
  for (const element of artwork.querySelectorAll('[fill], [stroke], [stop-color]')) {
    for (const attribute of ['fill', 'stroke', 'stop-color']) {
      const lightness = materialColors[element.getAttribute(attribute)];
      if (lightness === undefined) continue;
      element.setAttribute(attribute, `hsl(${color.hue} ${color.saturation}% ${lightness}%)`);
    }
  }
  const source = new XMLSerializer().serializeToString(artwork);
  calendarLogo.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
}

fetch(calendarLogo.getAttribute('src'))
  .then((response) => {
    if (!response.ok) throw new Error('Calendar artwork unavailable');
    return response.text();
  })
  .then((source) => {
    const documentSvg = new DOMParser().parseFromString(source, 'image/svg+xml');
    if (documentSvg.querySelector('parsererror') || documentSvg.documentElement.localName !== 'svg') return;
    calendarArtwork = documentSvg.documentElement;
    updateCalendarLogo();
  })
  .catch(() => {});

function customColorFromHex(hex) {
  const channels = hex.slice(1).match(/.{2}/g).map((channel) => parseInt(channel, 16) / 255);
  const [red, green, blue] = channels;
  const maximum = Math.max(...channels);
  const minimum = Math.min(...channels);
  const difference = maximum - minimum;
  const lightness = (maximum + minimum) / 2;
  let hue = 0;
  if (difference) {
    if (maximum === red) hue = ((green - blue) / difference) % 6;
    else if (maximum === green) hue = (blue - red) / difference + 2;
    else hue = (red - green) / difference + 4;
  }
  return {
    id: 'custom', name: 'Custom', hex,
    hue: (hue * 60 + 360) % 360,
    saturation: difference ? difference / (1 - Math.abs(2 * lightness - 1)) * 100 : 0,
    lightness: lightness * 100
  };
}

function applyTheme(colorId, shadeIndex, persist = false, customHex = customColorInput.value) {
  const validHex = /^#[0-9a-f]{6}$/i.test(customHex) ? customHex : '#419884';
  const color = colorId === 'custom' ? customColorFromHex(validHex)
    : themeColors.find((candidate) => candidate.id === colorId) || themeColors[1];
  const shade = Number.isInteger(shadeIndex) && shadeIndex >= 0 && shadeIndex < themeShades.length
    ? shadeIndex : 1;
  const tone = (lightness, saturation = color.saturation) => `hsl(${color.hue} ${saturation}% ${lightness}%)`;
  const accentLightness = color.id === 'custom' ? Math.min(28, color.lightness) : 32 - shade * 4;
  const tintSaturation = color.id === 'custom' ? color.saturation : 42;
  const tokens = {
    '--ink': tone(18 - shade, Math.min(48, color.saturation)),
    '--muted': tone(30 - shade, Math.min(32, color.saturation)),
    '--accent-2': tone(accentLightness),
    '--theme-swatch': color.hex || tone(82 - shade * 16),
    '--accent': tone(accentLightness),
    '--accent-hover': tone(Math.max(0, accentLightness - 6)),
    '--accent-soft': tone(95 - shade * 3),
    '--accent-border': tone(66 - shade * 5),
    '--accent-ring': `hsl(${color.hue} ${color.saturation}% 40% / 0.14)`,
    '--selection': tone(84 - shade * 4),
    '--wash': tone(97 - shade * 3),
    '--background-tint': tone(91 - shade * 4, tintSaturation),
    '--background-counter': `hsl(${(color.hue + 85) % 360} ${Math.min(38, tintSaturation)}% ${94 - shade * 3}%)`,
    '--glass-tint': `hsl(${color.hue} ${tintSaturation}% ${84 - shade * 6}% / 0.38)`,
    '--glass-counter-tint': `hsl(${(color.hue + 85) % 360} ${Math.min(38, tintSaturation)}% 86% / 0.28)`,
    '--bg': tone(98 - shade, Math.min(12, tintSaturation))
  };
  for (const [property, value] of Object.entries(tokens)) {
    document.documentElement.style.setProperty(property, value);
  }
  activeTheme = { color, shade };
  updateCalendarLogo();
  themeSwatches.querySelectorAll('input').forEach((input) => {
    input.checked = input.value === `${color.id}-${shade}`;
    const [swatchColorId, swatchShadeIndex] = input.value.split('-');
    const swatchColor = themeColors.find((candidate) => candidate.id === swatchColorId);
    const accessibleName = `${t(swatchColor.name)} / ${t(themeShades[Number(swatchShadeIndex)])}`;
    input.setAttribute('aria-label', accessibleName);
    input.closest('label').title = accessibleName;
  });
  themeSwatches.querySelectorAll('.theme-color-name').forEach((name, index) => {
    name.dataset.i18nSource = themeColors[index].name;
    name.textContent = t(themeColors[index].name);
  });
  customColorInput.value = validHex;
  themeCurrent.textContent = color.hex ? `${t('Custom')} / ${color.hex.toUpperCase()}`
    : `${t(color.name)} / ${t(themeShades[shade])}`;
  document.querySelector('meta[name="theme-color"]').content = tone(accentLightness);
  if (persist) {
    try {
      localStorage.setItem(themeStorageKey, JSON.stringify({ color: color.id, shade, customHex: validHex }));
    } catch {
      themeCurrent.textContent += ' (this visit only)';
    }
  }
}

for (const color of themeColors) {
  const column = document.createElement('div');
  column.className = 'theme-column';
  const name = document.createElement('span');
  name.className = 'theme-color-name';
  name.textContent = t(color.name);
  column.append(name);
  themeShades.forEach((shade, index) => {
    const label = document.createElement('label');
    label.className = 'theme-swatch';
    label.title = `${color.name} / ${shade}`;
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'theme';
    input.value = `${color.id}-${index}`;
    input.setAttribute('aria-label', `${color.name} / ${shade}`);
    input.addEventListener('change', () => applyTheme(color.id, index, true));
    const preview = document.createElement('span');
    preview.setAttribute('aria-hidden', 'true');
    preview.style.setProperty('--swatch', `hsl(${color.hue} ${color.saturation}% ${82 - index * 16}%)`);
    label.append(input, preview);
    column.append(label);
  });
  themeSwatches.append(column);
}

let savedTheme = null;
try {
  savedTheme = JSON.parse(localStorage.getItem(themeStorageKey));
} catch {
  savedTheme = null;
}
applyTheme(savedTheme?.color, savedTheme?.shade, false, savedTheme?.customHex);
customColorInput.addEventListener('input', () => applyTheme('custom', activeTheme.shade, true));
customColorInput.addEventListener('change', () => applyTheme('custom', activeTheme.shade, true));

function applyInterfaceStyle(style, persist = false) {
  const selectedStyle = ['glass', 'watercolor', 'sketch'].includes(style) ? style : 'glass';
  document.documentElement.dataset.interfaceStyle = selectedStyle;
  document.querySelectorAll('input[name="interfaceStyle"]').forEach((input) => {
    input.checked = input.value === selectedStyle;
  });
  if (persist) {
    try { localStorage.setItem(interfaceStorageKey, selectedStyle); } catch {}
  }
}

let savedInterfaceStyle = 'glass';
try { savedInterfaceStyle = localStorage.getItem(interfaceStorageKey); } catch {}
applyInterfaceStyle(savedInterfaceStyle);
document.getElementById('interfaceChoices').addEventListener('change', (event) => {
  if (event.target.matches('input[name="interfaceStyle"]')) applyInterfaceStyle(event.target.value, true);
});

const headerPickers = [...document.querySelectorAll('.header-actions details')];
for (const picker of headerPickers) {
  picker.addEventListener('toggle', () => {
    if (!picker.open) return;
    for (const other of headerPickers) {
      if (other !== picker) other.open = false;
    }
  });
  picker.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    picker.open = false;
    picker.querySelector('summary').focus();
  });
}
document.addEventListener('pointerdown', (event) => {
  for (const picker of headerPickers) {
    if (!picker.contains(event.target)) picker.open = false;
  }
});

let pastedImageBlob = null;
let folderHandle = null;

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function showButtonRipple(event) {
  if (reducedMotion.matches) return;
  if (event.type === 'pointerdown' && (event.button !== 0 || !event.isPrimary)) return;
  if (event.type === 'click' && event.detail !== 0) return;

  const button = event.target.closest('button, .paste-zone, .theme-picker summary, .language-picker summary');
  if (!button || button.disabled) return;

  const bounds = button.getBoundingClientRect();
  const diameter = Math.hypot(bounds.width, bounds.height) * 2;
  const pointerClick = event.type === 'pointerdown';
  const positionX = pointerClick ? event.clientX - bounds.left : bounds.width / 2;
  const positionY = pointerClick ? event.clientY - bounds.top : bounds.height / 2;
  const ripple = document.createElement('span');
  ripple.className = 'material-ripple';
  ripple.setAttribute('aria-hidden', 'true');
  ripple.style.width = `${diameter}px`;
  ripple.style.height = `${diameter}px`;
  ripple.style.left = `${positionX - diameter / 2}px`;
  ripple.style.top = `${positionY - diameter / 2}px`;
  button.append(ripple);
  window.setTimeout(() => ripple.remove(), 800);
}

document.addEventListener('pointerdown', showButtonRipple);
document.addEventListener('click', showButtonRipple);

const state = {
  events: []
};

const creationEvents = { source: [], lunar: [], recurring: [] };
let activeCreation = '';

function showCreationStep(review) {
  if (!activeCreation) return;
  const section = document.querySelector(`[data-view="${activeCreation}"]`);
  const finalStep = document.getElementById('reviewExportStep');
  section.append(finalStep);
  section.querySelector('.creation-editor').hidden = review;
  finalStep.hidden = !review;
  document.getElementById('creationDetailsButton').toggleAttribute('aria-current', !review);
  document.getElementById('creationReviewButton').toggleAttribute('aria-current', review);
  document.querySelectorAll('.creation-steps [aria-current]').forEach((button) => button.setAttribute('aria-current', 'step'));
  if (review) {
    toggleEventsButton.setAttribute('aria-expanded', 'true');
    renderEvents();
    document.getElementById('reviewExportHeading').focus();
  }
}

function showWorkspaceView(view) {
  if (view === 'review') {
    showCreationStep(true);
    return;
  }
  const picker = document.getElementById('workspaceView');
  if (![...picker.options].some((option) => option.value === view)) return;
  hideTimezoneOptions();
  if (view !== activeCreation) setStatus('');
  if (activeCreation) creationEvents[activeCreation] = state.events;
  activeCreation = view;
  state.events = creationEvents[view] || [];
  picker.value = view;
  document.querySelectorAll('[data-view]').forEach((section) => {
    section.hidden = section.dataset.view !== view;
  });
  document.getElementById('creationSteps').hidden = !view;
  showCreationStep(false);
  renderEvents();
}

document.getElementById('workspaceView').addEventListener('change', (event) => showWorkspaceView(event.target.value));
document.getElementById('creationDetailsButton').addEventListener('click', () => showCreationStep(false));
document.getElementById('creationReviewButton').addEventListener('click', () => showCreationStep(true));

const defaultTimezone = 'Asia/Ho_Chi_Minh';
const defaultTimezoneLabel = 'UTC+7 Ho Chi Minh City';
const supportedTimezones = typeof Intl.supportedValuesOf === 'function'
  ? Intl.supportedValuesOf('timeZone')
  : [defaultTimezone];
const timezoneAliases = [
  { label: 'HCMC / Ho Chi Minh City', timezone: defaultTimezone, terms: 'hcmc saigon vietnam' },
  { label: 'Hanoi', timezone: defaultTimezone, terms: 'ha noi vietnam' },
  { label: 'Edinburgh', timezone: 'Europe/London', terms: 'scotland' },
  { label: 'Rennes', timezone: 'Europe/Paris', terms: 'france' },
  { label: 'Lille', timezone: 'Europe/Paris', terms: 'france' },
  { label: 'Kyoto', timezone: 'Asia/Tokyo', terms: 'japan' },
  { label: 'Osaka', timezone: 'Asia/Tokyo', terms: 'japan' },
  { label: 'Beijing', timezone: 'Asia/Shanghai', terms: 'china' },
  { label: 'Seattle', timezone: 'America/Los_Angeles', terms: 'washington' },
  { label: 'Boston', timezone: 'America/New_York', terms: 'massachusetts' },
  { label: 'Montreal', timezone: 'America/Toronto', terms: 'quebec' }
];

birthdayTimezone.value = defaultTimezoneLabel;
let activeTimezoneInput = null;
let activeTimezoneIndex = -1;

function normalizeTimezoneSearch(value) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
}

function timezoneSearchResults(value) {
  const searchValue = normalizeTimezoneSearch(value);
  if (!searchValue) return timezoneAliases.slice(0, 8);

  const aliases = timezoneAliases.filter(({ label, terms }) =>
    normalizeTimezoneSearch(`${label} ${terms}`).includes(searchValue)
  );
  const cities = supportedTimezones
    .filter((timezone) => normalizeTimezoneSearch(timezone).includes(searchValue))
    .map((timezone) => ({
      label: timezone.replaceAll('_', ' ').replace('/', ' / '),
      timezone
    }));

  const matchRank = ({ label, timezone }) => {
    const names = [normalizeTimezoneSearch(label), normalizeTimezoneSearch(timezone.split('/').at(-1))];
    if (names.includes(searchValue)) return 0;
    if (names.some((name) => name.startsWith(searchValue))) return 1;
    return 2;
  };

  return [...aliases, ...cities]
    .sort((first, second) => matchRank(first) - matchRank(second)
      || first.timezone.split('/').at(-1).length - second.timezone.split('/').at(-1).length
      || first.label.localeCompare(second.label))
    .filter((result, index, results) =>
      results.findIndex(({ timezone }) => timezone === result.timezone) === index
    )
    .slice(0, 8);
}

function hideTimezoneOptions() {
  if (activeTimezoneInput) {
    const list = document.getElementById(activeTimezoneInput.getAttribute('aria-controls'));
    if (list) list.hidden = true;
    activeTimezoneInput.setAttribute('aria-expanded', 'false');
    activeTimezoneInput.removeAttribute('aria-activedescendant');
  }
  activeTimezoneInput = null;
  activeTimezoneIndex = -1;
}

function showTimezoneOptions(input) {
  if (activeTimezoneInput !== input) hideTimezoneOptions();
  activeTimezoneInput = input;
  activeTimezoneIndex = -1;
  input.removeAttribute('aria-activedescendant');
  const list = document.getElementById(input.getAttribute('aria-controls'));
  const results = timezoneSearchResults(input.value);
  list.replaceChildren(...results.map(({ label, timezone }, index) => {
    const option = document.createElement('div');
    option.className = 'timezone-option';
    option.id = `${list.id}-option-${index}`;
    option.setAttribute('role', 'option');
    option.setAttribute('aria-selected', 'false');
    option.dataset.timezone = timezone;
    option.textContent = `${label} (${timezone})`;
    return option;
  }));
  list.hidden = results.length === 0;
  input.setAttribute('aria-expanded', String(results.length > 0));
}

function selectTimezoneOption(option) {
  const input = activeTimezoneInput;
  if (!input || !option) return;
  input.value = option.dataset.timezone;
  hideTimezoneOptions();
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  hideTimezoneOptions();
}

document.addEventListener('input', (event) => {
  if (event.target.matches('[data-timezone-input]')) showTimezoneOptions(event.target);
});
document.addEventListener('focusin', (event) => {
  if (event.target.matches('[data-timezone-input]')) showTimezoneOptions(event.target);
  else hideTimezoneOptions();
});
document.addEventListener('keydown', (event) => {
  if (!event.target.matches('[data-timezone-input]')) return;
  if (event.key === 'Escape' || event.key === 'Tab') {
    if (event.key === 'Escape') event.preventDefault();
    hideTimezoneOptions();
    return;
  }
  if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) return;
  if (event.key !== 'Enter' && (!activeTimezoneInput || event.target.getAttribute('aria-expanded') !== 'true')) {
    showTimezoneOptions(event.target);
  }
  if (!activeTimezoneInput) return;
  const list = document.getElementById(activeTimezoneInput.getAttribute('aria-controls'));
  const options = [...list.children];
  if (list.hidden || !options.length) return;
  if (event.key === 'Enter') {
    if (activeTimezoneIndex >= 0) {
      event.preventDefault();
      selectTimezoneOption(options[activeTimezoneIndex]);
    }
    return;
  }
  event.preventDefault();
  activeTimezoneIndex = (activeTimezoneIndex + (event.key === 'ArrowDown' ? 1 : activeTimezoneIndex < 0 ? 0 : -1) + options.length) % options.length;
  options.forEach((option, index) => option.setAttribute('aria-selected', String(index === activeTimezoneIndex)));
  activeTimezoneInput.setAttribute('aria-activedescendant', options[activeTimezoneIndex].id);
  options[activeTimezoneIndex].scrollIntoView({ block: 'nearest' });
});
document.addEventListener('pointerdown', (event) => {
  const option = event.target.closest('.timezone-option');
  if (option && activeTimezoneInput) {
    event.preventDefault();
    selectTimezoneOption(option);
  } else if (!event.target.closest('.timezone-field')) {
    hideTimezoneOptions();
  }
});
document.addEventListener('focusout', (event) => {
  if (event.target === activeTimezoneInput) hideTimezoneOptions();
});

function resolveTimezone(value) {
  const enteredValue = String(value || '').trim();
  if (!enteredValue) return defaultTimezone;

  const normalizedValue = normalizeTimezoneSearch(enteredValue);
  const cityAlias = timezoneAliases.find(({ label }) => normalizeTimezoneSearch(label) === normalizedValue);
  if (cityAlias) return cityAlias.timezone;
  if (
    normalizedValue === 'hcmc'
    || normalizedValue === 'hanoi'
    || normalizedValue === 'hanoivietnam'
    || normalizedValue.includes('hochiminh')
  ) {
    return defaultTimezone;
  }

  const exactTimezone = supportedTimezones.find(
    (timezone) => timezone.toLowerCase() === enteredValue.toLowerCase()
  );
  if (exactTimezone) return exactTimezone;

  const cityTimezone = supportedTimezones.find((timezone) => {
    const city = timezone.split('/').at(-1);
    return normalizeTimezoneSearch(city) === normalizedValue;
  });
  if (cityTimezone) return cityTimezone;

  const offsetMatch = enteredValue.match(/^(?:utc|gmt)\s*([+-])\s*(\d{1,2})(?::?(\d{2}))?$/i);
  if (offsetMatch) {
    const hours = Number(offsetMatch[2]);
    const minutes = Number(offsetMatch[3] || 0);
    if (hours <= 14 && minutes < 60 && (hours < 14 || minutes === 0)) {
      return `UTC${offsetMatch[1]}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
  }

  return enteredValue;
}

function setStatus(message) {
  statusEl.textContent = message;
}

function sanitizeFilename(name, fallback = 'event') {
  const cleaned = String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return cleaned || fallback;
}

function lunarCalendarFilename(event) {
  const person = String(event.calendarOwner || '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '_')
    .replace(/^_+|_+$/g, '');

  return `${person || 'birthday'}_lunar_calendar.ics`;
}

function escapeIcsText(text) {
  return String(text || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function toIcsDateTime(date, time) {
  if (!date || !time) {
    return null;
  }

  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  const dt = new Date(year, (month || 1) - 1, day || 1, hours || 0, minutes || 0, 0);

  const pad = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
}

function formatNowUtcStamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
}

function toIcsDate(date) {
  return date.replace(/-/g, '');
}

function nextDate(date) {
  const [year, month, day] = date.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return next.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

function isIanaTimezone(timezone) {
  try {
    new Intl.DateTimeFormat('en', { timeZone: timezone }).format();
    return timezone.includes('/') || timezone === 'UTC';
  } catch {
    return false;
  }
}

function fixedTimezoneOffsetMinutes(timezone) {
  const match = timezone.match(/^UTC([+-])(\d{2}):(\d{2})$/);
  if (!match) return null;
  const minutes = Number(match[2]) * 60 + Number(match[3]);
  return match[1] === '+' ? minutes : -minutes;
}

function toIcsUtcDateTime(date, time, offsetMinutes) {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes) - offsetMinutes * 60000);
  return utcDate.toISOString().replace(/[-:]/g, '').replace(/\.000Z$/, 'Z');
}

function toIcsIanaUtcDateTime(date, time, timezone) {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  const intendedWallTime = Date.UTC(year, month - 1, day, hours, minutes);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  let utcTime = intendedWallTime;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const parts = Object.fromEntries(
      formatter.formatToParts(new Date(utcTime))
        .filter(({ type }) => type !== 'literal')
        .map(({ type, value }) => [type, Number(value)])
    );
    const representedWallTime = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second
    );
    utcTime += intendedWallTime - representedWallTime;
  }

  return new Date(utcTime).toISOString().replace(/[-:]/g, '').replace(/\.000Z$/, 'Z');
}

function eventToIcsBlock(event, timezone = resolveTimezone(birthdayTimezone.value)) {
  const eventTimezone = resolveTimezone(event.timezone || timezone);
  const fixedOffsetMinutes = fixedTimezoneOffsetMinutes(eventTimezone);
  const ianaTimezone = isIanaTimezone(eventTimezone);
  const dtStart = event.allDay
    ? toIcsDate(event.date)
    : fixedOffsetMinutes !== null
      ? toIcsUtcDateTime(event.date, event.startTime, fixedOffsetMinutes)
      : ianaTimezone
        ? toIcsIanaUtcDateTime(event.date, event.startTime, eventTimezone)
        : toIcsDateTime(event.date, event.startTime);
  const dtEnd = event.allDay
    ? toIcsDate(event.endDate || nextDate(event.date))
    : fixedOffsetMinutes !== null
      ? toIcsUtcDateTime(event.date, event.endTime, fixedOffsetMinutes)
      : ianaTimezone
        ? toIcsIanaUtcDateTime(event.date, event.endTime, eventTimezone)
        : toIcsDateTime(event.date, event.endTime);

  if (!dtStart || !dtEnd) {
    return null;
  }

  const uid = `${crypto.randomUUID()}@calendar-ics-tool`;

  const lines = [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatNowUtcStamp()}`,
    event.allDay ? `DTSTART;VALUE=DATE:${dtStart}` : `DTSTART:${dtStart}`,
    event.allDay ? `DTEND;VALUE=DATE:${dtEnd}` : `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcsText(event.title || 'Untitled Event')}`,
    `LOCATION:${escapeIcsText(event.location || '')}`,
    `DESCRIPTION:${escapeIcsText(event.description || '')}`
  ];

  if (event.recurrence) {
    if (!event.allDay) {
      lines[3] = `DTSTART;TZID=${eventTimezone}:${toIcsDate(event.date)}T${event.startTime.replace(':', '')}00`;
      lines[4] = `DTEND;TZID=${eventTimezone}:${toIcsDate(event.endDate || event.date)}T${event.endTime.replace(':', '')}00`;
    }
    lines.push(...recurrenceIcsLines(event));
  }

  if (Number.isFinite(event.alarmMinutes)) {
    const trigger = event.allDay && event.alarmMinutes === 1440
      ? '-P1D'
      : event.alarmMinutes === 0 ? 'PT0M' : `-PT${event.alarmMinutes}M`;
    lines.push(
      'BEGIN:VALARM',
      `TRIGGER:${trigger}`,
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeIcsText(event.title || 'Reminder')}`,
      'END:VALARM'
    );
  }

  lines.push('END:VEVENT');
  return lines.join('\r\n');
}

function getLunarDate(year, month, day) {
  const lunar = Solar.fromYmd(year, month, day).getLunar();
  return {
    year: lunar.getYear(),
    month: Math.abs(lunar.getMonth()),
    day: lunar.getDay(),
    isLeapMonth: lunar.getMonth() < 0
  };
}

function calendarDateOrder(language = window.calendarI18n.language) {
  const locale = { en: 'en-US', 'zh-CN': 'zh-CN', vi: 'vi-VN' }[language] || 'en-US';
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' })
    .formatToParts(new Date(Date.UTC(2006, 10, 22)))
    .filter(part => ['year', 'month', 'day'].includes(part.type))
    .map(part => part.type);
}

function parseCalendarDate(value, language = window.calendarI18n.language) {
  const parts = value.trim().split(/\s*[-/]\s*/);
  const order = calendarDateOrder(language);
  if (parts.length !== 3 || parts.some((part, index) => !(order[index] === 'year' ? /^\d{4}$/ : /^\d{1,2}$/).test(part))) return null;
  return Object.fromEntries(order.map((part, index) => [part, Number(parts[index])]));
}

function isValidGregorianDate(date) {
  if (!date) {
    return false;
  }

  const check = new Date(Date.UTC(date.year, date.month - 1, date.day));
  return check.getUTCFullYear() === date.year
    && check.getUTCMonth() + 1 === date.month
    && check.getUTCDate() === date.day;
}

function formatDisplayDate(date, language = window.calendarI18n.language) {
  return calendarDateOrder(language).map(part => String(date[part]).padStart(part === 'year' ? 4 : 2, '0')).join('/');
}

function formatCalendarDateInput(event) {
  const digits = event.target.value.replace(/\D/g, '').slice(0, 8);
  let offset = 0;
  const parts = calendarDateOrder().map(part => {
    const length = part === 'year' ? 4 : 2;
    const value = digits.slice(offset, offset + length);
    offset += length;
    return value;
  }).filter(Boolean);
  event.target.value = parts.join('/');
}

function updateLunarBirthdayFromGregorian(event) {
  formatCalendarDateInput(event);
  const gregorianDate = parseCalendarDate(birthDate.value);

  if (!isValidGregorianDate(gregorianDate) || typeof Solar === 'undefined') {
    lunarBirthday.value = '';
    return;
  }

  lunarBirthday.value = formatDisplayDate(
    getLunarDate(gregorianDate.year, gregorianDate.month, gregorianDate.day)
  );
}

birthDate.addEventListener('input', updateLunarBirthdayFromGregorian);
lunarBirthday.addEventListener('input', formatCalendarDateInput);

function findGregorianDateForLunarYear(lunarYear, lunarBirthDate, requireLeapMonth) {
  const lunarMonth = requireLeapMonth ? -lunarBirthDate.month : lunarBirthDate.month;

  try {
    return Lunar.fromYmd(lunarYear, lunarMonth, lunarBirthDate.day).getSolar().toYmd();
  } catch {
    return null;
  }
}

function makeCalendarIcs(events) {
  const timezone = resolveTimezone(birthdayTimezone.value);
  const blocks = events
    .map((event) => eventToIcsBlock(event, timezone))
    .filter(Boolean)
    .join('\r\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Calendar ICS Tool//EN',
    'CALSCALE:GREGORIAN',
    blocks,
    'END:VCALENDAR',
    ''
  ].join('\r\n');
}

async function exportIcsFile(filename, content) {
  if (folderHandle) {
    try {
      const file = await folderHandle.getFileHandle(filename, { create: true });
      const writable = await file.createWritable();
      await writable.write(content);
      await writable.close();
      return;
    } catch (error) {
      if (error?.name !== 'NotAllowedError' && error?.name !== 'SecurityError') throw error;
      folderHandle = null;
      folderStatus.textContent = 'Folder access unavailable; exporting to browser Downloads';
    }
  }

  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function inferEventsFromText(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const events = [];

  for (const line of lines) {
    const parts = line.split('|').map((p) => p.trim());
    if (parts.length < 2) {
      const inferredEvent = inferFlexibleEvent(line);
      if (inferredEvent) {
        events.push(inferredEvent);
      } else if (events.length > 0) {
        const previousEvent = events.at(-1);
        previousEvent.description = [previousEvent.description, line].filter(Boolean).join(' ');
      }
      continue;
    }

    const title = parts[0];
    const dateTime = parts[1] || '';
    const location = parts[2] || '';
    const description = parts[3] || '';
    const timezone = parts[4] || '';

    const dateResult = extractDate(dateTime);
    const timeResult = extractTimeRange(dateResult.remainingText);
    const allDay = !timeResult.startTime;

    events.push({
      title,
      date: dateResult.date,
      startTime: timeResult.startTime,
      endTime: timeResult.endTime,
      allDay,
      timezone: allDay ? timezone : (timezone || guessTimezone(`${location} ${description}`)),
      location,
      description
    });
  }

  return events;
}

const monthNumbers = {
  jan: 1, january: 1,
  feb: 2, february: 2, fev: 2, fevrier: 2,
  mar: 3, march: 3, mars: 3,
  apr: 4, april: 4, avr: 4, avril: 4,
  may: 5, mai: 5,
  jun: 6, june: 6, juin: 6,
  jul: 7, july: 7, juil: 7, juillet: 7,
  aug: 8, august: 8, aout: 8,
  sep: 9, sept: 9, september: 9, septembre: 9,
  oct: 10, october: 10, octobre: 10,
  nov: 11, november: 11, novembre: 11,
  dec: 12, december: 12, decembre: 12
};

function normalizeMonthName(value) {
  return value.toLowerCase().replace(/\./g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function itineraryDate(day, monthName, year = new Date().getFullYear()) {
  const month = monthNumbers[normalizeMonthName(monthName)];
  if (!month) return '';
  return `${year}-${String(month).padStart(2, '0')}-${String(Number(day)).padStart(2, '0')}`;
}

function normalizeExtractedText(value) {
  return value
    .replace(/(?:-+|=)>/g, '>')
    .replace(/[›»➜➡→]/g, '>')
    .replace(/[‐‑‒–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function validIsoDate(year, month, day) {
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (candidate.getUTCFullYear() !== year
    || candidate.getUTCMonth() + 1 !== month
    || candidate.getUTCDate() !== day) return '';
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function extractDate(value) {
  const text = normalizeExtractedText(value);
  const patterns = [
    { regex: /\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/, parts: (match) => [match[1], match[2], match[3]] },
    { regex: /\b(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2})\b/, parts: (match) => [match[3], match[2], match[1]] },
    { regex: /\b(\d{1,2})\s+([\p{L}.]{3,10})(?:\s*,?\s*(20\d{2}))?/iu, parts: (match) => [match[3] || new Date().getFullYear(), monthNumbers[normalizeMonthName(match[2])], match[1]] },
    { regex: /\b([\p{L}.]{3,10})\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s*,?\s*(20\d{2}))?/iu, parts: (match) => [match[3] || new Date().getFullYear(), monthNumbers[normalizeMonthName(match[1])], match[2]] }
  ];

  for (const { regex, parts } of patterns) {
    const match = text.match(regex);
    if (!match) continue;
    const [year, month, day] = parts(match).map(Number);
    const date = validIsoDate(year, month, day);
    if (date) return { date, remainingText: text.replace(match[0], ' ').replace(/\s+/g, ' ').trim() };
  }

  return { date: '', remainingText: text };
}

function parseFlexibleTime(hourValue, minuteValue = '0', meridiem = '') {
  let hours = Number(hourValue);
  const minutes = Number(minuteValue || 0);
  const period = meridiem.toLowerCase();
  if (period === 'pm' && hours < 12) hours += 12;
  if (period === 'am' && hours === 12) hours = 0;
  if (hours > 23 || minutes > 59) return '';
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function extractTimeRange(value) {
  const time = '(\\d{1,2})(?:[:h.]([0-5]\\d))?\\s*(am|pm)?';
  const range = new RegExp(`${time}\\s*(?:-|>|to|until|à|au|bis|hasta)\\s*${time}`, 'i');
  const match = normalizeExtractedText(value).match(range);
  if (!match) return { startTime: '', endTime: '', remainingText: value };

  return {
    startTime: parseFlexibleTime(match[1], match[2], match[3]),
    endTime: parseFlexibleTime(match[4], match[5], match[6] || match[3]),
    remainingText: normalizeExtractedText(value).replace(match[0], ' ').replace(/\s+/g, ' ').trim()
  };
}

function guessTimezone(value) {
  const text = value.toLowerCase();
  const timezoneHints = [
    [/\b(paris|france|rennes|lille|metz|luxembourg|brussels|bruges)\b/, 'Europe/Paris'],
    [/\b(london|edinburgh|uk|england|scotland)\b/, 'Europe/London'],
    [/\b(tokyo|kyoto|osaka|japan)\b/, 'Asia/Tokyo'],
    [/\b(berlin|hamburg|germany)\b/, 'Europe/Berlin'],
    [/\b(rome|naples|palermo|catania|italy)\b/, 'Europe/Rome'],
    [/\b(toronto|montreal)\b/, 'America/Toronto'],
    [/\b(vancouver)\b/, 'America/Vancouver'],
    [/\b(ho chi minh|hanoi|vietnam)\b/, 'Asia/Ho_Chi_Minh']
  ];
  return timezoneHints.find(([pattern]) => pattern.test(text))?.[1] || defaultTimezone;
}

function inferFlexibleEvent(line) {
  const normalizedLine = normalizeExtractedText(line);
  const dateResult = extractDate(normalizedLine);
  if (!dateResult.date) return null;

  const stayMatch = dateResult.remainingText.match(/(?:>|to)?\s*(?:\d{1,2}\s+[a-z]+(?:\s+20\d{2})?\s*:?)?\s*(\d+)\s+nights?\s+in\s+(.+)/i);
  if (stayMatch) {
    const nights = Number(stayMatch[1]);
    const location = stayMatch[2].replace(/\s+\d+(?:[.,]\d+)?\s*(?:€|eur|usd|gbp).*$/i, '').trim();
    return {
      title: `${nights}-night stay in ${location}`,
      date: dateResult.date,
      endDate: addDays(dateResult.date, nights),
      allDay: true,
      timezone: guessTimezone(location),
      location,
      description: normalizedLine
    };
  }

  const timeResult = extractTimeRange(dateResult.remainingText);
  const details = timeResult.remainingText
    .replace(/\b(?:lun|mar|mer|jeu|ven|sam|dim)\.?\b/gi, '')
    .replace(/[\s.:,-]+(?:de|from)?[\s.:,-]*$/i, '')
    .replace(/^[\s:,-]+|[\s:,-]+$/g, '')
    .trim();
  const serviceRoute = details.match(/\b(?:(train|bus|flight|ferry)\s+)?((?:[a-z]{2,}\s+)?[a-z]*\d[\w-]*)\s+(.+?)\s*>\s*(.+?)(?=\s+\d+(?:[.,]\d+)?\s*(?:€|eur|usd|gbp)|$)/i);
  const plainRoute = details.match(/^(.+?)\s*>\s*(.+)$/);
  const routeMatch = serviceRoute || plainRoute;
  const mode = serviceRoute?.[1] || (serviceRoute ? 'Flight' : '');
  const service = serviceRoute?.[2] || '';
  const origin = (serviceRoute?.[3] || plainRoute?.[1] || '').trim();
  const destination = (serviceRoute?.[4] || plainRoute?.[2] || '').trim();
  const location = routeMatch ? `${origin} to ${destination}` : '';
  const title = serviceRoute
    ? `${mode[0].toUpperCase()}${mode.slice(1).toLowerCase()} ${service}`.trim() + `: ${location}`
    : plainRoute
      ? location
    : (details.replace(/\s+\d+(?:[.,]\d+)?\s*(?:€|eur|usd|gbp).*$/i, '').trim() || 'Calendar event');

  return {
    title,
    date: dateResult.date,
    startTime: timeResult.startTime,
    endTime: timeResult.endTime,
    allDay: !timeResult.startTime,
    timezone: guessTimezone(`${location} ${details}`),
    location,
    description: normalizedLine
  };
}

function normalizeTime(value) {
  const [h, m] = value.split(':').map((n) => Number(n));
  if (Number.isNaN(h) || Number.isNaN(m)) {
    return '';
  }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function renderEvents() {
  eventsContainer.innerHTML = '';
  document.getElementById('creationReviewButton').disabled = state.events.length === 0;
  exportButton.disabled = state.events.length === 0;
  addEventButton.hidden = activeCreation !== 'source';
  const expanded = toggleEventsButton.getAttribute('aria-expanded') === 'true';
  eventsRegion.hidden = !expanded;
  toggleEventsButton.textContent = t(`${expanded ? 'Hide' : 'Show'} events ({count})`, { count: state.events.length });

  if (state.events.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'hint';
    emptyMessage.textContent = t('No events yet. Extract from text or add one manually.');
    eventsContainer.append(emptyMessage);
    return;
  }

  state.events.forEach((event, index) => {
    const card = document.createElement('div');
    card.className = 'event-card';
    card.innerHTML = `
      <div class="event-head">
        <strong>${t('Event {number}', { number: index + 1 })}</strong>
        <button type="button" data-remove="${index}">${t('Remove')}</button>
      </div>
      <label>${t('Title')}<input data-key="title" data-index="${index}" type="text" value="${escapeHtml(event.title)}"></label>
      ${event.recurrence ? `<div class="recurrence-review"><p>${escapeHtml(event.recurrence.summary)}</p><button type="button" class="secondary-button" data-edit-recurrence="${index}">${t('Edit recurrence')}</button></div><fieldset disabled>` : ''}
      <div class="event-grid">
        <label>${t('Date')}<input data-key="date" data-index="${index}" type="date" value="${escapeHtml(event.date)}"></label>
        <label>${t('Location')}<input data-key="location" data-index="${index}" type="text" value="${escapeHtml(event.location)}"></label>
        ${event.allDay
          ? `<div class="all-day-label">${t('All-day event')}</div>`
          : `<label>${t('Start')}<input data-key="startTime" data-index="${index}" type="time" value="${escapeHtml(event.startTime)}"></label>
             <label>${t('End')}<input data-key="endTime" data-index="${index}" type="time" value="${escapeHtml(event.endTime)}"></label>
             <label class="timezone-field">${t('Timezone (required)')}<input id="eventTimezone-${index}" data-timezone-input data-key="timezone" data-index="${index}" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="eventTimezoneOptions-${index}" autocomplete="off" required placeholder="${t('City or UTC offset')}" value="${escapeHtml(event.timezone)}"><div id="eventTimezoneOptions-${index}" class="timezone-options" role="listbox" hidden></div></label>`}
      </div>
      ${event.recurrence ? '</fieldset>' : ''}
      <label>${t('Description')}<input data-key="description" data-index="${index}" type="text" value="${escapeHtml(event.description)}"></label>
    `;

    eventsContainer.appendChild(card);
  });
}

toggleEventsButton.addEventListener('click', () => {
  const expanded = toggleEventsButton.getAttribute('aria-expanded') === 'true';
  toggleEventsButton.setAttribute('aria-expanded', String(!expanded));
  eventsRegion.hidden = expanded;
  toggleEventsButton.textContent = t(`${expanded ? 'Show' : 'Hide'} events ({count})`, { count: state.events.length });
});

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

document.addEventListener('paste', (event) => {
  const items = event.clipboardData?.items || [];
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const imageBlob = item.getAsFile();
      if (!imageBlob) continue;
      pastedImageBlob = imageBlob;
      ocrButton.disabled = true;
      removeScreenshotButton.hidden = false;
      const url = URL.createObjectURL(imageBlob);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        if (pastedImageBlob !== imageBlob) return;
        imagePreview.width = img.width;
        imagePreview.height = img.height;
        const ctx = imagePreview.getContext('2d');
        ctx.drawImage(img, 0, 0);
        imagePreview.hidden = false;
        ocrButton.disabled = false;
        showWorkspaceView('source');
        setStatus(t('Screenshot ready.'));
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        if (pastedImageBlob !== imageBlob) return;
        removeScreenshotButton.click();
        setStatus(t('Unable to read this screenshot. Try another image.'));
      };
      img.src = url;
      event.preventDefault();
      return;
    }
  }
});

removeScreenshotButton.addEventListener('click', () => {
  pastedImageBlob = null;
  imagePreview.hidden = true;
  imagePreview.width = 0;
  imagePreview.height = 0;
  ocrButton.disabled = true;
  removeScreenshotButton.hidden = true;
  setStatus(t('Screenshot removed.'));
  pasteZone.focus();
});

parseButton.addEventListener('click', () => {
  const text = rawText.value.trim();
  if (!text) {
    setStatus(t('Paste or type event text first.'));
    return;
  }

  state.events = inferEventsFromText(text);
  toggleEventsButton.setAttribute('aria-expanded', 'true');
  eventsRegion.hidden = false;
  renderEvents();
  showWorkspaceView('review');

  setStatus(t('Extracted {count} event(s). Review and edit before export.', { count: state.events.length }));
});

document.addEventListener('input', (event) => {
  const target = event.target;
  const index = Number(target.dataset.index);
  const key = target.dataset.key;

  if (Number.isInteger(index) && key && state.events[index]) {
    state.events[index][key] = target.value;
  }
});

eventsContainer.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-remove]');
  if (!button) {
    return;
  }

  const index = Number(button.dataset.remove);
  if (Number.isInteger(index)) {
    state.events.splice(index, 1);
    renderEvents();
  }
});

addEventButton.addEventListener('click', () => {
  state.events.push({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    timezone: '',
    location: '',
    description: ''
  });
  renderEvents();
});

generateBirthdayButton.addEventListener('click', () => {
  const eventTitle = birthdayName.value.trim();
  const enteredLunarBirthDate = parseCalendarDate(lunarBirthday.value);

  if (!eventTitle || !enteredLunarBirthDate) {
    lunarStatus.textContent = t('Enter an event title and lunar date as {format}.', { format: t('MM/DD/YYYY') });
    return;
  }

  if (typeof Solar === 'undefined' || typeof Lunar === 'undefined') {
    lunarStatus.textContent = t('The lunar calendar library did not load. Check your internet connection and reload.');
    return;
  }

  let validatedLunarDate;
  try {
    validatedLunarDate = Lunar.fromYmd(
      enteredLunarBirthDate.year,
      enteredLunarBirthDate.month,
      enteredLunarBirthDate.day
    );
  } catch {
    lunarStatus.textContent = t('Enter a valid lunar event date as {format}.', { format: t('MM/DD/YYYY') });
    return;
  }

  const lunarBirthDate = {
    year: validatedLunarDate.getYear(),
    month: Math.abs(validatedLunarDate.getMonth()),
    day: validatedLunarDate.getDay(),
    isLeapMonth: validatedLunarDate.getMonth() < 0
  };

  const generatedEvents = [];
  let skippedYears = 0;
  const today = new Date();
  const todayYmd = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0')
  ].join('-');

  for (let lunarYear = today.getFullYear(); generatedEvents.length < 60; lunarYear += 1) {
    const date = findGregorianDateForLunarYear(lunarYear, lunarBirthDate, false);
    if (!date) {
      skippedYears += 1;
      continue;
    }
    if (date < todayYmd) {
      continue;
    }

    generatedEvents.push({
      title: eventTitle,
      date,
      allDay: true,
      calendarOwner: eventTitle,
      calendarType: 'lunar-birthday',
      timezone: resolveTimezone(birthdayTimezone.value),
      location: '',
      description: `Annual lunar event: month ${lunarBirthDate.month}, day ${lunarBirthDate.day}${lunarBirthDate.isLeapMonth ? ' (leap month)' : ''}.`,
      alarmMinutes: 1440
    });
  }

  state.events = generatedEvents;
  renderEvents();
  showWorkspaceView('review');

  const lunarLabel = `${lunarBirthDate.isLeapMonth ? 'leap ' : ''}month ${lunarBirthDate.month}, day ${lunarBirthDate.day}`;
  const skippedLabel = skippedYears ? ` Skipped ${skippedYears} year(s) where that lunar date does not occur.` : '';
  lunarStatus.textContent = `Added 60 future all-day reminders for lunar ${lunarLabel}.${skippedLabel}`;
  setStatus(t('Added 60 lunar event reminders with one-day alerts. Review them before export.'));
});

ocrButton.addEventListener('click', async () => {
  if (!pastedImageBlob) {
    setStatus(t('Paste a screenshot first.'));
    return;
  }

  setStatus(t('Running OCR...'));
  const imageBlob = pastedImageBlob;
  ocrButton.disabled = true;

  try {
    const { data } = await Tesseract.recognize(imageBlob, 'eng');
    if (pastedImageBlob !== imageBlob) return;
    rawText.value = data.text;
    setStatus(t('OCR done. Review text and click "Extract Events".'));
  } catch (error) {
    if (pastedImageBlob !== imageBlob) return;
    console.error(error);
    setStatus(t('OCR failed. Try a clearer screenshot or paste text manually.'));
  } finally {
    if (pastedImageBlob === imageBlob) ocrButton.disabled = false;
  }
});

pickFolderButton.addEventListener('click', async () => {
  if (!('showDirectoryPicker' in window)) {
    setStatus(t('Folder selection is unavailable here. Export will use your browser Downloads folder.'));
    return;
  }

  try {
    folderHandle = await window.showDirectoryPicker();
    folderStatus.textContent = t('Selected: {name}', { name: folderHandle.name });
    setStatus(t('Output folder selected. Choose file mode and export.'));
  } catch {
    setStatus(t('Folder selection canceled. Export will use your browser Downloads folder.'));
  }
});

exportButton.addEventListener('click', async () => {
  const invalidTimezoneEvent = state.events.find((event) => {
    if (event.allDay) return false;
    const timezone = resolveTimezone(event.timezone);
    return !event.timezone || (!isIanaTimezone(timezone) && fixedTimezoneOffsetMinutes(timezone) === null);
  });
  if (invalidTimezoneEvent) {
    setStatus(t('Every timed event requires a valid city/IANA timezone or UTC offset.'));
    return;
  }

  const validEvents = state.events.filter((event) => (
    event.title && event.date && (event.allDay || (event.startTime && event.endTime && event.timezone))
  ));
  if (validEvents.length === 0) {
    setStatus(t('Need at least one complete event with a title and date.'));
    return;
  }

  const mode = document.querySelector('input[name="mode"]:checked').value;

  try {
    if (mode === 'single') {
      const ics = makeCalendarIcs(validEvents);
      const filename = validEvents.every((event) => event.calendarType === 'lunar-birthday')
        ? lunarCalendarFilename(validEvents[0])
        : 'calendar-events.ics';
      await exportIcsFile(filename, ics);
      setStatus(t('{action} 1 file with {count} event(s).', {
        action: t(folderHandle ? 'Saved' : 'Downloaded'), count: validEvents.length
      }));
      return;
    }

    let created = 0;
    for (const event of validEvents) {
      const name = `${sanitizeFilename(event.title, 'event')}-${event.date || 'date'}.ics`;
      await exportIcsFile(name, makeCalendarIcs([event]));
      created += 1;
    }

    setStatus(t('{action} {count} file(s), one per event.', {
      action: t(folderHandle ? 'Saved' : 'Downloaded'), count: created
    }));
  } catch (error) {
    console.error(error);
    setStatus(t('Failed to write file(s). Check folder permissions and try again.'));
  }
});

pasteZone.addEventListener('click', () => {
  pasteZone.focus();
});

let dateInputLanguage = window.calendarI18n.language;
document.addEventListener('languagechange', () => {
  for (const field of [birthDate, lunarBirthday]) {
    const date = parseCalendarDate(field.value, dateInputLanguage);
    if (date) field.value = formatDisplayDate(date);
  }
  dateInputLanguage = window.calendarI18n.language;
  applyTheme(activeTheme.color.id, activeTheme.shade);
  renderEvents();
});
renderEvents();
