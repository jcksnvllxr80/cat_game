import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Load music
    this.load.audio('mainmenumusic', 'music/mainmenumusic.mp3');
    this.load.audio('victory', 'music/victory.mp3');
    this.load.audio('gameover', 'music/gameover.mp3');
    this.load.audio('tunapickup', 'sounds/tunapickup.mp3');
    this.load.audio('waterpickup', 'sounds/waterpickup.mp3');
    this.load.audio('generalpickup', 'sounds/generalpickup.mp3');
    this.load.audio('level1music', 'music/level1music.mp3');
    this.load.audio('level2music', 'music/level2music.mp3');
    this.load.audio('level3music', 'music/level3music.mp3');
    this.load.audio('level4music', 'music/level4music.mp3');
    this.load.audio('level5music', 'music/level5music.mp3');
    this.load.audio('level6music', 'music/level6music.mp3');
    this.load.audio('level7music', 'music/level7music.mp3');
  }

  create() {
    // Generate all placeholder textures
    this.createPlaceholderTextures();

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

    // Tuxedo white chest (Boots)
    if (bodyColor === 0x1a1a1a) {
      g.fillStyle(0xffffff);
      g.fillRoundedRect(cx - 8, 16, 10, 10, 3);
    }

    // Siamese dark face mask (Cleo)
    if (bodyColor === 0xf5deb3) {
      g.fillStyle(0x8B6914, 0.4);
      g.fillCircle(cx - 8, 12, 6);
    }

    // Calico patches (Mochi)
    if (bodyColor === 0xeeeeee) {
      g.fillStyle(0xff8c42, 0.6);
      g.fillCircle(cx - 4, 18, 6);
      g.fillCircle(cx + 8, 14, 5);
      g.fillStyle(0x333333, 0.5);
      g.fillCircle(cx + 2, 22, 4);
    }

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
    // Tuxedo (Boots) gets white paws, Siamese (Cleo) gets dark paws, Luna gets dark, others get peach
    const pawColor = bodyColor === 0x1a1a1a ? 0xffffff : bodyColor === 0x222222 ? 0x333333 : bodyColor === 0xf5deb3 ? 0x8B6914 : bodyColor === 0xeeeeee ? 0xffccaa : 0xffd4a3;
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

  // Draw a cat in a pounce/lunge pose — body tilted forward, front paws extended
  drawCatPounce(g, bodyColor, earColor, earInnerColor, eyeColor, phase) {
    const cx = 24;

    // Tail — straight back and up
    g.lineStyle(3, bodyColor);
    g.lineBetween(cx + 12, 10, cx + 20, 4);

    // Body — tilted forward (angled down)
    g.fillStyle(bodyColor);
    g.fillRoundedRect(cx - 16, 14, 30, 14, 4);

    // Character-specific markings
    this.drawCharMarkings(g, bodyColor, cx, 14);

    // Legs — crouched (phase 0) or lunging (phase 1)
    g.fillStyle(bodyColor);
    if (phase === 0) {
      // Crouch — legs bent under body
      g.fillRect(cx - 12, 26, 5, 6);
      g.fillRect(cx - 6, 27, 5, 5);
      g.fillRect(cx + 4, 27, 5, 5);
      g.fillRect(cx + 10, 26, 5, 6);
    } else {
      // Lunge — front legs extended forward, back legs pushed back
      g.fillRect(cx - 18, 24, 5, 8);
      g.fillRect(cx - 12, 26, 5, 7);
      g.fillRect(cx + 8, 26, 5, 7);
      g.fillRect(cx + 14, 24, 5, 8);
    }

    // Paws
    const pawColor = this.getPawColor(bodyColor);
    g.fillStyle(pawColor);
    if (phase === 0) {
      g.fillRoundedRect(cx - 13, 30, 7, 4, 2);
      g.fillRoundedRect(cx - 7, 30, 7, 4, 2);
      g.fillRoundedRect(cx + 3, 30, 7, 4, 2);
      g.fillRoundedRect(cx + 9, 30, 7, 4, 2);
    } else {
      g.fillRoundedRect(cx - 19, 30, 7, 4, 2);
      g.fillRoundedRect(cx - 13, 31, 7, 4, 2);
      g.fillRoundedRect(cx + 7, 31, 7, 4, 2);
      g.fillRoundedRect(cx + 13, 30, 7, 4, 2);
    }

    // Head — slightly lower in crouch, forward in lunge
    const headX = phase === 0 ? cx - 8 : cx - 12;
    const headY = phase === 0 ? 13 : 11;
    g.fillStyle(bodyColor);
    g.fillCircle(headX, headY, 10);

    // Ears
    g.fillStyle(earColor);
    g.fillTriangle(headX - 8, headY - 4, headX - 4, headY - 10, headX, headY - 4);
    g.fillTriangle(headX - 4, headY - 4, headX, headY - 10, headX + 4, headY - 4);
    g.fillStyle(earInnerColor);
    g.fillTriangle(headX - 7, headY - 4, headX - 4, headY - 8, headX - 1, headY - 4);
    g.fillTriangle(headX - 3, headY - 4, headX, headY - 8, headX + 3, headY - 4);

    // Eyes — narrowed/fierce
    g.fillStyle(eyeColor);
    g.fillEllipse(headX - 5, headY, 5, 3);
    g.fillEllipse(headX + 1, headY, 5, 3);
    g.fillStyle(0xffffff);
    g.fillCircle(headX - 6, headY - 1, 1);
    g.fillCircle(headX, headY - 1, 1);

    // Nose
    const noseColor = bodyColor === 0x222222 ? 0x333333 : 0xff69b4;
    g.fillStyle(noseColor);
    g.fillTriangle(headX - 3, headY + 2, headX - 1, headY + 2, headX - 2, headY + 3);
  }

  // Draw a cat in a dash pose — body stretched horizontally with speed lines
  drawCatDash(g, bodyColor, earColor, earInnerColor, eyeColor) {
    const cx = 24;

    // Speed lines behind
    g.lineStyle(1, 0xffffff, 0.5);
    g.lineBetween(cx + 18, 14, cx + 26, 14);
    g.lineBetween(cx + 16, 18, cx + 24, 18);
    g.lineBetween(cx + 18, 22, cx + 26, 22);

    // Tail — streaming behind
    g.lineStyle(3, bodyColor);
    g.lineBetween(cx + 14, 16, cx + 22, 12);

    // Body — stretched long and low
    g.fillStyle(bodyColor);
    g.fillRoundedRect(cx - 18, 14, 34, 12, 4);

    this.drawCharMarkings(g, bodyColor, cx, 14);

    // Legs — extended far in running stride
    g.fillStyle(bodyColor);
    g.fillRect(cx - 16, 24, 4, 9);
    g.fillRect(cx - 8, 26, 4, 7);
    g.fillRect(cx + 6, 26, 4, 7);
    g.fillRect(cx + 14, 24, 4, 9);

    const pawColor = this.getPawColor(bodyColor);
    g.fillStyle(pawColor);
    g.fillRoundedRect(cx - 17, 31, 6, 4, 2);
    g.fillRoundedRect(cx - 9, 31, 6, 4, 2);
    g.fillRoundedRect(cx + 5, 31, 6, 4, 2);
    g.fillRoundedRect(cx + 13, 31, 6, 4, 2);

    // Head — forward and determined
    g.fillStyle(bodyColor);
    g.fillCircle(cx - 12, 12, 10);

    // Ears — swept back
    g.fillStyle(earColor);
    g.fillTriangle(cx - 6, 8, cx - 2, 2, cx, 10);
    g.fillTriangle(cx - 10, 8, cx - 6, 2, cx - 4, 10);
    g.fillStyle(earInnerColor);
    g.fillTriangle(cx - 6, 8, cx - 3, 4, cx - 1, 10);
    g.fillTriangle(cx - 9, 8, cx - 6, 4, cx - 5, 10);

    // Eyes — focused forward
    g.fillStyle(eyeColor);
    g.fillEllipse(cx - 17, 12, 5, 3);
    g.fillEllipse(cx - 11, 12, 5, 3);
    g.fillStyle(0xffffff);
    g.fillCircle(cx - 18, 11, 1);
    g.fillCircle(cx - 12, 11, 1);

    const noseColor = bodyColor === 0x222222 ? 0x333333 : 0xff69b4;
    g.fillStyle(noseColor);
    g.fillTriangle(cx - 15, 14, cx - 13, 14, cx - 14, 15);
  }

  // Draw Boots in super sprint pose — extremely stretched with motion blur
  drawCatSprint(g, bodyColor, earColor, earInnerColor, eyeColor, phase) {
    const cx = 24;

    // Heavy speed lines
    g.lineStyle(2, 0xff8800, 0.4);
    g.lineBetween(cx + 16, 12, cx + 28, 12);
    g.lineBetween(cx + 14, 16, cx + 28, 16);
    g.lineBetween(cx + 16, 20, cx + 28, 20);
    g.lineBetween(cx + 14, 24, cx + 26, 24);

    // Tail — streaming far behind
    g.lineStyle(3, bodyColor);
    g.lineBetween(cx + 14, 16, cx + 24, 10);
    g.lineBetween(cx + 24, 10, cx + 28, 12);

    // Body — very stretched
    g.fillStyle(bodyColor);
    g.fillRoundedRect(cx - 20, 14, 36, 12, 4);

    this.drawCharMarkings(g, bodyColor, cx, 14);

    // Legs — extreme stride alternating by phase
    g.fillStyle(bodyColor);
    if (phase === 0) {
      g.fillRect(cx - 18, 24, 4, 9);
      g.fillRect(cx - 6, 26, 4, 6);
      g.fillRect(cx + 4, 26, 4, 6);
      g.fillRect(cx + 14, 24, 4, 9);
    } else if (phase === 1) {
      g.fillRect(cx - 14, 26, 4, 6);
      g.fillRect(cx - 4, 24, 4, 9);
      g.fillRect(cx + 8, 24, 4, 9);
      g.fillRect(cx + 16, 26, 4, 6);
    } else {
      g.fillRect(cx - 16, 25, 4, 8);
      g.fillRect(cx - 2, 25, 4, 8);
      g.fillRect(cx + 6, 25, 4, 8);
      g.fillRect(cx + 16, 25, 4, 8);
    }

    const pawColor = this.getPawColor(bodyColor);
    g.fillStyle(pawColor);
    g.fillRoundedRect(cx - 19, 31, 6, 4, 2);
    g.fillRoundedRect(cx - 7, 30, 6, 4, 2);
    g.fillRoundedRect(cx + 3, 30, 6, 4, 2);
    g.fillRoundedRect(cx + 13, 31, 6, 4, 2);

    // Head
    g.fillStyle(bodyColor);
    g.fillCircle(cx - 14, 12, 10);

    // Ears — swept back hard
    g.fillStyle(earColor);
    g.fillTriangle(cx - 8, 8, cx - 2, 4, cx, 12);
    g.fillTriangle(cx - 12, 8, cx - 6, 4, cx - 4, 12);
    g.fillStyle(earInnerColor);
    g.fillTriangle(cx - 8, 9, cx - 3, 5, cx - 1, 11);
    g.fillTriangle(cx - 11, 9, cx - 7, 5, cx - 5, 11);

    // Eyes — squinting with determination
    g.fillStyle(eyeColor);
    g.fillEllipse(cx - 19, 12, 5, 2);
    g.fillEllipse(cx - 13, 12, 5, 2);
    g.fillStyle(0xffffff);
    g.fillCircle(cx - 20, 11, 1);
    g.fillCircle(cx - 14, 11, 1);

    const noseColor = bodyColor === 0x222222 ? 0x333333 : 0xff69b4;
    g.fillStyle(noseColor);
    g.fillTriangle(cx - 17, 14, cx - 15, 14, cx - 16, 15);
  }

  // Draw Cleo in wall climbing pose — body vertical, claws gripping
  drawCatClimb(g, bodyColor, earColor, earInnerColor, eyeColor, phase) {
    const cx = 24;

    // Body — oriented more vertically
    g.fillStyle(bodyColor);
    g.fillRoundedRect(cx - 8, 8, 16, 24, 4);

    this.drawCharMarkings(g, bodyColor, cx, 10);

    // Climbing legs — spread out gripping wall
    g.fillStyle(bodyColor);
    if (phase === 0) {
      // Left paws gripping, right reaching
      g.fillRect(cx - 16, 10, 8, 4);
      g.fillRect(cx + 8, 14, 8, 4);
      g.fillRect(cx - 16, 24, 8, 4);
      g.fillRect(cx + 8, 28, 8, 4);
    } else {
      // Alternating grip
      g.fillRect(cx - 16, 14, 8, 4);
      g.fillRect(cx + 8, 10, 8, 4);
      g.fillRect(cx - 16, 28, 8, 4);
      g.fillRect(cx + 8, 24, 8, 4);
    }

    // Claw marks
    g.lineStyle(1, 0xcccccc, 0.5);
    if (phase === 0) {
      g.lineBetween(cx - 17, 10, cx - 17, 14);
      g.lineBetween(cx - 15, 10, cx - 15, 14);
      g.lineBetween(cx + 16, 14, cx + 16, 18);
    } else {
      g.lineBetween(cx + 16, 10, cx + 16, 14);
      g.lineBetween(cx + 14, 10, cx + 14, 14);
      g.lineBetween(cx - 17, 28, cx - 17, 32);
    }

    // Tail — curled to the side for balance
    g.lineStyle(3, bodyColor);
    g.arc(cx + 10, 30, 6, Math.PI * 0.5, Math.PI * 1.5, true);

    // Head — looking up
    g.fillStyle(bodyColor);
    g.fillCircle(cx, 6, 9);

    // Ears — alert, pointing up
    g.fillStyle(earColor);
    g.fillTriangle(cx - 8, 2, cx - 4, -6, cx, 2);
    g.fillTriangle(cx, 2, cx + 4, -6, cx + 8, 2);
    g.fillStyle(earInnerColor);
    g.fillTriangle(cx - 7, 2, cx - 4, -4, cx - 1, 2);
    g.fillTriangle(cx + 1, 2, cx + 4, -4, cx + 7, 2);

    // Eyes — looking up, wide and alert
    g.fillStyle(eyeColor);
    g.fillCircle(cx - 3, 4, 2.5);
    g.fillCircle(cx + 3, 4, 2.5);
    g.fillStyle(0x000000);
    g.fillCircle(cx - 3, 3, 1);
    g.fillCircle(cx + 3, 3, 1);
    g.fillStyle(0xffffff);
    g.fillCircle(cx - 4, 3, 1);
    g.fillCircle(cx + 2, 3, 1);

    const noseColor = bodyColor === 0x222222 ? 0x333333 : 0xff69b4;
    g.fillStyle(noseColor);
    g.fillTriangle(cx - 2, 7, cx, 7, cx - 1, 8);
  }

  // Draw Mochi in belly bounce pose — squished round body
  drawCatBounce(g, bodyColor, earColor, earInnerColor, eyeColor, phase) {
    const cx = 24;

    if (phase === 0) {
      // Charging/squish down — wide flat body, legs tucked
      g.fillStyle(bodyColor);
      g.fillRoundedRect(cx - 16, 18, 32, 12, 6);

      this.drawCharMarkings(g, bodyColor, cx, 18);

      // Tucked legs barely visible
      g.fillStyle(bodyColor);
      g.fillRect(cx - 10, 28, 5, 5);
      g.fillRect(cx - 3, 29, 5, 4);
      g.fillRect(cx + 4, 29, 5, 4);
      g.fillRect(cx + 10, 28, 5, 5);

      const pawColor = this.getPawColor(bodyColor);
      g.fillStyle(pawColor);
      g.fillRoundedRect(cx - 11, 31, 7, 4, 2);
      g.fillRoundedRect(cx - 4, 31, 7, 4, 2);
      g.fillRoundedRect(cx + 3, 31, 7, 4, 2);
      g.fillRoundedRect(cx + 9, 31, 7, 4, 2);

      // Head — pushed down
      g.fillStyle(bodyColor);
      g.fillCircle(cx - 6, 16, 10);

      // Tail
      g.lineStyle(3, bodyColor);
      g.arc(cx + 16, 20, 6, Math.PI * 0.3, Math.PI * 1.7, true);
    } else {
      // Airborne — body round like a ball, legs splayed
      g.fillStyle(bodyColor);
      g.fillCircle(cx, 16, 14);

      this.drawCharMarkings(g, bodyColor, cx, 8);

      // Legs splayed outward
      g.fillStyle(bodyColor);
      g.fillRect(cx - 14, 24, 5, 7);
      g.fillRect(cx - 6, 26, 5, 6);
      g.fillRect(cx + 4, 26, 5, 6);
      g.fillRect(cx + 12, 24, 5, 7);

      const pawColor = this.getPawColor(bodyColor);
      g.fillStyle(pawColor);
      g.fillRoundedRect(cx - 15, 29, 7, 4, 2);
      g.fillRoundedRect(cx - 7, 30, 7, 4, 2);
      g.fillRoundedRect(cx + 3, 30, 7, 4, 2);
      g.fillRoundedRect(cx + 11, 29, 7, 4, 2);

      // Head — on top
      g.fillStyle(bodyColor);
      g.fillCircle(cx - 4, 6, 10);

      // Tail curled
      g.lineStyle(3, bodyColor);
      g.arc(cx + 14, 10, 6, Math.PI * 0.5, Math.PI * 1.5, true);
    }

    // Ears (same position relative to head for both phases)
    const headX = phase === 0 ? cx - 6 : cx - 4;
    const headY = phase === 0 ? 16 : 6;
    g.fillStyle(earColor);
    g.fillTriangle(headX - 8, headY - 4, headX - 4, headY - 10, headX, headY - 4);
    g.fillTriangle(headX - 4, headY - 4, headX, headY - 10, headX + 4, headY - 4);
    g.fillStyle(earInnerColor);
    g.fillTriangle(headX - 7, headY - 4, headX - 4, headY - 8, headX - 1, headY - 4);
    g.fillTriangle(headX - 3, headY - 4, headX, headY - 8, headX + 3, headY - 4);

    // Eyes — excited/surprised
    g.fillStyle(eyeColor);
    g.fillCircle(headX - 5, headY, 3);
    g.fillCircle(headX + 1, headY, 3);
    g.fillStyle(0xffffff);
    g.fillCircle(headX - 6, headY - 1, 1.5);
    g.fillCircle(headX, headY - 1, 1.5);

    const noseColor = bodyColor === 0x222222 ? 0x333333 : 0xff69b4;
    g.fillStyle(noseColor);
    g.fillTriangle(headX - 3, headY + 2, headX - 1, headY + 2, headX - 2, headY + 3);
  }

  // Draw Luna with glowing night vision eyes
  drawCatNightVision(g, bodyColor, earColor, earInnerColor, eyeColor) {
    const cx = 24;

    // Draw normal idle body
    this.drawCatBody(g, bodyColor, earColor, earInnerColor, eyeColor, 0);

    // Overlay glowing eyes on top — bright green glow
    g.fillStyle(0x00ff00, 0.3);
    g.fillCircle(cx - 11, 12, 6);
    g.fillCircle(cx - 5, 12, 6);

    g.fillStyle(0x44ff44);
    g.fillCircle(cx - 11, 12, 3);
    g.fillCircle(cx - 5, 12, 3);

    g.fillStyle(0xaaffaa);
    g.fillCircle(cx - 11, 12, 1.5);
    g.fillCircle(cx - 5, 12, 1.5);
  }

  // Helper to get paw color based on body color
  getPawColor(bodyColor) {
    if (bodyColor === 0x1a1a1a) return 0xffffff;     // Boots — white paws
    if (bodyColor === 0x222222) return 0x333333;       // Luna — dark paws
    if (bodyColor === 0xf5deb3) return 0x8B6914;       // Cleo — brown paws
    if (bodyColor === 0xeeeeee) return 0xffccaa;       // Mochi — peach paws
    return 0xffd4a3;                                    // Whiskers — peach paws
  }

  // Helper to draw character-specific markings (stripes, patches, etc.)
  drawCharMarkings(g, bodyColor, cx, bodyY) {
    // Tuxedo white chest (Boots)
    if (bodyColor === 0x1a1a1a) {
      g.fillStyle(0xffffff);
      g.fillRoundedRect(cx - 8, bodyY + 4, 10, 8, 3);
    }
    // Siamese dark mask (Cleo)
    if (bodyColor === 0xf5deb3) {
      g.fillStyle(0x8B6914, 0.4);
      g.fillCircle(cx - 8, bodyY, 6);
    }
    // Calico patches (Mochi)
    if (bodyColor === 0xeeeeee) {
      g.fillStyle(0xff8c42, 0.6);
      g.fillCircle(cx - 4, bodyY + 4, 5);
      g.fillCircle(cx + 8, bodyY + 2, 4);
      g.fillStyle(0x333333, 0.5);
      g.fillCircle(cx + 2, bodyY + 8, 3);
    }
    // Tabby stripes (Whiskers)
    if (bodyColor === 0xff8c42) {
      g.lineStyle(2, 0xff6b1a, 0.5);
      g.lineBetween(cx - 4, bodyY, cx - 4, bodyY + 12);
      g.lineBetween(cx + 2, bodyY, cx + 2, bodyY + 12);
      g.lineBetween(cx + 8, bodyY, cx + 8, bodyY + 12);
    }
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

  // Generate special move frame textures for a cat
  generateSpecialFrames(key, bodyColor, earColor, earInnerColor, eyeColor) {
    const frameW = 48, frameH = 40;

    // Pounce frames (2): crouch + lunge
    for (let i = 0; i < 2; i++) {
      const g = this.add.graphics();
      this.drawCatPounce(g, bodyColor, earColor, earInnerColor, eyeColor, i);
      g.generateTexture(`${key}_pounce${i}`, frameW, frameH);
      g.destroy();
    }

    // Dash frame (1)
    const gd = this.add.graphics();
    this.drawCatDash(gd, bodyColor, earColor, earInnerColor, eyeColor);
    gd.generateTexture(`${key}_dash`, frameW, frameH);
    gd.destroy();
  }

  createPlaceholderTextures() {
    // Whiskers - orange tabby cat (4 frames: idle + 3 walk)
    this.generateCatFrames('cat_whiskers', 0xff8c42, 0xff6b1a, 0xffb3b3, 0x2d5a1e);

    // Luna - black cat (4 frames: idle + 3 walk)
    this.generateCatFrames('cat_luna', 0x222222, 0x111111, 0x663366, 0x44ff44);

    // Boots - tuxedo cat (black & white)
    this.generateCatFrames('cat_boots', 0x1a1a1a, 0x000000, 0xffaaaa, 0x4488ff);

    // Cleo - siamese cat (cream with dark points)
    this.generateCatFrames('cat_cleo', 0xf5deb3, 0x8B6914, 0xffcccc, 0x2266cc);

    // Mochi - fat calico cat (white/orange/brown patches)
    this.generateCatFrames('cat_mochi', 0xeeeeee, 0xdddddd, 0xffbbbb, 0x44aa44);

    // Generate special move frames for all cats
    this.generateSpecialFrames('cat_whiskers', 0xff8c42, 0xff6b1a, 0xffb3b3, 0x2d5a1e);
    this.generateSpecialFrames('cat_luna', 0x222222, 0x111111, 0x663366, 0x44ff44);
    this.generateSpecialFrames('cat_boots', 0x1a1a1a, 0x000000, 0xffaaaa, 0x4488ff);
    this.generateSpecialFrames('cat_cleo', 0xf5deb3, 0x8B6914, 0xffcccc, 0x2266cc);
    this.generateSpecialFrames('cat_mochi', 0xeeeeee, 0xdddddd, 0xffbbbb, 0x44aa44);

    // Boots sprint frames (3)
    const fw = 48, fh = 40;
    for (let i = 0; i < 3; i++) {
      const g = this.add.graphics();
      this.drawCatSprint(g, 0x1a1a1a, 0x000000, 0xffaaaa, 0x4488ff, i);
      g.generateTexture(`cat_boots_sprint${i}`, fw, fh);
      g.destroy();
    }

    // Cleo climb frames (2)
    for (let i = 0; i < 2; i++) {
      const g = this.add.graphics();
      this.drawCatClimb(g, 0xf5deb3, 0x8B6914, 0xffcccc, 0x2266cc, i);
      g.generateTexture(`cat_cleo_climb${i}`, fw, fh);
      g.destroy();
    }

    // Mochi bounce frames (2): squish + airborne
    for (let i = 0; i < 2; i++) {
      const g = this.add.graphics();
      this.drawCatBounce(g, 0xeeeeee, 0xdddddd, 0xffbbbb, 0x44aa44, i);
      g.generateTexture(`cat_mochi_bounce${i}`, fw, fh);
      g.destroy();
    }

    // Luna night vision frame
    const gnv = this.add.graphics();
    this.drawCatNightVision(gnv, 0x222222, 0x111111, 0x663366, 0x44ff44);
    gnv.generateTexture('cat_luna_nightvision', fw, fh);
    gnv.destroy();

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
    this.anims.create({
      key: 'boots_idle',
      frames: [{ key: 'cat_boots_f0' }],
      frameRate: 1,
    });
    this.anims.create({
      key: 'boots_walk',
      frames: [
        { key: 'cat_boots_f1' },
        { key: 'cat_boots_f2' },
        { key: 'cat_boots_f3' },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: 'cleo_idle',
      frames: [{ key: 'cat_cleo_f0' }],
      frameRate: 1,
    });
    this.anims.create({
      key: 'cleo_walk',
      frames: [
        { key: 'cat_cleo_f1' },
        { key: 'cat_cleo_f2' },
        { key: 'cat_cleo_f3' },
      ],
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: 'mochi_idle',
      frames: [{ key: 'cat_mochi_f0' }],
      frameRate: 1,
    });
    this.anims.create({
      key: 'mochi_walk',
      frames: [
        { key: 'cat_mochi_f1' },
        { key: 'cat_mochi_f2' },
        { key: 'cat_mochi_f3' },
      ],
      frameRate: 8,
      repeat: -1,
    });

    // ---- SPECIAL MOVE ANIMATIONS ----

    // Pounce animations for all cats (crouch -> lunge)
    const catNames = ['whiskers', 'luna', 'boots', 'cleo', 'mochi'];
    catNames.forEach(name => {
      this.anims.create({
        key: `${name}_pounce`,
        frames: [
          { key: `cat_${name}_pounce0` },
          { key: `cat_${name}_pounce1` },
        ],
        frameRate: 10,
        repeat: 0,
      });

      this.anims.create({
        key: `${name}_dash`,
        frames: [{ key: `cat_${name}_dash` }],
        frameRate: 1,
        repeat: 0,
      });
    });

    // Boots super sprint animation (3 frames, fast loop)
    this.anims.create({
      key: 'boots_sprint',
      frames: [
        { key: 'cat_boots_sprint0' },
        { key: 'cat_boots_sprint1' },
        { key: 'cat_boots_sprint2' },
      ],
      frameRate: 14,
      repeat: -1,
    });

    // Cleo wall climb animation (2 frames alternating)
    this.anims.create({
      key: 'cleo_climb',
      frames: [
        { key: 'cat_cleo_climb0' },
        { key: 'cat_cleo_climb1' },
      ],
      frameRate: 6,
      repeat: -1,
    });

    // Mochi belly bounce animation (squish -> airborne)
    this.anims.create({
      key: 'mochi_bounce',
      frames: [
        { key: 'cat_mochi_bounce0' },
        { key: 'cat_mochi_bounce1' },
      ],
      frameRate: 4,
      repeat: 0,
    });

    // Luna night vision animation (glowing eyes idle)
    this.anims.create({
      key: 'luna_nightvision',
      frames: [{ key: 'cat_luna_nightvision' }],
      frameRate: 1,
      repeat: 0,
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

    // ---- ZONE 3: Tuna Bay Docks textures ----

    // Dock platform (wooden planks)
    const dockPlatform = this.add.graphics();
    dockPlatform.fillStyle(0x8B6914);
    dockPlatform.fillRect(0, 0, 32, 32);
    dockPlatform.fillStyle(0x9B7924);
    dockPlatform.fillRect(0, 0, 32, 6);
    dockPlatform.lineStyle(1, 0x6B4914, 0.6);
    dockPlatform.lineBetween(0, 8, 32, 8);
    dockPlatform.lineBetween(0, 16, 32, 16);
    dockPlatform.lineBetween(0, 24, 32, 24);
    dockPlatform.fillStyle(0x5a3a0a, 0.3);
    dockPlatform.fillRect(6, 2, 2, 4);
    dockPlatform.fillRect(22, 10, 2, 4);
    dockPlatform.generateTexture('dock_platform', 32, 32);
    dockPlatform.destroy();

    // Dock ground (dark wet wood)
    const dockGround = this.add.graphics();
    dockGround.fillStyle(0x5a3a1a);
    dockGround.fillRect(0, 0, 32, 32);
    dockGround.fillStyle(0x4a2a0a, 0.5);
    dockGround.fillRect(3, 5, 6, 3);
    dockGround.fillRect(14, 18, 5, 4);
    dockGround.fillRect(24, 8, 4, 3);
    dockGround.generateTexture('dock_ground', 32, 32);
    dockGround.destroy();

    // Seagull
    const seagull = this.add.graphics();
    seagull.fillStyle(0xffffff);
    seagull.fillCircle(14, 12, 6);
    seagull.fillCircle(8, 10, 4);
    seagull.fillStyle(0xdddddd);
    seagull.fillTriangle(8, 6, 20, 2, 24, 12);
    seagull.fillTriangle(10, 6, 22, 0, 28, 8);
    seagull.fillStyle(0xffaa00);
    seagull.fillTriangle(3, 10, 8, 9, 8, 11);
    seagull.fillStyle(0x111111);
    seagull.fillCircle(7, 9, 1.5);
    seagull.generateTexture('seagull', 30, 18);
    seagull.destroy();

    // Crab
    const crab = this.add.graphics();
    crab.fillStyle(0xcc4422);
    crab.fillRoundedRect(6, 10, 20, 12, 4);
    crab.fillStyle(0xdd5533);
    crab.fillCircle(16, 10, 8);
    crab.fillStyle(0x000000);
    crab.fillCircle(13, 8, 1.5);
    crab.fillCircle(19, 8, 1.5);
    crab.fillStyle(0xcc4422);
    crab.fillCircle(4, 8, 4);
    crab.fillCircle(28, 8, 4);
    crab.fillStyle(0xaa3311);
    crab.fillCircle(3, 6, 2);
    crab.fillCircle(29, 6, 2);
    crab.fillStyle(0xcc4422);
    crab.fillRect(8, 20, 3, 4);
    crab.fillRect(14, 20, 3, 4);
    crab.fillRect(20, 20, 3, 4);
    crab.generateTexture('crab', 32, 26);
    crab.destroy();

    // Buoy (floating water marker)
    const buoy = this.add.graphics();
    buoy.fillStyle(0xff4444);
    buoy.fillCircle(10, 10, 8);
    buoy.fillStyle(0xffffff);
    buoy.fillRect(4, 8, 12, 4);
    buoy.fillStyle(0xff4444);
    buoy.fillRect(8, 0, 4, 6);
    buoy.generateTexture('buoy', 20, 20);
    buoy.destroy();

    // Anchor (decoration)
    const anchor = this.add.graphics();
    anchor.fillStyle(0x555555);
    anchor.fillRect(10, 0, 4, 24);
    anchor.fillRect(4, 4, 16, 4);
    anchor.fillCircle(12, 0, 4);
    anchor.fillStyle(0x333333);
    anchor.fillCircle(12, 0, 2);
    anchor.fillCircle(4, 22, 4);
    anchor.fillCircle(20, 22, 4);
    anchor.generateTexture('anchor', 24, 28);
    anchor.destroy();

    // Water surface (wavy blue)
    const waterSurface = this.add.graphics();
    waterSurface.fillStyle(0x2266aa, 0.6);
    waterSurface.fillRect(0, 0, 32, 32);
    waterSurface.fillStyle(0x3388cc, 0.4);
    waterSurface.fillRect(0, 0, 32, 4);
    waterSurface.fillStyle(0xffffff, 0.2);
    waterSurface.fillRect(4, 0, 8, 2);
    waterSurface.fillRect(18, 2, 10, 2);
    waterSurface.generateTexture('water_surface', 32, 32);
    waterSurface.destroy();

    // ---- ZONE 4: Catnip Canyon textures ----

    // Canyon platform (red/brown rock)
    const canyonPlatform = this.add.graphics();
    canyonPlatform.fillStyle(0x8B4513);
    canyonPlatform.fillRect(0, 0, 32, 32);
    canyonPlatform.fillStyle(0xA0522D);
    canyonPlatform.fillRect(0, 0, 32, 6);
    canyonPlatform.fillStyle(0x6B3410, 0.4);
    canyonPlatform.fillRect(5, 10, 4, 4);
    canyonPlatform.fillRect(20, 16, 6, 3);
    canyonPlatform.fillRect(12, 22, 3, 5);
    canyonPlatform.generateTexture('canyon_platform', 32, 32);
    canyonPlatform.destroy();

    // Canyon ground
    const canyonGround = this.add.graphics();
    canyonGround.fillStyle(0x6B3410);
    canyonGround.fillRect(0, 0, 32, 32);
    canyonGround.fillStyle(0x5a2a08, 0.5);
    canyonGround.fillRect(4, 8, 5, 4);
    canyonGround.fillRect(18, 20, 6, 3);
    canyonGround.fillRect(10, 4, 3, 5);
    canyonGround.generateTexture('canyon_ground', 32, 32);
    canyonGround.destroy();

    // Hawk
    const hawk = this.add.graphics();
    hawk.fillStyle(0x663311);
    hawk.fillCircle(16, 12, 6);
    hawk.fillCircle(10, 10, 4);
    hawk.fillStyle(0x884422);
    hawk.fillTriangle(8, 6, 22, 0, 28, 12);
    hawk.fillTriangle(10, 6, 24, 2, 30, 10);
    hawk.fillStyle(0xffcc00);
    hawk.fillTriangle(4, 10, 9, 9, 9, 11);
    hawk.fillStyle(0xffff00);
    hawk.fillCircle(8, 9, 1.5);
    hawk.fillStyle(0x000000);
    hawk.fillCircle(8, 9, 0.8);
    hawk.generateTexture('hawk', 32, 18);
    hawk.destroy();

    // Snake
    const snake = this.add.graphics();
    snake.fillStyle(0x228833);
    snake.fillRoundedRect(0, 10, 28, 8, 4);
    snake.fillStyle(0x33aa44);
    snake.fillCircle(4, 12, 5);
    snake.fillStyle(0xff0000);
    snake.fillTriangle(0, 11, 0, 13, -3, 12);
    snake.fillStyle(0xffff00);
    snake.fillCircle(3, 10, 1.5);
    snake.fillCircle(6, 10, 1.5);
    snake.fillStyle(0x000000);
    snake.fillCircle(3, 10, 0.7);
    snake.fillCircle(6, 10, 0.7);
    snake.fillStyle(0x116622, 0.5);
    snake.fillRect(12, 10, 3, 8);
    snake.fillRect(20, 10, 3, 8);
    snake.generateTexture('snake', 30, 22);
    snake.destroy();

    // Vine (for Cleo rescue puzzle)
    const vine = this.add.graphics();
    vine.fillStyle(0x226622);
    vine.fillRect(4, 0, 6, 48);
    vine.fillStyle(0x33aa33);
    vine.fillCircle(7, 10, 6);
    vine.fillCircle(7, 28, 5);
    vine.fillCircle(7, 42, 4);
    vine.fillStyle(0x44cc44, 0.6);
    vine.fillCircle(3, 16, 4);
    vine.fillCircle(11, 34, 4);
    vine.generateTexture('vine', 14, 48);
    vine.destroy();

    // Cactus (decoration)
    const cactus = this.add.graphics();
    cactus.fillStyle(0x228833);
    cactus.fillRoundedRect(8, 6, 8, 26, 3);
    cactus.fillRoundedRect(0, 12, 8, 6, 3);
    cactus.fillRoundedRect(16, 16, 8, 6, 3);
    cactus.fillRect(6, 8, 2, 6);
    cactus.fillRect(16, 12, 2, 6);
    cactus.fillStyle(0xff4488);
    cactus.fillCircle(12, 6, 2);
    cactus.generateTexture('cactus', 24, 32);
    cactus.destroy();

    // ---- ZONE 5: Yarn Factory textures ----

    // Factory platform (metal grating)
    const factoryPlatform = this.add.graphics();
    factoryPlatform.fillStyle(0x555555);
    factoryPlatform.fillRect(0, 0, 32, 32);
    factoryPlatform.fillStyle(0x666666);
    factoryPlatform.fillRect(0, 0, 32, 6);
    factoryPlatform.lineStyle(1, 0x444444, 0.5);
    factoryPlatform.lineBetween(0, 10, 32, 10);
    factoryPlatform.lineBetween(0, 18, 32, 18);
    factoryPlatform.lineBetween(0, 26, 32, 26);
    factoryPlatform.lineBetween(8, 0, 8, 32);
    factoryPlatform.lineBetween(16, 0, 16, 32);
    factoryPlatform.lineBetween(24, 0, 24, 32);
    factoryPlatform.generateTexture('factory_platform', 32, 32);
    factoryPlatform.destroy();

    // Factory ground (dark metal floor)
    const factoryGround = this.add.graphics();
    factoryGround.fillStyle(0x3a3a3a);
    factoryGround.fillRect(0, 0, 32, 32);
    factoryGround.fillStyle(0x2a2a2a, 0.5);
    factoryGround.fillRect(4, 8, 6, 3);
    factoryGround.fillRect(18, 20, 5, 4);
    factoryGround.fillStyle(0x444444, 0.3);
    factoryGround.fillRect(0, 0, 32, 2);
    factoryGround.generateTexture('factory_ground', 32, 32);
    factoryGround.destroy();

    // Yarn ball
    const yarnBall = this.add.graphics();
    yarnBall.fillStyle(0xff4488);
    yarnBall.fillCircle(12, 12, 10);
    yarnBall.fillStyle(0xff66aa, 0.6);
    yarnBall.fillCircle(8, 8, 4);
    yarnBall.lineStyle(1, 0xcc2266, 0.5);
    yarnBall.lineBetween(4, 10, 18, 6);
    yarnBall.lineBetween(6, 16, 20, 12);
    yarnBall.lineBetween(10, 4, 14, 18);
    yarnBall.generateTexture('yarn_ball', 24, 24);
    yarnBall.destroy();

    // Factory rat
    const factoryRat = this.add.graphics();
    factoryRat.fillStyle(0x666655);
    factoryRat.fillRoundedRect(4, 10, 18, 10, 3);
    factoryRat.fillCircle(6, 10, 6);
    factoryRat.fillStyle(0x888877);
    factoryRat.fillCircle(3, 7, 3);
    factoryRat.fillCircle(9, 7, 3);
    factoryRat.fillStyle(0xff8888);
    factoryRat.fillCircle(3, 7, 1.5);
    factoryRat.fillCircle(9, 7, 1.5);
    factoryRat.fillStyle(0x000000);
    factoryRat.fillCircle(4, 10, 1.5);
    factoryRat.fillCircle(8, 10, 1.5);
    factoryRat.fillStyle(0xff9999);
    factoryRat.fillTriangle(1, 11, 4, 10, 4, 12);
    factoryRat.fillStyle(0xccbbaa);
    factoryRat.lineBetween(20, 14, 28, 10);
    factoryRat.lineBetween(28, 10, 30, 12);
    factoryRat.generateTexture('factory_rat', 32, 24);
    factoryRat.destroy();

    // Mechanical spider
    const mechSpider = this.add.graphics();
    mechSpider.fillStyle(0x444444);
    mechSpider.fillCircle(12, 10, 7);
    mechSpider.fillStyle(0xff0000);
    mechSpider.fillCircle(9, 8, 2);
    mechSpider.fillCircle(15, 8, 2);
    mechSpider.fillStyle(0x333333);
    mechSpider.lineStyle(2, 0x555555);
    mechSpider.lineBetween(5, 10, 0, 4);
    mechSpider.lineBetween(5, 12, 0, 18);
    mechSpider.lineBetween(19, 10, 24, 4);
    mechSpider.lineBetween(19, 12, 24, 18);
    mechSpider.lineBetween(7, 14, 2, 20);
    mechSpider.lineBetween(17, 14, 22, 20);
    mechSpider.generateTexture('mech_spider', 26, 22);
    mechSpider.destroy();

    // Switch (factory puzzle)
    const sw = this.add.graphics();
    sw.fillStyle(0x888888);
    sw.fillRect(4, 4, 16, 20);
    sw.fillStyle(0xff4444);
    sw.fillCircle(12, 10, 5);
    sw.fillStyle(0x666666);
    sw.fillRect(8, 16, 8, 6);
    sw.lineStyle(2, 0xaaaaaa);
    sw.strokeRect(4, 4, 16, 20);
    sw.generateTexture('switch_off', 24, 28);
    sw.destroy();

    const swOn = this.add.graphics();
    swOn.fillStyle(0x888888);
    swOn.fillRect(4, 4, 16, 20);
    swOn.fillStyle(0x44ff44);
    swOn.fillCircle(12, 10, 5);
    swOn.fillStyle(0x666666);
    swOn.fillRect(8, 16, 8, 6);
    swOn.lineStyle(2, 0xaaaaaa);
    swOn.strokeRect(4, 4, 16, 20);
    swOn.generateTexture('switch_on', 24, 28);
    swOn.destroy();

    // Conveyor belt arrow (visual indicator)
    const convArrow = this.add.graphics();
    convArrow.fillStyle(0xffaa00, 0.5);
    convArrow.fillTriangle(0, 8, 16, 0, 16, 16);
    convArrow.generateTexture('conv_arrow', 16, 16);
    convArrow.destroy();

    // ---- ZONE 6: Snowpaw Summit textures ----

    // Snow platform
    const snowPlatform = this.add.graphics();
    snowPlatform.fillStyle(0x8899aa);
    snowPlatform.fillRect(0, 0, 32, 32);
    snowPlatform.fillStyle(0xeeeeff);
    snowPlatform.fillRect(0, 0, 32, 8);
    snowPlatform.fillStyle(0xffffff, 0.6);
    snowPlatform.fillCircle(5, 3, 4);
    snowPlatform.fillCircle(16, 2, 5);
    snowPlatform.fillCircle(27, 4, 4);
    snowPlatform.fillStyle(0x7788aa, 0.3);
    snowPlatform.fillRect(4, 14, 3, 4);
    snowPlatform.fillRect(20, 18, 4, 3);
    snowPlatform.generateTexture('snow_platform', 32, 32);
    snowPlatform.destroy();

    // Snow ground
    const snowGround = this.add.graphics();
    snowGround.fillStyle(0x667788);
    snowGround.fillRect(0, 0, 32, 32);
    snowGround.fillStyle(0x556677, 0.5);
    snowGround.fillRect(4, 6, 5, 4);
    snowGround.fillRect(18, 18, 6, 3);
    snowGround.fillRect(10, 24, 4, 4);
    snowGround.generateTexture('snow_ground', 32, 32);
    snowGround.destroy();

    // Snow fox
    const snowFox = this.add.graphics();
    snowFox.fillStyle(0xddddee);
    snowFox.fillRoundedRect(4, 10, 20, 12, 4);
    snowFox.fillCircle(8, 10, 7);
    snowFox.fillStyle(0xccccdd);
    snowFox.fillTriangle(2, 6, 5, 0, 8, 6);
    snowFox.fillTriangle(8, 6, 11, 0, 14, 6);
    snowFox.fillStyle(0xffbbbb);
    snowFox.fillTriangle(3, 6, 5, 2, 7, 6);
    snowFox.fillTriangle(9, 6, 11, 2, 13, 6);
    snowFox.fillStyle(0x2244aa);
    snowFox.fillCircle(5, 10, 2);
    snowFox.fillCircle(11, 10, 2);
    snowFox.fillStyle(0x000000);
    snowFox.fillCircle(8, 13, 1.5);
    snowFox.fillStyle(0xddddee);
    snowFox.fillRoundedRect(22, 8, 10, 4, 2);
    snowFox.fillStyle(0xccccdd);
    snowFox.fillCircle(30, 10, 3);
    snowFox.generateTexture('snow_fox', 34, 24);
    snowFox.destroy();

    // Ice bat
    const iceBat = this.add.graphics();
    iceBat.fillStyle(0x6688cc);
    iceBat.fillCircle(12, 10, 5);
    iceBat.fillStyle(0x88aadd);
    iceBat.fillTriangle(7, 8, 0, 2, 4, 14);
    iceBat.fillTriangle(17, 8, 24, 2, 20, 14);
    iceBat.fillStyle(0xff4444);
    iceBat.fillCircle(10, 9, 1.5);
    iceBat.fillCircle(14, 9, 1.5);
    iceBat.generateTexture('ice_bat', 26, 18);
    iceBat.destroy();

    // Snowflake
    const snowflake = this.add.graphics();
    snowflake.fillStyle(0xffffff, 0.7);
    snowflake.fillCircle(4, 4, 3);
    snowflake.fillStyle(0xeeeeff, 0.5);
    snowflake.fillCircle(4, 4, 1);
    snowflake.generateTexture('snowflake', 8, 8);
    snowflake.destroy();

    // Pine tree
    const pine = this.add.graphics();
    pine.fillStyle(0x3a2a1a);
    pine.fillRect(10, 30, 6, 16);
    pine.fillStyle(0x225533);
    pine.fillTriangle(0, 35, 13, 8, 26, 35);
    pine.fillStyle(0x336644);
    pine.fillTriangle(3, 28, 13, 4, 23, 28);
    pine.fillStyle(0x447755);
    pine.fillTriangle(5, 20, 13, 0, 21, 20);
    pine.fillStyle(0xeeeeff, 0.4);
    pine.fillTriangle(5, 20, 13, 0, 21, 20);
    pine.generateTexture('pine_tree', 26, 46);
    pine.destroy();

    // ---- ZONE 7: Dog King's Fortress textures ----

    // Fortress platform (dark stone bricks)
    const fortPlatform = this.add.graphics();
    fortPlatform.fillStyle(0x444444);
    fortPlatform.fillRect(0, 0, 32, 32);
    fortPlatform.fillStyle(0x555555);
    fortPlatform.fillRect(0, 0, 32, 6);
    fortPlatform.lineStyle(1, 0x333333, 0.6);
    fortPlatform.lineBetween(0, 10, 32, 10);
    fortPlatform.lineBetween(0, 20, 32, 20);
    fortPlatform.lineBetween(16, 0, 16, 10);
    fortPlatform.lineBetween(8, 10, 8, 20);
    fortPlatform.lineBetween(24, 10, 24, 20);
    fortPlatform.lineBetween(12, 20, 12, 32);
    fortPlatform.generateTexture('fortress_platform', 32, 32);
    fortPlatform.destroy();

    // Fortress ground (dark cobblestone)
    const fortGround = this.add.graphics();
    fortGround.fillStyle(0x2a2a2a);
    fortGround.fillRect(0, 0, 32, 32);
    fortGround.fillStyle(0x333333, 0.5);
    fortGround.fillRect(2, 4, 6, 5);
    fortGround.fillRect(12, 14, 8, 5);
    fortGround.fillRect(22, 6, 5, 6);
    fortGround.lineStyle(1, 0x1a1a1a, 0.3);
    fortGround.lineBetween(0, 8, 32, 8);
    fortGround.lineBetween(0, 20, 32, 20);
    fortGround.generateTexture('fortress_ground', 32, 32);
    fortGround.destroy();

    // Fortress guard (armored dog)
    const guard = this.add.graphics();
    guard.fillStyle(0x666666);
    guard.fillRoundedRect(4, 8, 22, 18, 4);
    guard.fillStyle(0x888888);
    guard.fillCircle(12, 8, 8);
    guard.fillStyle(0x555555);
    guard.fillRoundedRect(2, 4, 18, 8, 3);
    guard.fillStyle(0xccaa44);
    guard.fillCircle(8, 10, 2);
    guard.fillCircle(16, 10, 2);
    guard.fillStyle(0x000000);
    guard.fillCircle(8, 10, 1);
    guard.fillCircle(16, 10, 1);
    guard.fillStyle(0x444444);
    guard.fillTriangle(10, 13, 14, 13, 12, 16);
    guard.fillStyle(0x666666);
    guard.fillRect(6, 24, 5, 8);
    guard.fillRect(18, 24, 5, 8);
    guard.generateTexture('fortress_guard', 28, 34);
    guard.destroy();

    // Fortress bat
    const fortBat = this.add.graphics();
    fortBat.fillStyle(0x333333);
    fortBat.fillCircle(12, 10, 5);
    fortBat.fillStyle(0x444444);
    fortBat.fillTriangle(7, 8, 0, 2, 4, 14);
    fortBat.fillTriangle(17, 8, 24, 2, 20, 14);
    fortBat.fillStyle(0xff2222);
    fortBat.fillCircle(10, 9, 1.5);
    fortBat.fillCircle(14, 9, 1.5);
    fortBat.generateTexture('fortress_bat', 26, 18);
    fortBat.destroy();

    // King Biscuit (tiny chihuahua with oversized crown)
    const biscuit = this.add.graphics();
    // Body (tiny)
    biscuit.fillStyle(0xddbb88);
    biscuit.fillRoundedRect(8, 18, 16, 12, 4);
    // Head (round, big eyes)
    biscuit.fillStyle(0xddbb88);
    biscuit.fillCircle(16, 16, 10);
    // Big chihuahua ears
    biscuit.fillStyle(0xccaa77);
    biscuit.fillTriangle(6, 12, 10, 4, 14, 12);
    biscuit.fillTriangle(18, 12, 22, 4, 26, 12);
    biscuit.fillStyle(0xffccaa);
    biscuit.fillTriangle(8, 12, 10, 6, 12, 12);
    biscuit.fillTriangle(20, 12, 22, 6, 24, 12);
    // Eyes (big, watery)
    biscuit.fillStyle(0x442200);
    biscuit.fillCircle(13, 16, 3);
    biscuit.fillCircle(19, 16, 3);
    biscuit.fillStyle(0xffffff);
    biscuit.fillCircle(12, 15, 1.5);
    biscuit.fillCircle(18, 15, 1.5);
    // Nose
    biscuit.fillStyle(0x000000);
    biscuit.fillCircle(16, 19, 1.5);
    // Tiny legs
    biscuit.fillStyle(0xddbb88);
    biscuit.fillRect(10, 28, 4, 5);
    biscuit.fillRect(18, 28, 4, 5);
    // Oversized crown (sliding over eyes)
    biscuit.fillStyle(0xffd700);
    biscuit.fillRect(6, 4, 20, 8);
    biscuit.fillStyle(0xffee44);
    biscuit.fillTriangle(6, 4, 10, 0, 14, 4);
    biscuit.fillTriangle(14, 4, 18, 0, 22, 4);
    biscuit.fillTriangle(22, 4, 26, 0, 26, 4);
    // Crown jewels
    biscuit.fillStyle(0xff4444);
    biscuit.fillCircle(10, 6, 2);
    biscuit.fillStyle(0x4444ff);
    biscuit.fillCircle(16, 6, 2);
    biscuit.fillStyle(0x44ff44);
    biscuit.fillCircle(22, 6, 2);
    biscuit.generateTexture('king_biscuit', 32, 34);
    biscuit.destroy();

    // Torch (fortress decoration)
    const torch = this.add.graphics();
    torch.fillStyle(0x6B4914);
    torch.fillRect(4, 10, 4, 14);
    torch.fillStyle(0xff6600);
    torch.fillCircle(6, 8, 5);
    torch.fillStyle(0xffaa00, 0.7);
    torch.fillCircle(6, 6, 3);
    torch.fillStyle(0xffff00, 0.5);
    torch.fillCircle(6, 5, 2);
    torch.generateTexture('torch', 12, 24);
    torch.destroy();
  }
}
