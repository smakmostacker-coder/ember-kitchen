// kitchen.js — draws the whole kitchen on one canvas and owns the
// workstations: pantry counters, chopping board, stove burners, plating
// board and the serving window. It also advances chopping and cooking.

import { INGREDIENTS, setMessage } from './state.js';

// Station rectangles, in canvas pixels (canvas is 1280 x 800).
export const STATIONS = {
  pantry: { x: 40, y: 150, w: 300, h: 120, label: 'PANTRY' },
  chopping: { x: 40, y: 300, w: 300, h: 120, label: 'CHOPPING BOARD' },
  stove: { x: 40, y: 450, w: 300, h: 150, label: 'STOVE' },
  plating: { x: 900, y: 450, w: 340, h: 150, label: 'PLATING' },
  serving: { x: 900, y: 150, w: 340, h: 120, label: 'SERVING WINDOW' },
  orders: { x: 380, y: 120, w: 480, h: 150, label: 'ORDER BOARD' },
};

const PANTRY_SPOTS = ['bread', 'patty', 'lettuce', 'tomato', 'cheese', 'onion'];
const CHOP_TIME = 1.6; // seconds of holding the knife
const COOK_TIME = 5; // seconds on a burner before a patty is done
const BURN_TIME = 11; // seconds before a cooked patty burns

export function stationAt(x, y) {
  for (const [name, r] of Object.entries(STATIONS)) {
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return name;
  }
  return null;
}

export function pantrySpotAt(x, y) {
  const r = STATIONS.pantry;
  if (x < r.x || x > r.x + r.w || y < r.y || y > r.y + r.h) return null;
  const col = Math.floor((x - r.x) / (r.w / 3));
  const row = Math.floor((y - r.y - 28) / ((r.h - 28) / 2));
  const idx = Math.min(5, row * 3 + col);
  return PANTRY_SPOTS[idx];
}

// Picking up from the pantry, chopping, grilling and plating all happen here.
export function interactAt(state, x, y, sfx) {
  const station = stationAt(x, y);
  if (!station) return;
  if (station === 'pantry') {
    const item = pantrySpotAt(x, y);
    if (!item) return;
    if (state.hand.length >= 2) { setMessage(state, 'Hands full! Plate or chop something first.'); return; }
    state.hand.push(item);
    sfx('pickup');
    return;
  }
  if (station === 'chopping') {
    const idx = state.hand.findIndex((item) => INGREDIENTS[item].chop);
    if (idx === -1) { setMessage(state, 'Bring lettuce, tomato or onion to chop.'); return; }
    const item = state.hand.splice(idx, 1)[0];
    state.chopping = { item, progress: 0 };
    sfx('chop');
    return;
  }
  if (station === 'stove') {
    const slot = state.stove.findIndex((b) => b === null);
    const idx = state.hand.findIndex((item) => INGREDIENTS[item].cook);
    if (idx === -1) { setMessage(state, 'Only patties go on the stove.'); return; }
    if (slot === -1) { setMessage(state, 'All burners are full!'); return; }
    const item = state.hand.splice(idx, 1)[0];
    state.stove[slot] = { item, progress: 0, burnt: false };
    state.sizzle = 1.2;
    sfx('sizzle');
    return;
  }
  if (station === 'plating') {
    if (state.hand.length === 0 && state.stove.every((b) => !b || !b.done)) {
      setMessage(state, 'Bring ingredients to the plate first.');
      return;
    }
    // Take a finished patty off a burner straight onto the plate.
    const done = state.stove.findIndex((b) => b && b.done && !b.burnt);
    if (done !== -1 && state.hand.length === 0) {
      state.stove[done] = null;
      state.plate.push('patty');
      sfx('plate');
      return;
    }
    const item = state.hand.shift();
    if (item) { state.plate.push(item); sfx('plate'); }
    return;
  }
  if (station === 'serving') {
    if (state.plate.length === 0) { setMessage(state, 'The plate is empty — nothing to serve.'); return; }
    // serveMatchingOrder is called by main.js; here we just flag the attempt.
    state.serveAttempt = true;
  }
}

export function updateKitchen(state, dt, sfx) {
  if (state.chopping) {
    state.chopping.progress += dt / CHOP_TIME;
    if (state.chopping.progress >= 1) {
      state.plate.push(state.chopping.item);
      setMessage(state, `${INGREDIENTS[state.chopping.item].name} chopped and plated.`);
      state.chopping = null;
      sfx('done');
    }
  }
  state.stove.forEach((burner) => {
    if (!burner) return;
    burner.progress += dt;
    if (!burner.done && burner.progress >= COOK_TIME) {
      burner.done = true;
      setMessage(state, 'Patty is cooked — grab it before it burns!');
      sfx('done');
    }
    if (burner.done && !burner.burnt && burner.progress >= BURN_TIME) {
      burner.burnt = true;
      setMessage(state, 'A patty burned on the stove!');
      sfx('burn');
    }
  });
  if (state.sizzle > 0) state.sizzle -= dt;
}

