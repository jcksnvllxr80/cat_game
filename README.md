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
| E | Talk to NPCs |
| TAB | Switch Character |
| V | Night Vision (Luna only) |

## What's Playable

**Zone 1 — Purrville Meadows**
- Meet Mr. Pawston, Grandma Mittens, and Sgt. Fluffbottom
- Learn pounce attack, collect tuna/water, find Map Piece 1/7
- Scare away squirrels, break crates

**Zone 2 — Whispering Woods**
- Rescue Luna from a collapsed cave (pounce the boulders)
- Switch between Whiskers and Luna with TAB
- Use Luna's Night Vision (V) to reveal hidden paths in dark zones
- Find Map Piece 2/7 inside the Great Tree
- New enemies: raccoons and crows

## Core Mechanics

- **Hunger/Thirst** — drains over time (faster when running). Collect tuna and water to stay fed. At zero the cat sits down until fed — no game over.
- **Party System** — rescue cats to add them to your team. Switch control at any time.
- **Accessories** — collectible items that boost stats (Fish Pendant reduces food drain by 25%).
- **Puzzle Map** — 7 pieces scattered across 7 themed zones.

## Tech Stack

- [Phaser 3](https://phaser.io/) — game engine
- [Vite](https://vitejs.dev/) — bundler/dev server
- All graphics are procedurally generated (no external art assets)

## Project Structure

```
src/
├── main.js              # Game config and scene list
└── scenes/
    ├── BootScene.js      # Texture generation and music
    ├── TitleScene.js      # Title screen
    ├── Level1Scene.js     # Zone 1: Purrville Meadows
    ├── Level2Scene.js     # Zone 2: Whispering Woods
    ├── UIScene.js         # HUD overlay
    └── DialogScene.js     # Dialog system
docs/                      # Game design documents
music/                     # Background music
```

## Build

```bash
npm run build
npm run preview
```
