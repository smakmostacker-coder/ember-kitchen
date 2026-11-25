// main.js — Ember Kitchen entry point: the game loop, day timer, rush
// pressure, click/keyboard wiring, and the ?shot= staging used to take
// the entry's screenshots of a real, running game.

import { freshState, DAY_LENGTH, INGREDIENTS, setMessage } from './state.js';
import { spawnOrder, servePayout, recipeById } from './recipes.js';
import { updateOrders, serveMatchingOrder, endDaySummary, startNextDay } from './orders.js';
import { drawKitchen, interactAt, updateKitchen, STATIONS } from './kitchen.js';
import { createInput, moveChef } from './input.js';
import { playSfx, ensureAudio, toggleMute } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const state = freshState();
const params = new URLSearchParams(location.search);
const shot = params.get('shot');

const input = createInput(canvas, (kind, payload) => {
  ensureAudio();
  if (state.phase === 'title') { state.phase = 'playing'; playSfx('click'); return; }
  if (state.phase === 'dayEnd') { startNextDay(state); return; }
  if (state.phase === 'gameOver') { resetRun(); return; }
  if (state.phase !== 'playing') return;
  if (kind === 'click') {
    interactAt(state, payload.x, payload.y, playSfx);
    if (state.serveAttempt) {
      state.serveAttempt = false;
      if (serveMatchingOrder(state)) playSfx('serve');
      else setMessage(state, 'That plate does not match any order yet.');
    }
  }
  if (kind === 'pantry-key') {
    if (state.hand.length >= 2) { setMessage(state, 'Hands full!'); return; }
    state.hand.push(payload);
    playSfx('pickup');
  }
  if (kind === 'use-nearest') {
    const station = input.nearestStation(state.chef);
    if (!station) return;
    const r = STATIONS[station];
    interactAt(state, r.x + r.w / 2, r.y + r.h / 2, playSfx);
    if (state.serveAttempt) {
      state.serveAttempt = false;
      if (serveMatchingOrder(state)) playSfx('serve');
      else setMessage(state, 'That plate does not match any order yet.');
    }
  }
});

window.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'm') toggleMute();
  if (event.key === 'Enter' && state.phase === 'title') state.phase = 'playing';
});

function resetRun() {
  const fresh = freshState();
  Object.assign(state, fresh);
}

// Fixed, hand-built scenes for the entry screenshots: each one is the
// real game with a real state, frozen mid-service so the shot reads.
function stageShot(name) {
  state.phase = 'playing';
  state.day = 1;
  state.coins = 34;
  state.score = 340;
  state.served = 2;
  state.dayTimeLeft = name === 'serve' ? 18 : 74;
  state.rush = name === 'serve' ? 0.8 : 0.45;
  state.chef.x = 640;
  state.chef.y = 600;
  state.orders = [];
  const burger = { id: 1, recipe: recipeById('ember-burger'), patience: 28, maxPatience: 45, tip: 0 };
  const salad = { id: 2, recipe: recipeById('garden-salad'), patience: 12, maxPatience: 35, tip: 0 };
  const toast = { id: 3, recipe: recipeById('melt-toast'), patience: 30, maxPatience: 38, tip: 0 };
  if (name === 'overview') {
    state.orders = [burger, salad];
    state.hand = ['tomato'];
    state.stove = [{ item: 'patty', progress: 3.2, done: false, burnt: false }, null, null, null];
    state.plate = ['bread'];
    state.sizzle = 0.8;
  }
  if (name === 'orders') {
    state.orders = [burger, salad, toast];
    state.hand = ['lettuce'];
    state.chef.x = 620;
    state.chef.y = 330;
  }
  if (name === 'assembly') {
    state.orders = [burger, salad];
    state.plate = ['bread', 'lettuce', 'cheese'];
    state.chopping = { item: 'tomato', progress: 0.6 };
    state.hand = [];
    state.stove = [{ item: 'patty', progress: 5.4, done: true, burnt: false }, null, null, null];
    setMessage(state, 'Chopping the tomato for the Ember Burger…');
  }
  if (name === 'serve') {
    state.orders = [burger];
    state.plate = ['bread', 'patty', 'lettuce', 'cheese'];
    state.hand = [];
    setMessage(state, 'Ember Burger ready — serve it at the window!');
  }
}

