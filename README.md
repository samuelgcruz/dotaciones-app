# 🦺 Dotaciones App

Plataforma web para que empresas soliciten dotaciones (uniformes) por categoría —
Medicina, Construcción, Gastronomía y Administrativo — eligiendo prenda, talla y
accesorios, con control de stock en tiempo real y trazabilidad de cada pedido.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38BDF8?logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)

---

## Tabla de contenido

1. [Qué hace esta app](#qué-hace-esta-app)
2. [Stack técnico](#stack-técnico)
3. [Estructura del proyecto](#estructura-del-proyecto)
4. [Requisitos previos](#requisitos-previos)
5. [Instalación paso a paso](#instalación-paso-a-paso)
6. [Variables de entorno](#variables-de-entorno)
7. [Configurar la base de datos en Supabase](#configurar-la-base-de-datos-en-supabase)
8. [Ejecutar en desarrollo](#ejecutar-en-desarrollo)
9. [Flujo de prueba](#flujo-de-prueba)
10. [Arquitectura de seguridad (RLS)](#arquitectura-de-seguridad-rls)
11. [Desplegar en Vercel](#desplegar-en-vercel)
12. [Solución de problemas comunes](#solución-de-problemas-comunes)
13. [Roadmap](#roadmap)

---

## Qué hace esta app

Un cliente (empresa) entra al catálogo, elige una categoría de dotación, selecciona
la talla de cada prenda y los accesorios que necesita, y envía la solicitud. Internamente:

- **El stock se valida y descuenta en el momento de confirmar el pedido** —no antes,
  no "a mano" después— mediante una función SQL atómica. Si dos personas intentan
  comprar la última unidad de una talla al mismo tiempo, Postgres bloquea la fila y
  solo una de las dos compras se completa.
- **Cada pedido queda trazado**: un trigger registra en `pedido_estados` el momento
  en que se crea y cada vez que cambia de estado (pendiente → en proceso → entregado),
  sin depender de que el código de la app lo recuerde hacer.
- **Los precios y el total nunca se confían del navegador**: el backend los vuelve a
  calcular contra la base de datos antes de guardar el pedido.

## Stack técnico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 14 (App Router) |
| UI | React 18 + Tailwind CSS |
| Iconos | lucide-react |
| Base de datos | Supabase (Postgres + Row Level Security) |
| Hosting | Vercel |

## Estructura del proyecto

```
dotaciones-app/
├── app/
│   ├── page.js                        # Home: catálogo de categorías
│   ├── layout.js                      # Layout raíz
│   ├── api/
│   │   └── pedidos/
│   │       └── route.js               # POST /api/pedidos — crea el pedido
│   └── categoria/
│       └── [slug]/
│           ├── page.js                # Server Component: trae los datos
│           └── CategoriaClient.jsx    # Client Component: estado interactivo
├── components/
│   ├── CategoryCard.jsx               # Tarjeta de categoría (Home)
│   ├── SizeSelector.jsx               # Selector de prenda + talla + stock
│   ├── AccessoriesSelector.jsx        # Selector de accesorios
│   └── OrderSummary.jsx               # Resumen + formulario de contacto
├── lib/
│   ├── supabaseClient.js              # Cliente público (clave anon) — SOLO lecturas
│   ├── supabaseAdmin.js               # Cliente privado (service_role) — SOLO backend
│   └── queries.js                     # Toda la lógica de acceso a datos
├── supabase/
│   ├── schema.sql                     # Esquema inicial: tablas + seed de categorías
│   ├── migracion_stock_trazabilidad.sql  # Función atómica + tabla de trazabilidad
│   └── paso3_cerrar_acceso_anon.sql   # Endurecimiento de RLS (ejecutar al final)
├── .env.local.example
└── README.md
```

## Requisitos previos

- [Node.js](https://nodejs.org) 18 o superior
- Una cuenta en [Supabase](https://supabase.com) (plan gratuito es suficiente)
- Una cuenta en [Vercel](https://vercel.com) si vas a desplegar

## Instalación paso a paso

### 1. Crear el proyecto Next.js

```bash
npx create-next-app@latest dotaciones-app --js --tailwind --eslint --app --src-dir=false --import-alias "@/*"
cd dotaciones-app
```

### 2. Instalar el cliente de Supabase

```bash
npm install @supabase/supabase-js
```

### 3. Copiar los archivos del proyecto

Sobrescribe o crea en tu proyecto recién generado:

- `lib/supabaseClient.js`, `lib/supabaseAdmin.js`, `lib/queries.js`
- `app/page.js`, `app/layout.js`
- `app/categoria/[slug]/page.js`, `app/categoria/[slug]/CategoriaClient.jsx`
- `app/api/pedidos/route.js`
- `components/*.jsx`
- `supabase/*.sql`

## Variables de entorno

Copia la plantilla y completa tus propios valores:

```bash
cp .env.local.example .env.local
```

| Variable | ¿Dónde se usa? | ¿De dónde la saco? | ¿Es secreta? |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Cliente y servidor | Supabase → Project Settings → API → Project URL | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Solo lecturas públicas (`lib/supabaseClient.js`) | Supabase → Project Settings → API → clave `anon public` | No (va en el navegador) |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo backend (`lib/supabaseAdmin.js`, nunca en componentes `'use client'`) | Supabase → Project Settings → API → clave `service_role` | **Sí — nunca la subas a Git ni le pongas el prefijo `NEXT_PUBLIC_`** |

## Configurar la base de datos en Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Ve a **SQL Editor** y ejecuta, **en este orden**:
   1. `supabase/schema.sql` — crea las tablas, los tipos y los datos de ejemplo
      (categorías, tallas y accesorios).
   2. `supabase/migracion_stock_trazabilidad.sql` — crea la tabla `pedido_estados`
      y la función `crear_pedido_completo`, que es la que de verdad guarda los
      pedidos (ver [Arquitectura de seguridad](#arquitectura-de-seguridad-rls)).
   3. `supabase/paso3_cerrar_acceso_anon.sql` — **solo después de confirmar que
      un pedido de prueba se crea correctamente** (ver más abajo). Cierra el acceso
      directo de escritura que quedó abierto mientras se armaba el proyecto.
3. El seed de `schema.sql` solo trae categorías, tallas y accesorios de ejemplo.
   Entra al **Table Editor** y agrega manualmente algunos `productos`
   (camisas/pantalones) junto con sus filas en `producto_tallas` (con su `stock`),
   para que la página de categoría tenga prendas seleccionables.

## Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Flujo de prueba

1. Verás las categorías (Medicina, Construcción, Gastronomía, Administrativo) en el Home.
2. Al hacer clic en una, vas a `/categoria/<slug>`.
3. Eliges talla por cada prenda — el botón de cada talla muestra cuántas unidades
   quedan, y se oculta sola si llega a 0.
4. Marcas los accesorios que quieras; el resumen de la derecha se actualiza en vivo.
5. Llenas el formulario (nombre, correo y **teléfono**, los tres obligatorios) y
   das clic en "Solicitar dotación".
6. Eso llama a `POST /api/pedidos`, que valida todo contra la base de datos y llama
   a `crear_pedido_completo`: se crea el pedido, se descuenta el stock de las tallas
   elegidas y queda un registro en `pedido_estados`. Si todo sale bien, ves la
   pantalla de confirmación con el número de pedido.

## Arquitectura de seguridad (RLS)

Row Level Security está activo en todas las tablas. El reparto de responsabilidades es:

- **Lecturas públicas** (`categorias`, `productos`, `producto_tallas`, `tallas`,
  `accesorios`): política `SELECT` abierta, consultadas con la clave `anon` desde
  `lib/supabaseClient.js`. Cualquiera puede *ver* el catálogo, nadie puede escribirlo.
- **Escritura de pedidos** (`pedidos`, `pedido_items`): **no** se hace con INSERT
  directo desde el navegador. `app/api/pedidos/route.js` corre en el servidor y usa
  `lib/supabaseAdmin.js` (clave `service_role`) para llamar a la función
  `crear_pedido_completo`, que es `SECURITY DEFINER` y solo tiene permiso de
  ejecución para `service_role`. Así nadie puede crear pedidos falsos ni manipular
  precios llamando directo a la API de Supabase.
- **Trazabilidad** (`pedido_estados`): RLS activo y sin ninguna política pública
  a propósito — es un registro interno, solo accesible con `service_role` (por
  ejemplo, desde un futuro panel de administración).

## Desplegar en Vercel

1. Sube el repo a GitHub y conéctalo en [vercel.com](https://vercel.com).
2. En **Settings → Environment Variables**, agrega las tres variables de la
   tabla de arriba para el entorno **Production** (y Preview si lo usas).
3. Si agregas o cambias una variable después del primer deploy, Vercel no la
   aplica sola: ve a **Deployments**, abre el último deployment, `⋯` → **Redeploy**.

## Solución de problemas comunes

| Síntoma | Causa típica | Solución |
|---|---|---|
| `new row violates row-level security policy for table "pedidos"` | Se está insertando con la clave `anon` en vez de `service_role`, o falta la función `crear_pedido_completo` | Revisa que `route.js` use `guardarPedido` de `lib/queries.js`, y que hayas corrido la migración |
| `Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY...` | Falta la variable de entorno en Vercel, o el deployment es anterior a agregarla | Agrega la variable en Production y haz **Redeploy** |
| El pedido se crea pero el stock no baja | Estás en una versión de `queries.js` anterior a la función atómica | Usa la versión de `queries.js` que llama a `crear_pedido_completo` vía `admin.rpc(...)` |
| `Stock insuficiente: solo quedan N unidades en esa talla` | Alguien más compró esa talla justo antes (comportamiento esperado) | Es el control anti-sobreventa funcionando; el usuario debe elegir otra talla |

## Roadmap

- [ ] Panel de administración (con Supabase Auth) para gestionar productos,
      accesorios y ver/actualizar el estado de los pedidos entrantes.
- [ ] Subir imágenes de productos a **Supabase Storage** y usarlas en `imagen_url`.
- [ ] Suscripción a **Supabase Realtime** sobre `producto_tallas` para que el
      stock se actualice solo en la pantalla, sin recargar.
- [ ] Notificación por correo o WhatsApp al cliente cuando cambie el estado de su pedido.
