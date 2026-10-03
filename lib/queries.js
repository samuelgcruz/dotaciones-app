// lib/queries.js
// Capa de acceso a datos: centraliza todas las consultas a Supabase.
// Mantener las consultas aquí (y no dispersas en los componentes) facilita
// el mantenimiento y las pruebas.
//
// - Las LECTURAS (categorías, productos, accesorios) usan el cliente público
//   `supabase` (clave anon) y se rigen por las políticas de lectura pública.
// - La ESCRITURA del pedido usa `getSupabaseAdmin()` (service_role) porque
//   pedidos/pedido_items no son legibles públicamente. Solo debe ejecutarse
//   en el servidor (ruta /api/pedidos).
import { supabase } from './supabaseClient';
import { getSupabaseAdmin } from './supabaseAdmin';

/**
 * Obtiene todas las categorías activas para el catálogo del Home.
 */
export async function obtenerCategorias() {
  const { data, error } = await supabase
    .from('categorias')
    .select('id, nombre, slug, descripcion, icono_url')
    .eq('activo', true)
    .order('nombre');

  if (error) throw new Error(`Error al obtener categorías: ${error.message}`);
  return data;
}

/**
 * Obtiene una categoría por su slug (ej. "medicina") junto con:
 * - sus productos (camisas/filipinas y pantalones) y las tallas disponibles de cada uno
 * - sus accesorios dinámicos
 * Esto permite armar toda la página de personalización con una sola llamada.
 */
export async function obtenerCategoriaConDetalle(slug) {
  const { data: categoria, error: errCategoria } = await supabase
    .from('categorias')
    .select('id, nombre, slug, descripcion')
    .eq('slug', slug)
    .single();

  if (errCategoria) throw new Error(`Categoría no encontrada: ${errCategoria.message}`);

  const { data: productos, error: errProductos } = await supabase
    .from('productos')
    .select(`
      id, nombre, tipo_prenda, precio_base, imagen_url,
      producto_tallas ( id, stock, tallas ( id, nombre ) )
    `)
    .eq('categoria_id', categoria.id)
    .eq('activo', true);

  if (errProductos) throw new Error(`Error al obtener productos: ${errProductos.message}`);

  const { data: accesorios, error: errAccesorios } = await supabase
    .from('accesorios')
    .select('id, nombre, precio, requiere_talla, imagen_url')
    .eq('categoria_id', categoria.id)
    .eq('activo', true);

  if (errAccesorios) throw new Error(`Error al obtener accesorios: ${errAccesorios.message}`);

  return { categoria, productos, accesorios };
}

// Error de validación: la ruta lo responde con HTTP 400 y muestra el mensaje al usuario.
function errorValidacion(mensaje) {
  const error = new Error(mensaje);
  error.status = 400;
  return error;
}

// Texto opcional: recorta espacios y guarda null si quedó vacío.
function textoOpcional(valor) {
  const texto = String(valor ?? '').trim();
  return texto === '' ? null : texto;
}

/**
 * Guarda un pedido completo (encabezado + items).
 *
 * Seguridad:
 *  - Usa service_role (solo servidor), así no se necesita abrir SELECT público en pedidos.
 *  - NO confía en los precios que manda el navegador: los recalcula desde la base de datos.
 *  - Solo guarda las columnas que existen en pedido_items (el frontend envía además
 *    `nombre` y `tallaNombre`, que son solo para mostrar en pantalla).
 *
 * @param {Object} datosCliente - { nombre, email, telefono, empresa, categoriaId, notas }
 * @param {Array}  items - [{ item_tipo, producto_id, accesorio_id, talla_id, cantidad, ... }]
 * @returns {Object} { id, total, estado, creado_en }
 */
