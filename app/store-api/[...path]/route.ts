import { env } from 'cloudflare:workers';
import { handleStore } from '@/lib/store-server';
import type { StoreEnvironment } from '@/lib/store-security';

export const dynamic = 'force-dynamic';
const route = (request: Request) =>
  handleStore(request, env as unknown as StoreEnvironment);
export const GET = route;
export const HEAD = route;
export const POST = route;
export const PUT = route;
export const DELETE = route;
