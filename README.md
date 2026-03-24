# Paws of Destiny

A 2.5D cat adventure game built with Phaser 3. Collect pieces of a puzzle map, rescue cat friends, and track down the fearsome Dog King — who turns out to be a tiny chihuahua named King Biscuit.

Designed for elementary-aged kids (ages 6-11).

## Setup

```bash
npm install
npm run dev
```

Opens at [http://localhost:3001](http://localhost:3001).

## Controls

| Key | Action |
|-----|--------|
| Arrow Keys | Move |
| SHIFT + Arrows | Run |
| SPACE | Jump |
| X | Pounce Attack |
| W | Special Ability (Boots: Sprint, Mochi: Belly Bounce) |
| V | Night Vision (Luna only) |
| UP (on wall) | Wall Climb (Cleo only) |
| E | Talk to NPCs |
| TAB | Switch Character |

## Characters

| Cat | Breed | Special Ability | Recruited |
|-----|-------|-----------------|-----------|
| **Whiskers** | Orange Tabby | Pounce Attack | Start |
| **Luna** | Black Cat | Night Vision (V) — reveals dark zones | Level 2 |
| **Boots** | Tuxedo | Super Sprint (W) — 3x speed for 3s, crosses water | Level 3 |
| **Cleo** | Siamese | Wall Climb (UP on walls) — scale any surface | Level 4 |
| **Mochi** | Calico | Belly Bounce (W) — super high jump | Level 6 |

Each character has unique animated poses for their special moves: pounce crouch/lunge, sprint stretch, climb grip, bounce squish, and night vision glow.

## Zones

**Zone 1 — Purrville Meadows** (Level 1)
- Meet Mr. Pawston, Grandma Mittens, and Sgt. Fluffbottom
- Learn pounce attack, collect tuna/water, find Map Piece 1/7
- Scare away squirrels, break crates

**Zone 2 — Whispering Woods** (Level 2)
- Rescue Luna from a collapsed cave (pounce the boulders)
- Use Luna's Night Vision to reveal hidden paths in dark zones
- Find Map Piece 2/7 inside the Great Tree
- Enemies: raccoons and crows

**Zone 3 — Tuna Bay Docks** (Level 3)
- Rescue Boots from an island
- Use Boots' Super Sprint to cross water gaps
- Explore the Sunken Ship for Map Piece 3/7
- Enemies: seagulls and crabs

**Zone 4 — Catnip Canyon** (Level 4)
- Rescue Cleo tangled in vines
- Use Cleo's Wall Climb to scale the Canyon Summit
- Find Map Piece 4/7 at the top
- Enemies: hawks and snakes

**Zone 5 — The Yarn Factory** (Level 5)
- Activate 3 switches to reach the Control Room
- Use the full party's abilities to navigate the factory
- Find Map Piece 5/7
- Enemies: yarn balls and machines

**Zone 6 — Snowpaw Summit** (Level 6)
- Rescue Mochi from a hole in the snow
- Use Mochi's Belly Bounce to reach high ice platforms
- Explore the Ice Cave for Map Piece 6/7
- Enemies: snow foxes

**Zone 7 — Dog King's Fortress** (Level 7)
- All five cats and all abilities needed
- Dark zones (Luna), water gaps (Boots), walls (Cleo), high ledges (Mochi), breakable walls (Whiskers)
- Confront King Biscuit in the Throne Room
- Find Map Piece 7/7 and complete the map

## Core Mechanics

- **Hunger/Thirst** — drains over time (faster when running). Collect tuna and water to stay fed. At zero the cat sits down until fed — no game over.
- **Party System** — rescue cats to add them to your team. Switch control with TAB at any time.
- **Accessories** — collectible items that boost stats (Fish Pendant reduces food drain by 25%).
- **Puzzle Map** — 7 pieces scattered across 7 themed zones.
- **Animated Abilities** — each special move has dedicated sprite animations (pounce, dash, sprint, climb, bounce, night vision).

## Tech Stack

- [Phaser 3](https://phaser.io/) — game engine
- [Vite](https://vitejs.dev/) — bundler/dev server
- All graphics are procedurally generated (no external art assets)

## Project Structure

```
src/
├── main.js              # Game config and scene list
└── scenes/
    ├── BootScene.js      # Texture/animation generation and music loading
    ├── TitleScene.js     # Title screen
    ├── Level1Scene.js    # Zone 1: Purrville Meadows
    ├── Level2Scene.js    # Zone 2: Whispering Woods
    ├── Level3Scene.js    # Zone 3: Tuna Bay Docks
    ├── Level4Scene.js    # Zone 4: Catnip Canyon
    ├── Level5Scene.js    # Zone 5: The Yarn Factory
    ├── Level6Scene.js    # Zone 6: Snowpaw Summit
    ├── Level7Scene.js    # Zone 7: Dog King's Fortress
    ├── UIScene.js        # HUD overlay
    └── DialogScene.js    # Dialog system
docs/                     # Game design documents
music/                    # Background music
sounds/                   # Sound effects
```

## Build

```bash
npm run build
npm run preview
```