export async function guardarPedido(datosCliente, items) {
  const admin = getSupabaseAdmin();

  // ---------- 1. Validar y limpiar los datos del cliente ----------
  const nombre = String(datosCliente?.nombre ?? '').trim();
  const email = String(datosCliente?.email ?? '').trim();
  const categoriaId = datosCliente?.categoriaId;

  if (!nombre || !email) {
    throw errorValidacion('Nombre y correo del cliente son obligatorios.');
  }
  if (!categoriaId) {
    throw errorValidacion('Falta la categoría del pedido.');
  }
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    throw errorValidacion('El pedido debe incluir entre 1 y 50 ítems.');
  }

  // ---------- 2. Traer precios reales y tallas válidas desde la BD ----------
  const productoIds = [
    ...new Set(items.filter((i) => i?.item_tipo === 'producto').map((i) => i.producto_id)),
  ];
  const accesorioIds = [
    ...new Set(items.filter((i) => i?.item_tipo === 'accesorio').map((i) => i.accesorio_id)),
  ];

  const vacio = { data: [], error: null };

  const [resProductos, resAccesorios, resTallas] = await Promise.all([
    productoIds.length
      ? admin
          .from('productos')
          .select('id, precio_base')
          .in('id', productoIds)
          .eq('categoria_id', categoriaId)
          .eq('activo', true)
      : vacio,
    accesorioIds.length
      ? admin
          .from('accesorios')
          .select('id, precio')
          .in('id', accesorioIds)
          .eq('categoria_id', categoriaId)
          .eq('activo', true)
      : vacio,
    productoIds.length
      ? admin.from('producto_tallas').select('producto_id, talla_id').in('producto_id', productoIds)
      : vacio,
  ]);

  if (resProductos.error) throw new Error(`Error al validar prendas: ${resProductos.error.message}`);
  if (resAccesorios.error) throw new Error(`Error al validar accesorios: ${resAccesorios.error.message}`);
  if (resTallas.error) throw new Error(`Error al validar tallas: ${resTallas.error.message}`);

  const preciosProducto = new Map(resProductos.data.map((p) => [p.id, Number(p.precio_base)]));
  const preciosAccesorio = new Map(resAccesorios.data.map((a) => [a.id, Number(a.precio)]));
  const tallasPermitidas = new Set(resTallas.data.map((t) => `${t.producto_id}:${t.talla_id}`));

  // ---------- 3. Armar los items finales (solo columnas reales, precio de la BD) ----------
  const itemsLimpios = items.map((item) => {
    const cantidad = Number(item?.cantidad ?? 1);
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 99) {
      throw errorValidacion('La cantidad de un ítem no es válida.');
    }

    if (item?.item_tipo === 'producto') {
      const precio = preciosProducto.get(item.producto_id);
      if (precio === undefined) {
        throw errorValidacion('Una de las prendas no existe o no pertenece a esta categoría.');
      }
      if (!tallasPermitidas.has(`${item.producto_id}:${item.talla_id}`)) {
        throw errorValidacion('La talla elegida no está disponible para una de las prendas.');
      }
      return {
        item_tipo: 'producto',
        producto_id: item.producto_id,
        accesorio_id: null,
        talla_id: item.talla_id,
        cantidad,
        precio_unitario: precio,
      };
    }

    if (item?.item_tipo === 'accesorio') {
      const precio = preciosAccesorio.get(item.accesorio_id);
      if (precio === undefined) {
        throw errorValidacion('Uno de los accesorios no existe o no pertenece a esta categoría.');
      }
      return {
        item_tipo: 'accesorio',
        producto_id: null,
        accesorio_id: item.accesorio_id,
        talla_id: null,
        cantidad,
        precio_unitario: precio,
      };
    }

    throw errorValidacion('Tipo de ítem no válido.');
  });

  const total = itemsLimpios.reduce((acc, i) => acc + i.cantidad * i.precio_unitario, 0);

  // ---------- 4. Crear el encabezado del pedido ----------
  const { data: pedido, error: errPedido } = await admin
    .from('pedidos')
    .insert({
      nombre_cliente: nombre,
      email_cliente: email,
      telefono_cliente: textoOpcional(datosCliente.telefono),
      empresa: textoOpcional(datosCliente.empresa),
      categoria_id: categoriaId,
      notas: textoOpcional(datosCliente.notas),
      total,
    })
    .select('id, total, estado, creado_en')
    .single();

  if (errPedido) throw new Error(`Error al crear el pedido: ${errPedido.message}`);

  // ---------- 5. Crear los items; si fallan, deshacer el pedido ----------
  const { error: errItems } = await admin
    .from('pedido_items')
    .insert(itemsLimpios.map((item) => ({ ...item, pedido_id: pedido.id })));

  if (errItems) {
    // Compensación manual (no hay transacción en dos pasos): evita pedidos huérfanos.
    // pedido_items tiene ON DELETE CASCADE, así que basta con borrar el encabezado.
    await admin.from('pedidos').delete().eq('id', pedido.id);
    throw new Error(`Error al guardar los items del pedido: ${errItems.message}`);
  }

  return pedido;
}
