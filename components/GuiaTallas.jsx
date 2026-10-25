// components/GuiaTallas.jsx
// Contenido de la guía de tallas: calculadora, equivalencias, medidas, cómo medirse y calzado.
// Se usa en la página /guia-tallas y dentro de la ventana de cada prenda.
// PROYECTO ACADÉMICO: los datos son de ejemplo (lib/guiaTallas.js).
'use client';

import { useId, useState } from 'react';
import { Info, Ruler } from 'lucide-react';
import {
  CALZADO,
  CONSEJOS,
  EQUIVALENCIAS,
  GENEROS_GUIA,
  MEDIDAS_CM,
  PASOS_MEDIRSE,
  cmAPulgadas,
  recomendarTalla,
} from '@/lib/guiaTallas';

const celda = 'border-b border-tinta/20 px-3 py-2 text-left';
const cabecera = 'bg-grafito px-3 py-2 text-left text-sm font-semibold text-papel';

function Tabla({ titulo, ayuda, children }) {
  return (
    <section className="mt-8">
      <h3 className="font-display text-2xl font-bold uppercase leading-none">{titulo}</h3>
      {ayuda && <p className="mt-1 text-sm text-acero">{ayuda}</p>}
      <div className="mt-3 overflow-x-auto border-2 border-tinta bg-white">{children}</div>
    </section>
  );
}

