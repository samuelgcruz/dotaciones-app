// components/OrderSummary.jsx
// Resumen/carrito con un ícono de bolsa de compras y mejor jerarquía visual.
'use client';

import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';

export default function OrderSummary({ items, categoriaId, onPedidoEnviado }) {
  const [datosCliente, setDatosCliente] = useState({
    nombre: '',
    email: '',
    telefono: '',
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

    setEnviando(true);
    try {
      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datosCliente: { ...datosCliente, categoriaId },
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
    <div className="sticky top-24 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <ShoppingBag className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Resumen de tu dotación</h3>
      </div>

      {items.length === 0 ? (
        <p className="mb-4 text-sm text-gray-400">Aún no has seleccionado nada.</p>
      ) : (
        <ul className="mb-4 divide-y divide-gray-100">
          {items.map((item, idx) => (
            <li key={idx} className="flex justify-between py-2 text-sm">
              <span>
                {item.nombre}
                {item.tallaNombre ? ` (Talla ${item.tallaNombre})` : ''}
              </span>
              <span className="font-medium">
                ${(item.cantidad * item.precio_unitario).toLocaleString('es-CO')}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mb-4 flex justify-between border-t border-gray-200 pt-3 font-bold">
        <span>Total</span>
        <span className="text-blue-600">${total.toLocaleString('es-CO')}</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Nombre completo"
          required
          value={datosCliente.nombre}
          onChange={(e) => setDatosCliente({ ...datosCliente, nombre: e.target.value })}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none"
        />
        <input
          type="email"
          placeholder="Correo electrónico"
          required
          value={datosCliente.email}
          onChange={(e) => setDatosCliente({ ...datosCliente, email: e.target.value })}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none"
        />
        <input
          type="text"
          placeholder="Empresa (opcional)"
          value={datosCliente.empresa}
          onChange={(e) => setDatosCliente({ ...datosCliente, empresa: e.target.value })}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none"
        />
        <textarea
          placeholder="Notas adicionales"
          value={datosCliente.notas}
          onChange={(e) => setDatosCliente({ ...datosCliente, notas: e.target.value })}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none"
          rows={2}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-md bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {enviando ? 'Enviando...' : 'Solicitar dotación'}
        </button>
      </form>
    </div>
  );
}
