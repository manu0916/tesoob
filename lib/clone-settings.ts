import { env } from 'cloudflare:workers';
import migration from '@/drizzle/0006_clone_settings.sql?raw';
import { normalizeWhatsApp } from './clone-whatsapp';

type CloneEnvironment = { DB?: D1Database };
type CloneSettingsRow = {
  whatsappNumber: string;
  updatedAt: number;
};

let initialized: Promise<void> | undefined;

async function cloneDatabase() {
  const db = (env as unknown as CloneEnvironment).DB;
  if (!db) return null;
  initialized ??= db
    .batch(
      migration
        .split('--> statement-breakpoint')
        .map((statement) => db.prepare(statement.trim())),
    )
    .then(() => undefined)
    .catch((error) => {
      initialized = undefined;
      throw error;
    });
  await initialized;
  return db;
}

export async function getCloneSettings(): Promise<CloneSettingsRow | null> {
  const db = await cloneDatabase();
  if (!db) return null;
  return await db
    .prepare(
      'SELECT whatsapp_number AS whatsappNumber, updated_at AS updatedAt FROM clone_settings WHERE id=1',
    )
    .first<CloneSettingsRow>();
}

export async function saveCloneSettings(value: string) {
  const whatsappNumber = normalizeWhatsApp(value);
  const db = await cloneDatabase();
  if (!db)
    throw new Error('O banco de dados do painel não está configurado.');
  const updatedAt = Date.now();
  await db
    .prepare(
      `INSERT INTO clone_settings(id,whatsapp_number,updated_at) VALUES (1,?,?)
       ON CONFLICT(id) DO UPDATE SET whatsapp_number=excluded.whatsapp_number,updated_at=excluded.updated_at`,
    )
    .bind(whatsappNumber, updatedAt)
    .run();
  return { whatsappNumber, updatedAt };
}
