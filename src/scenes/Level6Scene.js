import Phaser from 'phaser';

export class Level6Scene extends Phaser.Scene {
  constructor() {
    super('Level6Scene');
  }

  init(data) {
    // Carry over state from Level 5 (or use defaults if starting fresh)
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
      mapPieces: 5,
      accessories: [],
      speed: 200,
      jumpPower: -400,
      lives: 9,
      isExhausted: false,
    };
    // Party & switching state
    this.playerState.party = this.playerState.party || ['whiskers', 'luna', 'boots', 'cleo'];
    this.playerState.activeChar = this.playerState.activeChar || 'whiskers';
    this.mochiRescued = false;
    this.tunasThisLevel = 0;
  }

  create() {
    const worldWidth = 6500;
    const worldHeight = 576;

    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

    // Start level 6 music
    this.sound.stopAll();
    this.sound.play('level6music', { loop: true, volume: 0.4 });

    // ---- Snowy mountain background ----
    this.createSnowBackground(worldWidth, worldHeight);

    // ---- Platforms ----
    this.platforms = this.physics.add.staticGroup();
    this.crates = this.physics.add.staticGroup();

    // Ground — snow-covered, with ice crevasse gaps
    // Gaps: 1400-1520, 2800-2920, 4500-4620
    const groundGaps = [
      [1400, 1520],
      [2800, 2920],
      [4500, 4620],
    ];

    const isInGap = (x) => {
      for (const [start, end] of groundGaps) {
        if (x >= start && x < end) return true;
      }
      return false;
    };

    for (let x = 0; x < worldWidth; x += 32) {
      if (isInGap(x)) continue;
      this.platforms.create(x + 16, worldHeight - 16, 'snow_ground');
      if (x % 64 === 0) {
        this.platforms.create(x + 16, worldHeight - 48, 'snow_ground');
      }
    }

    // Top snow layer
    for (let x = 0; x < worldWidth; x += 32) {
      if (isInGap(x)) continue;
      this.platforms.create(x + 16, worldHeight - 48, 'snow_platform');
    }

    // Floating platforms
    const floats = [
      { x: 250, y: 420, count: 3 },
      { x: 500, y: 360, count: 2 },
      { x: 750, y: 300, count: 4 },
      { x: 1000, y: 400, count: 3 },
      // Over gap 1 (1400-1520)
      { x: 1420, y: 380, count: 4 },
      { x: 1600, y: 320, count: 3 },
      { x: 1850, y: 280, count: 2 },
      { x: 2050, y: 360, count: 3 },
      { x: 2300, y: 300, count: 4 },
      { x: 2550, y: 260, count: 3 },
      // Over gap 2 (2800-2920)
      { x: 2820, y: 370, count: 4 },
      { x: 3000, y: 320, count: 3 },
      { x: 3200, y: 280, count: 4 },
      { x: 3450, y: 400, count: 2 },
      { x: 3700, y: 340, count: 3 },
      { x: 3950, y: 290, count: 4 },
      { x: 4150, y: 350, count: 3 },
      // Over gap 3 (4500-4620)
      { x: 4520, y: 380, count: 4 },
      { x: 4700, y: 320, count: 3 },
      { x: 4900, y: 280, count: 4 },
      { x: 5100, y: 350, count: 3 },
      { x: 5300, y: 300, count: 4 },
      // Ice cave area — elevated platforms leading to map piece
      { x: 5500, y: 360, count: 3 },
      { x: 5600, y: 300, count: 4 },
      { x: 5700, y: 240, count: 3 },
      { x: 5750, y: 180, count: 4 },  // Map piece platform (reachable with Belly Bounce)
      { x: 5950, y: 320, count: 3 },
      { x: 6200, y: 380, count: 3 },
    ];

    floats.forEach(p => {
      for (let i = 0; i < p.count; i++) {
        this.platforms.create(p.x + i * 32, p.y, 'snow_platform');
      }
    });

    // Breakable crates
    const cratePositions = [
      { x: 400, y: worldHeight - 80 },
      { x: 1200, y: worldHeight - 80 },
      { x: 1900, y: worldHeight - 80 },
      { x: 2500, y: worldHeight - 80 },
      { x: 3300, y: worldHeight - 80 },
      { x: 4000, y: worldHeight - 80 },
      { x: 5000, y: worldHeight - 80 },
    ];

    cratePositions.forEach(pos => {
      const crate = this.crates.create(pos.x, pos.y, 'crate');
      crate.setData('health', 2);
    });

    // ---- Snow decorations (pine trees) ----
    this.createSnowDecorations(worldWidth, worldHeight);

    // ---- Ice Zones ----
    this.iceZones = [
      { x: 600, width: 400 },
      { x: 1800, width: 500 },
      { x: 3100, width: 400 },
      { x: 4800, width: 600 },
    ];

    // Visual ice zone indicators
    this.iceZones.forEach(zone => {
      const iceOverlay = this.add.graphics();
      iceOverlay.fillStyle(0x88ccff, 0.15);
      iceOverlay.fillRect(zone.x, worldHeight - 52, zone.width, 10);
      iceOverlay.setDepth(2);
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

    // Tuna spread (22 positions — plenty for the 5-tuna Mochi requirement)
    const tunaX = [100, 280, 450, 650, 850, 1050, 1300, 1550, 1750, 1950, 2150, 2400, 2650, 2900, 3150, 3400, 3700, 3950, 4250, 4650, 4900, 5200];
    tunaX.forEach(x => {
      const t = this.tunas.create(x, worldHeight - 90, 'tuna');
      t.body.setAllowGravity(false);
      this.addFloatAnimation(t);
    });

    // Water (12 positions)
    const waterX = [200, 500, 900, 1250, 1650, 2050, 2500, 3000, 3350, 3800, 4400, 5100];
    waterX.forEach(x => {
      const w = this.waters.create(x, worldHeight - 85, 'water');
      w.body.setAllowGravity(false);
      this.addFloatAnimation(w);
    });

    // Map piece 6/7 — in ice cave area, high platform reachable with Mochi's Belly Bounce
    this.mapPiece = this.mapPieces.create(5800, 150, 'map_piece');
    this.mapPiece.body.setAllowGravity(false);
    this.mapPiece.setScale(1.5);
    this.addFloatAnimation(this.mapPiece);
    this.addGlowEffect(this.mapPiece);

    // ---- Mochi NPC (stuck in a hole in the snow) ----
    this.mochiNpc = this.physics.add.staticImage(4200, worldHeight - 60, 'cat_mochi_f0');
    this.mochiNpc.setScale(1.5);
    this.mochiNpc.setDepth(10);

    // Mochi snoring text
    this.mochiCryText = this.add.text(4200, worldHeight - 110, '"Zzzzz... so cozy..."', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#FFAA88',
      fontStyle: 'italic',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(15);

    this.tweens.add({
      targets: this.mochiCryText,
      alpha: 0.3,
      duration: 1500,
      yoyo: true,
      repeat: -1
    });

    // ---- NPCs ----
    this.npcs = this.physics.add.staticGroup();

    // Shivering Cat near start
    const shiveringCat = this.npcs.create(300, worldHeight - 75, 'npc_cat');
    shiveringCat.setScale(1.1);
    shiveringCat.setTint(0xaabbcc);
    shiveringCat.setData('name', 'Shivering Cat');
    shiveringCat.setData('dialogIndex', 0);
    shiveringCat.setData('dialogs', [
      { speaker: 'Shivering Cat', text: "B-b-brr! The Dog King's fortress is just beyond these mountains!" },
      { speaker: 'Shivering Cat', text: "I heard his throne is made of BONES and he sleeps on a bed of LAVA!" },
      { speaker: 'Whiskers', text: "...That sounds uncomfortable." },
      { speaker: 'Shivering Cat', text: "Watch out for the icy patches! You'll slide around like a furry hockey puck!" },
    ]);
    this.addExclamation(shiveringCat);

    // Mountain Goat mid-level
    const mountainGoat = this.npcs.create(3500, worldHeight - 75, 'npc_cat');
    mountainGoat.setScale(1.3);
    mountainGoat.setTint(0xddccaa);
    mountainGoat.setData('name', 'Mountain Goat');
    mountainGoat.setData('dialogIndex', 0);
    mountainGoat.setData('dialogs', [
      { speaker: 'Mountain Goat', text: "You're looking for your round friend? He rolled into a hole about 500 steps east." },
      { speaker: 'Mountain Goat', text: "Said something about being 'committed to his location.'" },
      { speaker: 'Whiskers', text: "That sounds like Mochi alright." },
      { speaker: 'Mountain Goat', text: "He asked anyone who finds him to bring some tuna. Said he won't wiggle out on an empty stomach!" },
    ]);
    this.addExclamation(mountainGoat);

    // ---- Enemies ----
    this.enemies = this.physics.add.group();

    // Snow foxes (ground patrol)
    const foxPositions = [
      { x: 500, y: worldHeight - 80, patrolRange: 120 },
      { x: 1100, y: worldHeight - 80, patrolRange: 100 },
      { x: 1700, y: worldHeight - 80, patrolRange: 130 },
      { x: 2400, y: worldHeight - 80, patrolRange: 100 },
      { x: 3200, y: worldHeight - 80, patrolRange: 90 },
      { x: 3800, y: worldHeight - 80, patrolRange: 110 },
      { x: 4800, y: worldHeight - 80, patrolRange: 100 },
    ];

    foxPositions.forEach(pos => {
      const enemy = this.enemies.create(pos.x, pos.y, 'snow_fox');
      enemy.setScale(1.2);
      enemy.setBounce(0);
      enemy.setCollideWorldBounds(true);
      enemy.setData('startX', pos.x);
      enemy.setData('patrolRange', pos.patrolRange);
      enemy.setData('direction', 1);
      enemy.setData('type', 'snow_fox');
      enemy.setVelocityX(50);
    });

    // Ice bats (flying, sine wave)
    this.iceBats = [];
    const batPositions = [600, 1500, 2200, 3000, 3600, 4400, 5200];
    batPositions.forEach(x => {
      const bat = this.enemies.create(x, 200, 'ice_bat');
      bat.setScale(1.3);
      bat.body.setAllowGravity(false);
      bat.setData('startX', x);
      bat.setData('startY', 200);
      bat.setData('type', 'ice_bat');
      bat.setData('time', Math.random() * Math.PI * 2);
      this.iceBats.push(bat);
    });

    // ---- Falling Snowflakes ----
    this.createSnowflakes();

    // ---- Colliders ----
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.player, this.crates);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.collider(this.enemies, this.crates, null, (enemy) => {
      return enemy.getData('type') !== 'ice_bat';
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

    // ---- Camera ----
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.fadeIn(1000);

    // ---- UI ----
    this.scene.launch('UIScene', { playerState: this.playerState, levelKey: 'Level6Scene' });

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
        { speaker: 'Cleo', text: "I HATE the cold. My fur is too thin for this." },
        { speaker: 'Boots', text: "Just run faster! That warms you up!" },
        { speaker: 'Cleo', text: "Not all of us solve every problem by running, Boots." },
        { speaker: 'Whiskers', text: "Come on, we're almost there. Just two more map pieces to find." },
      ]);
    });

    this.nearbyNpc = null;

    // ---- Level Exit ----
    const exitSign = this.add.image(worldWidth - 80, worldHeight - 80, 'exit_sign');
    exitSign.setScale(2);
    exitSign.setDepth(5);
    this.addFloatAnimation(exitSign);
    this.add.text(worldWidth - 80, worldHeight - 120, "To Dog King's Fortress", {
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
  createSnowBackground(worldWidth, worldHeight) {
    // Pale blue / white sky
    const sky = this.add.graphics();
    sky.fillGradientStyle(0xc8dce8, 0xc8dce8, 0xe8f0f8, 0xe8f0f8);
    sky.fillRect(0, 0, 1024, worldHeight);
    sky.setScrollFactor(0);
    sky.setDepth(-10);

    // Clouds
    const clouds = this.add.graphics();
    clouds.setScrollFactor(0.05);
    clouds.setDepth(-9);
    clouds.fillStyle(0xffffff, 0.6);
    for (let i = 0; i < 15; i++) {
      const cx = Math.random() * worldWidth;
      const cy = 30 + Math.random() * 80;
      const cw = 60 + Math.random() * 80;
      const ch = 20 + Math.random() * 15;
      clouds.fillEllipse(cx, cy, cw, ch);
      clouds.fillEllipse(cx + cw * 0.3, cy - 5, cw * 0.7, ch * 0.8);
      clouds.fillEllipse(cx - cw * 0.2, cy + 3, cw * 0.5, ch * 0.6);
    }

    // Distant snow-capped mountains
    const farMountains = this.add.graphics();
    farMountains.setScrollFactor(0.1);
    farMountains.setDepth(-8);
    farMountains.fillStyle(0x8899aa, 0.7);
    for (let i = 0; i < worldWidth / 200; i++) {
      const mx = i * 200 + Math.random() * 60;
      const mh = 150 + Math.random() * 120;
      farMountains.fillTriangle(mx - 80, worldHeight - 60, mx, worldHeight - 60 - mh, mx + 80, worldHeight - 60);
      // Snow cap
      farMountains.fillStyle(0xeef4fa, 0.8);
      farMountains.fillTriangle(mx - 25, worldHeight - 60 - mh + 40, mx, worldHeight - 60 - mh, mx + 25, worldHeight - 60 - mh + 40);
      farMountains.fillStyle(0x8899aa, 0.7);
    }

    // Mid-range peaks
    const midPeaks = this.add.graphics();
    midPeaks.setScrollFactor(0.3);
    midPeaks.setDepth(-7);
    midPeaks.fillStyle(0x667788, 0.6);
    for (let i = 0; i < worldWidth / 150; i++) {
      const mx = i * 150 + Math.random() * 40;
      const mh = 100 + Math.random() * 80;
      midPeaks.fillTriangle(mx - 50, worldHeight - 50, mx, worldHeight - 50 - mh, mx + 50, worldHeight - 50);
      // Snow cap
      midPeaks.fillStyle(0xdde8f0, 0.7);
      midPeaks.fillTriangle(mx - 18, worldHeight - 50 - mh + 30, mx, worldHeight - 50 - mh, mx + 18, worldHeight - 50 - mh + 30);
      midPeaks.fillStyle(0x667788, 0.6);
    }

    // Pine trees in background
    const pines = this.add.graphics();
    pines.setScrollFactor(0.2);
    pines.setDepth(-6);
    pines.fillStyle(0x2a4a3a, 0.5);
    for (let i = 0; i < worldWidth / 70; i++) {
      const tx = i * 70 + Math.random() * 30;
      const th = 40 + Math.random() * 30;
      pines.fillTriangle(tx - 12, worldHeight - 55, tx, worldHeight - 55 - th, tx + 12, worldHeight - 55);
      pines.fillTriangle(tx - 9, worldHeight - 55 - th * 0.3, tx, worldHeight - 55 - th - 15, tx + 9, worldHeight - 55 - th * 0.3);
    }

    // Fog / mist layer
    const mist = this.add.graphics();
    mist.setScrollFactor(0.05);
    mist.setDepth(5);
    mist.fillStyle(0xccddee, 0.1);
    for (let i = 0; i < 20; i++) {
      mist.fillEllipse(Math.random() * worldWidth, worldHeight - 100 + Math.random() * 60, 80 + Math.random() * 100, 20 + Math.random() * 15);
    }
  }

  createSnowDecorations(worldWidth, worldHeight) {
    // Foreground pine trees with snow
    for (let i = 0; i < worldWidth / 350; i++) {
      const tx = i * 350 + Math.random() * 100 + 50;
      const trunk = this.add.image(tx, worldHeight - 80, 'tree_trunk');
      trunk.setDepth(3);
      trunk.setAlpha(0.8);
      trunk.setTint(0x556655);
      const canopy = this.add.image(tx, worldHeight - 130, 'tree_canopy');
      canopy.setScale(1.2 + Math.random() * 0.5);
      canopy.setDepth(3);
      canopy.setAlpha(0.7);
      canopy.setTint(0x2a5a3a);
    }

    // Ice cave label
    this.add.text(5800, 110, 'The Ice Cave', {
      fontSize: '16px', fontFamily: 'Georgia, serif',
      color: '#88ccff', fontStyle: 'italic',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(4);

    // Mochi's hole label
    this.add.text(4200, worldHeight - 140, "Mochi's Hole", {
      fontSize: '12px', fontFamily: 'Georgia, serif',
      color: '#FFAA88', fontStyle: 'italic',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(4);
  }

  createSnowflakes() {
    this.snowflakes = [];
    for (let i = 0; i < 40; i++) {
      const sf = this.add.graphics();
      sf.fillStyle(0xffffff, 0.5 + Math.random() * 0.4);
      sf.fillCircle(0, 0, 1 + Math.random() * 2);
      sf.setPosition(Math.random() * 6500, Math.random() * 576);
      sf.setDepth(6);

      // Gentle falling + drifting
      this.tweens.add({
        targets: sf,
        y: sf.y + 200 + Math.random() * 300,
        x: sf.x + Phaser.Math.Between(-40, 40),
        duration: 4000 + Math.random() * 4000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      this.tweens.add({
        targets: sf,
        alpha: { from: 0.3, to: 0.9 },
        duration: 1500 + Math.random() * 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Math.random() * 2000
      });

      this.snowflakes.push(sf);
    }
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

  // ---- MOCHI RESCUE ----
  rescueMochi() {
    if (this.mochiRescued) return;
    this.mochiRescued = true;
    this.mochiCryText.destroy();

    // Mochi rescue animation
    this.tweens.add({
      targets: this.mochiNpc,
      y: this.mochiNpc.y - 20,
      duration: 300,
      yoyo: true,
      onComplete: () => {
        this.showDialog([
          { speaker: 'Mochi', text: "Oh, hi there! I was napping and I think I rolled into this hole. It's actually pretty cozy." },
          { speaker: 'Whiskers', text: "We've been looking for you, Mochi! We need your help!" },
          { speaker: 'Mochi', text: "Help? Hmm... I could wiggle out, but I'm gonna need some motivation." },
          { speaker: 'Mochi', text: "You brought tuna? FIVE whole tunas?! Okay okay, I'm wiggling!" },
          { speaker: 'Cleo', text: "...He was stuck because he WANTED to be stuck." },
          { speaker: 'Mochi', text: "Belly Bounce. It's all about the physics, baby." },
          { speaker: 'Mochi', text: "Press TAB to switch to me, then W for my Belly Bounce — super high jump!" },
          { speaker: 'Boots', text: "He heard the Dog King has a MUSTACHE made of FIRE!" },
          { speaker: 'Mochi', text: "It's true! A FIRE MUSTACHE! How cool is that?!" },
        ]);

        // Add Mochi to party
        this.playerState.party.push('mochi');

        // Remove NPC sprite
        this.time.delayedCall(100, () => {
          this.mochiNpc.destroy();
        });

        this.showQuickMessage("MOCHI JOINED THE PARTY!", 0xff8800);
      }
    });
  }

  // ---- ICE PHYSICS ----
  isOnIce() {
    for (const zone of this.iceZones) {
      if (this.player.x >= zone.x && this.player.x <= zone.x + zone.width) {
        return true;
      }
    }
    return false;
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
    const onIce = this.isOnIce();

    // Speed calculation
    let speed = this.playerState.isRunning ? this.playerState.speed * 1.6 : this.playerState.speed;

    // Movement (cat is drawn facing left, so flipX=false=left, flipX=true=right)
    const leftDown = this.cursors.left.isDown || this.keyA.isDown;
    const rightDown = this.cursors.right.isDown || this.keyD.isDown;

    if (leftDown) {
      if (onIce && onGround) {
        // Ice physics: gradual acceleration
        const currentVelX = this.player.body.velocity.x;
        this.player.setVelocityX(Math.max(currentVelX - 8, -speed));
      } else {
        this.player.setVelocityX(-speed);
      }
      this.player.setFlipX(false);
      this.playerState.facingRight = false;
    } else if (rightDown) {
      if (onIce && onGround) {
        // Ice physics: gradual acceleration
        const currentVelX = this.player.body.velocity.x;
        this.player.setVelocityX(Math.min(currentVelX + 8, speed));
      } else {
        this.player.setVelocityX(speed);
      }
      this.player.setFlipX(true);
      this.playerState.facingRight = true;
    } else {
      if (onIce && onGround) {
        // Ice physics: slow deceleration (0.3x — player slides)
        const currentVelX = this.player.body.velocity.x;
        this.player.setVelocityX(currentVelX * 0.97);
        if (Math.abs(currentVelX) < 5) this.player.setVelocityX(0);
      } else {
        this.player.setVelocityX(0);
      }
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

    // Mochi Belly Bounce (W)
    if (Phaser.Input.Keyboard.JustDown(this.keyW)) {
      this.bellyBounce();
    }

    // NPC interaction (E)
    this.checkNpcProximity();
    if (Phaser.Input.Keyboard.JustDown(this.keyE) && this.nearbyNpc) {
      this.interactWithNpc(this.nearbyNpc);
    }

    // Check Mochi rescue proximity
    if (!this.mochiRescued && this.mochiNpc && this.mochiNpc.active) {
      const distToMochi = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.mochiNpc.x, this.mochiNpc.y);
      if (distToMochi < 60 && this.tunasThisLevel >= 5) {
        this.rescueMochi();
      } else if (distToMochi < 60 && this.tunasThisLevel < 5 && !this._mochiHintShown) {
        this.showQuickMessage(`Mochi wants 5 tuna! (${this.tunasThisLevel}/5 collected)`, 0xffaa44);
        this._mochiHintShown = true;
        this.time.delayedCall(5000, () => { this._mochiHintShown = false; });
      }
    }

    // Enemy patrol AI
    this.enemies.children.each(enemy => {
      if (!enemy.active) return;
      const type = enemy.getData('type');

      if (type === 'ice_bat') {
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

    // Ice zone warning
    if (onIce && !this._iceWarnShown) {
      this.showQuickMessage("Slippery ice! Watch your footing!", 0x88ccff);
      this._iceWarnShown = true;
      this.time.delayedCall(10000, () => { this._iceWarnShown = false; });
    }

    // Fall into crevasse
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
    const name = type === 'ice_bat' ? 'Ice Bat' : 'Snow Fox';
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
      this.loseLife("KO'd by enemy!", player.x, player.y);
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
    this.tunasThisLevel++;
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
    this.showQuickMessage("MAP PIECE FOUND! (6/7)", 0xffd700);
    this.collectEffect(px, py, 0xffd700);

    this.time.delayedCall(1000, () => {
      this.showDialog([
        { speaker: 'Whiskers', text: "Another piece of the Puzzle Map! Found it in the ice cave!" },
        { speaker: 'Mochi', text: "See? Belly Bounce gets you EVERYWHERE!" },
        { speaker: 'Cleo', text: "That's 6 out of 7! Just one more piece!" },
        { speaker: 'Boots', text: "The Dog King better watch out! We're coming for him!" },
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

    // Cold drains hunger slightly faster
    hungerDrain += 0.2;

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
      this.showQuickMessage(`${name}: "Brrr... stay warm out there!"`, 0xffffff);
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
    this.showQuickMessage("Heading to the Dog King's Fortress...", 0x44ff44);
    this.time.delayedCall(1000, () => {
      this.sound.stopAll();
      this.sound.play('level7music', { loop: true, volume: 0.4 });
      this.scene.stop('UIScene');
      this.scene.start('Level7Scene', { playerState: this.playerState });
    });
  }
}
