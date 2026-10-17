// lib/contacto.js
// Canales a los que llega la solicitud especial. Es 100% frontend: no se guarda
// nada en la base de datos; el mensaje sale por WhatsApp o por correo.
//
// Configúralos en .env.local y en Vercel (Settings → Environment Variables):
//   NEXT_PUBLIC_WHATSAPP_NUMERO=573001234567      (indicativo + número, solo dígitos)
//   NEXT_PUBLIC_CORREO_SOLICITUDES=ventas@tuempresa.com
export const WHATSAPP_NUMERO = (process.env.NEXT_PUBLIC_WHATSAPP_NUMERO ?? '').replace(/\D/g, '');
export const CORREO_SOLICITUDES = (process.env.NEXT_PUBLIC_CORREO_SOLICITUDES ?? '').trim();

// Enlace a la solicitud especial, con la zona y el artículo ya rellenados
export function hrefSolicitud(zonaSlug, articulo) {
  const params = new URLSearchParams();
  if (zonaSlug) params.set('zona', zonaSlug);
  if (articulo) params.set('articulo', articulo);
  const texto = params.toString();
  return texto ? `/solicitud?${texto}` : '/solicitud';
}
