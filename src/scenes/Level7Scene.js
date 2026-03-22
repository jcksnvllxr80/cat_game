import Phaser from 'phaser';

export class Level7Scene extends Phaser.Scene {
  constructor() {
    super('Level7Scene');
  }

  init(data) {
    // Carry over state from Level 6 (or use defaults if starting fresh)
    this.playerState = data.playerState || {
      hunger: 80,
      thirst: 80,
      health: 100,
      maxHealth: 100,
      isRunning: false,
      isPouncing: false,
      pounceReady: true,
      pounceCooldown: 1000,
      facingRight: true,
      tunasCollected: 0,
      watersCollected: 0,
      mapPieces: 6,
      accessories: [],
      speed: 200,
      jumpPower: -400,
      lives: 9,
      isExhausted: false,
    };
    // Party & switching state
    this.playerState.party = this.playerState.party || ['whiskers', 'luna', 'boots', 'cleo', 'mochi'];
    this.playerState.activeChar = this.playerState.activeChar || 'whiskers';
    this.nightVisionActive = false;
    this.throneRoomTriggered = false;
    this.sprintActive = false;
    this.sprintReady = true;
  }

  create() {
    const worldWidth = 7000;
    const worldHeight = 576;

    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

    // Start level 7 music
    this.sound.stopAll();
    this.sound.play('level7music', { loop: true, volume: 0.4 });

    // ---- Fortress background ----
    this.createFortressBackground(worldWidth, worldHeight);

    // ---- Platforms ----
    this.platforms = this.physics.add.staticGroup();
    this.crates = this.physics.add.staticGroup();

    // Ground — dark stone fortress, with lava pit gaps
    // Gaps: 1600-1720, 3000-3120, 4200-4320
    const groundGaps = [
      [1600, 1720],
      [3000, 3120],
      [4200, 4320],
    ];

    const isInGap = (x) => {
      for (const [start, end] of groundGaps) {
        if (x >= start && x < end) return true;
      }
      return false;
    };

    for (let x = 0; x < worldWidth; x += 32) {
      if (isInGap(x)) continue;
      this.platforms.create(x + 16, worldHeight - 16, 'fortress_ground');
      if (x % 64 === 0) {
        this.platforms.create(x + 16, worldHeight - 48, 'fortress_ground');
      }
    }

    // Top stone layer
    for (let x = 0; x < worldWidth; x += 32) {
      if (isInGap(x)) continue;
      this.platforms.create(x + 16, worldHeight - 48, 'fortress_platform');
    }

    // Lava pit visual indicators
    groundGaps.forEach(([start, end]) => {
      const lavaGfx = this.add.graphics();
      lavaGfx.fillStyle(0xff4400, 0.4);
      lavaGfx.fillRect(start, worldHeight - 16, end - start, 16);
      lavaGfx.setDepth(2);
      // Lava glow
      const lavaGlow = this.add.graphics();
      lavaGlow.fillStyle(0xff6600, 0.15);
      lavaGlow.fillRect(start - 10, worldHeight - 40, end - start + 20, 40);
      lavaGlow.setDepth(1);
    });

    // Floating platforms — fortress architecture
    const floats = [
      { x: 250, y: 420, count: 3 },
      { x: 450, y: 360, count: 2 },
      { x: 700, y: 300, count: 4 },
      { x: 950, y: 400, count: 3 },
      // Gates area — high walls (Cleo climb / Mochi bounce needed)
      { x: 1200, y: 350, count: 3 },
      { x: 1350, y: 280, count: 2 },
      { x: 1500, y: 220, count: 3 },
      // Over lava pit 1 (1600-1720)
      { x: 1620, y: 380, count: 4 },
      // Map piece platform (x:2000) — high up, needs Mochi bounce
      { x: 1900, y: 340, count: 3 },
      { x: 1980, y: 270, count: 4 },
      // Grand hallway section
      { x: 2200, y: 400, count: 3 },
      { x: 2400, y: 340, count: 4 },
      { x: 2600, y: 280, count: 3 },
      { x: 2800, y: 360, count: 2 },
      // Over lava pit 2 (3000-3120) — speed section (Boots sprint)
      { x: 3020, y: 370, count: 4 },
      { x: 3200, y: 320, count: 3 },
      { x: 3400, y: 280, count: 4 },
      { x: 3600, y: 350, count: 3 },
      // Breakable wall section (Whiskers pounce needed)
      { x: 3800, y: 400, count: 2 },
      { x: 3900, y: 300, count: 3 },
      // Over lava pit 3 (4200-4320)
      { x: 4220, y: 380, count: 4 },
      { x: 4400, y: 320, count: 3 },
      { x: 4600, y: 280, count: 4 },
      // Dark zone platforms
      { x: 4800, y: 350, count: 3 },
      { x: 5000, y: 300, count: 4 },
      { x: 5200, y: 260, count: 3 },
      // Throne room approach
      { x: 5400, y: 380, count: 3 },
      { x: 5600, y: 340, count: 4 },
      { x: 5800, y: 300, count: 3 },
      { x: 6000, y: 360, count: 4 },
      { x: 6200, y: 320, count: 3 },
      { x: 6500, y: 380, count: 4 },
    ];

    floats.forEach(p => {
      for (let i = 0; i < p.count; i++) {
        this.platforms.create(p.x + i * 32, p.y, 'fortress_platform');
      }
    });

    // Breakable crates
    const cratePositions = [
      { x: 400, y: worldHeight - 80 },
      { x: 1100, y: worldHeight - 80 },
      { x: 1800, y: worldHeight - 80 },
      { x: 2500, y: worldHeight - 80 },
      { x: 3300, y: worldHeight - 80 },
      { x: 3900, y: worldHeight - 80 },
      { x: 4500, y: worldHeight - 80 },
      { x: 5200, y: worldHeight - 80 },
    ];

    cratePositions.forEach(pos => {
      const crate = this.crates.create(pos.x, pos.y, 'crate');
      crate.setData('health', 2);
    });

    // ---- Fortress decorations ----
    this.createFortressDecorations(worldWidth, worldHeight);

    // ---- Dark Zones ----
    this.darkZones = [
      { x: 2600, width: 500 },
      { x: 4700, width: 600 },
    ];

    this.createDarknessOverlay(worldWidth, worldHeight);

    // ---- Hidden Paths (only visible with Night Vision) ----
    this.hiddenPaths = this.physics.add.staticGroup();
    this.hiddenPathSprites = [];

    // Hidden platforms in dark zone 1
    const hiddenPlats1 = [
      { x: 2700, y: 340, count: 3 },
      { x: 2850, y: 280, count: 2 },
      { x: 2950, y: 240, count: 3 },
    ];

    // Hidden platforms in dark zone 2
    const hiddenPlats2 = [
      { x: 4800, y: 330, count: 2 },
      { x: 4950, y: 280, count: 3 },
      { x: 5100, y: 240, count: 2 },
    ];

    [...hiddenPlats1, ...hiddenPlats2].forEach(p => {
      for (let i = 0; i < p.count; i++) {
        const plat = this.hiddenPaths.create(p.x + i * 32, p.y, 'fortress_platform');
        plat.setAlpha(0);  // Invisible until Night Vision
        plat.setData('hidden', true);
        this.hiddenPathSprites.push(plat);
      }
    });

    // ---- Player ----
    const charTextureMap = {
      'whiskers': 'cat_whiskers_f0',
      'luna': 'cat_luna_f0',
      'boots': 'cat_boots_f0',
      'cleo': 'cat_cleo_f0',
      'mochi': 'cat_mochi_f0',
    };
    const charTexture = charTextureMap[this.playerState.activeChar] || 'cat_whiskers_f0';
    this.player = this.physics.add.sprite(80, worldHeight - 120, charTexture);
    this.player.setCollideWorldBounds(true);
    this.player.setBounce(0);
    this.player.setScale(1.5);
    this.player.body.setSize(20, 22);
    this.player.body.setOffset(14, 14);
    this.player.setDepth(10);
    this.player.setFlipX(true); // Cat is drawn facing left, flip to face right at start

    // ---- Collectibles ----
    this.tunas = this.physics.add.group();
    this.waters = this.physics.add.group();
    this.mapPieces = this.physics.add.group();

    // Tuna spread (20 positions)
    const tunaX = [100, 300, 500, 750, 1000, 1250, 1500, 1750, 2100, 2350, 2600, 2900, 3200, 3500, 3800, 4100, 4500, 4900, 5300, 5700];
    tunaX.forEach(x => {
      const t = this.tunas.create(x, worldHeight - 90, 'tuna');
      t.body.setAllowGravity(false);
      this.addFloatAnimation(t);
    });

    // Water (12 positions)
    const waterX = [200, 600, 900, 1350, 1700, 2200, 2700, 3100, 3600, 4300, 4800, 5500];
    waterX.forEach(x => {
      const w = this.waters.create(x, worldHeight - 85, 'water');
      w.body.setAllowGravity(false);
      this.addFloatAnimation(w);
    });

    // Map piece 7/7 — just inside the gates area, on a high platform
    this.mapPiece = this.mapPieces.create(2000, 300, 'map_piece');
    this.mapPiece.body.setAllowGravity(false);
    this.mapPiece.setScale(1.5);
    this.addFloatAnimation(this.mapPiece);
    this.addGlowEffect(this.mapPiece);

    // ---- NPCs ----
    this.npcs = this.physics.add.staticGroup();

    // Fortress Mouse outside the gates
    const fortressMouse = this.npcs.create(600, worldHeight - 68, 'npc_cat');
    fortressMouse.setScale(0.8);
    fortressMouse.setTint(0x998877);
    fortressMouse.setData('name', 'Fortress Mouse');
    fortressMouse.setData('dialogIndex', 0);
    fortressMouse.setData('dialogs', [
      { speaker: 'Fortress Mouse', text: "You're going IN there?!" },
      { speaker: 'Fortress Mouse', text: "The Dog King has a throne made of BONES and he sleeps on a bed of LAVA!" },
      { speaker: 'Whiskers', text: "At this point, I'll believe it when I see it. Come on, team." },
    ]);
    this.addExclamation(fortressMouse);

    // King Biscuit in the throne room — static NPC, NOT an enemy
    this.kingBiscuit = this.physics.add.staticImage(5500, worldHeight - 70, 'king_biscuit');
    this.kingBiscuit.setScale(1.5);
    this.kingBiscuit.setDepth(10);

    // Crown/throne label
    this.add.text(5500, worldHeight - 140, 'The Throne Room', {
      fontSize: '16px', fontFamily: 'Georgia, serif',
      color: '#ffcc44', fontStyle: 'italic',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(4);

    // ---- Enemies ----
    this.enemies = this.physics.add.group();

    // Fortress guards (ground patrol)
    const guardPositions = [
      { x: 800, y: worldHeight - 80, patrolRange: 120 },
      { x: 1300, y: worldHeight - 80, patrolRange: 100 },
      { x: 1900, y: worldHeight - 80, patrolRange: 130 },
      { x: 2400, y: worldHeight - 80, patrolRange: 100 },
      { x: 3200, y: worldHeight - 80, patrolRange: 110 },
      { x: 3700, y: worldHeight - 80, patrolRange: 90 },
      { x: 4400, y: worldHeight - 80, patrolRange: 100 },
      { x: 5000, y: worldHeight - 80, patrolRange: 120 },
    ];

    guardPositions.forEach(pos => {
      const enemy = this.enemies.create(pos.x, pos.y, 'fortress_guard');
      enemy.setScale(1.2);
      enemy.setBounce(0);
      enemy.setCollideWorldBounds(true);
      enemy.setData('startX', pos.x);
      enemy.setData('patrolRange', pos.patrolRange);
      enemy.setData('direction', 1);
      enemy.setData('type', 'fortress_guard');
      enemy.setVelocityX(50);
    });

    // Fortress bats (flying, sine wave)
    this.fortressBats = [];
    const batPositions = [500, 1400, 2100, 2800, 3500, 4100, 4800, 5600];
    batPositions.forEach(x => {
      const bat = this.enemies.create(x, 200, 'fortress_bat');
      bat.setScale(1.3);
      bat.body.setAllowGravity(false);
      bat.setData('startX', x);
      bat.setData('startY', 200);
      bat.setData('type', 'fortress_bat');
      bat.setData('time', Math.random() * Math.PI * 2);
      this.fortressBats.push(bat);
    });

    // ---- Torch flame particles (ambient) ----
    this.createTorchFlames(worldWidth, worldHeight);

    // ---- Fireflies in dark zones ----
    this.createFireflies();

    // ---- Colliders ----
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.player, this.crates);
    this.physics.add.collider(this.player, this.hiddenPaths);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.collider(this.enemies, this.crates, null, (enemy) => {
      return enemy.getData('type') !== 'fortress_bat';
    }, this);

    this.physics.add.overlap(this.player, this.tunas, this.collectTuna, null, this);
    this.physics.add.overlap(this.player, this.waters, this.collectWater, null, this);
    this.physics.add.overlap(this.player, this.mapPieces, this.collectMapPiece, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, null, this);

    // ---- Controls ----
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyX = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.keyShift = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.keyTab = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyV = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.V);

    // ---- Camera ----
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.fadeIn(1000);

    // ---- UI ----
    this.scene.launch('UIScene', { playerState: this.playerState, levelKey: 'Level7Scene' });

    // ---- Vitals drain ----
    this.drainTimer = this.time.addEvent({
      delay: 1000,
      callback: this.drainVitals,
      callbackScope: this,
      loop: true
    });

    // ---- Intro dialog ----
    this.time.delayedCall(500, () => {
      this.showDialog([
        { speaker: 'Luna', text: "It's... it's real. It's actually real." },
        { speaker: 'Cleo', text: "I'm not scared." },
        { speaker: 'Boots', text: "Me neither." },
        { speaker: 'Mochi', text: "I'm a little scared. But mostly hungry." },
        { speaker: 'Whiskers', text: "This is it, team. Let's find that last map piece and end this." },
      ]);
    });

    this.nearbyNpc = null;
  }

