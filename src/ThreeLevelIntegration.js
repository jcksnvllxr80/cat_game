/**
 * ThreeLevelIntegration.js — Connects a Phaser level scene to the Three.js renderer.
 * 
 * Architecture: Phaser sprites stay visible (animated 2D art). Three.js ONLY renders
 * the environment (ground, platforms, sky, mountains). The Z-axis (depth) is shown
 * via sprite scale/depth-sort and affects collision detection.
 * 
 * Call setupThreeLevel() in create() and updateThreeLevel() in update().
 */

const Z_SPEED = 60;         // Depth movement speed in Phaser pixels/sec (subtle)
const Z_RANGE_PX = 48;      // Half-width of walkable Z range in Phaser pixels (±48)
const Z_HIT_RANGE = 20;     // Max Z distance for enemy-player collision to register
const ENEMY_Z_SPEED = 25;   // How fast enemies wander in Z
const ENEMY_Z_RANGE = 40;   // Half-range enemies wander in Z
const Y_DEPTH_OFFSET = 30;  // Max Y displacement in pixels for depth movement

/**
 * Set up the Three.js 3D world for a level scene.
 * Call this at the end of create().
 */
export function setupThreeLevel(scene, {
  biome,
  worldWidth,
  worldHeight,
  platformKey,
  groundKey,
  pitGaps = [],
  enemyColor = 0x8B4513,
}) {
  const renderer = window.__threeRenderer;
  if (!renderer) return;

  // Clear previous level
  renderer.clearLevel();

  // Set biome colors/lighting
  renderer.setBiome(biome);

  // Build 3D background (sky, mountains, hills)
  renderer.buildBackground(worldWidth, worldHeight, pitGaps);

  // Build 3D platforms and ground
  renderer.buildPlatforms(scene.platforms, worldWidth, worldHeight, platformKey, groundKey, pitGaps);

  // Build 3D crates
  if (scene.crates) {
    renderer.buildCrates(scene.crates, worldHeight);
  }

  // Store world dimensions for update syncing
  scene._threeWorldWidth = worldWidth;
  scene._threeWorldHeight = worldHeight;

  // ---- 2.5D depth movement setup ----
  if (scene.player) {
    scene.player.zPos = 0;
    scene.player._baseScale = scene.player.scaleX || 1.5;
  }

  // Register W/S and UP/DOWN keys for depth movement
  scene._depthKeys = {
    up: scene.input.keyboard.addKey('W'),
    down: scene.input.keyboard.addKey('S'),
    arrowUp: scene.input.keyboard.addKey('UP'),
    arrowDown: scene.input.keyboard.addKey('DOWN'),
  };

  // Initialize enemies with Z positions for 2.5D patrol
  if (scene.enemies) {
    scene.enemies.children.each(enemy => {
      enemy.zPos = (Math.random() - 0.5) * ENEMY_Z_RANGE;
      enemy.zDir = Math.random() > 0.5 ? 1 : -1;
      enemy._baseScale = enemy.scaleX || 1.3;
    });
  }

  // Give collectibles their own random Z positions
  ['tunas', 'waters', 'mapPieces', 'pendants'].forEach(groupName => {
    if (scene[groupName]) {
      scene[groupName].children.each(item => {
        item.zPos = (Math.random() - 0.5) * Z_RANGE_PX * 0.8;
        item._baseScale = item.scaleX || 1;
      });
    }
  });

  // Give NPCs random Z positions
  if (scene.npcs) {
    scene.npcs.children.each(npc => {
      npc.zPos = (Math.random() - 0.5) * Z_RANGE_PX * 0.5;
      npc._baseScale = npc.scaleX || 1;
    });
  }

  // Hide ONLY platform tiles and Graphics backgrounds — keep sprites visible
  hidePhaserEnvironment(scene);
}

/**
 * Hide Phaser's environment rendering (platforms, ground tiles, background Graphics).
 * Keeps player, companions, enemies, NPCs, and collectibles VISIBLE as animated sprites.
 */
function hidePhaserEnvironment(scene) {
  // Three.js canvas is transparent and behind Phaser, so Phaser backgrounds show through.
  // Keep ALL Phaser elements visible — platforms, crates, backgrounds.
  // The 2.5D effect comes from depth movement + scale/alpha cues, not 3D rendering.
}

/**
 * Check Z-axis proximity for collision filtering.
 * Returns true if two objects are close enough in depth to interact.
 */
export function checkZProximity(a, b, range = Z_HIT_RANGE) {
  const az = a.zPos || 0;
  const bz = b.zPos || 0;
  return Math.abs(az - bz) <= range;
}

/**
 * Sync Phaser game state to Three.js each frame.
 * Call this at the end of update().
 */
