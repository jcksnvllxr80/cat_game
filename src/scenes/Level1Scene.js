import Phaser from 'phaser';
import { PIT_THRESHOLD } from '../constants.js';

export class Level1Scene extends Phaser.Scene {
  constructor() {
    super('Level1Scene');
  }

  create() {
    // World size (scrolling level)
    const worldWidth = 4000;
    const worldHeight = 576;

    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

    // Start level 1 music
    this.sound.stopAll();
    this.sound.play('level1music', { loop: true, volume: 0.4 });

    // ---- Parallax backgrounds ----
    this.createParallaxBackground(worldWidth, worldHeight);

    // ---- Platforms ----
    this.platforms = this.physics.add.staticGroup();
    this.crates = this.physics.add.staticGroup();

    // Ground - full level
    for (let x = 0; x < worldWidth; x += 32) {
      // Leave some gaps for pits
      if ((x > 800 && x < 900) || (x > 2200 && x < 2300)) continue;
      this.platforms.create(x + 16, worldHeight - 16, 'ground');
      if (x % 64 === 0) {
        this.platforms.create(x + 16, worldHeight - 48, 'ground');
      }
    }

    // Top grass layer
    for (let x = 0; x < worldWidth; x += 32) {
      if ((x > 800 && x < 900) || (x > 2200 && x < 2300)) continue;
      this.platforms.create(x + 16, worldHeight - 48, 'platform');
    }

    // Floating platforms
    const floatingPlatforms = [
      { x: 400, y: 400, count: 3 },
      { x: 600, y: 340, count: 2 },
      { x: 850, y: 380, count: 3 },  // Over the pit
      { x: 1100, y: 360, count: 4 },
      { x: 1400, y: 300, count: 3 },
      { x: 1600, y: 400, count: 2 },
      { x: 1800, y: 340, count: 5 },
      { x: 2100, y: 280, count: 3 },
      { x: 2250, y: 380, count: 3 },  // Over the pit
      { x: 2500, y: 350, count: 4 },
      { x: 2800, y: 300, count: 3 },
      { x: 3000, y: 400, count: 2 },
      { x: 3200, y: 340, count: 4 },
      { x: 3500, y: 280, count: 3 },
    ];

    floatingPlatforms.forEach(p => {
      for (let i = 0; i < p.count; i++) {
        this.platforms.create(p.x + i * 32, p.y, 'platform');
      }
    });

    // Breakable crates
    const cratePositions = [
      { x: 500, y: worldHeight - 80 },
      { x: 1200, y: 328 },
      { x: 1900, y: worldHeight - 80 },
      { x: 2600, y: 318 },
      { x: 3300, y: worldHeight - 80 },
    ];

    cratePositions.forEach(pos => {
      const crate = this.crates.create(pos.x, pos.y, 'crate');
      crate.setData('health', 2);
    });

    // ---- Player (Whiskers) ----
    this.player = this.physics.add.sprite(100, worldHeight - 120, 'cat_whiskers_f0');
    this.player.setCollideWorldBounds(true);
    this.player.setBounce(0);
    this.player.setScale(1.5);
    this.player.body.setSize(20, 22);
    this.player.body.setOffset(14, 14);
    this.player.setDepth(10);
    this.player.setFlipX(true); // Cat is drawn facing left, flip to face right at start

    // Player state
    this.playerState = {
      hunger: 100,
      thirst: 100,
      health: 100,
      maxHealth: 100,
      isRunning: false,
      isPouncing: false,
      pounceReady: true,
      pounceCooldown: 1000,
      facingRight: true,
      tunasCollected: 0,
      watersCollected: 0,
      mapPieces: 0,
      accessories: [],
      speed: 200,
      jumpPower: -400,
      isExhausted: false, // true when hunger or thirst hits 0
      lives: 9,
    };

    // ---- Collectibles ----
    this.tunas = this.physics.add.group();
    this.waters = this.physics.add.group();
    this.mapPieces = this.physics.add.group();
    this.pendants = this.physics.add.group();

    // Scatter tuna cans throughout the level
    const tunaPositions = [700, 1800, 3000];
    tunaPositions.forEach(x => {
      const tuna = this.tunas.create(x, worldHeight - 90, 'tuna');
      tuna.body.setAllowGravity(false);
      this.addFloatAnimation(tuna);
    });

    // Water bowls
    const waterPositions = [400, 1400, 2500];
    waterPositions.forEach(x => {
      const w = this.waters.create(x, worldHeight - 85, 'water');
      w.body.setAllowGravity(false);
      this.addFloatAnimation(w);
    });

    // Fish Pendant (near Sergeant Fluffbottom)
    const pendant = this.pendants.create(3100, 360, 'fish_pendant');
    pendant.body.setAllowGravity(false);
    pendant.setScale(1.5);
    this.addFloatAnimation(pendant);
    this.addGlowEffect(pendant);

    // Map piece (in Grandma Mittens' attic area - elevated platform at ~1800)
    const mapPiece = this.mapPieces.create(1850, 300, 'map_piece');
    mapPiece.body.setAllowGravity(false);
    mapPiece.setScale(1.5);
    this.addFloatAnimation(mapPiece);
    this.addGlowEffect(mapPiece);

    // ---- NPCs ----
    this.npcs = this.physics.add.staticGroup();

    // Mr. Pawston near the start
    this.mrPawston = this.npcs.create(250, worldHeight - 75, 'npc_cat');
    this.mrPawston.setScale(1.5);
    this.mrPawston.setData('name', 'Mr. Pawston');
    this.mrPawston.setData('dialogIndex', 0);
    this.mrPawston.setData('dialogs', [
      { speaker: 'Mr. Pawston', text: "They came again, Whiskers! The squirrels took all my tuna! Third time this week!" },
      { speaker: 'Mr. Pawston', text: "Someone should DO something about this. Go talk to Grandma Mittens — she knows things." },
      { speaker: 'Whiskers', text: "Don't worry Mr. Pawston, I'll figure this out!" }
    ]);
    this.addExclamation(this.mrPawston);

    // Grandma Mittens further in
    this.grandmaMittens = this.npcs.create(1500, worldHeight - 75, 'npc_cat');
    this.grandmaMittens.setScale(1.5);
    this.grandmaMittens.setTint(0xddddff);
    this.grandmaMittens.setData('name', 'Grandma Mittens');
    this.grandmaMittens.setData('dialogIndex', 0);
    this.grandmaMittens.setData('dialogs', [
      { speaker: 'Grandma Mittens', text: "Ah, Whiskers! I've been expecting you. Sit, sit. Have some tuna." },
      { speaker: 'Grandma Mittens', text: "The Dog King lives in a fortress far away. Nobody knows exactly where..." },
      { speaker: 'Grandma Mittens', text: "The path was hidden — split into 7 pieces of a Puzzle Map scattered across Whiskeria." },
      { speaker: 'Grandma Mittens', text: "The first piece is in my attic above! But the lock is rusted. Use your POUNCE to break it!" },
      { speaker: 'Whiskers', text: "I'm not scared! I'll find every piece!" },
      { speaker: 'Grandma Mittens', text: "That's the spirit, dear. You'll need friends. And snacks. LOTS of snacks." }
    ]);
    this.addExclamation(this.grandmaMittens);

    // Sergeant Fluffbottom near the end
    this.sergeant = this.npcs.create(3200, worldHeight - 75, 'npc_cat');
    this.sergeant.setScale(1.5);
    this.sergeant.setTint(0xffddaa);
    this.sergeant.setData('name', 'Sgt. Fluffbottom');
    this.sergeant.setData('dialogIndex', 0);
    this.sergeant.setData('dialogs', [
      { speaker: 'Sgt. Fluffbottom', text: "You're heading to the Whispering Woods? Are you CRAZY?!" },
      { speaker: 'Sgt. Fluffbottom', text: "The Dog King is the size of a HOUSE! He once ate an entire fishing boat!" },
      { speaker: 'Sgt. Fluffbottom', text: "THE WHOLE BOAT. With the fishermen still on it!" },
      { speaker: 'Whiskers', text: "...He ate a boat?" },
      { speaker: 'Sgt. Fluffbottom', text: "Take this Fish Pendant. It'll help you stay full longer on the road. Good luck!" }
    ]);
    this.addExclamation(this.sergeant);

    // ---- Enemies (Squirrels) ----
    this.enemies = this.physics.add.group();
    const enemyPositions = [
      { x: 600, y: worldHeight - 80, patrolRange: 100 },
      { x: 1000, y: worldHeight - 80, patrolRange: 120 },
      { x: 1600, y: worldHeight - 80, patrolRange: 80 },
      { x: 2400, y: worldHeight - 80, patrolRange: 150 },
      { x: 2800, y: worldHeight - 80, patrolRange: 100 },
      { x: 3400, y: worldHeight - 80, patrolRange: 130 },
    ];

    enemyPositions.forEach(pos => {
      const enemy = this.enemies.create(pos.x, pos.y, 'squirrel');
      enemy.setScale(1.3);
      enemy.setBounce(0);
      enemy.setCollideWorldBounds(true);
      enemy.setData('startX', pos.x);
      enemy.setData('patrolRange', pos.patrolRange);
      enemy.setData('direction', 1);
      enemy.setVelocityX(60);
    });

    // ---- Colliders ----
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.player, this.crates);
    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.collider(this.enemies, this.crates);

