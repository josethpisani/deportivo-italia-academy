# 🛡️ Deportivo Italia Academy — Sistema de Gestión

Sistema web de gestión para academia de fútbol. Frontend en HTML/JS puro, API serverless en Vercel y base de datos PostgreSQL en Neon.

---

## 📋 Requisitos previos

- Cuenta en [GitHub](https://github.com) (gratuita)
- Cuenta en [Neon](https://neon.tech) (gratuita)
- Cuenta en [Vercel](https://vercel.com) (gratuita)
- [Node.js 18+](https://nodejs.org) instalado en tu computadora
- [Git](https://git-scm.com) instalado

---

## 🗄️ PASO 1 — Crear la base de datos en Neon

1. Ve a [dashboard.neon.tech](https://dashboard.neon.tech) e inicia sesión.
2. Haz clic en **"New Project"**.
3. Asigna el nombre: `deportivo-italia-academy`.
4. Selecciona la región más cercana (ej. `AWS / US East`).
5. Haz clic en **"Create Project"**.
6. En la pantalla siguiente, ve a **"Connection Details"**.
7. Selecciona el modo **"Connection string"** y copia el valor. Se verá así:
   ```
   postgres://usuario:contraseña@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
8. **Guarda esta cadena**, la necesitarás en el Paso 3 y en Vercel.

> ⚠️ La tabla `app_data` se crea automáticamente la primera vez que abres la app. No necesitas ejecutar SQL manualmente.

---

## 📁 PASO 2 — Subir el proyecto a GitHub

### Opción A: Usando GitHub.com (sin terminal)
1. Ve a [github.com/new](https://github.com/new).
2. Nombre del repositorio: `deportivo-italia-academy`.
3. Déjalo **privado** (recomendado) o público.
4. Haz clic en **"Create repository"**.
5. En la página del repositorio vacío, haz clic en **"uploading an existing file"**.
6. Arrastra y suelta TODOS los archivos y carpetas de este proyecto.
7. Haz clic en **"Commit changes"**.

### Opción B: Usando terminal (Git)
```bash
# Dentro de la carpeta del proyecto:
git init
git add .
git commit -m "Deportivo Italia Academy - primer deploy"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/deportivo-italia-academy.git
git push -u origin main
```

---

## 🚀 PASO 3 — Desplegar en Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **"Add New → Project"**.
3. Selecciona el repositorio `deportivo-italia-academy` y haz clic en **"Import"**.
4. En la sección **"Environment Variables"**, agrega:
   - **Name:** `DATABASE_URL`
   - **Value:** (pega aquí la connection string de Neon del Paso 1)
5. Haz clic en **"Deploy"**.
6. Espera ~1 minuto. Vercel te dará una URL como:
   ```
   https://deportivo-italia-academy.vercel.app
   ```
7. ✅ **¡Tu sistema está en línea!**

---

## 🔄 Actualizar el sistema en el futuro

Cada vez que quieras hacer cambios:

```bash
# Edita los archivos que necesites, luego:
git add .
git commit -m "descripción del cambio"
git push
```

Vercel detecta el push automáticamente y redespliega en ~30 segundos.

---

## 📂 Estructura del proyecto

```
deportivo-italia-academy/
├── public/
│   └── index.html          ← Frontend completo (HTML + JS)
├── api/
│   └── data.js             ← API serverless (Neon PostgreSQL)
├── package.json            ← Dependencias (solo @neondatabase/serverless)
├── vercel.json             ← Configuración de rutas Vercel
├── .gitignore
├── .env.local.example      ← Plantilla de variables de entorno
└── README.md               ← Este archivo
```

---

## 🔐 Variables de entorno

| Variable | Descripción | Dónde obtenerla |
|---|---|---|
| `DATABASE_URL` | Connection string de Neon | dashboard.neon.tech → tu proyecto → Connection Details |

### Para desarrollo local:
```bash
cp .env.local.example .env.local
# Edita .env.local y pega tu DATABASE_URL
```

Para correr localmente necesitas Vercel CLI:
```bash
npm install -g vercel
vercel dev
```
Esto levanta tanto el frontend como el API en `http://localhost:3000`.

---

## 🛠️ Solución de problemas

| Problema | Solución |
|---|---|
| La app carga pero no guarda datos | Verifica que `DATABASE_URL` esté correctamente configurada en Vercel → Settings → Environment Variables |
| Error 500 en `/api/data` | Revisa los logs en Vercel → tu proyecto → Functions → data → Logs |
| La tabla no se crea | La primera visita a la app la crea automáticamente. Si falla, revisa la conexión a Neon |
| Cambios no se reflejan | Haz `git push` y espera que Vercel redepliegue (~30s) |

---

## 📊 Base de datos (Neon)

La tabla que se crea automáticamente:

```sql
CREATE TABLE IF NOT EXISTS app_data (
  key         TEXT PRIMARY KEY,
  value       JSONB        NOT NULL,
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

Dos filas principales:
- `key = 'athletes'` → array JSON de todos los atletas con su asistencia y pagos
- `key = 'torneos'`  → array JSON de todos los torneos

Puedes ver y editar los datos directamente desde el **SQL Editor** en [dashboard.neon.tech](https://dashboard.neon.tech).

---

## 💡 Tips

- **Dominio personalizado**: en Vercel → tu proyecto → Settings → Domains, puedes agregar tu propio dominio (ej. `app.deportivoitalia.com`).
- **Múltiples usuarios**: la base de datos es compartida, cualquier persona con el link ve y edita los mismos datos.
- **Backup**: desde Neon puedes hacer export de la base de datos en cualquier momento.
