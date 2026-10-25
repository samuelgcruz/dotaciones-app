// components/MenuPrincipal.jsx
// Enlaces del encabezado: en pantallas anchas van en fila; en móvil se abren en un panel.
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

export const ENLACES = [
  { href: '/guia-tallas', etiqueta: 'Guía de tallas' },
  { href: '/sugerencias', etiqueta: 'Sugerir un producto' },
  { href: '/solicitud', etiqueta: 'Solicitud especial' },
];

export default function MenuPrincipal() {
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);

  useEffect(() => setAbierto(false), [ruta]);
  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e) => e.key === 'Escape' && setAbierto(false);
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [abierto]);

  return (
    <>
      <nav aria-label="Principal" className="hidden items-center gap-6 lg:flex">
        {ENLACES.map((e) => (
          <Link
            key={e.href}
            href={e.href}
            aria-current={ruta === e.href ? 'page' : undefined}
            className={`font-display text-xl font-semibold uppercase tracking-wide transition-colors hover:text-seguridad ${ruta === e.href ? 'text-seguridad' : ''}`}
          >
            {e.etiqueta}
          </Link>
        ))}
      </nav>

      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-controls="menu-movil"
        aria-label={abierto ? 'Cerrar el menú' : 'Abrir el menú'}
        className="grid h-11 w-11 place-items-center border-2 border-concreto-oscuro/60 hover:border-seguridad hover:text-seguridad lg:hidden"
      >
        {abierto ? <X className="h-5 w-5" strokeWidth={2.5} /> : <Menu className="h-5 w-5" strokeWidth={2.5} />}
      </button>

      {abierto && (
        <nav
          id="menu-movil"
          aria-label="Principal"
          className="absolute inset-x-0 top-full border-b-2 border-seguridad bg-grafito lg:hidden"
        >
          <ul className="mx-auto max-w-[88rem] divide-y divide-papel/15 px-4 sm:px-8">
            {ENLACES.map((e) => (
              <li key={e.href}>
                <Link href={e.href} className="block py-3.5 font-display text-2xl font-semibold uppercase tracking-wide hover:text-seguridad">
                  {e.etiqueta}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}
