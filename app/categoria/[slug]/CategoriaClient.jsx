// app/categoria/[slug]/CategoriaClient.jsx
// Componente de cliente: aquí vive el estado interactivo (qué talla y qué
// accesorios eligió el usuario). Se separa del Server Component de arriba
// porque los hooks de React (useState) solo funcionan en el cliente.
'use client';

import { useMemo, useState } from 'react';
import SizeSelector from '@/components/SizeSelector';
import AccessoriesSelector from '@/components/AccessoriesSelector';
import OrderSummary from '@/components/OrderSummary';

function PasoNumero({ numero }) {
  return (
    <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white">
      {numero}
    </span>
  );
}

export default function CategoriaClient({ categoria, productos, accesorios }) {
  // prendasSeleccionadas: { [producto_id]: { tallaId, tallaNombre, precio, tipo_prenda } }
  const [prendasSeleccionadas, setPrendasSeleccionadas] = useState({});
  // accesoriosSeleccionados: { [accesorio_id]: true }
  const [accesoriosSeleccionados, setAccesoriosSeleccionados] = useState({});
  const [pedidoConfirmado, setPedidoConfirmado] = useState(null);

  function seleccionarTalla(productoId, tallaId, precio, tipoPrenda) {
    setPrendasSeleccionadas((prev) => ({
      ...prev,
      [productoId]: { tallaId, precio, tipoPrenda },
    }));
  }

  function alternarAccesorio(accesorio) {
    setAccesoriosSeleccionados((prev) => {
      const copia = { ...prev };
      if (copia[accesorio.id]) {
        delete copia[accesorio.id];
      } else {
        copia[accesorio.id] = true;
      }
      return copia;
    });
  }

  // Construye la lista de items en el formato que espera el backend (/api/pedidos)
  const items = useMemo(() => {
    const itemsPrendas = Object.entries(prendasSeleccionadas).map(([productoId, sel]) => {
      const producto = productos.find((p) => p.id === productoId);
      const talla = producto.producto_tallas.find((pt) => pt.tallas.id === sel.tallaId);
      return {
        item_tipo: 'producto',
        producto_id: productoId,
        talla_id: sel.tallaId,
        cantidad: 1,
        precio_unitario: sel.precio,
        nombre: producto.nombre,
        tallaNombre: talla?.tallas.nombre,
      };
    });

    const itemsAccesorios = Object.keys(accesoriosSeleccionados).map((accesorioId) => {
      const accesorio = accesorios.find((a) => a.id === accesorioId);
      return {
        item_tipo: 'accesorio',
        accesorio_id: accesorioId,
        talla_id: null,
        cantidad: 1,
        precio_unitario: accesorio.precio,
        nombre: accesorio.nombre,
      };
    });

    return [...itemsPrendas, ...itemsAccesorios];
  }, [prendasSeleccionadas, accesoriosSeleccionados, productos, accesorios]);

  if (pedidoConfirmado) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <h3 className="mb-2 text-xl font-bold text-green-700">¡Solicitud enviada!</h3>
        <p className="text-green-700">
          Tu pedido #{pedidoConfirmado.id.slice(0, 8)} fue registrado. Te contactaremos pronto.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <section>
          <h3 className="mb-3 flex items-center text-lg font-semibold text-slate-900">
            <PasoNumero numero={1} /> Elige tu camisa/filipina y pantalón
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {productos.map((producto) => (
              <SizeSelector
                key={producto.id}
                producto={producto}
                tallaSeleccionadaId={prendasSeleccionadas[producto.id]?.tallaId}
                onSeleccionar={seleccionarTalla}
              />
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-3 flex items-center text-lg font-semibold text-slate-900">
            <PasoNumero numero={2} /> Extras para {categoria.nombre}
          </h3>
          <AccessoriesSelector
            accesorios={accesorios}
            seleccionados={accesoriosSeleccionados}
            onToggle={alternarAccesorio}
          />
        </section>
      </div>

      <div className="lg:col-span-1">
        <OrderSummary items={items} categoriaId={categoria.id} onPedidoEnviado={setPedidoConfirmado} />
      </div>
    </div>
  );
}
