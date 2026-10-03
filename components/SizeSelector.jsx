// components/SizeSelector.jsx
// Muestra la imagen del producto arriba, con zoom suave al pasar el mouse,
// y los botones de talla con el stock real disponible (se actualiza solo
// con recargar la página, ya que ahora se descuenta al confirmar un pedido).
'use client';

import Image from 'next/image';

const STOCK_BAJO = 3;

export default function SizeSelector({ producto, tallaSeleccionadaId, onSeleccionar }) {
  const tallasDisponibles = producto.producto_tallas.filter((pt) => pt.stock > 0);

  return (
    <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">
      <div className="relative h-40 w-full bg-slate-100">
        {producto.imagen_url ? (
          <Image
            src={producto.imagen_url}
            alt={producto.nombre}
            fill
            sizes="(max-width: 768px) 100vw, 300px"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-300">
            Sin imagen
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-slate-900">{producto.nombre}</h4>
            <span className="text-xs uppercase tracking-wide text-slate-400">
              {producto.tipo_prenda}
            </span>
          </div>
          <span className="font-bold text-amber-700">
            ${producto.precio_base.toLocaleString('es-CO')}
          </span>
        </div>

        <label className="mb-2 block text-sm text-slate-600">Talla</label>
        <div className="flex flex-wrap gap-2">
          {tallasDisponibles.map((pt) => {
            const activa = tallaSeleccionadaId === pt.tallas.id;
            const stockBajo = pt.stock <= STOCK_BAJO;
            return (
              <button
                key={pt.id}
                type="button"
                onClick={() =>
                  onSeleccionar(producto.id, pt.tallas.id, producto.precio_base, producto.tipo_prenda)
                }
                className={`flex flex-col items-center rounded-lg border px-3 py-1.5 text-sm transition-all duration-150 ${
                  activa
                    ? 'scale-105 border-amber-600 bg-amber-600 text-white shadow-sm'
                    : 'border-slate-300 bg-white text-slate-700 hover:scale-105 hover:border-amber-400'
                }`}
              >
                <span>{pt.tallas.nombre}</span>
                <span
                  className={`text-[10px] leading-tight ${
                    activa ? 'text-amber-100' : stockBajo ? 'text-orange-500' : 'text-slate-400'
                  }`}
                >
                  {stockBajo ? `¡quedan ${pt.stock}!` : `${pt.stock} disp.`}
                </span>
              </button>
            );
          })}
          {tallasDisponibles.length === 0 && (
            <span className="text-sm text-slate-400">Sin stock disponible</span>
          )}
        </div>
      </div>
    </div>
  );
}
