'use client';

import { useEffect, useState, type SubmitEvent } from 'react';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import { GoogleMark } from '@/components/google-mark';
import { SiteLink as Link } from '@/components/site-link';
import { StoreFrame, StoreNotice } from '@/components/storefront';
import {
  safeReturn,
  storeApi,
  storeMessage,
  type StoreUser,
} from '@/lib/store-api';

export function StoreGoogleOnboarding() {
  const [user, setUser] = useState<StoreUser | null>(null);
  const [nickname, setNickname] = useState('');
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    storeApi<StoreUser>('/auth/me', { signal: controller.signal })
      .then((account) => {
        if (controller.signal.aborted) return;
        if (account.role !== 'CUSTOMER' || !account.onboardingRequired) {
          window.location.replace('/loja/conta');
          return;
        }
        setUser(account);
        setNickname(account.displayName || '');
      })
      .catch(() => {
        if (!controller.signal.aborted)
          window.location.replace('/loja/conta');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  async function complete(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await storeApi<StoreUser>('/auth/google/complete', {
        method: 'POST',
        body: JSON.stringify({ nickname, legalAccepted }),
      });
      const destination = safeReturn(sessionStorage.getItem('store:return'));
      sessionStorage.removeItem('store:return');
      window.location.assign(destination);
    } catch (reason) {
      setError(storeMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  return (
    <StoreFrame>
      {loading || !user ? (
        <StoreNotice>Preparando seu último passo…</StoreNotice>
      ) : (
        <div className="store-google-onboarding">
          <section className="store-google-onboarding-story">
            <p className="store-kicker">GOOGLE CONECTADO / ÚLTIMO PASSO</p>
            <h1>COMO A GENTE TE CHAMA?</h1>
            <p>
              Seu nome veio do Google. Você pode deixar assim ou escolher o
              apelido que vai aparecer na sua conta Tesoob.
            </p>
            <span>
              <ShieldCheck size={18} /> Seu login já está protegido pelo Google.
            </span>
          </section>

          <section className="store-glass store-google-onboarding-card">
            <div className="store-google-account">
              <span className="store-google-icon">
                <GoogleMark />
              </span>
              <div>
                <small>CONTA GOOGLE</small>
                <p>{user.email}</p>
              </div>
              <strong>CONECTADO</strong>
            </div>

            <form onSubmit={complete}>
              <label>
                Apelido na loja
                <input
                  name="nickname"
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  autoComplete="name"
                  minLength={2}
                  maxLength={40}
                  required
                />
              </label>
              <p className="store-fine-print">
                Preenchemos com o nome do Google. Edite se quiser.
              </p>
              <label className="store-checkbox store-legal-consent store-google-consent">
                <input
                  type="checkbox"
                  checked={legalAccepted}
                  onChange={(event) => setLegalAccepted(event.target.checked)}
                  required
                />
                <span>
                  Li e aceito os <Link href="/termos-de-uso">Termos de Uso</Link>{' '}
                  e a{' '}
                  <Link href="/politica-de-privacidade">
                    Política de Privacidade
                  </Link>
                  .
                </span>
              </label>
              <button className="store-button" disabled={busy} type="submit">
                {busy ? 'Criando sua conta…' : 'Criar minha conta'}
                <ArrowUpRight size={18} />
              </button>
            </form>
            {error && (
              <p className="store-error" role="alert">
                {error}
              </p>
            )}
          </section>
        </div>
      )}
    </StoreFrame>
  );
}
