import {
  customerConversation,
  handleChat,
  json,
  markRead,
  readBody,
  sendMessage,
  thread,
  conversationById,
  refreshCustomerSession,
} from '@/lib/chat-server';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  return handleChat(async () => {
    const data = await readBody(request);
    const conversation = (await customerConversation(request))!;
    if (data.action === 'read') {
      await markRead(conversation, 'customer', data);
      return json({ ok: true });
    }
    await sendMessage(conversation, 'customer', data);
    return json(await thread(await conversationById(conversation.id)), 200, {
      'Set-Cookie': await refreshCustomerSession(request),
    });
  });
}
