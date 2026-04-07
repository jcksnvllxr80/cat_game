// DepthRenderer.js — Adds 2.5D depth to platforms and ground
// Scans platform groups, clusters adjacent tiles, and draws visible
// front-face walls below them to create thick 3D block appearance.

const DEPTH_CONFIGS = {
  // Level 1 - Purrville Meadows
  platform: {
    frontColor: 0x4a2a00,
    frontAlpha: 0.95,
    bottomColor: 0x2a1500,
    edgeHighlight: 0x8B6914,
    depth: 20,
  },
  ground: {
    layers: [
      { color: 0x5a3a0a, alpha: 0.9 },
      { color: 0x4a2a00, alpha: 0.95 },
      { color: 0x3a1a00, alpha: 1.0 },
    ],
    depth: 80,
  },

  // Level 2 - Dark Woods
  forest_platform: {
    frontColor: 0x1a0a00,
    frontAlpha: 0.95,
    bottomColor: 0x0a0500,
    edgeHighlight: 0x3a2a1a,
    depth: 20,
  },
  forest_ground: {
    layers: [
      { color: 0x2a1a0a, alpha: 0.9 },
      { color: 0x1a0a00, alpha: 0.95 },
      { color: 0x0a0500, alpha: 1.0 },
    ],
    depth: 80,
  },

  // Level 3 - Tuna Bay Docks
  dock_platform: {
    frontColor: 0x5a3a0a,
    frontAlpha: 0.95,
    bottomColor: 0x3a2000,
    edgeHighlight: 0x8B6914,
    depth: 20,
  },
  dock_ground: {
    layers: [
      { color: 0x5a3a1a, alpha: 0.9 },
      { color: 0x4a2a0a, alpha: 0.95 },
      { color: 0x3a1a00, alpha: 1.0 },
    ],
    depth: 80,
  },

  // Level 4 - Catnip Canyon
  canyon_platform: {
    frontColor: 0x5a2810,
    frontAlpha: 0.95,
    bottomColor: 0x3a1808,
    edgeHighlight: 0x8B4513,
    depth: 22,
  },
  canyon_ground: {
    layers: [
      { color: 0x6B3410, alpha: 0.9 },
      { color: 0x5a2810, alpha: 0.95 },
      { color: 0x4a1808, alpha: 1.0 },
    ],
    depth: 80,
  },

  // Level 5 - Yarn Factory
  factory_platform: {
    frontColor: 0x333333,
    frontAlpha: 0.95,
    bottomColor: 0x1a1a1a,
    edgeHighlight: 0x555555,
    depth: 18,
  },
  factory_ground: {
    layers: [
      { color: 0x3a3a3a, alpha: 0.9 },
      { color: 0x2a2a2a, alpha: 0.95 },
      { color: 0x1a1a1a, alpha: 1.0 },
    ],
    depth: 80,
  },

  // Level 6 - Snowpaw Summit
  snow_platform: {
    frontColor: 0x556688,
    frontAlpha: 0.95,
    bottomColor: 0x334466,
    edgeHighlight: 0x8899bb,
    depth: 20,
  },
  snow_ground: {
    layers: [
      { color: 0x667788, alpha: 0.9 },
      { color: 0x556677, alpha: 0.95 },
      { color: 0x445566, alpha: 1.0 },
    ],
    depth: 80,
  },

  // Level 7 - Dog King's Fortress
  fortress_platform: {
    frontColor: 0x222222,
    frontAlpha: 0.95,
    bottomColor: 0x111111,
    edgeHighlight: 0x444444,
    depth: 22,
  },
  fortress_ground: {
    layers: [
      { color: 0x2a2a2a, alpha: 0.9 },
      { color: 0x1a1a1a, alpha: 0.95 },
      { color: 0x0a0a0a, alpha: 1.0 },
    ],
    depth: 80,
  },
};

/**
 * Cluster adjacent platform tiles into contiguous groups.
 * Returns array of { x, y, width } objects.
 */
function clusterPlatforms(platforms, tileSize = 32) {
  const tiles = [];
  platforms.children.entries.forEach(p => {
    if (p.active) {
      tiles.push({ x: p.x, y: p.y, w: p.displayWidth, h: p.displayHeight });
    }
  });

  // Sort by y then x
  tiles.sort((a, b) => a.y - b.y || a.x - b.x);

  const clusters = [];
  let current = null;

  for (const tile of tiles) {
    if (current && Math.abs(tile.y - current.y) < 2 && Math.abs(tile.x - (current.x + current.width)) < tileSize * 0.6) {
      // Extend current cluster
      current.width = (tile.x + tile.w / 2) - (current.x - current.clusterTiles[0].w / 2);
      current.clusterTiles.push(tile);
    } else {
      // Start new cluster
      if (current) clusters.push(current);
      current = {
        x: tile.x,
        y: tile.y,
        width: tile.w,
        height: tile.h,
        clusterTiles: [tile],
      };
    }
  }
  if (current) clusters.push(current);

  // Convert to { left, top, width, height }
  return clusters.map(c => {
    const leftTile = c.clusterTiles[0];
    const rightTile = c.clusterTiles[c.clusterTiles.length - 1];
    return {
      left: leftTile.x - leftTile.w / 2,
      top: c.y - c.height / 2,
      width: (rightTile.x + rightTile.w / 2) - (leftTile.x - leftTile.w / 2),
      height: c.height,
    };
  });
}

