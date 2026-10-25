// lib/contacto.js
// Enlace a la solicitud especial con el artículo ya elegido:
//   hrefSolicitud({ zonaSlug, productoId, tallaId })   → una prenda y su talla
//   hrefSolicitud({ zonaSlug, accesorioId })           → un accesorio
// (La solicitud se guarda en la base de datos desde /api/solicitudes; ya no depende
//  de números de WhatsApp ni de correos configurados.)
export function hrefSolicitud({ zonaSlug, productoId, tallaId, accesorioId } = {}) {
  const params = new URLSearchParams();
  if (zonaSlug) params.set('zona', zonaSlug);
  if (productoId) params.set('producto', productoId);
  if (tallaId) params.set('talla', tallaId);
  if (accesorioId) params.set('accesorio', accesorioId);
  const texto = params.toString();
  return texto ? `/solicitud?${texto}` : '/solicitud';
}
