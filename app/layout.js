// app/layout.js
// Estructura global: encabezado de planta con franja de demarcación, el botón
// del pedido (carrito) siempre a la mano, la barra inferior de pedido y el
// panel lateral del carrito.
import './globals.css';
import Link from 'next/link';
import { Barlow_Condensed, IBM_Plex_Sans } from 'next/font/google';
import { HardHat } from 'lucide-react';
import CartButton from '@/components/CartButton';
import CartBar from '@/components/CartBar';
import CartDrawer from '@/components/CartDrawer';

// Rotulación industrial para títulos y cifras; grotesca de ingeniería para el texto corrido.
const display = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-display-src',
  display: 'swap',
});

const cuerpo = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body-src',
  display: 'swap',
});

export const metadata = {
  title: 'Dotaciones y Uniformes | Catálogo por zona de trabajo',
  description: 'Arma la dotación de tu equipo según su área: prendas por talla y accesorios.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${display.variable} ${cuerpo.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <header className="zona-oscura sticky top-0 z-30 bg-grafito text-papel">
          <div className="mx-auto flex h-16 max-w-[88rem] items-center justify-between px-4 sm:px-8">
            <Link href="/" className="flex min-w-0 items-center gap-3">
              <span className="grid h-10 w-10 place-items-center bg-seguridad text-tinta">
                <HardHat className="h-6 w-6" strokeWidth={2.25} />
              </span>
              <span className="font-display text-xl font-bold uppercase leading-none tracking-wide sm:text-2xl">
                Dotaciones
                <span className="hidden font-sans text-xs font-normal normal-case tracking-normal text-concreto-oscuro sm:block">
                  Uniformes y accesorios por área
                </span>
              </span>
            </Link>

            <CartButton />
          </div>
          <div className="franja-peligro h-2" />
        </header>

        <main className="pb-28">{children}</main>

        <footer className="zona-oscura bg-grafito text-concreto-oscuro">
          <div className="mx-auto flex max-w-[88rem] flex-wrap items-center justify-between gap-3 px-4 py-8 text-sm sm:px-8">
            <span className="font-display text-xl font-bold uppercase tracking-wide text-papel">
              Dotaciones
            </span>
            <span>
              © {new Date().getFullYear()} Dotaciones y Uniformes. Dotación profesional para tu equipo.
            </span>
          </div>
        </footer>

        <CartBar />
        <CartDrawer />
      </body>
    </html>
  );
}
