(() => {
  const panel = document.createElement('div');
  panel.id = 'calendarDatePicker';
  panel.className = 'date-picker';
  panel.setAttribute('role', 'dialog');
  panel.hidden = true;
  document.body.append(panel);
  let input = null;
  let month = null;
  let focusedDate = '';

  const dateValue = (date) => `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const parseDate = (value) => new Date(`${value}T12:00:00`);
  const today = () => dateValue(new Date());
  const allowed = (value) => (!input.min || value >= input.min) && (!input.max || value <= input.max);
  const clamped = (value) => input.min && value < input.min ? input.min : input.max && value > input.max ? input.max : value;

  function close(restoreFocus = false) {
    if (!input) return;
    const previous = input;
    previous.setAttribute('aria-expanded', 'false');
    calendarPopover.hide(panel);
    input = null;
    if (restoreFocus && previous.isConnected) previous.focus();
  }

  function button(text, label, action) {
    const element = document.createElement('button');
    element.type = 'button';
    element.className = 'secondary-button';
    element.textContent = text;
    element.setAttribute('aria-label', label);
    element.addEventListener('click', action);
    return element;
  }

  function choose(value) {
    const target = input;
    target.value = value;
    close(true);
    target.dispatchEvent(new Event('input', { bubbles: true }));
    target.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function moveMonth(delta) {
    const next = new Date(month);
    next.setMonth(next.getMonth() + delta);
    if (next.getFullYear() < 1 || next.getFullYear() > 9999) return;
    month = next;
    focusedDate = dateValue(month);
    render();
  }

  function render(focusDay = false) {
    const locale = calendarI18n.language;
    panel.setAttribute('aria-label', t('Choose date'));
    const header = document.createElement('div');
    header.className = 'date-picker-header';
    const monthSelect = document.createElement('select');
    monthSelect.setAttribute('aria-label', t('Month'));
    for (let index = 0; index < 12; index++) {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2026, index, 1));
      monthSelect.append(option);
    }
    monthSelect.value = String(month.getMonth());
    monthSelect.addEventListener('change', () => {
      month.setMonth(Number(monthSelect.value));
      focusedDate = dateValue(month);
      render();
      panel.querySelector('select').focus();
    });
    const year = document.createElement('input');
    year.type = 'number';
    year.required = true;
    year.min = '1';
    year.max = '9999';
    year.value = String(month.getFullYear());
    year.setAttribute('aria-label', t('Year'));
    year.addEventListener('change', () => {
      if (!year.reportValidity() || !year.value) return;
      month.setFullYear(Number(year.value));
      focusedDate = dateValue(month);
      render();
      panel.querySelector('input').focus();
    });
    header.append(
      button('<', t('Previous month'), () => { moveMonth(-1); panel.querySelector('button').focus(); }),
      monthSelect, year,
      button('>', t('Next month'), () => { moveMonth(1); panel.querySelector('.date-picker-header button:last-child').focus(); })
    );
    const grid = document.createElement('div');
    grid.className = 'date-picker-grid';
    grid.setAttribute('role', 'group');
    grid.setAttribute('aria-label', new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(month));
    for (let day = 0; day < 7; day++) {
      const label = document.createElement('span');
      label.textContent = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2026, 10, 1 + day));
      label.className = 'date-picker-weekday';
      grid.append(label);
    }
    const first = new Date(month);
    first.setDate(1 - first.getDay());
    for (let index = 0; index < 42; index++) {
      const date = new Date(first);
      date.setDate(first.getDate() + index);
      const value = dateValue(date);
      const day = button(String(date.getDate()),
        new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(date), () => choose(value));
      day.dataset.date = value;
      day.classList.add('date-picker-day');
      day.classList.toggle('outside-month', date.getMonth() !== month.getMonth());
      day.setAttribute('aria-pressed', String(value === input.value));
      if (value === today()) day.setAttribute('aria-current', 'date');
      day.disabled = !allowed(value) || date.getFullYear() < 1 || date.getFullYear() > 9999;
      day.tabIndex = value === focusedDate && !day.disabled ? 0 : -1;
      grid.append(day);
    }
    if (!grid.querySelector('[tabindex="0"]')) {
      const firstEnabled = grid.querySelector('button:not(:disabled)');
      if (firstEnabled) firstEnabled.tabIndex = 0;
    }
    const footer = document.createElement('div');
    footer.className = 'date-picker-footer';
    const todayButton = button(t('Today'), t('Today'), () => choose(today()));
    todayButton.disabled = !allowed(today());
    footer.append(button(t('Clear'), t('Clear'), () => choose('')), todayButton,
      button(t('Close'), t('Close'), () => close(true)));
    panel.replaceChildren(header, grid, footer);
    calendarPopover.show(input, panel);
    if (focusDay) panel.querySelector('[tabindex="0"]')?.focus();
  }

  function open(target) {
    if (target.disabled || target.readOnly) return;
    if (input === target) { close(); return; }
    close();
    input = target;
    input.setAttribute('aria-haspopup', 'dialog');
    input.setAttribute('aria-controls', panel.id);
    input.setAttribute('aria-expanded', 'true');
    focusedDate = clamped(input.value || today());
    month = parseDate(focusedDate);
    month.setDate(1);
    render(true);
  }

  document.addEventListener('click', (event) => {
    if (event.target.matches('input[type="date"]')) {
      event.preventDefault();
      open(event.target);
    }
  });
  document.addEventListener('pointerdown', (event) => {
    if (input && !panel.contains(event.target) && event.target !== input) close();
  });
  document.addEventListener('focusin', (event) => {
    if (input && !panel.contains(event.target) && event.target !== input) close();
  });
  document.addEventListener('keydown', (event) => {
    if (event.target.matches('input[type="date"]') && ['Enter', ' ', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
      open(event.target);
      return;
    }
    if (!input) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close(true);
      return;
    }
    if (event.key === 'Tab' && panel.contains(event.target)) {
      const controls = [...panel.querySelectorAll('button:not(:disabled), select, input')]
        .filter((element) => element.tabIndex >= 0);
      const index = controls.indexOf(document.activeElement);
      event.preventDefault();
      controls[(index + (event.shiftKey ? -1 : 1) + controls.length) % controls.length].focus();
      return;
    }
    const current = event.target.dataset.date;
    if (!current) return;
    const date = parseDate(current);
    const offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7,
      Home: -date.getDay(), End: 6 - date.getDay() };
    if (Object.hasOwn(offsets, event.key)) date.setDate(date.getDate() + offsets[event.key]);
    else if (['PageUp', 'PageDown'].includes(event.key)) {
      const day = date.getDate();
      date.setDate(1);
      date.setMonth(date.getMonth() + (event.key === 'PageUp' ? -1 : 1));
      const last = new Date(date);
      last.setMonth(last.getMonth() + 1, 0);
      date.setDate(Math.min(day, last.getDate()));
    } else return;
    event.preventDefault();
    const value = dateValue(date);
    if (!allowed(value) || date.getFullYear() < 1 || date.getFullYear() > 9999) return;
    focusedDate = value;
    month = new Date(date);
    month.setDate(1);
    render(true);
  });
  document.addEventListener('languagechange', () => close());
})();