let last = performance.now();

function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (state.phase === 'playing') {
    moveChef(state, input, dt);
    updateOrders(state, dt);
    updateKitchen(state, dt, playSfx);
    state.dayTimeLeft -= dt;
    state.rush = Math.min(1, 1 - state.dayTimeLeft / DAY_LENGTH);
    if (state.messageTime > 0) state.messageTime -= dt;
    if (state.dayTimeLeft <= 0) {
      state.dayTimeLeft = 0;
      playSfx('dayEnd');
      if (state.day >= 3) {
        state.phase = 'gameOver';
      } else {
        endDaySummary(state);
      }
    }
  }
  draw();
  requestAnimationFrame(tick);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (state.phase === 'title') { drawTitle(); return; }
  if (state.phase === 'dayEnd') { drawKitchen(ctx, state); drawDayEnd(); return; }
  if (state.phase === 'gameOver') { drawKitchen(ctx, state); drawGameOver(); return; }
  drawKitchen(ctx, state);
  drawHelp();
}

function drawHelp() {
  ctx.fillStyle = 'rgba(40,24,12,0.85)';
  ctx.fillRect(28, 720, 1224, 56);
  ctx.fillStyle = '#ffe9b0';
  ctx.font = '15px sans-serif';
  ctx.fillText('WASD / arrows — walk   •   Click a station to use it   •   E — use nearest station   •   1-6 — grab pantry item   •   M — mute', 48, 744);
  ctx.fillText('Grab → chop veggies → grill patties → stack the plate → serve at the window before patience runs out!', 48, 766);
}

function drawTitle() {
  ctx.fillStyle = '#2b1a10';
  ctx.fillRect(0, 0, 1280, 800);
  ctx.fillStyle = '#e8a33d';
  ctx.font = 'bold 84px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🔥 Ember Kitchen', 640, 220);
  ctx.fillStyle = '#ffe9b0';
  ctx.font = '26px sans-serif';
  ctx.fillText('A fast, fiery little cooking game — run the kitchen, beat the rush.', 640, 290);
  ctx.font = '20px sans-serif';
  ctx.fillText('🍔 Ember Burger    🥗 Garden Salad    🥪 Melt Toast', 640, 360);
  ctx.fillText('Chop it. Grill it. Plate it. Serve it before the customer walks out.', 640, 410);
  ctx.fillStyle = '#7dc383';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('Click or press Enter to start — Day 1, 120 seconds on the clock', 640, 500);
  ctx.fillStyle = '#cbb28a';
  ctx.font = '17px sans-serif';
  ctx.fillText('WASD / arrows to walk  •  click stations to work them  •  E uses the nearest station  •  1-6 grab pantry items', 640, 560);
  ctx.textAlign = 'left';
}

function drawDayEnd() {
  const s = state.daySummary;
  overlayPanel(440, 250, 400, 260, `Day ${s.day} done!`);
  ctx.fillStyle = '#ffe9b0';
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Served: ${s.served} dishes   •   Walked out: ${s.missed}`, 640, 340);
  ctx.fillText(`Best combo: x${s.bestCombo}   •   Coins: ${s.coins}`, 640, 380);
  ctx.fillStyle = '#7dc383';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('Click to start Day ' + (s.day + 1) + ' — it gets busier!', 640, 440);
  ctx.textAlign = 'left';
}

function drawGameOver() {
  overlayPanel(400, 230, 480, 300, 'Service complete!');
  ctx.fillStyle = '#ffe9b0';
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`3 days, ${state.served} dishes served, ${state.coins} coins earned.`, 640, 330);
  ctx.fillText(`Best combo: x${state.bestCombo}`, 640, 370);
  ctx.fillStyle = '#7dc383';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('Click to run the kitchen again.', 640, 440);
  ctx.textAlign = 'left';
}

function overlayPanel(x, y, w, h, title) {
  ctx.fillStyle = 'rgba(20,12,6,0.55)';
  ctx.fillRect(0, 0, 1280, 800);
  ctx.fillStyle = '#3a2a1e';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#e8a33d';
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = '#e8a33d';
  ctx.font = 'bold 30px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, x + w / 2, y + 52);
}

if (shot) {
  stageShot(shot);
  drawKitchen(ctx, state);
  drawHelp();
} else {
  requestAnimationFrame(tick);
}
