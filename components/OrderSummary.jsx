// components/OrderSummary.jsx
// Resumen/carrito con un ícono de bolsa de compras y mejor jerarquía visual.
'use client';

import { useState } from 'react';
import { ShoppingBag, Phone } from 'lucide-react';

// Lista corta de prefijos telefónicos (agrega los que te hagan falta).
// value = lo que se antepone al número; label = lo que ve el usuario.
const PREFIJOS_PAIS = [
  { value: '+57', label: '🇨🇴 +57 Colombia' },
  { value: '+52', label: '🇲🇽 +52 México' },
  { value: '+51', label: '🇵🇪 +51 Perú' },
  { value: '+56', label: '🇨🇱 +56 Chile' },
  { value: '+54', label: '🇦🇷 +54 Argentina' },
  { value: '+593', label: '🇪🇨 +593 Ecuador' },
  { value: '+58', label: '🇻🇪 +58 Venezuela' },
  { value: '+34', label: '🇪🇸 +34 España' },
  { value: '+1', label: '🇺🇸 +1 Estados Unidos / Canadá' },
];

export default function OrderSummary({ items, categoriaId, onPedidoEnviado }) {
  const [datosCliente, setDatosCliente] = useState({
    nombre: '',
    email: '',
    prefijo: '+57',
    numero: '',
    empresa: '',
    notas: '',
  });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const total = items.reduce((acc, item) => acc + item.cantidad * item.precio_unitario, 0);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (items.length === 0) {
      setError('Selecciona al menos una prenda antes de solicitar la dotación.');
      return;
    }

    // El usuario solo escribe el número local; el prefijo lo elige aparte,
    // así evitamos que alguien escriba el número sin indicativo de país
    // (o que lo repita a mano y se equivoque).
    const soloDigitos = datosCliente.numero.replace(/\D/g, '');
    if (soloDigitos.length < 7) {
      setError('Ingresa un número de teléfono válido, sin el indicativo de país.');
      return;
    }

    const telefono = `${datosCliente.prefijo}${soloDigitos}`;

    setEnviando(true);
    try {
      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datosCliente: {
            nombre: datosCliente.nombre,
            email: datosCliente.email,
            telefono,
            empresa: datosCliente.empresa,
            notas: datosCliente.notas,
            categoriaId,
          },
          items,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar el pedido');

      onPedidoEnviado(data.pedido);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100">
          <ShoppingBag className="h-5 w-5 text-amber-700" />
        </span>
        <h3 className="text-lg font-bold text-slate-900">Resumen de tu dotación</h3>
      </div>

      {items.length === 0 ? (
        <p className="mb-4 rounded-lg bg-slate-50 px-3 py-4 text-center text-sm text-slate-400">
          Aún no has seleccionado nada.
        </p>
      ) : (
        <ul className="mb-4 divide-y divide-slate-100">
          {items.map((item, idx) => (
            <li key={idx} className="flex justify-between py-2.5 text-sm">
              <span className="text-slate-700">
                {item.nombre}
                {item.tallaNombre ? (
                  <span className="text-slate-400"> (Talla {item.tallaNombre})</span>
                ) : (
                  ''
                )}
              </span>
              <span className="font-medium text-slate-900">
                ${(item.cantidad * item.precio_unitario).toLocaleString('es-CO')}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mb-5 flex items-center justify-between border-t border-slate-200 pt-4">
        <span className="font-bold text-slate-900">Total</span>
        <span className="text-xl font-extrabold text-amber-700">
          ${total.toLocaleString('es-CO')}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          id="nombre"
          name="nombre"
          type="text"
          autoComplete="name"
          placeholder="Nombre completo"
          required
          value={datosCliente.nombre}
          onChange={(e) => setDatosCliente({ ...datosCliente, nombre: e.target.value })}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 transition-colors focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Correo electrónico"
          required
          value={datosCliente.email}
          onChange={(e) => setDatosCliente({ ...datosCliente, email: e.target.value })}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 transition-colors focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />

        {/* Prefijo de país + número local, por separado: así nadie puede
            olvidarse del indicativo (el selector siempre trae uno puesto). */}
        <div className="flex gap-2">
          <select
            id="prefijo"
            name="prefijo"
            autoComplete="tel-country-code"
            value={datosCliente.prefijo}
            onChange={(e) => setDatosCliente({ ...datosCliente, prefijo: e.target.value })}
            className="w-[7.5rem] flex-shrink-0 rounded-lg border border-slate-300 px-2 py-2.5 text-sm text-slate-900 transition-colors focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            {PREFIJOS_PAIS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>

          <div className="relative flex-1">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="telefono"
              name="telefono"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="Número de celular"
              required
              value={datosCliente.numero}
              onChange={(e) => setDatosCliente({ ...datosCliente, numero: e.target.value })}
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm text-slate-900 transition-colors focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        <input
          id="empresa"
          name="empresa"
          type="text"
          autoComplete="organization"
          placeholder="Empresa (opcional)"
          value={datosCliente.empresa}
          onChange={(e) => setDatosCliente({ ...datosCliente, empresa: e.target.value })}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 transition-colors focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
        <textarea
          id="notas"
          name="notas"
          placeholder="Notas adicionales"
          value={datosCliente.notas}
          onChange={(e) => setDatosCliente({ ...datosCliente, notas: e.target.value })}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 transition-colors focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          rows={2}
        />

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-lg bg-amber-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-700 disabled:opacity-50"
        >
          {enviando ? 'Enviando...' : 'Solicitar dotación'}
        </button>
      </form>
    </div>
  );
}
