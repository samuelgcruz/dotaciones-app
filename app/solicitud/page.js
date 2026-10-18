// app/solicitud/page.js
// Solicitud especial: pedidos por volumen, equipos completos o artículos a la medida.
// Solo LEE el catálogo (para que la empresa elija artículos reales); no escribe nada en la BD.
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { obtenerCatalogoCompleto } from '@/lib/queries';
import { compararNombresTalla, etiquetaTipo } from '@/lib/formato';
import SolicitudClient from './SolicitudClient';

export const metadata = {
  title: 'Solicitud especial | Dotaciones y Uniformes',
  description: 'Pide cantidades que superan el stock del catálogo, equipos completos o artículos a la medida.',
};

export default async function SolicitudPage({ searchParams }) {
  const params = await searchParams;
  const catalogo = await obtenerCatalogoCompleto();

  // Solo datos simples y serializables para el cliente
  const zonas = catalogo.map(({ categoria, productos, accesorios }) => ({
    id: categoria.id,
    nombre: categoria.nombre,
    slug: categoria.slug,
    prendas: productos.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      tipo: etiquetaTipo(p.tipo_prenda),
      descripcion: p.descripcion ?? '',
      precio: Number(p.precio_base),
      tallas: [...p.producto_tallas]
        .sort((a, b) => compararNombresTalla(a.tallas.nombre, b.tallas.nombre))
        .map((pt) => ({ id: pt.tallas.id, nombre: pt.tallas.nombre, stock: pt.stock })),
    })),
    accesorios: accesorios.map((a) => ({
      id: a.id,
      nombre: a.nombre,
      descripcion: a.descripcion ?? '',
      precio: Number(a.precio),
    })),
  }));

  // Si llega desde una ficha del catálogo, ya viene la zona, el artículo y la talla elegidos
  const texto = (v) => (typeof v === 'string' ? v : '');
  const zona = zonas.find((z) => z.slug === texto(params?.zona));
  let articuloKey = '';
  let tallaId = '';
  if (zona) {
    const prenda = zona.prendas.find((p) => p.id === texto(params?.producto));
    const accesorio = zona.accesorios.find((a) => a.id === texto(params?.accesorio));
    if (prenda) {
      articuloKey = `p:${prenda.id}`;
      tallaId = prenda.tallas.find((t) => t.id === texto(params?.talla))?.id ?? '';
    } else if (accesorio) {
      articuloKey = `a:${accesorio.id}`;
    }
  }

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
          Arma tu solicitud por partes, según lo que necesites: más unidades de un artículo del
          catálogo, equipos completos para una zona o algo a la medida. Puedes combinar varias.
        </p>
      </header>

      <SolicitudClient zonas={zonas} inicial={{ zonaId: zona?.id ?? '', articuloKey, tallaId }} />
    </div>
  );
}
