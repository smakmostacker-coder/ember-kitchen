// recipes.js — the three dishes Ember Kitchen serves, and how an order
// is born, ages, and pays out. Every dish is a combination of the same six
// pantry ingredients, so the fun is the route, not memorising a menu.

import { INGREDIENTS } from './state.js';

export const RECIPES = [
  {
    id: 'ember-burger',
    name: 'Ember Burger',
    needs: ['bread', 'patty', 'lettuce', 'cheese'],
    prep: 'Grill the patty, stack it all on bread.',
    price: 18,
    patience: 45,
  },
  {
    id: 'garden-salad',
    name: 'Garden Salad',
    needs: ['lettuce', 'tomato', 'onion'],
    prep: 'Chop everything fresh, toss it on the plate.',
    price: 12,
    patience: 35,
  },
  {
    id: 'melt-toast',
    name: 'Melt Toast',
    needs: ['bread', 'cheese', 'tomato'],
    prep: 'Chopped tomato, melted cheese, warm bread.',
    price: 14,
    patience: 38,
  },
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id);
}

export function pickRecipe(day) {
  // Day 1 leans on the salad; later days the burger shows up more often.
  const pool = day <= 1 ? [RECIPES[1], RECIPES[1], RECIPES[2], RECIPES[0]]
    : [RECIPES[0], RECIPES[1], RECIPES[2], RECIPES[0], RECIPES[2]];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function spawnOrder(state) {
  const recipe = pickRecipe(state.day);
  const order = {
    id: state.nextOrderId++,
    recipe,
    patience: recipe.patience,
    maxPatience: recipe.patience,
    tip: 0,
  };
  state.orders.push(order);
  return order;
}

// What the customer pays when a plate matches their order exactly.
export function servePayout(order, state) {
  const patienceFrac = Math.max(0, order.patience / order.maxPatience);
  const tip = Math.round(order.recipe.price * 0.5 * patienceFrac);
  const comboBonus = state.combo >= 2 ? 2 * state.combo : 0;
  return { price: order.recipe.price, tip, comboBonus, total: order.recipe.price + tip + comboBonus };
}

// Human-readable list of what a recipe still needs from the current plate.
export function missingIngredients(recipe, plate) {
  return recipe.needs.filter((need) => !plate.includes(need));
}

export function ingredientLabel(id) {
  const ing = INGREDIENTS[id];
  return ing ? `${ing.emoji} ${ing.name}` : id;
}
