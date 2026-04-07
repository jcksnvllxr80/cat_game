import * as THREE from 'three';

const BIOME_COLORS = {
  meadow: {
    platform: 0x6b8e23,
    platformSide: 0x4a6a10,
    ground: 0x5a3a0a,
    groundTop: 0x4a8c28,
    groundDark: 0x3a2000,
    sky: [0x87ceeb, 0xe0f0ff],
    fog: 0xc8e6f5,
    ambient: 0xffffff,
    sunColor: 0xfff8e7,
    bgMountain: 0x6b58a0,
    bgHills: [0x4a7a30, 0x5b8c3e],
    haze: 0xeef9ff,
  },
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
    haze: 0x99b3aa,
  },
  docks: {
    platform: 0x8b7355,
    platformSide: 0x5a4a30,
    ground: 0x5a3a1a,
    groundTop: 0x8b6914,
    groundDark: 0x3a2000,
    sky: [0x4a8aaa, 0xaacce0],
    fog: 0x8ab8d0,
    ambient: 0xddeeff,
    sunColor: 0xfff0d0,
    bgMountain: 0x5a6a7a,
    bgHills: [0x3a5a6a, 0x4a6a7a],
    haze: 0xdff3ff,
  },
  canyon: {
    platform: 0xcd853f,
    platformSide: 0x8b6914,
    ground: 0x8b4513,
    groundTop: 0xcd853f,
    groundDark: 0x5a2a0a,
    sky: [0xe8a060, 0xf0c8a0],
    fog: 0xe8c8a0,
    ambient: 0xffeedd,
    sunColor: 0xffcc88,
    bgMountain: 0xaa7744,
    bgHills: [0x8b6914, 0xaa8844],
    haze: 0xffdfbf,
  },
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
    haze: 0x97a1b0,
  },
  snow: {
    platform: 0xccddee,
    platformSide: 0x8899aa,
    ground: 0xaabbcc,
    groundTop: 0xeeeeff,
    groundDark: 0x667788,
    sky: [0x6688aa, 0xaabbdd],
    fog: 0xbbccdd,
    ambient: 0xddeeff,
    sunColor: 0xeef8ff,
    bgMountain: 0x8899bb,
    bgHills: [0x7788aa, 0x8899bb],
    haze: 0xf5fbff,
  },
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
    haze: 0x7a5f5f,
  },
};

const SCALE = 1 / 32;
const DEFAULT_WORLD_HEIGHT = 576;
const PLATFORM_DEPTH = 2.7;
const GROUND_DEPTH = 4.6;

function toThreeX(xPx) {
  return xPx * SCALE;
}

function toThreeY(yPx, worldHeight = DEFAULT_WORLD_HEIGHT) {
  return -(yPx * SCALE) + ((worldHeight * SCALE) / 2);
}

function lerpHex(a, b, t) {
  return new THREE.Color(a).lerp(new THREE.Color(b), t).getHex();
}

function shadeHex(hex, factor) {
  return new THREE.Color(hex).multiplyScalar(factor).getHex();
}