export function updateThreeLevel(scene) {
  const renderer = window.__threeRenderer;
  if (!renderer) return;

  const wh = scene._threeWorldHeight || 576;
  const dt = scene.game.loop.delta / 1000;

  // ---- Process depth movement (W/S or UP/DOWN arrows) ----
  if (scene.player?.active && scene._depthKeys) {
    const dk = scene._depthKeys;

    if (dk.up.isDown || dk.arrowUp.isDown) {
      scene.player.zPos = Math.max(-Z_RANGE_PX, scene.player.zPos - Z_SPEED * dt);
    }
    if (dk.down.isDown || dk.arrowDown.isDown) {
      scene.player.zPos = Math.min(Z_RANGE_PX, scene.player.zPos + Z_SPEED * dt);
    }
  }

  const playerZ = scene.player?.zPos || 0;

  // ---- Visual depth cues on Phaser sprites ----
  // Scale, alpha, AND Y displacement show depth.
  // Into screen (W) = smaller, transparent, higher on screen.
  // Toward camera (S) = bigger, opaque, lower on screen.

  if (scene.player?.active) {
    applyDepthVisuals(scene.player, playerZ);

    // Counteract Y displacement in camera follow so camera tracks
    // the player's ground position, not the visual offset
    const pzNorm = playerZ / Z_RANGE_PX;
    scene.cameras.main.followOffset.y = -pzNorm * Y_DEPTH_OFFSET;
  }

  if (scene.companionManager) {
    scene.companionManager.companions.forEach(c => {
      if (c.sprite?.active) {
        const cz = c.sprite.zPos || 0;
        applyDepthVisuals(c.sprite, cz);
      }
    });
  }

  // ---- Enemy Z patrol ----
  if (scene.enemies) {
    scene.enemies.children.each(enemy => {
      if (!enemy.active || enemy.getData('defeated')) return;

      // Flying enemies (crows, seagulls, etc.) don't patrol in Z
      const type = enemy.getData('type') || '';
      if (type === 'crow' || type === 'seagull' || type === 'hawk' ||
          type === 'bat' || type === 'drone') return;

      // Wander in Z
      const zDir = enemy.zDir || 1;
      enemy.zPos = (enemy.zPos || 0) + zDir * ENEMY_Z_SPEED * dt;
      if (enemy.zPos > ENEMY_Z_RANGE) { enemy.zPos = ENEMY_Z_RANGE; enemy.zDir = -1; }
      if (enemy.zPos < -ENEMY_Z_RANGE) { enemy.zPos = -ENEMY_Z_RANGE; enemy.zDir = 1; }

      // Random Z direction changes
      if (Math.random() < 0.005) enemy.zDir *= -1;

      applyDepthVisuals(enemy, enemy.zPos);
    });
  }

  // ---- Apply depth visuals to collectibles and NPCs ----
  ['tunas', 'waters', 'mapPieces', 'pendants'].forEach(groupName => {
    if (scene[groupName]) {
      scene[groupName].children.each(item => {
        if (item.active) {
          applyDepthVisuals(item, item.zPos || 0);
        }
      });
    }
  });

  if (scene.npcs) {
    scene.npcs.children.each(npc => {
      if (npc.active) {
        applyDepthVisuals(npc, npc.zPos || 0);
      }
    });
  }

  // ---- Update Three.js camera to match Phaser viewport exactly ----
  const cam = scene.cameras.main;
  renderer.updateCamera(
    cam.scrollX,
    cam.scrollY,
    scene._threeWorldWidth || 4000,
    wh
  );

  // Render the 3D scene
  renderer.render();
}

/**
 * Apply visual depth cues to a Phaser sprite based on its Z position.
 * - Scale: into screen = smaller, toward camera = bigger (±30%)
 * - Alpha: further = more transparent
 * - Y displacement: into screen (W) = sprite moves UP, toward camera (S) = DOWN
 *   Uses body.offset.y so physics stays on the ground while the sprite renders offset.
 * - Depth sort: closer to camera = rendered in front
 */
function applyDepthVisuals(sprite, zPos) {
  const baseScale = sprite._baseScale || sprite.scaleX || 1;
  const zNorm = zPos / Z_RANGE_PX; // -1 to 1

  // ±30% scale
  const scaleFactor = 1 + zNorm * 0.3;
  sprite.setScale(baseScale * scaleFactor);

  // Alpha: further away = more transparent (0.6 to 1.0 range)
  const alpha = 0.8 + zNorm * 0.2;
  sprite.setAlpha(alpha);

  // Y displacement via body.offset.y — physics body stays on ground,
  // sprite renders higher (W) or lower (S) on screen.
  // Increasing body.offset.y pushes the body DOWN relative to sprite,
  // so when physics keeps the body on the ground, the sprite renders HIGHER.
  const yDisplacement = -zNorm * Y_DEPTH_OFFSET; // W (neg Z) → positive offset → sprite UP
  if (sprite.body) {
    if (sprite._baseBodyOffsetY === undefined) {
      sprite._baseBodyOffsetY = sprite.body.offset.y;
    }
    sprite.body.offset.y = sprite._baseBodyOffsetY + yDisplacement;
  }

  // Depth sort: closer to camera (higher Z) = rendered in front
  sprite.setDepth(10 + zPos * 0.1);
}
