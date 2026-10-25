// app/sugerencias/SugerenciasClient.jsx
// Formulario de sugerencia de producto. Mientras escribes el nombre, la búsqueda inteligente
// (lib/busqueda.js) avisa si ya existe algo parecido en el catálogo. Al enviar se guarda en la
// base de datos (POST /api/sugerencias → sugerencias_productos) y se muestra un código SUG-0001.
'use client';

import { useId, useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Info, Loader2, Send } from 'lucide-react';
import { buscar } from '@/lib/busqueda';
import { GENEROS_SUGERENCIA, TIPOS_SUGERENCIA, sanearSugerencia, validarSugerencia } from '@/lib/sugerencias';
import { ETIQUETA_GENERO, formatoPrecio } from '@/lib/formato';

const campo = 'w-full border-2 border-tinta bg-white px-3 py-2.5 text-base';

function Campo({ id, etiqueta, error, ayuda, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold">
        {etiqueta}
      </label>
      {children}
      {ayuda && !error && <p className="mt-1 text-xs text-acero">{ayuda}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-sm font-semibold text-alerta">
          {error}
        </p>
      )}
    </div>
  );
}

function Opciones({ nombre, valor, onCambiar, opciones }) {
  return (
    <div role="radiogroup" aria-label={nombre} className="flex flex-wrap border-2 border-tinta bg-white">
      {opciones.map((o, i) => (
        <button
          key={o.valor}
          type="button"
          role="radio"
          aria-checked={valor === o.valor}
          onClick={() => onCambiar(valor === o.valor && nombre === 'Para quién es' ? '' : o.valor)}
          className={`flex-1 px-3 py-2 font-display text-lg font-bold uppercase leading-none transition-colors ${i > 0 ? 'border-l-2 border-tinta' : ''} ${
            valor === o.valor ? 'bg-tinta text-papel' : 'hover:bg-seguridad'
          }`}
        >
          {o.etiqueta}
        </button>
      ))}
    </div>
  );
}