/**
 * Add 2.5D depth walls below floating platforms.
 */
export function addPlatformDepth(scene, platforms, textureKey) {
  const config = DEPTH_CONFIGS[textureKey];
  if (!config || !config.frontColor) return;

  const depthAmount = config.depth;
  const clusters = clusterPlatforms(platforms);

  // Filter to only floating platforms (not ground-level)
  const groundY = 576 - 48; // standard ground surface y
  const floatingClusters = clusters.filter(c => c.top < groundY - 10);

  const g = scene.add.graphics();
  g.setDepth(0); // behind player (depth 10) but in front of backgrounds

  floatingClusters.forEach(c => {
    // Main front face wall
    g.fillStyle(config.frontColor, config.frontAlpha);
    g.fillRect(c.left, c.top + c.height, c.width, depthAmount);

    // Darker bottom strip
    g.fillStyle(config.bottomColor, 1.0);
    g.fillRect(c.left, c.top + c.height + depthAmount - 4, c.width, 4);

    // Edge highlight at transition from top to front
    g.fillStyle(config.edgeHighlight, 0.4);
    g.fillRect(c.left, c.top + c.height - 1, c.width, 2);

    // Vertical edge shading (left side darker, right side slightly lighter)
    g.fillStyle(0x000000, 0.15);
    g.fillRect(c.left, c.top + c.height, 3, depthAmount);
    g.fillStyle(0xffffff, 0.05);
    g.fillRect(c.left + c.width - 2, c.top + c.height, 2, depthAmount);

    // Subtle texture lines on front face
    g.fillStyle(0x000000, 0.08);
    for (let row = 6; row < depthAmount; row += 8) {
      g.fillRect(c.left + 2, c.top + c.height + row, c.width - 4, 1);
    }
  });
}

/**
 * Add 2.5D depth to the ground — thick underground layers visible below the surface.
 */
export function addGroundDepth(scene, worldWidth, worldHeight, textureKey, pitGaps = []) {
  const config = DEPTH_CONFIGS[textureKey];
  if (!config || !config.layers) return;

  const surfaceY = worldHeight - 32; // bottom of the top platform row
  const depthAmount = config.depth;

  const g = scene.add.graphics();
  g.setDepth(0);

  // Draw depth layers, skipping pit gaps
  const layerHeight = Math.floor(depthAmount / config.layers.length);

  config.layers.forEach((layer, i) => {
    const layerY = surfaceY + i * layerHeight;
    g.fillStyle(layer.color, layer.alpha);

    // Draw in segments, respecting pit gaps
    let segStart = 0;
    const sortedGaps = [...pitGaps].sort((a, b) => a.start - b.start);

    for (const gap of sortedGaps) {
      if (segStart < gap.start) {
        g.fillRect(segStart, layerY, gap.start - segStart, layerHeight);
      }
      segStart = gap.end;
    }
    // Final segment after last gap
    if (segStart < worldWidth) {
      g.fillRect(segStart, layerY, worldWidth - segStart, layerHeight);
    }
  });

  // Add horizontal strata lines for visual detail
  g.fillStyle(0x000000, 0.1);
  for (let row = 0; row < depthAmount; row += 12) {
    let segStart = 0;
    for (const gap of pitGaps) {
      if (segStart < gap.start) {
        g.fillRect(segStart, surfaceY + row, gap.start - segStart, 1);
      }
      segStart = gap.end;
    }
    if (segStart < worldWidth) {
      g.fillRect(segStart, surfaceY + row, worldWidth - segStart, 1);
    }
  }

  // Surface top edge — bright highlight line at ground level
  const topG = scene.add.graphics();
  topG.setDepth(1);
  topG.fillStyle(config.layers[0].color, 0.5);
  let segStart = 0;
  for (const gap of pitGaps) {
    if (segStart < gap.start) {
      topG.fillRect(segStart, surfaceY - 1, gap.start - segStart, 2);
    }
    segStart = gap.end;
  }
  if (segStart < worldWidth) {
    topG.fillRect(segStart, surfaceY - 1, worldWidth - segStart, 2);
  }
}

/**
 * Convenience: add both platform and ground depth for a level.
 */
export function addLevelDepth(scene, platforms, worldWidth, worldHeight, platformKey, groundKey, pitGaps = []) {
  addPlatformDepth(scene, platforms, platformKey);
  addGroundDepth(scene, worldWidth, worldHeight, groundKey, pitGaps);
}