  // ---- BACKGROUND ----
  createFortressBackground(worldWidth, worldHeight) {
    // Dark stormy sky
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x1a1020, 0x1a1020);
    sky.fillRect(0, 0, 1024, worldHeight);
    sky.setScrollFactor(0);
    sky.setDepth(-10);

    // Storm clouds
    const clouds = this.add.graphics();
    clouds.setScrollFactor(0.05);
    clouds.setDepth(-9);
    clouds.fillStyle(0x222233, 0.7);
    for (let i = 0; i < 20; i++) {
      const cx = Math.random() * worldWidth;
      const cy = 20 + Math.random() * 80;
      const cw = 80 + Math.random() * 100;
      const ch = 25 + Math.random() * 20;
      clouds.fillEllipse(cx, cy, cw, ch);
      clouds.fillEllipse(cx + cw * 0.3, cy - 5, cw * 0.6, ch * 0.7);
    }

    // Distant dark stone towers
    const farTowers = this.add.graphics();
    farTowers.setScrollFactor(0.1);
    farTowers.setDepth(-8);
    farTowers.fillStyle(0x1a1a2a, 0.8);
    for (let i = 0; i < worldWidth / 150; i++) {
      const tx = i * 150 + Math.random() * 40;
      const tw = 30 + Math.random() * 20;
      const th = 100 + Math.random() * 150;
      farTowers.fillRect(tx - tw / 2, worldHeight - 60 - th, tw, th);
      // Battlements
      farTowers.fillRect(tx - tw / 2 - 5, worldHeight - 60 - th - 10, tw + 10, 10);
    }

