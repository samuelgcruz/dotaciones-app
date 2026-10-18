// components/SolicitudBloques.jsx
// Editores de cada tipo de necesidad de la solicitud especial:
//   catalogo → más unidades de un artículo real del catálogo (con cantidad por talla)
//   equipo   → equipos completos de una zona (N personas × los artículos que elijas)
//   medida   → algo que no está en el catálogo (texto libre)
// Los datos del catálogo llegan por props: aquí no se consulta nada.
'use client';

import { Trash2 } from 'lucide-react';
import { buscarArticulo, incluyeInicial, TIPOS_BLOQUE } from '@/lib/solicitud';
import { formatoNumero, formatoPrecio } from '@/lib/formato';

export const baseInput =
  'border-2 border-tinta bg-white px-3 py-2.5 text-base text-tinta placeholder:text-acero/70';
export const claseInput = `w-full ${baseInput}`;

export function Campo({ id, etiqueta, ayuda, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold">
        {etiqueta}
      </label>
      {children}
      {ayuda && <p className="mt-1 text-xs text-acero">{ayuda}</p>}
      {error && <p className="mt-1 text-sm font-semibold text-alerta">{error}</p>}
    </div>
  );
}

const soloDigitos = (texto, largo = 6) => texto.replace(/\D/g, '').slice(0, largo);

