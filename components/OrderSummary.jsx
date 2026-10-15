// components/OrderSummary.jsx
// Paso final del pedido: datos de contacto + envío.
// Recibe las zonas del carrito y registra UN pedido por zona (la tabla
// `pedidos` guarda una sola categoría por pedido), llamando a /api/pedidos.
// Cada zona se envía por separado: si una falla (por ejemplo, stock
// insuficiente), las que sí se registraron salen del carrito y las que
// fallaron se quedan para corregirlas y reintentar, sin duplicar nada.
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { MAX_LINEAS_POR_ZONA, quitarZona } from '@/lib/carrito';
import { formatoPrecio } from '@/lib/formato';

// Lista corta de prefijos telefónicos (agrega los que te hagan falta).
const PREFIJOS_PAIS = [
  { value: '+57', label: '+57 Colombia' },
  { value: '+52', label: '+52 México' },
  { value: '+51', label: '+51 Perú' },
  { value: '+56', label: '+56 Chile' },
  { value: '+54', label: '+54 Argentina' },
  { value: '+593', label: '+593 Ecuador' },
  { value: '+58', label: '+58 Venezuela' },
  { value: '+34', label: '+34 España' },
  { value: '+1', label: '+1 EE. UU. / Canadá' },
];

const baseInput =
  'border-2 border-tinta bg-white px-3 py-2.5 text-base text-tinta placeholder:text-acero/70';
const claseInput = `w-full ${baseInput}`;

function Campo({ id, etiqueta, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold">
        {etiqueta}
      </label>
      {children}
    </div>
  );
}

// Formato que espera el backend (/api/pedidos). Los precios que se envían son
// solo informativos: el servidor los recalcula desde la base de datos.
function aItemPedido(l) {
  return {
    item_tipo: l.tipo,
    producto_id: l.tipo === 'producto' ? l.id : null,
    accesorio_id: l.tipo === 'accesorio' ? l.id : null,
    talla_id: l.tallaId ?? null,
    cantidad: l.cantidad,
    precio_unitario: l.precio,
  };
}

