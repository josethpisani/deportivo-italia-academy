# Deportivo Italia Academy — Sistema de Gestion

Sistema web de gestion para academia de futbol. Frontend modular en HTML/JS puro, API serverless en Vercel y base de datos PostgreSQL en Neon.

---

## Estructura del proyecto

```
deportivo-italia-academy/
├── public/
│   ├── index.html              ← Shell HTML (42 lineas)
│   ├── css/
│   │   ├── variables.css       ← Variables CSS (colores)
│   │   ├── base.css            ← Reset, layout, pills, badges
│   │   ├── sidebar.css         ← Sidebar escritorio + mobile
│   │   ├── dashboard.css       ← Tarjetas de categoria
│   │   ├── athletes.css        ← Grid/lista de atletas, perfil
│   │   ├── attendance.css      ← Registro de asistencia
│   │   ├── admin.css           ← Panel admin, tablas, matriculas
│   │   ├── modal.css           ← Modales bottom-sheet
│   │   ├── charts.css          ← Contenedores de graficos
│   │   └── responsive.css      ← Media queries (tablet/movil)
│   ├── js/
│   │   ├── app.js              ← Punto de entrada, render principal
│   │   ├── constants.js        ← Categorias, dias, nombres
│   │   ├── utils.js            ← Funciones utilitarias
│   │   ├── state.js            ← Estado global
│   │   ├── seed.js             ← Carga de datos iniciales
│   │   ├── api.js              ← Cliente API (Neon)
│   │   ├── mutations.js        ← Mutaciones de datos
│   │   ├── icons.js            ← Iconos SVG inline
│   │   ├── render-helpers.js   ← Helpers de renderizado
│   │   ├── modals.js           ← Modales de agregar
│   │   ├── charts.js           ← Funciones Chart.js
│   │   ├── events.js           ← Manejo de eventos
│   │   └── views/
│   │       ├── sidebar.js      ← Vista sidebar
│   │       ├── home.js         ← Vista dashboard
│   │       ├── athletes.js     ← Vista lista/perfil atletas
│   │       ├── attendance.js   ← Vista asistencia
│   │       └── admin.js        ← Vista administracion
│   └── data/
│       └── athletes.json       ← Datos iniciales de atletas
├── api/
│   └── data.js                 ← API serverless (Neon PostgreSQL)
├── package.json                ← Dependencias
├── vercel.json                 ← Configuracion de rutas Vercel
├── .gitignore
├── .env.local.example
└── README.md
```

---

## Despliegue rapido

### 1. Crear base de datos en Neon
1. Ve a [dashboard.neon.tech](https://dashboard.neon.tech)
2. "New Project" → nombre: `deportivo-italia-academy`
3. Copia la **connection string** (postgres://...)

### 2. Subir a GitHub
Opcion A — Desde [github.com/new](https://github.com/new):
1. Crear repositorio `deportivo-italia-academy`
2. Subir todos los archivos del proyecto

Opcion B — Desde terminal:
```bash
git init
git add .
git commit -m "Sistema Deportivo Italia Academy"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/deportivo-italia-academy.git
git push -u origin main
```

### 3. Desplegar en Vercel
1. Ve a [vercel.com](https://vercel.com) → "Add New → Project"
2. Selecciona el repositorio → "Import"
3. En **Environment Variables** agrega:
   - **Name:** `DATABASE_URL`
   - **Value:** (tu connection string de Neon)
4. Click "Deploy"
5. Tu app estara en: `https://deportivo-italia-academy.vercel.app`

### Variables de entorno
| Variable | Descripcion | Donde obtenerla |
|---|---|---|
| `DATABASE_URL` | Connection string de Neon | dashboard.neon.tech → tu proyecto → Connection Details |

### Desarrollo local
```bash
cp .env.local.example .env.local
# Edita .env.local con tu DATABASE_URL
npm install -g vercel
vercel dev
```

### Actualizar en el futuro
```bash
git add .
git commit -m "descripcion del cambio"
git push
```
Vercel redespliega automaticamente (~30 segundos).

---

## Base de datos (Neon)

La tabla se crea automaticamente:

```sql
CREATE TABLE IF NOT EXISTS app_data (
  key         TEXT PRIMARY KEY,
  value       JSONB        NOT NULL,
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

- `key = 'athletes'` → array JSON de atletas
- `key = 'torneos'` → array JSON de torneos

## Solucion de problemas

| Problema | Solucion |
|---|---|
| App carga pero no guarda | Verifica DATABASE_URL en Vercel → Settings → Environment Variables |
| Error 500 en /api/data | Revisa logs en Vercel → Functions → data → Logs |
| Cambios no se reflejan | git push y espera ~30s |
