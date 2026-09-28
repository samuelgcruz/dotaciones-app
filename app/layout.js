// app/layout.js
// Header ahora "sticky" (se queda fijo arriba al hacer scroll), con un
// ícono de logo, y se agregó un footer simple.
import './globals.css';
import { Shirt } from 'lucide-react';

export const metadata = {
  title: 'Dotaciones y Uniformes | Catálogo',
  description: 'Arma la dotación de tu equipo de trabajo según su área.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <header className="sticky top-0 z-10 bg-slate-900/95 py-4 text-white shadow-md backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-2 px-4">
            <Shirt className="h-6 w-6 text-blue-400" />
            <h1 className="text-xl font-bold">Dotaciones & Uniformes</h1>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>

        <footer className="border-t border-gray-200 py-6 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} Dotaciones & Uniformes — Dotación profesional para tu equipo.
        </footer>
      </body>
    </html>
  );
}