export default function OrderSummary({
  datos,
  setDatos,
  zonas,
  unidades,
  total,
  creados,
  onRegistrados,
  onVolver,
}) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState([]);
  const bloqueError = useRef(null);

  // Si algo falla, el aviso queda arriba: se lleva a la vista para que no pase desapercibido
  useEffect(() => {
    if (errores.length > 0) bloqueError.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [errores]);

  const cambiar = (campo) => (e) => setDatos((prev) => ({ ...prev, [campo]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setErrores([]);

    if (zonas.length === 0) {
      setErrores(['Agrega al menos una prenda o accesorio antes de enviar el pedido.']);
      return;
    }

    // El usuario escribe solo el número local; el prefijo se elige aparte,
    // así nadie olvida (ni repite) el indicativo del país.
    const soloDigitos = datos.numero.replace(/\D/g, '');
    if (soloDigitos.length < 7) {
      setErrores(['Ingresa un número de teléfono válido, sin el indicativo de país.']);
      return;
    }
    const telefono = `${datos.prefijo}${soloDigitos}`;

    const zonaGrande = zonas.find((z) => z.lineas.length > MAX_LINEAS_POR_ZONA);
    if (zonaGrande) {
      setErrores([
        `La zona ${zonaGrande.categoriaNombre} tiene más de ${MAX_LINEAS_POR_ZONA} líneas. Divide el pedido en dos.`,
      ]);
      return;
    }

    setEnviando(true);
    const registrados = [];
    const fallos = [];

    // Un pedido por zona, uno detrás de otro
    for (const zona of zonas) {
      try {
        const res = await fetch('/api/pedidos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            datosCliente: {
              nombre: datos.nombre,
              email: datos.email,
              telefono,
              empresa: datos.empresa,
              notas: datos.notas,
              categoriaId: zona.categoriaId,
            },
            items: zona.lineas.map(aItemPedido),
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'No se pudo crear el pedido.');

        registrados.push({
          id: data.pedido.id,
          total: data.pedido.total ?? zona.subtotal,
          zonaNombre: zona.categoriaNombre,
        });
        quitarZona(zona.categoriaId); // ya quedó registrada: sale del carrito
      } catch (err) {
        fallos.push(`${zona.categoriaNombre}: ${err.message}`);
      }
    }

    setEnviando(false);

    if (registrados.length > 0) {
      onRegistrados(registrados);
      router.refresh(); // el stock cambió: se recarga el catálogo
    }
    if (fallos.length > 0) {
      setErrores(fallos);
    }
    // Si todo salió bien, el carrito queda vacío y el panel pasa solo a "Pedido enviado".
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-full flex-col">
      <div className="flex-1 space-y-5 p-5">
        <button
          type="button"
          onClick={onVolver}
          className="inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
          Volver al pedido
        </button>

        {errores.length > 0 && (
          <div ref={bloqueError} role="alert" className="border-2 border-alerta bg-white p-4 text-sm">
            <p className="mb-1 font-semibold text-alerta">
              {errores.length === 1 ? 'No se pudo enviar el pedido' : 'No se pudieron enviar algunos pedidos'}
            </p>
            <ul className="space-y-1">
              {errores.map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
            {zonas.length > 0 && (
              <p className="mt-2 text-acero">
                Corrige las cantidades en tu pedido y vuelve a enviar. Lo que ya se registró no se repite.
              </p>
            )}
          </div>
        )}

        {creados.length > 0 && (
          <div className="border-2 border-tinta bg-seguridad/30 p-4 text-sm">
            <p className="mb-2 font-semibold">Ya registrados:</p>
            <ul className="space-y-1">
              {creados.map((c) => (
                <li key={c.id}>
                  {c.zonaNombre}, pedido #{String(c.id).slice(0, 8)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Resumen por zona de lo que se va a enviar */}
        <ul className="divide-y divide-dashed divide-tinta/30 border-2 border-tinta bg-white">
          {zonas.map((z) => (
            <li key={z.categoriaId} className="flex items-center justify-between gap-3 px-4 py-3">
              <span>
                <span className="block font-display text-xl font-bold uppercase leading-tight">
                  {z.categoriaNombre}
                </span>
                <span className="text-sm text-acero">
                  {z.unidades} {z.unidades === 1 ? 'unidad' : 'unidades'} en {z.lineas.length}{' '}
                  {z.lineas.length === 1 ? 'línea' : 'líneas'}
                </span>
              </span>
              <span className="font-display text-xl font-semibold tabular-nums">
                {formatoPrecio(z.subtotal)}
              </span>
            </li>
          ))}
        </ul>

        {zonas.length > 1 && (
          <p className="text-sm text-acero">
            Se registrará un pedido por cada zona ({zonas.length} en total) con los mismos datos de contacto.
          </p>
        )}

        <Campo id="nombre" etiqueta="Nombre completo">
          <input
            id="nombre"
            name="nombre"
            type="text"
            autoComplete="name"
            required
            value={datos.nombre}
            onChange={cambiar('nombre')}
            className={claseInput}
          />
        </Campo>

        <Campo id="email" etiqueta="Correo electrónico">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={datos.email}
            onChange={cambiar('email')}
            className={claseInput}
          />
        </Campo>

        <Campo id="telefono" etiqueta="Celular de contacto">
          <div className="flex gap-2">
            <select
              id="prefijo"
              name="prefijo"
              aria-label="Indicativo del país"
              autoComplete="tel-country-code"
              value={datos.prefijo}
              onChange={cambiar('prefijo')}
              className={`${baseInput} w-40 shrink-0`}
            >
              {PREFIJOS_PAIS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <input
              id="telefono"
              name="telefono"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              required
              value={datos.numero}
              onChange={cambiar('numero')}
              className={`${baseInput} min-w-0 flex-1`}
            />
          </div>
        </Campo>

        <Campo id="empresa" etiqueta="Empresa (opcional)">
          <input
            id="empresa"
            name="empresa"
            type="text"
            autoComplete="organization"
            value={datos.empresa}
            onChange={cambiar('empresa')}
            className={claseInput}
          />
        </Campo>

        <Campo id="notas" etiqueta="Notas adicionales (opcional)">
          <textarea
            id="notas"
            name="notas"
            rows={3}
            value={datos.notas}
            onChange={cambiar('notas')}
            className={claseInput}
          />
        </Campo>

      </div>

      <div className="sticky bottom-0 border-t-2 border-tinta bg-papel p-5">
        <div className="mb-3 flex items-end justify-between gap-3">
          <span className="font-display text-xl font-semibold uppercase">
            Total, {unidades} {unidades === 1 ? 'unidad' : 'unidades'}
          </span>
          <span className="font-display text-4xl font-bold leading-none tabular-nums">
            {formatoPrecio(total)}
          </span>
        </div>
        <button
          type="submit"
          disabled={enviando || zonas.length === 0}
          className="w-full border-2 border-tinta bg-seguridad px-6 py-3 font-display text-2xl font-semibold uppercase tracking-wide transition-colors hover:bg-tinta hover:text-seguridad disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-seguridad disabled:hover:text-tinta"
        >
          {enviando ? 'Enviando pedido…' : 'Enviar pedido'}
        </button>
      </div>
    </form>
  );
}
