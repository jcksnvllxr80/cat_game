import Phaser from 'phaser';

export class Level3Scene extends Phaser.Scene {
  constructor() {
    super('Level3Scene');
  }

  init(data) {
    // Carry over state from Level 2 (or use defaults if starting fresh)
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
      mapPieces: 2,
      accessories: [],
      speed: 200,
      jumpPower: -400,
      isExhausted: false,
    };
    // Party & switching state
    this.playerState.party = this.playerState.party || ['whiskers', 'luna'];
    this.playerState.activeChar = this.playerState.activeChar || 'whiskers';
    this.bootsRescued = false;
    this.sprintActive = false;
    this.sprintReady = true;
  }

  create() {
    const worldWidth = 5500;
    const worldHeight = 576;

    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

    // Start level 3 music
    this.sound.stopAll();
    this.sound.play('level3music', { loop: true, volume: 0.4 });

    // ---- Coastal dock background ----
    this.createDockBackground(worldWidth, worldHeight);

    // ---- Platforms ----
    this.platforms = this.physics.add.staticGroup();
    this.crates = this.physics.add.staticGroup();

    // Ground — dock planks with water gaps (wider than Level 1/2)
    // Water gaps: 700-900, 1800-2100, 2500-2900 (Boots' island area), 3400-3650, 4300-4550
    const waterGaps = [
      [700, 900],
      [1800, 2100],
      [2500, 2900],
      [3400, 3650],
      [4300, 4550],
    ];

    const isInWaterGap = (x) => {
      for (const [start, end] of waterGaps) {
        if (x >= start && x < end) return true;
      }
      return false;
    };

    for (let x = 0; x < worldWidth; x += 32) {
      if (isInWaterGap(x)) continue;
      this.platforms.create(x + 16, worldHeight - 16, 'dock_ground');
      if (x % 64 === 0) {
        this.platforms.create(x + 16, worldHeight - 48, 'dock_ground');
      }
    }

    // Top dock layer
    for (let x = 0; x < worldWidth; x += 32) {
      if (isInWaterGap(x)) continue;
      this.platforms.create(x + 16, worldHeight - 48, 'dock_platform');
    }

    // Floating platforms (dock crates and driftwood over water gaps)
    const floats = [
      { x: 250, y: 420, count: 3 },
      { x: 500, y: 360, count: 2 },
      // Over water gap 1 (700-900)
      { x: 720, y: 400, count: 3 },
      { x: 820, y: 350, count: 3 },
      { x: 950, y: 300, count: 2 },
      { x: 1100, y: 380, count: 3 },
      { x: 1350, y: 320, count: 4 },
      { x: 1600, y: 280, count: 3 },
      // Over water gap 2 (1800-2100)
      { x: 1820, y: 400, count: 3 },
      { x: 1920, y: 340, count: 3 },
      { x: 2020, y: 380, count: 3 },
      { x: 2200, y: 300, count: 4 },
      // Over water gap 3 — Boots' island (2500-2900)
      { x: 2520, y: 390, count: 3 },
      { x: 2640, y: 340, count: 2 },
      { x: 2720, y: 420, count: 5 },  // Boots' island platform
      { x: 2850, y: 360, count: 3 },
      { x: 3000, y: 320, count: 3 },
      { x: 3200, y: 280, count: 4 },
      // Over water gap 4 (3400-3650)
      { x: 3420, y: 400, count: 3 },
      { x: 3520, y: 350, count: 3 },
      { x: 3700, y: 300, count: 3 },
      { x: 3900, y: 380, count: 2 },
      { x: 4100, y: 320, count: 4 },
      // Over water gap 5 (4300-4550)
      { x: 4320, y: 400, count: 3 },
      { x: 4420, y: 340, count: 3 },
      { x: 4600, y: 280, count: 3 },
      // Sunken ship area — elevated platforms leading to map piece
      { x: 4800, y: 360, count: 3 },
      { x: 4900, y: 300, count: 4 },
      { x: 5000, y: 240, count: 5 },  // Map piece platform
      { x: 5200, y: 320, count: 3 },
    ];

    floats.forEach(p => {
      for (let i = 0; i < p.count; i++) {
        this.platforms.create(p.x + i * 32, p.y, 'dock_platform');
      }
    });

    // Breakable crates
    const cratePositions = [
      { x: 400, y: worldHeight - 80 },
      { x: 1200, y: worldHeight - 80 },
      { x: 1700, y: worldHeight - 80 },
      { x: 3100, y: worldHeight - 80 },
      { x: 3800, y: worldHeight - 80 },
      { x: 4700, y: worldHeight - 80 },
    ];

    cratePositions.forEach(pos => {
      const crate = this.crates.create(pos.x, pos.y, 'crate');
      crate.setData('health', 2);
    });

    // ---- Dock decorations ----
    this.createDockDecorations(worldWidth, worldHeight);

    // ---- Player ----
    const charTexture = this.playerState.activeChar === 'luna' ? 'cat_luna_f0'
      : this.playerState.activeChar === 'boots' ? 'cat_boots_f0'
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
    const tunaX = [120, 350, 550, 780, 1000, 1250, 1500, 1750, 1950, 2150, 2400, 2650, 2950, 3200, 3500, 3750, 4050, 4350, 4650, 4900];
    tunaX.forEach(x => {
      const t = this.tunas.create(x, worldHeight - 90, 'tuna');
      t.body.setAllowGravity(false);
      this.addFloatAnimation(t);
    });

    // Water (10-12 positions)
    const waterX = [200, 450, 900, 1300, 1650, 2050, 2550, 3000, 3350, 3900, 4200, 4800];
    waterX.forEach(x => {
      const w = this.waters.create(x, worldHeight - 85, 'water');
      w.body.setAllowGravity(false);
      this.addFloatAnimation(w);
    });

    // Map piece 3/7 — near the sunken ship area
    this.mapPiece = this.mapPieces.create(5000, 200, 'map_piece');
    this.mapPiece.body.setAllowGravity(false);
    this.mapPiece.setScale(1.5);
    this.addFloatAnimation(this.mapPiece);
    this.addGlowEffect(this.mapPiece);

    // ---- Boots NPC (stranded on island) ----
    this.bootsNpc = this.physics.add.staticImage(2750, 388, 'cat_boots_f0');
    this.bootsNpc.setScale(1.5);
    this.bootsNpc.setDepth(10);

    // Boots cry for help text
    this.bootsCryText = this.add.text(2750, 340, '"Hey! Over here! I\'m stuck!"', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#FF8844',
      fontStyle: 'italic',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(15);

    this.tweens.add({
      targets: this.bootsCryText,
      alpha: 0.3,
      duration: 1500,
      yoyo: true,
      repeat: -1
    });

    // ---- NPCs ----
    this.npcs = this.physics.add.staticGroup();

    // Captain Saltwhisker near start
    const captain = this.npcs.create(300, worldHeight - 75, 'npc_cat');
    captain.setScale(1.4);
    captain.setTint(0x7788aa);
    captain.setData('name', 'Captain Saltwhisker');
    captain.setData('dialogIndex', 0);
    captain.setData('dialogs', [
      { speaker: 'Captain Saltwhisker', text: "Arrr! A landlubber cat in Tuna Bay? Ye must be brave or foolish!" },
      { speaker: 'Whiskers', text: "I'm Whiskers. I'm looking for pieces of the Puzzle Map." },
      { speaker: 'Captain Saltwhisker', text: "The Dog King's shadow has been blockin' the sun over the bay. Fish ain't bitin' no more!" },
      { speaker: 'Captain Saltwhisker', text: "His bark created a tidal wave that wrecked half the docks!" },
      { speaker: 'Captain Saltwhisker', text: "There's a young cat named Boots stuck on an island to the east. The wave stranded him there." },
      { speaker: 'Captain Saltwhisker', text: "If ye can reach him across the floatin' crates, he'd be mighty grateful!" },
    ]);
    this.addExclamation(captain);

    // Dock Worker Cat in mid-level
    const dockWorker = this.npcs.create(1500, worldHeight - 75, 'npc_cat');
    dockWorker.setScale(1.1);
    dockWorker.setTint(0xaa8855);
    dockWorker.setData('name', 'Dock Worker Cat');
    dockWorker.setData('dialogIndex', 0);
    dockWorker.setData('dialogs', [
      { speaker: 'Dock Worker Cat', text: "Watch yer step! The planks are rottin' from all the saltwater." },
      { speaker: 'Dock Worker Cat', text: "I heard the Dog King's got an army of ten thousand. Ten THOUSAND!" },
      { speaker: 'Dock Worker Cat', text: "Mostly chihuahuas though. So maybe it's not that scary." },
      { speaker: 'Dock Worker Cat', text: "Still, his LASER EYES are real. Burned a hole clean through Pier 7!" },
    ]);
    this.addExclamation(dockWorker);

    // Fish Merchant Cat near end
    const merchant = this.npcs.create(4000, worldHeight - 75, 'npc_cat');
    merchant.setScale(1.2);
    merchant.setTint(0x66aa88);
    merchant.setData('name', 'Fish Merchant Cat');
    merchant.setData('dialogIndex', 0);
    merchant.setData('dialogs', [
      { speaker: 'Fish Merchant Cat', text: "Fresh fish! Well... not so fresh since the Dog King showed up." },
      { speaker: 'Fish Merchant Cat', text: "Say, you're collectin' those map pieces, right?" },
      { speaker: 'Fish Merchant Cat', text: "There's a sunken ship past the last water gap. I saw somethin' glowin' in there." },
      { speaker: 'Fish Merchant Cat', text: "Could be a map piece! But the seagulls guard that area somethin' fierce." },
    ]);
    this.addExclamation(merchant);

    // ---- Enemies ----
    this.enemies = this.physics.add.group();

    // Crabs (ground patrol like raccoons)
    const crabPositions = [
      { x: 500, y: worldHeight - 80, patrolRange: 120 },
      { x: 1100, y: worldHeight - 80, patrolRange: 100 },
      { x: 1600, y: worldHeight - 80, patrolRange: 130 },
      { x: 3100, y: worldHeight - 80, patrolRange: 100 },
      { x: 3800, y: worldHeight - 80, patrolRange: 90 },
      { x: 4700, y: worldHeight - 80, patrolRange: 110 },
    ];

    crabPositions.forEach(pos => {
      const enemy = this.enemies.create(pos.x, pos.y, 'crab');
      enemy.setScale(1.2);
      enemy.setBounce(0);
      enemy.setCollideWorldBounds(true);
      enemy.setData('startX', pos.x);
      enemy.setData('patrolRange', pos.patrolRange);
      enemy.setData('direction', 1);
      enemy.setData('type', 'crab');
      enemy.setVelocityX(50);
    });

    // Seagulls (flying, sine wave like crows)
    this.seagulls = [];
    const seagullPositions = [600, 1400, 2000, 2600, 3300, 4500, 5100];
    seagullPositions.forEach(x => {
      const seagull = this.enemies.create(x, 200, 'seagull');
      seagull.setScale(1.3);
      seagull.body.setAllowGravity(false);
      seagull.setData('startX', x);
      seagull.setData('startY', 200);
      seagull.setData('type', 'seagull');
      seagull.setData('time', Math.random() * Math.PI * 2);
      this.seagulls.push(seagull);
    });

    // ---- Water surface decoration ----
    this.createWaterSurface(worldWidth, worldHeight, waterGaps);

    // ---- Colliders ----
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.player, this.crates);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.collider(this.enemies, this.crates, null, (enemy) => {
      return enemy.getData('type') !== 'seagull';
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
    this.scene.launch('UIScene', { playerState: this.playerState, levelKey: 'Level3Scene' });

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
        { speaker: 'Whiskers', text: "Tuna Bay Docks! I can smell the salt air from here." },
        { speaker: 'Luna', text: "It's so bright compared to the forest! But those water gaps look dangerous..." },
        { speaker: 'Whiskers', text: "Cats don't like water. We'll need to be careful jumping across." },
      ]);
    });

    this.nearbyNpc = null;
    this.waterGaps = waterGaps;

    // ---- Level Exit ----
    const exitSign = this.add.image(worldWidth - 80, worldHeight - 80, 'exit_sign');
    exitSign.setScale(2);
    exitSign.setDepth(5);
    this.addFloatAnimation(exitSign);
    this.add.text(worldWidth - 80, worldHeight - 120, 'To Catnip Canyon', {
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
  createDockBackground(worldWidth, worldHeight) {
    // Blue sky with gradient
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x4488cc, 0x4488cc, 0x88ccee, 0x88ccee);
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

    // Ocean horizon
    const ocean = this.add.graphics();
    ocean.setScrollFactor(0.1);
    ocean.setDepth(-8);
    ocean.fillGradientStyle(0x2266aa, 0x2266aa, 0x3388cc, 0x3388cc);
    ocean.fillRect(0, worldHeight - 180, worldWidth, 130);

    // Distant ships
    const ships = this.add.graphics();
    ships.setScrollFactor(0.15);
    ships.setDepth(-7);
    ships.fillStyle(0x445566, 0.5);
    for (let i = 0; i < 4; i++) {
      const sx = 200 + i * (worldWidth / 4) + Math.random() * 100;
      const sy = worldHeight - 160;
      // Hull
      ships.fillRect(sx - 15, sy, 30, 8);
      // Mast
      ships.fillRect(sx - 1, sy - 20, 2, 20);
      // Sail
      ships.fillTriangle(sx + 1, sy - 18, sx + 1, sy - 5, sx + 12, sy - 10);
    }

    // Seagull silhouettes in sky
    const seagullSilhouettes = this.add.graphics();
    seagullSilhouettes.setScrollFactor(0.08);
    seagullSilhouettes.setDepth(-6);
    seagullSilhouettes.lineStyle(1.5, 0x334455, 0.4);
    for (let i = 0; i < 8; i++) {
      const gx = Math.random() * worldWidth;
      const gy = 40 + Math.random() * 100;
      // Simple V shape for distant seagulls
      seagullSilhouettes.beginPath();
      seagullSilhouettes.moveTo(gx - 6, gy + 3);
      seagullSilhouettes.lineTo(gx, gy);
      seagullSilhouettes.lineTo(gx + 6, gy + 3);
      seagullSilhouettes.strokePath();
    }

    // Wooden dock structures (background pylons)
    const pylons = this.add.graphics();
    pylons.setScrollFactor(0.3);
    pylons.setDepth(-5);
    pylons.fillStyle(0x664422, 0.5);
    for (let i = 0; i < worldWidth / 120; i++) {
      const px = i * 120 + Math.random() * 40;
      pylons.fillRect(px - 4, worldHeight - 120, 8, 80);
      pylons.fillRect(px - 12, worldHeight - 120, 24, 4);
    }
  }

  createDockDecorations(worldWidth, worldHeight) {
    // Wooden posts, barrels, rope coils along the docks
    for (let i = 0; i < worldWidth / 400; i++) {
      const dx = i * 400 + Math.random() * 150 + 50;
      // Skip if in a water gap
      let inGap = false;
      for (const [start, end] of this.waterGaps || [[700,900],[1800,2100],[2500,2900],[3400,3650],[4300,4550]]) {
        if (dx >= start && dx <= end) { inGap = true; break; }
      }
      if (inGap) continue;

      const post = this.add.image(dx, worldHeight - 80, 'tree_trunk');
      post.setDepth(3);
      post.setAlpha(0.7);
      post.setScale(0.6, 0.8);
    }

    // Sunken ship area label
    this.add.text(5000, 160, 'The Sunken Ship', {
      fontSize: '16px', fontFamily: 'Georgia, serif',
      color: '#88aacc', fontStyle: 'italic',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setDepth(4);

    // Boots' Island label
    this.add.text(2750, 300, "Boots' Island", {
      fontSize: '12px', fontFamily: 'Georgia, serif',
      color: '#FF8844', fontStyle: 'italic',
      stroke: '#000000', strokeThickness: 2
    }).setOrigin(0.5).setDepth(4);
  }

  createWaterSurface(worldWidth, worldHeight, waterGaps) {
    // Animated water surface in gap areas
    this.waterGraphics = this.add.graphics();
    this.waterGraphics.setDepth(2);

    waterGaps.forEach(([start, end]) => {
      // Water fill
      this.waterGraphics.fillStyle(0x2266aa, 0.5);
      this.waterGraphics.fillRect(start, worldHeight - 40, end - start, 40);

      // Wave lines
      this.waterGraphics.lineStyle(2, 0x44aaee, 0.4);
      for (let x = start; x < end; x += 20) {
        this.waterGraphics.beginPath();
        this.waterGraphics.moveTo(x, worldHeight - 35);
        this.waterGraphics.lineTo(x + 10, worldHeight - 38);
        this.waterGraphics.lineTo(x + 20, worldHeight - 35);
        this.waterGraphics.strokePath();
      }
    });
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
      'boots': 'cat_boots_f0'
    };
    this.player.setTexture(sheetMap[this.playerState.activeChar]);

    // Re-apply physics body size after texture swap (setTexture resets it)
    this.player.body.setSize(20, 22);
    this.player.body.setOffset(14, 14);

    // Brief flash effect on switch
    this.player.setTint(0xaa88ff);
    this.time.delayedCall(200, () => this.player.clearTint());

    const charNames = { 'whiskers': 'Whiskers', 'luna': 'Luna', 'boots': 'Boots' };
    this.showQuickMessage(`Switched to ${charNames[this.playerState.activeChar]}!`, 0xaa88ff);
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

  // ---- BOOTS RESCUE ----
  rescueBoots() {
    if (this.bootsRescued) return;
    this.bootsRescued = true;
    this.bootsCryText.destroy();

    // Boots rescue animation
    this.tweens.add({
      targets: this.bootsNpc,
      y: this.bootsNpc.y - 20,
      duration: 300,
      yoyo: true,
      onComplete: () => {
        this.showDialog([
          { speaker: 'Boots', text: "FINALLY! I thought I'd be stuck here forever!" },
          { speaker: 'Boots', text: "That tidal wave from the Dog King's bark swept me right off the docks!" },
          { speaker: 'Whiskers', text: "Are you okay? I'm Whiskers, and this is Luna." },
          { speaker: 'Boots', text: "I'm Boots! Fastest cat on the coast!" },
          { speaker: 'Luna', text: "We're collecting Puzzle Map pieces to find the Dog King." },
          { speaker: 'Boots', text: "The DOG KING?! I heard he has LASER EYES AND can shoot FIREBALLS!" },
          { speaker: 'Whiskers', text: "...Everyone keeps adding new powers." },
          { speaker: 'Boots', text: "Well, count me in! I'm the fastest runner around. I can even sprint across water gaps!" },
          { speaker: 'Boots', text: "Press TAB to switch to me, then W for my Super Sprint — 3x speed burst!" },
        ]);

        // Add Boots to party
        this.playerState.party.push('boots');

        // Remove NPC sprite
        this.time.delayedCall(100, () => {
          this.bootsNpc.destroy();
        });

        this.showQuickMessage("BOOTS JOINED THE PARTY!", 0xff8800);
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
    const animPrefix = isBoots ? 'boots' : isLuna ? 'luna' : 'whiskers';
    if (!onGround) {
      this.player.anims.stop();
    } else if (moving) {
      const walkAnim = `${animPrefix}_walk`;
      if (this.player.anims.currentAnim?.key !== walkAnim) {
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

    // Boots Super Sprint (W)
    if (Phaser.Input.Keyboard.JustDown(this.keyW)) {
      this.bootsSprint();
    }

    // NPC interaction (E)
    this.checkNpcProximity();
    if (Phaser.Input.Keyboard.JustDown(this.keyE) && this.nearbyNpc) {
      this.interactWithNpc(this.nearbyNpc);
    }

    // Check Boots rescue proximity
    if (!this.bootsRescued && this.bootsNpc && this.bootsNpc.active) {
      const distToBoots = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.bootsNpc.x, this.bootsNpc.y);
      if (distToBoots < 60) {
        this.rescueBoots();
      }
    }

    // Enemy patrol AI
    this.enemies.children.each(enemy => {
      if (!enemy.active) return;
      const type = enemy.getData('type');

      if (type === 'seagull') {
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

    // Fall into water
    if (this.player.y > 540) {
      this.playerState.health = Math.max(0, this.playerState.health - 15);
      this.player.setPosition(this.player.x - 100, 400);
      this.player.setVelocity(0, 0);
      this.showQuickMessage("Cats don't like water!", 0xff6666);
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
    const name = type === 'seagull' ? 'Seagull' : 'Crab';
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
    this.showQuickMessage("MAP PIECE FOUND! (3/7)", 0xffd700);
    this.collectEffect(px, py, 0xffd700);

    this.time.delayedCall(1000, () => {
      this.showDialog([
        { speaker: 'Whiskers', text: "Another piece of the Puzzle Map! Found it in the sunken ship!" },
        { speaker: 'Luna', text: "That's 3 out of 7! We're almost halfway there!" },
        { speaker: 'Boots', text: "See? Nothing can stop us! We're the fastest team around!" },
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

    // Sprint drains extra hunger (running fast burns calories)
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
        const charName = state.activeChar === 'boots' ? 'Boots' : state.activeChar === 'luna' ? 'Luna' : 'Whiskers';
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
      this.showQuickMessage(`${name}: "Watch out for the water!"`, 0xffffff);
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
    this.showQuickMessage("Heading to Catnip Canyon...", 0x44ff44);
    this.time.delayedCall(1000, () => {
      this.sound.stopAll();
      this.sound.play('level4music', { loop: true, volume: 0.4 });
      this.scene.stop('UIScene');
      this.scene.start('Level4Scene', { playerState: this.playerState });
    });
  }
}
