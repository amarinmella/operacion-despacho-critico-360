// =====================================================================
// OPERACIÓN DESPACHO CRÍTICO 360° — Escena 3D multi-etapa
// Etapa 1: Bodega Interna AndesCargo  ·  Etapa 2: Patio de Embarque Exterior
// =====================================================================
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { TextureGenerator } from './textures.js';

const gsap = window.gsap;
// Las cinemáticas respetan el tiempo real aunque el equipo rinda pocos FPS
if (gsap) gsap.ticker.lagSmoothing(0);

export const STATIONS = {
  1: { stage: 1, num: '01', name: 'Escritorio de Control', pos: [-15.4, 3.0, 4], cam: [-9.8, 2.9, 5.7], look: [-15.4, 1.5, 4], pick: [-15.4, 1.1, 4, 2.6, 2.2, 3.6] },
  2: { stage: 1, num: '02', name: 'Rack Zona A · FIFO', pos: [16.6, 3.3, 0], cam: [9.2, 3.0, 1.0], look: [17.4, 1.5, 0], pick: [17.6, 1.2, 0, 1.6, 2.4, 8.4] },
  3: { stage: 1, num: '03', name: 'Paletizado · Tablet TMS', pos: [0, 2.9, 2], cam: [3.3, 3.0, 6.3], look: [0, 1.2, 2], pick: [0, 1, 2, 1.6, 2, 1.6] },
  4: { stage: 1, num: '04', name: 'Portón Andén 01', pos: [5.7, 2.7, -14.3], cam: [3.6, 2.9, -6.6], look: [2.4, 2.8, -15], pick: [5.7, 1.7, -14.6, 1.2, 1.6, 0.8] },
  5: { stage: 2, num: '05', name: 'Reefer Bio-Médico', pos: [-14.3, 3.5, -34.5], cam: [-8.2, 2.9, -30.6], look: [-15.2, 1.7, -35.4], pick: [-15.6, 1.6, -37, 3.2, 3.2, 12.4] },
  6: { stage: 2, num: '06', name: 'Kiosco ABC · Pareto', pos: [14, 3.3, -30], cam: [10.2, 2.4, -25.9], look: [14, 1.6, -30], pick: [14, 1.3, -30, 2, 2.8, 2] },
  7: { stage: 2, num: '07', name: 'Grúa Horquilla · EPP', pos: [15.2, 3.9, -46.6], cam: [7.8, 3.3, -40.6], look: [15.8, 1.2, -46.4], pick: [15.6, 1.3, -46.6, 6.5, 2.8, 5.5] },
  8: { stage: 2, num: '08', name: 'Consola Flota 72', pos: [4.7, 2.7, -38], cam: [8.4, 3.0, -31.6], look: [2.2, 1.7, -41.5], pick: [4.7, 1.0, -38, 1.4, 2.2, 1.4] },
  9: { stage: 3, num: '09', name: 'Conteo Cíclico · Stock', pos: [-16.6, 3.3, -9.2], cam: [-12, 3.1, -5.4], look: [-17.6, 1.6, -9.8], pick: [-17.8, 1.4, -9.2, 1.6, 2.8, 8.4] },
  10: { stage: 3, num: '10', name: 'Ubicaciones · WMS', pos: [16.6, 5.9, -5.6], cam: [10, 4.7, -4.2], look: [17.6, 4.3, -5.6], pick: [17.6, 5.2, -7, 1.6, 2.6, 5.6] },
  11: { stage: 3, num: '11', name: 'Layout · Cubicaje', pos: [-13.2, 3.7, 13.4], cam: [-11.2, 3.2, 7.2], look: [-13.2, 2.0, 14], pick: [-13.2, 2, 13.6, 6.2, 4, 2.6] },
  12: { stage: 3, num: '12', name: 'Cierre de Turno', pos: [-5.5, 2.8, -11.6], cam: [-4.3, 2.5, -6.4], look: [-5.5, 1.5, -11.6], pick: [-5.5, 1.1, -11.6, 1.4, 2.2, 1.4] },
  13: { stage: 4, num: '13', name: 'Lector RF · Pallets', pos: [13.4, 2.9, -8.4], cam: [10.2, 2.9, -4.8], look: [13.4, 1.1, -8.4], pick: [13.4, 1, -8.4, 4.4, 2, 1.6] },
  14: { stage: 4, num: '14', name: 'Terminal WMS · Salida', pos: [11.5, 2.8, -13.3], cam: [10.6, 2.5, -8.8], look: [11.5, 1.4, -13.4], pick: [11.5, 1.1, -13.4, 2.6, 2.2, 1.4] },
  15: { stage: 4, num: '15', name: 'Panel KPI · Servicio', pos: [15.2, 5.2, -14.5], cam: [14.4, 3.3, -9.6], look: [15.2, 3.5, -15], pick: [15.2, 3.6, -14.8, 4, 2.2, 0.6] },
  16: { stage: 4, num: '16', name: 'Consola de Control', pos: [8, 2.8, -13.2], cam: [7.4, 2.5, -8.4], look: [8, 1.5, -13.2], pick: [8, 1.1, -13.2, 1.4, 2.2, 1.4] },
};

const VIEWS = {
  4: { cam: [-5, 6.5, 9.5], target: [0, 2, 0], maxDist: 14, minDist: 3, minPolar: 0.9 },
  1: { cam: [8.5, 6, 10.5], target: [0, 2, 0], maxDist: 14, minDist: 3, minPolar: 0.9 },
  2: { cam: [12, 8.5, -20.5], target: [0, 2, -40], maxDist: 24, minDist: 4, minPolar: 0.55 },
  3: { cam: [-8.5, 6, 10.5], target: [0, 2, 0], maxDist: 14, minDist: 3, minPolar: 0.9 },
};

const COL = { cyan: 0x3de8ff, amber: 0xffb020, green: 0x35f0a0, red: 0xff3b4e, purple: 0xb06bff, pink: 0xff5fa2 };

export class WarehouseScene {
  constructor(container, layer, opts = {}) {
    this.container = container;
    this.layer = layer;
    this.quality = opts.quality || 'high';
    this.stage = 1;
    this.started = false;
    this.cinematic = false;
    this.markersHidden = true;
    this.onSelect = null;
    this.rings = {};
    this.markers = {};
    this.picks = [];
    this.spin = [];
    this.solved = new Set();
    this.clock = new THREE.Clock();
    this._v = new THREE.Vector3();
    this._perfN = 0;
    this._perfT = 0;
    this._init();
  }

  // ------------------------------------------------------------------
  _init() {
    const low = this.quality === 'low';
    const w = window.innerWidth, h = window.innerHeight;
    const r = (this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' }));
    r.setPixelRatio(Math.min(window.devicePixelRatio, low ? 1 : 1.75));
    r.setSize(w, h);
    r.shadowMap.enabled = !low;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.12;
    this.container.appendChild(r.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b0a16);
    this.scene.fog = new THREE.Fog(0x241c3a, 70, 320);

    this.camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 800);
    this.camera.position.set(-10, 8, 11);

    const c = (this.controls = new OrbitControls(this.camera, r.domElement));
    c.enableDamping = true;
    c.dampingFactor = 0.06;
    c.enablePan = false;
    c.rotateSpeed = 0.55;
    c.zoomSpeed = 0.7;
    c.maxPolarAngle = 1.5;
    c.autoRotate = true;
    c.autoRotateSpeed = 0.35;
    this._applyView(1);

    const rt = new THREE.WebGLRenderTarget(w * r.getPixelRatio(), h * r.getPixelRatio(), { type: THREE.HalfFloatType, samples: 4 });
    this.composer = new EffectComposer(r, rt);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.4, 0.6, 0.9);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.useComposer = !low;

    this.tg = new TextureGenerator(this.quality);
    this.tex = {
      beam: this.tg.createBeamTexture(),
      glow: this.tg.createGlowTexture(),
      pallet: this.tg.createWoodPalletTexture(),
      wall: this.tg.createWallTexture(),
    };
    this._materials();
    this._buildLights();
    this._buildWarehouse();
    this._buildDesk();
    this._buildRacks();
    this._buildPalletZone();
    this._buildGate();
    this._buildYard();
    this._buildReefer();
    this._buildKiosk();
    this._buildForkliftYard();
    this._buildTruck();
    this._buildStage3();
    this._buildStage4();
    this._buildDust();
    this._buildHotspots();
    this._events();
    if (low) this._applyLowLights();

    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  _applyView(stage) {
    const v = VIEWS[stage], c = this.controls;
    c.target.set(...v.target);
    c.maxDistance = v.maxDist;
    c.minDistance = v.minDist;
    c.minPolarAngle = v.minPolar;
  }

  // ------------------------------------------------------------------
  _materials() {
    const S = (o) => new THREE.MeshStandardMaterial(o);
    this.M = {
      steel: S({ color: 0x8b949e, metalness: 0.75, roughness: 0.38 }),
      dark: S({ color: 0x1c2026, metalness: 0.6, roughness: 0.5 }),
      rubber: S({ color: 0x0e0f11, roughness: 0.9 }),
      yellow: S({ color: 0xf2b400, metalness: 0.3, roughness: 0.45 }),
      orange: S({ color: 0xf26a1b, metalness: 0.35, roughness: 0.5 }),
      blue: S({ color: 0x1d55c9, metalness: 0.45, roughness: 0.45 }),
      white: S({ color: 0xe9edf1, metalness: 0.2, roughness: 0.45 }),
      red: S({ color: 0xc8202d, metalness: 0.2, roughness: 0.5 }),
      concrete: S({ color: 0x8a8f96, roughness: 0.92 }),
      plastic: S({ color: 0x2a2f37, roughness: 0.6 }),
      glass: S({ color: 0x0c1a26, metalness: 0.9, roughness: 0.12 }),
      wood: S({ map: this.tex.pallet, roughness: 0.85 }),
      wall: S({ map: this.tex.wall, metalness: 0.35, roughness: 0.62 }),
      drum: S({ color: 0x1a5fd0, metalness: 0.4, roughness: 0.4 }),
      cone: S({ color: 0xff5a10, roughness: 0.6 }),
    };
    const tones = ['#b98d5c', '#a87f52', '#c49a68'];
    this.boxMats = tones.map((tone, i) => {
      const t = this.tg.createBoxTexture({ sku: 'SKU ' + (120 + i * 137), title: ['INSUMOS CLÍNICOS', 'MATERIAL ESTÉRIL', 'EQUIPO MÉDICO'][i], lote: '', tone, seed: i + 2 });
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(2, 2);
      return S({ map: t, roughness: 0.85 });
    });
  }

