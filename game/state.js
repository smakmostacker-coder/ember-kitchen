// state.js — the single source of truth for one Ember Kitchen run.
// Everything the kitchen shows on screen is derived from this object,
// so a screenshot stage can build a fixed state and the renderer just draws it.

export const DAY_LENGTH = 120; // seconds per service day
export const MAX_ORDERS = 3;
export const HAND_SLOTS = 2; // the chef carries at most two loose items

export const INGREDIENTS = {
  bread: { name: 'Bread', color: '#e8b96a', emoji: '🍞', chop: false, cook: false },
  patty: { name: 'Patty', color: '#a05a3c', emoji: '🥩', chop: false, cook: true },
  lettuce: { name: 'Lettuce', color: '#7dc383', emoji: '🥬', chop: true, cook: false },
  tomato: { name: 'Tomato', color: '#e05252', emoji: '🍅', chop: true, cook: false },
  cheese: { name: 'Cheese', color: '#f2c94c', emoji: '🧀', chop: false, cook: false },
  onion: { name: 'Onion', color: '#d9c2f0', emoji: '🧅', chop: true, cook: false },
};

export function freshState() {
  return {
    phase: 'title', // title | playing | dayEnd | gameOver
    day: 1,
    coins: 0,
    score: 0,
    served: 0,
    missed: 0,
    dayTimeLeft: DAY_LENGTH,
    rush: 0, // 0..1, grows as the day goes on
    chef: { x: 640, y: 560, dir: 'up', moving: false, speed: 260 },
    hand: [], // ingredient ids the chef is carrying
    plate: [], // ingredients currently on the plating board
    chopping: null, // { item, progress } while the knife is working
    stove: [null, null, null, null], // four burners: null or { item, progress, burnt }
    orders: [], // { id, recipe, patience, maxPatience, tip }
    nextOrderId: 1,
    orderTimer: 2.5, // seconds until the next order arrives
    message: '',
    messageTime: 0,
    sizzle: 0, // visual steam timer on the stove
    daySummary: null,
    bestCombo: 0,
    combo: 0,
  };
}

export function addCoins(state, amount) {
  state.coins += amount;
  state.score += amount * 10;
}

export function setMessage(state, text) {
  state.message = text;
  state.messageTime = 2.2;
}

export function orderIsReady(state, order) {
  return order.recipe.needs.every((need) => state.plate.includes(need));
}
