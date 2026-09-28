# Dotaciones App — Guía de inicialización

## 1. Crear el proyecto Next.js

Abre una terminal en Visual Studio Code y ejecuta:

```bash
npx create-next-app@latest dotaciones-app --js --tailwind --eslint --app --src-dir=false --import-alias "@/*"
cd dotaciones-app
```

Cuando pregunte por Tailwind y App Router, responde "Yes" (ya lo pasamos como flag, pero por si acaso).

## 2. Instalar el cliente de Supabase

```bash
npm install @supabase/supabase-js
```

## 3. Copiar los archivos de este proyecto

Sobrescribe/crea en tu proyecto recién generado los archivos que te entregué:
- `lib/supabaseClient.js`
- `lib/queries.js`
- `app/page.js`
- `app/layout.js`
- `app/categoria/[slug]/page.js`
- `app/categoria/[slug]/CategoriaClient.jsx`
- `app/api/pedidos/route.js`
- `components/*.jsx`

## 4. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Ve a **SQL Editor** y pega el contenido de `supabase/schema.sql`. Ejecútalo.
3. Ve a **Project Settings > API** y copia tu `Project URL` y `anon public key`.
4. Crea el archivo `.env.local` en la raíz del proyecto (usa `.env.local.example` como plantilla):

```bash
cp .env.local.example .env.local
```

Y pega tus credenciales reales.

## 5. Ejecutar el proyecto en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## 6. Flujo para probar

1. Verás las 4 categorías (Medicina, Construcción, Gastronomía, Administrativo).
2. Al hacer clic en una, irás a `/categoria/<slug>`.
3. **Nota:** el seed SQL solo crea categorías, tallas y accesorios de ejemplo — necesitas
   insertar manualmente algunos `productos` (camisas/pantalones) y sus `producto_tallas`
   desde el **Table Editor** de Supabase para que la página de categoría muestre prendas
   seleccionables (agrega esto en tu SQL Editor si quieres automatizarlo).
4. Selecciona tallas, marca accesorios, y verás el resumen actualizarse en vivo.
5. Llena el formulario y da clic en "Solicitar dotación" — esto llama a
   `POST /api/pedidos`, que guarda el pedido en Supabase.

## Próximos pasos sugeridos

- Agregar un panel de administración (con Supabase Auth) para gestionar
  productos, accesorios y ver pedidos entrantes.
- Subir imágenes de productos a **Supabase Storage** y usar esa URL en
  `imagen_url`.
- Agregar validación de stock antes de confirmar el pedido (restar `stock`
  en `producto_tallas` mediante una función RPC transaccional).
