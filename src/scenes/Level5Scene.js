import Phaser from 'phaser';
import { PIT_THRESHOLD } from '../constants.js';

export class Level5Scene extends Phaser.Scene {
  constructor() {
    super('Level5Scene');
  }

  init(data) {
    // Carry over state from Level 4 (or use defaults if starting fresh)
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
      mapPieces: 4,
      accessories: [],
      speed: 200,
      jumpPower: -400,
      lives: 9,
      isExhausted: false,
    };
    // Party & switching state
    this.playerState.party = this.playerState.party || ['whiskers', 'luna', 'boots', 'cleo'];
    this.playerState.activeChar = this.playerState.activeChar || 'whiskers';
    this.switchesHit = 0;
    this.controlRoomOpen = false;
  }

  create() {
    const worldWidth = 6000;
    const worldHeight = 576;

    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

    // Start level 5 music
    this.sound.stopAll();
    this.sound.play('level5music', { loop: true, volume: 0.4 });

    // ---- Factory background ----
    this.createFactoryBackground(worldWidth, worldHeight);

    // ---- Platforms ----
    this.platforms = this.physics.add.staticGroup();
    this.crates = this.physics.add.staticGroup();

    // Ground
    for (let x = 0; x < worldWidth; x += 32) {
      // Pits
      if ((x > 1800 && x < 1920) || (x > 3200 && x < 3320) || (x > 4400 && x < 4520)) continue;
      this.platforms.create(x + 16, worldHeight - 16, 'factory_ground');
      if (x % 64 === 0) {
        this.platforms.create(x + 16, worldHeight - 48, 'factory_ground');
      }
    }

    // Top layer
    for (let x = 0; x < worldWidth; x += 32) {
      if ((x > 1800 && x < 1920) || (x > 3200 && x < 3320) || (x > 4400 && x < 4520)) continue;
      this.platforms.create(x + 16, worldHeight - 48, 'factory_platform');
    }

    // Floating platforms (metal grating, conveyor supports)
    const floats = [
      { x: 200, y: 420, count: 3 },
      { x: 450, y: 360, count: 2 },
      { x: 700, y: 300, count: 4 },
      { x: 950, y: 400, count: 3 },
      { x: 1200, y: 340, count: 4 },
      { x: 1450, y: 280, count: 3 },
      { x: 1700, y: 380, count: 2 },
      { x: 1840, y: 340, count: 4 },  // over pit
      { x: 2100, y: 300, count: 5 },
      { x: 2400, y: 260, count: 3 },
      { x: 2700, y: 380, count: 3 },
      { x: 2950, y: 320, count: 4 },
      { x: 3150, y: 360, count: 4 },  // over pit
      { x: 3400, y: 280, count: 3 },
      { x: 3650, y: 400, count: 2 },
      { x: 3900, y: 320, count: 4 },
      { x: 4150, y: 260, count: 3 },
      { x: 4420, y: 350, count: 4 },  // over pit
      { x: 4700, y: 300, count: 3 },
      { x: 4950, y: 380, count: 4 },
      { x: 5100, y: 260, count: 5 },  // control room area
      { x: 5400, y: 320, count: 3 },
      { x: 5700, y: 380, count: 3 },
    ];

    floats.forEach(p => {
      for (let i = 0; i < p.count; i++) {
        this.platforms.create(p.x + i * 32, p.y, 'factory_platform');
      }
    });

    // Breakable crates
    const cratePositions = [
      { x: 350, y: worldHeight - 80 },
      { x: 1000, y: worldHeight - 80 },
      { x: 1600, y: worldHeight - 80 },
      { x: 2300, y: worldHeight - 80 },
      { x: 3500, y: worldHeight - 80 },
      { x: 4800, y: worldHeight - 80 },
    ];

    cratePositions.forEach(pos => {
      const crate = this.crates.create(pos.x, pos.y, 'crate');
      crate.setData('health', 2);
    });

    // ---- Control room blocking wall ----
    this.controlRoomWall = this.physics.add.staticGroup();
    const wall1 = this.controlRoomWall.create(5150, worldHeight - 80, 'factory_platform');
    wall1.setScale(1, 3);
    wall1.refreshBody();
    const wall2 = this.controlRoomWall.create(5150, worldHeight - 112, 'factory_platform');
    wall2.setScale(1, 3);
    wall2.refreshBody();
    const wall3 = this.controlRoomWall.create(5150, worldHeight - 144, 'factory_platform');
    wall3.setScale(1, 3);
    wall3.refreshBody();

    // Control room label
    this.add.text(5200, 160, 'Control Room', {
      fontSize: '16px', fontFamily: 'Georgia, serif',
      color: '#ffaa44', fontStyle: 'italic',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(4);

    // ---- Conveyor Belts ----
    this.conveyors = [
      { x: 600, y: worldHeight - 60, width: 200, direction: 1, speed: 80 },
      { x: 1300, y: worldHeight - 60, width: 180, direction: -1, speed: 100 },
      { x: 2100, y: 290, width: 160, direction: 1, speed: 90 },
      { x: 2800, y: worldHeight - 60, width: 220, direction: -1, speed: 80 },
      { x: 3600, y: worldHeight - 60, width: 200, direction: 1, speed: 110 },
      { x: 4100, y: 250, width: 140, direction: -1, speed: 90 },
    ];

    this.conveyorZones = [];
    this.conveyors.forEach(conv => {
      const zone = this.add.zone(conv.x + conv.width / 2, conv.y, conv.width, 20);
      this.physics.add.existing(zone, true);
      zone.setData('direction', conv.direction);
      zone.setData('speed', conv.speed);
      this.conveyorZones.push(zone);

      // Visual conveyor belt
      const belt = this.add.graphics();
      belt.fillStyle(0x666666, 0.8);
      belt.fillRect(conv.x, conv.y - 5, conv.width, 10);
      belt.setDepth(2);

      // Directional arrows on conveyor
      const arrowColor = conv.direction > 0 ? 0xffaa00 : 0x00aaff;
      belt.lineStyle(2, arrowColor, 0.6);
      for (let ax = conv.x + 15; ax < conv.x + conv.width - 15; ax += 30) {
        if (conv.direction > 0) {
          belt.beginPath();
          belt.moveTo(ax, conv.y);
          belt.lineTo(ax + 8, conv.y - 4);
          belt.moveTo(ax, conv.y);
          belt.lineTo(ax + 8, conv.y + 4);
          belt.strokePath();
        } else {
          belt.beginPath();
          belt.moveTo(ax, conv.y);
          belt.lineTo(ax - 8, conv.y - 4);
          belt.moveTo(ax, conv.y);
          belt.lineTo(ax - 8, conv.y + 4);
          belt.strokePath();
        }
      }
    });

    // ---- Switches (3 to unlock control room) ----
    this.switches = this.physics.add.staticGroup();

    const switchPositions = [
      { x: 1500, y: worldHeight - 80 },
      { x: 2500, y: worldHeight - 80 },
      { x: 4000, y: worldHeight - 80 },
    ];

    switchPositions.forEach(pos => {
      const sw = this.switches.create(pos.x, pos.y, 'switch');
      sw.setData('activated', false);
      sw.setTint(0xff4444);  // Red = inactive

      // Label
      const label = this.add.text(pos.x, pos.y - 35, 'SWITCH', {
        fontSize: '10px', fontFamily: 'Arial, sans-serif',
        color: '#ff4444', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 2
      }).setOrigin(0.5).setDepth(5);
      sw.setData('label', label);
    });

    // ---- Factory decorations ----
    this.createFactoryDecorations(worldWidth, worldHeight);

    // ---- Player ----
    const charTexture = this.playerState.activeChar === 'luna' ? 'cat_luna_f0'
      : this.playerState.activeChar === 'boots' ? 'cat_boots_f0'
      : this.playerState.activeChar === 'cleo' ? 'cat_cleo_f0'
      : 'cat_whiskers_f0';
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

    // Tuna spread (18-20 positions)
    const tunaX = [520, 2200, 3750];
    tunaX.forEach(x => {
      const t = this.tunas.create(x, worldHeight - 90, 'tuna');
      t.body.setAllowGravity(false);
      this.addFloatAnimation(t);
    });

    // Water (10-12 positions)
    const waterX = [500, 1550, 3850];
    waterX.forEach(x => {
      const w = this.waters.create(x, worldHeight - 85, 'water');
      w.body.setAllowGravity(false);
      this.addFloatAnimation(w);
    });

    // Map piece 5/7 — in the control room area (only accessible after all 3 switches hit)
    this.mapPiece = this.mapPieces.create(5200, 200, 'map_piece');
    this.mapPiece.body.setAllowGravity(false);
    this.mapPiece.setScale(1.5);
    this.addFloatAnimation(this.mapPiece);
    this.addGlowEffect(this.mapPiece);

    // ---- Yarn Balls ----
    this.yarnBalls = this.physics.add.group();

    const yarnPositions = [
      { x: 800, y: worldHeight - 80, rangeLeft: 650, rangeRight: 950 },
      { x: 1700, y: worldHeight - 80, rangeLeft: 1550, rangeRight: 1800 },
      { x: 2400, y: worldHeight - 80, rangeLeft: 2200, rangeRight: 2600 },
      { x: 3100, y: worldHeight - 80, rangeLeft: 2950, rangeRight: 3200 },
      { x: 3800, y: worldHeight - 80, rangeLeft: 3650, rangeRight: 3950 },
      { x: 4600, y: worldHeight - 80, rangeLeft: 4520, rangeRight: 4700 },
    ];

    yarnPositions.forEach(pos => {
      const yarn = this.yarnBalls.create(pos.x, pos.y, 'yarn_ball');
      yarn.setScale(1.2);
      yarn.setBounce(0);
      yarn.setCollideWorldBounds(true);
      yarn.setData('rangeLeft', pos.rangeLeft);
      yarn.setData('rangeRight', pos.rangeRight);
      yarn.setData('direction', 1);
      yarn.setVelocityX(60);
    });

    // ---- NPCs ----
    this.npcs = this.physics.add.staticGroup();

    // Old Factory Cat near start
    const factoryCat = this.npcs.create(400, worldHeight - 75, 'npc_cat');
    factoryCat.setScale(1.3);
    factoryCat.setTint(0x888899);
    factoryCat.setData('name', 'Old Factory Cat');
    factoryCat.setData('dialogIndex', 0);
    factoryCat.setData('dialogs', [
      { speaker: 'Old Factory Cat', text: "This factory used to make the finest yarn in all of Whiskeria." },
      { speaker: 'Old Factory Cat', text: "Then the Dog King's minions took it over." },
      { speaker: 'Old Factory Cat', text: "They've rigged the conveyor belts to push intruders around. Watch your step!" },
      { speaker: 'Old Factory Cat', text: "I heard the Dog King can bench press a FIRE TRUCK. But that might be propaganda." },
    ]);
    this.addExclamation(factoryCat);

    // Maintenance Mouse mid-level
    const maintenanceMouse = this.npcs.create(3000, worldHeight - 68, 'npc_cat');
    maintenanceMouse.setScale(0.8);
    maintenanceMouse.setTint(0xaa9988);
    maintenanceMouse.setData('name', 'Maintenance Mouse');
    maintenanceMouse.setData('dialogIndex', 0);
    maintenanceMouse.setData('dialogs', [
      { speaker: 'Maintenance Mouse', text: "The control room is locked. You need to hit all 3 switches to open it." },
      { speaker: 'Maintenance Mouse', text: "But watch out for the conveyor belts!" },
      { speaker: 'Maintenance Mouse', text: "The switches are scattered through the factory — look for the red lights." },
      { speaker: 'Maintenance Mouse', text: "I heard the Dog King once sneezed and caused an earthquake!" },
    ]);
    this.addExclamation(maintenanceMouse);

    // ---- Enemies ----
    this.enemies = this.physics.add.group();

    // Factory rats (ground patrol)
    const ratPositions = [
      { x: 500, y: worldHeight - 80, patrolRange: 120 },
      { x: 1100, y: worldHeight - 80, patrolRange: 100 },
      { x: 1600, y: worldHeight - 80, patrolRange: 130 },
      { x: 2200, y: worldHeight - 80, patrolRange: 100 },
      { x: 3300, y: worldHeight - 80, patrolRange: 90 },
      { x: 3900, y: worldHeight - 80, patrolRange: 110 },
      { x: 4700, y: worldHeight - 80, patrolRange: 100 },
    ];

    ratPositions.forEach(pos => {
      const enemy = this.enemies.create(pos.x, pos.y, 'factory_rat');
      enemy.setScale(1.2);
      enemy.setBounce(0);
      enemy.setCollideWorldBounds(true);
      enemy.setData('startX', pos.x);
      enemy.setData('patrolRange', pos.patrolRange);
      enemy.setData('direction', 1);
      enemy.setData('type', 'factory_rat');
      enemy.setVelocityX(50);
    });

    // Mechanical spiders (ceiling, drop when player near)
    this.mechSpiders = [];
    const spiderPositions = [900, 1800, 2600, 3500, 4200, 5000];
    spiderPositions.forEach(x => {
      const spider = this.enemies.create(x, 80, 'mech_spider');
      spider.setScale(1.3);
      spider.body.setAllowGravity(false);
      spider.setData('startX', x);
      spider.setData('startY', 80);
      spider.setData('type', 'mech_spider');
      spider.setData('dropping', false);
      spider.setData('returning', false);
      this.mechSpiders.push(spider);
    });

    // ---- Colliders ----
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.player, this.crates);
    this.physics.add.collider(this.player, this.controlRoomWall);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.collider(this.yarnBalls, this.platforms);
    this.physics.add.collider(this.enemies, this.crates, null, (enemy) => {
      return enemy.getData('type') !== 'mech_spider';
    }, this);

    this.physics.add.overlap(this.player, this.tunas, this.collectTuna, null, this);
    this.physics.add.overlap(this.player, this.waters, this.collectWater, null, this);
    this.physics.add.overlap(this.player, this.mapPieces, this.collectMapPiece, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, null, this);
    this.physics.add.overlap(this.player, this.yarnBalls, this.hitYarnBall, null, this);

    // Conveyor belt overlaps
    this.conveyorZones.forEach(zone => {
      this.physics.add.overlap(this.player, zone, (player, z) => {
        const dir = z.getData('direction');
        const spd = z.getData('speed');
        player.body.velocity.x += dir * spd * 0.3;
      });
    });

    // ---- Controls ----
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyX = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.keyShift = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.keyTab = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);

    // ---- Pause menu ----
    this.input.keyboard.on('keydown-ESC', () => this.openPause());
    this.input.keyboard.on('keydown-P', () => this.openPause());

    // ---- Camera ----
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.fadeIn(1000);

    // ---- UI ----
    this.scene.launch('UIScene', { playerState: this.playerState, levelKey: 'Level5Scene' });

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
        { speaker: 'Luna', text: "This place gives me the creeps. Who builds a factory in the middle of nowhere?" },
        { speaker: 'Cleo', text: "Someone who doesn't want visitors." },
        { speaker: 'Boots', text: "Is it weird that I really want to chase that yarn?" },
        { speaker: 'Whiskers', text: "Focus, Boots! We need to find the map piece." },
      ]);
    });

    this.nearbyNpc = null;

    // ---- Level Exit ----
    const exitSign = this.add.image(worldWidth - 80, worldHeight - 80, 'exit_sign');
    exitSign.setScale(2);
    exitSign.setDepth(5);
    this.addFloatAnimation(exitSign);
    this.add.text(worldWidth - 80, worldHeight - 120, 'To Snowpaw Summit', {
      fontSize: '11px', fontFamily: 'Arial, sans-serif',
      color: '#44FF44', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(5);

    this.exitZone = this.add.zone(worldWidth - 80, worldHeight - 70, 60, 60);
    this.physics.add.existing(this.exitZone, true);
    this.physics.add.overlap(this.player, this.exitZone, this.exitLevel, null, this);
    this.hasExited = false;
  }

  // ---- BACKGROUND ----
  createFactoryBackground(worldWidth, worldHeight) {
    // Dark gray sky with smoke
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x2a2a2a, 0x2a2a2a, 0x3a3a3a, 0x3a3a3a);
    sky.fillRect(0, 0, 1024, worldHeight);
    sky.setScrollFactor(0);
    sky.setDepth(-10);

    // Smoke clouds
    const smoke = this.add.graphics();
    smoke.setScrollFactor(0.05);
    smoke.setDepth(-9);
    smoke.fillStyle(0x555555, 0.4);
    for (let i = 0; i < 15; i++) {
      const cx = Math.random() * worldWidth;
      const cy = 20 + Math.random() * 80;
      const cw = 60 + Math.random() * 80;
      const ch = 20 + Math.random() * 15;
      smoke.fillEllipse(cx, cy, cw, ch);
      smoke.fillEllipse(cx + cw * 0.3, cy - 5, cw * 0.7, ch * 0.8);
    }

    // Factory silhouettes with chimneys
    const factories = this.add.graphics();
    factories.setScrollFactor(0.15);
    factories.setDepth(-8);
    factories.fillStyle(0x1a1a1a, 0.8);
    for (let i = 0; i < worldWidth / 200; i++) {
      const fx = i * 200 + Math.random() * 60;
      const fh = 100 + Math.random() * 80;
      const fw = 60 + Math.random() * 40;
      // Building
      factories.fillRect(fx, worldHeight - 60 - fh, fw, fh);
      // Chimney
      factories.fillRect(fx + fw * 0.3, worldHeight - 60 - fh - 40, 8, 40);
      factories.fillRect(fx + fw * 0.7, worldHeight - 60 - fh - 30, 6, 30);
    }

    // Metal walls (mid-ground)
    const walls = this.add.graphics();
    walls.setScrollFactor(0.3);
    walls.setDepth(-7);
    walls.fillStyle(0x444455, 0.6);
    for (let i = 0; i < worldWidth / 150; i++) {
      const wx = i * 150 + Math.random() * 40;
      walls.fillRect(wx, worldHeight - 140, 80 + Math.random() * 40, 100);
    }

    // Pipes
    const pipes = this.add.graphics();
    pipes.setScrollFactor(0.25);
    pipes.setDepth(-6);
    pipes.lineStyle(4, 0x666677, 0.5);
    for (let i = 0; i < worldWidth / 300; i++) {
      const px = i * 300 + Math.random() * 100;
      const py = 100 + Math.random() * 150;
      pipes.beginPath();
      pipes.moveTo(px, py);
      pipes.lineTo(px + 100 + Math.random() * 100, py);
      pipes.lineTo(px + 100 + Math.random() * 100, py + 50 + Math.random() * 50);
      pipes.strokePath();
    }

    // Gears (background decoration)
    const gears = this.add.graphics();
    gears.setScrollFactor(0.2);
    gears.setDepth(-5);
    gears.lineStyle(3, 0x555566, 0.3);
    for (let i = 0; i < 8; i++) {
      const gx = Math.random() * worldWidth;
      const gy = 80 + Math.random() * 200;
      const gr = 15 + Math.random() * 20;
      gears.strokeCircle(gx, gy, gr);
      gears.strokeCircle(gx, gy, gr * 0.5);
      // Spokes
      for (let s = 0; s < 6; s++) {
        const angle = (s / 6) * Math.PI * 2;
        gears.beginPath();
        gears.moveTo(gx + Math.cos(angle) * gr * 0.5, gy + Math.sin(angle) * gr * 0.5);
        gears.lineTo(gx + Math.cos(angle) * gr, gy + Math.sin(angle) * gr);
        gears.strokePath();
      }
    }
  }

  createFactoryDecorations(worldWidth, worldHeight) {
    // Metal posts, pipes, and warning signs along the factory floor
    for (let i = 0; i < worldWidth / 400; i++) {
      const dx = i * 400 + Math.random() * 150 + 50;
      // Skip if in a pit
      if ((dx > 1800 && dx < 1920) || (dx > 3200 && dx < 3320) || (dx > 4400 && dx < 4520)) continue;

      const post = this.add.image(dx, worldHeight - 80, 'tree_trunk');
      post.setDepth(3);
      post.setAlpha(0.5);
      post.setScale(0.5, 0.7);
      post.setTint(0x666677);
    }

    // Yarn Factory label
    this.add.text(3000, 100, 'The Yarn Factory', {
      fontSize: '20px', fontFamily: 'Georgia, serif',
      color: '#888899', fontStyle: 'italic',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(4);

    // Switch counter display
    this.switchCounterText = this.add.text(16, 16, 'Switches: 0/3', {
      fontSize: '14px', fontFamily: 'Arial, sans-serif',
      color: '#ff4444', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3
    }).setScrollFactor(0).setDepth(25);
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
      'cleo': 'cat_cleo_f0'
    };
    this.player.setTexture(sheetMap[this.playerState.activeChar]);

    // Re-apply physics body size after texture swap (setTexture resets it)
    this.player.body.setSize(20, 22);
    this.player.body.setOffset(14, 14);

    // Brief flash effect on switch
    this.player.setTint(0xaa88ff);
    this.time.delayedCall(200, () => this.player.clearTint());

    const charNames = { 'whiskers': 'Whiskers', 'luna': 'Luna', 'boots': 'Boots', 'cleo': 'Cleo' };
    this.showQuickMessage(`Switched to ${charNames[this.playerState.activeChar]}!`, 0xaa88ff);
  }

  // ---- SWITCH PUZZLE ----
  hitSwitch(sw) {
    if (sw.getData('activated')) return;
    sw.setData('activated', true);
    sw.setTint(0x44ff44);  // Green = active
    this.switchesHit++;

    // Update label
    const label = sw.getData('label');
    if (label) {
      label.setText('ACTIVE');
      label.setColor('#44ff44');
    }

    // Update counter
    this.switchCounterText.setText(`Switches: ${this.switchesHit}/3`);
    if (this.switchesHit < 3) {
      this.switchCounterText.setColor('#ffaa44');
    }

    this.showQuickMessage(`Switch ${this.switchesHit}/3 activated!`, 0x44ff44);

    if (this.switchesHit >= 3 && !this.controlRoomOpen) {
      this.controlRoomOpen = true;
      this.switchCounterText.setText('Switches: 3/3 - OPEN!');
      this.switchCounterText.setColor('#44ff44');

      // Remove the blocking wall
      this.controlRoomWall.children.each(wall => {
        this.tweens.add({
          targets: wall,
          alpha: 0,
          duration: 500,
          onComplete: () => wall.destroy()
        });
      });

      this.time.delayedCall(600, () => {
        this.showDialog([
          { speaker: 'Whiskers', text: "All 3 switches activated! The control room is open!" },
          { speaker: 'Luna', text: "I can sense the map piece inside. Let's go!" },
        ]);
      });
    }
  }

  // ---- YARN BALL HIT ----
  hitYarnBall(player, yarn) {
    if (this.playerState.isPouncing) {
      // Destroy yarn ball with pounce
      const yx = yarn.x, yy = yarn.y;
      yarn.destroy();
      this.showQuickMessage("Yarn destroyed!", 0xffaa00);
      this.collectEffect(yx, yy, 0xff88cc);
      return;
    }

    if (player.getData('invulnerable')) return;

    // Knockback + 5 damage
    this.playerState.health = Math.max(0, this.playerState.health - 5);
    player.setData('invulnerable', true);
    player.setTint(0xff88cc);

    const knockDir = player.x > yarn.x ? 150 : -150;
    player.setVelocityX(knockDir);
    player.setVelocityY(-150);

    this.showQuickMessage("-5 HP! Yarn ball!", 0xff88cc);

    this.tweens.add({
      targets: player,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        player.setAlpha(1);
        player.clearTint();
        player.setData('invulnerable', false);
      }
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
    const isBoots = this.playerState.activeChar === 'boots';
    const isLuna = this.playerState.activeChar === 'luna';
    const isCleo = this.playerState.activeChar === 'cleo';

    // Speed calculation — Boots = faster, normal run = 1.6x
    let speed = this.playerState.speed;
    if (isBoots && this.playerState.isRunning) {
      speed = this.playerState.speed * 2.2;
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
    const animPrefix = isCleo ? 'cleo' : isBoots ? 'boots' : isLuna ? 'luna' : 'whiskers';
    if (!onGround) {
      this.player.anims.stop();
    } else if (moving) {
      const walkAnim = `${animPrefix}_walk`;
      if (!this.player.anims.isPlaying || this.player.anims.currentAnim?.key !== walkAnim) {
        this.player.play(walkAnim);
      }
      this.player.anims.msPerFrame = this.playerState.isRunning ? 80 : 125;
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

    // NPC interaction (E)
    this.checkNpcProximity();
    if (Phaser.Input.Keyboard.JustDown(this.keyE) && this.nearbyNpc) {
      this.interactWithNpc(this.nearbyNpc);
    }

    // Enemy patrol AI
    this.enemies.children.each(enemy => {
      if (!enemy.active) return;
      const type = enemy.getData('type');

      if (type === 'mech_spider') {
        // Ceiling spider — drops when player is near
        const distToPlayer = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
        const dropping = enemy.getData('dropping');
        const returning = enemy.getData('returning');
        const startY = enemy.getData('startY');

        if (!dropping && !returning && distToPlayer < 150) {
          // Drop down toward player
          enemy.setData('dropping', true);
          enemy.body.setAllowGravity(true);
          enemy.setVelocityY(200);
        } else if (dropping && enemy.y > 450) {
          // Hit near ground, start returning
          enemy.setData('dropping', false);
          enemy.setData('returning', true);
          enemy.body.setAllowGravity(false);
          enemy.setVelocityY(-80);
        } else if (returning && enemy.y <= startY) {
          // Back at ceiling
          enemy.setData('returning', false);
          enemy.setVelocityY(0);
          enemy.y = startY;
          enemy.body.reset(enemy.x, startY);
        }
      } else {
        // Ground patrol (factory rats)
        const startX = enemy.getData('startX');
        const range = enemy.getData('patrolRange');
        if (enemy.y > 590) { enemy.destroy(); return; }

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

    // Yarn ball movement (roll back and forth)
    this.yarnBalls.children.each(yarn => {
      if (!yarn.active) return;
      const rangeLeft = yarn.getData('rangeLeft');
      const rangeRight = yarn.getData('rangeRight');
      if (yarn.x > rangeRight) {
        yarn.setData('direction', -1);
        yarn.setVelocityX(-60);
      } else if (yarn.x < rangeLeft) {
        yarn.setData('direction', 1);
        yarn.setVelocityX(60);
      }
      // Rotate for rolling effect
      yarn.angle += yarn.getData('direction') * 3;
    });

    // Fall into pit
    if (this.player.y > PIT_THRESHOLD && !this.player.getData('pitCooldown')) {
      this.player.setData('pitCooldown', true);
      this.loseLife("Fell in a pit!");
    }
  }

  pounceAttack() {
    this.playerState.isPouncing = true;
    this.playerState.pounceReady = false;

    // Visual feedback — play pounce animation
    const activeChar = this.playerState.activeChar || 'whiskers';
    this.player.play(`${activeChar}_pounce`);
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

    // Check switches
    this.switches.children.each(sw => {
      if (!sw.active) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, sw.x, sw.y);
      if (dist < 60) {
        this.hitSwitch(sw);
      }
    });

    // Check yarn balls
    this.yarnBalls.children.each(yarn => {
      if (!yarn.active) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, yarn.x, yarn.y);
      if (dist < 60) {
        const yx = yarn.x, yy = yarn.y;
        yarn.destroy();
        this.showQuickMessage("Yarn destroyed!", 0xffaa00);
        this.collectEffect(yx, yy, 0xff88cc);
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
      const charName = this.playerState.activeChar || 'whiskers';
      this.player.play(`${charName}_idle`, true);
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
    const name = type === 'mech_spider' ? 'Mech Spider' : 'Factory Rat';
    this.showQuickMessage(`${name} scared away!`, 0x44ff44);
  }

  hitEnemy(player, enemy) {
    if (this.playerState.isPouncing) {
      this.scareEnemy(enemy);
      return;
    }
    if (player.getData('invulnerable')) return;

    this.playerState.health = Math.max(0, this.playerState.health - 10);
    if (this.playerState.health <= 0) {
      this.loseLife("KO'd by enemy!");
      return;
    }
    this.events.emit('updateVitals', this.playerState);
    player.setData('invulnerable', true);
    player.setTint(0xff0000);

    const knockDir = player.x > enemy.x ? 150 : -150;
    player.setVelocityX(knockDir);
    player.setVelocityY(-200);

    this.showQuickMessage("-10 HP!", 0xff4444);

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

  openPause() {
    this.scene.pause();
    this.scene.launch('PauseScene', { callerScene: 'Level5Scene' });
  }

  loseLife(message) {
    if (this.player.getData('dyingCooldown')) return;
    this.player.setData('dyingCooldown', true);
    this.playerState.lives = Math.max(0, (this.playerState.lives || 3) - 1);
    this.playerState.health = 100;
    this.showQuickMessage(`${message} Restarting...`, 0xff4444);
    this.cameras.main.fadeOut(1000, 0, 0, 0);
    this.time.delayedCall(1100, () => {
      this.scene.stop('UIScene');
      this.scene.restart({ playerState: this.playerState });
    });
  }

  collectTuna(player, tuna) {
    const tx = tuna.x, ty = tuna.y;
    tuna.destroy();
    this.playerState.hunger = Math.min(100, this.playerState.hunger + 25);
    this.playerState.health = Math.min(100, this.playerState.health + 8);
    this.playerState.tunasCollected++;
    this.showQuickMessage("+25 Hunger, +8 Health!", 0x4a90d9);
    this.collectEffect(tx, ty, 0x4a90d9);
    try { this.sound.play('tunapickup', { volume: 0.6 }); } catch(e) {}
  }

  collectWater(player, water) {
    const wx = water.x, wy = water.y;
    water.destroy();
    this.playerState.thirst = Math.min(100, this.playerState.thirst + 30);
    this.playerState.health = Math.min(100, this.playerState.health + 2);
    this.playerState.watersCollected++;
    this.showQuickMessage("+30 Thirst, +2 Health!", 0x4fc3f7);
    this.collectEffect(wx, wy, 0x4fc3f7);
    try { this.sound.play('waterpickup', { volume: 0.6 }); } catch(e) {}
  }

  collectMapPiece(player, piece) {
    if (!this.controlRoomOpen) {
      this.showQuickMessage("The control room is locked! Find the switches!", 0xff4444);
      return;
    }

    const px = piece.x, py = piece.y;
    piece.destroy();
    try { this.sound.play('generalpickup', { volume: 0.6 }); } catch(e) {}
    this.playerState.mapPieces++;
    this.showQuickMessage("MAP PIECE FOUND! (5/7)", 0xffd700);
    this.collectEffect(px, py, 0xffd700);

    this.time.delayedCall(1000, () => {
      this.showDialog([
        { speaker: 'Whiskers', text: "Another piece of the Puzzle Map! Found it in the control room!" },
        { speaker: 'Luna', text: "That's 5 out of 7! We're getting close!" },
        { speaker: 'Boots', text: "Can I keep some of that yarn though? ...No? Okay fine." },
        { speaker: 'Cleo', text: "Let's keep moving. The Dog King won't defeat himself." },
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

    state.hunger = Math.max(0, state.hunger - hungerDrain);
    state.thirst = Math.max(0, state.thirst - thirstDrain);

    if (state.hunger <= 0 || state.thirst <= 0) {
      if (!state.isExhausted) {
        state.isExhausted = true;
        this.player.setTint(0x999999);
        const charNames = { 'whiskers': 'Whiskers', 'luna': 'Luna', 'boots': 'Boots', 'cleo': 'Cleo' };
        const charName = charNames[state.activeChar] || 'Whiskers';
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
      this.showQuickMessage(`${name}: "Watch out for the conveyor belts!"`, 0xffffff);
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

  exitLevel() {
    if (this.hasExited) return;
    this.hasExited = true;
    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.showQuickMessage("Heading to Snowpaw Summit...", 0x44ff44);
    this.time.delayedCall(1000, () => {
      this.scene.stop('UIScene');
      this.sound.stopAll();
      this.sound.play('level6music', { loop: true, volume: 0.4 });
      this.scene.start('Level6Scene', { playerState: this.playerState });
    });
  }
}
