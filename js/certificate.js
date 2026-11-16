// =====================================================================
// OPERACIÓN DESPACHO CRÍTICO 360° — Certificado Oficial (Canvas 2000×1414)
// =====================================================================

const W = 2000, H = 1414;
const FD = 'Orbitron, "Arial Black", sans-serif';
const FM = '"JetBrains Mono", Consolas, monospace';
const FB = 'Inter, "Segoe UI", Arial, sans-serif';
const GOLD = '#e8c56a', GOLD2 = '#a8792a', CYAN = '#3de8ff', GREEN = '#35f0a0';

function rr(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function fit(g, text, maxW, size, font, weight = 900) {
  let s = size;
  g.font = `${weight} ${s}px ${font}`;
  while (g.measureText(text).width > maxW && s > 12) { s -= 2; g.font = `${weight} ${s}px ${font}`; }
  return s;
}

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36).toUpperCase().padStart(7, '0');
}

export class CertificateGenerator {
  code(d) {
    const stamp = d.date.toISOString().slice(0, 10).replace(/-/g, '');
    const a = hash(`${d.name}|${d.course}|${d.time}|${d.efficiency}|${d.errors}|${stamp}`);
    return `ADC-${d.date.getFullYear()}-${a.slice(0, 4)}-${a.slice(4, 7)}${String(d.efficiency).padStart(3, '0')}`;
  }

  async render(d) {
    try { await document.fonts.ready; } catch { /* sin API de fuentes */ }
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    const gold = g.createLinearGradient(0, 0, W, H);
    gold.addColorStop(0, '#f6e3a1'); gold.addColorStop(0.3, GOLD); gold.addColorStop(0.6, GOLD2); gold.addColorStop(1, '#f1d98c');

    // Fondo
    const bg = g.createRadialGradient(W / 2, H * 0.42, 100, W / 2, H / 2, W * 0.75);
    bg.addColorStop(0, '#12233a'); bg.addColorStop(1, '#050a12');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    // Retícula tipo plano técnico
    g.strokeStyle = 'rgba(61,232,255,0.05)'; g.lineWidth = 1;
    for (let x = 0; x < W; x += 50) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    for (let y = 0; y < H; y += 50) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }

