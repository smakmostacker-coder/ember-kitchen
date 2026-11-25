# Ember Kitchen

A fast, fiery little 2D cooking game — run a one-chef kitchen, beat the dinner rush, and serve every order before the customer walks out.

[![best-cooking-game-20261125-0137 bounty](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/smakmostacker-coder/ember-kitchen/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/smakmostacker-coder/ember-kitchen/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

Bounty page: https://make.fun/bounty/best-cooking-game-20261125-0137

## What is this

Ember Kitchen is an original 2D canvas cooking game that runs entirely
in a web browser, offline, from plain static files. You are the only chef
in a small ember-lit kitchen. Customers order from the board, their
patience drains in plain sight, and you plan your route: pantry, chopping
board, stove, plating board, serving window — in the right order, before
the timer runs out.

## How a dish is made

- **Grab** an ingredient from the pantry (click it, or press 1–6)
- **Chop** lettuce, tomato or onion on the chopping board
- **Grill** patties on one of four stove burners — a cooked patty burns
  if you leave it too long
- **Stack** everything on the plate at the plating board
- **Serve** at the window while the order still matches

## The menu

- **Ember Burger** — bread + grilled patty + lettuce + cheese (18 coins)
- **Garden Salad** — chopped lettuce + tomato + onion (12 coins)
- **Melt Toast** — bread + cheese + chopped tomato (14 coins)

Serve fast and you earn a tip; serve several in a row and the combo bonus
grows. Let an order's patience run out and the customer walks out — and
your combo resets.

## Pressure that grows

Each service day lasts 120 seconds. Orders arrive faster as the day goes
on and the rush bar climbs; day 2 and day 3 bring customers quicker still.
Three days make a full run.

## Controls

### Keyboard and mouse

- **WASD / arrow keys** — walk the chef around the kitchen
- **Mouse click** — use a station (pantry, chopping board, stove,
  plating board, serving window)
- **E or Space** — use the nearest station
- **1–6** — grab a pantry item (bread, patty, lettuce, tomato, cheese,
  onion)
- **Shift** — hurry (walk faster)
- **M** — mute

## Run it locally

The game is static files under `game/`; there is nothing to install and
nothing to build before it can be played.

Any static file server pointed at that folder works:

```sh
python3 -m http.server 8080 --directory game
```

Then open <http://localhost:8080> in a desktop browser.

Or use the server bundled with this repository instead:

```sh
node serve.ts
```

which serves the same folder at the same local address.

## Tech

- Plain canvas 2D and ES modules throughout the game's own source,
  split by job: `state.js`, `recipes.js`, `orders.js`, `kitchen.js`,
  `input.js`, `audio.js`, `main.js`
- No build step: the files in `game/` are the files that run
- No network requests: every asset loads from inside `game/`
- All sound is synthesized with WebAudio — sizzle, chopping, the serve
  chime — no audio files

## Built for make.fun

Ember Kitchen was built for the best-cooking-game-20261125-0137 "Make the
best cooking game" bounty on make.fun:
<https://make.fun/c/best-cooking-game-20261125-0137>. Everything in it —
the kitchen, the names, the recipes, the art and the sound — is original
work made for this entry; it copies no existing commercial game.

## License

MIT — see the `LICENSE` file in this repository.
