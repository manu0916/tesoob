'use client';

import { useEffect, useRef, useState, type SubmitEvent } from 'react';
import { SiteLink as Link } from '@/components/site-link';
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Eye,
  EyeOff,
  Inbox,
  LockKeyhole,
  LoaderCircle,
  LogOut,
  MessageSquare,
  RotateCcw,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdminNavigation, AdminStoreAccess } from '@/components/admin-navigation';
import {
  ChatComposer,
  ChatLoading,
  ChatMessages,
  ChatRetry,
  chatRequest,
  errorMessage,
  useChatThread,
} from '@/components/chat-ui';
import {
  statusLabels,
  type ChatThread,
  type ConversationPreview,
  type OrderStatus,
} from '@/lib/chat-types';

type AdminSession = {
  authenticated: boolean;
  configured: boolean;
  setupAvailable: boolean;
};

export function AdminOrders() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [leaving, setLeaving] = useState(false);
  async function logout() {
    setLeaving(true);
    try {
      const response = await fetch('/api/admin/session', {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (!response.ok) throw new Error();
      setSession(null);
      setRetry((value) => value + 1);
    } catch {
      setError('Não foi possível sair. Tente novamente.');
    } finally {
      setLeaving(false);
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    chatRequest<AdminSession>(
      '/api/admin/session',
      undefined,
      controller.signal,
    )
      .then((data) => {
        setSession(data);
        setError('');
      })
      .catch((failure) => {
        if (failure.name !== 'AbortError') setError(errorMessage(failure));
      });
    return () => controller.abort();
  }, [retry]);
  return (
    <main className="admin-page">
      <header className="admin-header">
        <Link
          href="/"
          className="admin-brand"
          aria-label="Voltar ao site Tesoob"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/media/logo-tesoob.png"
            width={138}
            height={29}
            alt="Tesoob"
          />
        </Link>
        <span>ATELIÊ / ADMINISTRAÇÃO</span>
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
          <Link href="/">
            Voltar ao site <ArrowUpRight size={16} />
          </Link>
        )}
      </header>
      <div className="admin-intro">
        <div>
          <p className="eyebrow">DA IDEIA AO ÚLTIMO DETALHE</p>
          <h1>
            DO PRIMEIRO OI
            <br />
            <span>à próxima peça.</span>
          </h1>
        </div>
        <p>
          Cada conversa, uma possibilidade.
          <br />
          Receba as ideias e construa os próximos passos.
        </p>
      </div>
      {error ? (
        <ChatRetry
          message={error}
          onRetry={() => setRetry((value) => value + 1)}
        />
      ) : !session ? (
        <ChatLoading />
      ) : session.authenticated ? (
        <>
          <AdminNavigation current="orders" />
          <AdminStoreAccess />
          <OrderInbox />
        </>
      ) : (
        <AdminLogin session={session} onAuthenticated={setSession} />
      )}
      <footer className="admin-footer">
        <span>TESOOB / O COMUM FICOU PARA TRÁS.</span>
        <span>
          Site criado por <strong>emanuel silv</strong>
        </span>
      </footer>
    </main>
  );
}

function AdminLogin({
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
      const result = await chatRequest<AdminSession>('/api/admin/session', {
        action: setup ? 'setup' : 'login',
        email,
        password,
      });
      setPassword('');
      setConfirmation('');
      onAuthenticated(result);
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      busy.current = false;
      setSending(false);
    }
  }
  return (
    <section className="admin-login">
      <span className="admin-login-icon">
        <LockKeyhole size={30} strokeWidth={1.3} />
      </span>
      <p className="eyebrow">ACESSO DO ATELIÊ</p>
      <h2>
        {setup ? (
          <>
            SEU ACESSO.
            <br />
            SEU ATELIÊ.
          </>
        ) : (
          <>
            ENTRE PARA
            <br />
            CONTINUAR A CONVERSA.
          </>
        )}
      </h2>
      <p>
        {setup
          ? 'Cadastre seu e-mail e crie a senha que você vai usar para responder às encomendas.'
          : 'Entre com seu e-mail e senha para cuidar das próximas encomendas.'}
      </p>
      <form className="admin-login-form" onSubmit={submit}>
        <label htmlFor="admin-email">
          E-mail
          <Input
            id="admin-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            maxLength={254}
            disabled={sending}
            placeholder="seu@email.com"
          />
        </label>
        <label htmlFor="admin-password">
          {setup ? 'Crie sua senha' : 'Senha'}
        </label>
        <div className="admin-password-field">
          <Input
            id="admin-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete={setup ? 'new-password' : 'current-password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={setup ? 12 : undefined}
            maxLength={128}
            disabled={sending}
            placeholder={
              setup ? 'Pelo menos 12 caracteres' : 'Digite sua senha'
            }
          />
          <Button
            type="button"
            variant="ghost"
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((value) => !value)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </Button>
        </div>
        {setup && (
          <label htmlFor="admin-confirm-password">
            Confirme sua senha
            <Input
              id="admin-confirm-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              required
              minLength={12}
              maxLength={128}
              disabled={sending}
              placeholder="Digite a senha novamente"
            />
          </label>
        )}
        {error && (
          <p className="chat-error" role="alert">
            {error}
          </p>
        )}
        <Button
          className="action action-red admin-login-submit"
          type="submit"
          disabled={sending || (!session.configured && !setup)}
        >
          {sending
            ? 'Entrando…'
            : setup
              ? 'Criar meu acesso'
              : 'Entrar no painel'}
          {sending ? (
            <LoaderCircle className="chat-spin" size={18} />
          ) : (
            <ArrowUpRight size={18} />
          )}
        </Button>
        {!session.configured && !setup && (
          <p className="admin-access-note">
            O administrador deste site ainda precisa configurar o primeiro
            acesso.
          </p>
        )}
      </form>
      <small>
        {setup
          ? 'Este cadastro inicial fica disponível apenas na configuração local do site.'
          : 'Acesso reservado à administração da Tesoob.'}
      </small>
    </section>
  );
}

