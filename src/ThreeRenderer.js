/**
 * ThreeRenderer.js — Three.js 2.5D rendering layer for the cat game.
 * 
 * Renders Phaser game objects as actual 3D geometry (BoxGeometry platforms,
 * lit scene with shadows) while Phaser continues to handle physics and game logic.
 * 
 * Architecture:
 * - Three.js renders to its own canvas behind (or replacing) Phaser's
 * - Each frame, Phaser sprite positions are synced to Three.js mesh positions
 * - PerspectiveCamera with slight angle gives the 2.5D depth feel
 */

import * as THREE from 'three';

// ---- BIOME COLOR CONFIGS ----
const BIOME_COLORS = {
  // Level 1 - Purrville Meadows
  meadow: {
    platform: 0x6B8E23,    // olive green tops
    platformSide: 0x4a6a10, // darker side
    ground: 0x5a3a0a,       // brown earth
    groundTop: 0x4a8c28,    // grassy top
    groundDark: 0x3a2000,   // deep earth
    sky: [0x87CEEB, 0xE0F0FF], // sky gradient
    fog: 0xC8E6F5,
    ambient: 0xffffff,
    sunColor: 0xfff8e7,
    bgMountain: 0x6B58A0,
    bgHills: [0x4A7A30, 0x5B8C3E],
  },
  // Level 2 - Whispering Woods
  forest: {
    platform: 0x2d5a1e,
    platformSide: 0x1a3a0a,
    ground: 0x1a0a00,
    groundTop: 0x2a4a0a,
    groundDark: 0x0a0500,
    sky: [0x1a2a3a, 0x2a3a4a],
    fog: 0x1a2a1a,
    ambient: 0x8899aa,
    sunColor: 0x99aacc,
    bgMountain: 0x1a2a1a,
    bgHills: [0x1a3a0a, 0x2a4a1a],
  },
  // Level 3 - Tuna Bay Docks
  docks: {
    platform: 0x8B7355,
    platformSide: 0x5a4a30,
    ground: 0x5a3a1a,
    groundTop: 0x8B6914,
    groundDark: 0x3a2000,
    sky: [0x4a8aaa, 0xaacce0],
    fog: 0x8ab8d0,
    ambient: 0xddeeff,
    sunColor: 0xfff0d0,
    bgMountain: 0x5a6a7a,
    bgHills: [0x3a5a6a, 0x4a6a7a],
  },
  // Level 4 - Dustpaw Canyon
  canyon: {
    platform: 0xCD853F,
    platformSide: 0x8B6914,
    ground: 0x8B4513,
    groundTop: 0xCD853F,
    groundDark: 0x5a2a0a,
    sky: [0xE8A060, 0xF0C8A0],
    fog: 0xE8C8A0,
    ambient: 0xffeedd,
    sunColor: 0xffcc88,
    bgMountain: 0xAA7744,
    bgHills: [0x8B6914, 0xAA8844],
  },
  // Level 5 - Scrapyard Factory
  factory: {
    platform: 0x666666,
    platformSide: 0x444444,
    ground: 0x3a3a3a,
    groundTop: 0x555555,
    groundDark: 0x222222,
    sky: [0x444455, 0x666677],
    fog: 0x555566,
    ambient: 0xaabbcc,
    sunColor: 0xccddee,
    bgMountain: 0x3a3a4a,
    bgHills: [0x2a2a3a, 0x3a3a4a],
  },
  // Level 6 - Frostpeak Summit
  snow: {
    platform: 0xCCDDEE,
    platformSide: 0x8899AA,
    ground: 0xaabbcc,
    groundTop: 0xeeeeff,
    groundDark: 0x667788,
    sky: [0x6688AA, 0xAABBDD],
    fog: 0xBBCCDD,
    ambient: 0xddeeff,
    sunColor: 0xeef8ff,
    bgMountain: 0x8899BB,
    bgHills: [0x7788AA, 0x8899BB],
  },
  // Level 7 - Dogbone Fortress
  fortress: {
    platform: 0x555555,
    platformSide: 0x333333,
    ground: 0x2a2a2a,
    groundTop: 0x444444,
    groundDark: 0x1a1a1a,
    sky: [0x1a0a0a, 0x2a1a1a],
    fog: 0x1a1a1a,
    ambient: 0x886666,
    sunColor: 0xcc8866,
    bgMountain: 0x2a1a1a,
    bgHills: [0x1a0a0a, 0x2a1a1a],
  },
};

