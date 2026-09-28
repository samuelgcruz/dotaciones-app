// lib/queries.js
// Capa de acceso a datos: centraliza todas las consultas a Supabase.
// Mantener las consultas aquí (y no dispersas en los componentes) facilita
// el mantenimiento y las pruebas.
import { supabase } from './supabaseClient';

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

/**
 * Guarda un pedido completo (encabezado + items) usando una función RPC
 * transaccional en Postgres seria lo ideal en producción; aquí lo hacemos
 * en dos pasos desde el cliente por simplicidad académica.
 *
 * @param {Object} datosCliente - { nombre, email, telefono, empresa, categoriaId, notas }
 * @param {Array}  items - [{ item_tipo, producto_id, accesorio_id, talla_id, cantidad, precio_unitario }]
 */
export async function guardarPedido(datosCliente, items) {
  const total = items.reduce((acc, item) => acc + item.cantidad * item.precio_unitario, 0);

  const { data: pedido, error: errPedido } = await supabase
    .from('pedidos')
    .insert({
      nombre_cliente: datosCliente.nombre,
      email_cliente: datosCliente.email,
      telefono_cliente: datosCliente.telefono,
      empresa: datosCliente.empresa,
      categoria_id: datosCliente.categoriaId,
      notas: datosCliente.notas,
      total,
    })
    .select()
    .single();

  if (errPedido) throw new Error(`Error al crear el pedido: ${errPedido.message}`);

  const itemsConPedidoId = items.map((item) => ({ ...item, pedido_id: pedido.id }));

  const { error: errItems } = await supabase.from('pedido_items').insert(itemsConPedidoId);

  if (errItems) throw new Error(`Error al guardar los items del pedido: ${errItems.message}`);

  return pedido;
}