function OrderInbox() {
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | OrderStatus>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [older, setOlder] = useState<ConversationPreview[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    let controller: AbortController | undefined;
    let sequence = 0;
    const poll = async () => {
      if (document.hidden) {
        timer = setTimeout(poll, 7000);
        return;
      }
      controller?.abort();
      controller = new AbortController();
      const current = ++sequence;
      try {
        const data = await chatRequest<{
          conversations: ConversationPreview[];
          nextCursor: string | null;
        }>('/api/admin/conversations', undefined, controller.signal);
        if (alive && current === sequence) {
          setConversations(data.conversations);
          if (!older.length) setNextCursor(data.nextCursor);
          setError('');
        }
      } catch (failure) {
        if (
          alive &&
          current === sequence &&
          !(failure instanceof Error && failure.name === 'AbortError')
        )
          setError(errorMessage(failure));
      } finally {
        if (alive && current === sequence) {
          setLoading(false);
          timer = setTimeout(poll, 7000);
        }
      }
    };
    const visible = () => {
      if (!document.hidden) {
        clearTimeout(timer);
        void poll();
      }
    };
    void poll();
    document.addEventListener('visibilitychange', visible);
    return () => {
      alive = false;
      controller?.abort();
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [refresh, older.length]);
  const allConversations = [
    ...conversations,
    ...older.filter(
      (entry) => !conversations.some((recent) => recent.id === entry.id),
    ),
  ];
  const unread = allConversations.filter(
    (conversation) => conversation.status === 'new',
  ).length;
  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await chatRequest<{
        conversations: ConversationPreview[];
        nextCursor: string | null;
      }>(`/api/admin/conversations?before=${encodeURIComponent(nextCursor)}`);
      setOlder((previous) => [
        ...previous,
        ...data.conversations.filter(
          (entry) => !previous.some((old) => old.id === entry.id),
        ),
      ]);
      setNextCursor(data.nextCursor);
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setLoadingMore(false);
    }
  }
  function returnToList() {
    const previous = selectedId;
    setSelectedId(null);
    requestAnimationFrame(() =>
      document.getElementById(`order-${previous}`)?.focus(),
    );
  }
  const visible = allConversations.filter((conversation) => {
    const query =
      `${conversation.customerName} ${conversation.reference} ${conversation.contact} ${conversation.id}`.toLocaleLowerCase(
        'pt-BR',
      );
    return (
      (filter === 'all' ||
        (filter === 'unread'
          ? conversation.status === 'new'
          : conversation.status === filter)) &&
      query.includes(search.toLocaleLowerCase('pt-BR').trim())
    );
  });
  return (
    <section
      className={`admin-inbox ${selectedId ? 'admin-has-selection' : ''}`}
    >
      <aside className="admin-list-pane">
        <div className="admin-list-heading">
          <h2>ENCOMENDAS</h2>
          <span aria-label={`${unread} conversas para responder`}>
            {unread} A RESPONDER
          </span>
        </div>
        <label className="admin-search" htmlFor="order-search">
          <Search size={17} />
          <span className="sr-only">Buscar encomendas</span>
          <Input
            id="order-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nome, peça ou referência"
          />
        </label>
        <fieldset className="admin-filters" aria-label="Filtrar encomendas">
          {(
            [
              ['all', 'Todas'],
              ['unread', 'A responder'],
              ['new', 'Novas'],
              ['active', 'Em conversa'],
              ['closed', 'Finalizadas'],
            ] as const
          ).map(([value, label]) => (
            <Button
              key={value}
              variant="ghost"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {label}
            </Button>
          ))}
        </fieldset>
        {error && (
          <ChatRetry
            message={error}
            onRetry={() => setRefresh((value) => value + 1)}
          />
        )}
        <div
          className="admin-conversation-list"
          aria-label="Encomendas recebidas"
        >
          {loading ? (
            <ChatLoading />
          ) : visible.length ? (
            visible.map((conversation) => (
              <button
                type="button"
                key={conversation.id}
                id={`order-${conversation.id}`}
                className={`admin-conversation ${selectedId === conversation.id ? 'is-selected' : ''}`}
                aria-pressed={selectedId === conversation.id}
                onClick={() => setSelectedId(conversation.id)}
              >
                <span className="admin-conversation-top">
                  <strong>{conversation.customerName}</strong>
                  <time
                    dateTime={new Date(conversation.updatedAt).toISOString()}
                  >
                    {new Date(conversation.updatedAt).toLocaleDateString(
                      'pt-BR',
                      { day: '2-digit', month: '2-digit' },
                    )}
                  </time>
                </span>
                <span className="admin-conversation-reference">
                  {conversation.reference || 'Uma peça do seu jeito'}
                </span>
                <span className="admin-last-message">
                  {conversation.lastMessage}
                </span>
                <span className="admin-conversation-bottom">
                  <span
                    className={`chat-status chat-status-${conversation.status}`}
                  >
                    {statusLabels[conversation.status]}
                  </span>
                  {conversation.unread > 0 && (
                    <span
                      className="admin-unread"
                      aria-label={`${conversation.unread} mensagens não lidas`}
                    >
                      {conversation.unread}
                    </span>
                  )}
                </span>
              </button>
            ))
          ) : (
            <div className="admin-list-empty">
              <Inbox size={28} strokeWidth={1.3} />
              <p>
                {conversations.length
                  ? 'Nenhuma encomenda neste filtro.'
                  : 'As próximas ideias chegam aqui.'}
              </p>
            </div>
          )}
          {nextCursor && (
            <Button
              className="admin-load-more"
              variant="ghost"
              disabled={loadingMore}
              onClick={() => void loadMore()}
            >
              {loadingMore ? 'Carregando…' : 'Carregar encomendas anteriores'}
            </Button>
          )}
        </div>
      </aside>
      {selectedId ? (
        <AdminConversation
          key={selectedId}
          id={selectedId}
          onBack={returnToList}
          onChange={() => setRefresh((value) => value + 1)}
        />
      ) : (
        <div className="admin-empty">
          <MessageSquare size={54} strokeWidth={1} />
          <p className="eyebrow">O ATELIÊ ESTÁ ABERTO PARA IDEIAS</p>
          <h2>
            ESCUTE A IDEIA.
            <br />
            <span>crie a conexão.</span>
          </h2>
          <p>
            Selecione uma encomenda para ler a conversa
            <br />e responder ao cliente.
          </p>
        </div>
      )}
    </section>
  );
}