    // Mid-range walls
    const midWalls = this.add.graphics();
    midWalls.setScrollFactor(0.3);
    midWalls.setDepth(-7);
    midWalls.fillStyle(0x2a2030, 0.6);
    for (let i = 0; i < worldWidth / 200; i++) {
      const wx = i * 200 + Math.random() * 60;
      const ww = 60 + Math.random() * 40;
      const wh = 80 + Math.random() * 100;
      midWalls.fillRect(wx - ww / 2, worldHeight - 50 - wh, ww, wh);
    }

    // Iron gate visual (near start)
    const gate = this.add.graphics();
    gate.setDepth(3);
    gate.fillStyle(0x3a3a4a, 0.9);
    gate.fillRect(1000, worldHeight - 200, 20, 150);
    gate.fillRect(1100, worldHeight - 200, 20, 150);
    gate.fillRect(990, worldHeight - 210, 140, 20);
    // Gate bars
    gate.fillStyle(0x555566, 0.7);
    for (let i = 0; i < 5; i++) {
      gate.fillRect(1025 + i * 16, worldHeight - 195, 4, 140);
    }

    // Fog layer
    const fog = this.add.graphics();
    fog.setScrollFactor(0.15);
    fog.setDepth(-6);
    fog.fillStyle(0x221122, 0.2);
    for (let i = 0; i < worldWidth / 100; i++) {
      const fx = i * 100 + Math.random() * 40;
      fog.fillEllipse(fx, worldHeight - 80, 100 + Math.random() * 60, 30 + Math.random() * 20);
    }

    // Ambient mist
    const mist = this.add.graphics();
    mist.setScrollFactor(0.05);
    mist.setDepth(5);
    mist.fillStyle(0x332244, 0.08);
    for (let i = 0; i < 20; i++) {
      mist.fillEllipse(Math.random() * worldWidth, worldHeight - 100 + Math.random() * 60, 80 + Math.random() * 100, 20 + Math.random() * 15);
    }

