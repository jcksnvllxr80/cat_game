import Phaser from 'phaser';
import { PIT_THRESHOLD } from '../constants.js';
import { CompanionManager } from '../CompanionManager.js';

export class Level2Scene extends Phaser.Scene {
  constructor() {
    super('Level2Scene');
  }

  init(data) {
    // Carry over state from Level 1 (or use defaults if starting fresh)
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
      mapPieces: 1,
      accessories: [],
      speed: 200,
      jumpPower: -400,
      lives: 9,
      isExhausted: false,
    };
    this.playerState.collectedMapPieces = this.playerState.collectedMapPieces || {};
    // Party & switching state
    this.playerState.party = this.playerState.party || ['whiskers'];
    this.playerState.activeChar = this.playerState.activeChar || 'whiskers';
    this.lunaRescued = (data.playerState?.party || []).includes('luna');
    this.nightVisionActive = false;
  }

  create() {
    const worldWidth = 5000;
    const worldHeight = 576;

    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

    // Start level 2 music
    this.sound.stopAll();
    this.sound.play('level2music', { loop: true, volume: 0.4 });

    // ---- Dark forest background ----
    this.createForestBackground(worldWidth, worldHeight);

    // ---- Platforms ----
    this.platforms = this.physics.add.staticGroup();
    this.crates = this.physics.add.staticGroup();

    // Ground
    for (let x = 0; x < worldWidth; x += 32) {
      // Pits
      if ((x > 1200 && x < 1320) || (x > 2600 && x < 2720) || (x > 3800 && x < 3920)) continue;
      this.platforms.create(x + 16, worldHeight - 16, 'forest_ground');
      if (x % 64 === 0) {
        this.platforms.create(x + 16, worldHeight - 48, 'forest_ground');
      }
    }

    // Top layer
    for (let x = 0; x < worldWidth; x += 32) {
      if ((x > 1200 && x < 1320) || (x > 2600 && x < 2720) || (x > 3800 && x < 3920)) continue;
      this.platforms.create(x + 16, worldHeight - 48, 'forest_platform');
    }

    // Floating platforms
    const floats = [
      { x: 300, y: 420, count: 3 },
      { x: 550, y: 360, count: 2 },
      { x: 800, y: 300, count: 4 },
      { x: 1100, y: 400, count: 3 },
      { x: 1240, y: 350, count: 4 },  // over pit
      { x: 1500, y: 300, count: 3 },
      { x: 1800, y: 380, count: 2 },
      { x: 2000, y: 320, count: 5 },
      { x: 2300, y: 280, count: 3 },
      { x: 2620, y: 370, count: 4 },  // over pit
      { x: 2900, y: 340, count: 3 },
      { x: 3100, y: 280, count: 4 },
      { x: 3400, y: 400, count: 2 },
      { x: 3600, y: 320, count: 3 },
      { x: 3820, y: 360, count: 4 },  // over pit
      { x: 4100, y: 300, count: 3 },
      { x: 4400, y: 260, count: 5 },  // Great Tree area
      { x: 4700, y: 340, count: 3 },
    ];

    floats.forEach(p => {
      for (let i = 0; i < p.count; i++) {
        this.platforms.create(p.x + i * 32, p.y, 'forest_platform');
      }
    });

    // ---- Luna's Cave (boulders to break) ----
    // Cave entrance area around x: 900-1000
    this.boulders = this.physics.add.staticGroup();
    this.boulderData = [];

    if (!this.lunaRescued) {
      const boulderPositions = [
        { x: 920, y: worldHeight - 80, order: 1 },
        { x: 960, y: worldHeight - 80, order: 2 },
        { x: 940, y: worldHeight - 115, order: 3 },
      ];

      boulderPositions.forEach(pos => {
        const b = this.boulders.create(pos.x, pos.y, 'boulder');
        b.setScale(1.2);
        b.setData('order', pos.order);
        b.setData('health', 3);
        this.boulderData.push(b);
      });

      // Luna trapped behind boulders (initially hidden/behind)
      this.lunaNpc = this.physics.add.staticImage(980, worldHeight - 75, 'cat_luna_f0');
      this.lunaNpc.setScale(1.5);
      this.lunaNpc.setAlpha(0.4);  // barely visible behind rocks
      this.lunaNpc.setDepth(1);

      // Luna cry for help text
      this.lunaCryText = this.add.text(960, worldHeight - 150, '"Help! Is someone there?!"', {
        fontSize: '12px',
        fontFamily: 'Arial, sans-serif',
        color: '#AA88FF',
        fontStyle: 'italic',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5).setDepth(15);

      this.tweens.add({
        targets: this.lunaCryText,
        alpha: 0.3,
        duration: 1500,
        yoyo: true,
        repeat: -1
      });
    } else {
      this.lunaNpc = null;
      this.lunaCryText = null;
    }

    // Breakable crates
    const cratePositions = [
      { x: 400, y: worldHeight - 80 },
      { x: 1600, y: worldHeight - 80 },
      { x: 2100, y: 288 },
      { x: 3000, y: worldHeight - 80 },
      { x: 3500, y: worldHeight - 80 },
      { x: 4200, y: worldHeight - 80 },
    ];

    cratePositions.forEach(pos => {
      const crate = this.crates.create(pos.x, pos.y, 'crate');
      crate.setData('health', 2);
    });

    // ---- Decorative trees ----
    this.createTrees(worldWidth, worldHeight);

    // ---- Player ----
    const charTexture = this.playerState.activeChar === 'luna' ? 'cat_luna_f0' : 'cat_whiskers_f0';
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

    // Tuna spread
    const tunaX = [600, 2200, 3650];
    tunaX.forEach(x => {
      const t = this.tunas.create(x, worldHeight - 90, 'tuna');
      t.body.setAllowGravity(false);
      this.addFloatAnimation(t);
    });

    // Water
    const waterX = [400, 1800, 3300];
    waterX.forEach(x => {
      const w = this.waters.create(x, worldHeight - 85, 'water');
      w.body.setAllowGravity(false);
      this.addFloatAnimation(w);
    });

    // Map piece 2 — inside the Great Tree (far end, hidden path area)
    if (!this.playerState.collectedMapPieces.Level2Scene) {
      this.mapPiece = this.mapPieces.create(4500, 160, 'map_piece');
      this.mapPiece.body.setAllowGravity(false);
      this.mapPiece.setScale(1.5);
      this.addFloatAnimation(this.mapPiece);
      this.addGlowEffect(this.mapPiece);
      this.mapPiece.setData('hidden', false);
    } else {
      this.mapPiece = null;
    }

    // ---- Dark Zones ----
    // Areas that are pitch black without Luna's Night Vision
    this.darkZones = [
      { x: 1800, width: 600 },   // First dark section
      { x: 3200, width: 500 },   // Second dark section
      { x: 4200, width: 700 },   // Great Tree interior (where map piece is)
    ];

    this.createDarknessOverlay(worldWidth, worldHeight);

    // ---- Hidden Paths (only visible with Night Vision) ----
    this.hiddenPaths = this.physics.add.staticGroup();
    this.hiddenPathSprites = [];

    // Hidden platforms in dark zone 1
    const hiddenPlats1 = [
      { x: 1900, y: 340, count: 3 },
      { x: 2050, y: 280, count: 2 },
      { x: 2200, y: 240, count: 3 },
    ];

    // Hidden platforms in dark zone 3 (leads to map piece)
    const hiddenPlats2 = [
      { x: 4300, y: 350, count: 2 },
      { x: 4400, y: 300, count: 3 },
      { x: 4550, y: 260, count: 2 },
      { x: 4450, y: 200, count: 4 },  // map piece platform
    ];

    [...hiddenPlats1, ...hiddenPlats2].forEach(p => {
      for (let i = 0; i < p.count; i++) {
        const plat = this.hiddenPaths.create(p.x + i * 32, p.y, 'forest_platform');
        plat.setAlpha(0);  // Invisible until Night Vision
        plat.setData('hidden', true);
        this.hiddenPathSprites.push(plat);
      }
    });

    // Hidden sparkle markers (show with night vision to hint at hidden paths)
    this.hiddenSparkles = [];

    // ---- NPCs ----
    this.npcs = this.physics.add.staticGroup();

    // Scared mouse NPC at start
    const mouse = this.npcs.create(200, worldHeight - 68, 'npc_cat');
    mouse.setScale(0.8);
    mouse.setTint(0xbb9977);
    mouse.setData('name', 'Frightened Mouse');
    mouse.setData('dialogIndex', 0);
    mouse.setData('dialogs', [
      { speaker: 'Frightened Mouse', text: "Eek! Oh, you're a cat... please don't eat me!" },
      { speaker: 'Whiskers', text: "I'm not going to eat you! Have you seen anything strange around here?" },
      { speaker: 'Frightened Mouse', text: "Strange?! EVERYTHING is strange! The Dog King has LASER EYES!" },
      { speaker: 'Frightened Mouse', text: "Also, I heard a cat crying for help near some boulders to the east. Poor thing's been stuck for days!" },
    ]);
    this.addExclamation(mouse);

    // Wise owl NPC in mid-level
    const owl = this.npcs.create(1500, worldHeight - 75, 'npc_cat');
    owl.setScale(1.2);
    owl.setTint(0x8B6914);
    owl.setData('name', 'Professor Hoot');
    owl.setData('dialogIndex', 0);
    owl.setData('dialogs', [
      { speaker: 'Professor Hoot', text: "Hooo... a brave little cat in the Whispering Woods? How unusual." },
      { speaker: 'Professor Hoot', text: "These woods are full of secrets. Some paths can only be seen by those with special sight." },
      { speaker: 'Professor Hoot', text: "If you find a friend who can see in the dark, the forest will reveal its hidden treasures." },
      { speaker: 'Professor Hoot', text: "Oh, and the Dog King? I heard he can FLY. But between you and me, owls can fly too, and we're not scary at all." },
    ]);
    this.addExclamation(owl);

    // Traveling cat NPC near end
    const traveler = this.npcs.create(3800, worldHeight - 75, 'npc_cat');
    traveler.setScale(1.3);
    traveler.setTint(0xffaa66);
    traveler.setData('name', 'Wandering Cat');
    traveler.setData('dialogIndex', 0);
    traveler.setData('dialogs', [
      { speaker: 'Wandering Cat', text: "You actually came through the dark parts? Impressive!" },
      { speaker: 'Wandering Cat', text: "I heard the Dog King's teeth are made of DIAMONDS. Can you imagine?" },
      { speaker: 'Wandering Cat', text: "The Great Tree up ahead is ancient. They say a piece of the Puzzle Map is hidden deep inside." },
      { speaker: 'Wandering Cat', text: "But the path to it is invisible to normal eyes. You'll need a special friend to find it..." },
    ]);
    this.addExclamation(traveler);

    // ---- Enemies ----
    this.enemies = this.physics.add.group();

    // Raccoons (ground)
    const raccoonPositions = [
      { x: 500, y: worldHeight - 80, patrolRange: 120 },
      { x: 1400, y: worldHeight - 80, patrolRange: 100 },
      { x: 2500, y: worldHeight - 80, patrolRange: 130 },
      { x: 3100, y: worldHeight - 80, patrolRange: 100 },
      { x: 3600, y: worldHeight - 80, patrolRange: 90 },
      { x: 4100, y: worldHeight - 80, patrolRange: 110 },
    ];

    raccoonPositions.forEach(pos => {
      const enemy = this.enemies.create(pos.x, pos.y, 'raccoon');
      enemy.setScale(1.2);
      enemy.setBounce(0);
      enemy.setCollideWorldBounds(true);
      enemy.setData('startX', pos.x);
      enemy.setData('patrolRange', pos.patrolRange);
      enemy.setData('direction', 1);
      enemy.setData('type', 'raccoon');
      enemy.setVelocityX(50);
    });

    // Crows (flying, sin wave)
    this.crows = [];
    const crowPositions = [700, 1600, 2200, 3000, 3500, 4300];
    crowPositions.forEach(x => {
      const crow = this.enemies.create(x, 200, 'crow');
      crow.setScale(1.3);
      crow.body.setAllowGravity(false);
      crow.setData('startX', x);
      crow.setData('startY', 200);
      crow.setData('type', 'crow');
      crow.setData('time', Math.random() * Math.PI * 2);
      this.crows.push(crow);
    });

    // ---- Fireflies (ambient decoration in dark zones) ----
    this.createFireflies();

    // ---- Colliders ----
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.player, this.crates);
    this.physics.add.collider(this.player, this.boulders, (player, boulder) => {
      // Push player away from boulder on contact
      if (player.x < boulder.x) {
        player.setVelocityX(-100);
      } else {
        player.setVelocityX(100);
      }
    });
    this.physics.add.collider(this.player, this.hiddenPaths);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.collider(this.enemies, this.crates, null, (enemy) => {
      return enemy.getData('type') !== 'crow';
    }, this);

    this.physics.add.overlap(this.player, this.tunas, this.collectTuna, null, this);
    this.physics.add.overlap(this.player, this.waters, this.collectWater, null, this);
    this.physics.add.overlap(this.player, this.mapPieces, this.collectMapPiece, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, null, this);

    // ---- Companion System ----
    this.companionManager = new CompanionManager(this, this.playerState, this.player, this.platforms);

    // ---- Controls ----
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyX = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.keyShift = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.keyTab = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);
    this.keyV = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.V);

    // ---- Pause menu ----
    this.input.keyboard.on('keydown-ESC', () => this.openPause());
    this.input.keyboard.on('keydown-P', () => this.openPause());

    // ---- Camera ----
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.fadeIn(1000);

    // ---- UI ----
    this.scene.launch('UIScene', { playerState: this.playerState, levelKey: 'Level2Scene' });

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
        { speaker: 'Whiskers', text: "The Whispering Woods... it's so dark in here." },
        { speaker: 'Whiskers', text: "I can barely see the path ahead. I should be careful." },
        { speaker: 'Whiskers', text: "Wait — did I hear someone calling for help?" },
      ]);
    });

    this.nearbyNpc = null;

    // ---- Level Exit ----
    const exitSign = this.add.image(worldWidth - 80, worldHeight - 80, 'exit_sign');
    exitSign.setScale(2);
    exitSign.setDepth(5);
    this.addFloatAnimation(exitSign);
    this.add.text(worldWidth - 80, worldHeight - 120, 'To Tuna Bay Docks', {
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
  createForestBackground(worldWidth, worldHeight) {
    // Dark sky
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x0a1628, 0x0a1628, 0x1a2a3a, 0x1a2a3a);
    sky.fillRect(0, 0, 1024, worldHeight);
    sky.setScrollFactor(0);
    sky.setDepth(-10);

    // Distant dark trees — with light/dark sides for 2.5D depth
    const farTrees = this.add.graphics();
    farTrees.setScrollFactor(0.1);
    farTrees.setDepth(-9);
    for (let i = 0; i < worldWidth / 80; i++) {
      const tx = i * 80 + Math.random() * 30;
      const th = 120 + Math.random() * 100;
      // Dark side
      farTrees.fillStyle(0x0a1a0a, 0.8);
      farTrees.fillTriangle(tx - 30, worldHeight - 60, tx, worldHeight - 60 - th, tx + 30, worldHeight - 60);
      farTrees.fillTriangle(tx - 20, worldHeight - 60 - th * 0.3, tx, worldHeight - 60 - th - 30, tx + 20, worldHeight - 60 - th * 0.3);
      // Subtle light side
      farTrees.fillStyle(0x1a2a1a, 0.3);
      farTrees.fillTriangle(tx - 20, worldHeight - 60, tx, worldHeight - 60 - th, tx, worldHeight - 60);
    }

    // Extra far layer for more depth
    const veryFarTrees = this.add.graphics();
    veryFarTrees.setScrollFactor(0.05);
    veryFarTrees.setDepth(-9.5);
    veryFarTrees.fillStyle(0x050f05, 0.6);
    for (let i = 0; i < worldWidth / 100; i++) {
      const tx = i * 100 + Math.random() * 40;
      const th = 150 + Math.random() * 120;
      veryFarTrees.fillTriangle(tx - 40, worldHeight - 60, tx, worldHeight - 60 - th, tx + 40, worldHeight - 60);
    }

    // Mid trees — with shadow bases
    const midTrees = this.add.graphics();
    midTrees.setScrollFactor(0.3);
    midTrees.setDepth(-8);
    for (let i = 0; i < worldWidth / 60; i++) {
      const tx = i * 60 + Math.random() * 20;
      const th = 80 + Math.random() * 60;
      // Shadow at base
      midTrees.fillStyle(0x000000, 0.15);
      midTrees.fillEllipse(tx, worldHeight - 48, 30, 8);
      // Tree
      midTrees.fillStyle(0x0a250a, 0.7);
      midTrees.fillTriangle(tx - 25, worldHeight - 50, tx, worldHeight - 50 - th, tx + 25, worldHeight - 50);
    }

    // Fog layer
    const fog = this.add.graphics();
    fog.setScrollFactor(0.15);
    fog.setDepth(-6);
    fog.fillStyle(0x334455, 0.15);
    for (let i = 0; i < worldWidth / 100; i++) {
      const fx = i * 100 + Math.random() * 40;
      fog.fillEllipse(fx, worldHeight - 80, 100 + Math.random() * 60, 30 + Math.random() * 20);
    }

    // Ambient mist (slow scroll)
    const mist = this.add.graphics();
    mist.setScrollFactor(0.05);
    mist.setDepth(5);  // in front of platforms, behind player
    mist.fillStyle(0x445566, 0.08);
    for (let i = 0; i < 20; i++) {
      mist.fillEllipse(Math.random() * worldWidth, worldHeight - 100 + Math.random() * 60, 80 + Math.random() * 100, 20 + Math.random() * 15);
    }

    // Ground edge shadow (2.5D depth cue)
    const groundShadow = this.add.graphics();
    groundShadow.setDepth(-5);
    groundShadow.fillStyle(0x000000, 0.15);
    groundShadow.fillRect(0, worldHeight - 52, worldWidth, 6);
  }

  createTrees(worldWidth, worldHeight) {
    // Decorative foreground trees (behind player but in front of bg)
    for (let i = 0; i < worldWidth / 300; i++) {
      const tx = i * 300 + Math.random() * 100 + 50;
      const trunk = this.add.image(tx, worldHeight - 80, 'tree_trunk');
      trunk.setDepth(3);
      trunk.setAlpha(0.8);
      const canopy = this.add.image(tx, worldHeight - 130, 'tree_canopy');
      canopy.setScale(1.2 + Math.random() * 0.5);
      canopy.setDepth(3);
      canopy.setAlpha(0.7);
    }

    // Great Tree (near the end - x:4500)
    const greatTrunk = this.add.image(4500, worldHeight - 80, 'tree_trunk');
    greatTrunk.setScale(3, 2);
    greatTrunk.setDepth(3);
    const greatCanopy = this.add.image(4500, worldHeight - 200, 'tree_canopy');
    greatCanopy.setScale(4);
    greatCanopy.setDepth(3);
    greatCanopy.setAlpha(0.8);
    // Label
    this.add.text(4500, worldHeight - 300, 'The Great Tree', {
      fontSize: '16px', fontFamily: 'Georgia, serif',
      color: '#88aa66', fontStyle: 'italic',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(4);
  }

  createFireflies() {
    this.fireflies = [];
    // Scatter fireflies in dark zones
    this.darkZones.forEach(zone => {
      for (let i = 0; i < 12; i++) {
        const ff = this.add.image(
          zone.x + Math.random() * zone.width,
          100 + Math.random() * 350,
          'firefly'
        );
        ff.setDepth(6);
        ff.setAlpha(0);

        // Gentle float & pulse
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
    // Create a render texture that covers the whole world
    this.darkOverlay = this.add.graphics();
    this.darkOverlay.setDepth(8);  // Above platforms, below UI
    this.updateDarknessOverlay();
  }

  updateDarknessOverlay() {
    this.darkOverlay.clear();

    if (this.nightVisionActive && this.playerState.activeChar === 'luna') {
      // Night Vision ON — no darkness, everything visible
      return;
    }

    // Draw dark rectangles over dark zones
    this.darkZones.forEach(zone => {
      const alpha = this.nightVisionActive ? 0.3 : 0.85;
      this.darkOverlay.fillStyle(0x000011, alpha);
      this.darkOverlay.fillRect(zone.x, 0, zone.width, 576);
    });

    // If player is in a dark zone and has Luna but NV is off, draw a small light around player
    if (this.playerState.party.includes('luna') && !this.nightVisionActive) {
      // Show hint
    }
  }

  isPlayerInDarkZone() {
    for (const zone of this.darkZones) {
      if (this.player.x >= zone.x && this.player.x <= zone.x + zone.width) {
        return true;
      }
    }
    return false;
  }

  // ---- CHARACTER SWITCHING ----
  switchCharacter() {
    if (this.companionManager) {
      this.companionManager.switchCharacter();
    }

    // Update darkness based on character
    this.updateDarknessOverlay();
    this.updateHiddenPaths();
  }

  toggleNightVision() {
    if (this.playerState.activeChar !== 'luna') {
      this.showQuickMessage("Only Luna can use Night Vision!", 0xff4444);
      return;
    }

    this.nightVisionActive = !this.nightVisionActive;

    if (this.nightVisionActive) {
      this.player.play('luna_nightvision');
      this.showQuickMessage("Night Vision ON!", 0x44ff44);
      // Brief green flash on player only (no camera tint — that covers the whole screen)
      this.player.setTint(0x44ff44);
      this.time.delayedCall(300, () => this.player.clearTint());
    } else {
      this.showQuickMessage("Night Vision OFF", 0xff8844);
      const charName = this.playerState.activeChar || 'whiskers';
      this.player.play(`${charName}_idle`, true);
    }

    this.updateDarknessOverlay();
    this.updateHiddenPaths();
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

    // Map piece is always visible (night vision does not hide/show it)
  }

  // ---- BOULDER PUZZLE ----
  hitBoulder(boulder) {
    const hp = boulder.getData('health') - 1;
    boulder.setData('health', hp);

    // Visual shake
    boulder.setTint(0xffaaaa);
    this.tweens.add({
      targets: boulder,
      x: boulder.x + 3,
      duration: 50,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        if (boulder.active) {
          boulder.clearTint();
          boulder.refreshBody();
        }
      }
    });

    if (hp <= 0) {
      // Break the boulder
      for (let i = 0; i < 10; i++) {
        const p = this.add.image(boulder.x, boulder.y, 'rock_particle');
        p.setScale(Phaser.Math.FloatBetween(0.8, 2));
        this.tweens.add({
          targets: p,
          x: boulder.x + Phaser.Math.Between(-60, 60),
          y: boulder.y + Phaser.Math.Between(-80, -10),
          alpha: 0,
          angle: Phaser.Math.Between(-180, 180),
          duration: 600,
          ease: 'Power2',
          onComplete: () => p.destroy()
        });
      }
      boulder.destroy();
      this.showQuickMessage("Boulder smashed!", 0xffaa00);

      // Check if all boulders cleared
      const remaining = this.boulders.countActive();
      if (remaining === 0 && !this.lunaRescued) {
        this.rescueLuna();
      }
    }
  }

  rescueLuna() {
    this.lunaRescued = true;
    this.lunaCryText.destroy();
    this.lunaNpc.setAlpha(1);

    // Luna rescue animation
    this.tweens.add({
      targets: this.lunaNpc,
      y: this.lunaNpc.y - 20,
      duration: 300,
      yoyo: true,
      onComplete: () => {
        this.showDialog([
          { speaker: 'Luna', text: "Oh thank goodness! I went exploring and the entrance collapsed behind me!" },
          { speaker: 'Luna', text: "I've been stuck in here for two days! I can see perfectly in the dark, but I couldn't move those rocks!" },
          { speaker: 'Whiskers', text: "Are you okay? I'm Whiskers. I'm on a quest to find the Dog King." },
          { speaker: 'Luna', text: "THE DOG KING?! I heard he has LASER EYES!" },
          { speaker: 'Whiskers', text: "...Laser eyes." },
          { speaker: 'Luna', text: "That's what the raccoons say! But... you seem brave enough for both of us. I'll come with you!" },
          { speaker: 'Luna', text: "I can see in the dark — that might help, right?" },
          { speaker: 'Whiskers', text: "That might help A LOT." },
          { speaker: 'Luna', text: "Press TAB to switch between us, and V to use my Night Vision when I'm active!" },
        ]);

        // Add Luna to party
        this.playerState.party.push('luna');

        // Remove NPC sprite
        this.time.delayedCall(100, () => {
          this.lunaNpc.destroy();
        });

        // Sync companions so Luna appears as a follower
        if (this.companionManager) {
          this.companionManager.syncCompanions();
        }

        this.showQuickMessage("LUNA JOINED THE PARTY!", 0xaa88ff);
      }
    });
  }

  // ---- STANDARD METHODS (same pattern as Level1) ----

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
    const isLuna = this.playerState.activeChar === 'luna';
    const speed = this.playerState.isRunning ? this.playerState.speed * 1.6 : this.playerState.speed;

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
    const animPrefix = isLuna ? 'luna' : 'whiskers';
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

    // Night Vision (V)
    if (Phaser.Input.Keyboard.JustDown(this.keyV)) {
      this.toggleNightVision();
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

      if (type === 'crow') {
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

    // Luna scared of loud noises — if pounce near Luna (when she's NPC/not active), flash
    // This is a weakness hint for later

    // Dark zone warning
    if (this.isPlayerInDarkZone() && !this.nightVisionActive && !this._darkWarnShown) {
      if (this.playerState.party.includes('luna')) {
        this.showQuickMessage("It's dark! Switch to Luna (TAB) and use Night Vision (V)!", 0xaa88ff);
      } else {
        this.showQuickMessage("It's too dark to see... I need someone who can see in the dark.", 0xff8844);
      }
      this._darkWarnShown = true;
      this.time.delayedCall(10000, () => { this._darkWarnShown = false; });
    }

    // Update darkness overlay position (follows camera)
    this.updateDarknessOverlay();

    // Update companions (follow system)
    if (this.companionManager) {
      this.companionManager.update();
    }

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

    // Check boulders
    let hitSolid = false;
    this.boulders.children.each(boulder => {
      if (!boulder.active) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, boulder.x, boulder.y);
      if (dist < 70) {
        this.hitBoulder(boulder);
        hitSolid = true;
      }
    });

    // Check crates
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
    if (!enemy.active || enemy.getData('defeated')) return;

    enemy.setData('defeated', true);
    const runDir = enemy.x > this.player.x ? 1 : -1;
    enemy.setVelocityX(runDir * 300);
    enemy.setVelocityY(-200);
    if (enemy.body) {
      enemy.body.enable = false;
      enemy.body.checkCollision.none = true;
    }
    enemy.setTint(0xffaaaa);
    this.tweens.add({
      targets: enemy,
      alpha: 0,
      duration: 800,
      onComplete: () => enemy.destroy()
    });
    const type = enemy.getData('type');
    const name = type === 'crow' ? 'Crow' : 'Raccoon';
    this.showQuickMessage(`${name} scared away!`, 0x44ff44);
  }

  hitEnemy(player, enemy) {
    if (enemy.getData('defeated')) return;
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
    this.scene.launch('PauseScene', { callerScene: 'Level2Scene' });
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
    if (piece.getData('hidden') && !this.nightVisionActive) return;

    const px = piece.x, py = piece.y;
    piece.destroy();
    try { this.sound.play('generalpickup', { volume: 0.6 }); } catch(e) {}
    this.playerState.mapPieces++;
    this.playerState.collectedMapPieces.Level2Scene = true;
    this.showQuickMessage("MAP PIECE FOUND! (2/7)", 0xffd700);
    this.collectEffect(px, py, 0xffd700);

    this.time.delayedCall(1000, () => {
      this.showDialog([
        { speaker: 'Luna', text: "I can see it with my Night Vision! Another piece of the Puzzle Map!" },
        { speaker: 'Whiskers', text: "Great teamwork, Luna! That's 2 out of 7!" },
        { speaker: 'Luna', text: "See? I told you my eyes would come in handy!" },
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

    // Night Vision drains a bit extra thirst (concentration)
    if (this.nightVisionActive) {
      thirstDrain += 0.3;
    }

    state.hunger = Math.max(0, state.hunger - hungerDrain);
    state.thirst = Math.max(0, state.thirst - thirstDrain);

    if (state.hunger <= 0 || state.thirst <= 0) {
      if (!state.isExhausted) {
        state.isExhausted = true;
        this.player.setTint(0x999999);
        const msg = state.hunger <= 0 ? "So hungry... need tuna!" : "So thirsty... need water!";
        this.showDialog([
          { speaker: state.activeChar === 'luna' ? 'Luna' : 'Whiskers', text: msg },
          { speaker: state.activeChar === 'luna' ? 'Luna' : 'Whiskers', text: "I can't move until I find something..." }
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
      this.showQuickMessage(`${name}: "Be careful in the dark!"`, 0xffffff);
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
    if (this.mapPiece?.active) {
      this.showQuickMessage("Find this level's map piece before leaving!", 0xff4444);
      return;
    }
    this.hasExited = true;
    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.showQuickMessage("Heading to Tuna Bay Docks...", 0x44ff44);
    this.time.delayedCall(1000, () => {
      this.sound.stopAll();
      this.sound.play('level3music', { loop: true, volume: 0.4 });
      this.scene.stop('UIScene');
      this.scene.start('Level3Scene', { playerState: this.playerState });
    });
  }
}
