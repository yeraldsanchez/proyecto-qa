# Pruebas QA — E2E, API y Rendimiento

Proyecto de pruebas automatizadas usando **Playwright** (E2E y API) y **k6** (rendimiento), con **TypeScript**.

---

## Requisitos previos

| Herramienta | Versión mínima | Verificar con |
|---|---|---|
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| k6 | 0.47+ | `k6 version` |

---

## Instalación

```bash
# 1. Instalar dependencias de Node
npm install

# 2. Descargar el navegador Chromium para Playwright
npx playwright install chromium
```

> Solo necesitas hacer esto **una vez**.

---

## Configuración

Antes de correr las pruebas, abre [`playwright.config.ts`](playwright.config.ts) y ajusta la `baseURL` con la dirección de tu aplicación:

```ts
use: {
  baseURL: 'http://localhost:3000',  // ← cambia esto
}
```

Para k6, ajusta la URL directamente en [`tests/performance/HU01.k6.ts`](tests/performance/HU01.k6.ts).

---

## Cómo ejecutar las pruebas

### Pruebas E2E

```bash
npm run test:e2e
```

Abre un navegador Chromium y simula la interacción real de un usuario.

### Pruebas de API

```bash
npm run test:api
```

Hace peticiones HTTP directamente a los endpoints, sin abrir navegador.

### Pruebas de Rendimiento

```bash
npm run test:performance
```

Simula usuarios virtuales haciendo peticiones y mide tiempos de respuesta.

### Todas las pruebas de Playwright (E2E + API juntas)

```bash
npm run test:all-playwright
```

---

## Ver el reporte de resultados (Playwright)

Después de correr cualquier prueba de Playwright:

```bash
npm run test:report
```

Se abrirá un reporte HTML en el navegador con el detalle de cada test, screenshots de los fallos y trazas de ejecución.

---

## Estructura del proyecto

```
tests/
├── e2e/          # Pruebas End-to-End (simulan usuario en el navegador)
├── api/          # Pruebas de API REST (peticiones HTTP)
└── performance/  # Pruebas de carga y rendimiento (k6)
```
