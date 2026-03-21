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
| Zone 3 World Width | 5500px | Tuna Bay Docks |
| Zone 4 World Width | 6000px | Catnip Canyon |
| Zone 5 World Width | 6000px | The Yarn Factory |
| Zone 6 World Width | 6500px | Snowpaw Summit |
| Zone 7 World Width | 7000px | Dog King's Fortress |
| World Height | 576px | Fixed (no vertical scroll) |
| Tile Size | 32x32 | Platform/ground tiles |

### Player Defaults

| Setting | Value | Notes |
|---------|-------|-------|
| Starting Health | 100 | Max health |
| Starting Hunger | 100 | Max hunger |
| Starting Thirst | 100 | Max thirst |
| Starting Lives | 9 | "9 lives" — lose one each time health hits 0 |
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
| Fortress enemy damage | -15 HP | Zone 7 enemies hit harder |
| Water fall damage (Zone 3) | -15 HP | Cats hate water |

### Lives System

| Setting | Value | Notes |
|---------|-------|-------|
| Starting Lives | 9 | Classic "9 lives" |
| On death (health = 0) | Lose 1 life | Respawn nearby with full health + invulnerability |
| Game Over | 0 lives remaining | Game over screen, "Try Again" returns to title |
| Game Over tone | Kid-friendly | "The cats are exhausted and need a nap." |

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
- **Texture:** `cat_boots`
- **Ability:** Super Sprint — 3x speed, run across water
- **Weakness:** Low jump
- **Available:** Zone 3

### Cleo (Siamese)
- **Texture:** `cat_cleo`
- **Ability:** Razor Claws — climb walls, cut vines
- **Weakness:** 1.5x hunger drain
- **Available:** Zone 4

### Mochi (Fat Calico)
- **Texture:** `cat_mochi`
- **Ability:** Belly Bounce — extreme height, roll through enemies
- **Weakness:** Slowest walker
- **Available:** Zone 6

---

## Controls

| Key | Action | Notes |
|-----|--------|-------|
| Arrow Left/Right or A/D | Move | Horizontal movement |
| SHIFT + Move | Run | Faster movement, higher drain |
| SPACE | Jump | Only when grounded |
| X | Pounce Attack | Breaks crates/boulders/vines, scares enemies, activates switches |
| E | Interact/Talk | When near NPCs (80px range) |
| TAB | Switch Character | Cycles through party members (Zone 2+) |
| V | Night Vision | Luna only — toggles on/off (Zone 2, 7) |
| W | Special Ability | Boots: Super Sprint (3x speed, 3s burst, 5s cooldown) / Mochi: Belly Bounce (super jump) |
| M | Volume Down | 10% steps |
| N | Volume Up | 10% steps |

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

## Music System

| Track | File | When it plays |
|-------|------|---------------|
| Main Menu | `music/mainmenumusic.mp3` | Title screen (loops) |
| Level 1 | `music/level1music.mp3` | Zone 1: Purrville Meadows (loops) |
| Level 2 | `music/level2music.mp3` | Zone 2: Whispering Woods (loops) |
| Level 3 | `music/level3music.mp3` | Zone 3: Tuna Bay Docks (loops) |
| Level 4 | `music/level4music.mp3` | Zone 4: Catnip Canyon (loops) |
| Level 5 | `music/level5music.mp3` | Zone 5: The Yarn Factory (loops) |
| Level 6 | `music/level6music.mp3` | Zone 6: Snowpaw Summit (loops) |
| Level 7 | `music/level7music.mp3` | Zone 7: Dog King's Fortress (loops) |
| Victory | `music/victory.mp3` | THE END screen (plays once) |
| Game Over | `music/gameover.mp3` | Game over screen (plays once) |

- Each level starts its own music in `create()` via `sound.stopAll()` then `sound.play()`
- Volume control: M (down) / N (up), 10% steps, displayed in HUD
- Default volume: 40%

---

## Scene Architecture

