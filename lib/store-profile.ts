import {
  decryptCheckout,
  encryptCheckout,
  fail,
  fields,
  textField,
  type StoreEnvironment,
} from './store-security';

const STATES =
  'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(
    ' ',
  );

function validCpf(value: string) {
  if (!/^\d{11}$/.test(value) || new Set(value).size === 1) return false;
  for (let n = 9; n <= 10; n++) {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += Number(value[i]) * (n + 1 - i);
    if (((sum * 10) % 11) % 10 !== Number(value[n])) return false;
  }
  return true;
}

export type UserProfile = {
  recipient: string;
  document: string;
  postalCode: string;
  street: string;
  number: string;
  complement: string | null;
  district: string;
  city: string;
  state: string;
};

function profileInput(data: Record<string, unknown>): UserProfile {
  fields(data, [
    'recipient',
    'document',
    'postalCode',
    'street',
    'number',
    'complement',
    'district',
    'city',
    'state',
  ]);
  const profile: UserProfile = {
    recipient: textField(data, 'recipient', 140),
    document: textField(data, 'document', 11),
    postalCode: textField(data, 'postalCode', 8),
    street: textField(data, 'street', 160),
    number: textField(data, 'number', 20),
    complement: textField(data, 'complement', 100, true) || null,
    district: textField(data, 'district', 100),
    city: textField(data, 'city', 100),
    state: textField(data, 'state', 2),
  };
  if (
    !validCpf(profile.document) ||
    !/^\d{8}$/.test(profile.postalCode) ||
    !STATES.includes(profile.state)
  )
    return fail(400, 'Confira nome, CPF, CEP e estado.');
  return profile;
}

export async function saveUserProfile(
  db: D1Database,
  settings: StoreEnvironment,
  userId: string,
  data: Record<string, unknown>,
): Promise<UserProfile> {
  const profile = profileInput(data);
  const encrypted = await encryptCheckout(
    settings,
    JSON.stringify(profile),
    `profile/${userId}`,
  );
  await db
    .prepare(
      `INSERT INTO store_user_profiles(user_id,profile_ciphertext,updated_at) VALUES (?,?,?)
       ON CONFLICT(user_id) DO UPDATE SET profile_ciphertext=excluded.profile_ciphertext, updated_at=excluded.updated_at`,
    )
    .bind(userId, encrypted, Date.now())
    .run();
  return profile;
}

export async function getUserProfile(
  db: D1Database,
  settings: StoreEnvironment,
  userId: string,
): Promise<UserProfile | null> {
  const row = await db
    .prepare(
      'SELECT profile_ciphertext FROM store_user_profiles WHERE user_id=?',
    )
    .bind(userId)
    .first<{ profile_ciphertext: string }>();
  if (!row) return null;
  const plain = await decryptCheckout(
    settings,
    row.profile_ciphertext,
    `profile/${userId}`,
  );
  return JSON.parse(plain) as UserProfile;
}