export default function SugerenciasClient({ zonas, indice, nombreInicial = '', zonaSlugInicial = '' }) {
  const id = useId();
  const [datos, setDatos] = useState({
    nombre: nombreInicial,
    zonaId: zonas.find((z) => z.slug === zonaSlugInicial)?.id ?? '',
    tipo: 'prenda',
    genero: '',
    descripcion: '',
    cantidad: '',
    empresa: '',
    contacto: '',
    email: '',
    telefono: '',
  });
  const [intento, setIntento] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState('');
  const [registrada, setRegistrada] = useState(null);

  const cambiar = (campoNombre) => (e) => setDatos((d) => ({ ...d, [campoNombre]: e.target.value }));
  const errores = validarSugerencia(sanearSugerencia(datos));
  const errorDe = (c) => (intento ? errores[c] : undefined);

  // ¿Ya tenemos algo parecido?
  const parecidos = useMemo(
    () =>
      datos.nombre.trim().length >= 3
        ? buscar(indice, datos.nombre, (i) => i.texto).slice(0, 4).map((r) => r.item)
        : [],
    [datos.nombre, indice]
  );

  async function enviar(e) {
    e.preventDefault();
    setIntento(true);
    setErrorEnvio('');
    if (Object.keys(errores).length > 0 || enviando) return;

    setEnviando(true);
    try {
      const respuesta = await fetch('/api/sugerencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datos }),
      });
      const cuerpo = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) {
        setErrorEnvio(cuerpo.error || 'No se pudo registrar la sugerencia. Intenta de nuevo.');
        return;
      }
      setRegistrada({ codigo: cuerpo.sugerencia.codigo, nombre: datos.nombre.trim() });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setErrorEnvio('No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  function otra() {
    setDatos((d) => ({ ...d, nombre: '', genero: '', descripcion: '', cantidad: '' }));
    setIntento(false);
    setErrorEnvio('');
    setRegistrada(null);
  }

  if (registrada) {
    return (
      <div className="mx-auto max-w-3xl" role="status">
        <div className="border-2 border-tinta bg-papel">
          <div className="flex items-start gap-4 border-b-2 border-tinta bg-seguridad px-5 py-5">
            <Check className="mt-1 h-8 w-8 shrink-0" strokeWidth={3} aria-hidden="true" />
            <div>
              <h2 className="font-display text-4xl font-extrabold uppercase leading-none">Sugerencia registrada</h2>
              <p className="mt-2 text-base">
                Tu código es <strong className="font-display text-2xl font-bold tabular-nums">{registrada.codigo}</strong>. Guardamos «{registrada.nombre}» con estado «nueva».
              </p>
            </div>
          </div>
          <div className="space-y-4 p-5">
            <p className="text-sm text-acero">
              Como es un proyecto académico, no se envió a ningún correo ni WhatsApp real: quedó en la base de datos del proyecto.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={otra}
                className="border-2 border-tinta bg-tinta px-5 py-3 font-display text-xl font-semibold uppercase tracking-wide text-papel transition-colors hover:bg-seguridad hover:text-tinta"
              >
                Sugerir otro
              </button>
              <Link href="/" className="border-2 border-tinta px-5 py-3 font-display text-xl font-semibold uppercase tracking-wide transition-colors hover:bg-tinta hover:text-papel">
                Volver al catálogo
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} noValidate className="mx-auto max-w-3xl space-y-8">
      <div role="note" className="flex gap-3 border-2 border-tinta bg-seguridad/30 p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
        <p className="text-sm">
          <strong className="font-semibold">Proyecto académico.</strong> La sugerencia se guarda en la base de datos del proyecto con estado «nueva», pero no se envía a ningún correo ni WhatsApp real.
        </p>
      </div>

      <section className="border-2 border-tinta bg-papel">
        <header className="border-b-2 border-tinta bg-grafito px-5 py-3 text-papel">
          <h2 className="font-display text-3xl font-bold uppercase leading-none">¿Qué necesitas?</h2>
        </header>
        <div className="space-y-5 p-5">
          <Campo id={`${id}-nombre`} etiqueta="Nombre del artículo" error={errorDe('nombre')} ayuda="Ej. Zuecos antideslizantes, chaleco térmico, cofia desechable">
            <input id={`${id}-nombre`} value={datos.nombre} onChange={cambiar('nombre')} maxLength={120} className={campo} aria-describedby={errorDe('nombre') ? `${id}-nombre-error` : undefined} />
          </Campo>

          {parecidos.length > 0 && (
            <div className="border-2 border-tinta bg-white p-3" aria-live="polite">
              <p className="text-sm font-semibold">¿Es alguno de estos? Ya lo tenemos en el catálogo:</p>
              <ul className="mt-2 divide-y divide-tinta/20">
                {parecidos.map((p) => (
                  <li key={p.clave} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                    <span>
                      <strong className="font-semibold">{p.nombre}</strong>
                      {p.genero && p.genero !== 'unisex' ? ` (${ETIQUETA_GENERO[p.genero]})` : ''}
                      <span className="text-acero"> · {p.clase === 'prenda' ? 'Prenda' : 'Accesorio'} en {p.zonaNombre} · {formatoPrecio(p.precio)}</span>
                    </span>
                    <Link href={`/categoria/${p.zonaSlug}?q=${encodeURIComponent(p.nombre)}`} className="font-semibold underline underline-offset-4 hover:bg-tinta hover:text-papel">
                      Verlo
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-acero">Si no es lo que buscas, sigue con el formulario.</p>
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-sm font-semibold">Es…</p>
              <Opciones nombre="Tipo de artículo" valor={datos.tipo} onCambiar={(v) => setDatos((d) => ({ ...d, tipo: v, genero: v === 'prenda' ? d.genero : '' }))} opciones={TIPOS_SUGERENCIA} />
            </div>
            {datos.tipo === 'prenda' && (
              <div>
                <p className="mb-1 text-sm font-semibold">Para quién es (opcional)</p>
                <Opciones nombre="Para quién es" valor={datos.genero} onCambiar={(v) => setDatos((d) => ({ ...d, genero: v }))} opciones={GENEROS_SUGERENCIA} />
              </div>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Campo id={`${id}-zona`} etiqueta="Zona donde lo necesitas (opcional)">
              <select id={`${id}-zona`} value={datos.zonaId} onChange={cambiar('zonaId')} className={campo}>
                <option value="">No estoy seguro / otra zona</option>
                {zonas.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.nombre}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo id={`${id}-cantidad`} etiqueta="Cantidad aproximada (opcional)" error={errorDe('cantidad')}>
              <input id={`${id}-cantidad`} inputMode="numeric" value={datos.cantidad} onChange={(e) => setDatos((d) => ({ ...d, cantidad: e.target.value.replace(/\D/g, '').slice(0, 6) }))} placeholder="Ej. 50" className={campo} />
            </Campo>
          </div>

          <Campo id={`${id}-descripcion`} etiqueta="Cuéntanos más" error={errorDe('descripcion')} ayuda="Para qué lo necesitas, material o color que imaginas, medidas, normas que debe cumplir…">
            <textarea id={`${id}-descripcion`} value={datos.descripcion} onChange={cambiar('descripcion')} maxLength={800} rows={4} className={campo} aria-describedby={errorDe('descripcion') ? `${id}-descripcion-error` : undefined} />
          </Campo>
        </div>
      </section>

      <section className="border-2 border-tinta bg-papel">
        <header className="border-b-2 border-tinta bg-grafito px-5 py-3 text-papel">
          <h2 className="font-display text-3xl font-bold uppercase leading-none">Tus datos</h2>
          <p className="text-sm text-concreto-oscuro">Para saber quién lo sugiere y cómo avisarte.</p>
        </header>
        <div className="grid gap-5 p-5 sm:grid-cols-2">
          <Campo id={`${id}-empresa`} etiqueta="Empresa" error={errorDe('empresa')}>
            <input id={`${id}-empresa`} value={datos.empresa} onChange={cambiar('empresa')} maxLength={120} className={campo} />
          </Campo>
          <Campo id={`${id}-contacto`} etiqueta="Persona de contacto" error={errorDe('contacto')}>
            <input id={`${id}-contacto`} value={datos.contacto} onChange={cambiar('contacto')} maxLength={120} className={campo} />
          </Campo>
          <Campo id={`${id}-email`} etiqueta="Correo electrónico" error={errorDe('email')}>
            <input id={`${id}-email`} type="email" value={datos.email} onChange={cambiar('email')} maxLength={160} className={campo} />
          </Campo>
          <Campo id={`${id}-telefono`} etiqueta="Celular (opcional)" error={errorDe('telefono')}>
            <input id={`${id}-telefono`} inputMode="tel" value={datos.telefono} onChange={cambiar('telefono')} maxLength={16} className={campo} />
          </Campo>
        </div>
      </section>

      {errorEnvio && (
        <div role="alert" className="border-2 border-alerta bg-white p-3 text-sm">
          <p className="font-semibold text-alerta">No se pudo enviar</p>
          <p>{errorEnvio}</p>
        </div>
      )}
      {intento && Object.keys(errores).length > 0 && (
        <p role="alert" className="text-sm font-semibold text-alerta">
          Revisa los campos marcados en rojo.
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="flex w-full items-center justify-center gap-2 border-2 border-tinta bg-seguridad px-4 py-3 font-display text-xl font-semibold uppercase tracking-wide transition-colors hover:bg-tinta hover:text-seguridad disabled:cursor-wait disabled:opacity-60 disabled:hover:bg-seguridad disabled:hover:text-tinta"
      >
        {enviando ? <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2.5} /> : <Send className="h-5 w-5" strokeWidth={2.5} />}
        {enviando ? 'Enviando…' : 'Enviar sugerencia'}
      </button>
    </form>
  );
}
