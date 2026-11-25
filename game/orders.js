// orders.js — the order board: spawning, patience decay, serving and
// expiring orders, plus the day-end summary a run finishes with.

import { spawnOrder, servePayout } from './recipes.js';
import { addCoins, setMessage, MAX_ORDERS } from './state.js';

export function updateOrders(state, dt) {
  // New customers walk in on a timer that quickens as the rush grows.
  state.orderTimer -= dt;
  if (state.orderTimer <= 0 && state.orders.length < MAX_ORDERS) {
    spawnOrder(state);
    const gap = Math.max(6, 14 - state.day * 1.5 - state.rush * 4);
    state.orderTimer = gap + Math.random() * 4;
  }
  // Patience drains; a customer who waits too long storms out.
  for (let i = state.orders.length - 1; i >= 0; i--) {
    const order = state.orders[i];
    order.patience -= dt;
    if (order.patience <= 0) {
      state.orders.splice(i, 1);
      state.missed += 1;
      state.combo = 0;
      setMessage(state, `${order.recipe.name} walked out! Too slow.`);
    }
  }
}

// The chef is holding a finished plate at the serving window.
export function serveMatchingOrder(state) {
  const idx = state.orders.findIndex((order) =>
    order.recipe.needs.every((need) => state.plate.includes(need)) &&
    state.plate.length === order.recipe.needs.length);
  if (idx === -1) return false;
  const order = state.orders[idx];
  const payout = servePayout(order, state);
  addCoins(state, payout.total);
  state.served += 1;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.orders.splice(idx, 1);
  state.plate = [];
  setMessage(
    state,
    `Served ${order.recipe.name}! +${payout.total} coins` +
      (payout.tip > 0 ? ` (tip ${payout.tip})` : '') +
      (payout.comboBonus > 0 ? ` combo +${payout.comboBonus}` : ''),
  );
  return true;
}

export function endDaySummary(state) {
  const summary = {
    day: state.day,
    served: state.served,
    missed: state.missed,
    coins: state.coins,
    bestCombo: state.bestCombo,
  };
  state.daySummary = summary;
  state.phase = 'dayEnd';
  return summary;
}

export function startNextDay(state) {
  state.day += 1;
  state.dayTimeLeft = 120;
  state.orders = [];
  state.plate = [];
  state.hand = [];
  state.stove = [null, null, null, null];
  state.chopping = null;
  state.orderTimer = 2;
  state.rush = 0;
  state.phase = 'playing';
  setMessage(state, `Day ${state.day} — the rush is coming faster now.`);
}
