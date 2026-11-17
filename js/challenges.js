// =====================================================================
// OPERACIÓN DESPACHO CRÍTICO 360° — Lógica pedagógica de las 8 estaciones
// =====================================================================
import { WarehouseScene, STATIONS } from './scene3d.js';
import { audio } from './audio.js';
import { CertificateGenerator } from './certificate.js';

const TOTAL_TIME = 15 * 60;
const PENALTY = 15;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmt = (s) => {
  s = Math.max(0, Math.ceil(s));
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
};

// ---------------------------------------------------------------------
// Definición de las estaciones: respuesta, clave y retroalimentación
// ---------------------------------------------------------------------
const DEFS = {
  1: {
    key: '408', keyName: 'Clave 1',
    competencia: 'Cuadratura documental OC vs. Guía de Despacho',
    check(m) {
      const row = $('tr.selected', m);
      const diff = $('#diff-input', m).value.trim();
      if (!row) return { soft: 'Selecciona primero la línea (SKU) donde detectas la discrepancia.' };
      if (diff === '') return { soft: 'Ingresa cuántas unidades faltan en la Guía respecto de la Orden de Compra.' };
      if (row.dataset.sku !== '408') {
        return { hint: `El SKU ${row.dataset.sku} está cuadrado: la cantidad solicitada y la despachada coinciden. Recorre línea por línea comparando la columna <b>Solicitado</b> de la OC con la columna <b>Despachado</b> de la Guía; la discrepancia está donde los números no son iguales.` };
      }
      if (diff !== '15') {
        return { hint: 'El SKU es correcto, pero la diferencia no. La fórmula es <b>Faltante = Solicitado (OC) − Despachado (Guía)</b>. Vuelve a restar las dos cantidades de esa línea.' };
      }
      return { ok: true };
    },
    success: 'La OC #884 pedía <b>50</b> cajas de guantes quirúrgicos y la Guía registra <b>35</b>: faltan <b>15</b>. En una recepción real se deja constancia en la Guía y se emite un reclamo o nota de crédito al proveedor antes de ingresar el stock al sistema.',
  },
  2: {
    key: '19', keyName: 'Clave 2', answer: '19',
    competencia: 'Rotación de inventario FIFO / PEPS',
    hints: {
      14: 'El Lote #14 ingresó el <b>15/10/2026</b>. Hay otro pallet que lleva más tiempo en bodega. FIFO significa <b>Primero en Entrar, Primero en Salir</b>: busca la fecha de ingreso más antigua.',
      22: 'El Lote #22 es el <b>más reciente</b> (05/11/2026). Despachar lo último que llegó es el método LIFO, que deja envejecer el stock antiguo. En insumos médicos eso genera mermas por vencimiento.',
    },
    success: 'El Lote #19 ingresó el <b>02/09/2026</b>, es el más antiguo y debe salir primero. <i>Dato de terreno:</i> cuando los productos tienen fecha de vencimiento, muchas bodegas de salud usan <b>FEFO</b> (primero en vencer, primero en salir), que prioriza la caducidad por sobre la fecha de ingreso.',
  },
  3: {
    key: '72', keyName: 'Clave 3', answer: '72',
    competencia: 'Cubicaje y selección de transporte (TMS)',
    hints: {
      31: 'El Furgón Flota 31 soporta <b>1.000 kg y 6 pallets</b>; el pedido es de 1.450 kg y 12 pallets. Supera el peso (145%) y duplica la capacidad de pallets: es <b>sobrecarga</b>, una infracción y un riesgo de accidente.',
      95: 'El Tractocamión Flota 95 sí puede con la carga, pero usarías solo <b>8% de su capacidad de peso</b> (1.450 de 18.000 kg): más de 91% de capacidad ociosa. Estás pagando combustible, peaje y conductor por aire.',
    },
    success: 'El Camión 3/4 Flota 72 lleva los <b>12 de 14 pallets</b> (85,7% de ocupación) y 1.450 de 2.500 kg (58% del peso). Cumple ambas restricciones con el menor costo por kilo transportado.',
  },
  4: {
    code: '4081972', keypad: true,
    competencia: 'Liberación de andén y control de acceso',
    hints: [
      'Código incorrecto. El Código Maestro tiene <b>7 dígitos</b> y se forma uniendo las tres claves en el orden de las estaciones: <b>Clave 1 + Clave 2 + Clave 3</b>. Revisa tu Bitácora de Claves.',
      'Aún no coincide. Recuerda: Clave 1 = SKU con discrepancia (3 dígitos), Clave 2 = N° del lote FIFO (2 dígitos), Clave 3 = N° de flota del vehículo (2 dígitos). Sin espacios ni guiones.',
    ],
    success: 'Código Maestro aceptado. Baliza en verde: el portón del Andén 01 se está liberando.',
  },
  5: {
    key: '04', keyName: 'Clave E2-1', answer: '04',
    competencia: 'Cadena de frío MINSAL (+2 °C a +8 °C)',
    hints: {
      '-20': '<b>Congelar destruye</b> la mayoría de las vacunas y sueros: los cristales de hielo rompen su estructura y pierden eficacia aunque después se descongelen. El rango de −20 °C es para otros productos (por ejemplo, plasma).',
      20: 'Entre +15 °C y +25 °C es <b>temperatura ambiente controlada</b>, apta para comprimidos o insumos secos. Las vacunas a esa temperatura se degradan en horas: es justamente la ruptura de cadena de frío que marca el termógrafo.',
    },
    success: 'El rango normativo para productos refrigerados es <b>+2 °C a +8 °C</b>, con set-point en <b>04 °C</b> para dejar margen hacia ambos lados. Los 11,4 °C registrados son una excursión térmica que debe quedar documentada.',
  },
  6: {
    key: '80', keyName: 'Clave E2-2', answer: 'A80',
    competencia: 'Clasificación ABC · Ley de Pareto 80/20',
    hints: {
      C05: 'La Serie C05 es la que tiene <b>más bultos</b> (55%), pero solo representa el 5% del valor. La clasificación ABC no ordena por cantidad física, sino por <b>valor financiero</b>. Esa es una familia Clase C.',
      B15: 'La Serie B15 es intermedia: 30% de los bultos y 15% del valor. Es Clase B. Busca la familia donde <b>pocas unidades concentran la mayor parte del valor</b> (Pareto 80/20).',
    },
    success: 'La Serie A80 (Monitores UCI) representa solo el <b>15% de los bultos</b> pero concentra el <b>80% del valor anual</b>. Es Clase A: ubicación resguardada, conteo cíclico frecuente y control de acceso.',
  },
  7: {
    key: '59', keyName: 'Clave E2-3', answer: '59',
    competencia: 'Prevención de riesgos y rotulación NCh 2190',
    hints: {
      23: 'Dos faltas graves: el <b>cinturón nunca es opcional</b> (en un volcamiento es lo que evita que el operador sea aplastado) y las horquillas elevadas a 1 m desplazan el centro de gravedad y dejan la carga a la altura de las personas. Además, el alcohol isopropílico no es un gas Clase 2.',
      41: 'El EPP y las horquillas están bien, pero <b>20 km/h</b> duplica la velocidad segura en patio y el alcohol isopropílico al 70% <b>sí es sustancia peligrosa</b>: es un líquido inflamable y la NCh 2190 exige su rotulación.',
    },
    success: 'El Protocolo #59 cumple todo: EPP completo, cinturón abrochado, horquillas a 15–20 cm, máximo 10 km/h y <b>rombo rojo Clase 3 (Líquido Inflamable)</b> según NCh 2190, más la marca de manipulación Frágil. La Ley 16.744 y el D.S. 594 obligan al empleador a entregar y al trabajador a usar estos elementos.',
  },
  8: {
    code: '048059', keypad: true,
    competencia: 'Despacho final y trazabilidad de flota',
    hints: [
      'Código incorrecto. El Código de Embarque tiene <b>6 dígitos</b>: une las claves del patio en orden <b>E2-1 + E2-2 + E2-3</b>. Ojo con el cero inicial del set-point.',
      'Aún no coincide. Clave E2-1 = set-point del reefer (2 dígitos, con cero), Clave E2-2 = % de valor de la Clase A, Clave E2-3 = N° del protocolo de seguridad.',
    ],
    success: 'Código de Embarque aceptado. Barrera arriba: el Camión 3/4 Flota 72 sale hacia la Ruta 5 Sur.',
  },
  9: {
    key: '27', keyName: 'Clave E3-1',
    competencia: 'Conteo cíclico e informe de stock',
    check(m) {
      const total = $('#count-total', m).value.trim(), diff = $('#count-diff', m).value.trim();
      const sel = $('.opt-card.selected', m);
      if (total === '' || diff === '') return { soft: 'Completa el total del conteo físico y la diferencia contra el sistema.' };
      if (!sel) return { soft: 'Indica si la diferencia es un sobrante o un faltante.' };
      if (total !== '313') return { hint: 'El total del conteo físico no cuadra. Suma las cajas contadas en las <b>tres ubicaciones</b> (A-03-1, A-04-1 y A-05-1). El saldo del sistema no se suma: es el número contra el que comparas.' };
      if (String(Math.abs(+diff)) !== '27') return { hint: 'El total físico está bien, pero la diferencia no. <b>Diferencia = Saldo del sistema − Conteo físico</b>. Resta nuevamente.' };
      if (sel.dataset.value !== 'faltante') {
        sel.classList.add('wrong'); sel.classList.remove('selected');
        return { hint: 'Los números están bien, pero el tipo no. Si el sistema dice <b>340</b> y físicamente hay <b>313</b>, hay menos mercadería de la que debería: eso es un <b>faltante</b>. Sobrante sería encontrar más cajas de las registradas.' };
      }
      return { ok: true };
    },
    success: 'Conteo físico <b>313</b> contra <b>340</b> en sistema: faltante de <b>27 cajas</b>, un 7,9% de error de inventario. El informe de stock se envía a jefatura; el ajuste en el WMS solo se hace con su autorización, después de descartar errores de digitación, mermas o despachos sin registrar.',
  },
  10: {
    key: '63', keyName: 'Clave E3-2',
    competencia: 'Ubicaciones y sistema de localización',
    check(m) {
      const cell = $('.loc-cell.selected', m);
      if (!cell) return { soft: 'Marca una posición en el plano del rack.' };
      const { aisle, rack, level } = cell.dataset;
      const fail = (hint) => { cell.classList.remove('selected'); $('#loc-picked').textContent = '—'; return { hint }; };
      if (aisle !== 'A') return fail(`Marcaste una posición del <b>Pasillo ${aisle}</b>. La primera parte del código A-06-3 indica el pasillo: cambia de pestaña antes de marcar.`);
      if (rack !== '06') return fail(`El pasillo es correcto, pero marcaste el rack ${rack}. El número del medio del código (A-<b>06</b>-3) indica el rack: búscalo en la fila inferior del plano.`);
      if (level !== '3') return fail(`Pasillo y rack correctos, pero marcaste el nivel ${level}. Los niveles se cuentan <b>desde el piso hacia arriba</b>: el nivel 1 es el de abajo.`);
      cell.classList.add('right');
      return { ok: true };
    },
    success: 'Ubicación <b>A-06-3</b>: Pasillo A, Rack 06, Nivel 3. Un código de localización único por posición permite que cualquier operador, o el lector de radiofrecuencia, encuentre el pallet sin depender de la memoria de nadie.',
  },
  11: {
    key: '36', keyName: 'Clave E3-3',
    competencia: 'Layout de bodega y cubicaje de espacios',
    check(m) {
      const rows = $$('.assign-row', m);
      rows.forEach((r) => r.classList.remove('bad', 'good'));
      const v = Object.fromEntries(rows.map((r) => [$('select', r).dataset.product, $('select', r).value]));
      const cube = $('#cube-input', m).value.trim();
      if (Object.values(v).some((x) => !x)) return { soft: 'Asigna un nivel a cada uno de los tres productos.' };
      if (new Set(Object.values(v)).size < 3) return { soft: 'Cada producto debe quedar en un nivel distinto del rack.' };
      if (cube === '') return { soft: 'Falta la Parte 2: indica cuántas cajas caben en un hueco.' };
      const mark = (p) => rows.find((r) => $('select', r).dataset.product === p).classList.add('bad');
      if (v.bidones !== 'piso') { mark('bidones'); return { hint: 'Los bidones pesan <b>22 kg</b> cada uno. La carga más pesada va siempre en el <b>nivel piso</b>: baja el centro de gravedad del rack y evita que alguien levante peso sobre los hombros o que un bidón caiga desde altura.' }; }
      if (v.guantes !== 'medio') { mark('guantes'); return { hint: 'Los guantes son livianos y de <b>rotación alta</b>: se retiran a diario. Lo que más se mueve va a la <b>altura de picking</b> (entre cintura y hombros), donde se toma sin escalera ni agacharse.' }; }
      if (cube !== '36') return { hint: 'El layout está correcto, pero el cubicaje no. Calcula cuántas cajas entran <b>por cada dimensión</b> y multiplica: frente 2,4 ÷ 0,6 · fondo 1,2 ÷ 0,4 · alto 1,2 ÷ 0,4.' };
      rows.forEach((r) => r.classList.add('good'));
      return { ok: true };
    },
    success: 'Pesado abajo, alta rotación a la altura de picking y baja rotación arriba. Cubicaje: 4 cajas de frente × 3 de fondo × 3 de alto = <b>36 cajas</b> por hueco (3,456 m³ ÷ 0,096 m³). En terreno se descuenta además la holgura de maniobra de la grúa.',
  },
  12: {
    code: '276336', keypad: true,
    competencia: 'Cierre de turno y cuadratura de inventario',
    hints: [
      'Código incorrecto. El Código de Cierre tiene <b>6 dígitos</b>: une las claves en orden <b>E3-1 + E3-2 + E3-3</b>. Revisa la Bitácora de Claves.',
      'Aún no coincide. Clave E3-1 = cajas faltantes del conteo, Clave E3-2 = rack y nivel de la ubicación (sin el cero ni la letra), Clave E3-3 = cajas por hueco.',
    ],
    success: 'Código de Cierre aceptado. Inventario cuadrado e informado: turno cerrado.',
  },
};

