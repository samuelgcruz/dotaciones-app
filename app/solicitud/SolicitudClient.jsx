// app/solicitud/SolicitudClient.jsx
// Formulario de solicitud especial. 100% frontend: arma un mensaje con los datos
// de la empresa y la lista de artículos, y lo entrega por WhatsApp, correo o
// portapapeles. No se guarda nada en la base de datos.
'use client';

import { useRef, useState } from 'react';
import { Check, Copy, Info, Mail, MessageCircle, Plus, Trash2 } from 'lucide-react';
import { CORREO_SOLICITUDES, WHATSAPP_NUMERO } from '@/lib/contacto';

const MAX_LINEAS = 20;

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

const formatoNumero = new Intl.NumberFormat('es-CO');

function Bloque({ titulo, texto, children }) {
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

function Campo({ id, etiqueta, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold">
        {etiqueta}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm font-semibold text-alerta">
          {error}
        </p>
      )}
    </div>
  );
}

function fechaLegible(iso) {
  const [a, m, d] = String(iso).split('-');
  return a && m && d ? `${d}/${m}/${a}` : iso;
}

function validar(datos, lineas) {
  const errores = {};
  if (!datos.empresa.trim()) errores.empresa = 'Escribe el nombre de la empresa.';
  if (!datos.contacto.trim()) errores.contacto = 'Escribe el nombre de la persona de contacto.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email.trim())) errores.email = 'Escribe un correo válido.';
  if (datos.numero.replace(/\D/g, '').length < 7) errores.numero = 'Escribe un celular válido, sin el indicativo.';

  const llenas = lineas.filter((l) => l.articulo.trim() || l.cantidad);
  const porLinea = {};
  for (const l of llenas) {
    const e = {};
    if (!l.articulo.trim()) e.articulo = 'Describe el artículo.';
    if (!(Number(l.cantidad) >= 1)) e.cantidad = 'Indica la cantidad.';
    if (Object.keys(e).length) porLinea[l.id] = e;
  }
  const completas = llenas.filter((l) => l.articulo.trim() && Number(l.cantidad) >= 1);
  if (completas.length === 0) errores.lineas = 'Agrega al menos un artículo con su cantidad.';
  if (Object.keys(porLinea).length) errores.porLinea = porLinea;

  return { errores, completas, hay: Object.keys(errores).length > 0 };
}