  _emi(color, intensity = 2.2) {
    return new THREE.MeshStandardMaterial({ color: 0x0a0a0a, emissive: color, emissiveIntensity: intensity, roughness: 0.4 });
  }

  _screen(tex, intensity = 0.95) {
    return new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: intensity, roughness: 0.3 });
  }

  _box(w, h, d, mat, x, y, z, parent = this.scene, cast = true) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = cast;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }

  _cyl(rt, rb, h, mat, x, y, z, parent = this.scene, seg = 18) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }

  _plane(w, h, mat, x, y, z, rotY = 0, parent = this.scene) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z);
    m.rotation.y = rotY;
    parent.add(m);
    return m;
  }

  _sign(text, opts, w, h, x, y, z, rotY = 0, glow = 0.55, parent = this.scene) {
    const tex = this.tg.createSignTexture(text, opts);
    return this._plane(w, h, this._screen(tex, glow), x, y, z, rotY, parent);
  }

  _beam(from, to, r0, r1, color = 0xfff0cc, op = 0.11) {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
    const geo = new THREE.CylinderGeometry(r0, r1, a.distanceTo(b), 28, 1, true);
    const mat = new THREE.MeshBasicMaterial({ color, map: this.tex.beam, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
    const m = new THREE.Mesh(geo, mat);
    m.position.copy(a).lerp(b, 0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), a.clone().sub(b).normalize());
    this.scene.add(m);
    return m;
  }

  _glow(color, size, x, y, z, parent = this.scene, op = 0.8) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.tex.glow, color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    s.scale.set(size, size, 1);
    s.position.set(x, y, z);
    parent.add(s);
    return s;
  }

  _wheel(r, w, x, y, z, parent) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 22), this.M.rubber);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.55, r * 0.55, w + 0.03, 6), this.M.steel);
    hub.rotation.z = Math.PI / 2;
    g.add(tire, hub);
    parent.add(g);
    return g;
  }

  _pallet(x, y, z, parent = this.scene, rotY = 0) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = rotY;
    this._box(1.2, 0.04, 1.0, this.M.wood, 0, 0.14, 0, g);
    this._box(1.2, 0.03, 1.0, this.M.wood, 0, 0.015, 0, g, false);
    for (const dx of [-0.52, 0, 0.52]) this._box(0.14, 0.09, 1.0, this.M.wood, dx, 0.075, 0, g, false);
    parent.add(g);
    return g;
  }

  _stack(x, y, z, w, h, d, mat, parent = this.scene, rotY = 0) {
    const m = this._box(w, h, d, mat, x, y + h / 2, z, parent);
    m.rotation.y = rotY;
    return m;
  }

  // ------------------------------------------------------------------
  // ILUMINACIÓN DUAL (interior + patio) — PointLights con decay = 0
  _buildLights() {
    this.hemi = new THREE.HemisphereLight(0xcfe1ff, 0x2a2420, 1.25);
    this.scene.add(this.hemi);

    const mk = (color, int, pos, target, range) => {
      const d = new THREE.DirectionalLight(color, int);
      d.position.set(...pos);
      d.target.position.set(...target);
      d.castShadow = true;
      d.shadow.mapSize.set(2048, 2048);
      const sc = d.shadow.camera;
      sc.left = -range; sc.right = range; sc.top = range; sc.bottom = -range;
      sc.near = 1; sc.far = 140;
      d.shadow.bias = -0.0004;
      d.shadow.normalBias = 0.04;
      this.scene.add(d, d.target);
      return d;
    };
    this.dirIn = mk(0xe6f0ff, 1.5, [9, 26, 12], [0, 0, 0], 26);
    this.dirOut = mk(0xffb27a, 1.9, [-34, 30, -86], [0, 0, -40], 38);

    this.pointLights = [];
    const pl = (color, int, x, y, z, dist) => {
      const p = new THREE.PointLight(color, int, dist, 0); // decay = 0: sin decaimiento oscuro
      p.position.set(x, y, z);
      this.scene.add(p);
      this.pointLights.push(p);
      return p;
    };
    pl(0xfff1d6, 0.42, -10, 8.5, 0, 34);
    pl(0xfff1d6, 0.42, 10, 8.5, 0, 34);
    pl(0xdfeaff, 0.3, 0, 8.5, -9, 30);
    pl(0xdfeaff, 0.3, 0, 8.5, 9, 30);
    pl(0xcfe4ff, 0.6, -25, 12, -20, 52);
    pl(0xcfe4ff, 0.6, 25, 12, -20, 52);
    pl(0xcfe4ff, 0.6, -25, 12, -58, 52);
    pl(0xcfe4ff, 0.6, 25, 12, -58, 52);
  }

  _applyLowLights() {
    this.dirIn.castShadow = false;
    this.dirOut.castShadow = false;
    this.pointLights.forEach((p, i) => (p.visible = i % 2 === 0));
    this.hemi.intensity = 1.7;
  }

  // ------------------------------------------------------------------
  // ETAPA 1 · BODEGA INTERNA
  _buildWarehouse() {
    const floorTex = this.tg.createFloorTexture();
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.5, metalness: 0.1 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const W = this.M.wall;
    this._box(0.3, 11, 30.6, W, -20.15, 5.5, 0, this.scene, false);
    this._box(0.3, 11, 30.6, W, 20.15, 5.5, 0, this.scene, false);
    this._box(40, 11, 0.3, W, 0, 5.5, 15.15, this.scene, false);
    this._box(15.5, 11, 0.3, W, -12.25, 5.5, -15.15, this.scene, false);
    this._box(15.5, 11, 0.3, W, 12.25, 5.5, -15.15, this.scene, false);
    this._box(9, 4.6, 0.3, W, 0, 8.7, -15.15, this.scene, false);
    this._box(40.6, 0.3, 30.6, this.M.dark, 0, 11.15, 0, this.scene, false);
    // Zócalo de seguridad
    const sk = new THREE.MeshStandardMaterial({ color: 0x2b3038, roughness: 0.8 });
    this._box(0.06, 1.1, 30, sk, -19.97, 0.55, 0, this.scene, false);
    this._box(0.06, 1.1, 30, sk, 19.97, 0.55, 0, this.scene, false);
    this._box(40, 1.1, 0.06, sk, 0, 0.55, 14.97, this.scene, false);

    // Columnas y cerchas
    for (const x of [-19.7, 19.7]) for (const z of [-10, 0, 10]) this._box(0.4, 11, 0.4, this.M.dark, x, 5.5, z, this.scene, false);
    for (const z of [-10, -3.3, 3.3, 10]) {
      this._box(39.6, 0.3, 0.3, this.M.dark, 0, 10.7, z, this.scene, false);
      this._box(39.6, 0.12, 0.12, this.M.steel, 0, 10.05, z, this.scene, false);
      for (let x = -18; x <= 18; x += 4) this._box(0.08, 0.6, 0.08, this.M.steel, x, 10.38, z, this.scene, false);
    }

    // Luminarias cenitales con haces volumétricos
    const lampMat = this._emi(0xfff3d8, 3.2);
    for (const x of [-11, 0, 11]) for (const z of [-6.5, 6.5]) {
      this._box(0.05, 0.9, 0.05, this.M.dark, x, 9.75, z, this.scene, false);
      this._box(2.4, 0.16, 0.6, this.M.dark, x, 9.3, z, this.scene, false);
      this._box(2.2, 0.05, 0.45, lampMat, x, 9.2, z, this.scene, false);
      this._beam([x, 9.15, z], [x, 0.02, z], 0.5, 3.4, 0xfff0cc, 0.1);
    }

    // Señalética
    this._sign('ZONA A · ALMACENAJE', { sub: 'ROTACIÓN FIFO / PEPS — PRIMERO EN ENTRAR, PRIMERO EN SALIR', fg: '#f2c200' }, 9, 2.25, 19.95, 8.7, 0, -Math.PI / 2, 0.5);
    this._sign('CONTROL DOCUMENTAL', { sub: 'ÓRDENES DE COMPRA · GUÍAS DE DESPACHO', fg: '#3de8ff' }, 7, 1.75, -19.95, 5.6, 4, Math.PI / 2, 0.5);
    this._sign('ANDÉN 01 · DESPACHO', { sub: 'INGRESE CÓDIGO MAESTRO PARA LIBERAR', fg: '#ff4458', hazard: true }, 8.4, 2.1, 0, 8.4, -14.97, 0, 0.6);
    this._sign('SEGURIDAD PRIMERO', { sub: 'USO OBLIGATORIO DE EPP EN TODA LA BODEGA', fg: '#35f0a0' }, 7, 1.75, -9, 7.8, 14.95, Math.PI, 0.45);
    this._sign('ANDESCARGO', { sub: 'CENTRO DE DISTRIBUCIÓN · LOGÍSTICA MÉDICA', fg: '#3de8ff', w: 1024, h: 256 }, 14, 3.5, 0, 8.7, -15.34, Math.PI, 0.7);

    // Decoración: grúa interior, stock y extintores
    const fk = this._forklift(this.M.yellow);
    fk.position.set(-10.5, 0, -8.5);
    fk.rotation.y = 0.9;
    this.scene.add(fk);
    const spots = [[-6, 12.6, 0.1], [-3.6, 12.8, -0.15], [4, 12.7, 0.2], [6.6, 12.5, 0], [9.2, 12.8, -0.1], [-17.6, -11, 1.57], [-17.5, -8.3, 1.5]];
    spots.forEach(([x, z, ry], i) => {
      this._pallet(x, 0, z, this.scene, ry);
      this._stack(x, 0.16, z, 1.05, 0.9 + (i % 3) * 0.35, 0.9, this.boxMats[i % 3], this.scene, ry);
    });
    for (const [x, z] of [[12.5, 13.6], [13.4, 13.9], [12.9, 12.7]]) {
      this._cyl(0.3, 0.3, 0.9, this.M.drum, x, 0.45, z);
      this._cyl(0.31, 0.31, 0.05, this.M.steel, x, 0.72, z);
    }
    for (const [x, z, ry] of [[-19.8, -2, 0], [19.8, 11.5, 0]]) {
      this._cyl(0.11, 0.11, 0.55, this.M.red, x + (x < 0 ? 0.18 : -0.18), 1.3, z);
      this._box(0.04, 0.6, 0.5, this.M.white, x + (x < 0 ? 0.03 : -0.03), 2.1, z, this.scene, false).rotation.y = ry;
    }
  }

  _forklift(bodyMat) {
    const g = new THREE.Group();
    const M = this.M;
    this._box(1.2, 0.8, 1.8, bodyMat, 0, 0.75, -0.2, g);
    this._box(1.22, 0.95, 0.55, M.dark, 0, 0.8, -1.25, g);
    this._box(0.9, 0.12, 0.6, M.plastic, 0, 1.2, -0.45, g);
    this._box(0.9, 0.55, 0.1, M.plastic, 0, 1.5, -0.75, g);
    for (const [x, z] of [[-0.55, 0.55], [0.55, 0.55], [-0.55, -1.0], [0.55, -1.0]]) this._box(0.06, 1.1, 0.06, M.dark, x, 1.7, z, g);
    this._box(1.2, 0.06, 1.7, M.dark, 0, 2.27, -0.22, g);
    const st = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.025, 8, 20), M.rubber);
    st.position.set(0, 1.38, 0.22); st.rotation.x = -1.0;
    g.add(st);
    this._wheel(0.34, 0.26, -0.62, 0.34, 0.45, g);
    this._wheel(0.34, 0.26, 0.62, 0.34, 0.45, g);
    this._wheel(0.27, 0.22, -0.58, 0.27, -1.05, g);
    this._wheel(0.27, 0.22, 0.58, 0.27, -1.05, g);
    for (const x of [-0.42, 0.42]) this._box(0.1, 2.9, 0.14, M.dark, x, 1.5, 0.82, g);
    this._box(0.94, 0.1, 0.1, M.dark, 0, 2.9, 0.82, g);
    this._box(0.94, 0.1, 0.1, M.dark, 0, 1.4, 0.82, g);
    this._cyl(0.05, 0.05, 1.8, M.steel, 0, 1.2, 0.8, g, 10);
    this._box(1.0, 0.5, 0.06, M.dark, 0, 0.5, 0.93, g);
    // Horquillas a 15–20 cm del suelo
    for (const x of [-0.3, 0.3]) {
      this._box(0.12, 0.05, 1.15, M.steel, x, 0.18, 1.5, g);
      this._box(0.12, 0.42, 0.05, M.steel, x, 0.38, 0.96, g);
    }
    const bc = this._cyl(0.08, 0.09, 0.14, this._emi(0xff8a1f, 2.6), 0.4, 2.37, -0.8, g, 12);
    bc.castShadow = false;
    g.userData.beacon = bc;
    return g;
  }

  _buildDesk() {
    const g = new THREE.Group();
    g.position.set(-15.6, 0, 4);
    const M = this.M;
    const top = new THREE.MeshStandardMaterial({ color: 0x3a2c22, roughness: 0.55, metalness: 0.1 });
    this._box(1.3, 0.07, 3.3, top, 0, 0.95, 0, g);
    this._box(1.2, 0.9, 0.06, M.dark, 0, 0.47, -1.55, g);
    this._box(1.2, 0.9, 0.06, M.dark, 0, 0.47, 1.55, g);
    this._box(0.06, 0.6, 3.1, M.dark, -0.55, 0.62, 0, g);
    this._box(0.5, 0.6, 0.6, M.steel, 0.25, 0.6, 1.15, g);

    this.monTex = [this.tg.createMonitorTexture('alert', 0), this.tg.createMonitorTexture('alert', 1)];
    this.monMats = this.monTex.map((t) => this._screen(t, 1.0));
    [-0.72, 0.72].forEach((z, i) => {
      const mg = new THREE.Group();
      mg.position.set(-0.22, 1.62, z);
      mg.rotation.y = Math.PI / 2 + (i ? -0.2 : 0.2);
      this._box(1.32, 0.84, 0.06, M.plastic, 0, 0, -0.035, mg);
      this._plane(1.24, 0.775, this.monMats[i], 0, 0, 0.001, 0, mg);
      this._box(0.08, 0.36, 0.06, M.dark, 0, -0.56, -0.06, mg);
      this._box(0.4, 0.03, 0.26, M.dark, 0, -0.74, -0.03, mg);
      g.add(mg);
    });
    this._box(0.2, 0.025, 0.56, M.plastic, 0.28, 1.0, 0, g, false);
    this._box(0.09, 0.03, 0.06, M.plastic, 0.3, 1.0, 0.45, g, false);
    this._cyl(0.045, 0.04, 0.11, M.white, 0.35, 1.04, -0.7, g, 12);
    this._box(0.24, 0.05, 0.32, M.white, 0.25, 1.0, -1.15, g, false).rotation.y = 0.2;
    this._box(0.24, 0.02, 0.32, this.M.yellow, 0.27, 1.04, -1.14, g, false).rotation.y = -0.1;
    // Lámpara de escritorio
    this._cyl(0.07, 0.09, 0.03, M.dark, -0.35, 1.0, 1.4, g, 12);
    this._cyl(0.012, 0.012, 0.5, M.steel, -0.35, 1.25, 1.4, g, 6);
    this._box(0.08, 0.04, 0.3, this._emi(0x9fe8ff, 2.4), -0.3, 1.5, 1.3, g, false);
    // Silla
    const ch = new THREE.Group();
    ch.position.set(1.25, 0, 0.2);
    ch.rotation.y = -0.5;
    this._cyl(0.03, 0.03, 0.45, M.steel, 0, 0.3, 0, ch, 8);
    this._cyl(0.3, 0.3, 0.04, M.dark, 0, 0.06, 0, ch, 5);
    this._box(0.5, 0.08, 0.5, M.plastic, 0, 0.56, 0, ch);
    this._box(0.08, 0.6, 0.48, M.plastic, 0.25, 0.92, 0, ch);
    g.add(ch);
    // Archivador
    this._box(0.6, 1.5, 0.9, M.steel, -4 + 0.2, 0.75, -2.6 + 0.2, g);
    this.scene.add(g);
    this._glow(0x3de8ff, 3.2, -15.2, 1.7, 4, this.scene, 0.22);
  }

  _buildRacks() {
    const M = this.M;
    const rack = (x, zStart, bays, featured = false, dir = -1) => {
      const bw = 2.8, levels = [2.3, 4.7, 7.1];
      for (let i = 0; i <= bays; i++) {
        const z = zStart + i * bw;
        for (const dx of [-0.55, 0.55]) this._box(0.1, 7.7, 0.1, M.blue, x + dx, 3.85, z);
        this._box(1.1, 0.05, 0.05, M.blue, x, 1.2, z, this.scene, false);
        this._box(1.1, 0.05, 0.05, M.blue, x, 3.6, z, this.scene, false);
        this._box(1.1, 0.05, 0.05, M.blue, x, 6.0, z, this.scene, false);
      }
      for (const y of levels) for (const dx of [-0.55, 0.55]) this._box(0.07, 0.14, bays * bw, M.orange, x + dx, y, zStart + (bays * bw) / 2);
      const r = (n) => ((Math.sin(n * 91.7 + x) + 1) * 5000) % 1;
      for (let i = 0; i < bays; i++) {
        const zc = zStart + i * bw + bw / 2;
        [0, ...levels.map((l) => l + 0.07)].forEach((y, lv) => {
          if (featured && lv === 0 && i >= 2 && i <= 4) return;
          if (lv === 3 && r(i * 7 + lv) > 0.7) return;
          for (const dz of [-0.66, 0.66]) {
            if (r(i * 13 + lv * 5 + dz) > 0.86) continue;
            this._pallet(x, y, zc + dz, this.scene, Math.PI / 2);
            const h = 0.75 + r(i * 3 + lv + dz * 2) * 0.75;
            this._stack(x, y + 0.16, zc + dz, 0.95, Math.min(h, lv === 3 ? 1.6 : 1.5), 1.08, this.boxMats[Math.floor(r(i + lv * 3 + dz) * 3)]);
          }
        });
      }
    };
    rack(17.8, -9.8, 7, true);
    rack(-17.8, -13.4, 3, false, 1);

    // Pallets destacados de la Estación 02 (FIFO)
    const lots = [
      { z: -2.8, lote: 'LOTE #14', fecha: '15/10/2026', sku: 'SKU 517', title: 'SUERO FISIOLÓGICO 500 ML' },
      { z: 0, lote: 'LOTE #19', fecha: '02/09/2026', sku: 'SKU 517', title: 'SUERO FISIOLÓGICO 500 ML' },
      { z: 2.8, lote: 'LOTE #22', fecha: '05/11/2026', sku: 'SKU 517', title: 'SUERO FISIOLÓGICO 500 ML' },
    ];
    this.lotTags = {};
    lots.forEach((L, i) => {
      this._pallet(17.7, 0, L.z, this.scene, Math.PI / 2);
      const tex = this.tg.createBoxTexture({ ...L, seed: 40 + i });
      const face = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 });
      const side = this.boxMats[i % 3];
      const m = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.25, 1.25), [side, face, side, side, side, side]);
      m.position.set(17.7, 0.16 + 0.625, L.z);
      m.castShadow = true; m.receiveShadow = true;
      this.scene.add(m);
      const tag = this._sign(`${L.lote} · ING. ${L.fecha}`, { w: 1024, h: 200, fg: '#ffb020', font: '"JetBrains Mono", monospace' }, 2.3, 0.45, 17.16, 2.02, L.z, -Math.PI / 2, 0.8);
      this.lotTags[L.lote] = tag;
    });
  }

  _buildPalletZone() {
    this._pallet(0, 0, 2);
    this._stack(0, 0.16, 2, 1.1, 0.95, 0.92, this.boxMats[0]);
    this._stack(-0.26, 1.11, 2.02, 0.56, 0.42, 0.9, this.boxMats[2]);
    // Tablet rugerizada TMS
    this.tabletTex = this.tg.createTabletTexture(false);
    this.tabletMat = this._screen(this.tabletTex, 1.05);
    const tb = new THREE.Group();
    tb.position.set(0.28, 1.36, 2.12);
    tb.rotation.set(-0.62, 0.3, 0);
    this._box(0.5, 0.7, 0.04, this.M.rubber, 0, 0, 0, tb);
    this._box(0.54, 0.74, 0.02, this.M.yellow, 0, 0, -0.02, tb, false);
    this._plane(0.44, 0.62, this.tabletMat, 0, 0, 0.022, 0, tb);
    this.scene.add(tb);
    this._glow(0x3de8ff, 1.8, 0.3, 1.5, 2.3, this.scene, 0.25);
    // Pallets envueltos alrededor
    const film = new THREE.MeshStandardMaterial({ color: 0x8fa6b8, transparent: true, opacity: 0.16, roughness: 0.35, metalness: 0.1 });
    for (const [x, z, h, ry] of [[-2.5, 1.0, 1.35, 0.15], [2.4, 0.4, 1.1, -0.2], [-2.3, 3.4, 0.85, 0.05], [2.5, 3.2, 1.45, 0.1]]) {
      this._pallet(x, 0, z, this.scene, ry);
      this._stack(x, 0.16, z, 1.08, h, 0.92, this.boxMats[Math.floor(Math.abs(x * z)) % 3], this.scene, ry);
      const f = this._stack(x, 0.16, z, 1.14, h + 0.02, 0.98, film, this.scene, ry);
      f.castShadow = false;
    }
    // Transpaleta manual
    const tj = new THREE.Group();
    tj.position.set(1.3, 0, 5.2);
    tj.rotation.y = 2.5;
    for (const x of [-0.22, 0.22]) this._box(0.16, 0.06, 1.2, this.M.red, x, 0.1, 0.4, tj);
    this._box(0.6, 0.35, 0.25, this.M.red, 0, 0.25, -0.25, tj);
    const hd = this._cyl(0.02, 0.02, 1.1, this.M.dark, 0, 0.75, -0.42, tj, 8);
    hd.rotation.x = -0.35;
    this.scene.add(tj);
  }

  _buildGate() {
    const M = this.M;
    const hz = new THREE.MeshStandardMaterial({ map: this.tg.createSignTexture('', { w: 128, h: 512, bg: '#f2c200', fg: '#f2c200', border: '#15171a' }), roughness: 0.6 });
    for (const x of [-4.7, 4.7]) this._box(0.34, 6.1, 0.5, hz, x, 3.05, -14.95);
    this._box(10.2, 0.8, 0.9, M.dark, 0, 6.5, -14.95);
    // Tambor de enrollado
    this.gateDrum = new THREE.Group();
    this.gateDrum.position.set(0, 6.5, -14.95);
    for (const x of [-5.18, 5.18]) {
      const d = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.14, 8), M.steel);
      d.rotation.z = Math.PI / 2;
      d.position.x = x;
      this.gateDrum.add(d);
      this._box(0.16, 0.5, 0.08, M.yellow, x, 0, 0, this.gateDrum, false);
    }
    this.scene.add(this.gateDrum);
    // Cortina metálica (pivote en el cabezal superior)
    this.gateTex = this.tg.createGateTexture();
    const geo = new THREE.PlaneGeometry(9.1, 6.1);
    geo.translate(0, -3.05, 0);
    this.gate = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: this.gateTex, metalness: 0.55, roughness: 0.5, side: THREE.DoubleSide }));
    this.gate.position.set(0, 6.1, -15.02);
    this.gate.castShadow = true;
    this.scene.add(this.gate);
    // Barra de estado y baliza
    this.gateStrip = this._box(9, 0.1, 0.06, this._emi(COL.red, 2.6), 0, 6.02, -14.72, this.scene, false);
    this._box(0.3, 0.1, 0.3, M.dark, 5.7, 3.4, -14.82, this.scene, false);
    this.beaconMat = this._emi(COL.red, 3);
    this.beacon = new THREE.Mesh(new THREE.SphereGeometry(0.17, 18, 14), this.beaconMat);
    this.beacon.position.set(5.7, 3.6, -14.72);
    this.scene.add(this.beacon);
    this.beaconLight = new THREE.PointLight(COL.red, 1.2, 16, 0);
    this.beaconLight.position.set(5.7, 3.7, -13.9);
    this.scene.add(this.beaconLight);
    this.beaconGlow = this._glow(COL.red, 2.2, 5.7, 3.6, -14.6, this.scene, 0.7);
    // Panel numérico
    this._box(0.74, 1.1, 0.14, M.dark, 5.7, 1.65, -14.92);
    this.keypadTex1 = this.tg.createKeypadTexture('locked', 'ANDÉN 01');
    this.keypadMat1 = this._screen(this.keypadTex1, 0.75);
    this._plane(0.64, 0.96, this.keypadMat1, 5.7, 1.65, -14.845);
    this.gateOpen = false;
  }

  // ------------------------------------------------------------------
  // ETAPA 2 · PATIO DE MANIOBRAS Y EMBARQUE EXTERIOR
  _buildYard() {
    const M = this.M;
    const yard = new THREE.Mesh(new THREE.PlaneGeometry(60, 50), new THREE.MeshStandardMaterial({ map: this.tg.createYardFloorTexture(), roughness: 0.62, metalness: 0.08 }));
    yard.rotation.x = -Math.PI / 2;
    yard.position.set(0, 0, -40);
    yard.receiveShadow = true;
    this.scene.add(yard);
    const terrain = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshStandardMaterial({ color: 0x17161f, roughness: 1 }));
    terrain.rotation.x = -Math.PI / 2;
    terrain.position.set(0, -0.06, -40);
    this.scene.add(terrain);
    // Ruta 5 Sur
    const road = new THREE.Mesh(new THREE.PlaneGeometry(8, 240), new THREE.MeshStandardMaterial({ color: 0x24262c, roughness: 0.8 }));
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, -0.03, -185);
    this.scene.add(road);
    for (let z = -70; z > -300; z -= 9) this._box(0.18, 0.02, 3.2, this._emi(0xfff2b0, 0.9), 0, -0.01, z, this.scene, false);

    // Cielo: atardecer sobre los Andes
    const sky = new THREE.Mesh(new THREE.SphereGeometry(520, 48, 24), new THREE.MeshBasicMaterial({ map: this.tg.createSkyTexture(), side: THREE.BackSide, fog: false, toneMapped: false }));
    sky.position.set(0, -4, -40);
    this.scene.add(sky);

    // 4 torres de iluminación LED con haces volumétricos
    const led = this._emi(0xe6f4ff, 4);
    for (const [x, z] of [[-25, -20], [25, -20], [-25, -58], [25, -58]]) {
      this._cyl(0.16, 0.26, 13, M.steel, x, 6.5, z, this.scene, 10);
      this._box(0.9, 0.5, 0.9, M.concrete, x, 0.25, z);
      const head = new THREE.Group();
      head.position.set(x, 13, z);
      head.lookAt(0, 0, -40);
      this._box(2.6, 1.0, 0.3, M.dark, 0, 0, 0, head);
      for (const dx of [-0.85, 0, 0.85]) this._box(0.7, 0.75, 0.06, led, dx, 0, 0.17, head, false);
      this.scene.add(head);
      this._beam([x * 0.97, 12.9, z + (z > -40 ? -0.6 : 0.6)], [x * 0.52, 0.02, -40 + (z + 40) * 0.5], 0.7, 8, 0xdcefff, 0.075);
      this._glow(0xdcefff, 7, x * 0.97, 13, z, this.scene, 0.75);
    }
    // Cerchas luminosas superiores
    for (const z of [-20, -58]) {
      this._box(50, 0.35, 0.35, M.dark, 0, 12.2, z, this.scene, false);
      this._box(50, 0.1, 0.1, M.steel, 0, 11.6, z, this.scene, false);
      for (let x = -24; x <= 24; x += 3) this._box(0.07, 0.6, 0.07, M.steel, x, 11.9, z, this.scene, false);
      this._box(46, 0.05, 0.14, this._emi(0x9fe8ff, 2.4), 0, 11.5, z, this.scene, false);
    }

    // Pórtico SALIDA RUTA 5 SUR + barrera
    for (const x of [-5.6, 5.6]) {
      this._box(0.5, 7.4, 0.5, M.dark, x, 3.7, -62);
      this._hazardBase(x, -62);
    }
    this._box(12.2, 0.6, 0.6, M.dark, 0, 7.4, -62);
    this._sign('SALIDA RUTA 5 SUR', { sub: '↑ SANTIAGO · RANCAGUA · TALCA ↑', bg: '#0b5d34', fg: '#ffffff', border: '#ffffff' }, 9.4, 2.35, 0, 5.95, -61.6, 0, 0.75);
    this.sigRed = this._cyl(0.2, 0.2, 0.08, this._emi(COL.red, 3.2), -5.6, 4.6, -61.7, this.scene, 16);
    this.sigRed.rotation.x = Math.PI / 2;
    this.sigGreen = this._cyl(0.2, 0.2, 0.08, this._emi(COL.green, 0.05), -5.6, 4.05, -61.7, this.scene, 16);
    this.sigGreen.rotation.x = Math.PI / 2;
    this.barrier = new THREE.Group();
    this.barrier.position.set(-4.9, 1.15, -60.6);
    const armTex = this.tg.createSignTexture('', { w: 512, h: 32, bg: '#ffffff', fg: '#fff', border: '#d91a28' });
    const arm = this._box(9, 0.14, 0.14, new THREE.MeshStandardMaterial({ map: armTex, color: 0xffd9d9, roughness: 0.5 }), 4.5, 0, 0, this.barrier);
    arm.castShadow = true;
    this.scene.add(this.barrier);
    this._box(0.5, 1.2, 0.5, M.yellow, -5.0, 0.6, -60.6);

    // Contenedores apilados y defensas camineras
    const cont = (x, y, z, color, label, ry = 0) => {
      const side = new THREE.MeshStandardMaterial({ map: this.tg.createContainerTexture(color, label, '', { w: 1024, h: 256 }), metalness: 0.4, roughness: 0.6 });
      const end = new THREE.MeshStandardMaterial({ color, metalness: 0.4, roughness: 0.6 });
      const m = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.7, 12), [side, side, end, end, end, end]);
      m.position.set(x, y, z);
      m.rotation.y = ry;
      m.castShadow = true; m.receiveShadow = true;
      this.scene.add(m);
    };
    cont(26.8, 1.35, -38, '#a63f2b', 'HAPAG-SUR');
    cont(26.8, 4.05, -38.6, '#1f5fa8', 'PACÍFICO LINE');
    cont(-26.8, 1.35, -56, '#2f7d4f', 'ANDES FREIGHT');
    cont(-26.8, 1.35, -24, '#c9892b', 'CORDILLERA CARGO');
    cont(-26.8, 4.05, -24.4, '#6b3fa0', 'AUSTRAL');
    cont(22, 1.35, -60.5, '#1f5fa8', 'PACÍFICO LINE', Math.PI / 2);
    for (const x of [-29.6, 29.6]) for (let z = -18; z >= -64; z -= 4.2) {
      if (Math.abs(x) > 0) this._box(0.5, 0.8, 3.6, M.concrete, x, 0.4, z, this.scene, false);
    }
    for (let x = -28; x <= 28; x += 4.2) if (Math.abs(x) > 6) this._box(3.6, 0.8, 0.5, M.concrete, x, 0.4, -64.7, this.scene, false);
  }

  _hazardBase(x, z) {
    if (!this._hzMat) this._hzMat = new THREE.MeshStandardMaterial({ map: this.tg.createSignTexture('', { w: 256, h: 256, bg: '#15171a', fg: '#000', border: '#f2c200', hazard: true }), roughness: 0.7 });
    this._box(0.9, 0.9, 0.9, this._hzMat, x, 0.45, z);
  }

  _buildReefer() {
    const M = this.M;
    const g = new THREE.Group();
    g.position.set(-16, 0, -38);
    const side = new THREE.MeshStandardMaterial({ map: this.tg.createContainerTexture('#e8eef2', 'REEFER BIO-MÉDICO', 'CADENA DE FRÍO · VACUNAS Y SUEROS TERMOSENSIBLES', { w: 2048, h: 512, fg: '#0b6f8c', stripe: '#2fe6ff' }), metalness: 0.35, roughness: 0.5 });
    const plain = new THREE.MeshStandardMaterial({ color: 0xdfe6ea, metalness: 0.35, roughness: 0.5 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.9, 12), [side, side, plain, plain, plain, plain]);
    body.position.y = 1.65;
    body.castShadow = true; body.receiveShadow = true;
    g.add(body);
    for (const x of [-1.1, 1.1]) for (const z of [-5.6, 5.6]) this._box(0.3, 0.2, 0.3, M.dark, x, 0.1, z, g);
    // Unidad de refrigeración (frente hacia la bodega)
    this._box(2.5, 2.75, 0.45, M.white, 0, 1.65, 6.2, g);
    this._box(2.1, 1.0, 0.08, M.dark, 0, 2.3, 6.45, g, false);
    for (const x of [-0.55, 0.55]) {
      const f = this._cyl(0.42, 0.42, 0.06, M.steel, x, 2.3, 6.5, g, 20);
      f.rotation.x = Math.PI / 2;
      const blade = this._box(0.72, 0.1, 0.02, M.dark, x, 2.3, 6.54, g, false);
      this.spin.push({ o: blade, axis: 'z', speed: 9 });
    }
    this._box(2.1, 0.9, 0.06, M.plastic, 0, 1.0, 6.44, g, false);
    this._box(2.6, 0.08, 0.5, this._emi(0x2fe6ff, 2.2), 0, 3.14, 6.2, g, false);
    // Termógrafo exterior (cara +x)
    this._box(0.1, 1.15, 1.05, M.dark, 1.34, 1.75, 3.5, g);
    this.coldTex = this.tg.createColdChamberTexture('11.4', false);
    this.coldMat = this._screen(this.coldTex, 1.0);
    this._plane(0.92, 0.92, this.coldMat, 1.4, 1.78, 3.5, Math.PI / 2, g);
    this.reeferLamp = this._cyl(0.09, 0.09, 0.12, this._emi(COL.red, 3), 1.36, 2.55, 3.5, g, 12);
    this.reeferGlow = this._glow(COL.red, 1.6, 1.5, 2.55, 3.5, g, 0.7);
    // Cable de poder y tablero
    this._box(0.5, 1.3, 0.3, M.steel, 2.6, 0.65, 6.6, g);
    this._box(0.3, 0.3, 0.02, this._emi(COL.green, 1.6), 2.6, 1.0, 6.76, g, false);
    this.scene.add(g);
  }

  _buildKiosk() {
    const M = this.M;
    const g = new THREE.Group();
    g.position.set(14, 0, -30);
    g.rotation.y = Math.atan2(10.2 - 14, -25.9 + 30);
    this._box(1.4, 0.12, 1.0, M.dark, 0, 0.06, 0, g);
    this._box(0.55, 1.25, 0.3, M.plastic, 0, 0.7, 0, g);
    const head = new THREE.Group();
    head.position.set(0, 1.85, 0.06);
    head.rotation.x = -0.18;
    this._box(1.9, 1.24, 0.14, M.dark, 0, 0, 0, head);
    this.abcTex = this.tg.createAbcScreenTexture(false);
    this.abcMat = this._screen(this.abcTex, 1.0);
    this._plane(1.76, 1.1, this.abcMat, 0, 0, 0.075, 0, head);
    g.add(head);
    this._box(2.2, 0.08, 1.2, M.dark, 0, 2.75, 0, g);
    for (const x of [-1.0, 1.0]) this._box(0.06, 2.7, 0.06, M.steel, x, 1.35, -0.45, g);
    this._box(2.2, 0.04, 0.06, this._emi(0xb06bff, 2.6), 0, 2.69, 0.55, g, false);
    this.scene.add(g);
    this._glow(0xb06bff, 3, 13.4, 1.9, -29.4, this.scene, 0.22);
    // Bultos de las tres familias junto al kiosco
    for (const [x, z, h, i] of [[16.4, -27.8, 1.2, 2], [16.5, -30.2, 0.9, 0], [16.3, -32.4, 1.45, 1]]) {
      this._pallet(x, 0, z);
      this._stack(x, 0.16, z, 1.05, h, 0.9, this.boxMats[i]);
    }
  }

  _buildForkliftYard() {
    const M = this.M;
    const fk = (this.yardForklift = this._forklift(this.M.orange));
    fk.position.set(13.2, 0, -47.6);
    fk.rotation.y = 1.15;
    this.scene.add(fk);
    // Bidones de alcohol isopropílico al 70 % sobre pallet
    this._pallet(16.3, 0, -46.3, this.scene, 0.25);
    for (const [dx, dz] of [[-0.28, -0.24], [0.28, -0.2], [-0.24, 0.26], [0.3, 0.28]]) {
      this._cyl(0.25, 0.25, 0.82, M.drum, 16.3 + dx, 0.57, -46.3 + dz, this.scene, 16);
      this._cyl(0.255, 0.255, 0.16, M.white, 16.3 + dx, 0.6, -46.3 + dz, this.scene, 16);
      this._cyl(0.06, 0.06, 0.06, M.red, 16.3 + dx + 0.1, 1.0, -46.3 + dz, this.scene, 8);
    }
    // Cajas con rombo rojo Clase 3 (NCh 2190)
    const hzTex = this.tg.createBoxTexture({ sku: 'SKU 771', title: 'ALCOHOL ISOPROPÍLICO 70%', lote: 'LOTE #59', fecha: '', hazard: true, seed: 59 });
    const hzMat = new THREE.MeshStandardMaterial({ map: hzTex, roughness: 0.85 });
    this._pallet(18.6, 0, -48.2, this.scene, -0.3);
    const b1 = this._stack(18.6, 0.16, -48.2, 1.05, 1.05, 0.95, hzMat, this.scene, -0.3);
    this._pallet(18.9, 0, -44.2, this.scene, 0.5);
    this._stack(18.9, 0.16, -44.2, 1.05, 1.05, 0.95, hzMat, this.scene, 0.5);
    this._stack(18.9, 1.21, -44.2, 1.05, 1.05, 0.95, hzMat, this.scene, 0.62);
    b1.castShadow = true;
    // Letrero de seguridad
    this._box(0.08, 2.2, 0.08, M.steel, 20.6, 1.1, -50.8);
    this._sign('EPP OBLIGATORIO', { sub: 'CASCO · CALZADO · CHALECO · CINTURÓN', fg: '#ff8a1f', w: 1024, h: 512, hazard: true }, 2.2, 1.1, 20.6, 2.5, -50.75, -0.5, 0.5);
    // Conos de seguridad
    for (const [x, z] of [[10.4, -44.6], [11.2, -50.6], [14.6, -51.8], [18.4, -51.4], [21.2, -46.6], [14.2, -42.2]]) {
      this._box(0.42, 0.04, 0.42, M.cone, x, 0.02, z);
      const c = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.62, 14), M.cone);
      c.position.set(x, 0.35, z);
      c.castShadow = true;
      this.scene.add(c);
      this._cyl(0.092, 0.118, 0.12, M.white, x, 0.36, z, this.scene, 14);
    }
  }

  _buildTruck() {
    const M = this.M;
    const g = (this.truck = new THREE.Group());
    g.position.set(0, 0, -44);
    this._box(2.0, 0.26, 7.3, M.dark, 0, 0.78, 0.2, g);
    const sideTex = this.tg.createContainerTexture('#f0f3f6', 'ANDESCARGO', 'LOGÍSTICA MÉDICA · FLOTA 72', { w: 1024, h: 512, fg: '#0d3d6b', stripe: '#3de8ff' });
    const side = new THREE.MeshStandardMaterial({ map: sideTex, metalness: 0.3, roughness: 0.5 });
    const rear = new THREE.MeshStandardMaterial({ map: this.tg.createContainerTexture('#f0f3f6', 'FLOTA 72', 'CAMIÓN 3/4 · 2.500 KG · 14 PALLETS', { w: 512, h: 512, fg: '#0d3d6b', stripe: '#f2c200' }), metalness: 0.3, roughness: 0.5 });
    const cargo = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.75, 5.3), [side, side, M.white, M.white, rear, M.white]);
    cargo.position.set(0, 2.3, 1.0);
    cargo.castShadow = true; cargo.receiveShadow = true;
    g.add(cargo);
    // Cabina
    this._box(2.36, 1.15, 1.9, M.white, 0, 1.45, -2.75, g);
    this._box(2.3, 0.95, 1.55, M.white, 0, 2.45, -2.58, g);
    const ws = this._box(2.1, 0.8, 0.06, M.glass, 0, 2.45, -3.4, g, false);
    ws.rotation.x = 0.22;
    for (const x of [-1.16, 1.16]) this._box(0.04, 0.6, 1.0, M.glass, x, 2.5, -2.7, g, false);
    this._box(2.4, 0.3, 0.2, M.dark, 0, 0.75, -3.72, g);
    this._box(1.4, 0.5, 0.06, M.dark, 0, 1.25, -3.72, g, false);
    this._box(2.3, 0.5, 1.0, M.white, 0, 3.15, -2.3, g);
    for (const x of [-1.38, 1.38]) this._box(0.1, 0.34, 0.2, M.dark, x, 2.3, -3.3, g, false);
    this.headMat = this._emi(0xfff3c8, 0.4);
    for (const x of [-0.88, 0.88]) this._box(0.36, 0.2, 0.06, this.headMat, x, 1.2, -3.73, g, false);
    this.headGlows = [-0.88, 0.88].map((x) => this._glow(0xfff0c0, 2.4, x, 1.2, -3.9, g, 0));
    const tail = this._emi(COL.red, 1.6);
    for (const x of [-1.0, 1.0]) this._box(0.3, 0.16, 0.05, tail, x, 0.82, 3.86, g, false);
    this._box(2.4, 0.12, 0.1, M.yellow, 0, 0.62, 3.86, g, false);
    this._box(1.9, 0.12, 0.34, this._emi(0xff8a1f, 1.4), 0, 3.48, -2.9, g, false);
    this.truckWheels = [];
    for (const [x, z] of [[-1.06, -2.7], [1.06, -2.7], [-1.0, 2.3], [1.0, 2.3], [-1.26, 2.3], [1.26, 2.3]]) this.truckWheels.push(this._wheel(0.48, 0.26, x, 0.48, z, g));
    this.scene.add(g);

    // Consola de salida en pedestal
    const cg = new THREE.Group();
    cg.position.set(4.7, 0, -38);
    cg.rotation.y = Math.atan2(8.4 - 4.7, -31.6 + 38);
    this._box(0.7, 0.1, 0.6, M.dark, 0, 0.05, 0, cg);
    this._box(0.3, 1.15, 0.24, M.yellow, 0, 0.62, 0, cg);
    const hd = new THREE.Group();
    hd.position.set(0, 1.62, 0.04);
    hd.rotation.x = -0.25;
    this._box(0.8, 1.14, 0.14, M.dark, 0, 0, 0, hd);
    this.keypadTex2 = this.tg.createKeypadTexture('locked', 'FLOTA 72');
    this.keypadMat2 = this._screen(this.keypadTex2, 0.8);
    this._plane(0.68, 1.02, this.keypadMat2, 0, 0, 0.075, 0, hd);
    cg.add(hd);
    this.consoleLamp = this._cyl(0.08, 0.08, 0.12, this._emi(COL.red, 3), 0, 2.28, 0, cg, 12);
    this.scene.add(cg);
  }

  // ------------------------------------------------------------------
  // ETAPA 3 · CIERRE DE TURNO (auditoría de inventario dentro de la bodega)
  _buildStage3() {
    const M = this.M;
    const mono = '"JetBrains Mono", monospace';
    // Estación 09: hoja de conteo en el rack oeste
    this.countTag = this._sign('CONTEO CÍCLICO · SKU 517 · WMS: 340', { w: 1024, h: 200, fg: '#b06bff', font: mono }, 3.2, 0.62, -17.16, 2.02, -9.2, Math.PI / 2, 0.8);
    // Estación 10: etiquetas de ubicación en el nivel 3 del rack Zona A
    this.locTags = {};
    [['A-05-3', -8.4], ['A-06-3', -5.6], ['A-07-3', -2.8]].forEach(([code, z]) => {
      this.locTags[code] = this._sign(code, { w: 512, h: 200, fg: '#b06bff', font: mono }, 1.15, 0.45, 17.16, 4.42, z, -Math.PI / 2, 0.8);
    });
    // Estación 11: rack de reposición vacío contra el muro sur
    for (const x of [-16, -13.2, -10.4]) for (const z of [13.6, 14.6]) this._box(0.1, 5.4, 0.1, M.blue, x, 2.7, z);
    for (const y of [1.9, 3.7]) for (const z of [13.6, 14.6]) this._box(5.6, 0.14, 0.07, M.orange, -13.2, y, z);
    this._sign('RACK R-11 · REPOSICIÓN', { sub: 'HUECO ÚTIL 2,4 × 1,2 × 1,2 m · ASIGNAR POR PESO Y ROTACIÓN', fg: '#b06bff' }, 5.4, 1.35, -13.2, 6.1, 14.9, Math.PI, 0.55);
    ['NIVEL ALTO', 'NIVEL MEDIO · PICKING', 'NIVEL PISO'].forEach((t, i) => {
      this._sign(t, { w: 1024, h: 160, fg: '#ffb020', font: mono }, 2.2, 0.34, -16.9 + 1.2, [4.05, 2.25, 0.5][i], 13.52, Math.PI, 0.7);
    });
    this._pallet(-14.9, 0, 11.9, this.scene, 0.2);
    for (const [dx, dz] of [[-0.27, -0.2], [0.27, -0.18], [0, 0.26]]) {
      this._cyl(0.24, 0.24, 0.7, M.drum, -14.9 + dx, 0.51, 11.9 + dz, this.scene, 14);
      this._cyl(0.245, 0.245, 0.14, M.white, -14.9 + dx, 0.55, 11.9 + dz, this.scene, 14);
    }
    this._pallet(-13.0, 0, 12.1, this.scene, -0.1);
    this._stack(-13.0, 0.16, 12.1, 1.0, 0.7, 0.85, this.boxMats[1], this.scene, -0.1);
    this._pallet(-11.2, 0, 11.8, this.scene, 0.3);
    this._stack(-11.2, 0.16, 11.8, 0.8, 0.45, 0.7, this.boxMats[2], this.scene, 0.3);
    // Estación 12: tótem de cierre de turno
    const cg = new THREE.Group();
    cg.position.set(-5.5, 0, -11.6);
    this._box(0.7, 0.1, 0.6, M.dark, 0, 0.05, 0, cg);
    this._box(0.3, 1.15, 0.24, M.blue, 0, 0.62, 0, cg);
    const hd = new THREE.Group();
    hd.position.set(0, 1.62, 0.04);
    hd.rotation.x = -0.25;
    this._box(0.8, 1.14, 0.14, M.dark, 0, 0, 0, hd);
    this.keypadTex3 = this.tg.createKeypadTexture('locked', 'CIERRE TURNO');
    this.keypadMat3 = this._screen(this.keypadTex3, 0.8);
    this._plane(0.68, 1.02, this.keypadMat3, 0, 0, 0.075, 0, hd);
    cg.add(hd);
    this.closeLamp = this._cyl(0.08, 0.08, 0.12, this._emi(COL.purple, 3), 0, 2.28, 0, cg, 12);
    this.scene.add(cg);
  }

  // ------------------------------------------------------------------
  // ETAPA 4 · CENTRO DE CONTROL Y RADIOFRECUENCIA (esquina noreste de la bodega)
  _buildStage4() {
    const M = this.M;
    const mono = '"JetBrains Mono", monospace';
    // Estación 13: tres pallets etiquetados y lector RF en trípode
    [12.0, 13.4, 14.8].forEach((x, i) => {
      this._pallet(x, 0, -8.4, this.scene, 0.05 * (i - 1));
      const tex = this.tg.createBoxTexture({ sku: 'SKU ' + ['408', '517', '245'][i], title: ['GUANTES QUIRÚRGICOS', 'SUERO FISIOLÓGICO', 'JERINGAS 5 ML'][i], lote: 'PALLET 4' + (i + 1), seed: 70 + i });
      const face = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 });
      const side = this.boxMats[i % 3];
      const m = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.0, 0.9), [side, side, side, side, face, side]);
      m.position.set(x, 0.66, -8.4);
      m.castShadow = true; m.receiveShadow = true;
      this.scene.add(m);
    });
    this._cyl(0.02, 0.02, 1.3, M.dark, 13.4, 0.65, -6.9, this.scene, 8);
    this._cyl(0.22, 0.26, 0.04, M.dark, 13.4, 0.02, -6.9, this.scene, 10);
    this._box(0.16, 0.24, 0.1, M.yellow, 13.4, 1.38, -6.9);
    this.rfBeam = this._box(0.012, 0.012, 1.05, new THREE.MeshBasicMaterial({ color: new THREE.Color(COL.red).multiplyScalar(1.6), fog: false }), 13.4, 1.36, -7.45, this.scene, false);
    this.rfBeam.rotation.x = 0.42;
    this.rfBeam.position.y = 1.14;
    // Estación 14: terminal WMS
    const top = new THREE.MeshStandardMaterial({ color: 0x2a3340, roughness: 0.5, metalness: 0.3 });
    this._box(2.4, 0.07, 0.9, top, 11.5, 0.95, -13.5);
    for (const x of [10.4, 12.6]) this._box(0.07, 0.92, 0.8, M.dark, x, 0.47, -13.5);
    this._box(1.5, 0.92, 0.05, M.dark, 11.5, 1.48, -13.78);
    this.wmsMat = this._screen(this.tg.createSignTexture('WMS · REGISTRO DE SALIDA', { sub: 'TRANSACCIÓN PENDIENTE · ORDEN OD-2217', fg: '#ff5fa2', w: 1024, h: 640 }), 1.0);
    this._plane(1.42, 0.86, this.wmsMat, 11.5, 1.48, -13.75);
    this._box(0.1, 0.5, 0.06, M.dark, 11.5, 1.1, -13.8);
    this._box(0.56, 0.025, 0.2, M.plastic, 11.5, 1.0, -13.25, this.scene, false);
    // Antena de radiofrecuencia
    this._cyl(0.05, 0.07, 6.4, M.steel, 16.6, 3.2, -14.2, this.scene, 8);
    for (const y of [5.6, 6.1]) this._box(0.5, 0.12, 0.16, M.white, 16.6, y, -14.1);
    this.rfLamp = this._cyl(0.06, 0.06, 0.1, this._emi(COL.pink, 3.2), 16.6, 6.5, -14.2, this.scene, 10);
    this.rfGlow = this._glow(COL.pink, 1.6, 16.6, 6.5, -14.1, this.scene, 0.7);
    // Estación 15: panel mural de indicadores
    this._box(3.9, 2.05, 0.1, M.dark, 15.2, 3.6, -14.93);
    this.kpiMat = this._screen(this.tg.createSignTexture('NIVEL DE SERVICIO: -- %', { sub: 'META 95% · PEDIDOS COMPLETOS Y A TIEMPO · SEMANA 46', fg: '#ff5fa2', w: 1024, h: 512 }), 0.9);
    this._plane(3.7, 1.85, this.kpiMat, 15.2, 3.6, -14.87);
    this._sign('CENTRO DE CONTROL RF', { sub: 'INFORMAR Y COMUNICAR DATOS DE ENTRADA Y SALIDA', fg: '#ff5fa2' }, 6.4, 1.6, 12.4, 6.3, -14.96, 0, 0.5);
    // Estación 16: consola de control
    const cg = new THREE.Group();
    cg.position.set(8, 0, -13.2);
    this._box(0.7, 0.1, 0.6, M.dark, 0, 0.05, 0, cg);
    this._box(0.3, 1.15, 0.24, M.red, 0, 0.62, 0, cg);
    const hd = new THREE.Group();
    hd.position.set(0, 1.62, 0.04);
    hd.rotation.x = -0.25;
    this._box(0.8, 1.14, 0.14, M.dark, 0, 0, 0, hd);
    this.keypadTex4 = this.tg.createKeypadTexture('locked', 'CONTROL RF');
    this.keypadMat4 = this._screen(this.keypadTex4, 0.8);
    this._plane(0.68, 1.02, this.keypadMat4, 0, 0, 0.075, 0, hd);
    cg.add(hd);
    this.ctrlLamp = this._cyl(0.08, 0.08, 0.12, this._emi(COL.pink, 3), 0, 2.28, 0, cg, 12);
    this.scene.add(cg);
  }

  // Cambio de etapa dentro de la bodega (corte de plano con fundido previo)
  goToStage(n, onDone) {
    const v = VIEWS[n];
    this._cine(true);
    gsap.killTweensOf([this.camera.position, this.controls.target]);
    this.controls.target.set(...v.target);
    this.camera.position.set(v.cam[0] * 0.3, v.cam[1] + 2.5, v.cam[2] * 0.4);
    gsap.to(this.camera.position, {
      x: v.cam[0], y: v.cam[1], z: v.cam[2], duration: 2.6, ease: 'power2.inOut', delay: 0.3,
      onComplete: () => {
        this.setStage(n);
        this._applyView(n);
        this._cine(false);
        this.markersHidden = true;
        onDone && onDone();
      },
    });
  }

  _buildDust() {
    const mk = (n, box, size, color, op) => {
      const pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        pos[i * 3] = box[0] + Math.random() * (box[1] - box[0]);
        pos[i * 3 + 1] = box[2] + Math.random() * (box[3] - box[2]);
        pos[i * 3 + 2] = box[4] + Math.random() * (box[5] - box[4]);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const p = new THREE.Points(geo, new THREE.PointsMaterial({ map: this.tex.glow, size, color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true }));
      p.userData.box = box;
      this.scene.add(p);
      return p;
    };
    const low = this.quality === 'low';
    this.dust = [mk(low ? 300 : 900, [-19, 19, 0.2, 9.5, -14, 14], 0.07, 0xfff0d0, 0.55), mk(low ? 200 : 700, [-28, 28, 0.3, 13, -63, -17], 0.1, 0xdcefff, 0.45)];
  }

  // ------------------------------------------------------------------
  // HOTSPOTS: anillos holográficos 3D + marcadores DOM proyectados
  _buildHotspots() {
    for (const [id, st] of Object.entries(STATIONS)) {
      const color = [COL.cyan, COL.amber, COL.purple, COL.pink][st.stage - 1];
      const g = new THREE.Group();
      g.position.set(...st.pos);
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(1.5), transparent: true, opacity: 0.95, fog: false });
      const t1 = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.018, 8, 48), mat);
      const t2 = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.012, 8, 40), mat);
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.11), mat);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.9, 6), mat);
      stem.position.y = -0.75;
      g.add(t1, t2, core, stem);
      g.userData = { t1, t2, core, mat };
      g.visible = false;
      this.scene.add(g);
      this.rings[id] = g;

      const [px, py, pz, w, h, d] = st.pick;
      const pick = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
      pick.position.set(px, py, pz);
      pick.userData.station = +id;
      this.scene.add(pick);
      this.picks.push(pick);

      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'hotspot-marker stage-' + st.stage;
      el.dataset.station = id;
      el.setAttribute('aria-label', `Estación ${st.num}: ${st.name}`);
      el.innerHTML = `<span class="hm-pulse"></span><span class="hm-core">${st.num}</span><span class="hm-label">${st.name}</span>`;
      el.style.display = 'none';
      el.addEventListener('click', (e) => { e.stopPropagation(); this._select(+id); });
      this.layer.appendChild(el);
      this.markers[id] = el;
    }
  }

  _select(id) {
    if (!this.started || this.cinematic || STATIONS[id].stage !== this.stage) return;
    if (this.onSelect) this.onSelect(id);
  }

  _events() {
    const dom = this.renderer.domElement;
    const ray = new THREE.Raycaster();
    const p = new THREE.Vector2();
    let down = null;
    const hit = (e) => {
      const r = dom.getBoundingClientRect();
      p.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(p, this.camera);
      const list = this.picks.filter((m) => STATIONS[m.userData.station].stage === this.stage);
      const h = ray.intersectObjects(list, false)[0];
      return h ? h.object.userData.station : null;
    };
    dom.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; this.controls.autoRotate = this.started ? false : this.controls.autoRotate; });
    dom.addEventListener('pointerup', (e) => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      down = null;
      if (moved > 7 || !this.started || this.cinematic) return;
      const id = hit(e);
      if (id) this._select(id);
    });
    let last = 0;
    dom.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || !this.started || this.cinematic) return;
      const now = performance.now();
      if (now - last < 60) return;
      last = now;
      dom.style.cursor = hit(e) ? 'pointer' : 'grab';
    });
    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
  }

  // ------------------------------------------------------------------
  // API pública
  start() {
    this.started = true;
    this.controls.autoRotate = false;
    this.setStage(1);
    this._cine(true);
    const v = VIEWS[1];
    gsap.to(this.camera.position, {
      x: v.cam[0], y: v.cam[1], z: v.cam[2], duration: 2.6, ease: 'power2.inOut',
      onComplete: () => { this._cine(false); this._perfN = 0; this._perfT = 0; this._perfOn = true; },
    });
  }

  setStage(n) {
    this.stage = n;
    for (const [id, g] of Object.entries(this.rings)) g.visible = STATIONS[id].stage === n;
  }

  _cine(on) {
    this.cinematic = on;
    this.controls.enabled = !on;
    this.markersHidden = on;
    if (!on) this.controls.update();
  }

  focusStation(id, onArrive) {
    const st = STATIONS[id];
    this._saved = this.camera.position.clone();
    this._cine(true);
    gsap.killTweensOf([this.camera.position, this.controls.target]);
    gsap.to(this.camera.position, { x: st.cam[0], y: st.cam[1], z: st.cam[2], duration: 1.5, ease: 'power3.inOut' });
    gsap.to(this.controls.target, { x: st.look[0], y: st.look[1], z: st.look[2], duration: 1.5, ease: 'power3.inOut', onComplete: () => onArrive && onArrive() });
  }

  resetCamera(force = false, onDone) {
    const v = VIEWS[this.stage];
    const to = !force && this._saved ? this._saved : new THREE.Vector3(...v.cam);
    this._saved = null;
    this._cine(true);
    gsap.killTweensOf([this.camera.position, this.controls.target]);
    gsap.to(this.camera.position, { x: to.x, y: to.y, z: to.z, duration: 1.3, ease: 'power3.inOut' });
    gsap.to(this.controls.target, {
      x: v.target[0], y: v.target[1], z: v.target[2], duration: 1.3, ease: 'power3.inOut',
      onComplete: () => { this._cine(false); onDone && onDone(); },
    });
  }

  _swap(mat, oldTex, newTex) {
    mat.map = newTex;
    mat.emissiveMap = newTex;
    mat.needsUpdate = true;
    if (oldTex) oldTex.dispose();
    return newTex;
  }

  markSolved(id) {
    this.solved.add(+id);
    const ring = this.rings[id];
    ring.userData.mat.color.set(COL.green).multiplyScalar(1.5);
    this.markers[id].classList.add('solved');
    gsap.fromTo(ring.scale, { x: 2.2, y: 2.2, z: 2.2 }, { x: 1, y: 1, z: 1, duration: 0.9, ease: 'elastic.out(1,0.5)' });
    switch (+id) {
      case 1:
        this.monTex = this.monTex.map((t, i) => this._swap(this.monMats[i], t, this.tg.createMonitorTexture('ok', i)));
        break;
      case 2: {
        const tag = this.lotTags['LOTE #19'];
        const tex = this.tg.createSignTexture('LOTE #19 · FIFO ✓ SALE PRIMERO', { w: 1024, h: 200, fg: '#35f0a0', font: '"JetBrains Mono", monospace' });
        this._swap(tag.material, tag.material.map, tex);
        tag.material.emissiveIntensity = 1.3;
        break;
      }
      case 3:
        this.tabletTex = this._swap(this.tabletMat, this.tabletTex, this.tg.createTabletTexture(true));
        break;
      case 4:
        this.keypadTex1 = this._swap(this.keypadMat1, this.keypadTex1, this.tg.createKeypadTexture('open', 'ANDÉN 01'));
        break;
      case 5:
        this.coldTex = this._swap(this.coldMat, this.coldTex, this.tg.createColdChamberTexture('04.0', true));
        this.reeferLamp.material.emissive.set(COL.green);
        this.reeferGlow.material.color.set(COL.green);
        break;
      case 6:
        this.abcTex = this._swap(this.abcMat, this.abcTex, this.tg.createAbcScreenTexture(true));
        break;
      case 7:
        this.yardForklift.userData.beacon.material.emissive.set(COL.green);
        break;
      case 8:
        this.keypadTex2 = this._swap(this.keypadMat2, this.keypadTex2, this.tg.createKeypadTexture('open', 'FLOTA 72'));
        this.consoleLamp.material.emissive.set(COL.green);
        break;
      case 9:
        this._swap(this.countTag.material, this.countTag.material.map, this.tg.createSignTexture('CONTEO OK · FÍSICO 313 · FALTANTE 27', { w: 1024, h: 200, fg: '#35f0a0', font: '"JetBrains Mono", monospace' }));
        break;
      case 10: {
        const tag = this.locTags['A-06-3'];
        this._swap(tag.material, tag.material.map, this.tg.createSignTexture('A-06-3 ✓', { w: 512, h: 200, fg: '#35f0a0', font: '"JetBrains Mono", monospace' }));
        tag.material.emissiveIntensity = 1.3;
        break;
      }
      case 12:
        this.keypadTex3 = this._swap(this.keypadMat3, this.keypadTex3, this.tg.createKeypadTexture('open', 'CIERRE TURNO'));
        this.closeLamp.material.emissive.set(COL.green);
        break;
      case 13:
        this.rfBeam.material.color.set(COL.green).multiplyScalar(1.6);
        break;
      case 14:
        this._swap(this.wmsMat, this.wmsMat.map, this.tg.createSignTexture('TRX N° 51 CONFIRMADA', { sub: 'SALIDA COMUNICADA AL WMS · ORDEN OD-2217', fg: '#35f0a0', w: 1024, h: 640 }));
        break;
      case 15:
        this._swap(this.kpiMat, this.kpiMat.map, this.tg.createSignTexture('NIVEL DE SERVICIO: 90 %', { sub: 'BAJO META 95% · 36 DE 40 PEDIDOS · INFORMADO A JEFATURA', fg: '#ffb020', w: 1024, h: 512 }));
        break;
      case 16:
        this.keypadTex4 = this._swap(this.keypadMat4, this.keypadTex4, this.tg.createKeypadTexture('open', 'CONTROL RF'));
        this.ctrlLamp.material.emissive.set(COL.green);
        this.rfLamp.material.emissive.set(COL.green);
        this.rfGlow.material.color.set(COL.green);
        break;
    }
  }

  // Transición Etapa 2 → Etapa 3: la cámara vuelve a la bodega, cae la noche
  // y el portón se cierra. Quien llama debe fundir a negro antes (corte de plano).
  returnToWarehouse(onDone) {
    this._cine(true);
    gsap.killTweensOf([this.camera.position, this.controls.target]);
    const cam = this.camera.position, tg = this.controls.target, rep = this.gateTex.repeat;
    cam.set(0, 3.2, -30);
    tg.set(0, 2.8, 0);
    this.truck.visible = false;
    const v = VIEWS[3];
    const tl = gsap.timeline({
      onComplete: () => {
        this.gateOpen = false;
        this.setStage(3);
        this._applyView(3);
        this._cine(false);
        this.markersHidden = true;
        onDone && onDone();
      },
    });
    tl.to(cam, { x: 0, y: 3.3, z: -5, duration: 3.6, ease: 'power1.inOut' }, 0.3)
      .to(this.dirOut, { intensity: 0.45, duration: 5 }, 0)
      .to(this.hemi, { intensity: this.hemi.intensity * 0.82, duration: 5 }, 0)
      .to(cam, { x: v.cam[0], y: v.cam[1], z: v.cam[2], duration: 2.8, ease: 'power2.inOut' }, 3.9)
      .to(tg, { x: 0, y: 2, z: 0, duration: 2.8, ease: 'power2.inOut' }, 3.9)
      .to(this.gate.scale, { y: 1, duration: 2.8, ease: 'power1.inOut' }, 4.2)
      .to(rep, { y: 1, duration: 2.8, ease: 'power1.inOut' }, 4.2)
      .to(this.gateDrum.rotation, { x: 0, duration: 2.8, ease: 'power1.inOut' }, 4.2);
  }

  // Transición cinematográfica Etapa 1 → Etapa 2
  openGateAndCross(onDone) {
    this._cine(true);
    this.gateOpen = true;
    gsap.killTweensOf([this.camera.position, this.controls.target]);
    this.beaconMat.emissive.set(COL.green);
    this.beaconLight.color.set(COL.green);
    this.beaconGlow.material.color.set(COL.green);
    this.gateStrip.material.emissive.set(COL.green);
    const cam = this.camera.position, tg = this.controls.target, rep = this.gateTex.repeat;
    const tl = gsap.timeline({
      onComplete: () => {
        this.setStage(2);
        this._applyView(2);
        this._cine(false);
        this.markersHidden = true;
        onDone && onDone();
      },
    });
    tl.to(cam, { x: 0, y: 3.4, z: -1.5, duration: 1.8, ease: 'power2.inOut' }, 0)
      .to(tg, { x: 0, y: 3.1, z: -15, duration: 1.8, ease: 'power2.inOut' }, 0)
      .to(this.gate.scale, { y: 0.035, duration: 3.4, ease: 'power1.inOut' }, 1.3)
      .to(rep, { y: 0.035, duration: 3.4, ease: 'power1.inOut' }, 1.3)
      .to(this.gateDrum.rotation, { x: -Math.PI * 7, duration: 3.4, ease: 'power1.inOut' }, 1.3)
      .to(cam, { x: 0, y: 3.0, z: -25, duration: 3.8, ease: 'power1.inOut' }, 4.2)
      .to(tg, { x: 0, y: 2.6, z: -46, duration: 3.8, ease: 'power1.inOut' }, 4.2)
      .to(cam, { x: VIEWS[2].cam[0], y: VIEWS[2].cam[1], z: VIEWS[2].cam[2], duration: 2.6, ease: 'power2.inOut' }, 8.0)
      .to(tg, { x: 0, y: 2, z: -40, duration: 2.6, ease: 'power2.inOut' }, 8.0);
  }

  showMarkers(on = true) { this.markersHidden = !on; }

  // Despacho final: el Camión 3/4 Flota 72 sale hacia la Ruta 5 Sur
  dispatchTruck(onDone) {
    this._cine(true);
    gsap.killTweensOf([this.camera.position, this.controls.target]);
    const cam = this.camera.position, tg = this.controls.target, tr = this.truck.position;
    this.sigRed.material.emissiveIntensity = 0.05;
    this.sigGreen.material.emissiveIntensity = 3.4;
    this.headMat.emissiveIntensity = 4;
    this.headGlows.forEach((s) => gsap.to(s.material, { opacity: 0.9, duration: 0.6 }));
    this.truckMoving = true;
    const tl = gsap.timeline({ onComplete: () => { this.truckMoving = false; onDone && onDone(); } });
    tl.to(cam, { x: 9.5, y: 4.2, z: -34, duration: 1.6, ease: 'power2.inOut' }, 0)
      .to(tg, { x: 0, y: 1.8, z: -45, duration: 1.6, ease: 'power2.inOut' }, 0)
      .to(this.barrier.rotation, { z: 1.35, duration: 1.4, ease: 'power2.inOut' }, 0.5)
      .to(tr, { z: -190, duration: 7, ease: 'power2.in' }, 1.6)
      .to(tg, { z: -84, y: 2.4, duration: 6.4, ease: 'power2.in' }, 2.0)
      .to(cam, { x: 6, y: 6.5, z: -30, duration: 6.4, ease: 'power1.inOut' }, 2.0);
  }

  // ------------------------------------------------------------------
  setQuality(q) {
    if (q === this.quality) return;
    this.quality = q;
    const low = q === 'low';
    this.renderer.setPixelRatio(low ? 1 : Math.min(window.devicePixelRatio, 1.75));
    this.renderer.shadowMap.enabled = !low;
    this.useComposer = !low;
    if (low) this._applyLowLights();
    this._resize();
  }

  _updateMarkers() {
    const w = window.innerWidth, h = window.innerHeight;
    for (const [id, el] of Object.entries(this.markers)) {
      const st = STATIONS[id];
      let show = this.started && !this.markersHidden && st.stage === this.stage;
      if (show) {
        this._v.set(st.pos[0], st.pos[1], st.pos[2]).project(this.camera);
        show = this._v.z < 1 && Math.abs(this._v.x) < 1.1 && Math.abs(this._v.y) < 1.1;
        if (show) el.style.transform = `translate(-50%,-50%) translate(${((this._v.x * 0.5 + 0.5) * w).toFixed(1)}px,${((-this._v.y * 0.5 + 0.5) * h).toFixed(1)}px)`;
      }
      const d = show ? '' : 'none';
      if (el.style.display !== d) el.style.display = d;
    }
  }

  _loop() {
    requestAnimationFrame(this._loop);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;

    if (this.cinematic) this.camera.lookAt(this.controls.target);
    else this.controls.update();

    // Baliza intermitente
    const blink = this.gateOpen ? 0.75 + Math.sin(t * 3) * 0.25 : (Math.sin(t * 7) > 0 ? 1 : 0.12);
    this.beaconMat.emissiveIntensity = 3.2 * blink;
    this.beaconLight.intensity = 1.3 * blink;
    this.beaconGlow.material.opacity = 0.75 * blink;
    if (!this.solved.has(5)) this.reeferGlow.material.opacity = Math.sin(t * 6) > 0 ? 0.8 : 0.1;

    // Anillos holográficos
    for (const g of Object.values(this.rings)) {
      if (!g.visible) continue;
      const u = g.userData;
      u.t1.rotation.x = t * 1.1; u.t1.rotation.y = t * 0.7;
      u.t2.rotation.x = -t * 0.9; u.t2.rotation.z = t * 1.3;
      u.core.rotation.y = t * 2;
      u.core.scale.setScalar(1 + Math.sin(t * 4) * 0.2);
    }
    for (const s of this.spin) s.o.rotation[s.axis] += s.speed * dt;
    if (this.truckMoving) {
      const z = this.truck.position.z;
      if (this._tz !== undefined) for (const wv of this.truckWheels) wv.rotation.x += (z - this._tz) / 0.48;
      this._tz = z;
      this.truck.position.y = Math.sin(t * 38) * 0.008;
    }

    // Polvo en suspensión
    for (const p of this.dust) {
      const a = p.geometry.attributes.position, b = p.userData.box;
      for (let i = 0; i < a.count; i++) {
        let y = a.getY(i) + dt * (0.05 + (i % 7) * 0.012);
        if (y > b[3]) y = b[2];
        a.setY(i, y);
        a.setX(i, a.getX(i) + Math.sin(t * 0.4 + i) * dt * 0.05);
      }
      a.needsUpdate = true;
    }

    this._updateMarkers();
    if (this.useComposer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);

    // Calidad adaptativa: si el equipo no rinde, se baja sola
    if (this._perfOn && !document.hidden && this.quality !== 'low') {
      this._perfN++;
      this._perfT += dt;
      if (this._perfN >= 150) {
        if (this._perfT / this._perfN > 1 / 26) {
          this.setQuality('low');
          window.dispatchEvent(new CustomEvent('quality-changed', { detail: 'low' }));
        }
        this._perfOn = false;
      }
    }
  }
}