const PLATFORM_DEPTH = 6.0;  // Z depth of platform boxes (spans walkable depth lane)
const GROUND_DEPTH = 10.0;   // Z depth of ground boxes (wider than walkable for visual padding)
const GROUND_HEIGHT = 3.0;   // Y height of ground mass below surface
const SCALE = 1 / 32;        // Phaser pixels to Three.js units
const Z_WALKABLE = 3.0;      // Half-width of walkable Z range in Three.js units (±3)
const Z_RANGE_PX = 96;       // Half-width of walkable Z range in Phaser pixels

export class ThreeRenderer {
  constructor(containerEl, width = 1024, height = 576) {
    this.width = width;
    this.height = height;
    this.meshes = new Map(); // phaserObj -> THREE.Mesh
    this.spriteMeshes = new Map(); // phaserSprite -> THREE.Sprite/Mesh
    this.biome = 'meadow';
    this.backgroundGroup = new THREE.Group();
    this.platformGroup = new THREE.Group();
    this.entityGroup = new THREE.Group();

    // ---- Renderer ----
    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,  // transparent background so Phaser shows through
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0x000000, 0); // transparent

    this.canvas = this.renderer.domElement;
    this.canvas.id = 'three-canvas';
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.zIndex = '0';
    this.canvas.style.pointerEvents = 'none';
    containerEl.appendChild(this.canvas);

    // ---- Scene ----
    this.scene = new THREE.Scene();

    // ---- Camera ----
    // Orthographic camera synced exactly to Phaser's viewport.
    // No perspective distortion = 3D ground lines up perfectly with 2D sprites.
    const halfW = (width * SCALE) / 2;   // 16 units
    const halfH = (height * SCALE) / 2;  // 9 units
    this.camera = new THREE.OrthographicCamera(-halfW, halfW, halfH, -halfH, 0.1, 200);
    // Side-view, slightly in front so Z-depth objects have proper occlusion
    this.camera.position.set(0, 0, 50);
    this.camera.lookAt(0, 0, 0);

