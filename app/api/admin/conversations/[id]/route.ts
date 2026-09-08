import {
  changeStatus,
  conversationById,
  handleChat,
  json,
  markRead,
  readBody,
  requireAdmin,
  sendMessage,
  thread,
} from '@/lib/chat-server';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  return handleChat(async () => {
    await requireAdmin(request);
    return json(
      await thread(
        await conversationById((await context.params).id),
        new URL(request.url).searchParams.get('before'),
      ),
    );
  });
}
export async function POST(request: Request, context: Context) {
  return handleChat(async () => {
    const data = await readBody(request);
    await requireAdmin(request);
    const conversation = await conversationById((await context.params).id);
    if (data.action === 'status') await changeStatus(conversation, data.status);
    else if (data.action === 'read') {
      await markRead(conversation, 'admin', data);
      return json({ ok: true });
    } else await sendMessage(conversation, 'admin', data);
    return json(await thread(await conversationById(conversation.id)));
  });
}
