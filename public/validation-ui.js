const calendarValidation = (() => {
  let nextId = 0;

  function clear(root) {
    root.querySelectorAll('[data-validation-message]').forEach((message) => {
      const control = document.getElementById(message.dataset.validationControl);
      if (control) {
        const descriptions = (control.getAttribute('aria-describedby') || '').split(/\s+/).filter((id) => id && id !== message.id);
        if (descriptions.length) control.setAttribute('aria-describedby', descriptions.join(' '));
        else control.removeAttribute('aria-describedby');
        control.removeAttribute('aria-invalid');
      }
      message.remove();
    });
    root.classList.remove('validation-active');
  }

  function show(root, issues) {
    clear(root);
    const unique = new Map();
    for (const issue of issues) if (issue.control && !unique.has(issue.control)) unique.set(issue.control, issue);
    root.classList.toggle('validation-active', unique.size > 0);
    for (const { control, message, variables } of unique.values()) {
      control.id ||= `validation-control-${++nextId}`;
      const error = document.createElement('span');
      error.id = `validation-message-${++nextId}`;
      error.className = 'field-error';
      error.setAttribute('aria-hidden', 'true');
      error.dataset.validationMessage = '';
      error.dataset.validationControl = control.id;
      error.textContent = t(message, variables);
      control.setAttribute('aria-invalid', 'true');
      const descriptions = (control.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
      control.setAttribute('aria-describedby', [...descriptions, error.id].join(' '));
      (control.closest('label') || control.parentElement).append(error);
    }
    return [...unique.values()];
  }

  function focus(control) {
    if (!control) return;
    for (let parent = control.parentElement; parent; parent = parent.parentElement) {
      if (parent.tagName === 'DETAILS') parent.open = true;
    }
    const target = control.matches('fieldset')
      ? control.querySelector('input:not(:disabled), select:not(:disabled), button:not(:disabled)') || control
      : control;
    if (!target.matches('input, select, textarea, button, [tabindex]')) target.tabIndex = -1;
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }

  function nativeIssues(root) {
    return [...root.querySelectorAll('input, select, textarea')].filter((control) => control.willValidate && !control.validity.valid)
      .map((control) => ({
        control,
        message: control.validity.valueMissing ? 'This field is required.'
          : control.type === 'number' && control.min && control.max ? 'Enter a number from {min} to {max} in steps of {step}.'
            : control.type === 'date' && control.validity.rangeUnderflow ? 'Choose a date on or after {min}.'
              : control.type === 'date' ? 'Choose a valid date.' : 'Enter a valid value.',
        variables: { min: control.min, max: control.max, step: control.step || '1' }
      }));
  }

  return { clear, show, focus, nativeIssues };
})();
