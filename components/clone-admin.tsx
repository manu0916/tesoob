/* oxlint-disable next/no-img-element -- The local brand asset is already optimized and must remain exact. */
'use client';

import { useEffect, useRef, useState, type SubmitEvent } from 'react';
import {
  ArrowUpRight,
  Check,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  MessageCircle,
  Save,
} from 'lucide-react';
import { SiteLink as Link } from '@/components/site-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cloneWhatsAppUrl, formattedWhatsApp } from '@/lib/clone-whatsapp';

type AdminSession = {
  authenticated: boolean;
  configured: boolean;
  setupAvailable: boolean;
};

type Settings = {
  whatsappNumber: string;
  updatedAt: number;
};

async function api<T>(url: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  if (init?.body) headers.set('Content-Type', 'application/json');
  const response = await fetch(url, {
    credentials: 'same-origin',
    ...init,
    headers,
  });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || 'Não foi possível concluir.');
  return data;
}

export function CloneAdmin() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    api<AdminSession>('/api/admin/session', { signal: controller.signal })
      .then((data) => {
        setSession(data);
        setError('');
      })
      .catch((failure) => {
        if (failure.name !== 'AbortError') setError(failure.message);
      });
    return () => controller.abort();
  }, [retry]);

  async function logout() {
    setLeaving(true);
    setError('');
    try {
      await api('/api/admin/session', { method: 'DELETE' });
      setSession(null);
      setRetry((value) => value + 1);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Não foi possível sair.');
    } finally {
      setLeaving(false);
    }
  }

  return (
    <main className="admin-page clone-admin-page">
      <header className="admin-header">
        <Link href="/admin" className="admin-brand" aria-label="Voltar ao painel Tesoob">
          <img src="/media/logo-tesoob.png" width={138} height={29} alt="Tesoob" />
        </Link>
        <span>CLONE / ADMINISTRAÇÃO</span>
        {session?.authenticated ? (
          <Button
            className="admin-logout"
            variant="ghost"
            onClick={() => void logout()}
            disabled={leaving}
          >
            Sair <LogOut size={16} />
          </Button>
        ) : (
          <Link href="/clone">
            Ver clone <ArrowUpRight size={16} />
          </Link>
        )}
      </header>

      <div className="admin-intro clone-admin-intro">
        <div>
          <p className="eyebrow">CONTATO / PÁGINA ESPELHO</p>
          <h1>
            UM LINK.
            <br />
            <span>Direto ao WhatsApp.</span>
          </h1>
        </div>
        <p>
          O clone não possui chat nem contas de clientes.
          <br />
          Defina aqui o único destino das encomendas.
        </p>
      </div>

      {error && (
        <div className="clone-admin-error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => setRetry((value) => value + 1)}>
            Tentar novamente
          </button>
        </div>
      )}

      {!session ? (
        <div className="clone-admin-loading" aria-label="Carregando painel">
          <LoaderCircle className="chat-spin" />
        </div>
      ) : session.authenticated ? (
        <CloneSettings />
      ) : (
        <CloneAdminLogin session={session} onAuthenticated={setSession} />
      )}

      <footer className="admin-footer">
        <span>TESOOB / CLONE SEM CHAT E SEM CONTAS.</span>
        <span>
          Site criado por <strong>emanuel silv</strong>
        </span>
      </footer>
    </main>
  );
}