function AdminConversation({
  id,
  onBack,
  onChange,
}: {
  id: string;
  onBack: () => void;
  onChange: () => void;
}) {
  const endpoint = `/api/admin/conversations/${id}`;
  const {
    thread,
    setThread,
    loading,
    error,
    setError,
    refresh,
    markSeen,
    loadEarlier,
    loadingEarlier,
  } = useChatThread(endpoint);
  const [updating, setUpdating] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!loading) heading.current?.focus();
  }, [loading]);
  async function setStatus(status: OrderStatus) {
    if (updating) return;
    setUpdating(true);
    setError('');
    try {
      setThread(
        await chatRequest<ChatThread>(endpoint, { action: 'status', status }),
      );
      onChange();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setUpdating(false);
    }
  }
  return (
    <div className="admin-thread">
      <Button className="admin-back" variant="ghost" onClick={onBack}>
        <ArrowLeft size={17} /> Voltar às encomendas
      </Button>
      {loading ? (
        <ChatLoading />
      ) : thread ? (
        <>
          <div className="admin-thread-heading">
            <div>
              <p className="eyebrow">
                ENCOMENDA / {id.slice(0, 8).toUpperCase()}
              </p>
              <h2 ref={heading} tabIndex={-1}>
                {thread.conversation.customerName}
              </h2>
            </div>
            <Button
              className="admin-status-action"
              variant="outline"
              disabled={updating}
              onClick={() =>
                void setStatus(
                  thread.conversation.status === 'closed' ? 'active' : 'closed',
                )
              }
            >
              {thread.conversation.status === 'closed' ? (
                <RotateCcw size={16} />
              ) : (
                <Check size={16} />
              )}
              {thread.conversation.status === 'closed'
                ? 'Reabrir'
                : 'Finalizar'}
            </Button>
          </div>
          <div className="admin-order-details">
            <span
              className={`chat-status chat-status-${thread.conversation.status}`}
            >
              {statusLabels[thread.conversation.status]}
            </span>
            <p>{thread.conversation.reference || 'Uma peça do seu jeito'}</p>
            {thread.conversation.contact && (
              <p>Contato: {thread.conversation.contact}</p>
            )}
          </div>
          {error && <ChatRetry message={error} onRetry={refresh} />}
          <ChatMessages
            messages={thread.messages}
            admin
            onSeen={markSeen}
            hasEarlier={thread.hasEarlier}
            loadEarlier={loadEarlier}
            loadingEarlier={loadingEarlier}
          />
          <ChatComposer
            endpoint={endpoint}
            admin
            onSent={(result) => {
              setThread(result);
              onChange();
            }}
          />
        </>
      ) : (
        <ChatRetry
          message={error || 'Não foi possível abrir esta encomenda.'}
          onRetry={refresh}
        />
      )}
    </div>
  );
}
