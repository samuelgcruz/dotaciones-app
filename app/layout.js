// app/layout.js
// Header "sticky" con acento ámbar de marca, y una franja de color arriba
// del todo para reforzar identidad desde el primer pixel.
import './globals.css';
import { Shirt } from 'lucide-react';

export const metadata = {
  title: 'Dotaciones y Uniformes | Catálogo',
  description: 'Arma la dotación de tu equipo de trabajo según su área.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <div className="h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />

        <header className="sticky top-0 z-10 bg-slate-900/95 py-4 text-white shadow-md backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-2.5 px-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/15">
              <Shirt className="h-5 w-5 text-amber-400" />
            </span>
            <h1 className="text-xl font-bold">Dotaciones & Uniformes</h1>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>

        <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-400">
          © {new Date().getFullYear()} Dotaciones & Uniformes — Dotación profesional para tu equipo.
        </footer>
      </body>
    </html>
  );
}
