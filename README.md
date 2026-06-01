# Pruebas-Proyecto — Suite de QA

Proyecto de pruebas de calidad para una aplicación web (Apache Answer en `http://localhost:9080`). Incluye tres tipos de pruebas:

- **E2E** — flujos de usuario con Playwright (Chromium)
- **API** — llamadas directas a la REST API con Playwright
- **Rendimiento** — carga y estrés con k6

---

## Requisitos previos

| Herramienta | Versión mínima | Instalación |
|---|---|---|
| Node.js | 18 LTS o superior | https://nodejs.org |
| npm | 9+ (viene con Node.js) | — |
| k6 | cualquier versión estable | https://grafana.com/docs/k6/latest/set-up/install-k6/ |
| Chromium | instalado vía Playwright | `npx playwright install chromium` |
| Apache Answer | corriendo en `localhost:9080` | ver sección siguiente |

### Levantar la aplicación bajo prueba

Los tests apuntan a `http://localhost:9080`. El repositorio incluye un `docker-compose.yml` listo para usar:

```bash
docker compose up -d
```

Para detenerla:

```bash
docker compose down
```

> El contenedor no usa volúmenes, por lo que cada vez que se recrea comienza desde cero y el `global-setup` volverá a ejecutar el wizard de instalación.

El `global-setup` de Playwright detecta automáticamente si la app necesita instalación y ejecuta el wizard con los valores por defecto (o con las variables de entorno indicadas más abajo).

---

## Instalación

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd Pruebas-Proyecto

# 2. Instalar dependencias de Node
npm install

# 3. Instalar el navegador de Playwright
npx playwright install chromium
```

---

## Variables de entorno (opcionales)

Todas tienen valor por defecto; solo sobreescríbelas si tu entorno difiere.

| Variable | Defecto | Descripción |
|---|---|---|
| `BASE_URL` | `http://localhost:9080` | URL base de la app |
| `SITE_NAME` | `Prueba` | Nombre del sitio en el wizard de instalación |
| `ADMIN_NAME` | `admin` | Nombre del administrador |
| `ADMIN_EMAIL` | `admin@sistema.com` | Correo del administrador |
| `ADMIN_PASSWORD` | `12345678` | Contraseña del administrador |
| `SETUP_HEADLESS` | `false` | `true` para ocultar el navegador durante el setup |

En PowerShell:

```powershell
$env:BASE_URL = "http://localhost:9080"
$env:ADMIN_EMAIL = "mi@correo.com"
```

---

## Setup de la aplicación

Antes de ejecutar cualquier suite de pruebas por primera vez (o después de recrear el contenedor), ejecuta el wizard de instalación de la app:

```bash
npm run setup
```

Este comando abre un navegador Chromium, completa el wizard automáticamente y cierra el navegador. Solo necesita ejecutarse una vez mientras el contenedor conserve sus datos.

> Si el contenedor ya está instalado, el script lo detecta y termina sin hacer nada.

---

## Ejecutar los tests

### Pruebas E2E (Playwright — interfaz gráfica)

```bash
# Modo headless (por defecto)
npm run test:e2e

# Modo headed (abre el navegador visualmente)
npm run test:e2e:headed
```

### Pruebas de API (Playwright)

```bash
npm run test:api
```

### Todas las pruebas Playwright (E2E + API)

```bash
npm run test:all-playwright
```

### Pruebas de rendimiento (k6)

> Requiere tener `k6` instalado y accesible en el PATH.

Ejecutar todos los escenarios de rendimiento en secuencia:

```bash
npm run test:performance
```

Ejecutar un escenario individual:

```bash
npm run test:performance:HU01   # Registro de usuario
npm run test:performance:HU02   # Login de usuario
npm run test:performance:HU03   # Publicar pregunta
npm run test:performance:HU04   # Escenario adicional
```

---

## Ver el reporte HTML

Después de ejecutar cualquier suite Playwright, se genera un reporte en `playwright-report/`:

```bash
npm run test:report
```

Abre el reporte en el navegador automáticamente.

---

## Estructura del proyecto

```
Pruebas-Proyecto/
├── tests/
│   ├── global-setup.ts        # Setup automático del wizard de instalación
│   ├── e2e/                   # Tests end-to-end (HU01–HU04)
│   ├── api/                   # Tests de API REST (HU01–HU04)
│   └── performance/           # Scripts k6 (HU01–HU04)
├── scripts/
│   └── run-performance.js     # Runner que ejecuta todos los *.k6.ts en secuencia
├── playwright.config.ts       # Configuración de Playwright
├── tsconfig.json              # TS para E2E y API
└── tsconfig.k6.json           # TS para scripts k6
```
