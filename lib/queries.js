// lib/queries.js
// Capa de acceso a datos: centraliza todas las consultas a Supabase.
//
// - Las LECTURAS (categorías, productos, accesorios) usan el cliente público
//   `supabase` (clave anon) y se rigen por las políticas de lectura pública.
// - La ESCRITURA del pedido usa `getSupabaseAdmin()` (service_role) y llama
//   a la función de Postgres `crear_pedido_completo`, que en una sola
//   transacción atómica: crea el pedido, crea los items, descuenta el
//   stock de producto_tallas y registra la trazabilidad (pedido_estados).
//   Solo debe ejecutarse en el servidor (ruta /api/pedidos).
import { supabase } from './supabaseClient';
import { getSupabaseAdmin } from './supabaseAdmin';
import { construirZonas, resumenBloque, sanearBloques, sanearDatosSolicitud, validarDatos } from './solicitud';

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
 * Lista de tallas disponibles en el sistema (sin stock). La usan los accesorios
 * que requieren talla (requiere_talla = true), como unos guantes.
 */
export async function obtenerTallas() {
  const { data, error } = await supabase.from('tallas').select('id, nombre');
  if (error) throw new Error(`Error al obtener tallas: ${error.message}`);
  return data ?? [];
}

/**
 * Obtiene una categoría por su slug (ej. "medicina") junto con:
 * - sus productos (camisas/filipinas y pantalones) y las tallas disponibles de cada uno
 * - sus accesorios dinámicos
 * Esto permite armar toda la página de personalización con una sola llamada.
 *
 * Nota: como el stock ahora se descuenta en el momento de crear el pedido
 * (ver crear_pedido_completo), esta lectura ya refleja el stock real cada
 * vez que alguien abre o recarga la página de la categoría.
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
      id, nombre, tipo_prenda, genero, grupo, descripcion, precio_base, imagen_url,
      producto_tallas ( id, stock, tallas ( id, nombre ) )
    `)
    .eq('categoria_id', categoria.id)
    .eq('activo', true);

  if (errProductos) throw new Error(`Error al obtener productos: ${errProductos.message}`);

  const { data: accesorios, error: errAccesorios } = await supabase
    .from('accesorios')
    .select('id, nombre, descripcion, precio, requiere_talla, imagen_url')
    .eq('categoria_id', categoria.id)
    .eq('activo', true);

  if (errAccesorios) throw new Error(`Error al obtener accesorios: ${errAccesorios.message}`);

  return { categoria, productos, accesorios };
}

/**
 * Catálogo completo (todas las zonas con sus prendas y accesorios), solo lectura.
 * Lo usa la solicitud especial para que la empresa elija artículos reales.
 */