// Etapa 4 — datos de las lecturas RF y pasos de la transacción de salida
const SCANS = {
  41: ['SKU 408', 'Guantes quirúrgicos', 'Lote #31'],
  42: ['SKU 517', 'Suero fisiológico', 'Lote #19'],
  43: ['SKU 245', 'Jeringas 5 ml', 'Lote #08'],
  44: ['SKU 517', 'Suero fisiológico', 'Lote #22'],
  45: ['SKU 112', 'Mascarillas N95', 'Lote #45'],
};
const RF_STEPS = {
  1: 'Iniciar sesión en el terminal RF y abrir la orden de despacho',
  2: 'Escanear la ubicación de origen del pallet',
  3: 'Escanear la etiqueta del pallet',
  4: 'Confirmar en pantalla la cantidad retirada',
  5: 'Escanear el andén de destino y confirmar la transacción',
};
const RF_SHUFFLED = [3, 5, 1, 4, 2];

Object.assign(DEFS, {
  13: {
    key: '44', keyName: 'Clave E4-1',
    competencia: 'Lectura RF y control contra la orden',
    check(m) {
      const cards = $$('.scan-card', m);
      const pending = cards.filter((c) => !c.classList.contains('read')).length;
      if (pending) return { soft: `Te faltan ${pending} pallet(s) por escanear. No se informa una no conformidad sin haber leído todas las etiquetas.` };
      const sel = $('.scan-card.selected', m);
      if (!sel) return { soft: 'Toca el pallet que no coincide con la orden para marcarlo como no conforme.' };
      if (sel.dataset.pallet !== '44') {
        sel.classList.add('wrong'); sel.classList.remove('selected');
        $('#scan-picked').textContent = '—';
        return { hint: `El pallet ${sel.dataset.pallet} coincide con la orden. Una lectura RF se compara en <b>dos datos</b>: que el SKU esté en la orden y que el <b>lote</b> sea exactamente el exigido. Hay un SKU que aparece dos veces: revisa ambos.` };
      }
      sel.classList.add('right');
      return { ok: true };
    },
    success: 'El pallet 44 trae el SKU correcto (517) pero el <b>lote #22</b>; la orden exige el <b>#19</b>, el más antiguo según FIFO. La lectura por radiofrecuencia lo detecta antes de cargar y deja el dato informado en el sistema, con trazabilidad de quién lo leyó y cuándo.',
  },
  14: {
    key: '51', keyName: 'Clave E4-2',
    competencia: 'Comunicación de salidas por sistema RF',
    check(m) {
      const items = $$('.order-item', m);
      items.forEach((it) => it.classList.remove('good'));
      const order = items.map((it) => +it.dataset.step);
      const okCount = order.filter((s, i) => s === i + 1).length;
      if (okCount === 5) { items.forEach((it) => it.classList.add('good')); return { ok: true }; }
      items.forEach((it, i) => it.classList.toggle('good', order[i] === i + 1));
      let tip = 'Piensa en el recorrido físico: primero <b>de dónde</b> sale el pallet, después <b>qué</b> pallet es.';
      if (order[0] !== 1) tip = 'Sin sesión iniciada y sin la orden abierta, el terminal no sabe a qué despacho cargar las lecturas. Ese es siempre el primer paso.';
      else if (order[4] !== 5) tip = 'La transacción se confirma <b>al final</b>, cuando el pallet ya está en el andén de destino. Si confirmas antes, el sistema da por despachado algo que sigue en el rack.';
      else if (order.indexOf(4) < order.indexOf(3)) tip = 'No se puede confirmar una cantidad antes de escanear la etiqueta del pallet: el sistema aún no sabe qué producto estás moviendo.';
      return { hint: `Hay <b>${okCount} de 5</b> pasos en su posición (marcados en verde). ${tip}` };
    },
    success: 'Secuencia correcta: sesión y orden → ubicación de origen → etiqueta del pallet → cantidad → andén y confirmación. Al confirmar, el WMS descuenta el stock y deja comunicada la salida en tiempo real. <b>Transacción N° 51</b> registrada.',
  },
  15: {
    key: '90', keyName: 'Clave E4-3',
    competencia: 'Indicadores de servicio e informe a jefatura',
    check(m) {
      const total = $('#kpi-total', m).value.trim(), ok = $('#kpi-ok', m).value.trim(), pct = $('#kpi-pct', m).value.trim().replace(',', '.');
      const sel = $('.opt-card.selected', m);
      if (!total || !ok || !pct) return { soft: 'Completa los tres datos del indicador.' };
      if (!sel) return { soft: 'Indica si el resultado cumple o no la meta de 95%.' };
      if (total !== '40') return { hint: 'El total de pedidos despachados no cuadra. Suma la columna <b>Pedidos despachados</b> de los cinco días.' };
      if (ok !== '36') return { hint: 'El total está bien, pero los pedidos completos y a tiempo no. Suma la <b>tercera columna</b> de lunes a viernes.' };
      if (Math.abs(parseFloat(pct) - 90) > 0.05) return { hint: 'Las sumas están bien, pero el porcentaje no. <b>Nivel de servicio = (completos y a tiempo ÷ total despachados) × 100</b>.' };
      if (sel.dataset.value !== 'bajo') {
        sel.classList.add('wrong'); sel.classList.remove('selected');
        return { hint: 'El cálculo es correcto, pero la lectura no: <b>90%</b> es menor que la meta de <b>95%</b>. Un indicador solo sirve si se compara contra su meta.' };
      }
      return { ok: true };
    },
    success: '36 de 40 pedidos completos y a tiempo: <b>90%</b>, cinco puntos bajo la meta. El dato se informa a jefatura junto con los 4 pedidos fallidos y su causa (por ejemplo, el faltante de guantes de la Estación 01), que es lo que permite corregir.',
  },
  16: {
    code: '445190', keypad: true,
    competencia: 'Reporte final y cierre del centro de control',
    hints: [
      'Código incorrecto. El Código de Control tiene <b>6 dígitos</b>: une las claves en orden <b>E4-1 + E4-2 + E4-3</b>. Revisa la Bitácora de Claves.',
      'Aún no coincide. Clave E4-1 = N° del pallet no conforme, Clave E4-2 = N° de la transacción confirmada, Clave E4-3 = nivel de servicio en porcentaje.',
    ],
    success: 'Código de Control aceptado. Reporte enviado al hospital y a jefatura: operación completa.',
  },
});

