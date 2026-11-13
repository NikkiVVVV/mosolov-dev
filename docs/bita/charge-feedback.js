const clamp = value => Math.max(0, Math.min(1, value));
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgb = color => `rgb(${color.join(' ')})`;

// A small, local canvas: no full-screen buffer or extra animation loop.
export function createChargeFeedback(button) {
  const canvas = document.createElement('canvas');
  canvas.className = 'charge-fx';
  canvas.setAttribute('aria-hidden', 'true');
  button.append(canvas);
  const context = canvas.getContext('2d');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const pad = 80, embers = [], maxEmbers = 64;
  let width = 144, height = 56, ratio = 1, power = 0, emission = 0, dirty = false;

  function resize() {
    width = button.clientWidth;
    height = button.clientHeight;
    ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.ceil((width + pad * 2) * ratio);
    canvas.height = Math.ceil((height + pad * 2) * ratio);
    canvas.style.width = `${width + pad * 2}px`;
    canvas.style.height = `${height + pad * 2}px`;
    dirty = true;
  }
  const observer = new ResizeObserver(resize);
  observer.observe(button);
  resize();

  function setPower(value) {
    power = clamp(value);
    const heat = clamp((power - .035) / .965);
    const dark = document.documentElement.dataset.theme === 'dark';
    const neutralTop = dark ? [70, 72, 73] : [250, 250, 248];
    const neutralBottom = dark ? [43, 45, 46] : [229, 231, 227];
    const top = mix(neutralTop, [226, 51, 45], Math.pow(heat, .8));
    const bottom = mix(neutralBottom, [150, 19, 28], Math.pow(heat, .9));
    const ink = dark ? [255, 255, 255] : power >= .77 ? [255, 255, 255] :
      mix([67, 71, 65], [0, 0, 0], clamp(heat * 2));
    button.style.setProperty('--charge', power.toFixed(4));
    button.style.setProperty('--heat', heat.toFixed(4));
    button.style.setProperty('--heat-glow', (Math.pow(heat, 3) * .3).toFixed(4));
    button.style.setProperty('--charge-top', rgb(top));
    button.style.setProperty('--charge-bottom', rgb(bottom));
    button.style.setProperty('--charge-ink', rgb(ink));
    button.dataset.level = power >= .8 ? 'edge' : power >= .45 ? 'strong' : power > 0 ? 'building' : 'idle';
    if (power === 0) emission = 0;
  }

  function emit(energy) {
    if (embers.length >= maxEmbers) return;
    const side = Math.random(), along = Math.random();
    let x, y, nx, ny;
    if (side < .58) { x = pad + 10 + along * (width - 20); y = pad + 1; nx = (along - .5) * .7; ny = -1; }
    else if (side < .79) { x = pad + 1; y = pad + 8 + along * (height - 16); nx = -1; ny = (along - .6) * .8; }
    else { x = pad + width - 1; y = pad + 8 + along * (height - 16); nx = 1; ny = (along - .6) * .8; }
    const speed = 24 + energy * (45 + Math.random() * 100);
    embers.push({ x, y, vx: nx * speed, vy: ny * speed, age: 0,
      life: .18 + Math.random() * .3, size: .65 + Math.random() * 1.2,
      warm: Math.random() > .5, bright: Math.random() > .8 });
  }

  function update(now, delta) {
    const dt = Math.min(delta, .05);
    if (reducedMotion.matches) {
      if (dirty) context.clearRect(0, 0, canvas.width, canvas.height);
      embers.length = 0; dirty = false; return;
    }
    if (!power && !embers.length && !dirty) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width + pad * 2, height + pad * 2);
    dirty = power > 0 || embers.length > 0;
    const t = now / 1000;

    // Light lives inside the material; the text remains above this canvas.
    if (power > .08) {
      context.save();
      context.beginPath();
      context.roundRect(pad + 1, pad + 1, width - 2, height - 2, 15);
      context.clip();
      const strength = Math.pow(power, 1.6);
      const flow = t * (.7 + power * 2.6);
      for (let i = 0; i < 3; i++) {
        const x = pad + width * (.5 + Math.sin(flow + i * 2.1) * .4);
        const y = pad + height * (.62 + Math.cos(flow * .8 + i) * .24);
        const light = context.createRadialGradient(x, y, 0, x, y, width * .45);
        light.addColorStop(0, `rgba(255, 206, 106, ${strength * .24})`);
        light.addColorStop(1, 'rgba(255, 112, 48, 0)');
        context.fillStyle = light;
        context.fillRect(pad, pad, width, height);
      }
      const amount = Math.floor(3 + power * power * 45);
      for (let i = 0; i < amount; i++) {
        const seed = i * 2.399963, speed = .35 + (i % 7) * .065 + power * .9;
        const age = ((t * speed + i * .618034) % 1);
        const x = pad + ((i * 37.31 + t * (9 + power * 30)) % width) + Math.sin(age * 5 + seed) * 5;
        const y = pad + height + 5 - age * (height + 12);
        const alpha = Math.sin(age * Math.PI) * strength * (i % 3 ? .72 : .95);
        context.strokeStyle = i % 4 ? `rgba(255, 210, 128, ${alpha})` : `rgba(255, 249, 223, ${alpha})`;
        context.lineWidth = i % 5 ? 1 : 1.6;
        context.lineCap = 'round';
        context.beginPath(); context.moveTo(x, y);
        context.lineTo(x - 1.3, y + 1.5 + power * (i % 4 + 1)); context.stroke();
      }
      // Fast, narrow currents become visible only at higher charge.
      if (power > .5) {
        for (let i = 0; i < 2; i++) {
          const y = pad + height * (.35 + i * .3);
          context.strokeStyle = `rgba(255, 202, 119, ${(power - .5) * .32})`;
          context.lineWidth = 1;
          context.beginPath(); context.moveTo(pad - 10, y);
          context.bezierCurveTo(pad + width * .35, y + Math.sin(flow * 3 + i) * 16,
            pad + width * .7, y - Math.sin(flow * 2 + i) * 15, pad + width + 10, y - 4);
          context.stroke();
        }
      }
      context.restore();
    }

    // Emission grows sharply near the limit, always from the button's edges.
    const energy = clamp((power - .57) / .43);
    emission += dt * 100 * energy * energy;
    while (emission >= 1) { emit(energy); emission--; }
    for (let i = embers.length - 1; i >= 0; i--) {
      const ember = embers[i]; ember.age += dt;
      if (ember.age >= ember.life) { embers.splice(i, 1); continue; }
      ember.x += ember.vx * dt; ember.y += ember.vy * dt;
      ember.vy -= dt * 26;
      const fade = Math.pow(1 - ember.age / ember.life, 1.5);
      context.strokeStyle = ember.bright ? `rgba(255, 232, 173, ${fade})` :
        ember.warm ? `rgba(224, 71, 35, ${fade * .9})` : `rgba(246, 140, 60, ${fade})`;
      context.lineWidth = ember.size;
      context.lineCap = 'round';
      context.beginPath(); context.moveTo(ember.x, ember.y);
      context.lineTo(ember.x - ember.vx * .045, ember.y - ember.vy * .045); context.stroke();
    }
  }

  return { setPower, update, destroy() { observer.disconnect(); canvas.remove(); } };
}
