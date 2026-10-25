// app/api/sugerencias/route.js
// POST /api/sugerencias: guarda una sugerencia de producto en sugerencias_productos.
// Igual que /api/pedidos y /api/solicitudes: escribe el servidor con service_role y valida antes.
import { NextResponse } from 'next/server';
import { guardarSugerencia } from '@/lib/queries';

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body || typeof body !== 'object' || !body.datos || typeof body.datos !== 'object') {
      return NextResponse.json({ error: 'La sugerencia llegó incompleta.' }, { status: 400 });
    }

    const sugerencia = await guardarSugerencia(body.datos);

    return NextResponse.json({ mensaje: 'Sugerencia registrada', sugerencia }, { status: 201 });
  } catch (error) {
    console.error('Error en POST /api/sugerencias:', error);

    if (error.status === 400) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'La sugerencia llegó incompleta.' }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'No se pudo registrar la sugerencia. Intenta de nuevo en unos minutos.' },
      { status: 500 }
    );
  }
}
