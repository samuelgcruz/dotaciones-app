// app/solicitud/SolicitudClient.jsx
// Solicitud especial armada por bloques según la necesidad (catálogo, equipos
// completos o a la medida). 100% frontend: arma un mensaje y lo entrega por
// WhatsApp, correo o portapapeles. No se guarda nada en la base de datos.
// Si no hay número ni correo configurados (proyecto académico), el envío es una simulación.
'use client';

import { useRef, useState } from 'react';
import { Check, Copy, Info, Mail, MessageCircle, Package, Ruler, Users } from 'lucide-react';
import { CORREO_SOLICITUDES, WHATSAPP_NUMERO } from '@/lib/contacto';
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
  const [simulado, setSimulado] = useState(null);

  const zonaPorId = new Map(zonas.map((z) => [z.id, z]));
  const resumenes = bloques.map((b) => resumenBloque(b, zonaPorId));
  const listos = resumenes.filter((r) => r.listo);
  const erroresDatos = validarDatos(datos);
  const hay =
    Object.keys(erroresDatos).length > 0 || bloques.length === 0 || resumenes.some((r) => !r.listo);

  const totalUnidades = listos.reduce((acc, r) => acc + r.total, 0);
  const referencia = listos.reduce((acc, r) => acc + r.referencia, 0);
  const hayAlgunaSimulacion = !WHATSAPP_NUMERO || !CORREO_SOLICITUDES;

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

  async function enviar(canal) {
    setIntento(true);
    setAviso('');
    setSimulado(null);
    if (hay) return;

    if (canal === 'whatsapp') {
      const texto = armarMensaje('whatsapp', datos, resumenes);
      if (!WHATSAPP_NUMERO) {
        setSimulado({ canal: 'WhatsApp', texto });
        return;
      }
      window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener,noreferrer');
      return;
    }

    const texto = armarMensaje('texto', datos, resumenes);
    if (canal === 'correo') {
      if (!CORREO_SOLICITUDES) {
        setSimulado({ canal: 'correo', texto });
        return;
      }
      const asunto = `Solicitud especial de dotación: ${datos.empresa.trim()}`;
      window.location.href = `mailto:${CORREO_SOLICITUDES}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(texto)}`;
      return;
    }

    try {
      await navigator.clipboard.writeText(texto);
      setAviso('Solicitud copiada. Pégala en el canal que prefieras.');
    } catch {
      setAviso('No se pudo copiar. Selecciona el texto de la vista previa y cópialo a mano.');
    }
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

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-8 pb-8 lg:grid-cols-[minmax(0,1fr)_23rem]">
      <div className="space-y-6">
        {hayAlgunaSimulacion && (
          <div role="note" className="flex gap-3 border-2 border-tinta bg-seguridad/30 p-4">
            <Info className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
            <p className="text-sm">
              <strong className="font-semibold">Proyecto académico.</strong> El envío de esta solicitud es
              una simulación: no se manda ningún mensaje a un número de WhatsApp ni a un correo real. Al
              enviarla verás cómo quedaría el mensaje.
            </p>
          </div>
        )}

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
            <Campo id="fecha" etiqueta="Fecha en que lo necesitas (opcional)">
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

          <button
            type="button"
            onClick={() => enviar('whatsapp')}
            className="flex w-full items-center justify-center gap-2 border-2 border-tinta bg-seguridad px-4 py-3 font-display text-xl font-semibold uppercase tracking-wide transition-colors hover:bg-tinta hover:text-seguridad"
          >
            <MessageCircle className="h-5 w-5" strokeWidth={2.5} />
            Enviar por WhatsApp
          </button>
          <button
            type="button"
            onClick={() => enviar('correo')}
            className="flex w-full items-center justify-center gap-2 border-2 border-tinta bg-tinta px-4 py-3 font-display text-xl font-semibold uppercase tracking-wide text-papel transition-colors hover:bg-seguridad hover:text-tinta"
          >
            <Mail className="h-5 w-5" strokeWidth={2.5} />
            Enviar por correo
          </button>
          <button
            type="button"
            onClick={() => enviar('copiar')}
            className="flex w-full items-center justify-center gap-2 border-2 border-tinta px-4 py-2.5 font-display text-lg font-semibold uppercase tracking-wide transition-colors hover:bg-tinta hover:text-papel"
          >
            <Copy className="h-4 w-4" strokeWidth={2.5} />
            Copiar solicitud
          </button>

          <p aria-live="polite" className="text-sm font-semibold">
            {aviso}
          </p>

          {simulado && (
            <div role="status" className="border-2 border-tinta bg-white">
              <div className="flex items-start gap-2 border-b-2 border-tinta bg-seguridad px-3 py-2">
                <Check className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={3} aria-hidden="true" />
                <div>
                  <p className="font-display text-lg font-bold uppercase leading-tight">Simulación completada</p>
                  <p className="text-sm">Así se habría enviado por {simulado.canal}. No se envió nada.</p>
                </div>
              </div>
              <pre className="whitespace-pre-wrap break-words p-3 font-sans text-sm">{simulado.texto}</pre>
            </div>
          )}

          <p className="text-sm text-acero">
            {hayAlgunaSimulacion
              ? 'Nada de esta solicitud se guarda ni se envía: es una simulación del flujo.'
              : 'Esta solicitud no se guarda en el sitio: sale directo por el canal que elijas y desde ahí se continúa la conversación.'}
          </p>

          {vistaPrevia && (
            <details className="border-2 border-tinta bg-white">
              <summary className="cursor-pointer px-3 py-2 text-sm font-semibold">Ver el mensaje que se enviará</summary>
              <pre className="whitespace-pre-wrap break-words border-t-2 border-tinta p-3 font-sans text-sm">{vistaPrevia}</pre>
            </details>
          )}
        </div>
      </aside>
    </div>
  );
}
