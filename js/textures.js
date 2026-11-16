// =====================================================================
// OPERACIÓN DESPACHO CRÍTICO 360° — Texturas 100% procedurales (Canvas 2D)
// Cero imágenes externas: todo se dibuja en memoria y se entrega como
// THREE.CanvasTexture.
// =====================================================================
import * as THREE from 'three';

const FD = 'Orbitron, "Arial Black", sans-serif';
const FM = '"JetBrains Mono", Consolas, monospace';
const FB = 'Inter, "Segoe UI", Arial, sans-serif';

function rng(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function rr(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

export class TextureGenerator {
  constructor(quality = 'high') {
    this.big = quality === 'low' ? 1024 : 2048;
    this.aniso = quality === 'low' ? 2 : 8;
  }

  // ---------- utilidades ----------
  _cv(w, h = w) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return [c, c.getContext('2d')];
  }

  _tex(c, rx, ry) {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = this.aniso;
    if (rx) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(rx, ry ?? rx);
    }
    return t;
  }

  _speckle(g, w, h, n, a, seed = 7) {
    const r = rng(seed);
    for (let i = 0; i < n; i++) {
      const v = r() > 0.5 ? 255 : 0;
      g.fillStyle = `rgba(${v},${v},${v},${r() * a})`;
      const s = 1 + r() * 2.5;
      g.fillRect(r() * w, r() * h, s, s);
    }
  }

  _hazard(g, x, y, w, h, stripe, c1 = '#f2c200', c2 = '#15171a') {
    g.save();
    g.beginPath();
    g.rect(x, y, w, h);
    g.clip();
    g.fillStyle = c2;
    g.fillRect(x, y, w, h);
    g.fillStyle = c1;
    for (let i = -h; i < w + h; i += stripe * 2) {
      g.beginPath();
      g.moveTo(x + i, y + h);
      g.lineTo(x + i + stripe, y + h);
      g.lineTo(x + i + stripe + h, y);
      g.lineTo(x + i + h, y);
      g.fill();
    }
    g.restore();
  }

  // Texto en coordenadas de mundo (metros) sobre un canvas transformado
  _wtext(g, str, x, z, size, color, font = FD, weight = 900, align = 'center') {
    g.save();
    g.translate(x, z);
    g.scale(size / 100, size / 100);
    g.font = `${weight} 100px ${font}`;
    g.textAlign = align;
    g.textBaseline = 'middle';
    g.fillStyle = color;
    g.fillText(str, 0, 0);
    g.restore();
  }

  _fit(g, str, maxW, size, font, weight = 900) {
    let s = size;
    g.font = `${weight} ${s}px ${font}`;
    while (g.measureText(str).width > maxW && s > 10) {
      s -= 2;
      g.font = `${weight} ${s}px ${font}`;
    }
    return s;
  }

  _barcode(g, x, y, w, h, seed) {
    const r = rng(seed);
    g.fillStyle = '#111';
    let cx = x;
    while (cx < x + w) {
      const bw = 1 + Math.floor(r() * 4);
      if (r() > 0.42) g.fillRect(cx, y, bw, h);
      cx += bw + 1;
    }
  }

  // ---------- PISO BODEGA INTERNA (40 x 30 m) ----------
  createFloorTexture() {
    const S = this.big;
    const [c, g] = this._cv(S);
    const grd = g.createLinearGradient(0, 0, S, S);
    grd.addColorStop(0, '#565d66');
    grd.addColorStop(0.5, '#474e57');
    grd.addColorStop(1, '#525962');
    g.fillStyle = grd;
    g.fillRect(0, 0, S, S);
    this._speckle(g, S, S, S * 22, 0.07, 11);

    const r = rng(42);
    for (let i = 0; i < 34; i++) {
      const x = r() * S, y = r() * S, rad = S * (0.05 + r() * 0.12);
      const rg = g.createRadialGradient(x, y, 0, x, y, rad);
      const light = r() > 0.45;
      rg.addColorStop(0, light ? 'rgba(255,255,255,0.055)' : 'rgba(0,0,0,0.09)');
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = rg;
      g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }

    // Sistema de coordenadas en metros: x ∈ [-20,20], z ∈ [-15,15]
    g.save();
    g.setTransform(S / 40, 0, 0, S / 30, S / 2, S / 2);

    // Juntas de dilatación
    g.strokeStyle = 'rgba(14,17,21,0.6)';
    g.lineWidth = 0.05;
    for (let x = -15; x <= 15; x += 5) { g.beginPath(); g.moveTo(x, -15); g.lineTo(x, 15); g.stroke(); }
    for (let z = -10; z <= 10; z += 5) { g.beginPath(); g.moveTo(-20, z); g.lineTo(20, z); g.stroke(); }

    // Huellas de rodadura (grúa horquilla)
    g.lineCap = 'round';
    const tracks = [
      [[-0.9, -14], [-1.5, -6], [8, -2], [14.5, -1]],
      [[0.9, -14], [1, -5], [9, 2], [14.5, 2.5]],
      [[-10, -8], [-6, -3], [-3, 0], [-0.8, 1.6]],
      [[-1, -13], [-3, -4], [-9, 2], [-13, 6]],
      [[14, 9], [6, 10], [-4, 8], [-12, 10]],
    ];
    for (const t of tracks) {
      for (const off of [-0.45, 0.45]) {
        g.strokeStyle = 'rgba(8,8,10,0.2)';
        g.lineWidth = 0.26;
        g.beginPath();
        g.moveTo(t[0][0] + off, t[0][1]);
        g.bezierCurveTo(t[1][0] + off, t[1][1], t[2][0] + off, t[2][1], t[3][0] + off, t[3][1]);
        g.stroke();
      }
    }

    // Líneas amarillas perimetrales
    g.strokeStyle = '#f2c200';
    g.lineWidth = 0.16;
    g.strokeRect(-18.9, -13.9, 37.8, 27.8);

    // Pasillo peatonal verde (costado oeste)
    g.fillStyle = 'rgba(30,150,95,0.55)';
    g.fillRect(-18.7, 8.2, 14, 1.4);
    g.strokeStyle = '#e8e8e8';
    g.lineWidth = 0.08;
    g.strokeRect(-18.7, 8.2, 14, 1.4);
    this._wtext(g, 'PASO PEATONAL', -11.7, 8.92, 0.55, 'rgba(255,255,255,0.85)');

    // Pasillo de racks Zona A
    g.strokeStyle = '#f2c200';
    g.lineWidth = 0.14;
    g.beginPath(); g.moveTo(16.3, -11.5); g.lineTo(16.3, 11.5); g.stroke();
    g.setLineDash([0.9, 0.6]);
    g.beginPath(); g.moveTo(13.2, -11.5); g.lineTo(13.2, 11.5); g.stroke();
    g.setLineDash([]);
    g.save();
    g.translate(14.75, 7.2);
    g.rotate(-Math.PI / 2);
    this._wtext(g, 'ZONA A', 0, 0, 1.1, 'rgba(242,194,0,0.9)');
    g.restore();

    // Zona de paletizado central
    g.fillStyle = 'rgba(242,194,0,0.07)';
    g.fillRect(-4.2, -0.8, 8.4, 5.8);
    g.strokeStyle = '#f2c200';
    g.lineWidth = 0.14;
    g.setLineDash([0.7, 0.4]);
    g.strokeRect(-4.2, -0.8, 8.4, 5.8);
    g.setLineDash([]);
    this._wtext(g, 'ZONA DE PALETIZADO', 0, 5.6, 0.62, 'rgba(242,194,0,0.92)');

    // Zona cebreada frente al andén
    this._hazard(g, -4.6, -14.9, 9.2, 3.4, 0.55);
    g.fillStyle = 'rgba(21,23,26,0.92)';
    g.fillRect(-2.7, -13.75, 5.4, 1.15);
    this._wtext(g, 'ANDÉN 01', 0, -13.15, 0.82, '#f2c200');

    // Flechas de flujo hacia el andén
    g.fillStyle = 'rgba(255,255,255,0.75)';
    for (const z of [-9.6, -7.2]) {
      g.beginPath();
      g.moveTo(0, z - 0.9); g.lineTo(0.75, z); g.lineTo(0.25, z); g.lineTo(0.25, z + 0.8);
      g.lineTo(-0.25, z + 0.8); g.lineTo(-0.25, z); g.lineTo(-0.75, z);
      g.closePath(); g.fill();
    }

    // Centro de control RF (esquina noreste)
    g.fillStyle = 'rgba(255,95,162,0.06)';
    g.fillRect(6.8, -14.6, 9.6, 7.6);
    g.strokeStyle = '#ff5fa2';
    g.lineWidth = 0.1;
    g.strokeRect(6.8, -14.6, 9.6, 7.6);
    this._wtext(g, 'CONTROL RF', 9.4, -6.5, 0.5, 'rgba(255,95,162,0.85)');

    // Zona de control documental
    g.strokeStyle = '#3de8ff';
    g.lineWidth = 0.1;
    g.strokeRect(-18.4, 1.4, 6.4, 5.2);
    this._wtext(g, 'CONTROL', -15.2, 7.1, 0.5, 'rgba(61,232,255,0.85)');
    g.restore();

    // Desgaste final
    const r2 = rng(99);
    g.strokeStyle = 'rgba(255,255,255,0.05)';
    g.lineWidth = 1;
    for (let i = 0; i < 260; i++) {
      const x = r2() * S, y = r2() * S, a = r2() * Math.PI, l = 10 + r2() * 60;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
    return this._tex(c);
  }

  // ---------- PAVIMENTO PATIO EXTERIOR (60 x 50 m, x∈[-30,30], z∈[-65,-15]) ----------
  createYardFloorTexture() {
    const S = this.big;
    const [c, g] = this._cv(S);
    g.fillStyle = '#34383f';
    g.fillRect(0, 0, S, S);
    this._speckle(g, S, S, S * 30, 0.1, 5);
    const r = rng(17);
    for (let i = 0; i < 40; i++) {
      const x = r() * S, y = r() * S, rad = S * (0.04 + r() * 0.1);
      const rg = g.createRadialGradient(x, y, 0, x, y, rad);
      rg.addColorStop(0, r() > 0.5 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.14)');
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = rg;
      g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }

    g.save();
    g.setTransform(S / 60, 0, 0, S / 50, S / 2, (65 / 50) * S);

    // Losas
    g.strokeStyle = 'rgba(10,12,15,0.55)';
    g.lineWidth = 0.07;
    for (let x = -24; x <= 24; x += 6) { g.beginPath(); g.moveTo(x, -65); g.lineTo(x, -15); g.stroke(); }
    for (let z = -60; z <= -20; z += 5) { g.beginPath(); g.moveTo(-30, z); g.lineTo(30, z); g.stroke(); }

    // Grietas
    g.strokeStyle = 'rgba(8,8,10,0.5)';
    g.lineWidth = 0.04;
    for (let i = 0; i < 14; i++) {
      let x = -28 + r() * 56, z = -63 + r() * 46;
      g.beginPath(); g.moveTo(x, z);
      for (let k = 0; k < 7; k++) { x += (r() - 0.5) * 2.2; z += (r() - 0.5) * 2.2; g.lineTo(x, z); }
      g.stroke();
    }

    const bay = (x, z, w, d, col, fill, label, sub) => {
      g.fillStyle = fill;
      g.fillRect(x, z, w, d);
      g.save();
      g.beginPath(); g.rect(x, z, w, d); g.clip();
      g.strokeStyle = col; g.globalAlpha = 0.22; g.lineWidth = 0.12;
      for (let i = -d; i < w + d; i += 1.3) { g.beginPath(); g.moveTo(x + i, z + d); g.lineTo(x + i + d, z); g.stroke(); }
      g.restore();
      g.globalAlpha = 1;
      g.strokeStyle = col; g.lineWidth = 0.24;
      g.strokeRect(x, z, w, d);
      // Esquineros
      g.lineWidth = 0.5;
      for (const [cx, cz, sx, sz] of [[x, z, 1, 1], [x + w, z, -1, 1], [x, z + d, 1, -1], [x + w, z + d, -1, -1]]) {
        g.beginPath(); g.moveTo(cx + sx * 1.4, cz); g.lineTo(cx, cz); g.lineTo(cx, cz + sz * 1.4); g.stroke();
      }
      this._wtext(g, label, x + w / 2, z + d + 1.0, 0.85, col);
      if (sub) this._wtext(g, sub, x + w / 2, z + d + 1.95, 0.5, 'rgba(255,255,255,0.75)', FM, 700);
    };

    bay(-21.5, -46, 11, 16, '#2fe6ff', 'rgba(47,230,255,0.08)', 'ZONA REEFER', 'CADENA DE FRÍO +2°C / +8°C');
    bay(10, -34, 8.5, 8, '#b06bff', 'rgba(176,107,255,0.1)', 'AUDITORÍA ABC', 'PARETO 80/20');
    bay(9, -52.5, 13.5, 11.5, '#ff8a1f', 'rgba(255,138,31,0.1)', 'ZONA GRÚA · EPP', 'LEY 16.744 · D.S. 594');

    // Pista central de salida Flota 72
    g.fillStyle = 'rgba(242,194,0,0.07)';
    g.fillRect(-3.8, -65, 7.6, 46.5);
    g.strokeStyle = '#f2c200';
    g.lineWidth = 0.26;
    g.beginPath(); g.moveTo(-3.8, -18.5); g.lineTo(-3.8, -65); g.stroke();
    g.beginPath(); g.moveTo(3.8, -18.5); g.lineTo(3.8, -65); g.stroke();
    g.fillStyle = 'rgba(242,194,0,0.85)';
    for (let z = -23; z >= -63; z -= 5.2) {
      if (z < -38.5 && z > -49.5) continue; // bajo el camión
      g.beginPath();
      g.moveTo(0, z - 1.3); g.lineTo(1.7, z + 0.4); g.lineTo(1.0, z + 0.4); g.lineTo(0, z - 0.5);
      g.lineTo(-1.0, z + 0.4); g.lineTo(-1.7, z + 0.4);
      g.closePath(); g.fill();
    }
    this._wtext(g, 'FLOTA 72', 0, -33.2, 1.25, '#f2c200');
    this._wtext(g, 'SALIDA', 0, -55.8, 1.3, '#f2c200');
    this._wtext(g, 'RUTA 5 SUR', 0, -53.9, 0.9, 'rgba(255,255,255,0.85)');

    // Cebreado exterior del andén
    this._hazard(g, -4.8, -18.4, 9.6, 3.2, 0.6);
    g.restore();
    return this._tex(c);
  }

  // ---------- CAJAS DE CARTÓN ----------
  createBoxTexture(o = {}) {
    const { sku = 'SKU 000', lote = '', fecha = '', hazard = false, title = 'INSUMOS MÉDICOS', tone = '#b98d5c', seed = 3 } = o;
    const S = 512;
    const [c, g] = this._cv(S);
    g.fillStyle = tone;
    g.fillRect(0, 0, S, S);
    g.strokeStyle = 'rgba(0,0,0,0.05)';
    g.lineWidth = 1;
    for (let x = 0; x < S; x += 5) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, S); g.stroke(); }
    this._speckle(g, S, S, 5000, 0.08, seed);
    const eg = g.createLinearGradient(0, 0, 0, S);
    eg.addColorStop(0, 'rgba(255,255,255,0.1)');
    eg.addColorStop(0.6, 'rgba(0,0,0,0)');
    eg.addColorStop(1, 'rgba(0,0,0,0.22)');
    g.fillStyle = eg;
    g.fillRect(0, 0, S, S);
    g.strokeStyle = 'rgba(60,35,10,0.55)';
    g.lineWidth = 8;
    g.strokeRect(4, 4, S - 8, S - 8);
    // Cinta de embalaje
    g.fillStyle = 'rgba(226,204,150,0.55)';
    g.fillRect(0, 34, S, 46);
    g.fillStyle = 'rgba(255,255,255,0.18)';
    g.fillRect(0, 38, S, 6);

    // Etiqueta logística
    const lx = 30, ly = 118, lw = hazard ? 268 : 330, lh = 262;
    g.fillStyle = '#f7f7f2';
    rr(g, lx, ly, lw, lh, 8); g.fill();
    g.fillStyle = '#10151c';
    g.fillRect(lx, ly, lw, 44);
    g.fillStyle = '#3de8ff';
    g.font = `900 22px ${FD}`;
    g.textBaseline = 'middle';
    g.textAlign = 'left';
    g.fillText('ANDESCARGO', lx + 12, ly + 23);
    g.fillStyle = '#10151c';
    g.font = `700 ${this._fit(g, title, lw - 24, 20, FB, 700)}px ${FB}`;
    g.fillText(title, lx + 12, ly + 66);
    g.font = `700 20px ${FM}`;
    g.fillText(sku, lx + 12, ly + 94);
    if (lote) {
      g.font = `900 ${this._fit(g, lote, lw - 24, 46, FD)}px ${FD}`;
      g.fillText(lote, lx + 12, ly + 138);
    }
    if (fecha) {
      g.font = `700 18px ${FM}`;
      g.fillStyle = '#444';
      g.fillText('INGRESO', lx + 12, ly + 176);
      g.fillStyle = '#10151c';
      g.font = `700 22px ${FM}`;
      g.fillText(fecha, lx + 108, ly + 176);
    }
    this._barcode(g, lx + 12, ly + 198, lw - 24, 50, seed * 31 + 7);

    // Pictogramas de manipulación
    g.strokeStyle = 'rgba(40,22,5,0.8)';
    g.fillStyle = 'rgba(40,22,5,0.8)';
    g.lineWidth = 5;
    const ax = hazard ? 60 : 410, ay = hazard ? 430 : 180;
    for (const dx of [0, 46]) {
      g.beginPath(); g.moveTo(ax + dx, ay + 50); g.lineTo(ax + dx, ay); g.stroke();
      g.beginPath(); g.moveTo(ax + dx - 14, ay + 16); g.lineTo(ax + dx, ay - 4); g.lineTo(ax + dx + 14, ay + 16); g.closePath(); g.fill();
    }
    g.beginPath(); g.moveTo(ax - 20, ay + 58); g.lineTo(ax + 66, ay + 58); g.stroke();
    g.font = `900 18px ${FD}`;
    g.textAlign = 'left';
    g.fillText('FRÁGIL', hazard ? 150 : 386, hazard ? 462 : 270);

    if (hazard) {
      // Rombo rojo Clase 3 — Líquido Inflamable (NCh 2190)
      const cx = 400, cy = 256, rad = 96;
      g.save();
      g.translate(cx, cy);
      g.rotate(Math.PI / 4);
      g.fillStyle = '#fff';
      g.fillRect(-rad * 0.78, -rad * 0.78, rad * 1.56, rad * 1.56);
      g.fillStyle = '#d91a28';
      g.fillRect(-rad * 0.7, -rad * 0.7, rad * 1.4, rad * 1.4);
      g.restore();
      // Llama
      g.fillStyle = '#fff';
      g.beginPath();
      g.moveTo(cx, cy - 62);
      g.bezierCurveTo(cx + 34, cy - 30, cx + 26, cy - 4, cx + 12, cy + 6);
      g.bezierCurveTo(cx + 14, cy - 8, cx + 4, cy - 16, cx, cy - 26);
      g.bezierCurveTo(cx - 6, cy - 12, cx - 16, cy - 8, cx - 12, cy + 6);
      g.bezierCurveTo(cx - 30, cy - 6, cx - 26, cy - 34, cx, cy - 62);
      g.fill();
      g.fillRect(cx - 30, cy + 10, 60, 5);
      g.font = `900 13px ${FB}`;
      g.textAlign = 'center';
      g.fillText('LÍQUIDO', cx, cy + 30);
      g.fillText('INFLAMABLE', cx, cy + 46);
      g.font = `900 30px ${FD}`;
      g.fillText('3', cx, cy + 76);
      g.fillStyle = 'rgba(40,22,5,0.9)';
      g.font = `700 15px ${FM}`;
      g.fillText('NCh 2190 · UN 1219', cx, 392);
    }
    return this._tex(c);
  }

  // ---------- PALLET DE MADERA ----------
  createWoodPalletTexture() {
    const S = 512;
    const [c, g] = this._cv(S);
    g.fillStyle = '#5a4126';
    g.fillRect(0, 0, S, S);
    const r = rng(8);
    const planks = 7, pw = S / planks;
    for (let i = 0; i < planks; i++) {
      const l = 52 + r() * 14;
      g.fillStyle = `hsl(31, 42%, ${l}%)`;
      g.fillRect(i * pw + 5, 0, pw - 10, S);
      g.strokeStyle = 'rgba(70,40,10,0.28)';
      g.lineWidth = 1;
      for (let k = 0; k < 12; k++) {
        const x = i * pw + 8 + r() * (pw - 16);
        g.beginPath(); g.moveTo(x, 0);
        g.bezierCurveTo(x + (r() - 0.5) * 12, S * 0.3, x + (r() - 0.5) * 12, S * 0.7, x + (r() - 0.5) * 8, S);
        g.stroke();
      }
      if (r() > 0.4) {
        g.fillStyle = 'rgba(70,40,12,0.6)';
        g.beginPath(); g.ellipse(i * pw + pw / 2 + (r() - 0.5) * 20, r() * S, 5, 9, 0, 0, Math.PI * 2); g.fill();
      }
      g.fillStyle = '#2c2c2c';
      for (const y of [40, S / 2, S - 40]) { g.beginPath(); g.arc(i * pw + pw / 2, y, 3, 0, Math.PI * 2); g.fill(); }
    }
    this._speckle(g, S, S, 4000, 0.08, 21);
    return this._tex(c);
  }

  // ---------- MONITOR ERP ----------
  createMonitorTexture(state = 'alert', variant = 0) {
    const W = 1024, H = 640;
    const [c, g] = this._cv(W, H);
    const ok = state === 'ok';
    const acc = ok ? '#35f0a0' : '#ff4458';
    const bg = g.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#061423');
    bg.addColorStop(1, '#03090f');
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#0c2233';
    g.fillRect(0, 0, W, 70);
    g.fillStyle = '#3de8ff';
    g.font = `900 30px ${FD}`;
    g.textBaseline = 'middle';
    g.fillText(variant === 0 ? 'ERP ANDESCARGO · OC #884' : 'GUÍA DE DESPACHO N° 20.417', 28, 36);
    g.fillStyle = acc;
    g.font = `700 22px ${FM}`;
    g.textAlign = 'right';
    g.fillText(ok ? '● CUADRADO' : '● DISCREPANCIA', W - 28, 36);
    g.textAlign = 'left';

    const rows = [
      ['112', 'MASCARILLAS N95 CAJA x20', '120', '120'],
      ['245', 'JERINGAS 5 ML CAJA x100', '200', '200'],
      ['408', 'GUANTES QUIRÚRG. ESTÉRILES', '50', '35'],
      ['517', 'SUERO FISIOLÓGICO 500 ML', '80', '80'],
      ['633', 'ALCOHOL GEL 1 L', '60', '60'],
    ];
    g.font = `700 20px ${FM}`;
    g.fillStyle = '#6f93ab';
    g.fillText('SKU', 34, 108); g.fillText('DESCRIPCIÓN', 130, 108); g.fillText(variant === 0 ? 'SOLIC.' : 'DESP.', 860, 108);
    rows.forEach((rw, i) => {
      const y = 132 + i * 66;
      const bad = rw[0] === '408';
      g.fillStyle = bad ? (ok ? 'rgba(53,240,160,0.16)' : 'rgba(255,68,88,0.2)') : 'rgba(61,232,255,0.05)';
      rr(g, 22, y, W - 44, 54, 8); g.fill();
      if (bad) { g.strokeStyle = acc; g.lineWidth = 2.5; rr(g, 22, y, W - 44, 54, 8); g.stroke(); }
      g.fillStyle = bad ? acc : '#d8f4ff';
      g.font = `700 24px ${FM}`;
      g.fillText(rw[0], 34, y + 28);
      g.fillText(rw[1], 130, y + 28);
      g.fillText(ok && bad ? '50' : rw[variant === 0 ? 2 : 3], 870, y + 28);
    });
    g.fillStyle = acc;
    g.font = `900 34px ${FD}`;
    g.fillText(ok ? 'CUADRATURA DOCUMENTAL OK' : 'ALERTA: DIFERENCIA OC vs GUÍA', 28, 520);
    g.fillStyle = '#6f93ab';
    g.font = `700 20px ${FM}`;
    g.fillText(ok ? 'CLAVE 1 REGISTRADA EN BITÁCORA' : 'AUDITAR LÍNEAS · VIERNES 17:45', 30, 566);
    // barras decorativas
    for (let i = 0; i < 26; i++) {
      g.fillStyle = `rgba(61,232,255,${0.15 + (i % 5) * 0.08})`;
      const h = 10 + ((i * 37) % 44);
      g.fillRect(650 + i * 13, 600 - h, 8, h);
    }
    // líneas de barrido
    g.fillStyle = 'rgba(255,255,255,0.025)';
    for (let y = 0; y < H; y += 4) g.fillRect(0, y, W, 1);
    return this._tex(c);
  }

  // ---------- VISOR ESCARCHADO DE CÁMARA DE FRÍO ----------
  createColdChamberTexture(temp = '11.4', ok = false) {
    const S = 512;
    const [c, g] = this._cv(S);
    const acc = ok ? '#35f0a0' : '#ff4458';
    const bg = g.createLinearGradient(0, 0, 0, S);
    bg.addColorStop(0, '#07202e');
    bg.addColorStop(1, '#03101a');
    g.fillStyle = bg;
    g.fillRect(0, 0, S, S);
    g.fillStyle = '#9fdcff';
    g.font = `900 26px ${FD}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('TERMÓGRAFO REEFER', S / 2, 52);
    g.fillStyle = acc;
    g.font = `900 150px ${FD}`;
    g.fillText(temp, S / 2 - 30, 210);
    g.font = `900 54px ${FD}`;
    g.fillText('°C', S / 2 + 190, 170);
    g.fillStyle = ok ? 'rgba(53,240,160,0.18)' : 'rgba(255,68,88,0.22)';
    rr(g, 56, 300, S - 112, 64, 12); g.fill();
    g.strokeStyle = acc; g.lineWidth = 3;
    rr(g, 56, 300, S - 112, 64, 12); g.stroke();
    g.fillStyle = acc;
    g.font = `900 28px ${FD}`;
    g.fillText(ok ? 'CADENA DE FRÍO ESTABLE' : '⚠ ALERTA TÉRMICA', S / 2, 333);
    // Curva térmica
    g.strokeStyle = acc; g.lineWidth = 4;
    g.beginPath();
    for (let i = 0; i <= 40; i++) {
      const x = 60 + i * 9.8;
      const y = ok ? 440 + Math.sin(i * 0.6) * 6 : 470 - (i / 40) * 60 + Math.sin(i * 0.9) * 5;
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.stroke();
    g.fillStyle = '#6f93ab';
    g.font = `700 18px ${FM}`;
    g.fillText('SET-POINT: ' + (ok ? '04 °C' : '-- °C') + ' · MINSAL', S / 2, 490);
    // Escarcha
    const r = rng(77);
    for (let i = 0; i < 2600; i++) {
      const edge = r();
      let x = r() * S, y = r() * S;
      const d = Math.min(x, y, S - x, S - y) / (S / 2);
      if (d > 0.3 * edge + 0.05) continue;
      g.fillStyle = `rgba(215,240,255,${0.1 + r() * 0.3})`;
      g.fillRect(x, y, 1 + r() * 3, 1 + r() * 3);
    }
    const fr = g.createRadialGradient(S / 2, S / 2, S * 0.3, S / 2, S / 2, S * 0.75);
    fr.addColorStop(0, 'rgba(200,235,255,0)');
    fr.addColorStop(1, 'rgba(200,235,255,0.3)');
    g.fillStyle = fr;
    g.fillRect(0, 0, S, S);
    return this._tex(c);
  }

  // ---------- PANTALLA PARETO ABC ----------
  createAbcScreenTexture(solved = false) {
    const W = 1024, H = 640;
    const [c, g] = this._cv(W, H);
    const bg = g.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#120a26');
    bg.addColorStop(1, '#07040f');
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#c79bff';
    g.font = `900 34px ${FD}`;
    g.textBaseline = 'middle';
    g.fillText('CLASIFICACIÓN ABC · PARETO 80/20', 30, 44);
    g.fillStyle = '#8f7ab8';
    g.font = `700 20px ${FM}`;
    g.fillText('VALOR FINANCIERO ANUAL POR FAMILIA', 32, 86);
    const bars = [['A80', 80, '#ffb020'], ['B15', 15, '#b06bff'], ['C05', 5, '#5b6d8a']];
    const baseY = 540, maxH = 380;
    g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 1;
    for (let i = 0; i <= 4; i++) { const y = baseY - (i / 4) * maxH; g.beginPath(); g.moveTo(90, y); g.lineTo(W - 60, y); g.stroke(); }
    let acc = 0; const pts = [];
    bars.forEach((b, i) => {
      const x = 160 + i * 270, h = (b[1] / 100) * maxH;
      const gr = g.createLinearGradient(0, baseY - h, 0, baseY);
      gr.addColorStop(0, b[2]); gr.addColorStop(1, 'rgba(0,0,0,0.3)');
      g.fillStyle = gr;
      rr(g, x, baseY - h, 170, h, 6); g.fill();
      if (solved && i === 0) { g.strokeStyle = '#35f0a0'; g.lineWidth = 6; rr(g, x - 6, baseY - h - 6, 182, h + 12, 8); g.stroke(); }
      g.fillStyle = '#fff';
      g.font = `900 36px ${FD}`;
      g.textAlign = 'center';
      g.fillText(b[1] + '%', x + 85, baseY - h - 28);
      g.fillStyle = b[2];
      g.font = `900 28px ${FD}`;
      g.fillText('SERIE ' + b[0], x + 85, baseY + 36);
      acc += b[1];
      pts.push([x + 85, baseY - (acc / 100) * maxH]);
    });
    g.strokeStyle = '#3de8ff'; g.lineWidth = 4;
    g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke();
    g.fillStyle = '#3de8ff';
    pts.forEach((p) => { g.beginPath(); g.arc(p[0], p[1], 8, 0, Math.PI * 2); g.fill(); });
    g.textAlign = 'left';
    if (solved) {
      g.fillStyle = '#35f0a0';
      g.font = `900 26px ${FD}`;
      g.fillText('CLASE A VALIDADA ✓', 640, 44);
    }
    g.fillStyle = 'rgba(255,255,255,0.025)';
    for (let y = 0; y < H; y += 4) g.fillRect(0, y, W, 1);
    return this._tex(c);
  }

  // ---------- TABLET TMS ----------
  createTabletTexture(solved = false) {
    const W = 640, H = 900;
    const [c, g] = this._cv(W, H);
    g.fillStyle = '#04121c';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#0b2a3d';
    g.fillRect(0, 0, W, 96);
    g.fillStyle = '#3de8ff';
    g.font = `900 38px ${FD}`;
    g.textBaseline = 'middle';
    g.fillText('TMS · CUBICAJE', 26, 50);
    g.fillStyle = '#d8f4ff';
    g.font = `700 30px ${FM}`;
    g.fillText('PEDIDO CONSOLIDADO', 26, 150);
    g.fillStyle = '#ffb020';
    g.font = `900 64px ${FD}`;
    g.fillText('1.450 kg', 26, 222);
    g.fillText('12 pallets', 26, 302);
    const v = [['FURGÓN · F31', '1.000 kg / 6 P'], ['CAMIÓN 3/4 · F72', '2.500 kg / 14 P'], ['TRACTO · F95', '18.000 kg / 28 P']];
    v.forEach((it, i) => {
      const y = 380 + i * 160;
      const sel = solved && i === 1;
      g.fillStyle = sel ? 'rgba(53,240,160,0.2)' : 'rgba(61,232,255,0.07)';
      rr(g, 22, y, W - 44, 136, 14); g.fill();
      g.strokeStyle = sel ? '#35f0a0' : 'rgba(61,232,255,0.4)'; g.lineWidth = sel ? 5 : 2;
      rr(g, 22, y, W - 44, 136, 14); g.stroke();
      g.fillStyle = sel ? '#35f0a0' : '#d8f4ff';
      g.font = `900 30px ${FD}`;
      g.fillText(it[0], 44, y + 46);
      g.font = `700 28px ${FM}`;
      g.fillStyle = '#8fb5c9';
      g.fillText(it[1], 44, y + 96);
      if (sel) { g.fillStyle = '#35f0a0'; g.font = `900 44px ${FD}`; g.fillText('✓', W - 90, y + 70); }
    });
    return this._tex(c);
  }

  // ---------- CORTINA METÁLICA DEL PORTÓN ----------
  createGateTexture() {
    const S = 1024;
    const [c, g] = this._cv(S);
    g.fillStyle = '#7d8791';
    g.fillRect(0, 0, S, S);
    const slat = 32;
    for (let y = 0; y < S; y += slat) {
      const gr = g.createLinearGradient(0, y, 0, y + slat);
      gr.addColorStop(0, '#a9b3bd');
      gr.addColorStop(0.35, '#8a949e');
      gr.addColorStop(0.8, '#5c656e');
      gr.addColorStop(1, '#2c3238');
      g.fillStyle = gr;
      g.fillRect(0, y, S, slat);
    }
    this._speckle(g, S, S, 16000, 0.07, 13);
    const r = rng(31);
    for (let i = 0; i < 40; i++) {
      const x = r() * S;
      const gr = g.createLinearGradient(x, 0, x, S);
      gr.addColorStop(0, 'rgba(60,40,20,0)');
      gr.addColorStop(0.5, 'rgba(60,40,20,0.12)');
      gr.addColorStop(1, 'rgba(60,40,20,0)');
      g.fillStyle = gr;
      g.fillRect(x, r() * S * 0.5, 3 + r() * 6, S * (0.2 + r() * 0.5));
    }
    this._hazard(g, 0, S - 92, S, 92, 46);
    g.fillStyle = 'rgba(16,20,26,0.88)';
    rr(g, S / 2 - 260, 330, 520, 170, 12); g.fill();
    g.strokeStyle = '#f2c200'; g.lineWidth = 6;
    rr(g, S / 2 - 260, 330, 520, 170, 12); g.stroke();
    g.fillStyle = '#f2c200';
    g.font = `900 92px ${FD}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('ANDÉN 01', S / 2, 400);
    g.fillStyle = '#fff';
    g.font = `700 30px ${FM}`;
    g.fillText('ANDESCARGO · DESPACHO', S / 2, 466);
    return this._tex(c);
  }

  // ---------- TECLADO NUMÉRICO ----------
  createKeypadTexture(state = 'locked', title = 'ANDÉN 01') {
    const W = 512, H = 768;
    const [c, g] = this._cv(W, H);
    const open = state === 'open';
    const acc = open ? '#35f0a0' : '#ff4458';
    const bg = g.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#2a3038');
    bg.addColorStop(1, '#14181d');
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);
    this._speckle(g, W, H, 4000, 0.06, 4);
    g.fillStyle = '#02080c';
    rr(g, 36, 36, W - 72, 170, 14); g.fill();
    g.strokeStyle = acc; g.lineWidth = 4;
    rr(g, 36, 36, W - 72, 170, 14); g.stroke();
    g.fillStyle = '#8fb5c9';
    g.font = `700 24px ${FM}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(title, W / 2, 74);
    g.fillStyle = acc;
    g.font = `900 46px ${FD}`;
    g.fillText(open ? 'LIBERADO' : 'BLOQUEADO', W / 2, 138);
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'OK'];
    keys.forEach((k, i) => {
      const x = 46 + (i % 3) * 144, y = 240 + Math.floor(i / 3) * 126;
      const kg = g.createLinearGradient(0, y, 0, y + 106);
      kg.addColorStop(0, '#3b434d');
      kg.addColorStop(1, '#20262d');
      g.fillStyle = kg;
      rr(g, x, y, 124, 106, 12); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.14)'; g.lineWidth = 2;
      rr(g, x, y, 124, 106, 12); g.stroke();
      g.fillStyle = k === 'OK' ? '#35f0a0' : k === 'C' ? '#ff4458' : '#e9f6ff';
      g.font = `900 ${k === 'OK' ? 36 : 46}px ${FD}`;
      g.fillText(k, x + 62, y + 56);
    });
    return this._tex(c);
  }

  // ---------- LETREROS ----------
  createSignTexture(text, o = {}) {
    const { w = 1024, h = 256, bg = '#0c141e', fg = '#3de8ff', sub = '', border = fg, hazard = false, font = FD } = o;
    const [c, g] = this._cv(w, h);
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    if (hazard) {
      this._hazard(g, 0, 0, w, h * 0.13, h * 0.11);
      this._hazard(g, 0, h * 0.87, w, h * 0.13, h * 0.11);
    }
    g.strokeStyle = border;
    g.lineWidth = Math.max(4, h * 0.03);
    g.strokeRect(g.lineWidth, g.lineWidth, w - g.lineWidth * 2, h - g.lineWidth * 2);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = fg;
    const size = this._fit(g, text, w * 0.88, h * (sub ? 0.36 : 0.46), font);
    g.font = `900 ${size}px ${font}`;
    g.fillText(text, w / 2, sub ? h * 0.4 : h * 0.52);
    if (sub) {
      g.fillStyle = 'rgba(255,255,255,0.9)';
      const s2 = this._fit(g, sub, w * 0.88, h * 0.17, FM, 700);
      g.font = `700 ${s2}px ${FM}`;
      g.fillText(sub, w / 2, h * 0.72);
    }
    return this._tex(c);
  }

  // ---------- CONTENEDOR / CARROCERÍA CORRUGADA ----------
  createContainerTexture(color = '#b5462f', label = '', sub = '', o = {}) {
    const { w = 1024, h = 256, fg = '#ffffff', stripe = null } = o;
    const [c, g] = this._cv(w, h);
    g.fillStyle = color;
    g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 22) {
      const gr = g.createLinearGradient(x, 0, x + 22, 0);
      gr.addColorStop(0, 'rgba(255,255,255,0.12)');
      gr.addColorStop(0.5, 'rgba(0,0,0,0)');
      gr.addColorStop(1, 'rgba(0,0,0,0.2)');
      g.fillStyle = gr;
      g.fillRect(x, 0, 22, h);
    }
    this._speckle(g, w, h, 5000, 0.07, label.length + 3);
    if (stripe) {
      g.fillStyle = stripe;
      g.fillRect(0, h * 0.8, w, h * 0.07);
      g.fillRect(0, h * 0.1, w, h * 0.03);
    }
    if (label) {
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillStyle = fg;
      const s = this._fit(g, label, w * 0.8, h * 0.32, FD);
      g.font = `900 ${s}px ${FD}`;
      g.fillText(label, w / 2, sub ? h * 0.4 : h * 0.5);
      if (sub) {
        const s2 = this._fit(g, sub, w * 0.8, h * 0.14, FM, 700);
        g.font = `700 ${s2}px ${FM}`;
        g.fillText(sub, w / 2, h * 0.64);
      }
    }
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, 'rgba(255,255,255,0.08)');
    gr.addColorStop(1, 'rgba(0,0,0,0.3)');
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
    return this._tex(c);
  }

  // ---------- MURO DE PANEL METÁLICO ----------
  createWallTexture() {
    const S = 512;
    const [c, g] = this._cv(S);
    g.fillStyle = '#8d99a6';
    g.fillRect(0, 0, S, S);
    for (let x = 0; x < S; x += 32) {
      const gr = g.createLinearGradient(x, 0, x + 32, 0);
      gr.addColorStop(0, 'rgba(255,255,255,0.14)');
      gr.addColorStop(0.5, 'rgba(0,0,0,0.02)');
      gr.addColorStop(1, 'rgba(0,0,0,0.2)');
      g.fillStyle = gr;
      g.fillRect(x, 0, 32, S);
    }
    this._speckle(g, S, S, 5000, 0.05, 2);
    return this._tex(c, 6, 1);
  }

  // ---------- HAZ VOLUMÉTRICO Y BRILLO ----------
  createBeamTexture() {
    const [c, g] = this._cv(64, 256);
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#ffffff');
    gr.addColorStop(0.35, '#6a6a6a');
    gr.addColorStop(1, '#000000');
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 256);
    return this._tex(c);
  }

  createGlowTexture() {
    const [c, g] = this._cv(128);
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.3, 'rgba(255,255,255,0.45)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    return this._tex(c);
  }

  // ---------- CIELO: ATARDECER SOBRE LA CORDILLERA DE LOS ANDES ----------
  createSkyTexture() {
    const W = this.big, H = this.big / 2;
    const [c, g] = this._cv(W, H);
    const hz = H / 2;
    const sky = g.createLinearGradient(0, 0, 0, hz);
    sky.addColorStop(0, '#060a1c');
    sky.addColorStop(0.45, '#161b42');
    sky.addColorStop(0.72, '#4a2f63');
    sky.addColorStop(0.9, '#b8573f');
    sky.addColorStop(1, '#e89a52');
    g.fillStyle = sky;
    g.fillRect(0, 0, W, hz);
    // Estrellas
    const r = rng(2026);
    for (let i = 0; i < 900; i++) {
      const y = r() * hz * 0.7;
      g.fillStyle = `rgba(255,255,255,${(0.2 + r() * 0.7) * (1 - y / (hz * 0.7))})`;
      g.fillRect(r() * W, y, 1 + r() * 1.5, 1 + r() * 1.5);
    }
    // Resplandor del sol poniente (u ≈ 0.824)
    const sx = W * 0.824;
    for (const dx of [0, -W, W]) {
      const sg = g.createRadialGradient(sx + dx, hz, 0, sx + dx, hz, W * 0.2);
      sg.addColorStop(0, 'rgba(255,214,140,0.75)');
      sg.addColorStop(0.25, 'rgba(255,140,70,0.38)');
      sg.addColorStop(1, 'rgba(255,120,60,0)');
      g.fillStyle = sg;
      g.fillRect(0, 0, W, hz);
    }
    // Nubes finas
    for (let i = 0; i < 26; i++) {
      const x = r() * W, y = hz * (0.55 + r() * 0.38), w = W * (0.04 + r() * 0.1);
      const cg = g.createRadialGradient(x, y, 0, x, y, w);
      cg.addColorStop(0, 'rgba(255,170,120,0.2)');
      cg.addColorStop(1, 'rgba(255,170,120,0)');
      g.fillStyle = cg;
      g.save(); g.translate(x, y); g.scale(1, 0.14); g.translate(-x, -y);
      g.fillRect(x - w, y - w, w * 2, w * 2);
      g.restore();
    }
    // Cordillera en tres capas
    const layers = [
      { amp: H * 0.085, top: '#f0d3dc', mid: '#5b4479', bot: '#34295a', seed: 5, freq: 9 },
      { amp: H * 0.058, top: '#6d5088', mid: '#2e2450', bot: '#221b40', seed: 9, freq: 14 },
      { amp: H * 0.03, top: '#1b1730', mid: '#14122a', bot: '#100e20', seed: 15, freq: 22 },
    ];
    for (const L of layers) {
      const rr2 = rng(L.seed);
      const ph = [rr2() * 6, rr2() * 6, rr2() * 6];
      const gr = g.createLinearGradient(0, hz - L.amp, 0, hz);
      gr.addColorStop(0, L.top);
      gr.addColorStop(0.35, L.mid);
      gr.addColorStop(1, L.bot);
      g.fillStyle = gr;
      g.beginPath();
      g.moveTo(0, hz + 2);
      const N = 420;
      for (let i = 0; i <= N; i++) {
        const a = (i / N) * Math.PI * 2;
        let hgt = 0.5 + 0.28 * Math.sin(a * L.freq + ph[0]) + 0.16 * Math.sin(a * L.freq * 2.3 + ph[1]) + 0.1 * Math.sin(a * L.freq * 5.1 + ph[2]);
        hgt = Math.max(0.08, hgt) * (0.82 + ((i * 7919) % 13) / 70);
        g.lineTo((i / N) * W, hz - hgt * L.amp);
      }
      g.lineTo(W, hz + 2);
      g.closePath();
      g.fill();
    }
    // Suelo y luces lejanas de la ciudad
    g.fillStyle = '#0d0c18';
    g.fillRect(0, hz, W, hz);
    for (let i = 0; i < 520; i++) {
      const warm = r() > 0.3;
      g.fillStyle = warm ? `rgba(255,${190 + r() * 50},120,${0.4 + r() * 0.6})` : `rgba(160,220,255,${0.4 + r() * 0.5})`;
      g.fillRect(r() * W, hz - 3 + r() * 14, 1.5, 1.5);
    }
    return this._tex(c);
  }
}
