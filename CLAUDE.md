# Proyecto: OPERACIÓN DESPACHO CRÍTICO 360° — EDICIÓN MULTI-ETAPA PROGRESIVA (Built with Fable 5.2)

## 1. Visión del Producto
Simulador educativo inmersivo estilo *Escape Room* en 3D/360° con calidad visual y técnica de nivel profesional (AAA Web), diseñado para estudiantes de **4° Medio de Educación Media Técnico-Profesional en Chile (Especialidad Administración — Módulo: Logística, Almacenamiento y Distribución)**.

Combina estética industrial moderna (iluminación volumétrica dual, texturas 100% procedurales en HTML5 Canvas, partículas en suspensión, post-procesado `UnrealBloomPass` y HUD *Glassmorphism*) con una narrativa operativa estructurada en **2 Etapas Progresivas conectadas espacialmente en 3D**:
- **ETAPA 1 — Bodega Interna AndesCargo (4 Estaciones):** Auditoría documental, rotación de inventario FIFO/PEPS, cubicaje de transporte TMS y desbloqueo del Portón Metálico del Andén 01 (`4081972`).
- **Transición Cinematográfica 3D:** Al ingresar el Código Maestro de la Etapa 1, la baliza cambia de rojo a verde, la cortina metálica 3D se enrolla en su cabezal superior con sonido hidráulico y la cámara ejecuta un *travelling* automático con **GSAP** atravesando el portón hacia la explanada exterior.
- **ETAPA 2 — Patio de Maniobras y Embarque Exterior (4 Estaciones):** Control normativo de Cadena de Frío MINSAL (`+2°C a +8°C`), Clasificación ABC de Inventarios (Ley de Pareto 80/20), Prevención de Riesgos en Grúa Horquilla (`Ley N° 16.744 / D.S. N° 594`) junto con rotulación de sustancias peligrosas (`NCh 2190 Clase 3`), y despacho final del Camión 3/4 Flota 72 (`048059`).

---

## 2. Stack y Estándares Técnicos
- **Frontend:** HTML5 semántico, CSS3 moderno (Variables CSS, *Glassmorphism* con `backdrop-filter`, tipografías industriales `Orbitron`, `JetBrains Mono` e `Inter`, diseño responsivo) y JavaScript moderno (ES6 Modules con `<script type="importmap">` posicionado al inicio del `<head>`).
- **Motor 3D y Post-Procesado:** **Three.js** (`v0.160.0` vía CDN), `OrbitControls` con amortiguación inercial (`enableDamping`), `EffectComposer` + `RenderPass` + `UnrealBloomPass` calibrado sutilmente para pantallas emisivas, balizas y anillos holográficos, e iluminación sin decaimiento oscuro (`decay = 0` + doble `DirectionalLight` para interior y patio exterior).
- **Animación Cinematográfica:** **GSAP** (`v3.12.5` vía CDN) para aproximaciones suaves de cámara hacia cada estación (`focusStation`), retorno panorámico (`resetCamera`), enrollado del portón metálico, cruce automático entre Etapa 1 y Etapa 2, y salida final del camión hacia la Ruta 5 Sur.
- **Texturas 100% Procedurales (`js/textures.js`):** Generadas dinámicamente en memoria mediante HTML5 Canvas (`2048x2048` y `512x512`) sin depender de imágenes externas:
  - `createFloorTexture()`: Concreto pulido interior con juntas de dilatación, huellas de rodadura, líneas amarillas perimetrales y zona cebreada frente al andén.
  - `createYardFloorTexture()`: Pavimento industrial exterior de alto contraste con bahías demarcadas por color (Zona Reefer Cian, Zona Grúa EPP Naranja, Zona Auditoría ABC Púrpura y Pista Central de Salida Flota 72).
  - `createBoxTexture()`: Cajas de cartón corrugado con códigos de barras, etiquetas de SKU/Lote/Fecha y rombo rojo opcional Clase 3 Líquido Inflamable (`NCh 2190`).
  - `createWoodPalletTexture()`, `createMonitorTexture()`, `createColdChamberTexture()`, `createAbcScreenTexture()`, `createTabletTexture()`, `createGateTexture()`, `createKeypadTexture()` y `createSignTexture()`.
