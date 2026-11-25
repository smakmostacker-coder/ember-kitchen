// input.js — keyboard and mouse for the chef. WASD or arrows walk the
// chef around the kitchen; clicking a station works it; E or Space works
// the station the chef is standing nearest; 1-6 grab a pantry item.

import { stationAt, pantrySpotAt } from './kitchen.js';
import { INGREDIENTS } from './state.js';

const PANTRY_KEYS = ['bread', 'patty', 'lettuce', 'tomato', 'cheese', 'onion'];

export function createInput(canvas, onInteract) {
  const keys = new Set();
  let mouse = { x: 0, y: 0 };

  function canvasPos(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    keys.add(key);
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
      event.preventDefault();
    }
    if (key >= '1' && key <= '6') {
      onInteract('pantry-key', PANTRY_KEYS[Number(key) - 1]);
    }
    if (key === 'e' || key === ' ') {
      onInteract('use-nearest', null);
    }
  });
  window.addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));
  canvas.addEventListener('mousemove', (event) => { mouse = canvasPos(event); });
  canvas.addEventListener('click', (event) => {
    const pos = canvasPos(event);
    onInteract('click', pos);
  });

  return {
    keys,
    get mouse() { return mouse; },
    // Where the chef is standing, if anywhere useful.
    nearestStation(chef) {
      let best = null;
      let bestDist = 130;
      for (const [name, r] of Object.entries({
        pantry: { x: 190, y: 210 }, chopping: { x: 190, y: 360 },
        stove: { x: 190, y: 525 }, plating: { x: 1070, y: 525 },
        serving: { x: 1070, y: 210 },
      })) {
        const d = Math.hypot(chef.x - r.x, chef.y - r.y);
        if (d < bestDist) { bestDist = d; best = name; }
      }
      return best;
    },
  };
}

export function moveChef(state, input, dt) {
  const k = input.keys;
  let dx = 0;
  let dy = 0;
  if (k.has('a') || k.has('arrowleft')) dx -= 1;
  if (k.has('d') || k.has('arrowright')) dx += 1;
  if (k.has('w') || k.has('arrowup')) dy -= 1;
  if (k.has('s') || k.has('arrowdown')) dy += 1;
  if (dx === 0 && dy === 0) { state.chef.moving = false; return; }
  const len = Math.hypot(dx, dy);
  const speed = state.chef.speed * (k.has('shift') ? 1.5 : 1);
  state.chef.x = Math.min(1240, Math.max(40, state.chef.x + (dx / len) * speed * dt));
  state.chef.y = Math.min(740, Math.max(150, state.chef.y + (dy / len) * speed * dt));
  state.chef.dir = dy < 0 ? 'up' : dy > 0 ? 'down' : dx < 0 ? 'left' : 'right';
  state.chef.moving = true;
}

export function pantryKeyLabel() {
  return PANTRY_KEYS.map((id, i) => `${i + 1}=${INGREDIENTS[id].name}`).join('  ');
}