// ---------- drawing ----------

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawStation(ctx, r, title, accent) {
  ctx.fillStyle = '#3a2a1e';
  roundRect(ctx, r.x, r.y, r.w, r.h, 12);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(title, r.x + 14, r.y + 22);
}

export function drawIngredient(ctx, id, x, y, size, chopped) {
  const ing = INGREDIENTS[id];
  ctx.font = `${size}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ing.emoji, x, y);
  if (chopped) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('CHOPPED', x, y + size * 0.62);
  }
}

export function drawKitchen(ctx, state) {
  // Floor and walls.
  ctx.fillStyle = '#f7e8c9';
  ctx.fillRect(0, 0, 1280, 800);
  ctx.fillStyle = '#8a5a33';
  ctx.fillRect(0, 0, 1280, 96);
  ctx.fillStyle = '#fff3d6';
  ctx.font = 'bold 34px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('🔥 Ember Kitchen', 28, 58);
  ctx.font = '18px sans-serif';
  ctx.fillText('Day ' + state.day + '  •  Coins ' + state.coins + '  •  Score ' + state.score, 420, 56);
  const mins = Math.floor(state.dayTimeLeft / 60);
  const secs = Math.floor(state.dayTimeLeft % 60);
  const timeText = `${mins}:${secs.toString().padStart(2, '0')}`;
  ctx.fillStyle = state.dayTimeLeft < 20 ? '#ff4444' : '#fff3d6';
  ctx.font = 'bold 30px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('⏱ ' + timeText, 1252, 58);
  ctx.textAlign = 'left';

  // Rush bar under the header.
  ctx.fillStyle = '#d9c49a';
  ctx.fillRect(28, 100, 1224, 10);
  ctx.fillStyle = state.rush > 0.66 ? '#e05252' : '#e8a33d';
  ctx.fillRect(28, 100, 1224 * state.rush, 10);
  ctx.fillStyle = '#8a5a33';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(state.rush > 0.66 ? 'DINNER RUSH!' : state.rush > 0.33 ? 'Lunch crowd building…' : 'Quiet morning service', 28, 132 - 14 + 4);
  ctx.fillText('RUSH', 1180, 132 - 14 + 4);

  drawOrderBoard(ctx, state);
  drawPantry(ctx, state);
  drawChopping(ctx, state);
  drawStove(ctx, state);
  drawPlating(ctx, state);
  drawServing(ctx, state);
  drawChef(ctx, state);
  drawHand(ctx, state);

  if (state.message && state.messageTime > 0) {
    ctx.fillStyle = 'rgba(40,24,12,0.9)';
    roundRect(ctx, 340, 660, 600, 40, 10);
    ctx.fill();
    ctx.fillStyle = '#ffe9b0';
    ctx.font = 'bold 17px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.message, 640, 686);
    ctx.textAlign = 'left';
  }
}

function drawOrderBoard(ctx, state) {
  const r = STATIONS.orders;
  drawStation(ctx, r, 'ORDER BOARD', '#e8a33d');
  if (state.orders.length === 0) {
    ctx.fillStyle = '#cbb28a';
    ctx.font = 'italic 16px sans-serif';
    ctx.fillText('No orders yet — customers are on their way…', r.x + 16, r.y + 80);
    return;
  }
  state.orders.forEach((order, i) => {
    const y = r.y + 34 + i * 38;
    const frac = Math.max(0, order.patience / order.maxPatience);
    ctx.fillStyle = frac < 0.3 ? '#ff6b5e' : '#ffe9b0';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`#${order.id} ${order.recipe.name} — ${order.recipe.price}c`, r.x + 14, y);
    ctx.fillStyle = '#5a3d24';
    ctx.fillRect(r.x + 14, y + 8, 220, 8);
    ctx.fillStyle = frac < 0.3 ? '#ff4444' : '#7dc383';
    ctx.fillRect(r.x + 14, y + 8, 220 * frac, 8);
    ctx.fillStyle = '#cbb28a';
    ctx.font = '13px sans-serif';
    ctx.fillText(order.recipe.needs.map((n) => INGREDIENTS[n].emoji).join(' '), r.x + 250, y + 2);
    ctx.fillText(order.recipe.needs.join(' + '), r.x + 250, y + 18);
  });
}

function drawPantry(ctx, state) {
  const r = STATIONS.pantry;
  drawStation(ctx, r, 'PANTRY — click to grab', '#7dc383');
  PANTRY_SPOTS.forEach((id, i) => {
    const x = r.x + 52 + (i % 3) * 96;
    const y = r.y + 50 + Math.floor(i / 3) * 38;
    drawIngredient(ctx, id, x, y, 24, false);
    ctx.fillStyle = '#ffe9b0';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(INGREDIENTS[id].name, x, y + 22);
    ctx.textAlign = 'left';
  });
}

