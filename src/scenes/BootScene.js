import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Load music
    this.load.audio('bgm', 'music/Pixel Paws 2026.mp3');
  }

  create() {
    // Generate all placeholder textures
    this.createPlaceholderTextures();

    // Start music (looping)
    this.sound.play('bgm', { loop: true, volume: 0.4 });

    this.scene.start('TitleScene');
  }

  // Helper: draw a star shape without fillStar
  drawStar(graphics, cx, cy, outerRadius, innerRadius, points) {
    const step = Math.PI / points;
    graphics.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = i * step - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) graphics.moveTo(x, y);
      else graphics.lineTo(x, y);
    }
    graphics.closePath();
    graphics.fillPath();
  }

  // Draw a cat body (centered in a 48x40 frame) with configurable leg positions
  // legPhase: 0=stand, 1=walk1, 2=walk2, 3=walk3 (different leg positions)
  drawCatBody(g, bodyColor, earColor, earInnerColor, eyeColor, legPhase) {
    const cx = 24; // center x of 48-wide frame

    // Tail (behind body)
    g.lineStyle(3, bodyColor);
    if (legPhase === 0) {
      g.arc(cx + 14, 14, 8, Math.PI * 0.5, Math.PI * 1.5, true);
    } else {
      // Slight tail wag per frame
      const tailY = legPhase === 2 ? 12 : 16;
      g.arc(cx + 14, tailY, 8, Math.PI * 0.4, Math.PI * 1.6, true);
    }

    // Body
    g.fillStyle(bodyColor);
    g.fillRoundedRect(cx - 14, 12, 28, 16, 4);

    // Stripes (only for orange cats)
    if (bodyColor === 0xff8c42) {
      g.lineStyle(2, earColor, 0.5);
      g.lineBetween(cx - 4, 12, cx - 4, 26);
      g.lineBetween(cx + 2, 12, cx + 2, 26);
      g.lineBetween(cx + 8, 12, cx + 8, 26);
    }

    // Legs with walk cycle
    g.fillStyle(bodyColor);
    const legW = 5, legH = 8;
    let fl1Y = 26, fl2Y = 26, bl1Y = 26, bl2Y = 26; // front/back leg Y offsets
    let fl1X = cx - 10, fl2X = cx - 5, bl1X = cx + 5, bl2X = cx + 10;

    if (legPhase === 1) {
      fl1Y = 24; bl2Y = 24; // front-left and back-right up
    } else if (legPhase === 2) {
      fl2Y = 24; bl1Y = 24; // front-right and back-left up
    } else if (legPhase === 3) {
      fl1Y = 25; fl2Y = 23; bl1Y = 25; bl2Y = 23;
    }

    g.fillRect(fl1X, fl1Y, legW, legH);
    g.fillRect(fl2X, fl2Y, legW, legH);
    g.fillRect(bl1X, bl1Y, legW, legH);
    g.fillRect(bl2X, bl2Y, legW, legH);

    // Paws
    const pawColor = bodyColor === 0x222222 ? 0x333333 : 0xffd4a3;
    g.fillStyle(pawColor);
    g.fillRoundedRect(fl1X - 1, fl1Y + legH - 3, legW + 2, 4, 2);
    g.fillRoundedRect(fl2X - 1, fl2Y + legH - 3, legW + 2, 4, 2);
    g.fillRoundedRect(bl1X - 1, bl1Y + legH - 3, legW + 2, 4, 2);
    g.fillRoundedRect(bl2X - 1, bl2Y + legH - 3, legW + 2, 4, 2);

    // Head
    g.fillStyle(bodyColor);
    g.fillCircle(cx - 6, 12, 10);

    // Ears
    g.fillStyle(earColor);
    g.fillTriangle(cx - 14, 6, cx - 10, 0, cx - 6, 6);
    g.fillTriangle(cx - 10, 6, cx - 6, 0, cx - 2, 6);
    g.fillStyle(earInnerColor);
    g.fillTriangle(cx - 13, 6, cx - 10, 2, cx - 7, 6);
    g.fillTriangle(cx - 9, 6, cx - 6, 2, cx - 3, 6);

    // Eyes
    g.fillStyle(eyeColor);
    g.fillCircle(cx - 11, 12, 2.5);
    g.fillCircle(cx - 5, 12, 2.5);
    // Pupils
    if (bodyColor === 0x222222) {
      g.fillStyle(0x000000);
      g.fillCircle(cx - 11, 12, 1);
      g.fillCircle(cx - 5, 12, 1);
    }
    // Eye shine
    g.fillStyle(0xffffff);
    g.fillCircle(cx - 12, 11, 1);
    g.fillCircle(cx - 6, 11, 1);

    // Nose
    const noseColor = bodyColor === 0x222222 ? 0x333333 : 0xff69b4;
    g.fillStyle(noseColor);
    g.fillTriangle(cx - 9, 14, cx - 7, 14, cx - 8, 15);

    // Whiskers
    const whiskerColor = bodyColor === 0x222222 ? 0x666666 : 0xffffff;
    g.lineStyle(1, whiskerColor, 0.6);
    g.lineBetween(cx - 15, 13, cx - 10, 13);
    g.lineBetween(cx - 15, 15, cx - 10, 15);
    g.lineBetween(cx - 6, 13, cx - 1, 13);
    g.lineBetween(cx - 6, 15, cx - 1, 15);
  }

  // Generate 4 individual frame textures for a cat
  generateCatFrames(key, bodyColor, earColor, earInnerColor, eyeColor) {
    const frameW = 48, frameH = 40;
    for (let i = 0; i < 4; i++) {
      const g = this.add.graphics();
      this.drawCatBody(g, bodyColor, earColor, earInnerColor, eyeColor, i);
      g.generateTexture(`${key}_f${i}`, frameW, frameH);
      g.destroy();
    }
  }

  createPlaceholderTextures() {
    // Whiskers - orange tabby cat (4 frames: idle + 3 walk)
    this.generateCatFrames('cat_whiskers', 0xff8c42, 0xff6b1a, 0xffb3b3, 0x2d5a1e);

    // Luna - black cat (4 frames: idle + 3 walk)
    this.generateCatFrames('cat_luna', 0x222222, 0x111111, 0x663366, 0x44ff44);

    // Create animations using individual frame textures
    this.anims.create({
      key: 'whiskers_idle',
      frames: [{ key: 'cat_whiskers_f0' }],
      frameRate: 1,
    });
    this.anims.create({
      key: 'whiskers_walk',
      frames: [
        { key: 'cat_whiskers_f1' },
        { key: 'cat_whiskers_f2' },
        { key: 'cat_whiskers_f3' },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: 'luna_idle',
      frames: [{ key: 'cat_luna_f0' }],
      frameRate: 1,
    });
    this.anims.create({
      key: 'luna_walk',
      frames: [
        { key: 'cat_luna_f1' },
        { key: 'cat_luna_f2' },
        { key: 'cat_luna_f3' },
      ],
      frameRate: 8,
      repeat: -1,
    });

    // Tuna can
    const tuna = this.add.graphics();
    tuna.fillStyle(0x4a90d9);
    tuna.fillRoundedRect(2, 4, 20, 14, 3);
    tuna.fillStyle(0x6ab0ff);
    tuna.fillRoundedRect(4, 6, 16, 10, 2);
    tuna.fillStyle(0xc0c0c0);
    tuna.fillCircle(12, 4, 6);
    tuna.fillStyle(0xff9999);
    tuna.fillTriangle(8, 11, 16, 8, 16, 14);
    tuna.fillTriangle(15, 8, 18, 11, 15, 14);
    tuna.fillStyle(0xffff00);
    tuna.fillCircle(20, 3, 2);
    tuna.generateTexture('tuna', 24, 20);
    tuna.destroy();

    // Water bowl
    const water = this.add.graphics();
    water.fillStyle(0x8B4513);
    water.fillRoundedRect(2, 8, 20, 10, 2);
    water.fillStyle(0x4fc3f7);
    water.fillCircle(12, 8, 8);
    water.fillStyle(0xffffff, 0.6);
    water.fillCircle(8, 7, 2);
    water.generateTexture('water', 24, 20);
    water.destroy();

    // Platform tile
    const platform = this.add.graphics();
    platform.fillStyle(0x8B6914);
    platform.fillRect(0, 0, 32, 32);
    platform.fillStyle(0x6B4914);
    platform.fillRect(0, 0, 32, 4);
    platform.fillStyle(0x4CAF50);
    platform.fillRect(0, 0, 32, 6);
    platform.fillStyle(0x66BB6A);
    platform.fillRect(2, 0, 4, 3);
    platform.fillRect(10, 0, 3, 4);
    platform.fillRect(20, 0, 5, 3);
    platform.fillRect(28, 0, 3, 4);
    platform.fillStyle(0x9B7924, 0.3);
    platform.fillRect(4, 12, 3, 3);
    platform.fillRect(15, 20, 4, 3);
    platform.fillRect(24, 14, 3, 2);
    platform.generateTexture('platform', 32, 32);
    platform.destroy();

    // Ground
    const ground = this.add.graphics();
    ground.fillStyle(0x6B4914);
    ground.fillRect(0, 0, 32, 32);
    ground.fillStyle(0x5a3a0a, 0.4);
    ground.fillRect(5, 8, 4, 4);
    ground.fillRect(18, 15, 5, 3);
    ground.fillRect(10, 24, 3, 4);
    ground.generateTexture('ground', 32, 32);
    ground.destroy();

    // Crate
    const crate = this.add.graphics();
    crate.fillStyle(0xc8a45c);
    crate.fillRect(0, 0, 32, 32);
    crate.lineStyle(2, 0x8B6914);
    crate.strokeRect(1, 1, 30, 30);
    crate.lineBetween(1, 1, 31, 31);
    crate.lineBetween(31, 1, 1, 31);
    crate.lineStyle(1, 0x6B4914, 0.5);
    crate.lineBetween(8, 0, 12, 8);
    crate.lineBetween(24, 0, 20, 10);
    crate.generateTexture('crate', 32, 32);
    crate.destroy();

    // Squirrel
    const squirrel = this.add.graphics();
    squirrel.fillStyle(0x8B4513);
    squirrel.fillRoundedRect(6, 10, 16, 14, 4);
    squirrel.fillCircle(10, 10, 7);
    squirrel.fillStyle(0xa0522d);
    squirrel.fillCircle(5, 5, 3);
    squirrel.fillCircle(15, 5, 3);
    squirrel.fillStyle(0x000000);
    squirrel.fillCircle(7, 9, 2);
    squirrel.fillCircle(13, 9, 2);
    squirrel.fillStyle(0xffffff);
    squirrel.fillCircle(7, 8, 1);
    squirrel.fillCircle(13, 8, 1);
    squirrel.fillStyle(0xa0522d);
    squirrel.fillCircle(26, 8, 6);
    squirrel.fillStyle(0xc07030);
    squirrel.fillCircle(26, 6, 4);
    squirrel.generateTexture('squirrel', 32, 28);
    squirrel.destroy();

    // NPC cat (gray)
    const npc = this.add.graphics();
    npc.fillStyle(0x888888);
    npc.fillRoundedRect(4, 12, 28, 18, 4);
    npc.fillCircle(8, 12, 10);
    npc.fillStyle(0x666666);
    npc.fillTriangle(2, 6, 6, 0, 10, 6);
    npc.fillTriangle(6, 6, 10, 0, 14, 6);
    npc.fillStyle(0xffb3b3);
    npc.fillTriangle(3, 6, 6, 2, 9, 6);
    npc.fillTriangle(7, 6, 10, 2, 13, 6);
    npc.fillStyle(0x4a7a2e);
    npc.fillCircle(5, 12, 2);
    npc.fillCircle(11, 12, 2);
    npc.fillStyle(0xffffff);
    npc.fillCircle(4, 11, 1);
    npc.fillCircle(10, 11, 1);
    npc.fillStyle(0xff69b4);
    npc.fillTriangle(7, 14, 9, 14, 8, 15);
    npc.fillStyle(0x888888);
    npc.fillRect(8, 28, 5, 8);
    npc.fillRect(24, 28, 5, 8);
    npc.fillStyle(0xaaaaaa);
    npc.fillRoundedRect(7, 34, 7, 4, 2);
    npc.fillRoundedRect(23, 34, 7, 4, 2);
    npc.generateTexture('npc_cat', 44, 40);
    npc.destroy();

    // Map piece
    const mapPiece = this.add.graphics();
    mapPiece.fillStyle(0xf5deb3);
    mapPiece.fillRect(2, 2, 20, 20);
    mapPiece.lineStyle(2, 0x8B6914);
    mapPiece.strokeRect(2, 2, 20, 20);
    mapPiece.fillStyle(0xf5deb3);
    mapPiece.fillCircle(22, 12, 5);
    mapPiece.lineStyle(1, 0xcc9966);
    mapPiece.lineBetween(5, 8, 18, 8);
    mapPiece.lineBetween(5, 12, 15, 12);
    mapPiece.lineBetween(8, 16, 18, 16);
    mapPiece.lineStyle(2, 0xff0000);
    mapPiece.lineBetween(12, 5, 16, 9);
    mapPiece.lineBetween(16, 5, 12, 9);
    mapPiece.fillStyle(0xffff00, 0.2);
    mapPiece.fillCircle(12, 12, 14);
    mapPiece.generateTexture('map_piece', 28, 24);
    mapPiece.destroy();

    // Exclamation mark
    const exclamation = this.add.graphics();
    exclamation.fillStyle(0xffff00);
    exclamation.fillRoundedRect(4, 0, 6, 14, 2);
    exclamation.fillCircle(7, 18, 3);
    exclamation.generateTexture('exclamation', 14, 22);
    exclamation.destroy();

    // Fish Pendant
    const pendant = this.add.graphics();
    pendant.fillStyle(0xffd700);
    pendant.fillCircle(10, 10, 8);
    pendant.fillStyle(0xff6b6b);
    pendant.fillTriangle(6, 10, 14, 7, 14, 13);
    pendant.fillTriangle(13, 7, 16, 10, 13, 13);
    pendant.generateTexture('fish_pendant', 20, 20);
    pendant.destroy();

    // Pounce effect (use diamond shape instead of star)
    const pounceEffect = this.add.graphics();
    pounceEffect.fillStyle(0xffaa00, 0.6);
    this.drawStar(pounceEffect, 16, 16, 16, 8, 8);
    pounceEffect.generateTexture('pounce_effect', 32, 32);
    pounceEffect.destroy();

    // Wood particle
    const particle = this.add.graphics();
    particle.fillStyle(0xc8a45c);
    particle.fillRect(0, 0, 6, 6);
    particle.generateTexture('wood_particle', 6, 6);
    particle.destroy();

    // Forest platform
    const forestPlatform = this.add.graphics();
    forestPlatform.fillStyle(0x3a2a1a);
    forestPlatform.fillRect(0, 0, 32, 32);
    forestPlatform.fillStyle(0x2a4a1a);
    forestPlatform.fillRect(0, 0, 32, 6);
    forestPlatform.fillStyle(0x4a6a2a, 0.7);
    forestPlatform.fillCircle(5, 3, 4);
    forestPlatform.fillCircle(16, 2, 5);
    forestPlatform.fillCircle(27, 3, 4);
    forestPlatform.fillStyle(0x2a1a0a, 0.3);
    forestPlatform.fillRect(3, 10, 2, 6);
    forestPlatform.fillRect(12, 14, 3, 4);
    forestPlatform.fillRect(22, 8, 2, 8);
    forestPlatform.generateTexture('forest_platform', 32, 32);
    forestPlatform.destroy();

    // Forest ground
    const forestGround = this.add.graphics();
    forestGround.fillStyle(0x2a1a0a);
    forestGround.fillRect(0, 0, 32, 32);
    forestGround.fillStyle(0x1a0a00, 0.4);
    forestGround.fillRect(4, 6, 5, 4);
    forestGround.fillRect(16, 18, 4, 3);
    forestGround.fillRect(8, 24, 6, 3);
    forestGround.generateTexture('forest_ground', 32, 32);
    forestGround.destroy();

    // Boulder
    const boulder = this.add.graphics();
    boulder.fillStyle(0x666666);
    boulder.fillCircle(20, 20, 18);
    boulder.fillStyle(0x777777);
    boulder.fillCircle(16, 14, 10);
    boulder.fillStyle(0x555555, 0.5);
    boulder.fillCircle(24, 24, 8);
    boulder.lineStyle(1, 0x444444);
    boulder.lineBetween(10, 12, 22, 20);
    boulder.lineBetween(14, 8, 20, 28);
    boulder.lineStyle(2, 0x888888, 0.3);
    boulder.lineBetween(8, 18, 16, 16);
    boulder.generateTexture('boulder', 40, 40);
    boulder.destroy();

    // Rock particle
    const rockParticle = this.add.graphics();
    rockParticle.fillStyle(0x888888);
    rockParticle.fillRect(0, 0, 6, 6);
    rockParticle.generateTexture('rock_particle', 6, 6);
    rockParticle.destroy();

    // Raccoon
    const raccoon = this.add.graphics();
    raccoon.fillStyle(0x555555);
    raccoon.fillRoundedRect(4, 10, 20, 16, 4);
    raccoon.fillCircle(10, 10, 8);
    raccoon.fillStyle(0x222222);
    raccoon.fillRoundedRect(3, 7, 14, 5, 2);
    raccoon.fillStyle(0xffffff);
    raccoon.fillCircle(6, 9, 2);
    raccoon.fillCircle(14, 9, 2);
    raccoon.fillStyle(0x000000);
    raccoon.fillCircle(6, 9, 1);
    raccoon.fillCircle(14, 9, 1);
    raccoon.fillStyle(0x333333);
    raccoon.fillCircle(10, 13, 2);
    raccoon.fillStyle(0x555555);
    raccoon.fillCircle(3, 4, 3);
    raccoon.fillCircle(17, 4, 3);
    raccoon.fillStyle(0x888888);
    raccoon.fillCircle(3, 4, 1.5);
    raccoon.fillCircle(17, 4, 1.5);
    raccoon.fillStyle(0x555555);
    raccoon.fillRoundedRect(22, 6, 8, 5, 2);
    raccoon.fillStyle(0x222222);
    raccoon.fillRect(24, 6, 2, 5);
    raccoon.fillRect(28, 6, 2, 5);
    raccoon.fillStyle(0x444444);
    raccoon.fillRect(8, 24, 4, 6);
    raccoon.fillRect(18, 24, 4, 6);
    raccoon.generateTexture('raccoon', 32, 32);
    raccoon.destroy();

    // Crow
    const crow = this.add.graphics();
    crow.fillStyle(0x111111);
    crow.fillCircle(16, 14, 7);
    crow.fillCircle(8, 10, 5);
    crow.fillStyle(0xcc8800);
    crow.fillTriangle(3, 10, 7, 8, 7, 12);
    crow.fillStyle(0xff4444);
    crow.fillCircle(7, 9, 1.5);
    crow.fillStyle(0x222222);
    crow.fillTriangle(10, 8, 20, 2, 22, 14);
    crow.fillTriangle(12, 8, 22, 0, 26, 10);
    crow.generateTexture('crow', 32, 20);
    crow.destroy();

    // Mushroom
    const mushroom = this.add.graphics();
    mushroom.fillStyle(0xddddaa);
    mushroom.fillRect(8, 10, 6, 10);
    mushroom.fillStyle(0xdd4444);
    mushroom.fillCircle(11, 8, 8);
    mushroom.fillStyle(0xffffff);
    mushroom.fillCircle(7, 6, 2);
    mushroom.fillCircle(14, 5, 1.5);
    mushroom.fillCircle(11, 9, 1.5);
    mushroom.generateTexture('mushroom', 22, 22);
    mushroom.destroy();

    // Firefly
    const firefly = this.add.graphics();
    firefly.fillStyle(0xffffaa, 0.4);
    firefly.fillCircle(6, 6, 6);
    firefly.fillStyle(0xffff44, 0.8);
    firefly.fillCircle(6, 6, 3);
    firefly.generateTexture('firefly', 12, 12);
    firefly.destroy();

    // Tree trunk
    const treeTrunk = this.add.graphics();
    treeTrunk.fillStyle(0x3a2a1a);
    treeTrunk.fillRect(0, 0, 24, 64);
    treeTrunk.fillStyle(0x2a1a0a, 0.4);
    treeTrunk.fillRect(4, 0, 3, 64);
    treeTrunk.fillRect(14, 0, 2, 64);
    treeTrunk.fillStyle(0x1a0a00);
    treeTrunk.fillCircle(12, 30, 4);
    treeTrunk.fillStyle(0x3a2a1a);
    treeTrunk.fillCircle(12, 30, 2);
    treeTrunk.generateTexture('tree_trunk', 24, 64);
    treeTrunk.destroy();

    // Tree canopy
    const treeCanopy = this.add.graphics();
    treeCanopy.fillStyle(0x1a3a0a, 0.9);
    treeCanopy.fillCircle(32, 24, 24);
    treeCanopy.fillStyle(0x2a4a1a, 0.7);
    treeCanopy.fillCircle(20, 16, 16);
    treeCanopy.fillCircle(44, 18, 14);
    treeCanopy.fillStyle(0x0a2a00, 0.5);
    treeCanopy.fillCircle(30, 30, 18);
    treeCanopy.generateTexture('tree_canopy', 64, 48);
    treeCanopy.destroy();

    // Exit sign
    const exitSign = this.add.graphics();
    exitSign.fillStyle(0x6B4914);
    exitSign.fillRect(10, 12, 4, 20);
    exitSign.fillStyle(0xc8a45c);
    exitSign.fillRoundedRect(0, 0, 24, 14, 3);
    exitSign.lineStyle(1, 0x8B6914);
    exitSign.strokeRoundedRect(0, 0, 24, 14, 3);
    exitSign.fillStyle(0x4CAF50);
    exitSign.fillTriangle(16, 3, 22, 7, 16, 11);
    exitSign.fillRect(4, 5, 12, 4);
    exitSign.generateTexture('exit_sign', 24, 32);
    exitSign.destroy();

    // Night vision glow
    const nvGlow = this.add.graphics();
    const glowRadius = 150;
    for (let r = glowRadius; r > 0; r -= 2) {
      const alpha = (r / glowRadius) * 0.8;
      nvGlow.fillStyle(0xffffff, alpha);
      nvGlow.fillCircle(glowRadius, glowRadius, r);
    }
    nvGlow.generateTexture('nv_glow', glowRadius * 2, glowRadius * 2);
    nvGlow.destroy();

    // Hidden path sparkle (use star helper)
    const hiddenSparkle = this.add.graphics();
    hiddenSparkle.fillStyle(0x44ff44, 0.6);
    this.drawStar(hiddenSparkle, 8, 8, 8, 4, 4);
    hiddenSparkle.generateTexture('hidden_sparkle', 16, 16);
    hiddenSparkle.destroy();
  }
}
