# Dotaciones: paquete completo (género, solicitudes, guía de tallas, búsqueda y sugerencias)

Este zip reúne TODO lo hecho hasta ahora sobre el diseño industrial. Se aplica una sola vez.

## Cómo aplicarlo

1. **Base de datos.** En Supabase → SQL Editor ejecuta, en este orden:
   1. `sql/001_genero_y_solicitudes.sql`
   2. `sql/002_sugerencias.sql`

   Ambos se pueden correr más de una vez sin romper nada. Hazlo ANTES de subir el código:
   el catálogo lee las columnas nuevas `genero` y `grupo`.
2. **Archivos.** Copia las carpetas `app/`, `components/` y `lib/` sobre tu proyecto,
   respetando la estructura (reemplazan a los que tengan el mismo nombre).
   No se toca `app/api/pedidos/route.js` ni `OrderSummary.jsx`, `CartBar.jsx`, etc.
3. **Género de tus prendas.** Al final del SQL 001 hay ejemplos de `update` para marcar
   cada prenda como `mujer`, `hombre` o `unisex` y unir las dos versiones con el mismo `grupo`.
4. `npm run dev` y listo. No hay variables de entorno nuevas; ya no se usan
   `NEXT_PUBLIC_WHATSAPP_NUMERO` ni `NEXT_PUBLIC_CORREO_SOLICITUDES`.

## Qué trae

**Género en el catálogo.** Barra fija «Prendas para: Mujer | Hombre | Ver ambos» que acompaña el
scroll. Solo filtra prendas; las unisex llevan la etiqueta «Producto unisex». Si dos productos
comparten `grupo` (ej. `bata-medica`) salen juntos en una ficha, cada uno con sus tallas y
su stock, para pedir 20 de mujer y 20 de hombre sin cambiar de filtro.

**Accesorios.** Independientes del género. Los que tienen `requiere_talla = true` piden talla.

**Búsqueda inteligente** (sin IA, funciona igual en local y en Vercel):
- En cada zona y en el inicio. Ignora tildes y mayúsculas, entiende plurales, tolera errores
  de tecleo («pantalom», «guntes») y reconoce sinónimos («cofia» = gorro, «mandil» = delantal,
  «dama» = mujer).
- Sin resultados propone «¿Quisiste decir…?», avisa si hay resultados en el otro género y
  ofrece sugerir el producto.
- Los sinónimos están en `lib/busqueda.js` (lista `SINONIMOS`); agrega los de tu rubro ahí.

**¿Falta algo en tu pedido?** Sugerencias de complementos de la zona, con reglas: la otra versión
de la prenda (pediste mujer, ¿y hombre?), tipos de prenda que aún no llevas y accesorios.

**Guía de tallas.** Página `/guia-tallas` y botón dentro de cada ficha de prenda (abre una
ventana, sin salir del catálogo). Calculadora «¿qué talla soy?», equivalencias por país,
medidas del cuerpo en cm o pulgadas, cómo medirte y calzado. Lleva el aviso de proyecto
académico: **los números son de ejemplo**. Están en `lib/guiaTallas.js`.

**Sugerir un producto** (`/sugerencias`). Formulario que se guarda en la tabla
`sugerencias_productos` (código SUG-0001). Mientras escribes el nombre avisa si ya existe algo
parecido en el catálogo. Estados: nueva, en_revisión, aceptada, descartada.

**Solicitud especial guardada** en `solicitudes_especiales` (código SOL-0001), con el servidor
recalculando todo antes de insertar.

**Menú.** Guía de tallas, Sugerir un producto y Solicitud especial: en el encabezado (pantallas
anchas), en un menú desplegable (móvil) y en el pie de página.

## Cómo revisar lo que llega

```sql
select 'SOL-' || lpad(numero::text, 4, '0') as codigo, empresa, contacto, total_unidades, estado, creado_en
from solicitudes_especiales order by creado_en desc;

select 'SUG-' || lpad(numero::text, 4, '0') as codigo, nombre_articulo, tipo, genero, zona_nombre, empresa, estado
from sugerencias_productos order by creado_en desc;
```

## Lista de archivos

| Carpeta | Archivos |
|---|---|
| `sql/` | `001_genero_y_solicitudes.sql`, `002_sugerencias.sql` |
| `app/api/` | `solicitudes/route.js` (nuevo), `sugerencias/route.js` (nuevo) |
| `app/` | `layout.js`, `page.js`, `globals.css`, `guia-tallas/page.js` (nuevo), `sugerencias/` (nuevo), `solicitud/`, `categoria/[slug]/` |
| `components/` | `SizeSelector`, `AccessoriesSelector`, `CartDrawer`, `SolicitudBloques`, `ControlCantidad`; nuevos: `GuiaTallas`, `BotonGuiaTallas`, `BuscadorGlobal`, `Complementos`, `MenuPrincipal` |
| `lib/` | `queries`, `solicitud`, `carrito`, `contacto`, `formato`; nuevos: `catalogo`, `busqueda`, `guiaTallas`, `sugerencias` |