const STAGE_IDS = { 1: [1, 2, 3, 4], 2: [5, 6, 7, 8], 3: [9, 10, 11, 12], 4: [13, 14, 15, 16] };
const ZONES = { 1: 'BODEGA INTERNA', 2: 'PATIO DE EMBARQUE', 3: 'CIERRE DE TURNO', 4: 'CENTRO DE CONTROL' };

// ---------------------------------------------------------------------
class ChallengeManager {
  constructor(scene) {
    this.scene = scene;
    this.cert = new CertificateGenerator();
    this.player = { name: '', course: '' };
    this.lastStage = 2;
    this.allowed = TOTAL_TIME;
    this.timeLeft = TOTAL_TIME;
    this.elapsed = 0;
    this.errors = 0;
    this.stage = 1;
    this.solved = new Set();
    this.tries = {};
    this.running = false;
    this.active = null;
    this.busy = false;
    this.finished = false;
    this._bindUI();
    this._buildKeypads();
    scene.onSelect = (id) => this.open(id);
    this._tick = this._tick.bind(this);
    this._last = performance.now();
    setInterval(this._tick, 200);
  }

  // ------------------------------------------------------------------
  _bindUI() {
    const form = $('#welcome-form');
    const nameI = $('#player-name'), courseI = $('#player-course'), startB = $('#btn-start');
    // Los equipos del liceo son compartidos: el nombre no se recuerda entre partidas.
    // Se borra lo que versiones anteriores dejaron guardado en este navegador.
    try { localStorage.removeItem('odc_name'); localStorage.removeItem('odc_course'); } catch { /* almacenamiento no disponible */ }
    const valid = () => (startB.disabled = !(nameI.value.trim().length >= 3 && courseI.value.trim().length >= 2));
    nameI.addEventListener('input', valid);
    courseI.addEventListener('input', valid);
    valid();
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (startB.disabled) return;
      this.start(nameI.value.trim(), courseI.value.trim(), $('input[name="mode"]:checked').value);
    });
    // Las tarjetas de etapa y la nota de tiempo siguen al modo elegido
    const NOTES = {
      2: 'Misión corta: 15:00 en total.',
      3: 'Empiezas con 15:00. Al iniciar la Etapa 3 se suman 10:00 (total 25:00).',
      4: 'Empiezas con 15:00. Al iniciar la Etapa 3 y la Etapa 4 se suman 10:00 cada una (total 35:00).',
    };
    const syncMode = () => {
      const m = +$('input[name="mode"]:checked').value;
      $$('#stage-preview > div').forEach((d) => d.classList.toggle('off', +d.dataset.stage > m));
      $('#mode-note').textContent = NOTES[m];
    };
    $$('input[name="mode"]').forEach((r) => r.addEventListener('change', () => { audio.click(); syncMode(); }));
    syncMode();

    // Estación 10: plano de ubicaciones (pasillo – rack – nivel)
    const grid = $('#loc-grid');
    const drawGrid = (aisle) => {
      const racks = ['04', '05', '06', '07'];
      let html = '';
      for (const lv of ['4', '3', '2', '1']) {
        html += `<span class="lg-h">NIVEL ${lv}</span>` + racks.map((rk) => `<button type="button" class="loc-cell" data-aisle="${aisle}" data-rack="${rk}" data-level="${lv}" aria-label="Pasillo ${aisle}, rack ${rk}, nivel ${lv}"></button>`).join('');
      }
      html += '<span class="lg-h">PISO</span>' + racks.map((rk) => `<span class="lg-h">RACK ${rk}</span>`).join('');
      grid.innerHTML = html;
      $('#loc-picked').textContent = '—';
    };
    drawGrid('B');
    $$('.aisle-tab').forEach((t) => t.addEventListener('click', () => {
      if (this.solved.has(10)) return;
      audio.click();
      $$('.aisle-tab').forEach((o) => o.classList.toggle('selected', o === t));
      drawGrid(t.dataset.aisle);
    }));
    grid.addEventListener('click', (e) => {
      const c = e.target.closest('.loc-cell');
      if (!c || this.solved.has(10)) return;
      audio.click();
      $$('.loc-cell', grid).forEach((o) => o.classList.toggle('selected', o === c));
      $('#loc-picked').textContent = `Pasillo ${c.dataset.aisle} · Rack ${c.dataset.rack} · Nivel ${c.dataset.level}`;
    });
    $('#btn-stage3').addEventListener('click', () => this.beginStage(3, 'Etapa 3 activa · 4 estaciones de cierre de turno'));
    $('#btn-stage4').addEventListener('click', () => this.beginStage(4, 'Etapa 4 activa · 4 estaciones en el centro de control'));

    // Estación 13: lecturas del lector RF (primer toque escanea, segundo marca)
    const scanList = $('#scan-list');
    scanList.innerHTML = Object.keys(SCANS).map((p) => `<button type="button" class="scan-card" data-pallet="${p}"><b>PALLET ${p}</b><span class="bars-ico">▮▯▮▮▯▮▯▯▮</span><small>Sin leer<br>Tocar para escanear</small></button>`).join('');
    scanList.addEventListener('click', (e) => {
      const c = e.target.closest('.scan-card');
      if (!c || this.solved.has(13)) return;
      if (!c.classList.contains('read')) {
        audio.dtmf('OK');
        c.classList.add('read');
        $('small', c).innerHTML = SCANS[c.dataset.pallet].join('<br>');
        return;
      }
      audio.click();
      $$('.scan-card', scanList).forEach((o) => o.classList.toggle('selected', o === c));
      $('#scan-picked').textContent = 'Pallet ' + c.dataset.pallet;
    });

    // Estación 14: ordenar los pasos de la transacción RF
    const orderList = $('#order-list');
    const drawOrder = (steps) => {
      orderList.innerHTML = steps.map((s, i) => `<li class="order-item" data-step="${s}"><span>${RF_STEPS[s]}</span><span class="mv"><button type="button" data-dir="-1" aria-label="Subir" ${i === 0 ? 'disabled' : ''}>▲</button><button type="button" data-dir="1" aria-label="Bajar" ${i === steps.length - 1 ? 'disabled' : ''}>▼</button></span></li>`).join('');
    };
    drawOrder(RF_SHUFFLED);
    orderList.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-dir]');
      if (!b || this.solved.has(14)) return;
      const steps = $$('.order-item', orderList).map((it) => +it.dataset.step);
      const i = steps.indexOf(+b.closest('.order-item').dataset.step), j = i + +b.dataset.dir;
      if (j < 0 || j >= steps.length) return;
      [steps[i], steps[j]] = [steps[j], steps[i]];
      audio.click();
      drawOrder(steps);
    });

    $('#btn-view').addEventListener('click', () => {
      if (this.active || this.busy || !this.running) return;
      audio.whoosh();
      this.scene.resetCamera(true);
    });
    $('#btn-audio').addEventListener('click', (e) => {
      audio.init();
      const muted = audio.toggleMute();
      $('#audio-icon').textContent = muted ? '🔇' : '🔊';
      e.currentTarget.setAttribute('aria-pressed', muted);
    });
    const logB = $('#btn-log'), log = $('#logbook');
    logB.addEventListener('click', () => {
      audio.click();
      log.hidden = !log.hidden;
      logB.setAttribute('aria-expanded', !log.hidden);
    });
    document.addEventListener('pointerdown', (e) => {
      if (!log.hidden && !log.contains(e.target) && !logB.contains(e.target)) { log.hidden = true; logB.setAttribute('aria-expanded', false); }
    });

    // Modales
    $$('.modal').forEach((m) => {
      const id = +m.dataset.station;
      $$('[data-close]', m).forEach((b) => b.addEventListener('click', () => this.close()));
      const v = $('[data-validate]', m);
      if (v) v.addEventListener('click', () => this.validate(id));
      $$('.opt-card', m).forEach((c) => c.addEventListener('click', () => {
        if (this.solved.has(id)) return;
        audio.click();
        $$('.opt-card', m).forEach((o) => o.classList.remove('selected'));
        c.classList.add('selected');
      }));
    });
    // Estación 01: selección de fila sincronizada entre ambos documentos
    const m1 = $('#modal-1');
    $$('tbody tr', m1).forEach((tr) => tr.addEventListener('click', () => {
      if (this.solved.has(1)) return;
      audio.click();
      $$('tbody tr', m1).forEach((r) => r.classList.toggle('selected', r.dataset.sku === tr.dataset.sku));
      $('#sku-selected').textContent = 'SKU ' + tr.dataset.sku;
    }));
    $('#diff-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') this.validate(1); });

    // Salir de la misión: el cronómetro sigue corriendo mientras se confirma,
    // para que el aviso no sirva como pausa
    const exitM = $('#exit-modal');
    const closeExit = () => exitM.classList.add('hidden');
    $('#btn-exit').addEventListener('click', () => {
      if (!exitM.classList.contains('hidden')) return;
      audio.click();
      exitM.classList.remove('hidden');
      $('#btn-exit-cancel').focus();
    });
    $('#btn-exit-cancel').addEventListener('click', () => { audio.click(); closeExit(); });
    $('#btn-exit-confirm').addEventListener('click', () => location.reload());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !exitM.classList.contains('hidden')) { e.stopImmediatePropagation(); closeExit(); }
    }, true);

    $('#btn-stage2').addEventListener('click', () => this.beginStage2());
    $('#btn-cert').addEventListener('click', () => this.downloadCert());
    $('#btn-replay').addEventListener('click', () => location.reload());
    $('#btn-retry').addEventListener('click', () => location.reload());

    document.addEventListener('keydown', (e) => this._onKey(e));
    window.addEventListener('quality-changed', () => this.toast('Modo rendimiento activado para este equipo'));
  }

  _buildKeypads() {
    this.pads = {};
    $$('.keypad').forEach((kp) => {
      const id = +kp.closest('.modal').dataset.station;
      const len = +kp.dataset.length;
      kp.innerHTML = `<div class="kp-display">${'_'.repeat(len)}</div><div class="kp-grid">${['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'OK']
        .map((k) => `<button type="button" class="kp-key ${k === 'C' ? 'c' : k === 'OK' ? 'ok' : ''}" data-k="${k}">${k}</button>`).join('')}</div>`;
      const pad = { el: kp, len, value: '', display: $('.kp-display', kp) };
      this.pads[id] = pad;
      $$('.kp-key', kp).forEach((b) => b.addEventListener('click', () => this._press(id, b.dataset.k)));
    });
  }

  _press(id, k) {
    const pad = this.pads[id];
    if (!pad || this.solved.has(id) || this.busy) return;
    audio.dtmf(k);
    pad.display.classList.remove('err');
    if (k === 'C') pad.value = '';
    else if (k === 'OK') return this.validate(id);
    else if (pad.value.length < pad.len) pad.value += k;
    pad.display.textContent = pad.value.padEnd(pad.len, '_');
  }

  _onKey(e) {
    if (!this.active) return;
    if (e.key === 'Escape') return this.close();
    const pad = this.pads[this.active];
    if (!pad) return;
    let k = null;
    if (/^[0-9]$/.test(e.key)) k = e.key;
    else if (e.key === 'Enter') k = 'OK';
    else if (e.key === 'Backspace' || e.key === 'Delete') {
      pad.value = pad.value.slice(0, -1);
      pad.display.textContent = pad.value.padEnd(pad.len, '_');
      audio.click();
      return;
    }
    if (!k) return;
    e.preventDefault();
    const btn = $(`.kp-key[data-k="${k}"]`, pad.el);
    btn.classList.add('press');
    setTimeout(() => btn.classList.remove('press'), 110);
    this._press(this.active, k);
  }

  // ------------------------------------------------------------------
  start(name, course, mode = '2') {
    this.player = { name, course };
    this.lastStage = Math.min(4, Math.max(2, +mode || 2));
    $('.log-stage.stage3').hidden = this.lastStage < 3;
    $('.log-stage.stage4').hidden = this.lastStage < 4;
    audio.init();
    audio.whoosh();
    $('#welcome-screen').classList.add('hidden');
    $('#hud').classList.remove('hidden');
    $('#hint-bar').classList.remove('hidden');
    setTimeout(() => $('#hint-bar').classList.add('hidden'), 9000);
    this.scene.start();
    this.running = true;
    this._last = performance.now();
    this._updateHUD();
  }

  _tick() {
    const now = performance.now();
    const dt = Math.min((now - this._last) / 1000, 1);
    this._last = now;
    if (!this.running || this.finished) return;
    this.timeLeft -= dt;
    this.elapsed += dt;
    const sec = Math.ceil(this.timeLeft);
    if (sec !== this._sec) {
      this._sec = sec;
      $('#timer').textContent = fmt(this.timeLeft);
      const crit = this.timeLeft <= 180;
      $('#timer-box').classList.toggle('critical', crit);
      if (crit && (sec <= 30 || sec % 2 === 0)) audio.alertPulse(sec <= 30);
    }
    if (this.timeLeft <= 0) this.timeout();
  }

  _updateHUD() {
    const ids = STAGE_IDS[this.stage];
    const n = ids.filter((i) => this.solved.has(i)).length;
    $('#stage-label').textContent = `ETAPA ${this.stage} (${n}/4)`;
    $('#stage-zone').textContent = ZONES[this.stage];
    $$('#stage-pips i').forEach((p, i) => p.classList.toggle('on', this.solved.has(ids[i])));
    document.body.classList.toggle('stage-2', this.stage === 2);
    document.body.classList.toggle('stage-3', this.stage === 3);
    document.body.classList.toggle('stage-4', this.stage === 4);
    $('.log-stage.stage2').classList.toggle('locked', this.stage < 2);
    $('.log-stage.stage3').classList.toggle('locked', this.stage < 3);
    $('.log-stage.stage4').classList.toggle('locked', this.stage < 4);
    // Bitácora
    $$('#logbook li').forEach((li) => {
      const id = +li.dataset.key;
      if (this.solved.has(id)) { li.classList.add('found'); $('b', li).textContent = DEFS[id].key; }
    });
    const code = (list) => list.map((i) => (this.solved.has(i) ? DEFS[i].key : '·'.repeat(DEFS[i].key.length))).join(' ');
    $('#code-1').textContent = code([1, 2, 3]);
    $('#code-2').textContent = code([5, 6, 7]);
    $('#code-3').textContent = code([9, 10, 11]);
    $('#code-4').textContent = code([13, 14, 15]);
    // Ranuras de claves en los teclados
    $$('.key-slots').forEach((box) => {
      box.innerHTML = box.dataset.slots.split(',').map((i) => {
        const ok = this.solved.has(+i);
        return `<span class="${ok ? 'found' : ''}"><small>${DEFS[i].keyName.toUpperCase()}</small>${ok ? DEFS[i].key : '?'.repeat(DEFS[i].key.length)}</span>`;
      }).join('');
    });
  }

  toast(msg, ms = 2600) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(this._tt);
    this._tt = setTimeout(() => t.classList.remove('show'), ms);
  }

  // ------------------------------------------------------------------
  open(id) {
    if (this.busy || this.active || !this.running || this.finished) return;
    if (STATIONS[id].stage !== this.stage) return;
    if (this.solved.has(id)) return this.toast(`Estación ${STATIONS[id].num} ya resuelta · Clave en la bitácora`);
    this.busy = true;
    audio.whoosh();
    $('#logbook').hidden = true;
    this.scene.focusStation(id, () => {
      this.busy = false;
      this.active = id;
      const m = $('#modal-' + id);
      m.classList.add('open');
      m.setAttribute('aria-hidden', 'false');
      audio.click();
    });
  }

  close(after) {
    if (!this.active) return;
    const m = $('#modal-' + this.active);
    m.classList.remove('open');
    m.setAttribute('aria-hidden', 'true');
    this.active = null;
    audio.click();
    if (after) after();
    else this.scene.resetCamera(false);
  }

  _feedback(m, type, title, html) {
    const f = $('[data-feedback]', m);
    f.className = 'feedback show ' + type;
    f.innerHTML = `<h5>${title}</h5><div>${html}</div>`;
    f.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  validate(id) {
    if (this.busy || this.solved.has(id)) return;
    const def = DEFS[id];
    const m = $('#modal-' + id);
    let res;
    if (def.keypad) {
      const pad = this.pads[id];
      if (pad.value.length < pad.len) res = { soft: `El código tiene ${pad.len} dígitos. Llevas ${pad.value.length}.` };
      else if (pad.value === def.code) res = { ok: true };
      else res = { hint: def.hints[Math.min(this.tries[id] || 0, def.hints.length - 1)] };
    } else if (def.check) {
      res = def.check(m);
    } else {
      const sel = $('.opt-card.selected', m);
      if (!sel) res = { soft: 'Selecciona una alternativa antes de validar.' };
      else if (sel.dataset.value === def.answer) res = { ok: true };
      else { res = { hint: def.hints[sel.dataset.value] }; sel.classList.add('wrong'); sel.classList.remove('selected'); }
    }

    if (res.soft) {
      audio.click();
      return this._feedback(m, 'bad', 'FALTA INFORMACIÓN', res.soft);
    }
    if (!res.ok) return this._fail(id, m, res.hint);
    this._solve(id, m);
  }

  _fail(id, m, hint) {
    this.tries[id] = (this.tries[id] || 0) + 1;
    this.errors++;
    this.timeLeft -= PENALTY;
    this._sec = null;
    audio.error();
    const card = $('.modal-card', m);
    card.classList.remove('shake');
    void card.offsetWidth;
    card.classList.add('shake');
    const p = document.createElement('div');
    p.className = 'penalty';
    p.textContent = '−15s';
    $('#penalty-layer').appendChild(p);
    setTimeout(() => p.remove(), 1500);
    $('#timer-box').classList.add('hit');
    document.body.classList.add('flash-red');
    setTimeout(() => { $('#timer-box').classList.remove('hit'); document.body.classList.remove('flash-red'); }, 620);
    const pad = this.pads[id];
    if (pad) {
      pad.display.classList.add('err');
      pad.display.textContent = 'ERROR'.padEnd(pad.len, ' ').slice(0, pad.len);
      pad.value = '';
      setTimeout(() => { if (!this.solved.has(id)) { pad.display.classList.remove('err'); pad.display.textContent = '_'.repeat(pad.len); } }, 1100);
    }
    this._feedback(m, 'bad', 'PISTA FORMATIVA · −15 SEGUNDOS', hint);
  }

  _solve(id, m) {
    const def = DEFS[id];
    this.solved.add(id);
    this.scene.markSolved(id);
    audio.success();
    $$('.opt-card.selected', m).forEach((c) => c.classList.add('right'));
    const chip = def.key ? `<div class="key-chip">${def.keyName} registrada en bitácora <b>${def.key}</b></div>` : '';
    this._feedback(m, 'ok', '✓ CORRECTO', def.success + chip);
    if (def.key) setTimeout(() => audio.keyUnlock(), 480);
    this._updateHUD();

    if (def.keypad) {
      const pad = this.pads[id];
      pad.display.classList.add('ok');
      pad.display.textContent = def.code;
      this.busy = true;
      this.running = false; // el cronómetro se detiene durante la cinemática
      setTimeout(() => {
        this.busy = false;
        this.close(() => (id === 4 ? this.crossToStage2() : id === 8 ? this.finish() : id === 12 ? this.finishShift() : this.finishMission()));
      }, 1300);
      return;
    }
    const v = $('[data-validate]', m);
    v.textContent = 'Continuar →';
    v.classList.add('go');
    const nv = v.cloneNode(true);
    v.replaceWith(nv);
    nv.addEventListener('click', () => {
      this.close();
      const ids = STAGE_IDS[this.stage].slice(0, 3);
      if (ids.every((i) => this.solved.has(i))) {
        const next = { 1: 'al Panel del Portón (04)', 2: 'a la Consola Flota 72 (08)', 3: 'al Tótem de Cierre (12)', 4: 'a la Consola de Control (16)' }[this.stage];
        setTimeout(() => this.toast(`Tienes las 3 claves · Ve ${next}`, 4200), 900);
      }
    });
  }

  // ------------------------------------------------------------------
  crossToStage2() {
    this.busy = true;
    document.body.classList.add('cinema');
    audio.gate();
    setTimeout(() => audio.setStageAmbience(2), 4000);
    this.scene.openGateAndCross(() => {
      document.body.classList.remove('cinema');
      this.stage = 2;
      this._updateHUD();
      $('#stage2-time').textContent = fmt(this.timeLeft);
      $('#stage2-modal').classList.remove('hidden');
      audio.success();
    });
  }

  beginStage2() {
    audio.click();
    $('#stage2-modal').classList.add('hidden');
    this.scene.showMarkers(true);
    this.busy = false;
    this.running = true;
    this._last = performance.now();
    this.toast('Etapa 2 activa · 4 nuevas estaciones en el patio', 3600);
  }

  finish() {
    const full = this.lastStage > 2;
    this.finished = !full;
    this.busy = true;
    document.body.classList.add('cinema');
    audio.truck();
    this.scene.dispatchTruck(() => {
      if (!full) {
        document.body.classList.remove('cinema');
        return this.showVictory();
      }
      this.returnToStage3();
    });
  }

  // Misión completa: corte a negro y regreso a la bodega para el cierre de turno
  returnToStage3() {
    const fader = $('#fader');
    fader.classList.add('on');
    setTimeout(() => {
      audio.gate();
      this.scene.returnToWarehouse(() => {
        document.body.classList.remove('cinema');
        this._enterStage(3);
      });
      setTimeout(() => fader.classList.remove('on'), 250);
    }, 700);
  }

  // Suma 10 minutos, actualiza el HUD y muestra el briefing de la etapa
  _enterStage(n) {
    this.stage = n;
    this.timeLeft += 600;
    this.allowed += 600;
    this._sec = null;
    $('#timer').textContent = fmt(this.timeLeft);
    $('#timer-box').classList.toggle('critical', this.timeLeft <= 180);
    this._updateHUD();
    $(`#stage${n}-time`).textContent = fmt(this.timeLeft);
    $(`#stage${n}-modal`).classList.remove('hidden');
    audio.success();
  }

  beginStage(n, msg) {
    audio.click();
    $(`#stage${n}-modal`).classList.add('hidden');
    this.scene.showMarkers(true);
    this.busy = false;
    this.running = true;
    this._last = performance.now();
    this.toast(msg, 3600);
  }

  // Fin de la Etapa 3: victoria en Misión Extendida o paso al centro de control
  finishShift() {
    this.busy = true;
    if (this.lastStage < 4) return this.finishMission();
    const fader = $('#fader');
    fader.classList.add('on');
    setTimeout(() => {
      audio.whoosh();
      this.scene.goToStage(4, () => this._enterStage(4));
      setTimeout(() => fader.classList.remove('on'), 250);
    }, 700);
  }

  finishMission() {
    this.finished = true;
    this.busy = true;
    this.scene.resetCamera(true, () => setTimeout(() => this.showVictory(), 500));
  }

  _results() {
    const used = Math.round(this.elapsed);
    const eff = Math.max(10, Math.min(100, Math.round(100 - this.errors * 6 - (used / this.allowed) * 30)));
    let rank = 'Operador/a Logístico en Formación';
    if (eff >= 90) rank = 'Jefe/a de Operaciones Logísticas · Élite';
    else if (eff >= 75) rank = 'Supervisor/a de Despacho Senior';
    else if (eff >= 55) rank = 'Coordinador/a de Bodega';
    return {
      name: this.player.name, course: this.player.course,
      time: fmt(used), efficiency: eff, rank, errors: this.errors,
      competencias: Object.keys(DEFS).map(Number).filter((i) => this.solved.has(i)).map((i) => DEFS[i].competencia),
      date: new Date(),
    };
  }

  showVictory() {
    const r = (this.results = this._results());
    if (this.lastStage === 3) $('#v-eyebrow').textContent = '✓ DESPACHO EN RUTA · INVENTARIO CUADRADO · TURNO CERRADO';
    if (this.lastStage === 4) $('#v-eyebrow').textContent = '✓ DESPACHO EN RUTA · TURNO CERRADO · REPORTE ENVIADO';
    $('#v-name').textContent = r.name;
    $('#v-course').textContent = r.course;
    $('#v-time').textContent = r.time;
    $('#v-eff').textContent = r.efficiency + '%';
    $('#v-err').textContent = r.errors;
    $('#v-rank').textContent = r.rank;
    $('#hud').classList.add('hidden');
    $('#victory-screen').classList.remove('hidden');
    audio.victory();
    this._confetti();
    // Vista previa del certificado
    this.cert.render(r).then((canvas) => {
      const img = $('#cert-preview');
      img.src = canvas.toDataURL('image/jpeg', 0.8);
      img.hidden = false;
    });
  }

  downloadCert() {
    audio.keyUnlock();
    this.cert.download(this.results);
    this.toast('Certificado descargado en PNG (2000 × 1414 px)');
  }

  timeout() {
    $('#exit-modal').classList.add('hidden'); // si el tiempo se agota con el aviso de salida abierto
    this.finished = true;
    this.running = false;
    this.timeLeft = 0;
    $('#timer').textContent = '00:00';
    if (this.active) { $('#modal-' + this.active).classList.remove('open'); this.active = null; }
    const ids = STAGE_IDS[this.stage];
    $('#to-progress').textContent = `Etapa ${this.stage}, ${ids.filter((i) => this.solved.has(i)).length} de 4 estaciones`;
    audio.timeout();
    $('#timeout-screen').classList.remove('hidden');
  }

  _confetti() {
    const cv = $('#confetti'), g = cv.getContext('2d');
    const W = (cv.width = innerWidth), H = (cv.height = innerHeight);
    const cols = ['#3de8ff', '#ffb020', '#35f0a0', '#ffffff', '#b06bff'];
    const ps = Array.from({ length: 170 }, () => ({
      x: Math.random() * W, y: -20 - Math.random() * H * 0.6, vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 4,
      s: 5 + Math.random() * 7, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, c: cols[Math.floor(Math.random() * cols.length)],
    }));
    const t0 = performance.now();
    const step = (t) => {
      g.clearRect(0, 0, W, H);
      for (const p of ps) {
        p.x += p.vx; p.y += p.vy; p.r += p.vr;
        g.save(); g.translate(p.x, p.y); g.rotate(p.r);
        g.fillStyle = p.c; g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
        g.restore();
      }
      if (t - t0 < 7000) requestAnimationFrame(step);
      else g.clearRect(0, 0, W, H);
    };
    requestAnimationFrame(step);
  }
}

// ---------------------------------------------------------------------
// Arranque: se valida document.readyState para evitar condiciones de
// carrera con la carga asíncrona de módulos ES6.
// ---------------------------------------------------------------------
async function boot() {
  const loaderText = $('#loader-text');
  try {
    if (!window.gsap) throw new Error('No se pudo cargar GSAP desde el CDN. Revisa la conexión a internet.');
    const fonts = ['900 20px Orbitron', '700 20px "JetBrains Mono"', '700 20px Inter'].map((f) => document.fonts.load(f));
    await Promise.race([Promise.all(fonts), new Promise((r) => setTimeout(r, 2500))]);
    await new Promise((r) => setTimeout(r, 60));
    const q = new URLSearchParams(location.search).get('q') === 'low' ? 'low' : 'high';
    const scene = new WarehouseScene($('#scene-container'), $('#hotspot-layer'), { quality: q });
    const game = new ChallengeManager(scene);
    window.__odc = { game, scene, audio };
    $('#loader').classList.add('hidden');
  } catch (err) {
    console.error(err);
    loaderText.textContent = 'Error al iniciar: ' + err.message;
    loaderText.style.color = '#ff3b4e';
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