export async function obtenerCatalogoCompleto() {
  const categorias = await obtenerCategorias();
  return Promise.all(
    categorias.map(async (categoria) => {
      const detalle = await obtenerCategoriaConDetalle(categoria.slug);
      return { categoria, productos: detalle.productos, accesorios: detalle.accesorios };
    })
  );
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

// Mensajes que SÍ vienen de nuestras propias reglas de negocio en SQL
// (stock insuficiente, combinación inexistente) y son seguros de mostrarle
// al cliente. Cualquier otro error de la función se trata como error
// interno (no se expone el detalle en producción).
const PATRON_ERROR_NEGOCIO = /stock insuficiente|no existe la combinación/i;

/**
 * Guarda un pedido completo (encabezado + items), descuenta el stock
 * correspondiente y deja trazabilidad — todo en una sola transacción
 * atómica dentro de Postgres (función crear_pedido_completo).
 *
 * Seguridad:
 *  - Usa service_role (solo servidor): pedidos/pedido_items no son
 *    legibles ni escribibles públicamente.
 *  - NO confía en los precios ni en el stock que manda el navegador: los
 *    valida contra la base de datos antes de llamar a la función, y la
 *    función los vuelve a verificar con bloqueo de fila (evita que dos
 *    compras simultáneas vendan más unidades de las que hay).
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
  const telefono = textoOpcional(datosCliente?.telefono);
  const categoriaId = datosCliente?.categoriaId;

  if (!nombre || !email) {
    throw errorValidacion('Nombre y correo del cliente son obligatorios.');
  }
  if (!telefono) {
    throw errorValidacion('El teléfono de contacto es obligatorio.');
  }
  if (!/^\+\d{8,15}$/.test(telefono)) {
    throw errorValidacion('El teléfono de contacto no tiene un formato válido.');
  }
  if (!categoriaId) {
    throw errorValidacion('Falta la categoría del pedido.');
  }
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    throw errorValidacion('El pedido debe incluir entre 1 y 50 ítems.');
  }

  // ---------- 2. Traer precios y stock reales desde la BD ----------
  const productoIds = [
    ...new Set(items.filter((i) => i?.item_tipo === 'producto').map((i) => i.producto_id)),
  ];
  const accesorioIds = [
    ...new Set(items.filter((i) => i?.item_tipo === 'accesorio').map((i) => i.accesorio_id)),
  ];

  const vacio = { data: [], error: null };

  const tallaAccesorioIds = [
    ...new Set(
      items.filter((i) => i?.item_tipo === 'accesorio' && i.talla_id).map((i) => i.talla_id)
    ),
  ];

  const [resProductos, resAccesorios, resTallas, resTallasAccesorio] = await Promise.all([
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
          .select('id, nombre, precio, requiere_talla')
          .in('id', accesorioIds)
          .eq('categoria_id', categoriaId)
          .eq('activo', true)
      : vacio,
    productoIds.length
      ? admin.from('producto_tallas').select('producto_id, talla_id, stock').in('producto_id', productoIds)
      : vacio,
    tallaAccesorioIds.length
      ? admin.from('tallas').select('id, nombre').in('id', tallaAccesorioIds)
      : vacio,
  ]);

  if (resProductos.error) throw new Error(`Error al validar prendas: ${resProductos.error.message}`);
  if (resAccesorios.error) throw new Error(`Error al validar accesorios: ${resAccesorios.error.message}`);
  if (resTallas.error) throw new Error(`Error al validar tallas: ${resTallas.error.message}`);
  if (resTallasAccesorio.error) throw new Error(`Error al validar tallas: ${resTallasAccesorio.error.message}`);

  const preciosProducto = new Map(resProductos.data.map((p) => [p.id, Number(p.precio_base)]));
  const datosAccesorio = new Map(
    resAccesorios.data.map((a) => [
      a.id,
      { nombre: a.nombre, precio: Number(a.precio), requiereTalla: Boolean(a.requiere_talla) },
    ])
  );
  const nombreTallaAccesorio = new Map(resTallasAccesorio.data.map((t) => [t.id, t.nombre]));
  const notasAccesorios = []; // respaldo legible de las tallas de accesorios
  const stockPorTalla = new Map(
    resTallas.data.map((t) => [`${t.producto_id}:${t.talla_id}`, t.stock])
  );

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

      const clave = `${item.producto_id}:${item.talla_id}`;
      const stockDisponible = stockPorTalla.get(clave);
      if (stockDisponible === undefined) {
        throw errorValidacion('La talla elegida no está disponible para una de las prendas.');
      }
      if (stockDisponible < cantidad) {
        throw errorValidacion(`Solo quedan ${stockDisponible} unidades disponibles en esa talla.`);
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
      const accesorio = datosAccesorio.get(item.accesorio_id);
      if (!accesorio) {
        throw errorValidacion('Uno de los accesorios no existe o no pertenece a esta categoría.');
      }

      // Solo los accesorios marcados con requiere_talla llevan talla; los demás la ignoran.
      let tallaId = null;
      if (accesorio.requiereTalla) {
        if (!item.talla_id) {
          throw errorValidacion(`Elige la talla de: ${accesorio.nombre}.`);
        }
        const nombreTalla = nombreTallaAccesorio.get(item.talla_id);
        if (!nombreTalla) {
          throw errorValidacion(`La talla elegida para ${accesorio.nombre} no existe.`);
        }
        tallaId = item.talla_id;
        notasAccesorios.push(`${accesorio.nombre} talla ${nombreTalla} x${cantidad}`);
      }

      return {
        item_tipo: 'accesorio',
        producto_id: null,
        accesorio_id: item.accesorio_id,
        talla_id: tallaId,
        cantidad,
        precio_unitario: accesorio.precio,
      };
    }

    throw errorValidacion('Tipo de ítem no válido.');
  });

  // ---------- 4. Crear el pedido, sus items y descontar stock: TODO atómico ----------
  const { data: pedido, error: errRpc } = await admin.rpc('crear_pedido_completo', {
    p_nombre_cliente: nombre,
    p_email_cliente: email,
    p_telefono_cliente: telefono,
    p_empresa: textoOpcional(datosCliente.empresa),
    p_categoria_id: categoriaId,
    p_notas:
      [
        textoOpcional(datosCliente.notas),
        notasAccesorios.length ? `Accesorios con talla: ${notasAccesorios.join('; ')}` : null,
      ]
        .filter(Boolean)
        .join('\n') || null,
    p_items: itemsLimpios,
  });

  if (errRpc) {
    // Si otra persona compró la última unidad justo antes (carrera entre
    // dos compras simultáneas), la función SQL lo detecta y este es el
    // mensaje que llega aquí: es seguro mostrárselo al cliente.
    if (PATRON_ERROR_NEGOCIO.test(errRpc.message)) {
      throw errorValidacion(errRpc.message);
    }
    throw new Error(`Error al crear el pedido: ${errRpc.message}`);
  }

  return pedido;
}

/**
 * Guarda una solicitud especial en la tabla solicitudes_especiales.
 *
 * El servidor NO confía en lo que calcula el navegador: limpia los textos, vuelve a
 * leer el catálogo y recalcula cada necesidad y el total con las mismas reglas
 * (lib/solicitud.js) antes de insertar. Solo escribe con service_role.
 *
 * @param {Object} datos   - { empresa, nit, contacto, email, prefijo, numero, ciudad, fecha, notas }
 * @param {Array}  bloques - necesidades armadas en la pantalla de solicitud
 * @returns {Object} { id, numero, codigo, estado, creado_en, total_unidades }
 */
export async function guardarSolicitud(datos, bloques) {
  const admin = getSupabaseAdmin();

  const limpios = sanearDatosSolicitud(datos);
  const errores = validarDatos(limpios);
  const primerError = Object.values(errores)[0];
  if (primerError) throw errorValidacion(primerError);

  const bloquesLimpios = sanearBloques(bloques);
  if (bloquesLimpios.length === 0) {
    throw errorValidacion('Agrega al menos una necesidad a la solicitud.');
  }

  const zonas = construirZonas(await obtenerCatalogoCompleto());
  const zonaPorId = new Map(zonas.map((z) => [z.id, z]));
  const resumenes = bloquesLimpios.map((b) => resumenBloque(b, zonaPorId));

  const incompleto = resumenes.find((r) => !r.listo);
  if (incompleto) {
    throw errorValidacion(incompleto.falta || 'Una de las necesidades está incompleta.');
  }

  const totalUnidades = resumenes.reduce((acc, r) => acc + r.total, 0);
  const referencia = resumenes.reduce((acc, r) => acc + r.referencia, 0);

  const { data, error } = await admin
    .from('solicitudes_especiales')
    .insert({
      empresa: limpios.empresa,
      nit: textoOpcional(limpios.nit),
      contacto: limpios.contacto,
      email: limpios.email,
      telefono: `${limpios.prefijo}${limpios.numero}`,
      ciudad: textoOpcional(limpios.ciudad),
      fecha_requerida: textoOpcional(limpios.fecha),
      notas: textoOpcional(limpios.notas),
      bloques: bloquesLimpios,
      resumen: resumenes.map((r) => ({
        etiqueta: r.etiqueta,
        lineas: r.lineas,
        total: r.total,
        referencia: r.referencia,
      })),
      total_unidades: totalUnidades,
      referencia_precio: referencia,
    })
    .select('id, numero, estado, creado_en, total_unidades')
    .single();

  if (error) throw new Error(`Error al guardar la solicitud: ${error.message}`);

  return { ...data, codigo: `SOL-${String(data.numero).padStart(4, '0')}` };
}
