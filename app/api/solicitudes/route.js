// app/api/solicitudes/route.js
// POST /api/solicitudes: guarda una solicitud especial en la tabla solicitudes_especiales.
// Igual que /api/pedidos: la escritura la hace el servidor con service_role y se
// revalida todo (datos de la empresa, necesidades y totales) antes de insertar.
import { NextResponse } from 'next/server';
import { guardarSolicitud } from '@/lib/queries';

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body || typeof body !== 'object' || !body.datos || !Array.isArray(body.bloques)) {
      return NextResponse.json({ error: 'La solicitud llegó incompleta.' }, { status: 400 });
    }

    const solicitud = await guardarSolicitud(body.datos, body.bloques);

    return NextResponse.json({ mensaje: 'Solicitud registrada', solicitud }, { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/solicitudes:', error);

    // Errores de validación (400): el mensaje es seguro de mostrar al usuario.
    if (error.status === 400) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'La solicitud llegó incompleta.' }, { status: 400 });
    }

    // Errores internos: el detalle queda solo en los logs del servidor.
    return NextResponse.json(
      { error: 'No se pudo registrar la solicitud. Intenta de nuevo en unos minutos.' },
      { status: 500 }
    );
  }
}
