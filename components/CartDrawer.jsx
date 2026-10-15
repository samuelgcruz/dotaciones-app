// components/CartDrawer.jsx
// Panel lateral del pedido. Tiene tres estados:
//   1. carrito → revisar líneas, cambiar cantidades, quitar
//   2. datos   → formulario de contacto y envío (ver OrderSummary)
//   3. listo   → pedidos registrados (se muestra solo cuando ya se enviaron)
'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Check, Trash2, X } from 'lucide-react';
import { useCarrito } from '@/lib/carrito';
import { formatoPrecio } from '@/lib/formato';
import CantidadStepper from './CantidadStepper';
import OrderSummary from './OrderSummary';

const DATOS_INICIALES = {
  nombre: '',
  email: '',
  prefijo: '+57',
  numero: '',
  empresa: '',
  notas: '',
};

function PedidosRegistrados({ creados }) {
  return (
    <ul className="divide-y divide-dashed divide-tinta/30 border-2 border-tinta bg-white">
      {creados.map((c) => (
        <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <span>
            <span className="block font-display text-xl font-bold uppercase leading-tight">
              {c.zonaNombre}
            </span>
            <span className="text-sm text-acero">Pedido #{String(c.id).slice(0, 8)}</span>
          </span>
          <span className="font-display text-xl font-semibold tabular-nums">{formatoPrecio(c.total)}</span>
        </li>
      ))}
    </ul>
  );
}