// ---------------------------------------------------------------- catálogo
function BloqueCatalogo({ bloque, zonas, zonaPorId, onCambiar }) {
  const zona = zonaPorId.get(bloque.zonaId);
  const art = buscarArticulo(zona, bloque.articuloKey);
  const id = bloque.id;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo id={`zona-${id}`} etiqueta="Zona de trabajo">
          <select
            id={`zona-${id}`}
            value={bloque.zonaId}
            onChange={(e) => onCambiar({ zonaId: e.target.value, articuloKey: '', tallas: {}, cantidad: '' })}
            className={claseInput}
          >
            <option value="">Elige una zona</option>
            {zonas.map((z) => (
              <option key={z.id} value={z.id}>
                {z.nombre}
              </option>
            ))}
          </select>
        </Campo>

        <Campo id={`articulo-${id}`} etiqueta="Artículo">
          <select
            id={`articulo-${id}`}
            disabled={!zona}
            value={bloque.articuloKey}
            onChange={(e) => onCambiar({ articuloKey: e.target.value, tallas: {}, cantidad: '' })}
            className={`${claseInput} disabled:bg-concreto/60 disabled:text-acero`}
          >
            <option value="">{zona ? 'Elige una prenda o accesorio' : 'Primero elige la zona'}</option>
            {zona && zona.prendas.length > 0 && (
              <optgroup label="Prendas">
                {zona.prendas.map((p) => (
                  <option key={p.id} value={`p:${p.id}`}>
                    {p.nombre}
                  </option>
                ))}
              </optgroup>
            )}
            {zona && zona.accesorios.length > 0 && (
              <optgroup label="Accesorios">
                {zona.accesorios.map((a) => (
                  <option key={a.id} value={`a:${a.id}`}>
                    {a.nombre}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </Campo>
      </div>

      {art && (
        <div className="border-2 border-tinta/30 bg-papel p-3 text-sm">
          <p>
            <strong className="font-semibold">{art.nombre}</strong>, precio de catálogo{' '}
            {formatoPrecio(art.precio)} por unidad.
          </p>
          {art.descripcion && <p className="mt-0.5 text-acero">{art.descripcion}</p>}
        </div>
      )}

      {art?.esPrenda && (
        <div>
          <p className="mb-2 text-sm font-semibold">
            Cantidad por talla <span className="font-normal text-acero">(deja en blanco las que no necesites)</span>
          </p>
          {art.tallas.length === 0 ? (
            <p className="text-sm text-acero">Esta prenda no tiene tallas cargadas.</p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-2">
              {art.tallas.map((t) => {
                const valor = bloque.tallas[t.id] ?? '';
                const excede = (Number(valor) || 0) > t.stock;
                return (
                  <div key={t.id} className="border-2 border-tinta bg-white">
                    <div className="flex items-baseline justify-between gap-1 px-2 pt-1.5">
                      <label htmlFor={`talla-${id}-${t.id}`} className="font-display text-2xl font-bold leading-none">
                        {t.nombre}
                      </label>
                      <span className="text-xs text-acero">{t.stock > 0 ? `Hay ${t.stock}` : 'Agotada'}</span>
                    </div>
                    <input
                      id={`talla-${id}-${t.id}`}
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="0"
                      value={valor}
                      onChange={(e) =>
                        onCambiar({ tallas: { ...bloque.tallas, [t.id]: soloDigitos(e.target.value) } })
                      }
                      className="mt-1 w-full border-t-2 border-tinta bg-transparent px-2 py-1.5 font-display text-2xl font-bold tabular-nums"
                    />
                    {excede && <p className="px-2 py-1 text-xs font-semibold text-alerta">Supera el stock actual</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {art && !art.esPrenda && (
        <Campo id={`cantidad-${id}`} etiqueta="Cantidad">
          <input
            id={`cantidad-${id}`}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="0"
            value={bloque.cantidad}
            onChange={(e) => onCambiar({ cantidad: soloDigitos(e.target.value) })}
            className="w-40 border-2 border-tinta bg-white px-3 py-2 font-display text-3xl font-bold leading-none tabular-nums"
          />
        </Campo>
      )}

      {art && (
        <Campo id={`detalle-${id}`} etiqueta="Colores, logo u otros detalles (opcional)">
          <input
            id={`detalle-${id}`}
            type="text"
            maxLength={200}
            value={bloque.detalle}
            onChange={(e) => onCambiar({ detalle: e.target.value })}
            className={claseInput}
          />
        </Campo>
      )}
    </>
  );
}

// ----------------------------------------------------------- equipo completo
function BloqueEquipo({ bloque, zonas, zonaPorId, onCambiar }) {
  const zona = zonaPorId.get(bloque.zonaId);
  const id = bloque.id;
  const equipos = Number(bloque.equipos) || 0;

  const filas = zona
    ? [
        ...zona.prendas.map((p) => ({ key: `p:${p.id}`, nombre: p.nombre, tipo: 'Prenda' })),
        ...zona.accesorios.map((a) => ({ key: `a:${a.id}`, nombre: a.nombre, tipo: 'Accesorio' })),
      ]
    : [];

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo id={`zona-${id}`} etiqueta="Zona de trabajo">
          <select
            id={`zona-${id}`}
            value={bloque.zonaId}
            onChange={(e) => {
              const nueva = zonaPorId.get(e.target.value);
              onCambiar({ zonaId: e.target.value, incluye: nueva ? incluyeInicial(nueva) : {} });
            }}
            className={claseInput}
          >
            <option value="">Elige una zona</option>
            {zonas.map((z) => (
              <option key={z.id} value={z.id}>
                {z.nombre}
              </option>
            ))}
          </select>
        </Campo>

        <Campo
          id={`equipos-${id}`}
          etiqueta="¿Cuántos equipos necesitas?"
          ayuda="Un equipo es la dotación completa de una persona."
        >
          <input
            id={`equipos-${id}`}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="0"
            value={bloque.equipos}
            onChange={(e) => onCambiar({ equipos: soloDigitos(e.target.value) })}
            className="w-full border-2 border-tinta bg-white px-3 py-2 font-display text-3xl font-bold leading-none tabular-nums"
          />
        </Campo>
      </div>

      {zona && (
        <div>
          <p className="mb-2 text-sm font-semibold">¿Qué incluye cada equipo?</p>
          {filas.length === 0 ? (
            <p className="text-sm text-acero">Esta zona no tiene artículos publicados.</p>
          ) : (
            <ul className="divide-y divide-tinta/20 border-2 border-tinta bg-white">
              {filas.map((f) => {
                const por = Number(bloque.incluye[f.key]) || 0;
                const marcado = por > 0;
                return (
                  <li key={f.key} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-3 py-2.5">
                    <label className="flex min-w-0 items-center gap-3">
                      <input
                        type="checkbox"
                        checked={marcado}
                        onChange={(e) => onCambiar({ incluye: { ...bloque.incluye, [f.key]: e.target.checked ? 1 : 0 } })}
                        className="h-5 w-5 shrink-0 accent-tinta"
                      />
                      <span className="min-w-0">
                        <span className="block font-semibold">{f.nombre}</span>
                        <span className="text-xs text-acero">{f.tipo}</span>
                      </span>
                    </label>

                    {marcado && (
                      <span className="flex items-center gap-3 text-sm">
                        <label className="flex items-center gap-2">
                          Por equipo
                          <input
                            type="number"
                            min={1}
                            max={20}
                            value={por}
                            onChange={(e) => {
                              const n = Math.max(1, Math.min(20, parseInt(e.target.value, 10) || 1));
                              onCambiar({ incluye: { ...bloque.incluye, [f.key]: n } });
                            }}
                            className="w-16 border-2 border-tinta bg-white px-2 py-1 text-center font-display text-xl font-bold tabular-nums"
                          />
                        </label>
                        {equipos > 0 && (
                          <span className="min-w-24 text-right font-semibold tabular-nums">
                            {formatoNumero(equipos * por)} uds
                          </span>
                        )}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {zona && (
        <Campo
          id={`tallas-${id}`}
          etiqueta="Distribución de tallas (opcional)"
          ayuda="Si ya la tienes, escríbela. Si no, se define después."
        >
          <input
            id={`tallas-${id}`}
            type="text"
            maxLength={200}
            placeholder="Ej. 100 S, 200 M, 150 L, 50 XL"
            value={bloque.tallasTexto}
            onChange={(e) => onCambiar({ tallasTexto: e.target.value })}
            className={claseInput}
          />
        </Campo>
      )}
    </>
  );
}

// ------------------------------------------------------------------ a la medida
function BloqueMedida({ bloque, onCambiar }) {
  const id = bloque.id;
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_11rem]">
      <Campo id={`articulo-${id}`} etiqueta="¿Qué necesitas?">
        <input
          id={`articulo-${id}`}
          type="text"
          maxLength={160}
          placeholder="Ej. Chaleco reflectivo con logo"
          value={bloque.articulo}
          onChange={(e) => onCambiar({ articulo: e.target.value })}
          className={claseInput}
        />
      </Campo>
      <Campo id={`cantidad-${id}`} etiqueta="Cantidad">
        <input
          id={`cantidad-${id}`}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="0"
          value={bloque.cantidad}
          onChange={(e) => onCambiar({ cantidad: soloDigitos(e.target.value) })}
          className="w-full border-2 border-tinta bg-white px-3 py-2 font-display text-3xl font-bold leading-none tabular-nums"
        />
      </Campo>
      <div className="md:col-span-2">
        <Campo id={`detalle-${id}`} etiqueta="Tallas, colores, normas u otros detalles (opcional)">
          <textarea
            id={`detalle-${id}`}
            rows={2}
            maxLength={300}
            value={bloque.detalle}
            onChange={(e) => onCambiar({ detalle: e.target.value })}
            className={claseInput}
          />
        </Campo>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------- marco común
export default function BloqueEditor({ bloque, indice, zonas, zonaPorId, resumen, intento, onCambiar, onQuitar }) {
  return (
    <li className="border-2 border-tinta bg-white">
      <div className="flex items-center justify-between gap-3 border-b-2 border-tinta bg-concreto px-4 py-2">
        <p className="font-display text-xl font-bold uppercase leading-none">
          {indice + 1}. {TIPOS_BLOQUE[bloque.tipo].titulo}
        </p>
        <button
          type="button"
          onClick={onQuitar}
          aria-label={`Quitar la necesidad ${indice + 1}`}
          className="grid h-8 w-8 place-items-center transition-colors hover:bg-tinta hover:text-papel"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4 p-4">
        {bloque.tipo === 'catalogo' && (
          <BloqueCatalogo bloque={bloque} zonas={zonas} zonaPorId={zonaPorId} onCambiar={onCambiar} />
        )}
        {bloque.tipo === 'equipo' && (
          <BloqueEquipo bloque={bloque} zonas={zonas} zonaPorId={zonaPorId} onCambiar={onCambiar} />
        )}
        {bloque.tipo === 'medida' && <BloqueMedida bloque={bloque} onCambiar={onCambiar} />}
      </div>

      {resumen.listo ? (
        <p className="border-t-2 border-tinta bg-seguridad/30 px-4 py-2 text-sm font-semibold">
          Total de esta necesidad: {formatoNumero(resumen.total)} unidades
        </p>
      ) : (
        intento && (
          <p role="alert" className="border-t-2 border-alerta px-4 py-2 text-sm font-semibold text-alerta">
            {resumen.falta}
          </p>
        )
      )}
    </li>
  );
}
