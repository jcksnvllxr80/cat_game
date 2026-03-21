import Phaser from 'phaser';

export class Level4Scene extends Phaser.Scene {
  constructor() {
    super('Level4Scene');
  }

  init(data) {
    // Carry over state from Level 3 (or use defaults if starting fresh)
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
      mapPieces: 3,
      accessories: [],
      speed: 200,
      jumpPower: -400,
      isExhausted: false,
    };
    // Party & switching state
    this.playerState.party = this.playerState.party || ['whiskers', 'luna', 'boots'];
    this.playerState.activeChar = this.playerState.activeChar || 'whiskers';
    this.cleoRescued = false;
    this.vinesCut = 0;
  }

  create() {
    const worldWidth = 6000;
    const worldHeight = 576;

    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

    // Start level 4 music
    this.sound.stopAll();
    this.sound.play('level4music', { loop: true, volume: 0.4 });

    // ---- Canyon background ----
    this.createCanyonBackground(worldWidth, worldHeight);

    // ---- Platforms ----
    this.platforms = this.physics.add.staticGroup();
    this.crates = this.physics.add.staticGroup();

    // Ground
    for (let x = 0; x < worldWidth; x += 32) {
      // Canyon crevasses (gaps/pits)
      if ((x > 1400 && x < 1520) || (x > 2800 && x < 2920) || (x > 4200 && x < 4320) || (x > 5200 && x < 5320)) continue;
      this.platforms.create(x + 16, worldHeight - 16, 'canyon_ground');
      if (x % 64 === 0) {
        this.platforms.create(x + 16, worldHeight - 48, 'canyon_ground');
      }
    }

    // Top layer
    for (let x = 0; x < worldWidth; x += 32) {
      if ((x > 1400 && x < 1520) || (x > 2800 && x < 2920) || (x > 4200 && x < 4320) || (x > 5200 && x < 5320)) continue;
      this.platforms.create(x + 16, worldHeight - 48, 'canyon_platform');
    }

    // Floating platforms — more vertical layout with lots of high platforms and tall columns
    const floats = [
      { x: 200, y: 420, count: 3 },
      { x: 450, y: 360, count: 2 },
      { x: 650, y: 300, count: 3 },
      { x: 850, y: 240, count: 2 },
      { x: 1050, y: 380, count: 4 },
      { x: 1300, y: 320, count: 3 },
      { x: 1440, y: 380, count: 4 },  // over pit
      { x: 1600, y: 280, count: 3 },
      { x: 1800, y: 220, count: 2 },
      { x: 2000, y: 340, count: 3 },
      { x: 2200, y: 260, count: 4 },
      { x: 2400, y: 200, count: 3 },
      { x: 2600, y: 380, count: 2 },
      { x: 2840, y: 340, count: 4 },  // over pit
      { x: 3000, y: 280, count: 3 },
      // Cleo cliff area — tall column of platforms
      { x: 3100, y: 400, count: 3 },
      { x: 3150, y: 340, count: 2 },
      { x: 3100, y: 280, count: 3 },
      { x: 3150, y: 220, count: 2 },
      { x: 3100, y: 160, count: 4 },  // Cleo's platform at top
      { x: 3400, y: 360, count: 3 },
      { x: 3600, y: 300, count: 2 },
      { x: 3800, y: 240, count: 3 },
      { x: 4000, y: 380, count: 4 },
      { x: 4220, y: 340, count: 4 },  // over pit
      { x: 4400, y: 280, count: 3 },
      { x: 4600, y: 220, count: 2 },
      { x: 4800, y: 360, count: 3 },
      { x: 5000, y: 300, count: 4 },
      { x: 5220, y: 350, count: 4 },  // over pit
      // Summit area — very high platforms
      { x: 5400, y: 280, count: 3 },
      { x: 5450, y: 200, count: 2 },
      { x: 5400, y: 140, count: 3 },
      { x: 5450, y: 80, count: 4 },   // summit platform (map piece)
    ];

    floats.forEach(p => {
      for (let i = 0; i < p.count; i++) {
        this.platforms.create(p.x + i * 32, p.y, 'canyon_platform');
      }
    });

    // Breakable crates
    const cratePositions = [
      { x: 350, y: worldHeight - 80 },
      { x: 1200, y: worldHeight - 80 },
      { x: 1800, y: 188 },
      { x: 2500, y: worldHeight - 80 },
      { x: 3500, y: worldHeight - 80 },
      { x: 4500, y: worldHeight - 80 },
      { x: 5100, y: worldHeight - 80 },
    ];

    cratePositions.forEach(pos => {
      const crate = this.crates.create(pos.x, pos.y, 'crate');
      crate.setData('health', 2);
    });

    // ---- Cleo Rescue Puzzle (vine roots) ----
    this.vines = this.physics.add.staticGroup();
    this.vineData = [];

    const vinePositions = [
      { x: 3100, y: worldHeight - 80 },
      { x: 3200, y: worldHeight - 80 },
      { x: 3300, y: worldHeight - 80 },
    ];

    vinePositions.forEach(pos => {
      const v = this.vines.create(pos.x, pos.y, 'crate'); // using crate as vine root placeholder
      v.setTint(0x44aa44);
      v.setScale(0.8);
      v.setData('health', 2);
      this.vineData.push(v);
    });

    // Vine visual indicators (ropes going up to Cleo)
    const vineRopeGraphics = this.add.graphics();
    vineRopeGraphics.setDepth(2);
    vineRopeGraphics.lineStyle(3, 0x228822, 0.6);
    vinePositions.forEach(pos => {
      vineRopeGraphics.lineBetween(pos.x, pos.y - 20, pos.x + Phaser.Math.Between(-20, 20), 150);
    });
    this.vineRopeGraphics = vineRopeGraphics;

    // "Vine roots" label
    this.add.text(3200, worldHeight - 120, '"Cut the vine roots!"', {
      fontSize: '11px',
      fontFamily: 'Arial, sans-serif',
      color: '#44FF44',
      fontStyle: 'italic',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(15);

    // Cleo trapped on high cliff (tangled in vines)
    this.cleoNpc = this.physics.add.staticImage(3200, 150, 'cat_whiskers_f0'); // placeholder texture
    this.cleoNpc.setScale(1.5);
    this.cleoNpc.setTint(0xddccaa); // Siamese coloring hint
    this.cleoNpc.setDepth(1);

    // Cleo cry for help text
    this.cleoCryText = this.add.text(3200, 110, '"Help! I\'m tangled in these vines!"', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#FFDD88',
      fontStyle: 'italic',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(15);

    this.tweens.add({
      targets: this.cleoCryText,
      alpha: 0.3,
      duration: 1500,
      yoyo: true,
      repeat: -1
    });

    // ---- Decorative canyon elements ----
    this.createCanyonDecor(worldWidth, worldHeight);

    // ---- Player ----
    const charTextureMap = {
      'whiskers': 'cat_whiskers_f0',
      'luna': 'cat_luna_f0',
      'boots': 'cat_boots_f0',
      'cleo': 'cat_cleo_f0',
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

    // Tuna spread (18 positions)
    const tunaX = [120, 320, 550, 780, 1050, 1350, 1650, 1900, 2150, 2450, 2700, 2950, 3250, 3550, 3850, 4150, 4500, 4850];
    tunaX.forEach(x => {
      const t = this.tunas.create(x, worldHeight - 90, 'tuna');
      t.body.setAllowGravity(false);
      this.addFloatAnimation(t);
    });

    // Water (12 positions)
    const waterX = [220, 500, 850, 1200, 1550, 1850, 2300, 2650, 3050, 3450, 3900, 4700];
    waterX.forEach(x => {
      const w = this.waters.create(x, worldHeight - 85, 'water');
      w.body.setAllowGravity(false);
      this.addFloatAnimation(w);
    });

    // Map piece 4/7 — at the canyon summit (very high platform)
    this.mapPiece = this.mapPieces.create(5500, 100, 'map_piece');
    this.mapPiece.body.setAllowGravity(false);
    this.mapPiece.setScale(1.5);
    this.addFloatAnimation(this.mapPiece);
    this.addGlowEffect(this.mapPiece);

    // ---- NPCs ----
    this.npcs = this.physics.add.staticGroup();

    // Shopkeeper Cat (Tall Tales Tavern area)
    const shopkeeper = this.npcs.create(250, worldHeight - 68, 'npc_cat');
    shopkeeper.setScale(1.1);
    shopkeeper.setTint(0xcc9966);
    shopkeeper.setData('name', 'Shopkeeper Cat');
    shopkeeper.setData('dialogIndex', 0);
    shopkeeper.setData('dialogs', [
      { speaker: 'Shopkeeper Cat', text: "Welcome to the Tall Tales Tavern! Need supplies?" },
      { speaker: 'Shopkeeper Cat', text: "I heard the Dog King has an army of TEN THOUSAND dogs!" },
      { speaker: 'Whiskers', text: "Ten thousand?! That's... a lot of dogs." },
      { speaker: 'Shopkeeper Cat', text: "Better stock up on tuna! You'll need the energy!" },
    ]);
    this.addExclamation(shopkeeper);

    // Traveling Cat (Tall Tales Tavern)
    const traveler = this.npcs.create(400, worldHeight - 68, 'npc_cat');
    traveler.setScale(1.0);
    traveler.setTint(0xaa7744);
    traveler.setData('name', 'Traveling Cat');
    traveler.setData('dialogIndex', 0);
    traveler.setData('dialogs', [
      { speaker: 'Traveling Cat', text: "Ten thousand? I heard it was a MILLION. And they all breathe fire." },
      { speaker: 'Whiskers', text: "Dogs that breathe fire? That doesn't sound right..." },
      { speaker: 'Traveling Cat', text: "Hey, I'm just telling you what I heard. Don't shoot the messenger!" },
    ]);
    this.addExclamation(traveler);

    // Kit the Kitten (Tall Tales Tavern — small)
    const kit = this.npcs.create(500, worldHeight - 60, 'npc_cat');
    kit.setScale(0.7);
    kit.setTint(0xffcc88);
    kit.setData('name', 'Kit the Kitten');
    kit.setData('dialogIndex', 0);
    kit.setData('dialogs', [
      { speaker: 'Kit the Kitten', text: "My big brother says the Dog King can fly." },
      { speaker: 'Whiskers', text: "Fly?! Come on, dogs can't fly!" },
      { speaker: 'Kit the Kitten', text: "My big brother NEVER lies! ...except sometimes." },
    ]);
    this.addExclamation(kit);

    // Canyon Guide Cat (mid-level, hints about Cleo and map piece)
    const guide = this.npcs.create(2000, worldHeight - 75, 'npc_cat');
    guide.setScale(1.3);
    guide.setTint(0xdd8855);
    guide.setData('name', 'Canyon Guide Cat');
    guide.setData('dialogIndex', 0);
    guide.setData('dialogs', [
      { speaker: 'Canyon Guide Cat', text: "Careful in this canyon, friend. The hawks are fierce around here." },
      { speaker: 'Canyon Guide Cat', text: "I've been hearing someone calling for help from the high cliffs to the east." },
      { speaker: 'Canyon Guide Cat', text: "Sounds like a cat got tangled in the canyon vines. Poor thing's stuck way up there." },
      { speaker: 'Canyon Guide Cat', text: "If you can cut the vine roots at the base of the cliff, that should free them!" },
      { speaker: 'Canyon Guide Cat', text: "Oh, and there's something glowing at the very summit of the canyon. Might be worth the climb!" },
    ]);
    this.addExclamation(guide);

    // ---- Enemies ----
    this.enemies = this.physics.add.group();

    // Snakes (ground patrol)
    const snakePositions = [
      { x: 600, y: worldHeight - 80, patrolRange: 120 },
      { x: 1200, y: worldHeight - 80, patrolRange: 100 },
      { x: 2400, y: worldHeight - 80, patrolRange: 130 },
      { x: 3000, y: worldHeight - 80, patrolRange: 100 },
      { x: 3600, y: worldHeight - 80, patrolRange: 90 },
      { x: 4500, y: worldHeight - 80, patrolRange: 110 },
      { x: 5000, y: worldHeight - 80, patrolRange: 100 },
    ];

    snakePositions.forEach(pos => {
      const enemy = this.enemies.create(pos.x, pos.y, 'snake');
      enemy.setScale(1.2);
      enemy.setBounce(0);
      enemy.setCollideWorldBounds(true);
      enemy.setData('startX', pos.x);
      enemy.setData('patrolRange', pos.patrolRange);
      enemy.setData('direction', 1);
      enemy.setData('type', 'snake');
      enemy.setVelocityX(50);
    });

    // Hawks (flying, sine wave)
    this.hawks = [];
    const hawkPositions = [500, 1100, 1700, 2300, 2900, 3500, 4100, 4700, 5300];
    hawkPositions.forEach(x => {
      const hawk = this.enemies.create(x, 180, 'hawk');
      hawk.setScale(1.3);
      hawk.body.setAllowGravity(false);
      hawk.setData('startX', x);
      hawk.setData('startY', 180);
      hawk.setData('type', 'hawk');
      hawk.setData('time', Math.random() * Math.PI * 2);
      this.hawks.push(hawk);
    });

    // ---- Dust particles (ambient decoration) ----
    this.createDustParticles(worldWidth, worldHeight);

    // ---- Colliders ----
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.player, this.crates);
    this.physics.add.collider(this.player, this.vines);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.collider(this.enemies, this.crates, null, (enemy) => {
      return enemy.getData('type') !== 'hawk';
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

    // ---- Camera ----
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.fadeIn(1000);

    // ---- UI ----
    this.scene.launch('UIScene', { playerState: this.playerState, levelKey: 'Level4Scene' });

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
        { speaker: 'Whiskers', text: "Catnip Canyon... it's scorching hot out here." },
        { speaker: 'Whiskers', text: "Look at all these cats gathered at that tavern. Let's see what they know." },
        { speaker: 'Whiskers', text: "I can hear someone calling for help from the cliffs above!" },
      ]);
    });

    this.nearbyNpc = null;

    // ---- Level Exit ----
    const exitSign = this.add.image(worldWidth - 80, worldHeight - 80, 'exit_sign');
    exitSign.setScale(2);
    exitSign.setDepth(5);
    this.addFloatAnimation(exitSign);
    this.add.text(worldWidth - 80, worldHeight - 120, 'To The Yarn Factory', {
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
  createCanyonBackground(worldWidth, worldHeight) {
    // Warm orange/red sky
    const sky = this.add.graphics();
    sky.fillGradientStyle(0xcc5522, 0xdd6633, 0xff8844, 0xffaa55);
    sky.fillRect(0, 0, 1024, worldHeight);
    sky.setScrollFactor(0);
    sky.setDepth(-10);

    // Distant canyon walls (far layer — dark reddish brown)
    const farWalls = this.add.graphics();
    farWalls.setScrollFactor(0.1);
    farWalls.setDepth(-9);
    farWalls.fillStyle(0x663322, 0.8);
    for (let i = 0; i < worldWidth / 100; i++) {
      const tx = i * 100 + Math.random() * 40;
      const th = 150 + Math.random() * 120;
      // Canyon wall columns
      const w = 40 + Math.random() * 30;
      farWalls.fillRect(tx, worldHeight - 60 - th, w, th + 60);
      // Pointed tops
      farWalls.fillTriangle(tx - 5, worldHeight - 60 - th, tx + w / 2, worldHeight - 60 - th - 30, tx + w + 5, worldHeight - 60 - th);
    }

    // Mid canyon walls (brownish-red)
    const midWalls = this.add.graphics();
    midWalls.setScrollFactor(0.3);
    midWalls.setDepth(-8);
    midWalls.fillStyle(0x884422, 0.7);
    for (let i = 0; i < worldWidth / 80; i++) {
      const tx = i * 80 + Math.random() * 30;
      const th = 100 + Math.random() * 80;
      const w = 30 + Math.random() * 25;
      midWalls.fillRect(tx, worldHeight - 50 - th, w, th + 50);
    }

    // Near canyon walls (orange-brown)
    const nearWalls = this.add.graphics();
    nearWalls.setScrollFactor(0.5);
    nearWalls.setDepth(-7);
    nearWalls.fillStyle(0xaa5533, 0.5);
    for (let i = 0; i < worldWidth / 120; i++) {
      const tx = i * 120 + Math.random() * 50;
      const th = 60 + Math.random() * 50;
      const w = 25 + Math.random() * 20;
      nearWalls.fillRect(tx, worldHeight - 50 - th, w, th + 50);
    }

    // Cacti silhouettes
    const cacti = this.add.graphics();
    cacti.setScrollFactor(0.15);
    cacti.setDepth(-6);
    cacti.fillStyle(0x224411, 0.6);
    for (let i = 0; i < worldWidth / 200; i++) {
      const cx = i * 200 + Math.random() * 80;
      const ch = 30 + Math.random() * 40;
      // Cactus trunk
      cacti.fillRect(cx - 4, worldHeight - 70 - ch, 8, ch);
      // Arms
      cacti.fillRect(cx - 15, worldHeight - 70 - ch * 0.6, 12, 6);
      cacti.fillRect(cx - 15, worldHeight - 70 - ch * 0.6 - 15, 6, 15);
      cacti.fillRect(cx + 4, worldHeight - 70 - ch * 0.4, 12, 6);
      cacti.fillRect(cx + 10, worldHeight - 70 - ch * 0.4 - 12, 6, 12);
    }

    // Dust haze layer
    const dust = this.add.graphics();
    dust.setScrollFactor(0.05);
    dust.setDepth(5);
    dust.fillStyle(0xddaa66, 0.06);
    for (let i = 0; i < 20; i++) {
      dust.fillEllipse(Math.random() * worldWidth, worldHeight - 100 + Math.random() * 60, 80 + Math.random() * 100, 20 + Math.random() * 15);
    }
  }

  createCanyonDecor(worldWidth, worldHeight) {
    // Decorative rock formations
    for (let i = 0; i < worldWidth / 400; i++) {
      const rx = i * 400 + Math.random() * 150 + 50;
      const rock = this.add.graphics();
      rock.fillStyle(0x996644, 0.6);
      const rw = 20 + Math.random() * 30;
      const rh = 15 + Math.random() * 20;
      rock.fillRect(rx - rw / 2, worldHeight - 60 - rh, rw, rh);
      rock.setDepth(3);
    }

    // Canyon summit label
    this.add.text(5500, 50, 'Canyon Summit', {
      fontSize: '16px', fontFamily: 'Georgia, serif',
      color: '#ffcc66', fontStyle: 'italic',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(4);

    // Tall Tales Tavern label
    this.add.text(380, worldHeight - 160, 'Tall Tales Tavern', {
      fontSize: '14px', fontFamily: 'Georgia, serif',
      color: '#ffaa44', fontStyle: 'italic',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(4);
  }

  createDustParticles(worldWidth, worldHeight) {
    this.dustParticles = [];
    for (let i = 0; i < 30; i++) {
      const dp = this.add.graphics();
      dp.fillStyle(0xddbb77, 0.3);
      dp.fillCircle(0, 0, 2 + Math.random() * 2);
      dp.setPosition(Math.random() * worldWidth, 100 + Math.random() * 350);
      dp.setDepth(6);

      this.tweens.add({
        targets: dp,
        x: dp.x + Phaser.Math.Between(-50, 50),
        y: dp.y + Phaser.Math.Between(-30, 30),
        duration: 4000 + Math.random() * 3000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      this.tweens.add({
        targets: dp,
        alpha: { from: 0.1, to: 0.4 },
        duration: 1500 + Math.random() * 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Math.random() * 2000
      });

      this.dustParticles.push(dp);
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

  // ---- VINE PUZZLE ----
  hitVine(vine) {
    const hp = vine.getData('health') - 1;
    vine.setData('health', hp);

    // Visual shake
    vine.setTint(0xffaaaa);
    this.tweens.add({
      targets: vine,
      x: vine.x + 3,
      duration: 50,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        if (vine.active) {
          vine.setTint(0x44aa44);
          vine.refreshBody();
        }
      }
    });

    if (hp <= 0) {
      // Break the vine root
      for (let i = 0; i < 8; i++) {
        const p = this.add.graphics();
        p.fillStyle(0x44aa44);
        p.fillCircle(0, 0, 3);
        p.setPosition(vine.x, vine.y);
        this.tweens.add({
          targets: p,
          x: vine.x + Phaser.Math.Between(-50, 50),
          y: vine.y + Phaser.Math.Between(-60, -10),
          alpha: 0,
          duration: 500,
          ease: 'Power2',
          onComplete: () => p.destroy()
        });
      }
      vine.destroy();
      this.vinesCut++;
      this.showQuickMessage(`Vine root cut! (${this.vinesCut}/3)`, 0x44ff44);

      // Check if all vines cleared
      if (this.vinesCut >= 3 && !this.cleoRescued) {
        this.rescueCleo();
      }
    }
  }

  rescueCleo() {
    this.cleoRescued = true;
    this.cleoCryText.destroy();

    // Clear vine rope graphics
    if (this.vineRopeGraphics) {
      this.vineRopeGraphics.clear();
    }

    // Cleo rescue animation
    this.cleoNpc.clearTint();
    this.tweens.add({
      targets: this.cleoNpc,
      y: this.cleoNpc.y - 20,
      duration: 300,
      yoyo: true,
      onComplete: () => {
        this.showDialog([
          { speaker: 'Cleo', text: "Oh, thank you! I was tangled up in those awful vines for ages!" },
          { speaker: 'Cleo', text: "I'm Cleo. I was trying to climb to the canyon summit when I got stuck." },
          { speaker: 'Whiskers', text: "I'm Whiskers! We're on a quest to find the Dog King. Want to join us?" },
          { speaker: 'Cleo', text: "THE DOG KING?! I heard he has an army of ROBOTS! ...but sure, I'll help!" },
          { speaker: 'Cleo', text: "I have Razor Claws — I can climb any surface and cut through anything!" },
          { speaker: 'Cleo', text: "When I'm active, press UP against a wall to climb it!" },
          { speaker: 'Whiskers', text: "That'll be really useful for reaching high places. Welcome to the team!" },
          { speaker: 'Cleo', text: "Press TAB to switch to me anytime!" },
        ]);

        // Add Cleo to party
        this.playerState.party.push('cleo');

        // Remove NPC sprite
        this.time.delayedCall(100, () => {
          this.cleoNpc.destroy();
        });

        this.showQuickMessage("CLEO JOINED THE PARTY!", 0xffdd88);
      }
    });
  }

  // ---- STANDARD METHODS (same pattern as Level2) ----

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
    const isCleo = this.playerState.activeChar === 'cleo';
    const isBoots = this.playerState.activeChar === 'boots';
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
    const animPrefix = isCleo ? 'cleo' : isBoots ? 'boots' : isLuna ? 'luna' : 'whiskers';
    if (!onGround) {
      this.player.anims.stop();
    } else if (moving) {
      const walkAnim = `${animPrefix}_walk`;
      if (this.player.anims.currentAnim?.key !== walkAnim) {
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

    // Wall climb (Cleo's ability) — when Cleo is active and touching a wall, UP lets them climb
    if (isCleo) {
      const touchingWall = this.player.body.blocked.left || this.player.body.blocked.right;
      if (touchingWall && this.cursors.up.isDown) {
        this.player.body.setGravityY(-800); // Reduce effective gravity
        this.player.setVelocityY(-150);      // Climb upward
      } else {
        this.player.body.setGravityY(0);     // Reset to world gravity
      }
    } else {
      this.player.body.setGravityY(0);       // Reset for non-Cleo characters
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

      if (type === 'hawk') {
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
        const startX = enemy.getData('startX');
        const range = enemy.getData('patrolRange');
        if (enemy.x > startX + range) {
          enemy.setData('direction', -1);
          enemy.setVelocityX(-50);
          enemy.setFlipX(true);
        } else if (enemy.x < startX - range) {
          enemy.setData('direction', 1);
          enemy.setVelocityX(50);
          enemy.setFlipX(false);
        }
      }
    });

    // Fall into pit
    if (this.player.y > 560) {
      this.playerState.health = Math.max(0, this.playerState.health - 10);
      this.player.setPosition(this.player.x - 100, 400);
      this.player.setVelocity(0, 0);
      this.showQuickMessage("Ouch! Be careful near the crevasses!", 0xff6666);
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

    // Check vines
    let hitSolid = false;
    this.vines.children.each(vine => {
      if (!vine.active) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, vine.x, vine.y);
      if (dist < 70) {
        this.hitVine(vine);
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
    const name = type === 'hawk' ? 'Hawk' : 'Snake';
    this.showQuickMessage(`${name} scared away!`, 0x44ff44);
  }

  hitEnemy(player, enemy) {
    if (this.playerState.isPouncing) {
      this.scareEnemy(enemy);
      return;
    }
    if (player.getData('invulnerable')) return;

    this.playerState.health = Math.max(0, this.playerState.health - 10);
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

  collectTuna(player, tuna) {
    const tx = tuna.x, ty = tuna.y;
    tuna.destroy();
    this.playerState.hunger = Math.min(100, this.playerState.hunger + 25);
    this.playerState.tunasCollected++;
    this.showQuickMessage("+25 Hunger!", 0x4a90d9);
    this.collectEffect(tx, ty, 0x4a90d9);
  }

  collectWater(player, water) {
    const wx = water.x, wy = water.y;
    water.destroy();
    this.playerState.thirst = Math.min(100, this.playerState.thirst + 30);
    this.playerState.watersCollected++;
    this.showQuickMessage("+30 Thirst!", 0x4fc3f7);
    this.collectEffect(wx, wy, 0x4fc3f7);
  }

  collectMapPiece(player, piece) {
    const px = piece.x, py = piece.y;
    piece.destroy();
    this.playerState.mapPieces++;
    this.showQuickMessage("MAP PIECE FOUND! (4/7)", 0xffd700);
    this.collectEffect(px, py, 0xffd700);

    this.time.delayedCall(1000, () => {
      this.showDialog([
        { speaker: 'Whiskers', text: "Another piece of the Puzzle Map! Found it at the canyon summit!" },
        { speaker: 'Whiskers', text: "That's 4 out of 7! We're more than halfway there!" },
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

    // Canyon heat drains thirst a bit extra
    thirstDrain += 0.2;

    state.hunger = Math.max(0, state.hunger - hungerDrain);
    state.thirst = Math.max(0, state.thirst - thirstDrain);

    if (state.hunger <= 0 || state.thirst <= 0) {
      if (!state.isExhausted) {
        state.isExhausted = true;
        this.player.setTint(0x999999);
        const charNames = { 'whiskers': 'Whiskers', 'luna': 'Luna', 'boots': 'Boots', 'cleo': 'Cleo' };
        const speaker = charNames[state.activeChar] || 'Whiskers';
        const msg = state.hunger <= 0 ? "So hungry... need tuna!" : "So thirsty... this canyon heat is brutal!";
        this.showDialog([
          { speaker, text: msg },
          { speaker, text: "I can't move until I find something..." }
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
      this.showQuickMessage(`${name}: "Watch out for hawks!"`, 0xffffff);
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
    this.showQuickMessage("Heading to The Yarn Factory...", 0x44ff44);
    this.time.delayedCall(1000, () => {
      this.sound.stopAll();
      this.sound.play('level5music', { loop: true, volume: 0.4 });
      this.scene.stop('UIScene');
      this.scene.start('Level5Scene', { playerState: this.playerState });
    });
  }
}
