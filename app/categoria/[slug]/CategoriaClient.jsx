// app/categoria/[slug]/CategoriaClient.jsx
// Cuerpo de la zona. Las prendas se agrupan por tipo (camisas, pantalones...) y
// la barra fija permite saltar a cada grupo o a los accesorios. Todo lo que se
// elige va al carrito global (lib/carrito.js).
'use client';

import SizeSelector from '@/components/SizeSelector';
import AccessoriesSelector from '@/components/AccessoriesSelector';
import { etiquetaTipo } from '@/lib/formato';

function Encabezado({ id, titulo, cantidad, texto }) {
  return (
    <div className="mb-6">
      <div className="flex items-end gap-4">
        <h3 id={id} className="font-display text-4xl font-bold uppercase leading-none">
          {titulo}
        </h3>
        <span className="mb-0.5 border-2 border-tinta bg-seguridad px-2 font-display text-xl font-bold leading-7 tabular-nums">
          {cantidad}
        </span>
        <span aria-hidden="true" className="mb-2 h-0.5 flex-1 bg-tinta" />
      </div>
      {texto && <p className="mt-2 max-w-xl text-sm text-acero">{texto}</p>}
    </div>
  );
}

export default function CategoriaClient({ categoria, productos, accesorios }) {
  const zona = { id: categoria.id, nombre: categoria.nombre, slug: categoria.slug };

  // Grupos de prendas por tipo, en el orden en que aparecen
  const grupos = [];
  for (const p of productos) {
    const etiqueta = etiquetaTipo(p.tipo_prenda);
    let grupo = grupos.find((g) => g.etiqueta === etiqueta);
    if (!grupo) {
      grupo = { etiqueta, productos: [] };
      grupos.push(grupo);
    }
    grupo.productos.push(p);
  }

  const enlace = 'shrink-0 font-display text-xl font-bold uppercase leading-none underline-offset-4 hover:underline';

  return (
    <div>
      <div className="sticky top-[4.5rem] z-20 -mx-4 mb-10 border-y-2 border-tinta bg-papel px-4 sm:-mx-8 sm:px-8">
        <nav aria-label="Secciones de la zona" className="flex gap-5 overflow-x-auto py-3">
          {grupos.map((g, i) => (
            <a key={g.etiqueta} href={`#grupo-${i}`} className={enlace}>
              {g.etiqueta} ({g.productos.length})
            </a>
          ))}
          <a href="#accesorios" className={enlace}>
            Accesorios ({accesorios.length})
          </a>
        </nav>
      </div>

      <div className="space-y-16">
        {productos.length === 0 && (
          <p className="border-2 border-tinta bg-papel p-8 text-acero">
            Esta zona todavía no tiene prendas publicadas.
          </p>
        )}

        {grupos.map((g, i) => (
          <section key={g.etiqueta} id={`grupo-${i}`} aria-labelledby={`titulo-grupo-${i}`} className="scroll-mt-32">
            <Encabezado
              id={`titulo-grupo-${i}`}
              titulo={g.etiqueta}
              cantidad={g.productos.length}
              texto={i === 0 ? 'Elige la talla de cada prenda e indica cuántas unidades necesitas. Puedes pedir la misma prenda en varias tallas.' : undefined}
            />
            <div className="grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {g.productos.map((producto) => (
                <SizeSelector key={producto.id} producto={producto} categoria={zona} />
              ))}
            </div>
          </section>
        ))}

        <section id="accesorios" aria-labelledby="titulo-accesorios" className="scroll-mt-32">
          <Encabezado
            id="titulo-accesorios"
            titulo="Accesorios"
            cantidad={accesorios.length}
            texto={`Complementos propios de ${categoria.nombre}. Búscalos por nombre, ordénalos por precio y agrégalos en la cantidad que necesites.`}
          />
          <AccessoriesSelector accesorios={accesorios} categoria={zona} />
        </section>
      </div>
    </div>
  );
}
