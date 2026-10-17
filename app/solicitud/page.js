// app/solicitud/page.js
// Solicitud especial: pedidos por volumen o fuera del stock del catálogo.
// Solo lee las zonas (para el selector); no escribe nada en la base de datos.
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { obtenerCategorias } from '@/lib/queries';
import SolicitudClient from './SolicitudClient';

export const metadata = {
  title: 'Solicitud especial | Dotaciones y Uniformes',
  description: 'Pide cantidades que superan el stock del catálogo o artículos a la medida.',
};

export default async function SolicitudPage({ searchParams }) {
  const params = await searchParams;
  const categorias = await obtenerCategorias();

  // Permite llegar desde una ficha con la zona y el artículo ya rellenados
  const zona = typeof params?.zona === 'string' ? categorias.find((c) => c.slug === params.zona) : null;
  const articulo = typeof params?.articulo === 'string' ? params.articulo.slice(0, 120) : '';

  return (
    <div className="mx-auto max-w-[88rem] px-4 pt-6 sm:px-8 sm:pt-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
        Volver al catálogo
      </Link>

      <header className="mb-10 grid grid-cols-[minmax(0,1fr)] gap-5 border-b-2 border-tinta pb-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end">
        <h1 className="text-balance font-display text-[clamp(3rem,7.5vw,6.5rem)] font-extrabold uppercase leading-[0.85] tracking-tight">
          Solicitud especial
        </h1>
        <p className="text-lg leading-snug text-acero">
          Para cantidades que superan el stock del catálogo o artículos a la medida. Indica qué
          necesitas y cuántas unidades; tu solicitud sale directo a nuestro equipo por WhatsApp o
          correo.
        </p>
      </header>

      <SolicitudClient
        zonas={categorias.map((c) => ({ id: c.id, nombre: c.nombre }))}
        inicial={{ zonaId: zona?.id ?? '', articulo }}
      />
    </div>
  );
}
