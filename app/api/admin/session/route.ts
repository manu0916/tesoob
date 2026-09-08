import {
  adminOptions,
  handleChat,
  isAdmin,
  json,
  loginAdmin,
  logoutAdmin,
  readBody,
  setupAdmin,
} from '@/lib/chat-server';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return handleChat(async () =>
    json({
      authenticated: await isAdmin(request),
      ...(await adminOptions(request)),
    }),
  );
}

export async function POST(request: Request) {
  return handleChat(async () => {
    const data = await readBody(request);
    const cookie =
      data.action === 'setup'
        ? await setupAdmin(request, data)
        : await loginAdmin(request, data);
    return json(
      { authenticated: true, configured: true, setupAvailable: false },
      200,
      { 'Set-Cookie': cookie },
    );
  });
}

export async function DELETE(request: Request) {
  return handleChat(async () =>
    json({ authenticated: false }, 200, {
      'Set-Cookie': await logoutAdmin(request),
    }),
  );
}
