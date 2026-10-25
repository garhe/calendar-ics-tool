(() => {
  const panel = document.createElement('div');
  panel.id = 'calendarInputPicker';
  panel.className = 'input-picker';
  panel.setAttribute('role', 'dialog');
  panel.hidden = true;
  document.body.append(panel);
  let input = null;

  function close(restoreFocus = false) {
    if (!input) return;
    const previous = input;
    previous.setAttribute('aria-expanded', 'false');
    calendarPopover.hide(panel);
    input = null;
    if (restoreFocus && previous.isConnected) previous.focus();
  }

  function choose(value) {
    const target = input;
    target.value = value;
    close(true);
    target.dispatchEvent(new Event('input', { bubbles: true }));
    target.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function button(text, action) {
    const element = document.createElement('button');
    element.type = 'button';
    element.className = 'secondary-button';
    element.textContent = t(text);
    element.addEventListener('click', action);
    return element;
  }

  function field(text, control) {
    const label = document.createElement('label');
    const caption = document.createElement('span');
    caption.textContent = t(text);
    label.append(caption, control);
    return label;
  }

  function renderTime(form) {
    const group = document.createElement('div');
    group.className = 'time-picker-fields';
    const parts = (input.value || '00:00').split(':');
    const names = ['Hour (0-23)', 'Minute', 'Second'];
    const count = parts.length > 2 || (input.step && input.step !== 'any' && Number(input.step) < 60) ? 3 : 2;
    const controls = [];
    for (let index = 0; index < count; index++) {
      const control = document.createElement('input');
      control.type = 'number';
      control.min = '0';
      control.max = index === 0 ? '23' : index === 2 ? '59.999' : '59';
      control.step = index === 2 ? 'any' : '1';
      control.required = true;
      control.value = parts[index] || '00';
      control.name = ['hour', 'minute', 'second'][index];
      controls.push(control);
      group.append(field(names[index], control));
    }
    form.append(group);
    return () => controls.map((control) => {
      const [integer, fraction] = control.value.split('.');
      return integer.padStart(2, '0') + (fraction ? `.${fraction}` : '');
    }).join(':');
  }

  function renderColor(form) {
    const hex = document.createElement('input');
    hex.type = 'text';
    hex.required = true;
    hex.pattern = '#[0-9a-fA-F]{6}';
    hex.maxLength = 7;
    hex.value = input.value;
    hex.spellcheck = false;
    hex.autocomplete = 'off';
    const preview = document.createElement('div');
    preview.className = 'color-picker-preview';
    preview.setAttribute('aria-hidden', 'true');
    preview.style.backgroundColor = hex.value;
    form.append(preview, field('Hex color', hex));
    const sliders = ['Red', 'Green', 'Blue'].map((name, index) => {
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = '0';
      slider.max = '255';
      slider.step = '1';
      slider.value = String(parseInt(hex.value.slice(index * 2 + 1, index * 2 + 3), 16));
      const output = document.createElement('output');
      output.value = slider.value;
      const label = field(name, slider);
      label.className = 'color-picker-channel';
      label.append(output);
      form.append(label);
      slider.addEventListener('input', () => {
        output.value = slider.value;
        hex.value = `#${sliders.map(({ slider: channel }) => Number(channel.value).toString(16).padStart(2, '0')).join('')}`;
        preview.style.backgroundColor = hex.value;
      });
      return { slider, output };
    });
    hex.addEventListener('input', () => {
      if (!hex.checkValidity()) return;
      preview.style.backgroundColor = hex.value;
      sliders.forEach(({ slider, output }, index) => {
        slider.value = String(parseInt(hex.value.slice(index * 2 + 1, index * 2 + 3), 16));
        output.value = slider.value;
      });
    });
    return () => hex.value;
  }

  function open(target) {
    if (target.disabled || target.readOnly) return;
    if (input === target) { close(); return; }
    close();
    input = target;
    const color = input.type === 'color';
    (input.closest('details') || document.body).append(panel);
    input.setAttribute('aria-haspopup', 'dialog');
    input.setAttribute('aria-controls', panel.id);
    input.setAttribute('aria-expanded', 'true');
    panel.setAttribute('aria-label', t(color ? 'Choose color' : 'Choose time'));
    const form = document.createElement('form');
    form.noValidate = true;
    const value = color ? renderColor(form) : renderTime(form);
    const error = document.createElement('p');
    error.className = 'picker-error';
    error.setAttribute('role', 'alert');
    const footer = document.createElement('div');
    footer.className = 'picker-actions';
    if (!color) footer.append(button('Clear', () => choose('')));
    const apply = document.createElement('button');
    apply.type = 'submit';
    apply.textContent = t('Apply');
    footer.append(button('Cancel', () => close(true)), apply);
    form.append(error, footer);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const controls = [...form.querySelectorAll('input')];
      const invalid = controls.find((control) => !control.checkValidity());
      const candidate = input.cloneNode();
      candidate.value = value();
      if (invalid || !candidate.value || !candidate.checkValidity()) {
        error.textContent = t(color ? 'Enter a hex color as #RRGGBB.' : 'Choose a valid time within the allowed range and step.');
        (invalid || controls[0]).focus();
        return;
      }
      choose(candidate.value);
    });
    panel.replaceChildren(form);
    calendarPopover.show(input, panel);
    form.querySelector('input').focus();
  }

  document.addEventListener('click', (event) => {
    if (event.target.matches('input[type="time"], input[type="color"]')) {
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
    if (event.target.matches('input[type="time"], input[type="color"]')
      && ['Enter', ' ', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
      open(event.target);
    } else if (input && event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close(true);
    } else if (input && event.key === 'Tab' && panel.contains(event.target)) {
      const controls = [...panel.querySelectorAll('input, button:not(:disabled)')];
      const index = controls.indexOf(document.activeElement);
      event.preventDefault();
      controls[(index + (event.shiftKey ? -1 : 1) + controls.length) % controls.length].focus();
    }
  }, true);
  document.addEventListener('languagechange', () => close());
})();