function createVerticalGradientTexture(topHex, bottomHex) {
  const canvas = document.createElement('canvas');
  canvas.width = 8;
  canvas.height = 256;

  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, `#${topHex.toString(16).padStart(6, '0')}`);
  gradient.addColorStop(1, `#${bottomHex.toString(16).padStart(6, '0')}`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function createRadialGlowTexture(innerHex, outerHex) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;

  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(128, 128, 12, 128, 128, 128);
  gradient.addColorStop(0, `#${innerHex.toString(16).padStart(6, '0')}`);
  gradient.addColorStop(0.45, `#${lerpHex(innerHex, outerHex, 0.3).toString(16).padStart(6, '0')}`);
  gradient.addColorStop(1, 'rgba(255,255,255,0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createPrismGeometry(width, height, depth, rise, inset) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const position = geometry.attributes.position;

  for (let i = 0; i < position.count; i++) {
    const z = position.getZ(i);
    if (z < 0) {
      const x = position.getX(i);
      position.setY(i, position.getY(i) + rise);
      if (x < 0) {
        position.setX(i, x + inset);
      } else if (x > 0) {
        position.setX(i, x - inset);
      }
    }
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function getTintHex(phaserObject) {
  if (phaserObject?.isTinted && Number.isFinite(phaserObject.tintTopLeft)) {
    return phaserObject.tintTopLeft;
  }
  return 0xffffff;
}

function setMaterialAppearance(material, baseHex, tintHex, alpha) {
  const base = new THREE.Color(baseHex);
  const tint = new THREE.Color(tintHex);
  material.color.copy(base).multiply(tint);
  material.opacity = alpha;
  material.transparent = alpha < 0.999;
  material.depthWrite = alpha >= 0.85;

  const emissiveBase = material.userData?.emissiveBaseHex;
  if ('emissive' in material && emissiveBase !== undefined) {
    material.emissive.copy(new THREE.Color(emissiveBase).multiply(tint));
  }
}

function makeStandardMaterial(colorHex, alpha = 1) {
  return new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.78,
    metalness: 0.08,
    flatShading: true,
    transparent: alpha < 0.999,
    opacity: alpha,
    side: THREE.DoubleSide,
  });
}

function createBackdropGeometry(worldWidth, worldHeight, config) {
  const paddingPx = 720;
  const startX = -paddingPx;
  const endX = worldWidth + paddingPx;
  const bottomY = worldHeight + 120;
  const step = config.step ?? 96;

  const shape = new THREE.Shape();
  shape.moveTo(toThreeX(startX), toThreeY(bottomY, worldHeight));

  for (let x = startX; x <= endX; x += step) {
    const topY = sampleBackdropY(x, worldHeight, config);
    shape.lineTo(toThreeX(x), toThreeY(topY, worldHeight));
  }

  shape.lineTo(toThreeX(endX), toThreeY(bottomY, worldHeight));
  shape.lineTo(toThreeX(startX), toThreeY(bottomY, worldHeight));

  return new THREE.ShapeGeometry(shape);
}

function sampleBackdropY(x, worldHeight, config) {
  const baseY = config.baseY ?? (worldHeight - 220);
  const amplitude = config.amplitude ?? 80;
  const seed = config.seed ?? 0;

  if (config.style === 'blocky') {
    const cell = config.cell ?? 180;
    const stepIndex = Math.floor(x / cell);
    const noiseA = Math.sin(stepIndex * 0.81 + seed);
    const noiseB = Math.sin(stepIndex * 0.27 + seed * 1.7);
    const plateau = (0.5 + 0.5 * noiseA + 0.35 * noiseB);
    return baseY - Math.max(0, plateau) * amplitude;
  }

  if (config.style === 'spires') {
    const nx = x * 0.0035;
    const spire = Math.pow(Math.abs(Math.sin(nx + seed)), 2.5);
    const ridge = Math.pow(Math.abs(Math.sin(nx * 0.47 + seed * 1.9)), 1.6);
    return baseY - ((ridge * 0.45) + (spire * 0.9)) * amplitude;
  }

  const nx = x * 0.0024;
  const waveA = Math.sin(nx + seed);
  const waveB = Math.sin(nx * 0.45 + seed * 1.3);
  const waveC = Math.sin(nx * 1.55 + seed * 0.7);
  const shape = (waveA * 0.45) + (waveB * 0.35) + (waveC * 0.2);
  return baseY - (amplitude * (0.58 + ((shape + 1) * 0.38)));
}

function setRecursiveShadow(object, castShadow, receiveShadow) {
  object.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = castShadow;
      child.receiveShadow = receiveShadow;
    }
  });
}

