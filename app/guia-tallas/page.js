// app/guia-tallas/page.js
// Guía de tallas completa. Los datos son de ejemplo (proyecto académico), ver lib/guiaTallas.js.
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import GuiaTallas from '@/components/GuiaTallas';

export const metadata = {
  title: 'Guía de tallas | Dotaciones y Uniformes',
  description: 'Equivalencias de tallas, medidas del cuerpo y cómo medirte. Datos de ejemplo.',
};

export default function GuiaTallasPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 pt-6 sm:px-8 sm:pt-8">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline">
        <ArrowLeft className="h-4 w-4" strokeWidth={2.5} /> Volver al inicio
      </Link>
      <h1 className="mt-6 text-balance font-display text-[clamp(3rem,8vw,6rem)] font-extrabold uppercase leading-[0.85] tracking-tight">
        Guía de tallas
      </h1>
      <p className="mt-4 max-w-xl text-lg text-acero">
        Encuentra tu talla con una calculadora, equivalencias por país y una guía para tomarte las medidas.
      </p>
      <div className="mt-8 pb-8">
        <GuiaTallas />
      </div>
    </div>
  );
}
