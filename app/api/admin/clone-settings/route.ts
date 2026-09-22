import {
  ChatError,
  handleChat,
  json,
  requireAdmin,
} from '@/lib/chat-server';
import { getCloneSettings, saveCloneSettings } from '@/lib/clone-settings';
import { WhatsAppValidationError } from '@/lib/clone-whatsapp';

export const dynamic = 'force-dynamic';

async function readSettingsBody(request: Request) {
  if (
    request.headers.get('origin') !== new URL(request.url).origin ||
    request.headers.get('sec-fetch-site') === 'cross-site'
  )
    throw new ChatError(403, 'Atualize o painel e tente novamente.');
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    throw new ChatError(415, 'Envie os dados em JSON.');
  const reader = request.body?.getReader();
  if (!reader) throw new ChatError(400, 'Preencha o número ou link.');
  const parts: Uint8Array[] = [];
  let length = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > 4096) {
      await reader.cancel();
      throw new ChatError(413, 'Conteúdo muito grande.');
    }
    parts.push(value);
  }
  const body = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    body.set(part, offset);
    offset += part.length;
  }
  try {
    const data: unknown = JSON.parse(new TextDecoder().decode(body));
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error();
    return data as Record<string, unknown>;
  } catch {
    throw new ChatError(400, 'Não foi possível ler a configuração.');
  }
}

export async function GET(request: Request) {
  return handleChat(async () => {
    await requireAdmin(request);
    return json({ settings: await getCloneSettings() });
  });
}

export async function PUT(request: Request) {
  return handleChat(async () => {
    await requireAdmin(request);
    const data = await readSettingsBody(request);
    if (
      !data ||
      typeof data !== 'object' ||
      Array.isArray(data) ||
      Object.keys(data).some((key) => key !== 'whatsapp') ||
      typeof data.whatsapp !== 'string' ||
      data.whatsapp.length > 500
    )
      throw new ChatError(400, 'Confira o número ou link do WhatsApp.');
    try {
      return json({ settings: await saveCloneSettings(data.whatsapp) });
    } catch (error) {
      if (error instanceof WhatsAppValidationError)
        throw new ChatError(400, error.message);
      throw error;
    }
  });
}
