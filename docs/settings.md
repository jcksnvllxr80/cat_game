# Paws of Destiny — Game Settings & Configuration

## Technical Stack

| Setting | Value |
|---------|-------|
| Engine | Phaser 3 (v3.80+) |
| Bundler | Vite 5 |
| Language | JavaScript (ES Modules) |
| Rendering | WebGL (Phaser AUTO) |
| Physics | Arcade |
| Resolution | 1024 x 576 |
| Scaling | FIT with center |
| Pixel Art | Enabled |

---

## Game Constants

### World Settings

| Setting | Value | Notes |
|---------|-------|-------|
| Gravity | 800 | Arcade physics Y gravity |
| Zone 1 World Width | 4000px | Purrville Meadows |
| Zone 2 World Width | 5000px | Whispering Woods |
| World Height | 576px | Fixed (no vertical scroll) |
| Tile Size | 32x32 | Platform/ground tiles |

### Player Defaults

| Setting | Value | Notes |
|---------|-------|-------|
| Starting Health | 100 | Max health |
| Starting Hunger | 100 | Max hunger |
| Starting Thirst | 100 | Max thirst |
| Walk Speed | 200 | pixels/sec |
| Run Speed | 320 | 1.6x walk speed |
| Jump Power | -400 | Negative = upward |
| Pounce Cooldown | 1000ms | 1 second between pounces |
| Pounce Range | 60px | Distance to hit crate/boulder |
| Pounce Enemy Range | 80px | Distance to scare enemy |
| Invulnerability Duration | ~600ms | After taking damage (5 flashes) |

### Hunger & Thirst Drain Rates (per second)

| Activity | Hunger Drain | Thirst Drain |
|----------|-------------|--------------|
| Idle | 0.3 | 0.3 |
| Walking | 0.6 | 0.5 |
| Running | 1.2 | 0.9 |
| Night Vision active | +0 | +0.3 (extra) |

### Collectible Values

| Item | Effect |
|------|--------|
| Tuna Can | +25 Hunger |
| Water Bowl | +30 Thirst |
| Fish Pendant | -25% hunger drain rate |

### Damage Values

| Source | Damage |
|--------|--------|
| Enemy collision | -10 HP |
| Falling in pit | -10 HP |
| Crate hits to break | 2 |
| Boulder hits to break | 3 |

---

## Character Stats

### Whiskers (Orange Tabby)
- **Texture:** `cat_whiskers`
- **Ability:** Pounce Attack (X key)
- **Weakness:** Slow swimmer (water stamina 2x) — *not yet implemented*
- **Available:** Start

### Luna (Black Cat)
- **Texture:** `cat_luna`
- **Ability:** Night Vision (V key) — reveals hidden paths, removes darkness
- **Weakness:** Scared of loud noises — *not yet implemented*
- **Available:** Zone 2 (rescue from cave)

### Boots (Tuxedo Cat)
- **Texture:** `cat_boots` — *not yet created*
- **Ability:** Super Sprint — 3x speed, run across water
- **Weakness:** Low jump
- **Available:** Zone 3

### Cleo (Siamese)
- **Texture:** `cat_cleo` — *not yet created*
- **Ability:** Razor Claws — climb walls, cut vines
- **Weakness:** 1.5x hunger drain
- **Available:** Zone 4

### Mochi (Fat Calico)
- **Texture:** `cat_mochi` — *not yet created*
- **Ability:** Belly Bounce — extreme height, roll through enemies
- **Weakness:** Slowest walker
- **Available:** Zone 6

---

## Controls

| Key | Action | Notes |
|-----|--------|-------|
| Arrow Left/Right | Move | Horizontal movement |
| Arrow Up/Down | — | Reserved for future use |
| SHIFT + Arrows | Run | Faster movement, higher drain |
| SPACE | Jump | Only when grounded |
| X | Pounce Attack | Breaks crates/boulders, scares enemies |
| E | Interact/Talk | When near NPCs (80px range) |
| TAB | Switch Character | Cycles through party members |
| V | Night Vision | Luna only — toggles on/off |

---

## Enemy Settings

### Squirrel (Zone 1)
- Speed: 60 px/sec
- Patrol range: 80-150px from start
- Scale: 1.3x

