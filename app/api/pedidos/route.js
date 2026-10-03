// app/api/pedidos/route.js
// Esta ruta actúa como nuestra "capa backend": recibe el pedido armado en el
// frontend, valida los datos mínimos y lo persiste en Supabase.
// Equivale a un endpoint Express: POST /api/pedidos
import { NextResponse } from 'next/server';
import { guardarPedido } from '@/lib/queries';

export async function POST(request) {
  try {
    const body = await request.json();
    const { datosCliente, items } = body;

    // Validaciones básicas del lado del servidor (nunca confiar solo en el frontend)
    if (!datosCliente?.nombre || !datosCliente?.email) {
      return NextResponse.json(
        { error: 'Nombre y correo del cliente son obligatorios.' },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'El pedido debe incluir al menos un ítem (prenda o accesorio).' },
        { status: 400 }
      );
    }

    // guardarPedido revalida todo, recalcula precios desde la BD y escribe con service_role
    const pedido = await guardarPedido(datosCliente, items);

    return NextResponse.json({ mensaje: 'Pedido creado con éxito', pedido }, { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/pedidos:', error);

    // Errores de validación (status 400): el mensaje es seguro de mostrar al usuario.
    if (error.status === 400) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // ⚠️ TEMPORAL PARA DEPURAR ⚠️
    // Mientras encontramos la causa del 500, mostramos el mensaje real en vez
    // del genérico (en Vercel, NODE_ENV siempre es "production", así que la
    // condición de antes nunca mostraba el detalle). Antes de que clientes
    // reales usen el sitio, vuelve a dejar solo el mensaje genérico de abajo
    // (está comentado) y borra la línea `mensaje: error.message`.
    return NextResponse.json(
      {
        error: 'No se pudo crear el pedido. Intenta de nuevo en unos minutos.',
        mensaje: error.message, // <-- quita esta línea cuando termines de depurar
      },
      { status: 500 }
    );
  }
}
