import {
  handleChat,
  json,
  listConversations,
  requireAdmin,
} from '@/lib/chat-server';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return handleChat(async () => {
    await requireAdmin(request);
    return json(
      await listConversations(new URL(request.url).searchParams.get('before')),
    );
  });
}
