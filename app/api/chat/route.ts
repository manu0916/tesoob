import {
  createConversation,
  customerConversation,
  customerSession,
  customerSessionExpired,
  refreshCustomerSession,
  handleChat,
  json,
  readBody,
  thread,
} from '@/lib/chat-server';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return handleChat(async () => {
    const session = customerSession(
      request,
      await customerSessionExpired(request),
    );
    const conversation = await customerConversation(request, false);
    return json(
      conversation
        ? await thread(
            conversation,
            new URL(request.url).searchParams.get('before'),
          )
        : { conversation: null, messages: [], hasEarlier: false },
      200,
      { 'Set-Cookie': conversation ? await refreshCustomerSession(request) : session.header },
    );
  });
}
export async function POST(request: Request) {
  return handleChat(async () =>
    json(
      await thread(await createConversation(request, await readBody(request))),
      201,
      { 'Set-Cookie': await refreshCustomerSession(request) },
    ),
  );
}