    // Marco dorado / industrial
    g.strokeStyle = gold; g.lineWidth = 14; g.strokeRect(38, 38, W - 76, H - 76);
    g.lineWidth = 3; g.strokeRect(64, 64, W - 128, H - 128);
    // Esquinas con franjas de seguridad
    const corner = (x, y, sx, sy) => {
      g.save(); g.translate(x, y); g.scale(sx, sy);
      g.beginPath(); g.moveTo(0, 0); g.lineTo(190, 0); g.lineTo(0, 190); g.closePath(); g.clip();
      g.fillStyle = '#15171a'; g.fillRect(0, 0, 190, 190);
      g.fillStyle = '#f2c200';
      for (let i = -190; i < 380; i += 44) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 22, 0); g.lineTo(i + 22 - 190, 190); g.lineTo(i - 190, 190); g.fill(); }
      g.restore();
    };
    corner(45, 45, 1, 1); corner(W - 45, 45, -1, 1); corner(45, H - 45, 1, -1); corner(W - 45, H - 45, -1, -1);
    g.strokeStyle = gold; g.lineWidth = 14; g.strokeRect(38, 38, W - 76, H - 76);

    g.textAlign = 'center'; g.textBaseline = 'middle';
    // Encabezado
    g.fillStyle = '#ffffff'; g.font = `900 46px ${FD}`;
    const lw = g.measureText('ANDES').width, lw2 = g.measureText('CARGO').width;
    g.textAlign = 'left';
    g.fillText('ANDES', W / 2 - (lw + lw2) / 2, 150);
    g.fillStyle = CYAN; g.fillText('CARGO', W / 2 - (lw + lw2) / 2 + lw, 150);
    g.textAlign = 'center';
    g.fillStyle = '#8fa9bd'; g.font = `700 20px ${FM}`;
    g.fillText('C E N T R O   D E   D I S T R I B U C I Ó N   ·   S I M U L A D O R   L O G Í S T I C O   E M T P', W / 2, 198);

    g.fillStyle = gold; g.font = `900 74px ${FD}`;
    g.fillText('CERTIFICADO OFICIAL DE EXCELENCIA', W / 2, 296);
    g.fillStyle = '#ffffff'; g.font = `800 34px ${FD}`;
    g.fillText('OPERACIÓN DESPACHO CRÍTICO 360° · EDICIÓN MULTI-ETAPA', W / 2, 364);
    g.strokeStyle = gold; g.lineWidth = 2;
    g.beginPath(); g.moveTo(W / 2 - 420, 404); g.lineTo(W / 2 + 420, 404); g.stroke();

    g.fillStyle = '#b9cddd'; g.font = `500 28px ${FB}`;
    g.fillText('Se certifica que', W / 2, 452);
    g.fillStyle = gold;
    const ns = fit(g, d.name.toUpperCase(), W - 420, 92, FD);
    g.font = `900 ${ns}px ${FD}`;
    g.shadowColor = 'rgba(232,197,106,0.45)'; g.shadowBlur = 30;
    g.fillText(d.name.toUpperCase(), W / 2, 540);
    g.shadowBlur = 0;
    g.fillStyle = '#ffffff'; g.font = `700 32px ${FB}`;
    g.fillText(d.course + ' · Administración, Mención Logística', W / 2, 614);
    g.fillStyle = '#b9cddd'; g.font = `400 25px ${FB}`;
    const n = d.competencias.length, rows = Math.ceil(n / 4), compact = rows > 2;
    g.fillText(`completó con éxito las ${rows} etapas y las ${n} estaciones del simulador, liberando el Andén 01 y despachando el`, W / 2, 668);
    g.fillText('Camión 3/4 Flota 72 dentro del tiempo límite, con retroalimentación formativa en cada estación.', W / 2, 704);

    // Indicadores
    const stats = [['TIEMPO EMPLEADO', d.time, CYAN], ['EFICIENCIA OPERATIVA', d.efficiency + '%', GREEN], ['RANGO OBTENIDO', d.rank, GOLD]];
    const sw = [330, 330, 800], gap = 30;
    let sx = (W - (sw[0] + sw[1] + sw[2] + gap * 2)) / 2;
    stats.forEach((s, i) => {
      g.fillStyle = 'rgba(255,255,255,0.045)'; rr(g, sx, 752, sw[i], 130, 16); g.fill();
      g.strokeStyle = s[2]; g.lineWidth = 2.5; rr(g, sx, 752, sw[i], 130, 16); g.stroke();
      g.fillStyle = '#8fa9bd'; g.font = `700 17px ${FM}`;
      g.fillText(s[0], sx + sw[i] / 2, 786);
      g.fillStyle = s[2];
      const fs = fit(g, s[1], sw[i] - 50, i === 2 ? 34 : 54, FD);
      g.font = `900 ${fs}px ${FD}`;
      g.fillText(s[1], sx + sw[i] / 2, 838);
      sx += sw[i] + gap;
    });

    // Grilla 4×2 de competencias validadas
    g.fillStyle = '#8fa9bd'; g.font = `700 19px ${FM}`;
    g.fillText(`${n}  C O M P E T E N C I A S   L O G Í S T I C A S   V A L I D A D A S`, W / 2, 928);
    const dense = rows > 3;
    const cw = 430, ch = dense ? 44 : compact ? 58 : 92, cg = dense ? 8 : compact ? 11 : 18, gx = (W - (cw * 4 + cg * 3)) / 2;
    const tones = [[CYAN, '61,232,255'], ['#ffb020', '255,176,32'], ['#b06bff', '176,107,255'], ['#ff5fa2', '255,95,162']];
    d.competencias.forEach((txt, i) => {
      const x = gx + (i % 4) * (cw + cg), y = 958 + Math.floor(i / 4) * (ch + cg);
      const st = Math.floor(i / 4), [tone, rgb] = tones[st % 4];
      const cr = dense ? 13 : compact ? 16 : 21, ccx = x + (dense ? 27 : compact ? 32 : 42), tx = x + (dense ? 52 : compact ? 60 : 78), k = cr / 21;
      g.fillStyle = `rgba(${rgb},0.07)`;
      rr(g, x, y, cw, ch, 12); g.fill();
      g.strokeStyle = `rgba(${rgb},0.5)`; g.lineWidth = 1.5;
      rr(g, x, y, cw, ch, 12); g.stroke();
      g.fillStyle = GREEN; g.beginPath(); g.arc(ccx, y + ch / 2, cr, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#04121a'; g.lineWidth = 5 * k; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(ccx - 10 * k, y + ch / 2 + 1); g.lineTo(ccx - 2 * k, y + ch / 2 + 9 * k); g.lineTo(ccx + 11 * k, y + ch / 2 - 8 * k); g.stroke();
      g.textAlign = 'left';
      g.fillStyle = tone; g.font = `700 ${dense ? 10.5 : compact ? 12 : 14}px ${FM}`;
      g.fillText(`ETAPA ${st + 1} · ESTACIÓN ${String(i + 1).padStart(2, '0')}`, tx, y + (dense ? 14 : compact ? 19 : 26));
      g.fillStyle = '#ffffff';
      if (compact) {
        g.font = `600 ${fit(g, txt, cw - (dense ? 66 : 76), dense ? 15 : 16, FB, 600)}px ${FB}`;
        g.fillText(txt, tx, y + (dense ? 31 : 40));
      } else {
        g.font = `600 18px ${FB}`;
        // Ajuste en dos líneas
        const words = txt.split(' '); let line = '', ly = y + 52;
        for (const w of words) {
          if (g.measureText(line + w).width > cw - 100 && line) { g.fillText(line.trim(), tx, ly); line = ''; ly += 22; }
          line += w + ' ';
        }
        g.fillText(line.trim(), tx, ly);
      }
      g.textAlign = 'center';
    });

    // Pie: fecha, firma, sello y código de verificación
    const fy = 1244;
    const fecha = d.date.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
    g.textAlign = 'left';
    g.fillStyle = '#8fa9bd'; g.font = `700 15px ${FM}`; g.fillText('FECHA DE EMISIÓN', 260, fy - 44);
    g.fillStyle = '#fff'; g.font = `600 25px ${FB}`; g.fillText(fecha, 260, fy - 14);
    g.fillStyle = '#8fa9bd'; g.font = `700 15px ${FM}`; g.fillText('CÓDIGO ÚNICO DE VERIFICACIÓN', 260, fy + 24);
    const code = this.code(d);
    g.fillStyle = GOLD; g.font = `700 25px ${FM}`; g.fillText(code, 260, fy + 54);
    // Código de barras de verificación
    let bx = 590; const seed = code.split('').map((ch) => ch.charCodeAt(0));
    g.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 44; i++) { const bw = 1 + ((seed[i % seed.length] + i * 7) % 4); if (i % 5 !== 3) g.fillRect(bx, fy + 12, bw, 54); bx += bw + 2; }

    // Firma
    g.textAlign = 'center';
    g.strokeStyle = '#8fa9bd'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(1380, fy + 4); g.lineTo(1740, fy + 4); g.stroke();
    g.fillStyle = '#fff'; g.font = `600 22px ${FB}`; g.fillText('Docente de la Especialidad', 1560, fy + 30);
    g.fillStyle = '#8fa9bd'; g.font = `500 15px ${FM}`; g.fillText('Administración · Mención Logística', 1560, fy + 56);

    // Sello institucional
    const cx = W / 2, cy = fy, R = 84;
    g.save(); g.translate(cx, cy);
    g.fillStyle = gold;
    g.beginPath();
    for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2, r = i % 2 ? R : R - 8; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    g.closePath(); g.fill();
    g.fillStyle = '#0a1422'; g.beginPath(); g.arc(0, 0, R - 13, 0, Math.PI * 2); g.fill();
    g.strokeStyle = gold; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, R - 36, 0, Math.PI * 2); g.stroke();
    g.fillStyle = gold; g.font = `700 12px ${FM}`;
    const ring = '★ SELLO OFICIAL ★ ANDESCARGO ';
    for (let i = 0; i < ring.length; i++) {
      g.save(); g.rotate((i / ring.length) * Math.PI * 2); g.translate(0, -(R - 25)); g.fillText(ring[i], 0, 0); g.restore();
    }
    g.font = `900 30px ${FD}`; g.fillText(d.efficiency + '%', 0, -5);
    g.font = `700 9px ${FM}`; g.fillText(`${n}/${n} EST.`, 0, 20);
    g.restore();

    g.fillStyle = '#5f7688'; g.font = `500 13px ${FM}`;
    g.fillText('Desarrollado por Innova IA Studio (innovaiastudio.com) · con Fable 5.2 · Documento generado automáticamente por el simulador', W / 2, H - 76);
    return c;
  }

  async download(d) {
    const canvas = await this.render(d);
    const safe = d.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '_');
    const a = document.createElement('a');
    a.download = `Certificado_DespachoCritico360_${safe}.png`;
    a.href = canvas.toDataURL('image/png');
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
}
