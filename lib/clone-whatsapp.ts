import { orderMessage, type OrderInput } from './site-config';

const WHATSAPP_HOSTS = new Set([
  'wa.me',
  'api.whatsapp.com',
  'web.whatsapp.com',
  'www.whatsapp.com',
  'whatsapp.com',
]);

export class WhatsAppValidationError extends Error {}

function validNumber(value: string) {
  return /^[1-9]\d{9,14}$/.test(value);
}

export function normalizeWhatsApp(value: string) {
  const input = value.trim();
  if (!input) throw new WhatsAppValidationError('Informe o número ou link do WhatsApp.');

  let number = '';
  if (/^https?:\/\//i.test(input)) {
    let url: URL;
    try {
      url = new URL(input);
    } catch {
      throw new WhatsAppValidationError('Informe um link válido do WhatsApp.');
    }
    if (url.protocol !== 'https:' || !WHATSAPP_HOSTS.has(url.hostname.toLowerCase()))
      throw new WhatsAppValidationError('Use um link oficial do WhatsApp, como wa.me.');
    number =
      url.hostname.toLowerCase() === 'wa.me'
        ? url.pathname.split('/').filter(Boolean)[0] || ''
        : url.searchParams.get('phone') || '';
  } else {
    if (!/^\+?[\d\s().-]+$/.test(input))
      throw new WhatsAppValidationError('Use somente o número com DDI ou um link oficial do WhatsApp.');
    number = input;
  }

  const digits = number.replace(/\D/g, '');
  if (!validNumber(digits))
    throw new WhatsAppValidationError('Informe o número com DDI, DDD e telefone, usando de 10 a 15 dígitos.');
  return digits;
}

export function cloneWhatsAppUrl(
  number: string | null,
  input: OrderInput = {},
) {
  const base = number ? `https://wa.me/${number}` : 'https://wa.me/';
  return `${base}?text=${encodeURIComponent(orderMessage(input))}`;
}

export function formattedWhatsApp(number: string | null) {
  return number ? `+${number}` : '';
}
