// app/categoria/[slug]/CategoriaClient.jsx
// Cuerpo de la zona: planilla de prendas y tablero de accesorios.
// Ya no guarda estado propio: todo lo que se elige va al carrito global
// (lib/carrito.js), de modo que se conserva al cambiar de zona.
'use client';

import SizeSelector from '@/components/SizeSelector';
import AccessoriesSelector from '@/components/AccessoriesSelector';

function Encabezado({ id, titulo, texto }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-8 gap-y-2 border-t-4 border-tinta pt-3">
      <h3 id={id} className="font-display text-4xl font-bold uppercase leading-none">
        {titulo}
      </h3>
      <p className="max-w-md text-sm text-acero">{texto}</p>
    </div>
  );
}

export default function CategoriaClient({ categoria, productos, accesorios }) {
  const zona = { id: categoria.id, nombre: categoria.nombre, slug: categoria.slug };

  return (
    <div className="space-y-14">
      <section aria-labelledby="titulo-prendas">
        <Encabezado
          id="titulo-prendas"
          titulo="Prendas"
          texto="Indica cuántas unidades necesitas en cada talla. Cada cambio queda guardado en tu pedido."
        />

        {productos.length === 0 ? (
          <p className="border-2 border-tinta bg-papel p-8 text-acero">
            Esta zona todavía no tiene prendas publicadas.
          </p>
        ) : (
          <div className="space-y-4">
            {productos.map((producto) => (
              <SizeSelector key={producto.id} producto={producto} categoria={zona} />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="titulo-accesorios">
        <Encabezado
          id="titulo-accesorios"
          titulo={`Accesorios para ${categoria.nombre}`}
          texto="Complementos propios de esta zona. Súmalos en la cantidad que necesites."
        />
        <AccessoriesSelector accesorios={accesorios} categoria={zona} />
      </section>
    </div>
  );
}