export default function GuiaTallas({ generoInicial = 'mujer', enVentana = false }) {
  const id = useId();
  const [genero, setGenero] = useState(generoInicial === 'hombre' ? 'hombre' : 'mujer');
  const [unidad, setUnidad] = useState('cm');
  const [pecho, setPecho] = useState('');
  const [cintura, setCintura] = useState('');

  const aCm = (v) => (unidad === 'in' ? Number(v) * 2.54 : Number(v));
  const medida = (cm) => (unidad === 'in' ? cmAPulgadas(cm) : cm);
  const recomendacion = pecho.trim() === '' ? undefined : recomendarTalla(genero, aCm(pecho), cintura.trim() === '' ? NaN : aCm(cintura));
  const nombreGenero = genero === 'mujer' ? 'mujer' : 'hombre';

  return (
    <div>
      <div role="note" className="flex gap-3 border-2 border-tinta bg-seguridad/30 p-3">
        <Info className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
        <p className="text-sm">
          <strong className="font-semibold">Proyecto académico.</strong> Las tallas, medidas y equivalencias de esta guía son de ejemplo y no son reales.
        </p>
      </div>

      {/* Controles */}
      <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-3">
        <div role="radiogroup" aria-label="Tabla para" className="flex items-center gap-3">
          <span className="text-sm font-semibold">Tabla para</span>
          <div className="flex border-2 border-tinta">
            {GENEROS_GUIA.map((g, i) => (
              <button
                key={g.valor}
                type="button"
                role="radio"
                aria-checked={genero === g.valor}
                onClick={() => setGenero(g.valor)}
                className={`px-4 py-1.5 font-display text-lg font-bold uppercase leading-none transition-colors ${i > 0 ? 'border-l-2 border-tinta' : ''} ${
                  genero === g.valor ? 'bg-tinta text-papel' : 'bg-white hover:bg-seguridad'
                }`}
              >
                {g.etiqueta}
              </button>
            ))}
          </div>
        </div>

        <div role="radiogroup" aria-label="Unidad de medida" className="flex items-center gap-3">
          <span className="text-sm font-semibold">Medidas en</span>
          <div className="flex border-2 border-tinta">
            {[
              ['cm', 'Centímetros'],
              ['in', 'Pulgadas'],
            ].map(([valor, etiqueta], i) => (
              <button
                key={valor}
                type="button"
                role="radio"
                aria-checked={unidad === valor}
                onClick={() => setUnidad(valor)}
                className={`px-3 py-1.5 font-display text-lg font-bold uppercase leading-none transition-colors ${i > 0 ? 'border-l-2 border-tinta' : ''} ${
                  unidad === valor ? 'bg-tinta text-papel' : 'bg-white hover:bg-seguridad'
                }`}
              >
                {etiqueta}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calculadora */}
      <section className="mt-8 border-2 border-tinta bg-papel p-4" aria-labelledby={`${id}-calc`}>
        <h3 id={`${id}-calc`} className="flex items-center gap-2 font-display text-2xl font-bold uppercase leading-none">
          <Ruler className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
          ¿Qué talla soy?
        </h3>
        <p className="mt-1 text-sm text-acero">
          Escribe tus medidas en {unidad === 'cm' ? 'centímetros' : 'pulgadas'} y te decimos la talla de ejemplo para la tabla de {nombreGenero}.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor={`${id}-pecho`} className="mb-1 block text-sm font-semibold">
              {genero === 'mujer' ? 'Busto' : 'Pecho'}
            </label>
            <input
              id={`${id}-pecho`}
              inputMode="decimal"
              value={pecho}
              onChange={(e) => setPecho(e.target.value.replace(/[^\d.,]/g, '').replace(',', '.'))}
              placeholder={unidad === 'cm' ? 'Ej. 92' : 'Ej. 36'}
              className="w-full border-2 border-tinta bg-white px-3 py-2.5 text-base"
            />
          </div>
          <div>
            <label htmlFor={`${id}-cintura`} className="mb-1 block text-sm font-semibold">
              Cintura (opcional)
            </label>
            <input
              id={`${id}-cintura`}
              inputMode="decimal"
              value={cintura}
              onChange={(e) => setCintura(e.target.value.replace(/[^\d.,]/g, '').replace(',', '.'))}
              placeholder={unidad === 'cm' ? 'Ej. 74' : 'Ej. 29'}
              className="w-full border-2 border-tinta bg-white px-3 py-2.5 text-base"
            />
          </div>
        </div>

        <p aria-live="polite" className="mt-4 min-h-6 text-base">
          {recomendacion === undefined && <span className="text-acero">Escribe al menos el {genero === 'mujer' ? 'busto' : 'pecho'}.</span>}
          {recomendacion === null && (
            <span>Tus medidas superan la tabla de ejemplo. Pídenos esa talla en una solicitud especial «a la medida».</span>
          )}
          {recomendacion && (
            <span>
              Talla de ejemplo: <strong className="mx-1 border-2 border-tinta bg-seguridad px-2 font-display text-2xl font-bold">{recomendacion.talla}</strong>
              {recomendacion.entreDos && ' (tu cintura pide una talla más que tu pecho: elegimos la mayor)'}
            </span>
          )}
        </p>
      </section>

      <Tabla titulo="Equivalencias" ayuda={`Talla en letras y su número en cada país, tabla de ${nombreGenero}. Colombia usa su propia numeración.`}>
        <table className="w-full min-w-[28rem] text-sm">
          <thead>
            <tr>
              {['Talla', 'Colombia', 'EE. UU.', 'Europa', 'Reino Unido'].map((t) => (
                <th key={t} scope="col" className={cabecera}>{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {EQUIVALENCIAS[genero].map((f) => (
              <tr key={f.talla}>
                <th scope="row" className={`${celda} font-display text-xl`}>{f.talla}</th>
                <td className={celda}>{f.co}</td>
                <td className={celda}>{f.us}</td>
                <td className={celda}>{f.eu}</td>
                <td className={celda}>{f.uk}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Tabla>

      <Tabla titulo="Medidas del cuerpo" ayuda={`Medidas de ejemplo en ${unidad === 'cm' ? 'centímetros' : 'pulgadas'}, tabla de ${nombreGenero}.`}>
        <table className="w-full min-w-[24rem] text-sm">
          <thead>
            <tr>
              {['Talla', genero === 'mujer' ? 'Busto' : 'Pecho', 'Cintura', 'Cadera'].map((t) => (
                <th key={t} scope="col" className={cabecera}>{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MEDIDAS_CM[genero].map((f) => (
              <tr key={f.talla}>
                <th scope="row" className={`${celda} font-display text-xl`}>{f.talla}</th>
                <td className={`${celda} tabular-nums`}>{medida(f.pecho)}</td>
                <td className={`${celda} tabular-nums`}>{medida(f.cintura)}</td>
                <td className={`${celda} tabular-nums`}>{medida(f.cadera)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Tabla>

      <section className="mt-8">
        <h3 className="font-display text-2xl font-bold uppercase leading-none">Cómo medirte</h3>
        <ol className="mt-3 grid gap-3 sm:grid-cols-2">
          {PASOS_MEDIRSE.map((p, i) => (
            <li key={p.titulo} className="flex gap-3 border-2 border-tinta bg-papel p-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center border-2 border-tinta bg-seguridad font-display text-lg font-bold">{i + 1}</span>
              <div>
                <p className="font-semibold">{p.titulo}</p>
                <p className="text-sm text-acero">{p.texto}</p>
              </div>
            </li>
          ))}
        </ol>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm">
          {CONSEJOS.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </section>

      <Tabla titulo="Calzado" ayuda="En Colombia el calzado usa la numeración europea. Largo del pie de ejemplo.">
        <table className="w-full min-w-[30rem] text-sm">
          <thead>
            <tr>
              {['Colombia / Europa', 'EE. UU. hombre', 'EE. UU. mujer', 'Reino Unido', `Largo del pie (${unidad})`].map((t) => (
                <th key={t} scope="col" className={cabecera}>{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CALZADO.map((f) => (
              <tr key={f.eu}>
                <th scope="row" className={`${celda} font-display text-xl`}>{f.eu}</th>
                <td className={`${celda} tabular-nums`}>{f.usHombre}</td>
                <td className={`${celda} tabular-nums`}>{f.usMujer}</td>
                <td className={`${celda} tabular-nums`}>{f.uk}</td>
                <td className={`${celda} tabular-nums`}>{medida(f.pieCm)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Tabla>

      {!enVentana && <p className="mt-8 text-sm text-acero">¿Tu talla no está en la tabla? Pídela en una solicitud especial «a la medida».</p>}
    </div>
  );
}
