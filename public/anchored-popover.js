const calendarPopover = (() => {
  const openPanels = new Map();

  function position(anchor, panel) {
    const rect = anchor.getBoundingClientRect();
    const viewport = window.visualViewport;
    const leftEdge = (viewport?.offsetLeft || 0) + 8;
    const topEdge = (viewport?.offsetTop || 0) + 8;
    const rightEdge = leftEdge + (viewport?.width || window.innerWidth) - 16;
    const bottomEdge = topEdge + (viewport?.height || window.innerHeight) - 16;
    const isPicker = panel.classList.contains('date-picker') || panel.classList.contains('input-picker');
    const width = Math.min(isPicker ? 336 : rect.width, rightEdge - leftEdge);
    panel.style.width = `${width}px`;
    panel.style.maxHeight = '';
    const height = Math.min(panel.scrollHeight + 2, parseFloat(getComputedStyle(panel).maxHeight) || Infinity);
    const below = bottomEdge - rect.bottom - 6;
    const above = rect.top - topEdge - 6;
    const useAbove = below < height && above > below;
    const available = Math.max(0, useAbove ? above : below);
    panel.style.maxHeight = `${Math.min(height, available)}px`;
    panel.style.left = `${Math.max(leftEdge, Math.min(rect.left, rightEdge - width))}px`;
    panel.style.top = `${useAbove ? Math.max(topEdge, rect.top - Math.min(height, available) - 6) : Math.max(topEdge, rect.bottom + 6)}px`;
  }

  function hide(panel) {
    if (typeof panel.hidePopover === 'function' && panel.matches(':popover-open')) panel.hidePopover();
    panel.hidden = true;
    openPanels.delete(panel);
  }

  function show(anchor, panel) {
    panel.classList.add('anchored-popover');
    panel.hidden = false;
    if (typeof panel.showPopover === 'function') {
      panel.setAttribute('popover', 'manual');
      if (!panel.matches(':popover-open')) panel.showPopover();
    }
    openPanels.set(panel, anchor);
    position(anchor, panel);
  }

  function reposition(event) {
    for (const [panel, anchor] of openPanels) {
      if (!anchor.isConnected || !anchor.getClientRects().length) hide(panel);
      else if (!(event.target instanceof Node) || !panel.contains(event.target)) position(anchor, panel);
    }
  }

  document.addEventListener('scroll', reposition, true);
  document.addEventListener('animationend', reposition, true);
  document.addEventListener('transitionend', reposition, true);
  window.addEventListener('resize', reposition);
  window.visualViewport?.addEventListener('resize', reposition);
  window.visualViewport?.addEventListener('scroll', reposition);
  return { show, hide };
})();
