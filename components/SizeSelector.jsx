// components/SizeSelector.jsx
// Ahora muestra la imagen del producto arriba, con zoom suave al pasar el
// mouse, y los botones de talla con una pequeña animación al seleccionar.
'use client';

import Image from 'next/image';

export default function SizeSelector({ producto, tallaSeleccionadaId, onSeleccionar }) {
  const tallasDisponibles = producto.producto_tallas.filter((pt) => pt.stock > 0);

  return (
    <div className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">
      <div className="relative h-40 w-full bg-gray-100">
        {producto.imagen_url ? (
          <Image
            src={producto.imagen_url}
            alt={producto.nombre}
            fill
            sizes="(max-width: 768px) 100vw, 300px"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-300">
            Sin imagen
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h4 className="font-semibold">{producto.nombre}</h4>
            <span className="text-xs uppercase tracking-wide text-gray-400">
              {producto.tipo_prenda}
            </span>
          </div>
          <span className="font-medium text-blue-600">
            ${producto.precio_base.toLocaleString('es-CO')}
          </span>
        </div>

        <label className="mb-2 block text-sm text-gray-600">Talla</label>
        <div className="flex flex-wrap gap-2">
          {tallasDisponibles.map((pt) => {
            const activa = tallaSeleccionadaId === pt.tallas.id;
            return (
              <button
                key={pt.id}
                type="button"
                onClick={() =>
                  onSeleccionar(producto.id, pt.tallas.id, producto.precio_base, producto.tipo_prenda)
                }
                className={`rounded-md border px-3 py-1 text-sm transition-all duration-150 ${
                  activa
                    ? 'scale-105 border-blue-600 bg-blue-600 text-white shadow-sm'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:scale-105'
                }`}
              >
                {pt.tallas.nombre}
              </button>
            );
          })}
          {tallasDisponibles.length === 0 && (
            <span className="text-sm text-gray-400">Sin stock disponible</span>
          )}
        </div>
      </div>
    </div>
  );
}