### Raccoon (Zone 2)
- Speed: 50 px/sec
- Patrol range: 90-130px from start
- Scale: 1.2x

### Crow (Zone 2)
- Movement: Sine wave (flying)
- X amplitude: 80px
- Y amplitude: 40px
- No gravity

---

## Dark Zone Settings (Zone 2)

| Zone | X Position | Width | Content |
|------|-----------|-------|---------|
| Dark Zone 1 | 1800 | 600px | Hidden platforms |
| Dark Zone 2 | 3200 | 500px | Passage area |
| Dark Zone 3 | 4200 | 700px | Great Tree + Map Piece 2 |

- Darkness alpha (no NV): 0.85
- Darkness alpha (NV on, not Luna): 0.3
- Darkness alpha (Luna + NV on): 0 (full clear)
- Hidden path alpha when revealed: 0.7 with green tint

---

## UI Layout

### HUD Panel (top-left)
- Position: (8, 8)
- Size: 260 x 120
- Background: black, 50% opacity, rounded

### Bar Positions
| Bar | Y Position | Width | Colors |
|-----|-----------|-------|--------|
| Hunger | 18 | 160px | >50%: #FFB347, >25%: #FF8C00, <25%: #FF4444 |
| Thirst | 40 | 160px | >50%: #4FC3F7, >25%: #0288D1, <25%: #FF4444 |
| Health | 62 | 160px | >50%: #FF6B6B, >25%: #FF4444, <25%: #CC0000 |

### Character Colors (Dialog & UI)
| Character | Color |
|-----------|-------|
| Whiskers | #FF8C42 |
| Luna | #AA88FF |
| Boots | #88DDFF |
| Cleo | #FFB3D9 |
| Mochi | #AADDAA |
| King Biscuit | #FFD700 |
| Mr. Pawston | #AAAAAA |
| Grandma Mittens | #DDDDFF |
| Sgt. Fluffbottom | #FFDDAA |
| Frightened Mouse | #BB9977 |
| Professor Hoot | #CC9944 |
| Wandering Cat | #FFAA66 |

---

## Scene Architecture

```
BootScene          → generates all placeholder textures
    ↓
TitleScene         → title screen, start button
    ↓
Level1Scene        → Zone 1: Purrville Meadows
    ↓ (exit zone at right edge)
Level2Scene        → Zone 2: Whispering Woods
    ↓ (exit zone at right edge)
Level3Scene        → Zone 3: Tuna Bay Docks (not yet built)
    ...

UIScene            → HUD overlay (runs parallel to level scenes)
DialogScene        → Dialog box overlay (pauses level, resumes on close)
```

---

## File Structure

```
cat_game/
├── docs/
│   ├── cat_game game onverview.md    # CEO-level game design overview
│   ├── cat_game narrative.md         # Full story script & dialogue
│   ├── cat_game steps.md             # Development roadmap options
│   ├── settings.md                   # THIS FILE — all game settings
│   └── story_bible.md                # Condensed story bible & reference
├── src/
│   ├── main.js                       # Phaser game config & scene list
│   └── scenes/
│       ├── BootScene.js              # Texture generation (all sprites)
│       ├── TitleScene.js             # Title screen
│       ├── Level1Scene.js            # Zone 1: Purrville Meadows
│       ├── Level2Scene.js            # Zone 2: Whispering Woods
│       ├── UIScene.js                # HUD overlay
│       └── DialogScene.js            # Dialog system
├── index.html
├── package.json
└── vite.config.js
```

---

## Implementation Status

| Feature | Status |
|---------|--------|
| Zone 1: Purrville Meadows | Done |
| Zone 2: Whispering Woods | Done |
| Zone 3-7 | Not started |
| Whiskers (movement, pounce) | Done |
| Luna (night vision, switching) | Done |
| Boots, Cleo, Mochi | Not started |
| Hunger/Thirst system | Done |
| NPC dialog system | Done |
| Accessory system (equip UI) | Partial — Fish Pendant works, no equip menu |
| Dark zones + hidden paths | Done |
| Boulder puzzle | Done |
| Enemy patrol AI | Done |
| Flying enemies (crows) | Done |
| Parallax backgrounds | Done |
| Firefly ambience | Done |
| Sound effects | Not started |
| Music | Not started |
| Save/load system | Not started |
| Pause menu | Not started |
