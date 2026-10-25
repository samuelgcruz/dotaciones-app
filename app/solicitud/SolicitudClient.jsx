// app/solicitud/SolicitudClient.jsx
// Solicitud especial armada por bloques según la necesidad (catálogo, equipos
// completos o a la medida). Al enviarla se GUARDA en la base de datos
// (POST /api/solicitudes → tabla solicitudes_especiales) y la pantalla muestra el
// código de seguimiento. No se manda a ningún WhatsApp ni correo real (proyecto académico).
'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Check, Copy, Info, Loader2, Package, Ruler, Send, Users } from 'lucide-react';
import { formatoNumero, formatoPrecio } from '@/lib/formato';
import { armarMensaje, bloqueNuevo, MAX_BLOQUES, resumenBloque, TIPOS_BLOQUE, validarDatos } from '@/lib/solicitud';
import BloqueEditor, { Campo, baseInput, claseInput } from '@/components/SolicitudBloques';

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

const ICONOS = { catalogo: Package, equipo: Users, medida: Ruler };

function Seccion({ titulo, texto, children }) {
  return (
    <section className="border-2 border-tinta bg-papel">
      <div className="border-b-2 border-tinta bg-grafito px-5 py-3 text-papel">
        <h2 className="font-display text-2xl font-bold uppercase leading-none">{titulo}</h2>
        {texto && <p className="mt-1 text-sm text-concreto-oscuro">{texto}</p>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export default function SolicitudClient({ zonas, inicial }) {
  const [datos, setDatos] = useState({
    empresa: '',
    nit: '',
    contacto: '',
    email: '',
    prefijo: '+57',
    numero: '',
    ciudad: '',
    fecha: '',
    notas: '',
  });

  // Si llegó desde una ficha del catálogo, arranca con ese artículo ya elegido
  const [bloques, setBloques] = useState(() =>
    inicial.zonaId
      ? [
          bloqueNuevo('catalogo', 1, {
            zonaId: inicial.zonaId,
            articuloKey: inicial.articuloKey,
            tallas: inicial.tallaId ? { [inicial.tallaId]: '' } : {},
          }),
        ]
      : []
  );
  const siguienteId = useRef(2);
  const [intento, setIntento] = useState(false);
  const [aviso, setAviso] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState('');
  const [registrada, setRegistrada] = useState(null); // { codigo, texto, total } cuando ya quedó guardada

  const zonaPorId = new Map(zonas.map((z) => [z.id, z]));
  const resumenes = bloques.map((b) => resumenBloque(b, zonaPorId));
  const listos = resumenes.filter((r) => r.listo);
  const erroresDatos = validarDatos(datos);
  const hay =
    Object.keys(erroresDatos).length > 0 || bloques.length === 0 || resumenes.some((r) => !r.listo);

  const totalUnidades = listos.reduce((acc, r) => acc + r.total, 0);
  const referencia = listos.reduce((acc, r) => acc + r.referencia, 0);

  const campo = (nombre) => (e) => setDatos((prev) => ({ ...prev, [nombre]: e.target.value }));
  const errorDe = (nombre) => (intento ? erroresDatos[nombre] : undefined);

  function agregarBloque(tipo) {
    setBloques((prev) => (prev.length >= MAX_BLOQUES ? prev : [...prev, bloqueNuevo(tipo, siguienteId.current++)]));
  }
  function cambiarBloque(id, cambios) {
    setBloques((prev) => prev.map((b) => (b.id === id ? { ...b, ...cambios } : b)));
  }
  function quitarBloque(id) {
    setBloques((prev) => prev.filter((b) => b.id !== id));
  }

  async function enviar() {
    setIntento(true);
    setAviso('');
    setErrorEnvio('');
    if (hay || enviando) return;

    setEnviando(true);
    try {
      const respuesta = await fetch('/api/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datos, bloques }),
      });
      const cuerpo = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) {
        setErrorEnvio(cuerpo.error || 'No se pudo registrar la solicitud. Intenta de nuevo.');
        return;
      }
      setRegistrada({
        codigo: cuerpo.solicitud.codigo,
        total: cuerpo.solicitud.total_unidades,
        texto: armarMensaje('texto', datos, resumenes),
      });
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setErrorEnvio('No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  async function copiar() {
    setIntento(true);
    setAviso('');
    if (hay) return;
    try {
      await navigator.clipboard.writeText(armarMensaje('texto', datos, resumenes));
      setAviso('Solicitud copiada.');
    } catch {
      setAviso('No se pudo copiar. Selecciona el texto de la vista previa y cópialo a mano.');
    }
  }

  function nuevaSolicitud() {
    setBloques([]);
    setDatos((prev) => ({ ...prev, nit: '', fecha: '', notas: '' }));
    setIntento(false);
    setAviso('');
    setErrorEnvio('');
    setRegistrada(null);
  }

  const vistaPrevia = !hay ? armarMensaje('texto', datos, resumenes) : '';

  function opciones(compacto) {
    return (
      <div className={`grid grid-cols-1 gap-3 ${compacto ? 'sm:grid-cols-3' : 'md:grid-cols-3'}`}>
        {Object.entries(TIPOS_BLOQUE).map(([tipo, meta]) => {
          const Icono = ICONOS[tipo];
          return (
            <button
              key={tipo}
              type="button"
              onClick={() => agregarBloque(tipo)}
              disabled={bloques.length >= MAX_BLOQUES}
              className="flex items-start gap-3 border-2 border-tinta bg-white p-4 text-left transition-colors hover:bg-seguridad disabled:opacity-40 disabled:hover:bg-white"
            >
              <Icono className="mt-0.5 h-6 w-6 shrink-0" strokeWidth={2} aria-hidden="true" />
              <span>
                <span className="block font-display text-xl font-bold uppercase leading-tight">{meta.titulo}</span>
                <span className="mt-1 block text-sm text-acero">{meta.ayuda}</span>
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  if (registrada) {
    return (
      <div className="mx-auto max-w-3xl pb-8" role="status">
        <div className="border-2 border-tinta bg-papel">
          <div className="flex items-start gap-4 border-b-2 border-tinta bg-seguridad px-5 py-5">
            <Check className="mt-1 h-8 w-8 shrink-0" strokeWidth={3} aria-hidden="true" />
            <div>
              <h2 className="font-display text-4xl font-extrabold uppercase leading-none">Solicitud registrada</h2>
              <p className="mt-2 text-base">
                Tu código de seguimiento es{' '}
                <strong className="font-display text-2xl font-bold tabular-nums">{registrada.codigo}</strong>.
                Guárdalo para consultar la solicitud.
              </p>
            </div>
          </div>
          <div className="space-y-4 p-5">
            <p className="text-sm text-acero">
              Quedó guardada con estado «recibida»: {formatoNumero(registrada.total)} unidades en total. Como es
              un proyecto académico, no se envió a ningún WhatsApp ni correo real.
            </p>
            <details className="border-2 border-tinta bg-white" open>
              <summary className="cursor-pointer px-3 py-2 text-sm font-semibold">Resumen de lo que enviaste</summary>
              <pre className="whitespace-pre-wrap break-words border-t-2 border-tinta p-3 font-sans text-sm">{registrada.texto}</pre>
            </details>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={nuevaSolicitud}
                className="border-2 border-tinta bg-tinta px-5 py-3 font-display text-xl font-semibold uppercase tracking-wide text-papel transition-colors hover:bg-seguridad hover:text-tinta"
              >
                Hacer otra solicitud
              </button>
              <Link
                href="/"
                className="border-2 border-tinta px-5 py-3 font-display text-xl font-semibold uppercase tracking-wide transition-colors hover:bg-tinta hover:text-papel"
              >
                Volver al catálogo
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-8 pb-8 lg:grid-cols-[minmax(0,1fr)_23rem]">
      <div className="space-y-6">
        <div role="note" className="flex gap-3 border-2 border-tinta bg-seguridad/30 p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
          <p className="text-sm">
            <strong className="font-semibold">Proyecto académico.</strong> La solicitud se guarda en la
            base de datos del proyecto y queda con estado «recibida», pero no se envía a ningún
            WhatsApp ni correo real.
          </p>
        </div>

        {/* ---------- Necesidades ---------- */}
        <Seccion
          titulo="Qué necesitas"
          texto="Agrega una parte por cada necesidad. Puedes combinar varias en la misma solicitud."
        >
          {bloques.length === 0 ? (
            <>
              <p className="mb-4 text-sm font-semibold">¿Qué tipo de necesidad quieres agregar primero?</p>
              {opciones(false)}
            </>
          ) : (
            <>
              <ul className="space-y-4">
                {bloques.map((b, i) => (
                  <BloqueEditor
                    key={b.id}
                    bloque={b}
                    indice={i}
                    zonas={zonas}
                    zonaPorId={zonaPorId}
                    resumen={resumenes[i]}
                    intento={intento}
                    onCambiar={(cambios) => cambiarBloque(b.id, cambios)}
                    onQuitar={() => quitarBloque(b.id)}
                  />
                ))}
              </ul>
              <div className="mt-6 border-t-2 border-dashed border-tinta/40 pt-4">
                <p className="mb-3 text-sm font-semibold">Agregar otra necesidad</p>
                {opciones(true)}
              </div>
            </>
          )}
          {intento && bloques.length === 0 && (
            <p role="alert" className="mt-3 text-sm font-semibold text-alerta">
              Agrega al menos una necesidad.
            </p>
          )}
        </Seccion>

        {/* ---------- Empresa ---------- */}
        <Seccion titulo="Tu empresa" texto="Para saber a quién responder y a dónde enviar.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo id="empresa" etiqueta="Empresa" error={errorDe('empresa')}>
              <input id="empresa" type="text" autoComplete="organization" value={datos.empresa} onChange={campo('empresa')} className={claseInput} />
            </Campo>
            <Campo id="nit" etiqueta="NIT (opcional)">
              <input id="nit" type="text" inputMode="numeric" value={datos.nit} onChange={campo('nit')} className={claseInput} />
            </Campo>
            <Campo id="contacto" etiqueta="Persona de contacto" error={errorDe('contacto')}>
              <input id="contacto" type="text" autoComplete="name" value={datos.contacto} onChange={campo('contacto')} className={claseInput} />
            </Campo>
            <Campo id="email" etiqueta="Correo electrónico" error={errorDe('email')}>
              <input id="email" type="email" autoComplete="email" value={datos.email} onChange={campo('email')} className={claseInput} />
            </Campo>
            <Campo id="numero" etiqueta="Celular de contacto" error={errorDe('numero')}>
              <div className="flex gap-2">
                <select aria-label="Indicativo del país" value={datos.prefijo} onChange={campo('prefijo')} className={`${baseInput} w-40 shrink-0`}>
                  {PREFIJOS_PAIS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <input id="numero" type="tel" inputMode="numeric" autoComplete="tel-national" value={datos.numero} onChange={campo('numero')} className={`${baseInput} min-w-0 flex-1`} />
              </div>
            </Campo>
            <Campo id="ciudad" etiqueta="Ciudad de entrega (opcional)">
              <input id="ciudad" type="text" autoComplete="address-level2" value={datos.ciudad} onChange={campo('ciudad')} className={claseInput} />
            </Campo>
          </div>
        </Seccion>

        {/* ---------- Plazos ---------- */}
        <Seccion titulo="Plazos y requerimientos">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[14rem_minmax(0,1fr)]">
            <Campo id="fecha" etiqueta="Fecha en que lo necesitas (opcional)" error={errorDe('fecha')}>
              <input id="fecha" type="date" value={datos.fecha} onChange={campo('fecha')} className={claseInput} />
            </Campo>
            <Campo id="notas" etiqueta="Notas adicionales (opcional)">
              <textarea
                id="notas"
                rows={3}
                maxLength={800}
                placeholder="Logos, colores, normas que debe cumplir, forma de entrega…"
                value={datos.notas}
                onChange={campo('notas')}
                className={claseInput}
              />
            </Campo>
          </div>
        </Seccion>
      </div>

      {/* ---------- Resumen y envío ---------- */}
      <aside aria-label="Resumen de la solicitud" className="border-2 border-tinta bg-papel lg:sticky lg:top-28">
        <div className="border-b-2 border-tinta bg-seguridad px-5 py-4">
          <p className="text-sm font-semibold">Total solicitado</p>
          <p className="font-display text-6xl font-extrabold leading-none tabular-nums">{formatoNumero(totalUnidades)}</p>
          <p className="mt-1 text-sm">
            {listos.length === 0
              ? 'Aún no hay necesidades completas'
              : `unidades en ${listos.length} ${listos.length === 1 ? 'necesidad' : 'necesidades'}`}
          </p>
        </div>

        {listos.length > 0 && (
          <div className="border-b-2 border-tinta px-5">
            <ul className="divide-y divide-dashed divide-tinta/30">
              {listos.map((r, i) => (
                <li key={i} className="flex items-baseline justify-between gap-3 py-2.5 text-sm">
                  <span className="min-w-0">{r.etiqueta}</span>
                  <span className="shrink-0 font-display text-lg font-bold tabular-nums">{formatoNumero(r.total)}</span>
                </li>
              ))}
            </ul>
            {referencia > 0 && (
              <p className="border-t border-dashed border-tinta/30 py-3 text-xs text-acero">
                Referencia a precios de catálogo: {formatoPrecio(referencia)}. El valor final se cotiza.
              </p>
            )}
          </div>
        )}

        <div className="space-y-3 p-5">
          {intento && hay && (
            <div role="alert" className="border-2 border-alerta bg-white p-3 text-sm">
              <p className="font-semibold text-alerta">Falta completar algunos datos</p>
              <p className="text-acero">Revisa los campos marcados en el formulario.</p>
            </div>
          )}

          {errorEnvio && (
            <div role="alert" className="border-2 border-alerta bg-white p-3 text-sm">
              <p className="font-semibold text-alerta">No se pudo enviar</p>
              <p>{errorEnvio}</p>
            </div>
          )}

          <button
            type="button"
            onClick={enviar}
            disabled={enviando}
            className="flex w-full items-center justify-center gap-2 border-2 border-tinta bg-seguridad px-4 py-3 font-display text-xl font-semibold uppercase tracking-wide transition-colors hover:bg-tinta hover:text-seguridad disabled:cursor-wait disabled:opacity-60 disabled:hover:bg-seguridad disabled:hover:text-tinta"
          >
            {enviando ? (
              <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2.5} />
            ) : (
              <Send className="h-5 w-5" strokeWidth={2.5} />
            )}
            {enviando ? 'Enviando…' : 'Enviar solicitud'}
          </button>
          <button
            type="button"
            onClick={copiar}
            className="flex w-full items-center justify-center gap-2 border-2 border-tinta px-4 py-2.5 font-display text-lg font-semibold uppercase tracking-wide transition-colors hover:bg-tinta hover:text-papel"
          >
            <Copy className="h-4 w-4" strokeWidth={2.5} />
            Copiar solicitud
          </button>

          <p aria-live="polite" className="text-sm font-semibold">
            {aviso}
          </p>

          <p className="text-sm text-acero">
            Al enviarla queda registrada con un código de seguimiento. El valor final se cotiza.
          </p>

          {vistaPrevia && (
            <details className="border-2 border-tinta bg-white">
              <summary className="cursor-pointer px-3 py-2 text-sm font-semibold">Ver el resumen de la solicitud</summary>
              <pre className="whitespace-pre-wrap break-words border-t-2 border-tinta p-3 font-sans text-sm">{vistaPrevia}</pre>
            </details>
          )}
        </div>
      </aside>
    </div>
  );
}
