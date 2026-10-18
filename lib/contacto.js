// lib/contacto.js
// Canales a los que llega la solicitud especial. Es 100% frontend: no se guarda
// nada en la base de datos; el mensaje sale por WhatsApp o por correo.
//
// Si NO se configuran (proyecto académico), el envío funciona como simulación.
// Para activarlos de verdad, en .env.local y en Vercel:
//   NEXT_PUBLIC_WHATSAPP_NUMERO=573001234567      (indicativo + número, solo dígitos)
//   NEXT_PUBLIC_CORREO_SOLICITUDES=ventas@tuempresa.com
export const WHATSAPP_NUMERO = (process.env.NEXT_PUBLIC_WHATSAPP_NUMERO ?? '').replace(/\D/g, '');
export const CORREO_SOLICITUDES = (process.env.NEXT_PUBLIC_CORREO_SOLICITUDES ?? '').trim();

// Enlace a la solicitud especial con el artículo ya elegido:
//   hrefSolicitud({ zonaSlug, productoId, tallaId })   → una prenda y su talla
//   hrefSolicitud({ zonaSlug, accesorioId })           → un accesorio
export function hrefSolicitud({ zonaSlug, productoId, tallaId, accesorioId } = {}) {
  const params = new URLSearchParams();
  if (zonaSlug) params.set('zona', zonaSlug);
  if (productoId) params.set('producto', productoId);
  if (tallaId) params.set('talla', tallaId);
  if (accesorioId) params.set('accesorio', accesorioId);
  const texto = params.toString();
  return texto ? `/solicitud?${texto}` : '/solicitud';
}