- **Audio Sintetizado (`js/audio.js`):** **Web Audio API** pura sin archivos MP3/WAV externos: zumbido ambiental de bodega (`55 Hz` + `110.5 Hz`), clics mecánicos, tonos DTMF por dígito, acordes armónicos de acierto, buzzer de error (`-15s`), pulsos de alerta bajo `03:00` y sirena + motor hidráulico de apertura/despacho.
- **Certificación Oficial (`js/certificate.js`):** Renderizador dinámico en Canvas HTML5 oculto de alta resolución (`2000x1414 px`) que exporta un diploma oficial en PNG con marco dorado/industrial, nombre del estudiante, curso, tiempo empleado, eficiencia, rango, grilla 4x2 con las **8 competencias validadas (Etapa 1 + Etapa 2)**, sello institucional y código único de verificación.

---

## 3. Arquitectura Modular de Archivos
1. `index.html`: Estructura principal, `<script type="importmap">`, HUD superior flotante (cronómetro `15:00`, progreso por etapa, botón Vista 360°, silencio de audio y desplegable *Bitácora de Claves* dividido en Etapa 1 y Etapa 2), pantalla de bienvenida, modal de transición a Etapa 2, los 8 modales de desafíos y pantalla de victoria/tiempo agotado.
2. `css/styles.css`: Sistema visual *Glassmorphism*, estilos de marcadores flotantes 3D→2D (`.hotspot-marker`), animaciones de pulso crítico en el cronómetro, tablas interactivas, tarjetas de selección y teclados numéricos industriales.
3. `js/textures.js`: Clase `TextureGenerator` con todos los generadores procedurales en Canvas 2D convertidos a `THREE.CanvasTexture`.
4. `js/scene3d.js`: Clase `WarehouseScene` que construye la Bodega Interna (Etapa 1) y el Patio de Embarque Exterior iluminado (Etapa 2), gestiona el `Raycaster` híbrido (mouse + táctil + marcadores DOM proyectados) y ejecuta las transiciones GSAP.
5. `js/challenges.js`: Clase `ChallengeManager` con la lógica pedagógica de las 8 estaciones, retroalimentación formativa detallada, penalización de `-15 segundos` por error, control de estados por etapa y conexión con el generador de certificados.
6. `js/audio.js`: Clase `AudioSystem` y singleton `audio` basados en osciladores y filtros Web Audio API.
7. `js/certificate.js`: Clase `CertificateGenerator` para el renderizado y descarga automática del diploma PNG en `2000x1414 px`.

---

## 4. Diseño Instruccional de las 2 Etapas (8 Desafíos Logísticos)