function drawChopping(ctx, state) {
  const r = STATIONS.chopping;
  drawStation(ctx, r, 'CHOPPING BOARD', '#f2c94c');
  ctx.fillStyle = '#caa06a';
  roundRect(ctx, r.x + 100, r.y + 34, 110, 56, 8);
  ctx.fill();
  if (state.chopping) {
    drawIngredient(ctx, state.chopping.item, r.x + 155, r.y + 62, 32, false);
    ctx.fillStyle = '#5a3d24';
    ctx.fillRect(r.x + 60, r.y + 96, 180, 10);
    ctx.fillStyle = '#f2c94c';
    ctx.fillRect(r.x + 60, r.y + 96, 180 * Math.min(1, state.chopping.progress), 10);
    ctx.fillStyle = '#ffe9b0';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('CHOPPING…', r.x + 228, r.y + 66);
  } else {
    ctx.fillStyle = '#8a6a45';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🔪 bring lettuce, tomato or onion', r.x + 150, r.y + 110);
    ctx.textAlign = 'left';
  }
}

function drawStove(ctx, state) {
  const r = STATIONS.stove;
  drawStation(ctx, r, 'STOVE — click with a patty', '#e05252');
  state.stove.forEach((burner, i) => {
    const x = r.x + 42 + i * 68;
    const y = r.y + 72;
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.fill();
    if (burner) {
      const frac = Math.min(1, burner.progress / COOK_TIME);
      ctx.fillStyle = burner.burnt ? '#1a1a1a' : burner.done ? '#c98a4b' : '#a05a3c';
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5a3d24';
      ctx.fillRect(x - 22, y + 32, 44, 7);
      ctx.fillStyle = burner.burnt ? '#ff4444' : '#e8a33d';
      ctx.fillRect(x - 22, y + 32, 44 * frac, 7);
      ctx.fillStyle = '#ffe9b0';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(burner.burnt ? 'BURNT!' : burner.done ? 'READY!' : 'COOKING', x, y - 34);
      ctx.textAlign = 'left';
    } else {
      ctx.strokeStyle = '#6b4a2c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
  if (state.sizzle > 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '22px sans-serif';
    ctx.fillText('♨ sizzle!', r.x + 200, r.y + 40);
  }
}

function drawPlating(ctx, state) {
  const r = STATIONS.plating;
  drawStation(ctx, r, 'PLATING — build the dish here', '#8ecae6');
  ctx.fillStyle = '#f4f1ea';
  ctx.beginPath();
  ctx.ellipse(r.x + 170, r.y + 102, 120, 42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b8b0a0';
  ctx.lineWidth = 3;
  ctx.stroke();
  if (state.plate.length === 0) {
    ctx.fillStyle = '#8a6a45';
    ctx.font = '15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('empty plate', r.x + 170, r.y + 102);
    ctx.textAlign = 'left';
  } else {
    state.plate.forEach((id, i) => {
      drawIngredient(ctx, id, r.x + 70 + i * 52, r.y + 102, 30, false);
    });
    ctx.fillStyle = '#ffe9b0';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.plate.map((id) => INGREDIENTS[id].name).join(' + '), r.x + 170, r.y + 42);
    ctx.textAlign = 'left';
  }
}

function drawServing(ctx, state) {
  const r = STATIONS.serving;
  drawStation(ctx, r, 'SERVING WINDOW — click to serve', '#c77dff');
  ctx.fillStyle = '#caa06a';
  ctx.fillRect(r.x + 20, r.y + 40, 300, 10);
  const ready = state.orders.find((o) =>
    o.recipe.needs.every((n) => state.plate.includes(n)) && state.plate.length === o.recipe.needs.length);
  ctx.fillStyle = ready ? '#7dc383' : '#8a6a45';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(ready ? `✓ ${ready.recipe.name} ready to serve!` : 'Waiting for a finished plate…', r.x + 20, r.y + 80);
}

function drawChef(ctx, state) {
  const { x, y } = state.chef;
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(x, y + 34, 26, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body: white apron, red bandana.
  ctx.fillStyle = '#f4f1ea';
  roundRect(ctx, x - 20, y - 8, 40, 44, 10);
  ctx.fill();
  ctx.fillStyle = '#e05252';
  ctx.fillRect(x - 20, y - 8, 40, 8);
  // Head and chef hat.
  ctx.fillStyle = '#f2c9a0';
  ctx.beginPath();
  ctx.arc(x, y - 22, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x - 8, y - 34, 9, 0, Math.PI * 2);
  ctx.arc(x + 8, y - 34, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 14, y - 38, 28, 8);
  ctx.fillStyle = '#3a2a1e';
  ctx.beginPath();
  ctx.arc(x - 5, y - 24, 2, 0, Math.PI * 2);
  ctx.arc(x + 5, y - 24, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawHand(ctx, state) {
  if (state.hand.length === 0) return;
  ctx.fillStyle = 'rgba(40,24,12,0.9)';
  roundRect(ctx, 520, 640, 240, 44, 10);
  ctx.fill();
  ctx.fillStyle = '#ffe9b0';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Carrying: ' + state.hand.map((id) => INGREDIENTS[id].emoji + ' ' + INGREDIENTS[id].name).join(', '), 640, 668);
  ctx.textAlign = 'left';
}