    // Warm glow near throne room (x:5000+)
    const warmGlow = this.add.graphics();
    warmGlow.setDepth(-5);
    warmGlow.fillStyle(0x443322, 0.15);
    warmGlow.fillRect(5000, 0, 2000, worldHeight);
  }

  createFortressDecorations(worldWidth, worldHeight) {
    // Fortress wall torches
    for (let i = 0; i < worldWidth / 400; i++) {
      const tx = i * 400 + Math.random() * 100 + 100;
      const torch = this.add.image(tx, worldHeight - 120, 'tree_trunk');
      torch.setDepth(3);
      torch.setAlpha(0.6);
      torch.setTint(0x554433);
      torch.setScale(0.5, 1);
    }

    // Throne room label
    this.add.text(5500, worldHeight - 200, 'Throne Room', {
      fontSize: '18px', fontFamily: 'Georgia, serif',
      color: '#ffcc44', fontStyle: 'italic',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(4);

    // Fortress gate label
    this.add.text(1050, worldHeight - 230, "Dog King's Fortress", {
      fontSize: '14px', fontFamily: 'Georgia, serif',
      color: '#aa8866', fontStyle: 'italic',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(4);
  }

  createTorchFlames(worldWidth, worldHeight) {
    this.torchFlames = [];
    const torchX = [200, 600, 1000, 1400, 1800, 2200, 2600, 3000, 3400, 3800, 4200, 4600, 5000, 5400, 5800, 6200, 6600];
    torchX.forEach(x => {
      const flame = this.add.graphics();
      flame.fillStyle(0xff6600, 0.6);
      flame.fillCircle(0, 0, 5);
      flame.setPosition(x, worldHeight - 130);
      flame.setDepth(6);

      this.tweens.add({
        targets: flame,
        y: flame.y - 8,
        alpha: { from: 0.4, to: 0.9 },
        duration: 400 + Math.random() * 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      this.torchFlames.push(flame);
    });
  }

  createFireflies() {
    this.fireflies = [];
    this.darkZones.forEach(zone => {
      for (let i = 0; i < 12; i++) {
        const ff = this.add.image(
          zone.x + Math.random() * zone.width,
          100 + Math.random() * 350,
          'firefly'
        );
        ff.setDepth(6);
        ff.setAlpha(0);

        this.tweens.add({
          targets: ff,
          x: ff.x + Phaser.Math.Between(-30, 30),
          y: ff.y + Phaser.Math.Between(-20, 20),
          duration: 3000 + Math.random() * 2000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });

        this.tweens.add({
          targets: ff,
          alpha: { from: 0.2, to: 0.8 },
          duration: 1000 + Math.random() * 1000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
          delay: Math.random() * 2000
        });

        this.fireflies.push(ff);
      }
    });
  }

  // ---- DARKNESS SYSTEM ----
  createDarknessOverlay(worldWidth, worldHeight) {
    this.darkOverlay = this.add.graphics();
    this.darkOverlay.setDepth(8);
    this.updateDarknessOverlay();
  }

  updateDarknessOverlay() {
    this.darkOverlay.clear();

    if (this.nightVisionActive && this.playerState.activeChar === 'luna') {
      return;
    }

    this.darkZones.forEach(zone => {
      const alpha = this.nightVisionActive ? 0.3 : 0.85;
      this.darkOverlay.fillStyle(0x000011, alpha);
      this.darkOverlay.fillRect(zone.x, 0, zone.width, 576);
    });
  }

  isPlayerInDarkZone() {
    for (const zone of this.darkZones) {
      if (this.player.x >= zone.x && this.player.x <= zone.x + zone.width) {
        return true;
      }
    }
    return false;
  }

  updateHiddenPaths() {
    const visible = this.nightVisionActive && this.playerState.activeChar === 'luna';

    this.hiddenPathSprites.forEach(plat => {
      if (visible) {
        plat.setAlpha(0.7);
        plat.setTint(0x44ff44);
      } else {
        plat.setAlpha(0);
      }
    });
  }

  toggleNightVision() {
    if (this.playerState.activeChar !== 'luna') {
      this.showQuickMessage("Only Luna can use Night Vision!", 0xff4444);
      return;
    }

    this.nightVisionActive = !this.nightVisionActive;

    if (this.nightVisionActive) {
      this.showQuickMessage("Night Vision ON!", 0x44ff44);
      this.player.setTint(0x44ff44);
      this.time.delayedCall(300, () => this.player.clearTint());
    } else {
      this.showQuickMessage("Night Vision OFF", 0xff8844);
    }

    this.updateDarknessOverlay();
    this.updateHiddenPaths();
  }

  // ---- CHARACTER SWITCHING ----
  switchCharacter() {
    if (this.playerState.party.length < 2) return;

    const currentIdx = this.playerState.party.indexOf(this.playerState.activeChar);
    const nextIdx = (currentIdx + 1) % this.playerState.party.length;
    this.playerState.activeChar = this.playerState.party[nextIdx];

    // Swap sprite texture
    const sheetMap = {
      'whiskers': 'cat_whiskers_f0',
      'luna': 'cat_luna_f0',
      'boots': 'cat_boots_f0',
      'cleo': 'cat_cleo_f0',
      'mochi': 'cat_mochi_f0',
    };
    this.player.setTexture(sheetMap[this.playerState.activeChar]);

    // Re-apply physics body size after texture swap (setTexture resets it)
    this.player.body.setSize(20, 22);
    this.player.body.setOffset(14, 14);

    // Brief flash effect on switch
    this.player.setTint(0xaa88ff);
    this.time.delayedCall(200, () => this.player.clearTint());

    const charNames = { 'whiskers': 'Whiskers', 'luna': 'Luna', 'boots': 'Boots', 'cleo': 'Cleo', 'mochi': 'Mochi' };
    this.showQuickMessage(`Switched to ${charNames[this.playerState.activeChar]}!`, 0xaa88ff);

    // Update darkness based on character
    this.updateDarknessOverlay();
    this.updateHiddenPaths();
  }

  // ---- MOCHI'S BELLY BOUNCE ABILITY ----
  bellyBounce() {
    if (this.playerState.activeChar !== 'mochi') {
      this.showQuickMessage("Only Mochi can use Belly Bounce!", 0xff4444);
      return;
    }

    const onGround = this.player.body.blocked.down;
    if (!onGround) {
      this.showQuickMessage("Need to be on the ground!", 0xff8844);
      return;
    }

    this.showQuickMessage("BELLY BOUNCE!", 0xff8800);
    this.player.setVelocityY(-700);

    // Brief orange flash on player
    this.player.setTint(0xff8800);
    this.time.delayedCall(400, () => this.player.clearTint());
  }

  // ---- BOOTS SPRINT ABILITY ----
  bootsSprint() {
    if (this.playerState.activeChar !== 'boots') {
      this.showQuickMessage("Only Boots can use Super Sprint!", 0xff4444);
      return;
    }

    if (!this.sprintReady) {
      this.showQuickMessage("Sprint recharging...", 0xff8844);
      return;
    }

    this.sprintActive = true;
    this.sprintReady = false;
    this.showQuickMessage("SUPER SPRINT!", 0xff8800);

    // Brief orange flash on player
    this.player.setTint(0xff8800);

    // Sprint lasts 3 seconds
    this.time.delayedCall(3000, () => {
      this.sprintActive = false;
      this.player.clearTint();
      this.showQuickMessage("Sprint ended", 0xffaa44);
    });

    // 5 second cooldown
    this.time.delayedCall(5000, () => {
      this.sprintReady = true;
      this.showQuickMessage("Sprint ready!", 0x44ff44);
    });
  }

  // ---- THRONE ROOM FINALE ----
  triggerThroneRoom() {
    if (this.throneRoomTriggered) return;
    this.throneRoomTriggered = true;

    this.showDialog([
      { speaker: 'Whiskers', text: "Dog King! We've come to\u2014" },
      { speaker: 'Whiskers', text: "............" },
      { speaker: 'Whiskers', text: "You're... the Dog King?" },
      { speaker: 'King Biscuit', text: "Oh! Oh my! Visitors! I never get visitors! Are you here to be my friends?!" },
      { speaker: 'King Biscuit', text: "That's me! King Biscuit! Do you like my throne? It was here when I moved in. It's way too big for me but it's comfy." },
      { speaker: 'Cleo', text: "YOU ate a fishing boat?!" },
      { speaker: 'King Biscuit', text: "A fishing boat?! I can barely finish a biscuit! That's why they call me Biscuit!" },
      { speaker: 'Boots', text: "But your army \u2014 the squirrels, the raccoons \u2014 they've been stealing all the fish!" },
      { speaker: 'King Biscuit', text: "They WHAT?! I didn't tell them to do that! They said they were 'gathering supplies.' I thought they were picking berries!" },
      { speaker: 'King Biscuit', text: "Oh no, oh no, oh no..." },
      { speaker: 'Luna', text: "I... I think he's telling the truth." },
      { speaker: 'Mochi', text: "Yeah. Nobody cries like that and fakes it. Trust me, I'm an emotional eater \u2014 I know real tears." },
      { speaker: 'Whiskers', text: "What if nobody had to steal? What if we shared?" },
      { speaker: 'King Biscuit', text: "You mean... we could all be FRIENDS?!" },
      { speaker: 'Whiskers', text: "That's exactly what I mean." },
    ]);

    // After the throne room dialog closes, trigger the resolution/ending
    // DialogScene will resume this scene when done
    this.events.once('resume', () => {
      this.time.delayedCall(1000, () => {
        this.showDialog([
          { speaker: 'Grandma Mittens', text: "And so, Whiskers and his friends didn't defeat the Dog King." },
          { speaker: 'Grandma Mittens', text: "They did something much braver \u2014 they listened." },
          { speaker: 'Grandma Mittens', text: "And they learned that the scariest monster is usually just someone who needs a friend." },
          { speaker: 'Whiskers', text: "THE END" },
          { speaker: 'King Biscuit', text: "*tiny yip*" },
        ]);

        // After resolution dialog closes, trigger the ending
        this.events.once('resume', () => {
          this.triggerEnding();
        });
      });
    });
  }

  triggerEnding() {
    // Fade to black
    this.cameras.main.fadeOut(2000, 0, 0, 0);

    this.time.delayedCall(2500, () => {
      // Play victory music
      this.sound.stopAll();
      this.sound.play('victory', { loop: false, volume: 0.5 });

      // Show THE END text
      const endBg = this.add.graphics();
      endBg.fillStyle(0x000000, 1);
      endBg.fillRect(0, 0, 1024, 576);
      endBg.setScrollFactor(0);
      endBg.setDepth(100);

      const endText = this.add.text(512, 220, 'THE END', {
        fontSize: '64px',
        fontFamily: 'Georgia, serif',
        color: '#ffd700',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 6
      }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

      const subtitleText = this.add.text(512, 300, 'Paws of Destiny', {
        fontSize: '28px',
        fontFamily: 'Georgia, serif',
        color: '#ffffff',
        fontStyle: 'italic',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

      const thanksText = this.add.text(512, 380, 'Thank you for playing!', {
        fontSize: '18px',
        fontFamily: 'Arial, sans-serif',
        color: '#aaaaaa',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

      const returnText = this.add.text(512, 450, 'Click anywhere to return to the title screen', {
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif',
        color: '#888888',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

      // Fade in the end screen
      endText.setAlpha(0);
      subtitleText.setAlpha(0);
      thanksText.setAlpha(0);
      returnText.setAlpha(0);

      this.tweens.add({ targets: endText, alpha: 1, duration: 1500, delay: 500 });
      this.tweens.add({ targets: subtitleText, alpha: 1, duration: 1500, delay: 1000 });
      this.tweens.add({ targets: thanksText, alpha: 1, duration: 1500, delay: 1500 });
      this.tweens.add({ targets: returnText, alpha: 1, duration: 1500, delay: 2500 });

      // Click to return to title
      this.time.delayedCall(3000, () => {
        this.input.once('pointerdown', () => {
          this.sound.stopAll();
          this.scene.stop('UIScene');
          this.scene.start('TitleScene');
        });
      });
    });
  }

  // ---- STANDARD METHODS ----

  addFloatAnimation(sprite) {
    this.tweens.add({
      targets: sprite,
      y: sprite.y - 6,
      duration: 1200 + Math.random() * 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  addGlowEffect(sprite) {
    this.tweens.add({
      targets: sprite,
      alpha: 0.6,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  addExclamation(npc) {
    const mark = this.add.image(npc.x, npc.y - 40, 'exclamation');
    mark.setDepth(11);
    npc.setData('exclamation', mark);
    this.tweens.add({
      targets: mark,
      y: npc.y - 48,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  update() {
    if (this.playerState.isExhausted) {
      this.player.setVelocityX(0);
      return;
    }

    const onGround = this.player.body.blocked.down;
    const isMochi = this.playerState.activeChar === 'mochi';
    const isCleo = this.playerState.activeChar === 'cleo';
    const isBoots = this.playerState.activeChar === 'boots';
    const isLuna = this.playerState.activeChar === 'luna';

    // Speed calculation — Boots sprint = 3x, normal run = 1.6x
    let speed = this.playerState.speed;
    if (this.sprintActive && isBoots) {
      speed = this.playerState.speed * 3;
    } else if (this.playerState.isRunning) {
      speed = this.playerState.speed * 1.6;
    }

    // Movement (cat is drawn facing left, so flipX=false=left, flipX=true=right)
    const leftDown = this.cursors.left.isDown || this.keyA.isDown;
    const rightDown = this.cursors.right.isDown || this.keyD.isDown;

    if (leftDown) {
      this.player.setVelocityX(-speed);
      this.player.setFlipX(false);
      this.playerState.facingRight = false;
    } else if (rightDown) {
      this.player.setVelocityX(speed);
      this.player.setFlipX(true);
      this.playerState.facingRight = true;
    } else {
      this.player.setVelocityX(0);
    }

    this.playerState.isRunning = this.keyShift.isDown && (leftDown || rightDown);

    // Animations
    const moving = leftDown || rightDown;
    const animPrefix = isMochi ? 'mochi' : isCleo ? 'cleo' : isBoots ? 'boots' : isLuna ? 'luna' : 'whiskers';
    if (!onGround) {
      this.player.anims.stop();
    } else if (moving) {
      const walkAnim = `${animPrefix}_walk`;
      if (!this.player.anims.isPlaying || this.player.anims.currentAnim?.key !== walkAnim) {
        this.player.play(walkAnim);
      }
      this.player.anims.msPerFrame = this.playerState.isRunning || this.sprintActive ? 80 : 125;
    } else {
      this.player.play(`${animPrefix}_idle`, true);
    }

    // Jump
    if (Phaser.Input.Keyboard.JustDown(this.cursors.space) && onGround) {
      this.player.setVelocityY(this.playerState.jumpPower);
    }

    // Pounce (X)
    if (Phaser.Input.Keyboard.JustDown(this.keyX) && this.playerState.pounceReady && onGround) {
      this.pounceAttack();
    }

    // Switch character (TAB)
    if (Phaser.Input.Keyboard.JustDown(this.keyTab)) {
      this.switchCharacter();
    }

    // W key — Mochi Belly Bounce or Boots Sprint
    if (Phaser.Input.Keyboard.JustDown(this.keyW)) {
      if (isMochi) {
        this.bellyBounce();
      } else if (isBoots) {
        this.bootsSprint();
      } else {
        this.showQuickMessage("W: Mochi's Belly Bounce / Boots' Sprint", 0xffaa44);
      }
    }

    // Night Vision (V)
    if (Phaser.Input.Keyboard.JustDown(this.keyV)) {
      this.toggleNightVision();
    }

    // NPC interaction (E)
    this.checkNpcProximity();
    if (Phaser.Input.Keyboard.JustDown(this.keyE) && this.nearbyNpc) {
      this.interactWithNpc(this.nearbyNpc);
    }

    // Check King Biscuit throne room proximity
    if (!this.throneRoomTriggered && this.kingBiscuit && this.kingBiscuit.active) {
      const distToKing = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.kingBiscuit.x, this.kingBiscuit.y);
      if (distToKing < 100) {
        this.triggerThroneRoom();
      }
    }

    // Enemy patrol AI
    this.enemies.children.each(enemy => {
      if (!enemy.active) return;
      const type = enemy.getData('type');

      if (type === 'fortress_bat') {
        // Flying sine wave pattern
        const t = enemy.getData('time') + 0.02;
        enemy.setData('time', t);
        const startX = enemy.getData('startX');
        const startY = enemy.getData('startY');
        enemy.x = startX + Math.sin(t) * 80;
        enemy.y = startY + Math.cos(t * 0.7) * 40;
        enemy.body.reset(enemy.x, enemy.y);
      } else {
        // Ground patrol
        if (enemy.y > 590) { enemy.destroy(); return; }

        const startX = enemy.getData('startX');
        const range = enemy.getData('patrolRange');
        let dir = enemy.getData('direction') || 1;

        if (enemy.x > startX + range) dir = -1;
        else if (enemy.x < startX - range) dir = 1;

        if (dir === 1 && enemy.body.blocked.right) dir = -1;
        else if (dir === -1 && enemy.body.blocked.left) dir = 1;

        if (enemy.body.blocked.down) {
          const lookX = enemy.x + (dir * 24);
          const lookY = enemy.y + 32;
          let groundAhead = false;
          this.platforms.children.each(plat => {
            const b = plat.getBounds();
            if (lookX >= b.left && lookX <= b.right && lookY >= b.top && lookY <= b.bottom + 20) {
              groundAhead = true;
            }
          });
          if (!groundAhead) dir = -dir;
        }

        enemy.setData('direction', dir);
        enemy.setVelocityX(dir * 50);
        enemy.setFlipX(dir === -1);
      }
    });

    // Dark zone warning
    if (this.isPlayerInDarkZone() && !this.nightVisionActive && !this._darkWarnShown) {
      if (this.playerState.party.includes('luna')) {
        this.showQuickMessage("It's dark! Switch to Luna (TAB) and use Night Vision (V)!", 0xaa88ff);
      } else {
        this.showQuickMessage("It's too dark to see...", 0xff8844);
      }
      this._darkWarnShown = true;
      this.time.delayedCall(10000, () => { this._darkWarnShown = false; });
    }

    // Update darkness overlay
    this.updateDarknessOverlay();

    // Fall into lava pit
    if (this.player.y > 560 && !this.player.getData('pitCooldown')) {
      this.player.setData('pitCooldown', true);
      this.loseLife("Fell in a pit!", Math.max(100, this.player.x - 100), 400);
    }
  }

  pounceAttack() {
    this.playerState.isPouncing = true;
    this.playerState.pounceReady = false;

    this.player.setTint(0xffaa00);
    const pounceX = this.playerState.facingRight ? this.player.x + 30 : this.player.x - 30;
    const effect = this.add.image(pounceX, this.player.y + 10, 'pounce_effect');
    effect.setScale(1.5);
    effect.setAlpha(0.7);

    this.tweens.add({
      targets: effect,
      alpha: 0,
      scale: 2.5,
      duration: 300,
      onComplete: () => effect.destroy()
    });

    // Check crates
    let hitSolid = false;
    this.crates.children.each(crate => {
      if (!crate.active) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, crate.x, crate.y);
      if (dist < 60) {
        hitSolid = true;
        const hp = crate.getData('health') - 1;
        crate.setData('health', hp);
        crate.setTint(0xff6666);
        this.time.delayedCall(100, () => { if (crate.active) crate.clearTint(); });
        if (hp <= 0) this.breakCrate(crate);
      }
    });

    // Bounce back if hit something solid, otherwise lunge forward
    if (hitSolid) {
      const knockback = this.playerState.facingRight ? -150 : 150;
      this.player.setVelocityX(knockback);
      this.player.setVelocityY(-200);
    } else {
      const lungeVel = this.playerState.facingRight ? 200 : -200;
      this.player.setVelocityX(lungeVel);
      this.player.setVelocityY(-100);
    }

    // Scare enemies
    this.enemies.children.each(enemy => {
      if (!enemy.active) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (dist < 80) this.scareEnemy(enemy);
    });

    this.time.delayedCall(200, () => {
      this.player.clearTint();
      this.playerState.isPouncing = false;
    });

    this.time.delayedCall(this.playerState.pounceCooldown, () => {
      this.playerState.pounceReady = true;
    });
  }

  breakCrate(crate) {
    for (let i = 0; i < 8; i++) {
      const p = this.add.image(crate.x, crate.y, 'wood_particle');
      p.setScale(Phaser.Math.FloatBetween(0.8, 1.5));
      this.tweens.add({
        targets: p,
        x: crate.x + Phaser.Math.Between(-50, 50),
        y: crate.y + Phaser.Math.Between(-60, -10),
        alpha: 0,
        angle: Phaser.Math.Between(-180, 180),
        duration: 500,
        ease: 'Power2',
        onComplete: () => p.destroy()
      });
    }
    if (Math.random() < 0.6) {
      const bonus = this.tunas.create(crate.x, crate.y - 20, 'tuna');
      bonus.body.setAllowGravity(false);
      this.addFloatAnimation(bonus);
    }
    crate.destroy();
    this.showQuickMessage("Smashed!", 0xffaa00);
  }

  scareEnemy(enemy) {
    const runDir = enemy.x > this.player.x ? 1 : -1;
    enemy.setVelocityX(runDir * 300);
    enemy.setVelocityY(-200);
    enemy.setTint(0xffaaaa);
    this.tweens.add({
      targets: enemy,
      alpha: 0,
      duration: 800,
      onComplete: () => enemy.destroy()
    });
    const type = enemy.getData('type');
    const name = type === 'fortress_bat' ? 'Fortress Bat' : 'Fortress Guard';
    this.showQuickMessage(`${name} scared away!`, 0x44ff44);
  }

  hitEnemy(player, enemy) {
    if (this.playerState.isPouncing) {
      this.scareEnemy(enemy);
      return;
    }
    if (player.getData('invulnerable')) return;

    // Final level enemies do 15 damage
    this.playerState.health = Math.max(0, this.playerState.health - 15);
    if (this.playerState.health <= 0) {
      this.loseLife("KO'd by enemy!", player.x, player.y);
      return;
    }
    this.events.emit('updateVitals', this.playerState);
    player.setData('invulnerable', true);
    player.setTint(0xff0000);

    const knockDir = player.x > enemy.x ? 150 : -150;
    player.setVelocityX(knockDir);
    player.setVelocityY(-200);

    this.showQuickMessage("-15 HP!", 0xff4444);

    this.tweens.add({
      targets: player,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        player.setAlpha(1);
        player.clearTint();
        player.setData('invulnerable', false);
      }
    });
  }

  loseLife(message, respawnX, respawnY) {
    respawnX = respawnX || 100;
    respawnY = respawnY || 400;
    this.playerState.lives = Math.max(0, (this.playerState.lives || 1) - 1);
    this.playerState.health = this.playerState.maxHealth;
    this.player.setPosition(respawnX, respawnY);
    this.player.setVelocity(0, 0);
    this.player.setData('invulnerable', true);
    this.player.setTint(0xff4444);
    this.tweens.add({
      targets: this.player,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        this.player.setAlpha(1);
        this.player.clearTint();
        this.player.setData('invulnerable', false);
        this.player.setData('pitCooldown', false);
      }
    });
    if (this.playerState.lives > 0) {
      this.showQuickMessage(`${message} Lives: ${this.playerState.lives} left!`, 0xff4444);
    }
    this.events.emit('updateVitals', this.playerState);
  }

  collectTuna(player, tuna) {
    const tx = tuna.x, ty = tuna.y;
    tuna.destroy();
    this.playerState.hunger = Math.min(100, this.playerState.hunger + 25);
    this.playerState.tunasCollected++;
    this.showQuickMessage("+25 Hunger!", 0x4a90d9);
    this.collectEffect(tx, ty, 0x4a90d9);
    try { this.sound.play('tunapickup', { volume: 0.6 }); } catch(e) {}
  }

  collectWater(player, water) {
    const wx = water.x, wy = water.y;
    water.destroy();
    this.playerState.thirst = Math.min(100, this.playerState.thirst + 30);
    this.playerState.watersCollected++;
    this.showQuickMessage("+30 Thirst!", 0x4fc3f7);
    this.collectEffect(wx, wy, 0x4fc3f7);
    try { this.sound.play('waterpickup', { volume: 0.6 }); } catch(e) {}
  }

  collectMapPiece(player, piece) {
    const px = piece.x, py = piece.y;
    piece.destroy();
    this.playerState.mapPieces++;
    this.showQuickMessage("MAP PIECE FOUND! (7/7)", 0xffd700);
    this.collectEffect(px, py, 0xffd700);

    this.time.delayedCall(1000, () => {
      this.showDialog([
        { speaker: 'Whiskers', text: "The last piece! The Puzzle Map is complete!" },
        { speaker: 'Luna', text: "It's pointing to... the throne room. Straight ahead." },
        { speaker: 'Whiskers', text: "Let's finish this." },
      ]);
    });
  }

  collectEffect(x, y, color) {
    for (let i = 0; i < 6; i++) {
      const spark = this.add.graphics();
      spark.fillStyle(color);
      spark.fillCircle(0, 0, 4);
      spark.setPosition(x, y);
      spark.setDepth(20);
      this.tweens.add({
        targets: spark,
        x: x + Phaser.Math.Between(-40, 40),
        y: y + Phaser.Math.Between(-40, -10),
        alpha: 0,
        duration: 400,
        onComplete: () => spark.destroy()
      });
    }
  }

  drainVitals() {
    const state = this.playerState;
    const isMoving = this.cursors.left.isDown || this.keyA.isDown || this.cursors.right.isDown || this.keyD.isDown;
    const hasPendant = state.accessories.includes('fish_pendant');

    let hungerDrain = 0.3;
    let thirstDrain = 0.3;

    if (isMoving && state.isRunning) {
      hungerDrain = 1.2;
      thirstDrain = 0.9;
    } else if (isMoving) {
      hungerDrain = 0.6;
      thirstDrain = 0.5;
    }

    if (hasPendant) hungerDrain *= 0.75;

    // Night Vision drains extra thirst
    if (this.nightVisionActive) {
      thirstDrain += 0.3;
    }

    // Sprint drains extra hunger
    if (this.sprintActive) {
      hungerDrain += 0.5;
      thirstDrain += 0.3;
    }

    state.hunger = Math.max(0, state.hunger - hungerDrain);
    state.thirst = Math.max(0, state.thirst - thirstDrain);

    if (state.hunger <= 0 || state.thirst <= 0) {
      if (!state.isExhausted) {
        state.isExhausted = true;
        this.player.setTint(0x999999);
        const charName = state.activeChar === 'mochi' ? 'Mochi' : state.activeChar === 'cleo' ? 'Cleo' : state.activeChar === 'boots' ? 'Boots' : state.activeChar === 'luna' ? 'Luna' : 'Whiskers';
        const msg = state.hunger <= 0 ? "So hungry... need tuna!" : "So thirsty... need water!";
        this.showDialog([
          { speaker: charName, text: msg },
          { speaker: charName, text: "I can't move until I find something..." }
        ]);
      }
    } else {
      if (state.isExhausted) {
        state.isExhausted = false;
        this.player.clearTint();
        this.showQuickMessage("Feeling better!", 0x44ff44);
      }
    }

    this.events.emit('updateVitals', state);
  }

  checkNpcProximity() {
    this.nearbyNpc = null;
    this.npcs.children.each(npc => {
      if (!npc.active) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);
      if (dist < 80) {
        this.nearbyNpc = npc;
        const mark = npc.getData('exclamation');
        if (mark) mark.setTint(0x44ff44);
      } else {
        const mark = npc.getData('exclamation');
        if (mark) mark.clearTint();
      }
    });
  }

  interactWithNpc(npc) {
    const dialogs = npc.getData('dialogs');
    const idx = npc.getData('dialogIndex');
    if (idx < dialogs.length) {
      this.showDialog(dialogs.slice(idx));
      npc.setData('dialogIndex', dialogs.length);
      const mark = npc.getData('exclamation');
      if (mark) {
        this.tweens.add({
          targets: mark,
          alpha: 0,
          duration: 300,
          onComplete: () => mark.destroy()
        });
      }
    } else {
      const name = npc.getData('name');
      this.showQuickMessage(`${name}: "Good luck in there!"`, 0xffffff);
    }
  }

  showDialog(lines) {
    this.scene.launch('DialogScene', { lines });
    this.scene.pause();
  }

  showQuickMessage(text, color = 0xffffff) {
    const msg = this.add.text(this.player.x, this.player.y - 50, text, {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#' + color.toString(16).padStart(6, '0'),
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(20);

    this.tweens.add({
      targets: msg,
      y: msg.y - 40,
      alpha: 0,
      duration: 1500,
      onComplete: () => msg.destroy()
    });
  }
}