    // Collectible overlaps
    this.physics.add.overlap(this.player, this.tunas, this.collectTuna, null, this);
    this.physics.add.overlap(this.player, this.waters, this.collectWater, null, this);
    this.physics.add.overlap(this.player, this.mapPieces, this.collectMapPiece, null, this);
    this.physics.add.overlap(this.player, this.pendants, this.collectPendant, null, this);

    // Enemy collision
    this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, null, this);

    // ---- Controls ----
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyX = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.keyShift = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

    // ---- Pause menu ----
    this.input.keyboard.on('keydown-ESC', () => this.openPause());
    this.input.keyboard.on('keydown-P', () => this.openPause());

    // ---- Camera ----
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.fadeIn(1000);

    // ---- Start UI Scene ----
    this.scene.launch('UIScene', { playerState: this.playerState });

    // ---- Hunger/Thirst drain timer ----
    this.drainTimer = this.time.addEvent({
      delay: 1000,
      callback: this.drainVitals,
      callbackScope: this,
      loop: true
    });

    // ---- Level intro dialog ----
    this.time.delayedCall(500, () => {
      this.showDialog([
        { speaker: 'Whiskers', text: "*yawn* ...Five more minutes..." },
        { speaker: 'Whiskers', text: "Wait — what was that crash outside?!" },
        { speaker: 'Whiskers', text: "I better go check it out. I should talk to Mr. Pawston nearby." }
      ]);
    });

    // Track nearby NPC for interaction
    this.nearbyNpc = null;

    // ---- Level Exit ----
    const exitSign = this.add.image(worldWidth - 80, worldHeight - 80, 'exit_sign');
    exitSign.setScale(2);
    exitSign.setDepth(5);
    this.addFloatAnimation(exitSign);

    // Exit label
    this.add.text(worldWidth - 80, worldHeight - 120, 'To Whispering Woods', {
      fontSize: '11px',
      fontFamily: 'Arial, sans-serif',
      color: '#44FF44',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(5);

    // Exit zone
    this.exitZone = this.add.zone(worldWidth - 80, worldHeight - 70, 60, 60);
    this.physics.add.existing(this.exitZone, true);
    this.physics.add.overlap(this.player, this.exitZone, this.exitLevel, null, this);
    this.hasExited = false;
  }

  exitLevel() {
    if (this.hasExited) return;
    this.hasExited = true;

    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.showQuickMessage("Entering the Whispering Woods...", 0x44ff44);
    this.time.delayedCall(1000, () => {
      this.sound.stopAll();
      this.sound.play('level2music', { loop: true, volume: 0.4 });
      this.scene.stop('UIScene');
      this.scene.start('Level2Scene', { playerState: this.playerState });
    });
  }

  createParallaxBackground(worldWidth, worldHeight) {
    // Sky gradient (static)
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x87CEEB, 0x87CEEB, 0xB0E0FF, 0xB0E0FF);
    sky.fillRect(0, 0, 1024, worldHeight);
    sky.setScrollFactor(0);
    sky.setDepth(-10);

    // Far mountains (slow scroll)
    const mountains = this.add.graphics();
    mountains.setScrollFactor(0.1);
    mountains.setDepth(-9);
    mountains.fillStyle(0x7B68AE, 0.6);
    for (let i = 0; i < worldWidth / 200; i++) {
      const mx = i * 200 + Math.random() * 50;
      const mh = 100 + Math.random() * 80;
      mountains.fillTriangle(mx - 100, worldHeight - 80, mx, worldHeight - 80 - mh, mx + 100, worldHeight - 80);
    }

    // Mid hills (medium scroll)
    const hills = this.add.graphics();
    hills.setScrollFactor(0.3);
    hills.setDepth(-8);
    hills.fillStyle(0x5B8C3E, 0.7);
    for (let x = 0; x < worldWidth; x += 3) {
      const h = Math.sin(x * 0.005) * 50 + Math.sin(x * 0.012) * 25 + 60;
      hills.fillRect(x, worldHeight - 50 - h, 3, h + 50);
    }

    // Near bushes (faster scroll)
    const bushes = this.add.graphics();
    bushes.setScrollFactor(0.6);
    bushes.setDepth(-7);
    for (let i = 0; i < worldWidth / 100; i++) {
      const bx = i * 100 + Math.random() * 40;
      bushes.fillStyle(0x3D7A1E, 0.5);
      bushes.fillEllipse(bx, worldHeight - 55, 40 + Math.random() * 20, 20 + Math.random() * 10);
    }

    // Decorative clouds
    const clouds = this.add.graphics();
    clouds.setScrollFactor(0.05);
    clouds.setDepth(-9);
    clouds.fillStyle(0xffffff, 0.7);
    for (let i = 0; i < 15; i++) {
      const cx = Math.random() * worldWidth;
      const cy = 30 + Math.random() * 100;
      clouds.fillEllipse(cx, cy, 50 + Math.random() * 40, 20 + Math.random() * 15);
      clouds.fillEllipse(cx + 20, cy - 8, 30, 18);
      clouds.fillEllipse(cx - 15, cy - 5, 25, 16);
    }
  }

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

    // Running (hold shift)
    this.playerState.isRunning = this.keyShift.isDown && (leftDown || rightDown);

    // Animations
    const moving = leftDown || rightDown;
    if (!onGround) {
      this.player.anims.stop();
    } else if (moving) {
      const walkAnim = 'whiskers_walk';
      if (!this.player.anims.isPlaying || this.player.anims.currentAnim?.key !== walkAnim) {
        this.player.play(walkAnim);
      }
      if (this.playerState.isRunning) {
        this.player.anims.msPerFrame = 80;
      } else {
        this.player.anims.msPerFrame = 125;
      }
    } else {
      this.player.play('whiskers_idle', true);
    }

    // Jump
    if (Phaser.Input.Keyboard.JustDown(this.cursors.space) && onGround) {
      this.player.setVelocityY(this.playerState.jumpPower);
    }

    // Pounce attack (X key)
    if (Phaser.Input.Keyboard.JustDown(this.keyX) && this.playerState.pounceReady && onGround) {
      this.pounceAttack();
    }

    // NPC interaction (E key)
    this.checkNpcProximity();
    if (Phaser.Input.Keyboard.JustDown(this.keyE) && this.nearbyNpc) {
      this.interactWithNpc(this.nearbyNpc);
    }

    // Enemy patrol AI
    this.enemies.children.each(enemy => {
      if (!enemy.active) return;

      // Remove enemies that fell into pits
      if (enemy.y > 590) { enemy.destroy(); return; }

      const startX = enemy.getData('startX');
      const range = enemy.getData('patrolRange');
      let dir = enemy.getData('direction') || 1;

      // Reverse at patrol range limits
      if (enemy.x > startX + range) dir = -1;
      else if (enemy.x < startX - range) dir = 1;

      // Reverse if blocked by a wall or crate
      if (dir === 1 && enemy.body.blocked.right) dir = -1;
      else if (dir === -1 && enemy.body.blocked.left) dir = 1;

      // Pit detection: look 24px ahead and 32px below feet — if no ground, reverse
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
      enemy.setVelocityX(dir * 60);
      enemy.setFlipX(dir === -1);
    });

    // Fall into pit = lose a life
    if (this.player.y > PIT_THRESHOLD && !this.player.getData('pitCooldown')) {
      this.player.setData('pitCooldown', true);
      this.loseLife("Fell in a pit!");
    }
  }

  openPause() {
    this.scene.pause();
    this.scene.launch('PauseScene', { callerScene: 'Level1Scene' });
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

    // Check for crate hits
    let hitCrate = false;
    this.crates.children.each(crate => {
      if (!crate.active) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, crate.x, crate.y);
      if (dist < 60) {
        hitCrate = true;
        const hp = crate.getData('health') - 1;
        crate.setData('health', hp);
        crate.setTint(0xff6666);
        this.time.delayedCall(100, () => {
          if (crate.active) crate.clearTint();
        });

        if (hp <= 0) {
          this.breakCrate(crate);
        }
      }
    });

    // Bounce back if hit a crate, otherwise lunge forward
    if (hitCrate) {
      const knockback = this.playerState.facingRight ? -150 : 150;
      this.player.setVelocityX(knockback);
      this.player.setVelocityY(-200);
    } else {
      const lungeVel = this.playerState.facingRight ? 200 : -200;
      this.player.setVelocityX(lungeVel);
      this.player.setVelocityY(-100);
    }

    // Scare nearby enemies
    this.enemies.children.each(enemy => {
      if (!enemy.active) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (dist < 80) {
        this.scareEnemy(enemy);
      }
    });

    // Reset
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
    // Particle burst
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

    // Sometimes drop tuna
    if (Math.random() < 0.6) {
      const bonus = this.tunas.create(crate.x, crate.y - 20, 'tuna');
      bonus.body.setAllowGravity(false);
      this.addFloatAnimation(bonus);
    }

    crate.destroy();
    this.showQuickMessage("Smashed!", 0xffaa00);
  }

  scareEnemy(enemy) {
    // Enemy runs away scared
    const runDir = enemy.x > this.player.x ? 1 : -1;
    enemy.setVelocityX(runDir * 300);
    enemy.setVelocityY(-200);

    // Flash and fade
    enemy.setTint(0xffaaaa);
    this.tweens.add({
      targets: enemy,
      alpha: 0,
      duration: 800,
      onComplete: () => enemy.destroy()
    });

    this.showQuickMessage("Squirrel scared away!", 0x44ff44);
  }

  hitEnemy(player, enemy) {
    if (this.playerState.isPouncing) {
      this.scareEnemy(enemy);
      return;
    }

    // Player takes damage, knockback
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

    // Flash effect
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
    const px = piece.x, py = piece.y;
    piece.destroy();
    try { this.sound.play('generalpickup', { volume: 0.6 }); } catch(e) {}
    this.playerState.mapPieces++;
    this.showQuickMessage("MAP PIECE FOUND! (1/7)", 0xffd700);
    this.collectEffect(px, py, 0xffd700);

    this.time.delayedCall(1000, () => {
      this.showDialog([
        { speaker: 'Whiskers', text: "I found a piece of the Puzzle Map!" },
        { speaker: 'Whiskers', text: "Only 6 more to go. I need to keep looking!" }
      ]);
    });
  }

  collectPendant(player, pendant) {
    const px = pendant.x, py = pendant.y;
    pendant.destroy();
    try { this.sound.play('generalpickup', { volume: 0.6 }); } catch(e) {}
    this.playerState.accessories.push('fish_pendant');
    this.showQuickMessage("FISH PENDANT acquired! -25% food drain!", 0xffd700);
    this.collectEffect(px, py, 0xffd700);
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

    let hungerDrain = 0.3;  // idle
    let thirstDrain = 0.3;

    if (isMoving && state.isRunning) {
      hungerDrain = 1.2;
      thirstDrain = 0.9;
    } else if (isMoving) {
      hungerDrain = 0.6;
      thirstDrain = 0.5;
    }

    if (hasPendant) {
      hungerDrain *= 0.75;
    }

    state.hunger = Math.max(0, state.hunger - hungerDrain);
    state.thirst = Math.max(0, state.thirst - thirstDrain);

    // Exhaustion check
    if (state.hunger <= 0 || state.thirst <= 0) {
      if (!state.isExhausted) {
        state.isExhausted = true;
        this.player.setTint(0x999999);
        const msg = state.hunger <= 0 ? "So hungry... need tuna!" : "So thirsty... need water!";
        this.showDialog([
          { speaker: 'Whiskers', text: msg },
          { speaker: 'Whiskers', text: "I can't move until I eat something..." }
        ]);
      }
    } else {
      if (state.isExhausted) {
        state.isExhausted = false;
        this.player.clearTint();
        this.showQuickMessage("Feeling better!", 0x44ff44);
      }
    }

    // Update UI
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
      // Show all remaining dialog
      const remaining = dialogs.slice(idx);
      this.showDialog(remaining);
      npc.setData('dialogIndex', dialogs.length);

      // Remove exclamation after first interaction
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
      // Repeat last line or idle chat
      const name = npc.getData('name');
      this.showQuickMessage(`${name}: "Good luck out there!"`, 0xffffff);
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