function armarMensaje(formato, datos, completas, zonaPorId) {
  const n = (t) => (formato === 'whatsapp' ? `*${t}*` : t);
  const filas = [
    n('SOLICITUD ESPECIAL DE DOTACIÓN'),
    '',
    `${n('Empresa:')} ${datos.empresa.trim()}`,
    datos.nit.trim() ? `${n('NIT:')} ${datos.nit.trim()}` : null,
    `${n('Contacto:')} ${datos.contacto.trim()}`,
    `${n('Correo:')} ${datos.email.trim()}`,
    `${n('Celular:')} ${datos.prefijo} ${datos.numero.replace(/\D/g, '')}`,
    datos.ciudad.trim() ? `${n('Ciudad de entrega:')} ${datos.ciudad.trim()}` : null,
    datos.fecha ? `${n('Fecha requerida:')} ${fechaLegible(datos.fecha)}` : null,
    '',
    n('Artículos solicitados:'),
  ];

  completas.forEach((l, i) => {
    const zona = l.zonaId ? zonaPorId.get(l.zonaId) : null;
    const extras = [zona ? `zona ${zona}` : '', l.detalle.trim()].filter(Boolean).join('; ');
    filas.push(
      `${i + 1}. ${l.articulo.trim()}: ${formatoNumero.format(Number(l.cantidad))} unidades${extras ? ` (${extras})` : ''}`
    );
  });

  const total = completas.reduce((acc, l) => acc + Number(l.cantidad), 0);
  filas.push('', `${n('Total:')} ${formatoNumero.format(total)} unidades en ${completas.length} ${completas.length === 1 ? 'artículo' : 'artículos'}`);
  if (datos.notas.trim()) filas.push('', `${n('Notas:')} ${datos.notas.trim()}`);

  return filas.filter((f) => f !== null).join('\n');
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
  const [lineas, setLineas] = useState(() => [
    { id: 1, zonaId: inicial.zonaId, articulo: inicial.articulo, cantidad: '', detalle: '' },
  ]);
  const siguienteId = useRef(2);
  const [intento, setIntento] = useState(false);
  const [aviso, setAviso] = useState('');
  const [simulado, setSimulado] = useState(null); // { canal, texto } cuando el envío es una simulación

  const zonaPorId = new Map(zonas.map((z) => [z.id, z.nombre]));
  const { errores, completas, hay } = validar(datos, lineas);
  const totalUnidades = completas.reduce((acc, l) => acc + Number(l.cantidad), 0);
  // Sin número ni correo configurados (proyecto académico) el envío es una simulación
  const hayAlgunaSimulacion = !WHATSAPP_NUMERO || !CORREO_SOLICITUDES;

  const campo = (nombre) => (e) => setDatos((prev) => ({ ...prev, [nombre]: e.target.value }));
  const errorDe = (nombre) => (intento ? errores[nombre] : undefined);

  function cambiarLinea(id, cambios) {
    setLineas((prev) => prev.map((l) => (l.id === id ? { ...l, ...cambios } : l)));
  }
  function agregarLinea() {
    setLineas((prev) =>
      prev.length >= MAX_LINEAS
        ? prev
        : [...prev, { id: siguienteId.current++, zonaId: '', articulo: '', cantidad: '', detalle: '' }]
    );
  }
  function quitarLinea(id) {
    setLineas((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev));
  }

  async function enviar(canal) {
    setIntento(true);
    setAviso('');
    setSimulado(null);
    if (hay) return;

    if (canal === 'whatsapp') {
      const texto = armarMensaje('whatsapp', datos, completas, zonaPorId);
      if (!WHATSAPP_NUMERO) {
        setSimulado({ canal: 'WhatsApp', texto });
        return;
      }
      window.open(
        `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(texto)}`,
        '_blank',
        'noopener,noreferrer'
      );
      return;
    }

    const texto = armarMensaje('texto', datos, completas, zonaPorId);
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

  const vistaPrevia = !hay ? armarMensaje('texto', datos, completas, zonaPorId) : '';

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

        {/* ---------- Empresa ---------- */}
        <Bloque titulo="Tu empresa" texto="Para saber a quién responder y a dónde enviar.">
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
                <select
                  aria-label="Indicativo del país"
                  value={datos.prefijo}
                  onChange={campo('prefijo')}
                  className={`${baseInput} w-40 shrink-0`}
                >
                  {PREFIJOS_PAIS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <input
                  id="numero"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  value={datos.numero}
                  onChange={campo('numero')}
                  className={`${baseInput} min-w-0 flex-1`}
                />
              </div>
            </Campo>
            <Campo id="ciudad" etiqueta="Ciudad de entrega (opcional)">
              <input id="ciudad" type="text" autoComplete="address-level2" value={datos.ciudad} onChange={campo('ciudad')} className={claseInput} />
            </Campo>
          </div>
        </Bloque>

        {/* ---------- Artículos ---------- */}
        <Bloque titulo="Qué necesitas" texto="Un renglón por artículo. Puedes pedir las cantidades que haga falta.">
          <ul className="space-y-4">
            {lineas.map((l, i) => {
              const e = intento ? errores.porLinea?.[l.id] : undefined;
              return (
                <li key={l.id} className="border-2 border-tinta bg-white">
                  <div className="flex items-center justify-between border-b-2 border-tinta bg-concreto px-3 py-1.5">
                    <span className="font-display text-lg font-bold uppercase leading-none">Artículo {i + 1}</span>
                    {lineas.length > 1 && (
                      <button
                        type="button"
                        onClick={() => quitarLinea(l.id)}
                        aria-label={`Quitar el artículo ${i + 1}`}
                        className="grid h-8 w-8 place-items-center transition-colors hover:bg-tinta hover:text-papel"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-[minmax(0,1fr)_11rem]">
                    <Campo id={`articulo-${l.id}`} etiqueta="Artículo o descripción" error={e?.articulo}>
                      <input
                        id={`articulo-${l.id}`}
                        type="text"
                        maxLength={160}
                        placeholder="Ej. Chaleco reflectivo con logo"
                        value={l.articulo}
                        onChange={(ev) => cambiarLinea(l.id, { articulo: ev.target.value })}
                        className={claseInput}
                      />
                    </Campo>

                    <Campo id={`cantidad-${l.id}`} etiqueta="Cantidad" error={e?.cantidad}>
                      <input
                        id={`cantidad-${l.id}`}
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={l.cantidad}
                        onChange={(ev) =>
                          cambiarLinea(l.id, { cantidad: ev.target.value.replace(/\D/g, '').slice(0, 6) })
                        }
                        className="w-full border-2 border-tinta bg-white px-3 py-2 font-display text-3xl font-bold leading-none tabular-nums text-tinta placeholder:text-acero/70"
                      />
                    </Campo>

                    <Campo id={`zona-${l.id}`} etiqueta="Zona de trabajo (opcional)">
                      <select
                        id={`zona-${l.id}`}
                        value={l.zonaId}
                        onChange={(ev) => cambiarLinea(l.id, { zonaId: ev.target.value })}
                        className={claseInput}
                      >
                        <option value="">Sin zona específica</option>
                        {zonas.map((z) => (
                          <option key={z.id} value={z.id}>
                            {z.nombre}
                          </option>
                        ))}
                      </select>
                    </Campo>

                    <Campo id={`detalle-${l.id}`} etiqueta="Tallas, colores o detalles (opcional)">
                      <input
                        id={`detalle-${l.id}`}
                        type="text"
                        maxLength={200}
                        placeholder="Ej. 40 S, 100 M, 60 L; color azul"
                        value={l.detalle}
                        onChange={(ev) => cambiarLinea(l.id, { detalle: ev.target.value })}
                        className={claseInput}
                      />
                    </Campo>
                  </div>
                </li>
              );
            })}
          </ul>

          {intento && errores.lineas && (
            <p role="alert" className="mt-3 text-sm font-semibold text-alerta">
              {errores.lineas}
            </p>
          )}

          <button
            type="button"
            onClick={agregarLinea}
            disabled={lineas.length >= MAX_LINEAS}
            className="mt-4 flex w-full items-center justify-center gap-2 border-2 border-dashed border-tinta py-3 font-display text-xl font-semibold uppercase tracking-wide transition-colors hover:bg-seguridad disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <Plus className="h-5 w-5" strokeWidth={3} />
            Agregar otro artículo
          </button>
        </Bloque>

        {/* ---------- Entrega y notas ---------- */}
        <Bloque titulo="Plazos y requerimientos">
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
        </Bloque>
      </div>

      {/* ---------- Resumen y envío ---------- */}
      <aside aria-label="Resumen de la solicitud" className="border-2 border-tinta bg-papel lg:sticky lg:top-28">
        <div className="border-b-2 border-tinta bg-seguridad px-5 py-4">
          <p className="text-sm font-semibold">Total solicitado</p>
          <p className="font-display text-6xl font-extrabold leading-none tabular-nums">
            {formatoNumero.format(totalUnidades)}
          </p>
          <p className="mt-1 text-sm">
            {completas.length === 0
              ? 'Aún no hay artículos completos'
              : `unidades en ${completas.length} ${completas.length === 1 ? 'artículo' : 'artículos'}`}
          </p>
        </div>

        {completas.length > 0 && (
          <ul className="divide-y divide-dashed divide-tinta/30 border-b-2 border-tinta px-5">
            {completas.map((l) => (
              <li key={l.id} className="flex items-baseline justify-between gap-3 py-2.5 text-sm">
                <span className="min-w-0 truncate">{l.articulo}</span>
                <span className="shrink-0 font-display text-lg font-bold tabular-nums">
                  {formatoNumero.format(Number(l.cantidad))}
                </span>
              </li>
            ))}
          </ul>
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
              <summary className="cursor-pointer px-3 py-2 text-sm font-semibold">
                Ver el mensaje que se enviará
              </summary>
              <pre className="whitespace-pre-wrap break-words border-t-2 border-tinta p-3 font-sans text-sm">
                {vistaPrevia}
              </pre>
            </details>
          )}
        </div>
      </aside>
    </div>
  );
}