### ETAPA 1: BODEGA INTERNA ANDESCARGO (Código Maestro: `4081972`)
1. **Estación 01 — Escritorio de Control (Cuadratura Documental OC #884 vs. Guía de Despacho):**
   - **Situación:** Comparativa entre la Orden de Compra #884 y la Guía de Despacho Electrónica. Existe una discrepancia en *"Cajas de Guantes Quirúrgicos Estériles"* (`SKU 408`: OC solicita `50`, Guía registra `35`).
   - **Acción:** Seleccionar `SKU 408` e ingresar la diferencia faltante (`15`).
   - **Recompensa:** **Clave 1 = `408`**.
2. **Estación 02 — Rack Zona A (Método FIFO / PEPS):**
   - **Situación:** Tres pallets de insumos médicos con distintas fechas de ingreso: Lote #14 (`15/10/2026`), Lote #19 (`02/09/2026`) y Lote #22 (`05/11/2026`).
   - **Acción:** Aplicar el método *First In, First Out* seleccionando el lote con ingreso más antiguo (**Lote #19**).
   - **Recompensa:** **Clave 2 = `19`**.
3. **Estación 03 — Zona de Paletizado con Tablet TMS (Cubicaje y Transporte):**
   - **Situación:** Pedido consolidado de `1.450 kg` y `12 pallets`. Opciones: Furgón Urbano Flota 31 (`1.000 kg / 6 pallets` — sobrecarga), Camión 3/4 Flota 72 (`2.500 kg / 14 pallets` — óptimo `85.7%`) y Tractocamión Flota 95 (`18.000 kg / 28 pallets` — capacidad ociosa `>91%`).
   - **Acción:** Seleccionar el **Camión 3/4 (Flota 72)**.
   - **Recompensa:** **Clave 3 = `72`**.
4. **Estación 04 — Panel del Portón de Andén 01 (Liberación y Cruce a Etapa 2):**
   - **Acción:** Digitar el Código Maestro de 7 dígitos **`4081972`** (`408` + `19` + `72`).
   - **Efecto 3D:** La baliza cambia a verde, el portón se enrolla hacia arriba y la cámara cruza hacia el Patio de Embarque Exterior activando la **Etapa 2**.

### ETAPA 2: PATIO DE EMBARQUE EXTERIOR (Código de Salida: `048059`)
5. **Estación 05 (E2-1) — Contenedor Reefer Bio-Médico (Cadena de Frío MINSAL):**
   - **Situación:** El termógrafo exterior marca alerta en `11.4 °C`.
   - **Acción:** Seleccionar el rango normativo MINSAL/OMS para conservación refrigerada de vacunas y sueros (**+2°C a +8°C**, Set-Point óptimo **`04°C`**), evitando la congelación (`-20°C`) o temperatura ambiente (`+15°C a +25°C`).
   - **Recompensa:** **Clave E2-1 = `04`**.
6. **Estación 06 (E2-2) — Terminal Kiosco de Patio (Clasificación ABC — Ley de Pareto 80/20):**
   - **Situación:** Tres familias de productos por embarcar.
   - **Acción:** Identificar la familia **Clase A** (**Serie A80 Monitores UCI**, que representa el `15%` de los bultos físicos pero concentra el **`80%` del valor financiero anual**).
   - **Recompensa:** **Clave E2-2 = `80`**.
7. **Estación 07 (E2-3) — Grúa Horquilla de Patio (Seguridad EPP Ley 16.744 / D.S. 594 y Norma NCh 2190):**
   - **Situación:** Carga de bidones de Alcohol Isopropílico Clínico al 70% mediante grúa horquilla.
   - **Acción:** Seleccionar el **Protocolo #59** (casco, calzado de seguridad, chaleco reflectante, cinturón abrochado, horquillas a `15-20 cm` del suelo, máx. `10 km/h` y **Rombo Rojo Clase 3 Líquido Inflamable + Frágil** según `NCh 2190`).
   - **Recompensa:** **Clave E2-3 = `59`**.
8. **Estación 08 (E2-4) — Consola de Salida del Camión 3/4 Flota 72 (Despacho Final):**
   - **Acción:** Digitar el Código de Embarque de 6 dígitos **`048059`** (`04` + `80` + `59`).
   - **Efecto 3D:** El Camión 3/4 Flota 72 arranca por la pista central de salida hacia el pórtico de la Ruta 5 Sur y se despliega la Pantalla de Victoria con la descarga del **Certificado Oficial PNG (`2000x1414 px`)**.

### ETAPA 3: CIERRE DE TURNO — AUDITORÍA DE INVENTARIO (Código de Cierre: `276336`)
Disponible en **Misión Extendida** (Etapas 1–3, 25 min) y **Misión Completa** (Etapas 1–4, 35 min). El modo se elige en la pantalla de bienvenida; la **Misión Corta** (15 min) termina en la Estación 08. Tras la salida del camión hay un corte a negro, la cámara vuelve a la bodega, baja la luz exterior y el portón se cierra. Se suman `+10:00` minutos al cronómetro.

9. **Estación 09 (E3-1) — Rack Oeste (Conteo Cíclico e Informe de Stock):**
   - **Situación:** El WMS registra `340` cajas del SKU 517; el conteo físico por ubicación es `120 + 96 + 97`.
   - **Acción:** Ingresar el total físico (`313`), la diferencia (`27`) y clasificarla como **faltante**.
   - **Recompensa:** **Clave E3-1 = `27`**.
10. **Estación 10 (E3-2) — Rack Zona A (Ubicaciones y Sistema de Localización):**
    - **Situación:** El WMS asigna la ubicación `A-06-3` (Pasillo – Rack – Nivel). El plano abre por defecto en el Pasillo B.
    - **Acción:** Cambiar al Pasillo A y marcar Rack 06, Nivel 3 (los niveles se cuentan desde el piso).
    - **Recompensa:** **Clave E3-2 = `63`**.
11. **Estación 11 (E3-3) — Rack de Reposición R-11 (Layout y Cubicaje):**
    - **Acción, parte 1:** Asignar por peso y rotación: bidones de 22 kg → nivel piso; guantes de alta rotación → nivel medio (picking); repuestos de baja rotación → nivel alto.
    - **Acción, parte 2:** Cubicar un hueco de `2,4 × 1,2 × 1,2 m` con cajas de `0,6 × 0,4 × 0,4 m` → `4 × 3 × 3 = 36` cajas.
    - **Recompensa:** **Clave E3-3 = `36`**.
12. **Estación 12 (E3-4) — Tótem de Cierre de Turno:**
    - **Acción:** Digitar el Código de Cierre de 6 dígitos **`276336`** (`27` + `63` + `36`).
    - **Efecto:** En Misión Extendida, Pantalla de Victoria y certificado con grilla 4x3 de **12 competencias**. En Misión Completa, paso a la Etapa 4.

### ETAPA 4: CENTRO DE CONTROL Y RADIOFRECUENCIA (Código de Control: `445190`)
Solo en **Misión Completa**. Ocurre en la esquina noreste de la bodega (lector RF, terminal WMS, panel mural de indicadores, antena y consola). Se suman otros `+10:00` minutos.

13. **Estación 13 (E4-1) — Lector de Radiofrecuencia:**
    - **Situación:** Cinco pallets (41 a 45) para la orden OD-2217. El primer toque escanea la etiqueta; el segundo la marca como no conforme.
    - **Acción:** Escanear los cinco y marcar el **Pallet 44** (SKU 517 correcto, pero lote `#22` en vez del `#19` exigido).
    - **Recompensa:** **Clave E4-1 = `44`**.
14. **Estación 14 (E4-2) — Terminal WMS (Comunicar la salida):**
    - **Acción:** Ordenar con flechas los cinco pasos de la transacción RF: sesión y orden → ubicación de origen → etiqueta del pallet → cantidad → andén de destino y confirmación.
    - **Recompensa:** **Clave E4-2 = `51`** (N° de transacción).
15. **Estación 15 (E4-3) — Panel de Indicadores (Nivel de Servicio):**
    - **Situación:** Registro semanal: `8/8, 9/8, 7/6, 8/7, 8/7` (despachados / completos y a tiempo). Meta: `95%`.
    - **Acción:** Ingresar total (`40`), completos y a tiempo (`36`), porcentaje (`90`) y clasificar como **bajo la meta**.
    - **Recompensa:** **Clave E4-3 = `90`**.
16. **Estación 16 (E4-4) — Consola de Control RF:**
    - **Acción:** Digitar el Código de Control de 6 dígitos **`445190`** (`44` + `51` + `90`).
    - **Efecto:** Pantalla de Victoria y certificado con grilla 4x4 de **16 competencias**.

---

## 4.1 Alineación Curricular: Estación → OA y Aprendizaje Esperado

**Fuente:** *Programa de Estudio Especialidad Administración, Menciones Recursos Humanos y Logística, 3° y 4° medio* (Mineduc), pp. 18 (OA de la mención Logística) y 27–28 (visión global de módulos). Copia local: `Copiloto de Planificacion Docente/Planes y Programas/4° Medio TP/`.

**Nota sobre el nombre del módulo:** el Programa no contiene un módulo llamado "Logística, Almacenamiento y Distribución". El simulador recorre los **cuatro módulos de 4° medio de la mención Logística**: (1) Operaciones de almacenamiento, (2) Operaciones de bodega, (3) Logística y distribución y (4) Seguridad en bodegas.

| Estación | Desafío | OA de la mención | Módulo y Aprendizaje Esperado (AE) | Alineación |
|---|---|---|---|---|
| 01 | Cuadratura OC #884 vs. Guía de Despacho | **OA 1** — Controlar la entrada y salida de productos, confirmando recepción y despacho con instrumentos de registro y normativa vigente | M1 Operaciones de almacenamiento · **AE 1**: revisa las entradas de productos, confirmando la recepción a través de registros pertinentes | Directa |
| 02 | Rotación FIFO / PEPS | **OA 2** — Controlar las operaciones de almacenamiento y manejo de existencias de acuerdo a métodos establecidos | M1 · **AE 4**: controla las operaciones de almacenamiento de las existencias según procedimientos establecidos | Directa |
| 03 | Cubicaje y selección de transporte | **OA 3** — Cubicar productos, materiales e insumos y los espacios de bodegaje para una disposición eficiente | M2 Operaciones de bodega · **AE 1**: cubica los productos para lograr un acomodo eficiente | Parcial: el OA apunta a cubicar para almacenaje y espacios de bodega; la estación cubica contra la capacidad de un vehículo |
| 04 | Código Maestro del portón | **OA 1** (salida de productos) | M1 · **AE 2**: revisa las salidas de productos, confirmando el despacho | Estación de síntesis: no evalúa un AE por sí misma |
| 05 | Cadena de frío +2 °C a +8 °C | **OA 2** — detectar el estado cualitativo y cuantitativo de los productos | M1 · **AE 5**: controla el manejo de inventario, detectando el estado cualitativo y cuantitativo de las existencias | Directa (estado cualitativo) |
| 06 | Clasificación ABC · Pareto 80/20 | **OA 2** — manejo de existencias de acuerdo a métodos establecidos | M1 · **AE 5**: controla el manejo de inventario según los métodos establecidos | Directa |
| 07 | EPP en grúa horquilla y rotulación NCh 2190 | **OA 5** — Prevenir riesgos de accidentes laborales y reconocer la rotulación internacional de sustancias peligrosas | M4 Seguridad en bodegas · **AE 1**: previene riesgos de accidentes en zonas de almacenamiento y distribución · **AE 2**: detecta la rotulación internacional de sustancias peligrosas | Directa (cubre ambos AE del módulo) |
| 08 | Código de Embarque y despacho final | **OA 1** y **OA 4** — informar y comunicar datos de entrada y salida de productos mediante sistemas | M3 Logística y distribución · **AE 2**: revisa las salidas confirmando el despacho · **AE 5**: comunica la salida de productos mediante sistemas informáticos | Estación de síntesis: cobertura tangencial de OA 4 |

| 09 | Conteo cíclico e informe de stock | **OA 1** y **OA 2** — revisar el stock disponible; detectar el estado cuantitativo de los productos | M1 · **AE 3**: realiza un informe del stock de mercaderías disponible · **AE 5**: detecta el estado cuantitativo de las existencias | Directa |
| 10 | Ubicación `A-06-3` en el plano del rack | **OA 2** — asignar ubicaciones y sistemas de localización inmediata, de manera manual y digital | M1 · **AE 6**: fija las ubicaciones y sistemas de localización de existencias | Directa |
| 11 | Layout por peso y rotación + cubicaje del hueco | **OA 3** — Cubicar productos y espacios de bodegaje para una disposición eficiente | M2 Operaciones de bodega · **AE 1**: cubica los productos para lograr un acomodo eficiente · **AE 2**: organiza los espacios de bodegaje | Directa (cubre ambos AE del módulo) |
| 12 | Código de Cierre de turno | **OA 2** | M1 · **AE 4** | Estación de síntesis: no evalúa un AE por sí misma |

| 13 | Lectura RF de pallets contra la orden | **OA 4** — Informar y comunicar datos de almacenaje y de entrada y salida mediante sistemas como radiofrecuencia y computación | M3 Logística y distribución · **AE 4**: informa datos de almacenaje mediante sistemas informáticos y de radiofrecuencia | Directa (simulada: no hay lector físico) |
| 14 | Orden de los pasos de la transacción RF de salida | **OA 4** | M3 · **AE 5**: comunica la entrada y salida de productos mediante sistemas informáticos y de radiofrecuencia, según procesos establecidos | Directa |
| 15 | Nivel de servicio semanal contra la meta | **OA 1** y **OA 4** | M3 · **AE 3**: realiza un informe según requerimientos de jefatura · **AE 4** | Parcial: el indicador de nivel de servicio no aparece nombrado en el Programa; se alinea por la acción de informar datos a jefatura |
| 16 | Código de Control | **OA 4** | M3 · **AE 5** | Estación de síntesis: no evalúa un AE por sí misma |

**Cobertura (Misión Completa, 16 estaciones):** los cinco OA de la mención tienen al menos una estación de alineación directa, y todos los AE de los módulos 1 a 4 quedan tocados. Alineaciones parciales que un evaluador podría objetar: la 03 (cubica contra un vehículo, no contra un espacio de bodega) y la 15 (indicador no nombrado en el Programa). El uso de radiofrecuencia es simulado en pantalla.

**Cobertura (Misión Extendida, 12 estaciones):** OA 1, 2, 3 y 5 con evidencia directa; queda pendiente el OA 4 (M3 AE 4 y AE 5).

**Cobertura (Misión Corta, 8 estaciones):** además del OA 4, quedan sin cubrir M1 AE 3 y AE 6 y M2 AE 2.

---

## 5. Reglas de Calidad y Ejecución Local
- Verificar que `<script type="importmap">` sea siempre el primer script dentro de `<head>` y que la inicialización valide `document.readyState === 'loading'` para evitar condiciones de carrera con la carga asíncrona de módulos ES6.
- Asegurar que no existan identificadores duplicados (`let`/`const`) y que tanto el interior de la bodega como el patio exterior cuenten con iluminación direccional y puntual dedicada (`decay = 0`).
- Ejecutar siempre mediante servidor estático local (`python -m http.server 8080` o `npx serve -l 8080`).

---

## 6. MEGA PROMPT COMPLETO

```markdown
Lee atentamente el archivo CLAUDE.md y construye la aplicación web completa, impecable y 100% funcional de "OPERACIÓN DESPACHO CRÍTICO 360° (Edición Multi-Etapa Progresiva)", un simulador educativo estilo Escape Room en 3D/360° para estudiantes de 4° Medio de Administración (Módulo: Logística, Almacenamiento y Distribución).

Estructura el código rigurosamente en los siguientes 7 archivos separados:
- index.html
- css/styles.css
- js/textures.js
- js/scene3d.js
- js/challenges.js
- js/audio.js
- js/certificate.js

Implementa los siguientes requerimientos con máxima calidad técnica y estética (AAA Web):

1. ESCENA 3D MULTI-ETAPA, ILUMINACIÓN DUAL Y TEXTURAS PROCEDURALES (js/scene3d.js & js/textures.js):
- Genera todas las texturas 100% en memoria mediante HTML5 Canvas (cero imágenes externas):
  * `createFloorTexture()`: Piso de concreto pulido gris oscuro para la bodega interna con juntas de dilatación, líneas amarillas de seguridad y franja cebreada frente al portón.
  * `createYardFloorTexture()`: Pavimento industrial exterior de alto contraste para el Patio de Embarque con bahías demarcadas por color (Zona Reefer en cian, Zona Grúa EPP en naranja, Zona Auditoría ABC en púrpura y Pista Central de Salida Flota 72 en amarillo).
  * Texturas de cajas con códigos de barras, etiquetas de SKU/Lote/Fecha y rombo rojo Clase 3 Inflamable (NCh 2190), pallets de madera, monitores ERP, visor escarchado de cámara de frío, pantalla Pareto ABC, tablet TMS, cortina metálica del portón y teclados numéricos.
- Construye dos escenarios 3D conectados espacialmente por el Portón Metálico del Andén 01:
  * ESCENARIO ETAPA 1 (Bodega Interna AndesCargo): Escritorio de Control con monitores duales emisivos, Racks selectivos altos con cajas y pallets etiquetados, Zona de Paletizado central con Tablet rugerizada sobre un pallet, Grúa Horquilla (montacargas) 3D en un lateral, luminarias cenitales con haces de luz volumétricos, partículas de polvo flotando y el Portón Metálico de Andén con baliza roja intermitente y panel numérico en la pared.
  * ESCENARIO ETAPA 2 (Patio de Maniobras y Embarque Exterior detrás del portón): Explanada exterior completamente iluminada (con su propia DirectionalLight exterior, PointLights con `decay = 0`, 4 Torres de Iluminación LED con haces volumétricos, cerchas luminosas superiores y pórtico "SALIDA RUTA 5 SUR"), equipada con: (1) Contenedor Frigorífico Reefer Bio-Médico, (2) Terminal Kiosco vertical de Clasificación ABC, (3) Grúa Horquilla de Patio junto a carga inflamable NCh 2190 y conos de seguridad, y (4) el Camión 3/4 (Flota 72) con su Consola de Salida en pedestal.
- Cámara, GSAP y Post-Procesado: OrbitControls 360° con inercia (`enableDamping`) y EffectComposer con UnrealBloomPass sutil. Muestra únicamente los 4 Hotspots de la etapa activa. Al hacer clic o toque táctil en un Hotspot, la cámara ejecuta un travelling suave con GSAP hacia la estación antes de abrir su modal.

2. INTERFAZ HUD, AUDIO WEB API Y GESTIÓN DE TIEMPO (index.html, css/styles.css & js/audio.js):
- Coloca `<script type="importmap">` como el primer elemento script dentro de `<head>` y asegúrate de inicializar la aplicación verificando `document.readyState === 'loading'` y añadiendo `onsubmit="return false;"` en el formulario de bienvenida para evitar recargas accidentales.
- Pantalla de Bienvenida inmersiva: contexto de la misión ("Viernes 17:45 hrs. Bloqueo de seguridad en AndesCargo. Despacho médico crítico en espera. Tienes 15:00 minutos para liberar el andén"), campos obligatorios para Nombre y Curso (ej. 4° Medio A), y botón "INICIAR ETAPA 1: BODEGA INTERNA".
- HUD superior Glassmorphism: cronómetro regresivo desde 15:00 (cambia a rojo intermitente bajo 03:00), indicador de progreso por etapa (`ETAPA 1 (0/4)` -> `ETAPA 2 (0/4)`), botón de Vista 360°, botón de silencio de audio y menú desplegable "Bitácora de Claves" separado en Etapa 1 y Etapa 2.
- Audio sintetizado con Web Audio API (`js/audio.js`): zumbido ambiental de bodega, clics mecánicos, tonos de teclado numérico, acordes de éxito, alarma de error y sirena + motor hidráulico.

3. LAS 2 ETAPAS PROGRESIVAS (8 DESAFÍOS CON RETROALIMENTACIÓN FORMATIVA EN js/challenges.js):
Cada error resta 15 segundos al cronómetro, muestra una notificación flotante (`-15s`) y entrega una pista formativa detallada:

- ETAPA 1: BODEGA INTERNA (Código de Apertura del Portón: `4081972`)
  * Estación 1 (Escritorio - Cuadratura Documental): Comparativa interactiva Orden de Compra (OC #884) vs Guía de Despacho. Error intencional en "Cajas de Guantes Quirúrgicos" (OC: 50, Guía: 35, SKU: 408). El alumno selecciona el SKU `408` e ingresa la diferencia `15` -> Obtiene **Clave 1: `408`**.
  * Estación 2 (Rack Zona A - Método FIFO / PEPS): Tres pallets con fechas de ingreso: Lote #14 (15/10/2026), Lote #19 (02/09/2026) y Lote #22 (05/11/2026). Aplica FIFO seleccionando el más antiguo (**Lote #19**) -> Obtiene **Clave 2: `19`**.
  * Estación 3 (Tablet sobre Pallet - Cubicaje y Transporte TMS): El pedido suma 1.450 kg y 12 pallets. Muestra 3 vehículos: Furgón (1.000 kg / 6 pallets), Camión 3/4 Flota 72 (2.500 kg / 14 pallets) y Tractocamión (18.000 kg / 28 pallets). Selecciona el **Camión 3/4 (Flota 72)** -> Obtiene **Clave 3: `72`**.
  * Estación 4 (Panel del Portón - Liberación y Cruce a Etapa 2): Teclado numérico industrial para ingresar el Código Maestro de 7 dígitos (`4081972`). Al acertar, la baliza cambia de rojo a verde, la cortina metálica del portón 3D se enrolla en su cabezal superior y la cámara cruza automáticamente con GSAP a través del portón abierto hacia el Patio de Embarque Exterior, mostrando el modal de bienvenida a la **Etapa 2** y activando sus 4 nuevos Hotspots.

- ETAPA 2: PATIO DE EMBARQUE EXTERIOR (Código de Despacho del Camión: `048059`)
  * Estación 5 (E2-1: Contenedor Reefer - Cadena de Frío MINSAL): Alerta térmica en 11.4°C. El alumno selecciona el rango normativo refrigerado de **+2°C a +8°C (Set-Point óptimo 04°C)** para vacunas y sueros termosensibles -> Obtiene **Clave E2-1: `04`**.
  * Estación 6 (E2-2: Terminal Kiosco de Patio - Clasificación ABC Pareto 80/20): Tres familias de inventario. Selecciona la **Clase A (Serie A80 Monitores UCI)** que representa el 15% de los bultos pero concentra el 80% del valor financiero -> Obtiene **Clave E2-2: `80`**.
  * Estación 7 (E2-3: Grúa de Patio - Seguridad EPP Ley 16.744 / D.S. 594 y Norma NCh 2190): Selecciona el **Protocolo #59** (casco, calzado de seguridad, chaleco reflectante, cinturón abrochado, horquillas a 15-20 cm del suelo y Rombo Rojo Clase 3 Líquido Inflamable + Frágil para alcohol clínico al 70%) -> Obtiene **Clave E2-3: `59`**.
  * Estación 8 (E2-4: Consola del Camión Flota 72 - Despacho Final): Teclado numérico para ingresar el Código de Salida de 6 dígitos (`048059`) formado por la unión de las claves de la Etapa 2 (`04` + `80` + `59`). Al acertar, el Camión 3/4 (Flota 72) arranca en 3D por la pista central de salida y se despliega la Pantalla de Victoria.

4. CERTIFICADO OFICIAL DE EXCELENCIA (js/certificate.js):
- Pantalla de Victoria con resumen de tiempo total empleado, eficiencia operativa y rango obtenido.
- Botón "Descargar Certificado Oficial (PNG)" que renderiza dinámicamente en un Canvas oculto de alta resolución (2000x1414 px) un diploma institucional con marco dorado/industrial, nombre del estudiante, curso, tiempo récord, eficiencia, rango, grilla 4x2 con las 8 competencias logísticas validadas (Etapas 1 y 2), fecha, sello oficial y código único de verificación.

Verifica que todos los módulos ES6 carezcan de errores de sintaxis o variables duplicadas, sirve la aplicación con un servidor estático local (`python -m http.server 8080`) e indica el comando para probarla en el navegador.
```