```
BootScene          → loads audio, generates all placeholder textures
    ↓
TitleScene         → title screen, start button (mainmenumusic)
    ↓
Level1Scene        → Zone 1: Purrville Meadows (level1music)
    ↓ (exit zone at right edge)
Level2Scene        → Zone 2: Whispering Woods (level2music)
    ↓ (exit zone at right edge)
Level3Scene        → Zone 3: Tuna Bay Docks (level3music)
    ↓ (exit zone at right edge)
Level4Scene        → Zone 4: Catnip Canyon (level4music)
    ↓ (exit zone at right edge)
Level5Scene        → Zone 5: The Yarn Factory (level5music)
    ↓ (exit zone at right edge)
Level6Scene        → Zone 6: Snowpaw Summit (level6music)
    ↓ (exit zone at right edge)
Level7Scene        → Zone 7: Dog King's Fortress (level7music → victory)

UIScene            → HUD overlay (runs parallel to level scenes, handles lives/game over)
DialogScene        → Dialog box overlay (pauses level, resumes on close)
```

---

## File Structure

```
cat_game/
├── docs/
│   ├── biomes.md                     # Biome descriptions & music prompts
│   ├── cat_game game onverview.md    # CEO-level game design overview
│   ├── cat_game narrative.md         # Full story script & dialogue
│   ├── cat_game steps.md             # Development roadmap options
│   ├── level_summary.md              # Complete level breakdowns
│   ├── settings.md                   # THIS FILE — all game settings
│   └── story_bible.md                # Condensed story bible & reference
├── music/
│   ├── mainmenumusic.mp3             # Title screen music
│   ├── level1music.mp3               # Zone 1 music
│   ├── level2music.mp3               # Zone 2 music
│   ├── level3music.mp3               # Zone 3 music
│   ├── level4music.mp3               # Zone 4 music
│   ├── level5music.mp3               # Zone 5 music
│   ├── level6music.mp3               # Zone 6 music
│   ├── level7music.mp3               # Zone 7 music
│   ├── victory.mp3                   # THE END screen music
│   └── gameover.mp3                  # Game over screen music
├── src/
│   ├── main.js                       # Phaser game config & scene list
│   └── scenes/
│       ├── BootScene.js              # Audio loading & texture generation
│       ├── TitleScene.js             # Title screen
│       ├── Level1Scene.js            # Zone 1: Purrville Meadows
│       ├── Level2Scene.js            # Zone 2: Whispering Woods
│       ├── Level3Scene.js            # Zone 3: Tuna Bay Docks
│       ├── Level4Scene.js            # Zone 4: Catnip Canyon
│       ├── Level5Scene.js            # Zone 5: The Yarn Factory
│       ├── Level6Scene.js            # Zone 6: Snowpaw Summit
│       ├── Level7Scene.js            # Zone 7: Dog King's Fortress
│       ├── UIScene.js                # HUD overlay + lives + game over
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
| Zone 3: Tuna Bay Docks | Done |
| Zone 4: Catnip Canyon | Done |
| Zone 5: The Yarn Factory | Done |
| Zone 6: Snowpaw Summit | Done |
| Zone 7: Dog King's Fortress | Done |
| Whiskers (movement, pounce) | Done |
| Luna (night vision, switching) | Done |
| Boots (super sprint) | Done |
| Cleo (wall climb) | Done |
| Mochi (belly bounce) | Done |
| Hunger/Thirst system | Done |
| Lives system (9 lives) | Done |
| Game Over screen | Done |
| NPC dialog system | Done |
| Accessory system (equip UI) | Partial — Fish Pendant works, no equip menu |
| Dark zones + hidden paths | Done (Zone 2 & 7) |
| Boulder puzzle (Zone 2) | Done |
| Vine puzzle (Zone 4) | Done |
| Switch puzzle (Zone 5) | Done |
| Mochi feed puzzle (Zone 6) | Done |
| Enemy patrol AI | Done |
| Flying enemies | Done (all zones) |
| Parallax backgrounds | Done (all zones) |
| Firefly ambience | Done |
| Conveyor belts (Zone 5) | Done |
| Ice physics (Zone 6) | Done |
| Water hazard (Zone 3) | Done |
| Per-level music | Done |
| Main menu music | Done |
| Victory music | Done |
| Game over music | Done |
| Volume control (M/N keys) | Done |
| THE END finale sequence | Done |
| Sound effects | Not started |
| Save/load system | Not started |
| Pause menu | Not started |