function CloneAdminLogin({
  session,
  onAuthenticated,
}: {
  session: AdminSession;
  onAuthenticated: (session: AdminSession) => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const setup = session.setupAvailable;

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    if (setup && password !== confirmation) {
      setError('As senhas precisam ser iguais.');
      return;
    }
    busy.current = true;
    setSending(true);
    setError('');
    try {
      const result = await api<AdminSession>('/api/admin/session', {
        method: 'POST',
        body: JSON.stringify({ action: setup ? 'setup' : 'login', email, password }),
      });
      setPassword('');
      setConfirmation('');
      onAuthenticated(result);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Não foi possível entrar.');
    } finally {
      busy.current = false;
      setSending(false);
    }
  }

  return (
    <section className="admin-login clone-admin-login">
      <span className="admin-login-icon">
        <LockKeyhole size={30} strokeWidth={1.3} />
      </span>
      <p className="eyebrow">ACESSO DO ATELIÊ</p>
      <h2>{setup ? 'Crie o acesso administrativo.' : 'Entre para configurar.'}</h2>
      <p>Este acesso é exclusivo da equipe e não cria contas no clone.</p>
      <form className="admin-login-form" onSubmit={(event) => void submit(event)}>
        <label htmlFor="clone-admin-email">E-mail</label>
        <Input
          id="clone-admin-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <label htmlFor="clone-admin-password">Senha</label>
        <div className="admin-password-field">
          <Input
            id="clone-admin-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete={setup ? 'new-password' : 'current-password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={setup ? 12 : 1}
            required
          />
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </Button>
        </div>
        {setup && (
          <>
            <label htmlFor="clone-admin-confirmation">Confirme a senha</label>
            <Input
              id="clone-admin-confirmation"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              minLength={12}
              required
            />
          </>
        )}
        {error && <p className="admin-login-error" role="alert">{error}</p>}
        <Button className="admin-login-submit" type="submit" disabled={sending}>
          {sending ? <LoaderCircle className="chat-spin" size={17} /> : <LockKeyhole size={17} />}
          {setup ? 'Criar acesso' : 'Entrar'}
        </Button>
      </form>
    </section>
  );
}

function CloneSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    api<{ settings: Settings | null }>('/api/admin/clone-settings', {
      signal: controller.signal,
    })
      .then((result) => {
        setSettings(result.settings);
        setValue(formattedWhatsApp(result.settings?.whatsappNumber ?? null));
      })
      .catch((failure) => {
        if (failure.name !== 'AbortError') setError(failure.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  async function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const result = await api<{ settings: Settings }>('/api/admin/clone-settings', {
        method: 'PUT',
        body: JSON.stringify({ whatsapp: value }),
      });
      setSettings(result.settings);
      setValue(formattedWhatsApp(result.settings.whatsappNumber));
      setNotice('WhatsApp atualizado. Todos os botões do clone já usam este contato.');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="clone-admin-workspace">
      <nav className="admin-workspace-nav" aria-label="Navegação do clone">
        <div>
          <Link href="/admin/clone" aria-current="page">
            <MessageCircle size={16} aria-hidden="true" /> Configuração
          </Link>
        </div>
        <Link href="/clone" className="admin-preview-link">
          Ver clone <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </nav>
      <section className="clone-settings-card" aria-labelledby="clone-settings-title">
        <div className="clone-settings-heading">
          <span className="clone-settings-icon"><MessageCircle size={24} /></span>
          <div>
            <p className="eyebrow">DESTINO DOS BOTÕES</p>
            <h2 id="clone-settings-title">WHATSAPP DO CLONE.</h2>
            <p>
              Aceita o número completo com DDI ou um link oficial, como{' '}
              <strong>https://wa.me/5535999999999</strong>.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="clone-admin-loading"><LoaderCircle className="chat-spin" /></div>
        ) : (
          <form className="clone-settings-form" onSubmit={(event) => void save(event)}>
            <label htmlFor="clone-whatsapp">Número ou link do WhatsApp</label>
            <Input
              id="clone-whatsapp"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="+55 35 99999-9999 ou https://wa.me/..."
              autoComplete="tel"
              maxLength={500}
              required
            />
            <small>Inclua o DDI do país. Para o Brasil, comece com +55.</small>
            {error && <p className="clone-settings-error" role="alert">{error}</p>}
            {notice && <output className="clone-settings-notice"><Check size={17} />{notice}</output>}
            <div className="clone-settings-actions">
              <Button type="submit" disabled={saving}>
                {saving ? <LoaderCircle className="chat-spin" size={17} /> : <Save size={17} />}
                Salvar WhatsApp
              </Button>
              <a
                href={cloneWhatsAppUrl(settings?.whatsappNumber ?? null)}
                target="_blank"
                rel="noopener noreferrer"
                className="clone-settings-test"
              >
                Testar contato <ArrowUpRight size={16} />
              </a>
              <Link href="/clone" target="_blank" className="clone-settings-preview">
                Abrir clone <ArrowUpRight size={16} />
              </Link>
            </div>
            <p className="clone-settings-meta">
              {settings
                ? `Última atualização: ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(settings.updatedAt)}`
                : 'Nenhum contato específico salvo. Até configurar, o clone abre o WhatsApp sem destinatário fixo.'}
            </p>
          </form>
        )}
      </section>
    </div>
  );
}