    // ---- Lights ----
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xfff8e7, 1.0);
    this.sunLight.position.set(8, 12, 10);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.camera.left = -20;
    this.sunLight.shadow.camera.right = 20;
    this.sunLight.shadow.camera.top = 15;
    this.sunLight.shadow.camera.bottom = -15;
    this.sunLight.shadow.camera.near = 0.1;
    this.sunLight.shadow.camera.far = 50;
    this.sunLight.shadow.bias = -0.001;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    // Hemisphere light for sky/ground color
    this.hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x4a2a00, 0.3);
    this.scene.add(this.hemiLight);

    // Add groups
    this.scene.add(this.backgroundGroup);
    this.scene.add(this.platformGroup);
    this.scene.add(this.entityGroup);
  }

  /**
   * Set the biome colors for the current level
   */
  setBiome(biomeName) {
    this.biome = biomeName;
    const colors = BIOME_COLORS[biomeName] || BIOME_COLORS.meadow;

    // Update lighting
    this.ambientLight.color.set(colors.ambient);
    this.sunLight.color.set(colors.sunColor);
    this.hemiLight.color.set(colors.sky[0]);
    this.hemiLight.groundColor.set(colors.groundDark);

    // Update fog
    this.scene.fog = new THREE.FogExp2(colors.fog, 0.008);
    this.renderer.setClearColor(0x000000, 0); // transparent so Phaser backgrounds show
  }

  /**
   * Clear all 3D objects for level transition
   */
  clearLevel() {
    this.disposeGroup(this.backgroundGroup);
    this.disposeGroup(this.platformGroup);
    this.disposeGroup(this.entityGroup);
    this.meshes.clear();
    this.spriteMeshes.clear();
  }

  disposeGroup(group) {
    while (group.children.length > 0) {
      const child = group.children[0];
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
      group.remove(child);
    }
  }

  /**
   * Build the 3D background (sky plane, mountains, ground mass)
   */
  buildBackground(worldWidth, worldHeight, pitGaps = []) {
    // With ortho side-view, Phaser's parallax backgrounds show through.
    // Three.js only renders ground/platforms. Skip sky/mountains.
  }

  buildMountains(worldW, colors) {
    const mountainGeo = new THREE.BufferGeometry();
    const verts = [];
    const numPeaks = Math.floor(worldW / 6) + 3;
    const mz = -Z_WALKABLE - 10; // behind the ground plane

    for (let i = 0; i < numPeaks; i++) {
      const cx = (i / numPeaks) * worldW - 2;
      const h = 3 + Math.random() * 4;
      const halfW = 2 + Math.random() * 2;
      verts.push(cx - halfW, -2, mz);
      verts.push(cx + halfW, -2, mz);
      verts.push(cx, -2 + h, mz);
    }

    mountainGeo.setAttribute('position',
      new THREE.Float32BufferAttribute(verts, 3));
    mountainGeo.computeVertexNormals();

    const mountainMat = new THREE.MeshBasicMaterial({
      color: colors.bgMountain,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
    const mountains = new THREE.Mesh(mountainGeo, mountainMat);
    this.backgroundGroup.add(mountains);
  }

  buildHills(worldW, colors) {
    // Use a sine-wave extruded shape for rolling hills
    const shape = new THREE.Shape();
    const segments = 200;
    shape.moveTo(0, -3);
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * worldW;
      const h = Math.sin(x * 0.5) * 0.8 + Math.sin(x * 1.2) * 0.4 + 1;
      shape.lineTo(x, -3 + h);
    }
    shape.lineTo(worldW, -3);
    shape.lineTo(0, -3);

    const extrudeSettings = {
      steps: 1,
      depth: 1.5,
      bevelEnabled: false,
    };

    const hillGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const hillMat = new THREE.MeshLambertMaterial({
      color: colors.bgHills[0],
      transparent: true,
      opacity: 0.5,
    });
    const hills = new THREE.Mesh(hillGeo, hillMat);
    hills.position.set(0, 0, -Z_WALKABLE - 6);
    this.backgroundGroup.add(hills);
  }

  /**
   * Build 3D platforms from Phaser platform data.
   * Each platform tile becomes a 3D box with depth.
   */
  buildPlatforms(phaserPlatformGroup, worldWidth, worldHeight, platformKey, groundKey, pitGaps = []) {
    const colors = BIOME_COLORS[this.biome] || BIOME_COLORS.meadow;

    // Separate platforms into floating vs ground tiles
    const groundY = worldHeight - 16;
    const groundFillY = worldHeight - 48;

    // Cluster adjacent tiles for cleaner geometry
    const floatingTiles = [];
    const groundTiles = [];

    phaserPlatformGroup.children.each(tile => {
      if (!tile.active) return;
      const isGround = tile.y >= groundFillY - 2;
      if (isGround) {
        groundTiles.push({ x: tile.x, y: tile.y, key: tile.texture?.key });
      } else {
        floatingTiles.push({ x: tile.x, y: tile.y, key: tile.texture?.key });
      }
    });

    // Build floating platform clusters as 3D boxes
    const clusters = this.clusterTiles(floatingTiles);
    clusters.forEach(cluster => {
      this.buildPlatformBox(cluster, colors, worldHeight);
    });

    // Build ground as a thick solid mass
    this.buildGroundMass(groundTiles, colors, worldWidth, worldHeight, pitGaps);
  }

  /**
   * Cluster adjacent tiles into contiguous groups
   */
  clusterTiles(tiles) {
    if (tiles.length === 0) return [];

    // Group by y (same row)
    const byY = {};
    tiles.forEach(t => {
      const row = Math.round(t.y);
      if (!byY[row]) byY[row] = [];
      byY[row].push(t);
    });

    const clusters = [];
    Object.values(byY).forEach(row => {
      row.sort((a, b) => a.x - b.x);

      let start = row[0];
      let end = row[0];
      for (let i = 1; i < row.length; i++) {
        if (row[i].x - end.x <= 34) { // Adjacent (32px + tolerance)
          end = row[i];
        } else {
          clusters.push({
            x: (start.x + end.x) / 2,
            y: start.y,
            width: (end.x - start.x) + 32,
            tileCount: Math.round((end.x - start.x) / 32) + 1,
          });
          start = row[i];
          end = row[i];
        }
      }
      clusters.push({
        x: (start.x + end.x) / 2,
        y: start.y,
        width: (end.x - start.x) + 32,
        tileCount: Math.round((end.x - start.x) / 32) + 1,
      });
    });

    return clusters;
  }

  /**
   * Build a single platform cluster as a 3D box
   */
  buildPlatformBox(cluster, colors, worldHeight) {
    const w = cluster.width * SCALE;
    const h = 1.2 * SCALE * 32; // Visible thickness
    const d = PLATFORM_DEPTH;   // Spans the walkable Z lane

    const geo = new THREE.BoxGeometry(w, h, d);

    // Multi-material: top face gets brighter color, front face visible from angle
    const topMat = new THREE.MeshLambertMaterial({ color: colors.platform });
    const sideMat = new THREE.MeshLambertMaterial({ color: colors.platformSide });
    const frontMat = new THREE.MeshLambertMaterial({ color: colors.platformSide });

    // Box faces: +x, -x, +y (top), -y (bottom), +z (front), -z (back)
    const materials = [sideMat, sideMat, topMat, sideMat, frontMat, sideMat];

    const mesh = new THREE.Mesh(geo, materials);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Convert Phaser coords to Three.js coords
    const tx = cluster.x * SCALE;
    const ty = -(cluster.y * SCALE) + (worldHeight * SCALE / 2);
    mesh.position.set(tx, ty, 0); // centered on Z=0

    this.platformGroup.add(mesh);
  }

  /**
   * Build the ground as a thick 3D mass with layered colors
   */
  buildGroundMass(groundTiles, colors, worldWidth, worldHeight, pitGaps) {
    // Find continuous ground segments (avoiding pit gaps)
    const segments = [];
    const sortedTiles = [...groundTiles].sort((a, b) => a.x - b.x);
    if (sortedTiles.length === 0) return;

    // Group ground into continuous segments
    let segStart = 0;
    let segEnd = 0;

    // Build ground segments based on pit gaps
    const groundXMin = 0;
    const groundXMax = worldWidth;

    // If no gaps, one big segment
    if (pitGaps.length === 0) {
      segments.push({ start: groundXMin, end: groundXMax });
    } else {
      // Sort gaps
      const sortedGaps = [...pitGaps].sort((a, b) => a.start - b.start);
      let cursor = groundXMin;
      sortedGaps.forEach(gap => {
        if (cursor < gap.start) {
          segments.push({ start: cursor, end: gap.start });
        }
        cursor = gap.end;
      });
      if (cursor < groundXMax) {
        segments.push({ start: cursor, end: groundXMax });
      }
    }

    // Build each ground segment as a wide 3D slab (extends in Z for walkable depth)
    segments.forEach(seg => {
      const w = (seg.end - seg.start) * SCALE;
      const h = GROUND_HEIGHT;
      const d = GROUND_DEPTH; // spans the full walkable Z depth

      const geo = new THREE.BoxGeometry(w, h, d);

      // Top face is grassy, front face visible from angled camera, sides earthy
      const topMat = new THREE.MeshLambertMaterial({ color: colors.groundTop });
      const sideMat = new THREE.MeshLambertMaterial({ color: colors.ground });
      const frontMat = new THREE.MeshLambertMaterial({ color: colors.ground });
      const bottomMat = new THREE.MeshLambertMaterial({ color: colors.groundDark });

      const materials = [sideMat, sideMat, topMat, bottomMat, frontMat, sideMat];

      const mesh = new THREE.Mesh(geo, materials);
      mesh.receiveShadow = true;
      mesh.castShadow = true;

      const cx = ((seg.start + seg.end) / 2) * SCALE;
      const cy = -((worldHeight - 32) * SCALE) + (worldHeight * SCALE / 2) - h / 2;
      mesh.position.set(cx, cy, 0); // centered on Z=0

      this.platformGroup.add(mesh);
    });
  }

  /**
   * Build 3D crate boxes
   */
  buildCrates(phaserCrateGroup, worldHeight) {
    phaserCrateGroup.children.each(crate => {
      if (!crate.active) return;

      const size = 32 * SCALE;
      const geo = new THREE.BoxGeometry(size, size, size);
      const mat = new THREE.MeshLambertMaterial({ color: 0xC4A35A });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const tx = crate.x * SCALE;
      const ty = -(crate.y * SCALE) + (worldHeight * SCALE / 2);
      mesh.position.set(tx, ty, 0);

      this.platformGroup.add(mesh);
      this.meshes.set(crate, mesh);
    });
  }

  /**
   * Create a 3D entity (colored box or sprite billboard) for a Phaser sprite.
   * Returns the Three.js mesh for position syncing.
   */
  addEntity(phaserSprite, color = 0xff8c42, sizeX = 20, sizeY = 22, worldHeight = 576) {
    const w = sizeX * SCALE * 1.5;
    const h = sizeY * SCALE * 1.5;
    const d = w * 0.6;

    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;

    this.entityGroup.add(mesh);
    this.spriteMeshes.set(phaserSprite, mesh);
    return mesh;
  }

  /**
   * Add collectible as a small glowing 3D object
   */
  addCollectible(phaserSprite, color, shape = 'sphere', worldHeight = 576) {
    let geo;
    const size = 8 * SCALE;
    switch (shape) {
      case 'sphere':
        geo = new THREE.SphereGeometry(size, 8, 6);
        break;
      case 'cylinder':
        geo = new THREE.CylinderGeometry(size * 0.7, size * 0.7, size * 1.2, 8);
        break;
      case 'diamond':
        geo = new THREE.OctahedronGeometry(size);
        break;
      default:
        geo = new THREE.BoxGeometry(size, size, size);
    }

    const mat = new THREE.MeshLambertMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.3,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;

    this.entityGroup.add(mesh);
    this.spriteMeshes.set(phaserSprite, mesh);
    return mesh;
  }

  /**
   * Add NPC as a taller colored box
   */
  addNPC(phaserSprite, color, worldHeight = 576) {
    const w = 22 * SCALE * 1.5;
    const h = 26 * SCALE * 1.5;
    const d = w * 0.6;

    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    this.entityGroup.add(mesh);
    this.spriteMeshes.set(phaserSprite, mesh);
    return mesh;
  }

  /**
   * Add enemy entity
   */
  addEnemy(phaserSprite, color = 0x8B4513, worldHeight = 576) {
    const w = 16 * SCALE * 1.3;
    const h = 14 * SCALE * 1.3;
    const d = w * 0.6;

    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;

    this.entityGroup.add(mesh);
    this.spriteMeshes.set(phaserSprite, mesh);
    return mesh;
  }

  /**
   * Sync a Phaser sprite position to its Three.js mesh
   */
  syncSprite(phaserSprite, worldHeight = 576, zPos = 0) {
    const mesh = this.spriteMeshes.get(phaserSprite);
    if (!mesh || !phaserSprite.active) {
      if (mesh) mesh.visible = false;
      return;
    }

    mesh.visible = true;
    const tx = phaserSprite.x * SCALE;
    const ty = -(phaserSprite.y * SCALE) + (worldHeight * SCALE / 2);
    const tz = zPos * SCALE; // depth position (into/out of screen)
    mesh.position.set(tx, ty, tz);

    // Rotate collectibles
    if (mesh.geometry.type === 'SphereGeometry' ||
        mesh.geometry.type === 'OctahedronGeometry' ||
        mesh.geometry.type === 'CylinderGeometry') {
      mesh.rotation.y += 0.02;
    }
  }

  /**
   * Remove a mesh when its Phaser sprite is destroyed/collected
   */
  removeSprite(phaserSprite) {
    const mesh = this.spriteMeshes.get(phaserSprite);
    if (mesh) {
      this.entityGroup.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) mesh.material.dispose();
      this.spriteMeshes.delete(phaserSprite);
    }
  }

  /**
   * Update camera to match Phaser's viewport exactly.
   * Uses Phaser scrollX/scrollY so 3D world aligns pixel-perfect with sprites.
   */
  updateCamera(scrollX, scrollY, worldWidth, worldHeight) {
    const halfW = (this.width * SCALE) / 2;
    const halfH = (this.height * SCALE) / 2;

    // Phaser viewport center in world coords → Three.js coords
    const centerX = (scrollX + this.width / 2) * SCALE;
    const centerY = -((scrollY + this.height / 2) * SCALE) + (worldHeight * SCALE / 2);

    // Position ortho camera so its view matches Phaser's visible area
    this.camera.position.set(centerX, centerY, 50);
    this.camera.lookAt(centerX, centerY, 0);

    // Update ortho frustum (in case of resize)
    this.camera.left = -halfW;
    this.camera.right = halfW;
    this.camera.top = halfH;
    this.camera.bottom = -halfH;
    this.camera.updateProjectionMatrix();

    // Keep sun following the visible area
    this.sunLight.position.set(centerX + 5, centerY + 15, 20);
    this.sunLight.target.position.set(centerX, centerY, 0);
  }

  /**
   * Render one frame
   */
  render() {
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Handle resize
   */
  resize(width, height) {
    this.width = width;
    this.height = height;
    const halfW = (width * SCALE) / 2;
    const halfH = (height * SCALE) / 2;
    this.camera.left = -halfW;
    this.camera.right = halfW;
    this.camera.top = halfH;
    this.camera.bottom = -halfH;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Clean up
   */
  destroy() {
    this.clearLevel();
    this.renderer.dispose();
    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}

export { BIOME_COLORS, SCALE };
