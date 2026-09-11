(() => {
  const canvas = document.getElementById('backgroundArtwork');
  const context = canvas.getContext('2d');
  const picker = document.getElementById('artworkPattern');
  const controls = document.getElementById('artworkControls');
  const variation = document.getElementById('artworkVariation');
  const storageKey = 'calendar-ics-artwork';
  const patterns = ['flow', 'contours', 'branches', 'waves', 'floral', 'leaves', 'clouds', 'mountains', 'trees', 'birds', 'aqualife', 'none'];
  let material = 'glass';
  let palette = [];
  let settings = { pattern: 'flow', seed: 137 };
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (patterns.includes(saved?.pattern) && Number.isInteger(saved.seed) && saved.seed >= 0 && saved.seed <= 0xffffffff) settings = saved;
  } catch {}
  picker.value = settings.pattern;
  let frame = 0;

  function randomFor(column, row) {
    let state = (settings.seed ^ Math.imul(column, 374761393) ^ Math.imul(row, 668265263)) >>> 0;
    return () => {
      state = (state + 0x6d2b79f5) >>> 0;
      let value = Math.imul(state ^ (state >>> 15), state | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function stroke(points, width, watercolor, random) {
    if (points.length < 2) return;
    const first = points[0];
    const last = points[points.length - 1];
    const closed = points.length > 3 && Math.hypot(first[0] - last[0], first[1] - last[1]) < 2;
    const pigment = context.strokeStyle;
    context.save();
    context.beginPath();
    points.forEach((point, index) => {
      if (index === 0) context.moveTo(...point);
      else context.lineTo(...point);
    });
    if (closed) {
      context.closePath();
      const horizontalValues = points.map(point => point[0]);
      const verticalValues = points.map(point => point[1]);
      const left = Math.min(...horizontalValues);
      const top = Math.min(...verticalValues);
      const right = Math.max(...horizontalValues);
      const bottom = Math.max(...verticalValues);
      const wash = context.createLinearGradient(left, top, right + 1, bottom + 1);
      wash.addColorStop(0, pigment);
      wash.addColorStop(0.65, pigment);
      wash.addColorStop(1, '#f4efe2');
      context.fillStyle = wash;
      context.globalAlpha = watercolor ? 0.38 : 0.3;
      context.fill();
      context.save();
      context.clip();
      context.fillStyle = '#fffdf4';
      context.globalAlpha = 0.2;
      const grains = Math.min(160, Math.ceil((right - left) * (bottom - top) / 140));
      for (let grain = 0; grain < grains; grain += 1) {
        const size = 0.4 + random() * 1.1;
        context.fillRect(left + random() * (right - left), top + random() * (bottom - top), size, size * 0.6);
      }
      context.restore();
    } else {
      context.strokeStyle = pigment;
      context.globalAlpha = 0.22;
      context.lineWidth = Math.max(2, width * 0.6);
      context.stroke();
    }
    context.strokeStyle = '#294b5c';
    context.globalAlpha = watercolor ? 0.26 : 0.3;
    context.lineWidth = 0.45 + Math.min(width, 18) * 0.035;
    context.stroke();
    context.strokeStyle = '#f7faf7';
    context.globalAlpha = 0.42;
    context.lineWidth = 0.65;
    context.beginPath();
    for (let index = 1; index < points.length - 1; index += 3) {
      const point = points[index];
      const next = points[index + 1];
      if (random() > 0.3) {
        context.moveTo(point[0] + 1.4, point[1] + 1.4);
        context.lineTo(next[0] + 1.4, next[1] + 1.4);
      }
    }
    context.stroke();
    context.restore();
  }

  function flow(column, row, watercolor, phase) {
    const random = randomFor(column, row);
    let horizontal = column * 240 + random() * 240;
    let vertical = row * 240 + random() * 240;
    const points = [[horizontal, vertical]];
    for (let step = 0; step < 100; step += 1) {
      const angle = Math.sin(horizontal / 390 + phase) * 1.15
        + Math.cos(vertical / 470 - phase) * 0.9 + 0.45;
      horizontal += Math.cos(angle) * 5;
      vertical += Math.sin(angle) * 5;
      points.push([horizontal, vertical]);
    }
    stroke(points, 14 + random() * 24, watercolor, random);
    if (material === 'sketch') {
      const offset = 3 + random() * 5;
      stroke(points.map(([horizontal, vertical]) => [horizontal + offset, vertical - offset]), 1, false, random);
    }
  }

  function contours(row, width, watercolor, phase) {
    const random = randomFor(59, row);
    const points = [];
    const baseline = row * 48;
    for (let horizontal = -20; horizontal <= width + 20; horizontal += 6) {
      const vertical = baseline + Math.sin(horizontal / 245 + phase + baseline / 810) * 82
        + Math.sin(horizontal / 113 - baseline / 460 + phase) * 29;
      points.push([horizontal, vertical]);
    }
    stroke(points, 9 + random() * 13, watercolor, random);
  }

  function branches(column, row, watercolor) {
    const random = randomFor(column, row);
    const origin = [column * 300 + 60 + random() * 180, row * 300 + 60 + random() * 180];
    function grow(horizontal, vertical, angle, length, depth) {
      const bend = (random() - 0.5) * 0.8;
      const points = [[horizontal, vertical]];
      for (let step = 1; step <= 16; step += 1) {
        const direction = angle + bend * step / 16;
        horizontal += Math.cos(direction) * length / 16;
        vertical += Math.sin(direction) * length / 16;
        points.push([horizontal, vertical]);
      }
      stroke(points, depth * 3 + 3, watercolor, random);
      if (depth <= 0) return;
      grow(horizontal, vertical, angle + bend - 0.3 - random() * 0.5, length * (0.58 + random() * 0.14), depth - 1);
      grow(horizontal, vertical, angle + bend + 0.3 + random() * 0.5, length * (0.58 + random() * 0.14), depth - 1);
    }
    grow(origin[0], origin[1], random() * Math.PI * 2, 140 + random() * 70, 3);
  }

  function waves(column, row, watercolor, phase) {
    {
      const random = randomFor(column, row);
      const horizontal = column * 350 + Math.sin(row + phase) * 85 + (random() - 0.5) * 130;
      const vertical = row * 270 + random() * 110;
      const scaleX = 0.8 + random() * 0.65;
      const scaleY = 0.65 + random() * 0.65;
      const tilt = (random() - 0.5) * 0.22;
      const transform = point => [horizontal + point[0] * scaleX,
        vertical + point[1] * scaleY + point[0] * tilt];
      const curve = (points, controlFirst, controlSecond, end) => {
        const start = points[points.length - 1];
        for (let step = 1; step <= 24; step += 1) {
          const fraction = step / 24;
          const remainder = 1 - fraction;
          points.push([0, 1].map(axis => remainder ** 3 * start[axis]
            + 3 * remainder ** 2 * fraction * controlFirst[axis]
            + 3 * remainder * fraction ** 2 * controlSecond[axis] + fraction ** 3 * end[axis]));
        }
      };
      const wave = [[-160, 105]];
      curve(wave, [-75, 92], [-48, -105], [48, -92]);
      curve(wave, [119, -83], [115, -12], [65, -16]);
      curve(wave, [30, -19], [32, -51], [58, -47]);
      curve(wave, [38, -72], [9, -37], [40, -7]);
      curve(wave, [87, 35], [122, 106], [192, 111]);
      curve(wave, [80, 143], [-60, 144], [-160, 105]);
      stroke(wave.map(transform), 18, watercolor, random);
      for (let ribbon = 0; ribbon < 5; ribbon += 1) {
        const points = [[-142 + ribbon * 15, 94]];
        curve(points, [-75 + ribbon * 9, 60], [-29 + ribbon * 5, -77], [34 + ribbon * 5, -77 + ribbon * 5]);
        stroke(points.map(transform), 4, watercolor, random);
      }
      for (let foam = 0; foam < 9; foam += 1) {
        const angle = -Math.PI * 0.85 + foam * Math.PI / 11;
        const origin = [48 + Math.cos(angle) * 52, -42 + Math.sin(angle) * 52];
        const points = [origin];
        curve(points, [origin[0] + 8, origin[1] - 22], [origin[0] + 25, origin[1] - 12], [origin[0] + 15, origin[1] - 5]);
        stroke(points.map(transform), 6, watercolor, random);
        const drop = transform([origin[0] + 8 + random() * 15, origin[1] - 25 - random() * 18]);
        stroke(ellipse(drop[0], drop[1], 2, 3), 3, watercolor, random);
      }
    }
  }

  function botanical(column, row, watercolor) {
    const random = randomFor(column, row);
    const origin = [column * 300 + random() * 240, row * 300 + random() * 240];
    const angle = random() * Math.PI * 2;
    const length = 160 + random() * 100;
    const bend = (random() - 0.5) * 90;
    const leafCount = 3 + Math.floor(random() * 5);
    const leafWidth = 0.1 + random() * 0.26;
    const transform = (across, along) => [origin[0] + across * Math.cos(angle) - along * Math.sin(angle),
      origin[1] + across * Math.sin(angle) + along * Math.cos(angle)];
    const stem = [];
    for (let step = 0; step <= 40; step += 1) {
      const fraction = step / 40;
      stem.push(transform(Math.sin(fraction * Math.PI) * bend, fraction * length));
    }
    stroke(stem, 6, watercolor, random);
    for (let leaf = 1; leaf <= leafCount; leaf += 1) {
      const fraction = leaf / (leafCount + 2);
      const base = Math.sin(fraction * Math.PI) * bend;
      const side = leaf % 2 ? 1 : -1;
      const reach = 35 + random() * 35;
      const outline = [];
      for (let step = 0; step <= 40; step += 1) {
        const progress = step <= 20 ? step / 20 : (40 - step) / 20;
        const edge = step <= 20 ? 1 : -1;
        outline.push(transform(base + side * (progress * reach + edge * Math.sin(progress * Math.PI) * reach * leafWidth),
          fraction * length + progress * reach * 0.65 - edge * Math.sin(progress * Math.PI) * reach * leafWidth * 0.8));
      }
      stroke(outline, 9, watercolor, random);
      stroke([transform(base, fraction * length), transform(base + side * reach, fraction * length + reach * 0.65)], 3, watercolor, random);
      if (material === 'sketch') {
        for (let vein = 1; vein <= 5; vein += 1) {
          const progress = vein / 7;
          const spread = Math.sin(progress * Math.PI) * reach * 0.17;
          stroke([transform(base + side * progress * reach, fraction * length + progress * reach * 0.65),
            transform(base + side * (progress * reach + spread), fraction * length + progress * reach * 0.65 - spread)], 1, false, random);
        }
      }
    }
  }

  function ellipse(horizontal, vertical, radiusX, radiusY) {
    return Array.from({ length: 49 }, (_, index) => {
      const angle = index * Math.PI / 24;
      return [horizontal + Math.cos(angle) * radiusX, vertical + Math.sin(angle) * radiusY];
    });
  }

  function blossoms(column, row, watercolor) {
    const random = randomFor(column, row);
    const horizontal = column * 300 + 50 + random() * 200;
    const vertical = row * 300 + 50 + random() * 200;
    const radius = 45 + random() * 45;
    const petals = 5 + Math.floor(random() * 9);
    const layers = 1 + Math.floor(random() * 3);
    const petalWidth = 0.14 + random() * 0.38;
    const rotation = random() * Math.PI * 2;
    for (let layer = 0; layer < layers; layer += 1) {
      for (let petal = 0; petal < petals; petal += 1) {
        const direction = rotation + (petal + layer * 0.5) * Math.PI * 2 / petals;
        const reach = radius * (1 - layer * 0.23) * (0.85 + random() * 0.3);
        const points = [];
        for (let step = 0; step <= 40; step += 1) {
          const angle = step * Math.PI / 20;
          const along = 9 + (1 - Math.cos(angle)) * reach * 0.5;
          const across = Math.sin(angle) * reach * petalWidth;
          points.push([horizontal + Math.cos(direction) * along - Math.sin(direction) * across,
            vertical + Math.sin(direction) * along + Math.cos(direction) * across]);
        }
        stroke(points, 14, watercolor, random);
      }
    }
    context.strokeStyle = '#c89c43';
    stroke(ellipse(horizontal, vertical, 10, 10), 9, watercolor, random);
    for (let dot = 0; dot < 7; dot += 1) {
      const direction = dot * Math.PI * 2 / 7;
      stroke(ellipse(horizontal + Math.cos(direction) * 6, vertical + Math.sin(direction) * 6, 1.2, 1.2), 3, watercolor, random);
    }
  }

  function clouds(column, row, watercolor) {
    const random = randomFor(column, row);
    const horizontal = column * 300 + 40 + random() * 180;
    const vertical = row * 300 + 40 + random() * 160;
    const width = 100 + random() * 65;
    const height = 35 + random() * 30;
    const lobes = 4 + Math.floor(random() * 5);
    const drift = random() * Math.PI * 2;
    const points = [];
    for (let step = 0; step <= 96; step += 1) {
      const angle = step * Math.PI / 48;
      const scallop = 1 + 0.13 * Math.sin(angle * lobes + drift) + 0.06 * Math.cos(angle * (lobes + 3));
      points.push([horizontal + Math.cos(angle) * width * scallop,
        vertical + Math.sin(angle) * height * scallop * (Math.sin(angle) > 0 ? 0.35 : 1)]);
    }
    stroke(points, 20, watercolor, random);
    stroke([[horizontal - width * 0.7, vertical + 22], [horizontal - width * 0.1, vertical + 25], [horizontal + width * 0.55, vertical + 22]], 10, watercolor, random);
  }

  function mountains(row, width, watercolor) {
    const random = randomFor(97, row);
    const ridge = [];
    let horizontal = -200;
    const baseline = window.innerHeight * (0.25 + row * 0.24);
    while (horizontal < width + 300) {
      const span = 120 + random() * 280;
      ridge.push([horizontal, baseline + random() * 80]);
      ridge.push([horizontal + span * (0.3 + random() * 0.4), baseline - 60 - random() * 180]);
      horizontal += span;
    }
    context.strokeStyle = palette[(row + 1) % palette.length];
    stroke([...ridge, [width + 300, window.innerHeight + 100], [-200, window.innerHeight + 100], ridge[0]], 14, watercolor, random);
    for (let peak = 1; peak < ridge.length - 1; peak += 2) {
      const summit = ridge[peak];
      const valley = ridge[peak + 1];
      const previous = ridge[peak - 1];
      const snowLeft = [summit[0] + (previous[0] - summit[0]) * 0.3, summit[1] + (previous[1] - summit[1]) * 0.3];
      const snowRight = [summit[0] + (valley[0] - summit[0]) * 0.3, summit[1] + (valley[1] - summit[1]) * 0.3];
      context.save();
      context.strokeStyle = '#ffffff';
      stroke([summit, snowLeft, [summit[0] - 6, snowLeft[1] - 9], [summit[0] + 4, snowRight[1] + 5], snowRight, summit], 5, watercolor, random);
      context.restore();
      stroke([summit, [summit[0] + 13, summit[1] + 58], [summit[0] - 2, summit[1] + 95], valley], 9, watercolor, random);
      for (let hatch = 1; hatch <= 5; hatch += 1) {
        const fraction = hatch / 7;
        const horizontal = summit[0] + (valley[0] - summit[0]) * fraction;
        const vertical = summit[1] + (valley[1] - summit[1]) * fraction;
        stroke([[horizontal, vertical + 4], [horizontal - 15 - fraction * 16, vertical + 27]], 5, watercolor, random);
      }
    }
  }

  function trees(column, row, watercolor) {
    const random = randomFor(column, row);
    const horizontal = column * 300 + 60 + random() * 180;
    const vertical = row * 300 + 30 + random() * 120;
    const height = 150 + random() * 100;
    stroke([[horizontal, vertical - 10], [horizontal - 3, vertical + height], [horizontal + 6, vertical + height + 22]], 10, watercolor, random);
    for (let tier = 0; tier < 7; tier += 1) {
      const top = vertical + tier * height / 9;
      const reach = 18 + tier * 8 + random() * 12;
      const outline = [[horizontal, top - 20], [horizontal - reach * 0.4, top + 5],
        [horizontal - reach * 0.28, top + 3], [horizontal - reach, top + 35],
        [horizontal - reach * 0.45, top + 30], [horizontal, top + 38],
        [horizontal + reach * 0.6, top + 32], [horizontal + reach, top + 34],
        [horizontal + reach * 0.3, top + 2], [horizontal + reach * 0.4, top + 5], [horizontal, top - 20]];
      stroke(outline, 12, watercolor, random);
    }
    stroke([[horizontal - 55, vertical + height + 24], [horizontal, vertical + height + 19], [horizontal + 70, vertical + height + 25]], 6, watercolor, random);
  }

  function birds(column, row, watercolor) {
    const random = randomFor(column, row);
    for (let bird = 0; bird < 3; bird += 1) {
      const horizontal = column * 300 + random() * 260;
      const vertical = row * 300 + random() * 240;
      const size = 22 + random() * 28;
      const rotation = (random() - 0.5) * 0.8;
      const transform = (across, along) => [horizontal + (across * Math.cos(rotation) - along * Math.sin(rotation)) * size,
        vertical + (across * Math.sin(rotation) + along * Math.cos(rotation)) * size];
      for (const side of [-1, 1]) {
        const wing = [];
        for (let step = 0; step <= 24; step += 1) {
          const fraction = step / 24;
          wing.push(transform(side * fraction * 1.6, -Math.sin(fraction * Math.PI * 0.8) * 0.85));
        }
        wing.push(transform(side * 0.75, -0.15), transform(side * 0.12, 0.18), transform(0, 0));
        stroke(wing, 10, watercolor, random);
      }
      stroke([transform(0, -0.15), transform(0.12, 0.2), transform(0.28, 0.65), transform(0, 0.46), transform(-0.28, 0.65), transform(-0.12, 0.2)], 7, watercolor, random);
    }
  }

  function aqualife(column, row, watercolor) {
    const random = randomFor(column, row);
    const horizontal = column * 300 + 60 + random() * 180;
    const vertical = row * 300 + 60 + random() * 180;
    const size = 35 + random() * 25;
    if (random() < 0.55) {
      const direction = random() < 0.5 ? -1 : 1;
      const transform = (across, along) => [horizontal + across * size * direction, vertical + along * size];
      const body = [];
      for (let step = 0; step <= 48; step += 1) {
        const angle = step * Math.PI / 24;
        body.push(transform(Math.cos(angle), Math.sin(angle) * 0.52));
      }
      stroke(body, 12, watercolor, random);
      stroke([transform(-0.9, 0), transform(-1.65, -0.6), transform(-1.5, 0), transform(-1.65, 0.6), transform(-0.9, 0)], 10, watercolor, random);
      stroke([transform(-0.4, -0.48), transform(0, -0.95), transform(0.35, -0.5)], 7, watercolor, random);
      stroke([transform(0.35, -0.4), transform(0.2, 0), transform(0.35, 0.4)], 5, watercolor, random);
      stroke(ellipse(horizontal + direction * size * 0.65, vertical - size * 0.1, 2.5, 2.5), 5, watercolor, random);
    } else {
      const bell = [];
      for (let step = 0; step <= 32; step += 1) {
        const angle = Math.PI + step * Math.PI / 32;
        bell.push([horizontal + Math.cos(angle) * size, vertical + Math.sin(angle) * size * 0.85]);
      }
      bell.push([horizontal + size * 0.4, vertical + 8], [horizontal, vertical], [horizontal - size * 0.4, vertical + 8], bell[0]);
      stroke(bell, 14, watercolor, random);
      for (let tentacle = 0; tentacle < 5; tentacle += 1) {
        const points = [];
        const length = 65 + random() * 65;
        for (let step = 0; step <= 30; step += 1) points.push([horizontal + (tentacle - 2) * size * 0.3 + Math.sin(step / 5 + tentacle) * 9, vertical + step * length / 30]);
        stroke(points, 6, watercolor, random);
      }
    }
    for (let bubble = 0; bubble < 3; bubble += 1) {
      const radius = 3 + random() * 6;
      stroke(ellipse(horizontal + size + 15 + random() * 20, vertical - 45 - bubble * 25, radius, radius), 4, watercolor, random);
    }
  }

  function scatter(width, height, watercolor, phase) {
    const generators = { flow, waves, branches, floral: blossoms, leaves: botanical, clouds, trees, birds, aqualife };
    const generator = generators[settings.pattern];
    const random = randomFor(701, 29);
    const placements = [];
    const count = Math.max(6, Math.min(28, Math.round(width * height / 70000)));
    for (let index = 0; index < count; index += 1) {
      const scale = index % 5 === 0 ? 1.45 + random() * 0.7 : 0.5 + random() * 0.8;
      let best;
      let bestDistance = -1;
      for (let attempt = 0; attempt < 16; attempt += 1) {
        const candidate = { horizontal: random() * (width + 100) - 50, vertical: random() * (height + 100) - 50, scale };
        const distance = placements.reduce((nearest, placed) => Math.min(nearest,
          Math.hypot(candidate.horizontal - placed.horizontal, candidate.vertical - placed.vertical) / (scale + placed.scale)), Infinity);
        if (distance > bestDistance) {
          best = candidate;
          bestDistance = distance;
        }
      }
      placements.push(best);
      const upright = ['trees', 'birds', 'clouds', 'aqualife'].includes(settings.pattern);
      const rotation = (random() - 0.5) * (upright ? 0.35 : 1.6);
      const spacing = settings.pattern === 'flow' ? 240 : settings.pattern === 'waves' ? 350 : 300;
      context.save();
      context.strokeStyle = palette[index % palette.length];
      context.translate(best.horizontal, best.vertical);
      context.rotate(rotation);
      context.scale(scale, scale * (0.8 + random() * 0.4));
      context.translate(-index * spacing - (settings.pattern === 'waves' ? 0 : 150), settings.pattern === 'waves' ? -30 : -150);
      generator(index, 0, watercolor, phase);
      context.restore();
    }
  }

  function draw() {
    frame = 0;
    const style = document.documentElement.dataset.interfaceStyle;
    const visible = ['glass', 'watercolor', 'sketch'].includes(style);
    material = style;
    controls.hidden = !visible;
    variation.disabled = settings.pattern === 'none';
    canvas.hidden = !visible || settings.pattern === 'none' || !context;
    if (canvas.hidden) return;
    const width = document.documentElement.clientWidth;
    const height = window.innerHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const pixelWidth = Math.round(width * ratio);
    const pixelHeight = Math.round(height * ratio);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    palette = [context.strokeStyle, '#397f95', '#cb765f', '#72916c', '#ba9441', '#607691'];
    const watercolor = style === 'watercolor';
    const phase = (settings.seed % 10000) / 1591;
    const margin = 650;
    const top = -margin;
    const bottom = height + margin;
    if (settings.pattern === 'contours') {
      for (let row = Math.floor(top / 48); row <= Math.ceil(bottom / 48); row += 1) {
        context.strokeStyle = palette[Math.abs(Math.floor(row / 4)) % palette.length];
        contours(row, width, watercolor, phase);
      }
    } else if (settings.pattern === 'mountains') {
      for (let layer = 0; layer < 4; layer += 1) mountains(layer, width, watercolor);
    } else {
      scatter(width, height, watercolor, phase);
    }
  }

  function scheduleDraw() {
    if (!frame) frame = requestAnimationFrame(draw);
  }

  function persist() {
    try { localStorage.setItem(storageKey, JSON.stringify(settings)); } catch {}
    scheduleDraw();
  }

  picker.addEventListener('change', () => {
    settings.pattern = patterns.includes(picker.value) ? picker.value : 'flow';
    persist();
  });
  variation.addEventListener('click', () => {
    settings.seed = (settings.seed + 2654435761) >>> 0;
    persist();
  });
  window.addEventListener('resize', scheduleDraw);
  new ResizeObserver(scheduleDraw).observe(document.documentElement);
  new MutationObserver(scheduleDraw).observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'data-interface-style'] });
  scheduleDraw();
})();