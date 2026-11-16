# Operación Despacho Crítico 360°

Simulador educativo estilo *Escape Room* en 3D/360° para estudiantes de 4° Medio TP, Especialidad Administración, Mención Logística (Chile).

Desarrollado por **Innova IA Studio** ([innovaiastudio.com](https://www.innovaiastudio.com)) con Fable 5.2.

## Qué incluye

- 4 etapas y 16 estaciones: bodega interna, patio de embarque, cierre de turno (inventario) y centro de control con radiofrecuencia.
- 3 modos de misión: Corta (Etapas 1–2, 15 min), Extendida (1–3, 25 min) y Completa (1–4, 35 min).
- Escena 3D con Three.js y GSAP; texturas y audio generados en el navegador, sin archivos externos.
- Penalización de 15 s por error con retroalimentación formativa en cada estación.
- Certificado oficial en PNG (2000×1414 px) con las competencias validadas.
- Alineación estación → OA y Aprendizaje Esperado del Programa de Estudio (ver `CLAUDE.md`, sección 4.1).

## Cómo ejecutarlo

Requiere un servidor estático local (los módulos ES6 no cargan desde `file://`):

```bash
python -m http.server 8137
```

Luego abre `http://localhost:8137/index.html`. Three.js y GSAP se cargan desde CDN, por lo que se necesita conexión a internet.

## Estructura

| Archivo | Contenido |
|---|---|
| `index.html` | Estructura, HUD, pantallas de bienvenida y victoria, modales de los desafíos |
| `css/styles.css` | Sistema visual Glassmorphism |
| `js/textures.js` | Texturas procedurales en Canvas |
| `js/scene3d.js` | Escenas 3D, hotspots y cinemáticas |
| `js/challenges.js` | Lógica pedagógica de las estaciones |
| `js/audio.js` | Audio sintetizado con Web Audio API |
| `js/certificate.js` | Generador del certificado |
| `CLAUDE.md` | Especificación completa del proyecto |
