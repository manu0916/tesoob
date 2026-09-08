'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type SubmitEvent,
} from 'react';
import { ArrowUpRight, LoaderCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { ChatMessage, ChatThread } from '@/lib/chat-types';

export class RequestError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function chatRequest<T>(
  path: string,
  data?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(path, {
    method: data === undefined ? 'GET' : 'POST',
    credentials: 'same-origin',
    cache: 'no-store',
    signal,
    headers:
      data === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const result: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail =
      result && typeof result === 'object' && 'error' in result
        ? result.error
        : null;
    throw new RequestError(
      typeof detail === 'string'
        ? detail
        : 'Não foi possível conectar. Tente novamente.',
      response.status,
    );
  }
  return result as T;
}
export function errorMessage(error: unknown) {
  return error instanceof RequestError
    ? error.message
    : 'Não foi possível conectar. Confira sua conexão e tente novamente.';
}

function mergeThread(previous: ChatThread | null, next: ChatThread) {
  if (!previous || previous.conversation.id !== next.conversation.id)
    return next;
  const combined = new Map(
    [...previous.messages, ...next.messages].map((message) => [
      message.id,
      message,
    ]),
  );
  const previousFirst = previous.messages[0]?.id || Infinity;
  const nextFirst = next.messages[0]?.id || Infinity;
  return {
    ...next,
    messages: [...combined.values()].sort((a, b) => a.id - b.id),
    hasEarlier:
      previousFirst < nextFirst ? previous.hasEarlier : next.hasEarlier,
  };
}

export function useChatThread(path: string, active = true) {
  const [thread, setThreadState] = useState<ChatThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const seen = useRef(0);
  const revision = useRef(0);
  const refresh = useCallback(() => setReload((value) => value + 1), []);
  const setThread = useCallback(
    (value: ChatThread) => {
      revision.current += 1;
      setThreadState((previous) => mergeThread(previous, value));
      refresh();
    },
    [refresh],
  );
  useEffect(() => {
    if (!active) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    let controller: AbortController | undefined;
    let sequence = 0;
    const poll = async () => {
      if (document.hidden) {
        timer = setTimeout(poll, 5000);
        return;
      }
      controller?.abort();
      controller = new AbortController();
      const current = ++sequence;
      const currentRevision = revision.current;
      try {
        const result = await chatRequest<ChatThread>(
          path,
          undefined,
          controller.signal,
        );
        if (
          alive &&
          current === sequence &&
          currentRevision === revision.current
        ) {
          setThreadState((previous) =>
            result.conversation ? mergeThread(previous, result) : null,
          );
          setError('');
        }
      } catch (failure) {
        if (
          alive &&
          current === sequence &&
          currentRevision === revision.current &&
          !(failure instanceof Error && failure.name === 'AbortError')
        )
          setError(errorMessage(failure));
      } finally {
        if (alive && current === sequence) {
          setLoading(false);
          timer = setTimeout(poll, 5000);
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
  }, [path, active, reload]);
  const markSeen = useCallback(
    async (throughId: number) => {
      if (!active || document.hidden || throughId <= seen.current) return;
      try {
        await chatRequest(path === '/api/chat' ? '/api/chat/messages' : path, {
          action: 'read',
          throughId,
        });
        seen.current = Math.max(seen.current, throughId);
      } catch {
        /* A later poll retries the read marker without losing the conversation. */
      }
    },
    [path, active],
  );
  const loadEarlier = useCallback(async () => {
    if (!thread?.hasEarlier || loadingEarlier || !thread.messages[0]) return;
    setLoadingEarlier(true);
    try {
      const result = await chatRequest<ChatThread>(
        `${path}?before=${thread.messages[0].id}`,
      );
      setThreadState((previous) =>
        previous
          ? {
              ...mergeThread(previous, result),
              conversation: previous.conversation,
            }
          : result,
      );
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setLoadingEarlier(false);
    }
  }, [thread, path, loadingEarlier]);
  return {
    thread,
    setThread,
    loading,
    error,
    setError,
    refresh,
    markSeen,
    loadEarlier,
    loadingEarlier,
  };
}

export function ChatMessages({
  messages,
  admin = false,
  onSeen,
  hasEarlier,
  loadEarlier,
  loadingEarlier,
}: {
  messages: ChatMessage[];
  admin?: boolean;
  onSeen: (id: number) => void;
  hasEarlier?: boolean;
  loadEarlier?: () => void;
  loadingEarlier?: boolean;
}) {
  const scrollArea = useRef<HTMLDivElement>(null);
  const follow = useRef(true);
  const lastId = messages.at(-1)?.id || 0;
  useEffect(() => {
    if (scrollArea.current && follow.current) {
      scrollArea.current.scrollTop = scrollArea.current.scrollHeight;
      if (lastId) onSeen(lastId);
    }
  }, [lastId, onSeen, messages]);
  return (
    <div
      className="chat-messages"
      ref={scrollArea}
      role="log"
      aria-label="Mensagens da conversa"
      aria-live="polite"
      aria-relevant="additions text"
      onScroll={() => {
        const area = scrollArea.current;
        if (!area) return;
        follow.current =
          area.scrollHeight - area.scrollTop - area.clientHeight < 90;
        if (follow.current && lastId) onSeen(lastId);
      }}
    >
      <p className="chat-transcript-note">UMA IDEIA. UMA CONVERSA. UMA PEÇA.</p>
      {hasEarlier && (
        <Button
          className="chat-load-earlier"
          variant="ghost"
          disabled={loadingEarlier}
          onClick={() => {
            follow.current = false;
            loadEarlier?.();
          }}
        >
          {loadingEarlier ? 'Carregando…' : 'Ver mensagens anteriores'}
        </Button>
      )}
      {messages.map((message, index) => {
        const own = message.sender === (admin ? 'admin' : 'customer');
        const date = new Date(message.createdAt);
        const previous =
          index > 0
            ? new Date(messages[index - 1].createdAt).toDateString()
            : '';
        return (
          <div key={message.id}>
            {date.toDateString() !== previous && (
              <p className="chat-date">
                {date.toLocaleDateString('pt-BR', {
                  day: 'numeric',
                  month: 'short',
                })}
              </p>
            )}
            <article
              className={`chat-message ${own ? 'chat-message-own' : ''}`}
            >
              <div className="chat-message-label">
                <span>
                  {message.sender === 'admin'
                    ? 'TESOOB'
                    : admin
                      ? 'CLIENTE'
                      : 'VOCÊ'}
                </span>
                <time dateTime={date.toISOString()}>
                  {date.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
              </div>
              <p>{message.body}</p>
            </article>
          </div>
        );
      })}
    </div>
  );
}

export function ChatComposer({
  endpoint,
  onSent,
  admin = false,
}: {
  endpoint: string;
  onSent: (thread: ChatThread) => void;
  admin?: boolean;
}) {
  const composerId = useId();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef<{ body: string; id: string } | null>(null);
  const busy = useRef(false);
  const input = useRef<HTMLTextAreaElement>(null);
  const focusAfterSend = useRef(false);
  useEffect(() => {
    if (!sending && focusAfterSend.current) {
      focusAfterSend.current = false;
      input.current?.focus();
    }
  }, [sending]);
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = message.trim();
    if (!body || busy.current) return;
    busy.current = true;
    setSending(true);
    setError('');
    if (pending.current?.body !== body)
      pending.current = { body, id: crypto.randomUUID() };
    try {
      const result = await chatRequest<ChatThread>(endpoint, {
        message: body,
        clientId: pending.current.id,
      });
      onSent(result);
      setMessage('');
      pending.current = null;
      focusAfterSend.current = true;
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      busy.current = false;
      setSending(false);
    }
  }
  return (
    <form className="chat-composer" onSubmit={submit}>
      <label className="sr-only" htmlFor={composerId}>
        {admin ? 'Sua resposta ao cliente' : 'Sua mensagem'}
      </label>
      <div className="chat-compose-row">
        <Textarea
          ref={input}
          id={composerId}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          maxLength={2000}
          rows={2}
          disabled={sending}
          placeholder={
            admin ? 'Responder ao cliente…' : 'Escreva sua mensagem…'
          }
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' &&
              (event.ctrlKey || event.metaKey) &&
              !event.nativeEvent.isComposing
            )
              event.currentTarget.form?.requestSubmit();
          }}
        />
        <Button
          type="submit"
          className="chat-send"
          disabled={!message.trim() || sending}
          aria-label={admin ? 'Enviar resposta' : 'Enviar mensagem'}
        >
          {sending ? (
            <LoaderCircle className="chat-spin" size={20} />
          ) : (
            <Send size={20} />
          )}
        </Button>
      </div>
      <div className="chat-compose-hint">
        <span>
          {admin
            ? 'Sua resposta aparece no chat do cliente.'
            : 'Conversa direta com a Tesoob.'}
        </span>
        <span>{message.length}/2000</span>
      </div>
      {error && (
        <p className="chat-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

export function ChatLoading() {
  return (
    <output className="chat-loading">
      <LoaderCircle className="chat-spin" size={22} /> Abrindo sua conversa…
    </output>
  );
}

export function ChatRetry({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="chat-retry">
      <p role="alert">{message}</p>
      <Button variant="ghost" onClick={onRetry}>
        Tentar novamente <ArrowUpRight size={16} />
      </Button>
    </div>
  );
}
