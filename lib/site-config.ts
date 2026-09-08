/** Informe o telefone verdadeiro em formato internacional (país + DDD + número), só dígitos. */
export const siteConfig = {
  name: 'Tesoob',
  instagram: 'https://www.instagram.com/vistatesoob/',
  creatorInstagram: 'https://www.instagram.com/luciorique02/',
  whatsappNumber: null as string | null,
  publicOrigin: 'https://vistatesoob.emanuel1093613.chatgpt.site',
};

export function validWhatsAppNumber(number: string | null): number is string {
  return !!number && /^[1-9]\d{9,14}$/.test(number);
}
export const hasWhatsApp = validWhatsAppNumber(siteConfig.whatsappNumber);

export type OrderInput = {
  reference?: string;
  piece?: string;
  size?: string;
  notes?: string;
  publicUrl?: string;
};
export function orderMessage(input: OrderInput = {}) {
  if (!input.reference)
    return 'Oi, Tesoob! Vim pelo site e gostaria de conversar sobre uma encomenda.';
  const lines = [
    'Oi, Tesoob! Vim pelo site e tenho interesse nesta referência:',
    input.reference,
  ];
  if (
    input.publicUrl &&
    siteConfig.publicOrigin &&
    input.publicUrl.startsWith(`${siteConfig.publicOrigin}/`)
  )
    lines.push(input.publicUrl);
  lines.push('');
  for (const [label, value] of [
    ['Peça de interesse', input.piece],
    ['Tamanho ou medidas', input.size],
    ['Observações', input.notes],
  ]) {
    if (value?.trim()) lines.push(`${label}: ${value.trim()}`);
  }
  lines.push(
    '',
    'Queria saber sobre valores, disponibilidade e possibilidades para encomendar.',
  );
  return lines.join('\n');
}
export function contactUrl(input: OrderInput = {}) {
  return hasWhatsApp
    ? `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(orderMessage(input))}`
    : siteConfig.instagram;
}
export function absoluteUrl(path: string) {
  return siteConfig.publicOrigin
    ? new URL(path, siteConfig.publicOrigin).toString()
    : undefined;
}