export default function CartDrawer() {
  const { abierto, zonas, unidades, total, ajustarLinea, quitarLinea, vaciarCarrito, cerrarCarrito } =
    useCarrito();

  const [paso, setPaso] = useState('carrito'); // 'carrito' | 'datos'
  const [datos, setDatos] = useState(DATOS_INICIALES);
  const [creados, setCreados] = useState([]); // pedidos ya registrados en esta sesión del panel
  const [confirmarVaciar, setConfirmarVaciar] = useState(false);
  const botonCerrar = useRef(null);

  // Carrito vacío + pedidos registrados = pantalla final. Si no, depende del paso elegido.
  const vista = unidades === 0 ? (creados.length > 0 ? 'listo' : 'carrito') : paso;

  // Al cerrar (X, fondo, Escape o enlaces), se limpia el estado de "listo"
  function cerrar() {
    cerrarCarrito();
    setPaso('carrito');
    setConfirmarVaciar(false);
    if (unidades === 0) setCreados([]);
  }

  // Escape cierra el panel
  useEffect(() => {
    if (!abierto) return undefined;
    function alTeclear(e) {
      if (e.key !== 'Escape') return;
      cerrarCarrito();
      setPaso('carrito');
      setConfirmarVaciar(false);
      if (unidades === 0) setCreados([]);
    }
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [abierto, unidades, cerrarCarrito]);

  // Bloquea el scroll de la página mientras el panel está abierto y lleva el foco al botón de cerrar
  useEffect(() => {
    if (!abierto) return undefined;
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    botonCerrar.current?.focus();
    return () => {
      document.body.style.overflow = previo;
    };
  }, [abierto]);

  const titulo = vista === 'listo' ? 'Pedido enviado' : vista === 'datos' ? 'Datos de contacto' : 'Tu pedido';

  return (
    <>
      <div
        aria-hidden="true"
        onClick={cerrar}
        className={`fixed inset-0 z-40 bg-tinta/60 transition-opacity duration-300 ${
          abierto ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l-2 border-tinta bg-papel transition-[transform,visibility] duration-300 ease-out ${
          abierto ? 'visible translate-x-0' : 'invisible translate-x-full'
        }`}
      >
        <header className="zona-oscura bg-grafito text-papel">
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <div>
              <h2 className="font-display text-3xl font-bold uppercase leading-none">{titulo}</h2>
              {vista === 'carrito' && unidades > 0 && (
                <p className="mt-1 text-sm text-concreto-oscuro">
                  {unidades} {unidades === 1 ? 'unidad' : 'unidades'}
                  {zonas.length > 1 ? ` en ${zonas.length} zonas` : ''}
                </p>
              )}
            </div>
            <button
              ref={botonCerrar}
              type="button"
              onClick={cerrar}
              aria-label="Cerrar pedido"
              className="grid h-10 w-10 place-items-center border-2 border-papel/30 transition-colors hover:border-seguridad hover:text-seguridad"
            >
              <X className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>
          <div className="franja-peligro h-1.5" />
        </header>

        {/* ---------- Vista: carrito ---------- */}
        {vista === 'carrito' && (
          <>
            <div className="flex-1 overflow-y-auto">
              {creados.length > 0 && unidades > 0 && (
                <div className="border-b-2 border-tinta p-5">
                  <p className="mb-3 text-sm font-semibold">
                    Ya se registró parte de tu pedido. Esto es lo que falta enviar:
                  </p>
                  <PedidosRegistrados creados={creados} />
                </div>
              )}

              {unidades === 0 ? (
                <div className="p-8">
                  <p className="font-display text-3xl font-bold uppercase leading-none">
                    Tu pedido está vacío
                  </p>
                  <p className="mt-3 max-w-sm text-acero">
                    Entra a una zona de trabajo, indica las unidades por talla y aparecerán aquí.
                  </p>
                  <Link
                    href="/"
                    onClick={cerrar}
                    className="mt-6 inline-block bg-tinta px-6 py-3 font-display text-xl font-semibold uppercase tracking-wide text-papel transition-colors hover:bg-grafito"
                  >
                    Ver zonas
                  </Link>
                </div>
              ) : (
                <>
                  {zonas.length > 1 && (
                    <p className="border-b-2 border-tinta bg-seguridad/30 px-5 py-3 text-sm">
                      Tu pedido combina {zonas.length} zonas. Se registrará un pedido por cada zona.
                    </p>
                  )}

                  {zonas.map((zona) => (
                    <section key={zona.categoriaId} className="border-b-2 border-tinta">
                      <div className="flex items-center justify-between gap-3 bg-concreto px-5 py-2">
                        <Link
                          href={`/categoria/${zona.categoriaSlug}`}
                          onClick={cerrar}
                          className="font-display text-xl font-bold uppercase underline-offset-4 hover:underline"
                        >
                          {zona.categoriaNombre}
                        </Link>
                        <span className="font-display text-xl font-semibold tabular-nums">
                          {formatoPrecio(zona.subtotal)}
                        </span>
                      </div>

                      <ul className="divide-y divide-dashed divide-tinta/30">
                        {zona.lineas.map((l) => {
                          const etiqueta = l.tallaNombre ? `${l.nombre}, talla ${l.tallaNombre}` : l.nombre;
                          return (
                            <li key={l.key} className="flex gap-3 px-5 py-4">
                              <div className="relative h-16 w-16 shrink-0 border-2 border-tinta bg-concreto-oscuro">
                                {l.imagen_url && (
                                  <Image src={l.imagen_url} alt="" fill sizes="64px" className="object-cover" />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="font-display text-xl font-bold uppercase leading-tight">
                                  {l.nombre}
                                </p>
                                <p className="text-sm text-acero">
                                  {l.tallaNombre ? `Talla ${l.tallaNombre}` : 'Accesorio'},{' '}
                                  {formatoPrecio(l.precio)} c/u
                                </p>

                                <div className="mt-2 flex items-center justify-between gap-3">
                                  <div className="w-36">
                                    <CantidadStepper
                                      compacto
                                      cantidad={l.cantidad}
                                      etiqueta={etiqueta}
                                      puedeSumar={l.cantidad < Math.min(l.stock ?? 99, 99)}
                                      onMenos={() => ajustarLinea(l, -1)}
                                      onMas={() => ajustarLinea(l, 1)}
                                    />
                                  </div>
                                  <span className="font-display text-xl font-semibold tabular-nums">
                                    {formatoPrecio(l.cantidad * l.precio)}
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => quitarLinea(l.key)}
                                aria-label={`Quitar ${etiqueta} del pedido`}
                                className="grid h-9 w-9 shrink-0 place-items-center text-acero transition-colors hover:bg-tinta hover:text-papel"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  ))}
                </>
              )}
            </div>

            {unidades > 0 && (
              <footer className="border-t-2 border-tinta bg-papel p-5">
                <div className="mb-1 flex items-end justify-between">
                  <span className="font-display text-xl font-semibold uppercase">Total</span>
                  <span className="font-display text-4xl font-bold leading-none tabular-nums">
                    {formatoPrecio(total)}
                  </span>
                </div>
                <p className="mb-4 text-sm text-acero">
                  El valor final se confirma con los precios vigentes al enviar el pedido.
                </p>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirmarVaciar) {
                        vaciarCarrito();
                        setConfirmarVaciar(false);
                      } else {
                        setConfirmarVaciar(true);
                      }
                    }}
                    onBlur={() => setConfirmarVaciar(false)}
                    className={`border-2 border-tinta px-4 py-3 font-display text-lg font-semibold uppercase tracking-wide transition-colors ${
                      confirmarVaciar ? 'bg-alerta text-white' : 'hover:bg-tinta hover:text-papel'
                    }`}
                  >
                    {confirmarVaciar ? 'Confirmar' : 'Vaciar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaso('datos')}
                    className="flex-1 border-2 border-tinta bg-seguridad px-6 py-3 font-display text-xl font-semibold uppercase tracking-wide transition-colors hover:bg-tinta hover:text-seguridad"
                  >
                    Continuar con mis datos
                  </button>
                </div>
              </footer>
            )}
          </>
        )}

        {/* ---------- Vista: datos de contacto ---------- */}
        {vista === 'datos' && (
          <div className="flex-1 overflow-y-auto">
            <OrderSummary
              datos={datos}
              setDatos={setDatos}
              zonas={zonas}
              unidades={unidades}
              total={total}
              creados={creados}
              onRegistrados={(nuevos) => setCreados((prev) => [...prev, ...nuevos])}
              onVolver={() => setPaso('carrito')}
            />
          </div>
        )}

        {/* ---------- Vista: pedido enviado ---------- */}
        {vista === 'listo' && (
          <div className="flex-1 overflow-y-auto p-5">
            <div className="mb-6 flex items-start gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center bg-seguridad text-tinta">
                <Check className="h-8 w-8" strokeWidth={3} />
              </span>
              <div>
                <p className="font-display text-3xl font-bold uppercase leading-none">
                  {creados.length === 1 ? 'Solicitud registrada' : 'Solicitudes registradas'}
                </p>
                <p className="mt-2 text-acero">
                  Te contactaremos al correo y al teléfono que dejaste para confirmar tu pedido.
                </p>
              </div>
            </div>

            <PedidosRegistrados creados={creados} />

            <Link
              href="/"
              onClick={cerrar}
              className="mt-6 inline-block bg-tinta px-6 py-3 font-display text-xl font-semibold uppercase tracking-wide text-papel transition-colors hover:bg-grafito"
            >
              Volver al catálogo
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