export class ThreeRenderer {
  constructor(containerEl, width = 1024, height = 576) {
    this.width = width;
    this.height = height;
    this.biome = 'meadow';
    this.backgroundGroup = new THREE.Group();
    this.platformGroup = new THREE.Group();
    this.propGroup = new THREE.Group();
    this.trackedProps = new Map();
    this.parallaxLayers = [];
    this.elapsed = 0;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.setClearColor(0x000000, 0);

    this.canvas = this.renderer.domElement;
    this.canvas.id = 'three-canvas';
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.zIndex = '0';
    this.canvas.style.pointerEvents = 'none';
    containerEl.appendChild(this.canvas);

    this.scene = new THREE.Scene();

    const halfW = (width * SCALE) / 2;
    const halfH = (height * SCALE) / 2;
    this.camera = new THREE.OrthographicCamera(-halfW, halfW, halfH, -halfH, 0.1, 220);
    this.camera.position.set(0, 0, 60);
    this.camera.lookAt(0, 0, 0);

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xfff8e7, 1.35);
    this.sunLight.position.set(8, 10, 28);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.camera.left = -18;
    this.sunLight.shadow.camera.right = 18;
    this.sunLight.shadow.camera.top = 18;
    this.sunLight.shadow.camera.bottom = -18;
    this.sunLight.shadow.camera.near = 0.1;
    this.sunLight.shadow.camera.far = 80;
    this.sunLight.shadow.bias = -0.0008;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    this.hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x4a2a00, 0.5);
    this.scene.add(this.hemiLight);

    this.scene.add(this.backgroundGroup);
    this.scene.add(this.platformGroup);
    this.scene.add(this.propGroup);
  }

  getBiomeColors(biomeName = this.biome) {
    return BIOME_COLORS[biomeName] || BIOME_COLORS.meadow;
  }

  getPlatformPalette() {
    const colors = this.getBiomeColors();
    return {
      front: shadeHex(colors.platformSide, 0.94),
      back: shadeHex(colors.platformSide, 0.76),
      top: lerpHex(colors.platform, 0xffffff, 0.18),
      bottom: shadeHex(colors.platformSide, 0.55),
      side: shadeHex(colors.platformSide, 0.86),
    };
  }

  getGroundPalette() {
    const colors = this.getBiomeColors();
    return {
      front: shadeHex(colors.ground, 0.98),
      back: shadeHex(colors.groundDark, 0.82),
      top: lerpHex(colors.groundTop, 0xffffff, 0.14),
      bottom: shadeHex(colors.groundDark, 0.72),
      side: shadeHex(colors.ground, 0.84),
    };
  }

  setBiome(biomeName) {
    this.biome = biomeName;
    const colors = this.getBiomeColors(biomeName);

    this.ambientLight.color.set(colors.ambient);
    this.sunLight.color.set(colors.sunColor);
    this.hemiLight.color.set(colors.sky[0]);
    this.hemiLight.groundColor.set(colors.groundDark);

    this.scene.fog = new THREE.Fog(lerpHex(colors.sky[1], colors.fog, 0.45), 36, 140);
    this.renderer.setClearColor(0x000000, 0);
  }

  clearLevel() {
    [this.backgroundGroup, this.platformGroup, this.propGroup].forEach((group) => {
      while (group.children.length > 0) {
        const child = group.children[0];
        group.remove(child);
        this.disposeObject3D(child);
      }
    });

    this.trackedProps.clear();
    this.parallaxLayers = [];
  }

  disposeObject3D(object) {
    object.traverse((child) => {
      if (child.geometry) {
        child.geometry.dispose();
      }

      if (child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => {
          if (material.map) material.map.dispose();
          if (material.alphaMap) material.alphaMap.dispose();
          if (material.emissiveMap) material.emissiveMap.dispose();
          material.dispose();
        });
      }
    });
  }

  buildBackground(worldWidth, worldHeight) {
    const colors = this.getBiomeColors();
    const skyWidth = (this.width * SCALE) * 1.7;
    const skyHeight = (this.height * SCALE) * 1.45;

    const skyTexture = createVerticalGradientTexture(colors.sky[1], colors.sky[0]);
    this.skyPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(skyWidth, skyHeight),
      new THREE.MeshBasicMaterial({
        map: skyTexture,
        depthWrite: false,
        fog: false,
      })
    );
    this.skyPlane.position.set(0, 0, -120);
    this.backgroundGroup.add(this.skyPlane);

    const sunTexture = createRadialGlowTexture(colors.sunColor, colors.haze || colors.sky[1]);
    this.sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: sunTexture,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      fog: false,
      opacity: 0.95,
    }));
    this.sunSprite.scale.set(4.8, 4.8, 1);
    this.sunSprite.position.set(0, 0, -112);
    this.backgroundGroup.add(this.sunSprite);

    const style =
      this.biome === 'factory' || this.biome === 'fortress' ? 'blocky' :
      this.biome === 'canyon' ? 'spires' :
      this.biome === 'snow' ? 'spires' :
      'smooth';

    this.addBackdropLayer(worldWidth, worldHeight, {
      color: colors.bgMountain,
      opacity: 0.7,
      factor: 0.16,
      verticalFactor: 0.1,
      z: -90,
      baseY: worldHeight - 320,
      amplitude: this.biome === 'snow' ? 180 : 130,
      style,
      seed: 0.8,
      step: 112,
    });

    this.addBackdropLayer(worldWidth, worldHeight, {
      color: colors.bgHills[0],
      opacity: 0.85,
      factor: 0.28,
      verticalFactor: 0.15,
      z: -70,
      baseY: worldHeight - 230,
      amplitude: this.biome === 'canyon' ? 105 : 80,
      style: this.biome === 'factory' || this.biome === 'fortress' ? 'blocky' : 'smooth',
      seed: 1.7,
      step: 88,
    });

    this.addBackdropLayer(worldWidth, worldHeight, {
      color: colors.bgHills[1],
      opacity: 0.92,
      factor: 0.42,
      verticalFactor: 0.22,
      z: -54,
      baseY: worldHeight - 170,
      amplitude: this.biome === 'forest' ? 60 : 45,
      style: this.biome === 'factory' ? 'blocky' : 'smooth',
      seed: 2.4,
      step: 76,
    });

    const haze = new THREE.Mesh(
      new THREE.PlaneGeometry(toThreeX(worldWidth + 1600), 5.4),
      new THREE.MeshBasicMaterial({
        color: colors.haze || lerpHex(colors.sky[1], 0xffffff, 0.2),
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
        fog: false,
      })
    );
    haze.position.set(toThreeX(worldWidth / 2), toThreeY(worldHeight - 110, worldHeight), -48);
    this.backgroundGroup.add(haze);
    this.parallaxLayers.push({
      object: haze,
      factor: 0.55,
      verticalFactor: 0.3,
      baseX: toThreeX(worldWidth / 2),
      baseY: toThreeY(worldHeight - 110, worldHeight),
    });
  }

  addBackdropLayer(worldWidth, worldHeight, config) {
    const geometry = createBackdropGeometry(worldWidth, worldHeight, config);
    const material = new THREE.MeshBasicMaterial({
      color: config.color,
      transparent: true,
      opacity: config.opacity,
      depthWrite: false,
      fog: false,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = config.z ?? -60;
    this.backgroundGroup.add(mesh);

    this.parallaxLayers.push({
      object: mesh,
      factor: config.factor ?? 0.3,
      verticalFactor: config.verticalFactor ?? 0.15,
      baseX: 0,
      baseY: 0,
    });
  }

  buildPlatforms(phaserPlatformGroup, worldWidth, worldHeight, platformKey, groundKey, pitGaps = []) {
    const groundFillY = worldHeight - 48;
    const floatingTiles = [];

    phaserPlatformGroup.children.each((tile) => {
      if (!tile.active) return;
      const isGround = tile.y >= groundFillY - 2;
      if (!isGround) {
        floatingTiles.push({ x: tile.x, y: tile.y });
      }
    });

    const clusters = this.clusterTiles(floatingTiles);
    clusters.forEach((cluster) => this.buildPlatformCluster(cluster, worldHeight));
    this.buildGroundMass(worldWidth, worldHeight, pitGaps);
  }

  clusterTiles(tiles) {
    if (tiles.length === 0) return [];

    const byRow = new Map();
    tiles.forEach((tile) => {
      const row = Math.round(tile.y);
      if (!byRow.has(row)) {
        byRow.set(row, []);
      }
      byRow.get(row).push(tile);
    });

    const clusters = [];

    for (const rowTiles of byRow.values()) {
      rowTiles.sort((a, b) => a.x - b.x);
      let start = rowTiles[0];
      let end = rowTiles[0];

      for (let i = 1; i < rowTiles.length; i++) {
        if (rowTiles[i].x - end.x <= 34) {
          end = rowTiles[i];
        } else {
          clusters.push({
            x: (start.x + end.x) / 2,
            y: start.y,
            widthPx: (end.x - start.x) + 32,
          });
          start = rowTiles[i];
          end = rowTiles[i];
        }
      }

      clusters.push({
        x: (start.x + end.x) / 2,
        y: start.y,
        widthPx: (end.x - start.x) + 32,
      });
    }

    return clusters;
  }

  buildPlatformCluster(cluster, worldHeight) {
    const width = toThreeX(cluster.widthPx);
    const height = toThreeX(32);
    const rise = 0.52;
    const inset = Math.min(width * 0.08, 0.18);
    const geometry = createPrismGeometry(width, height, PLATFORM_DEPTH, rise, inset);

    const palette = this.getPlatformPalette();
    const materials = [
      makeStandardMaterial(palette.side),
      makeStandardMaterial(palette.side),
      makeStandardMaterial(palette.top),
      makeStandardMaterial(palette.bottom),
      makeStandardMaterial(palette.front),
      makeStandardMaterial(palette.back),
    ];

    const mesh = new THREE.Mesh(geometry, materials);
    mesh.position.set(toThreeX(cluster.x), toThreeY(cluster.y, worldHeight), 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.platformGroup.add(mesh);
  }

  buildGroundMass(worldWidth, worldHeight, pitGaps = []) {
    const segments = [];
    const groundXMin = 0;
    const groundXMax = worldWidth;

    if (pitGaps.length === 0) {
      segments.push({ start: groundXMin, end: groundXMax });
    } else {
      let cursor = groundXMin;
      const sortedGaps = [...pitGaps].sort((a, b) => a.start - b.start);

      sortedGaps.forEach((gap) => {
        if (cursor < gap.start) {
          segments.push({ start: cursor, end: gap.start });
        }
        cursor = gap.end;
      });

      if (cursor < groundXMax) {
        segments.push({ start: cursor, end: groundXMax });
      }
    }

    const surfaceTopPx = worldHeight - 64;
    const frontHeightPx = 156;
    const palette = this.getGroundPalette();

    segments.forEach((segment) => {
      const width = toThreeX(segment.end - segment.start);
      const height = toThreeX(frontHeightPx);
      const rise = 0.72;
      const inset = Math.min(width * 0.04, 0.22);
      const geometry = createPrismGeometry(width, height, GROUND_DEPTH, rise, inset);

      const materials = [
        makeStandardMaterial(palette.side),
        makeStandardMaterial(palette.side),
        makeStandardMaterial(palette.top),
        makeStandardMaterial(palette.bottom),
        makeStandardMaterial(palette.front),
        makeStandardMaterial(palette.back),
      ];

      const mesh = new THREE.Mesh(geometry, materials);
      const centerX = (segment.start + segment.end) / 2;
      const centerY = surfaceTopPx + (frontHeightPx / 2);
      mesh.position.set(toThreeX(centerX), toThreeY(centerY, worldHeight), -0.1);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.platformGroup.add(mesh);
    });
  }

  registerPropGroup(phaserGroup, options = {}) {
    if (!phaserGroup?.children) return;
    phaserGroup.children.each((child) => this.registerProp(child, options));
  }

  registerProp(phaserObject, options = {}) {
    if (!phaserObject || this.trackedProps.has(phaserObject)) return;

    const descriptor = this.createPropDescriptor(phaserObject, options);
    if (!descriptor) return;

    this.propGroup.add(descriptor.root);
    setRecursiveShadow(descriptor.root, true, true);
    this.trackedProps.set(phaserObject, descriptor);
  }

  createPropDescriptor(phaserObject, options = {}) {
    const displayWidth = Math.max(toThreeX(phaserObject.displayWidth || 32), 0.25);
    const displayHeight = Math.max(toThreeX(phaserObject.displayHeight || 32), 0.25);
    const kind = options.kind || 'prism';

    if (kind === 'rock') {
      const radius = Math.max(displayWidth, displayHeight) * 0.42;
      const geometry = new THREE.DodecahedronGeometry(radius, 0);
      const material = makeStandardMaterial(options.color || 0x808080);
      const root = new THREE.Mesh(geometry, material);
      root.scale.y = 0.88;

      return {
        type: 'rock',
        root,
        materials: [material],
        baseColors: [options.color || 0x808080],
        zOffset: options.zOffset ?? 0.7,
      };
    }

    if (kind === 'ball') {
      const radius = Math.max(displayWidth, displayHeight) * 0.44;
      const baseColor = options.color || 0xff5a92;
      const stripeColor = options.stripeColor || shadeHex(baseColor, 0.7);

      const root = new THREE.Group();

      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 18, 14),
        makeStandardMaterial(baseColor)
      );
      root.add(sphere);

      const band = new THREE.Mesh(
        new THREE.TorusGeometry(radius * 0.82, radius * 0.11, 10, 28),
        makeStandardMaterial(stripeColor)
      );
      band.rotation.x = Math.PI / 2.4;
      root.add(band);

      return {
        type: 'ball',
        root,
        materials: [sphere.material, band.material],
        baseColors: [baseColor, stripeColor],
        zOffset: options.zOffset ?? 0.95,
      };
    }

    if (kind === 'switch') {
      const palette = {
        front: options.front || 0x5e5e5e,
        back: options.back || 0x3f3f3f,
        top: options.top || 0x8a8a8a,
        bottom: options.bottom || 0x343434,
        side: options.side || 0x505050,
        light: options.light || 0xff5555,
      };

      const root = new THREE.Group();
      const geometry = createPrismGeometry(displayWidth * 0.9, displayHeight * 0.88, 0.82, 0.18, 0.06);
      const baseMaterials = [
        makeStandardMaterial(palette.side),
        makeStandardMaterial(palette.side),
        makeStandardMaterial(palette.top),
        makeStandardMaterial(palette.bottom),
        makeStandardMaterial(palette.front),
        makeStandardMaterial(palette.back),
      ];
      const baseMesh = new THREE.Mesh(geometry, baseMaterials);
      root.add(baseMesh);

      const lightMaterial = new THREE.MeshStandardMaterial({
        color: palette.light,
        emissive: palette.light,
        emissiveIntensity: 0.55,
        roughness: 0.35,
        metalness: 0.15,
      });
      lightMaterial.userData.emissiveBaseHex = palette.light;

      const light = new THREE.Mesh(
        new THREE.SphereGeometry(Math.min(displayWidth, displayHeight) * 0.16, 14, 10),
        lightMaterial
      );
      light.position.set(0, displayHeight * 0.08, 0.46);
      root.add(light);

      return {
        type: 'switch',
        root,
        materials: [...baseMaterials, lightMaterial],
        baseColors: [
          palette.side,
          palette.side,
          palette.top,
          palette.bottom,
          palette.front,
          palette.back,
          palette.light,
        ],
        lightMaterial,
        zOffset: options.zOffset ?? 0.8,
      };
    }

    const palette = {
      front: options.front || options.color || 0x8b7355,
      back: options.back || shadeHex(options.front || options.color || 0x8b7355, 0.72),
      top: options.top || lerpHex(options.front || options.color || 0x8b7355, 0xffffff, 0.12),
      bottom: options.bottom || shadeHex(options.front || options.color || 0x8b7355, 0.52),
      side: options.side || shadeHex(options.front || options.color || 0x8b7355, 0.84),
    };

    const depth = options.depth ?? Math.max(0.9, Math.min(displayWidth * 0.52, 2.6));
    const rise = options.rise ?? Math.max(0.22, depth * 0.22);
    const inset = options.inset ?? Math.min(displayWidth * 0.16, 0.18);
    const geometry = createPrismGeometry(displayWidth, displayHeight, depth, rise, inset);
    const materials = [
      makeStandardMaterial(palette.side),
      makeStandardMaterial(palette.side),
      makeStandardMaterial(palette.top),
      makeStandardMaterial(palette.bottom),
      makeStandardMaterial(palette.front),
      makeStandardMaterial(palette.back),
    ];
    const root = new THREE.Mesh(geometry, materials);

    return {
      type: 'prism',
      root,
      materials,
      baseColors: [
        palette.side,
        palette.side,
        palette.top,
        palette.bottom,
        palette.front,
        palette.back,
      ],
      zOffset: options.zOffset ?? 0.68,
    };
  }

  syncTrackedProps(worldHeight = DEFAULT_WORLD_HEIGHT, deltaMs = 16) {
    for (const [phaserObject, descriptor] of this.trackedProps.entries()) {
      if (!phaserObject?.active) {
        this.propGroup.remove(descriptor.root);
        this.disposeObject3D(descriptor.root);
        this.trackedProps.delete(phaserObject);
        continue;
      }

      this.syncProp(phaserObject, descriptor, worldHeight, deltaMs);
    }
  }

  syncProp(phaserObject, descriptor, worldHeight, deltaMs) {
    const alpha = Math.max(0, Math.min(1, phaserObject.alpha ?? 1));
    const tintHex = getTintHex(phaserObject);

    descriptor.root.visible = alpha > 0.02;
    descriptor.root.position.set(
      toThreeX(phaserObject.x),
      toThreeY(phaserObject.y, worldHeight),
      descriptor.zOffset ?? 0.7
    );
    descriptor.root.rotation.z = THREE.MathUtils.degToRad(-(phaserObject.angle || 0));

    descriptor.materials.forEach((material, index) => {
      setMaterialAppearance(material, descriptor.baseColors[index], tintHex, alpha);
    });

    if (descriptor.type === 'ball') {
      descriptor.root.rotation.y += (deltaMs * 0.0024);
      descriptor.root.rotation.x += ((phaserObject.body?.velocity?.x || 0) * 0.00001);
    }

    if (descriptor.type === 'switch' && descriptor.lightMaterial) {
      const activated = !!phaserObject.getData?.('activated');
      descriptor.lightMaterial.emissiveIntensity = activated ? 1.45 : 0.5;
    }
  }

  updateCamera(scrollX, scrollY, worldWidth, worldHeight) {
    const halfW = (this.width * SCALE) / 2;
    const halfH = (this.height * SCALE) / 2;
    const centerX = (scrollX + (this.width / 2)) * SCALE;
    const centerY = toThreeY(scrollY + (this.height / 2), worldHeight);

    this.camera.position.set(centerX, centerY, 60);
    this.camera.lookAt(centerX, centerY, 0);
    this.camera.left = -halfW;
    this.camera.right = halfW;
    this.camera.top = halfH;
    this.camera.bottom = -halfH;
    this.camera.updateProjectionMatrix();

    this.sunLight.position.set(centerX + 7, centerY + 10, 28);
    this.sunLight.target.position.set(centerX, centerY - 1, 0);

    if (this.skyPlane) {
      this.skyPlane.position.set(centerX, centerY, -120);
    }

    if (this.sunSprite) {
      const drift = Math.sin(this.elapsed * 0.2) * 0.25;
      this.sunSprite.position.set(centerX + 8.6, centerY + 4.4 + drift, -112);
    }

    this.parallaxLayers.forEach((layer) => {
      layer.object.position.x = (layer.baseX ?? 0) + (centerX * (1 - layer.factor));
      layer.object.position.y = (layer.baseY ?? 0) + (centerY * (1 - (layer.verticalFactor ?? 0.15)));
    });
  }

  render() {
    this.elapsed += 0.016;
    this.renderer.render(this.scene, this.camera);
  }

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

  destroy() {
    this.clearLevel();
    this.renderer.dispose();
    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}

export { BIOME_COLORS, SCALE };
