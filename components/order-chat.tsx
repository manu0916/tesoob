'use client';

import {
  useId,
  useRef,
  useState,
  type SubmitEvent,
  type ReactNode,
} from 'react';
import {
  Asterisk,
  ArrowLeft,
  ArrowUpRight,
  Camera,
  CircleDashed,
  LoaderCircle,
  MessageSquare,
  MoveDownRight,
  Scissors,
  Shirt,
  Sparkles,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ChatComposer,
  ChatLoading,
  ChatMessages,
  ChatRetry,
  chatRequest,
  errorMessage,
  useChatThread,
} from '@/components/chat-ui';
import { siteConfig, type OrderInput } from '@/lib/site-config';
import { statusLabels, type ChatThread } from '@/lib/chat-types';

export function OrderLauncher({
  children = 'Encomendar',
  className = 'action action-red',
  input,
}: {
  children?: ReactNode;
  className?: string;
  input?: OrderInput;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'choose' | 'chat'>('choose');
  const [chatStarted, setChatStarted] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className={className} variant="ghost" />}>
        {children} <ArrowUpRight size={18} />
      </DialogTrigger>
      <DialogContent
        className={`order-dialog ${step === 'chat' ? 'order-dialog-chat' : ''}`}
        showCloseButton={false}
        keepMounted
      >
        <div className="order-dialog-top">
          <span>TESOOB / ENCOMENDAS</span>
          <DialogClose
            render={
              <Button
                className="chat-close"
                variant="ghost"
                aria-label="Fechar encomenda"
              />
            }
          >
            <X size={22} />
          </DialogClose>
        </div>
        <DialogTitle
          className={step === 'choose' ? 'order-dialog-title' : 'sr-only'}
        >
          {step === 'choose' ? (
            <>
              SUA PRÓXIMA PEÇA
              <br />
              <span>começa aqui.</span>
            </>
          ) : (
            'Conversa com a Tesoob'
          )}
        </DialogTitle>
        <DialogDescription
          className={step === 'choose' ? 'order-dialog-description' : 'sr-only'}
        >
          {step === 'choose'
            ? 'Escolha onde conversar sobre sua ideia.'
            : 'Envie sua encomenda e acompanhe as respostas da Tesoob.'}
        </DialogDescription>
        {step === 'choose' ? (
          <>
            <div className="order-channels">
              <a
                className="order-channel"
                href={siteConfig.instagram}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="channel-number">01</span>
                <Camera size={28} strokeWidth={1.3} />
                <div>
                  <span className="channel-eyebrow">NO INSTAGRAM</span>
                  <h3>Encomendar pelo Instagram</h3>
                  <p>Fale com a Tesoob pelo @vistatesoob.</p>
                </div>
                <ArrowUpRight size={26} />
              </a>
              <Button
                className="order-channel order-channel-chat"
                variant="ghost"
                onClick={() => {
                  setStep('chat');
                  setChatStarted(true);
                }}
              >
                <span className="channel-number">02</span>
                <MessageSquare size={28} strokeWidth={1.3} />
                <span className="channel-copy">
                  <span className="channel-eyebrow">AQUI NO SITE</span>
                  <strong>Encomendar pelo chat</strong>
                  <span className="channel-description">
                    Conte sua ideia e acompanhe a conversa por aqui.
                  </span>
                </span>
                <ArrowUpRight size={26} />
              </Button>
            </div>
            <p className="order-dialog-note">
              Valores, medidas e prazos são combinados na conversa.
            </p>
          </>
        ) : null}
        {chatStarted && (
          <div className="customer-chat-container" hidden={step !== 'chat'}>
            <CustomerChat
              active={open && step === 'chat'}
              input={input}
              onBack={() => setStep('choose')}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CustomerChat({
  active,
  input,
  onBack,
}: {
  active: boolean;
  input?: OrderInput;
  onBack: () => void;
}) {
  const formId = useId();
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
  } = useChatThread('/api/chat', active);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [reference, setReference] = useState(input?.reference || '');
  const [message, setMessage] = useState(
    [
      input?.piece && `Peça de interesse: ${input.piece}`,
      input?.size && `Tamanho ou medidas: ${input.size}`,
      input?.notes,
    ]
      .filter(Boolean)
      .join('\n'),
  );
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const busy = useRef(false);
  const createId = useRef('');
  async function start(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current || !name.trim() || !message.trim()) return;
    busy.current = true;
    setSending(true);
    setError('');
    setSendError('');
    createId.current ||= crypto.randomUUID();
    try {
      const result = await chatRequest<ChatThread>('/api/chat', {
        name,
        contact,
        reference,
        message,
        clientId: createId.current,
      });
      setThread(result);
    } catch (failure) {
      setSendError(errorMessage(failure));
    } finally {
      busy.current = false;
      setSending(false);
    }
  }
  if (loading) return <ChatLoading />;
  return (
    <div className="customer-chat">
      <div className="chat-heading">
        <Button
          className="chat-back"
          variant="ghost"
          onClick={onBack}
          aria-label="Voltar às opções de encomenda"
        >
          <ArrowLeft size={19} />
        </Button>
        <div>
          <h2>CONVERSA COM A TESOOB</h2>
          <p>
            {thread
              ? `ENCOMENDA / ${thread.conversation.id.slice(0, 8).toUpperCase()}`
              : 'DO PRIMEIRO OI À PRÓXIMA PEÇA.'}
          </p>
        </div>
        <MessageSquare size={23} strokeWidth={1.4} />
      </div>
      {thread ? (
        <>
          <div className="chat-order-strip">
            <span
              className={`chat-status chat-status-${thread.conversation.status}`}
            >
              {statusLabels[thread.conversation.status]}
            </span>
            <span>
              {thread.conversation.reference || 'Uma peça do seu jeito'}
            </span>
          </div>
          {error && <ChatRetry message={error} onRetry={refresh} />}
          <ChatMessages
            messages={thread.messages}
            onSeen={markSeen}
            hasEarlier={thread.hasEarlier}
            loadEarlier={loadEarlier}
            loadingEarlier={loadingEarlier}
          />
          {thread.conversation.status === 'closed' && (
            <p className="chat-finished-note">
              Encomenda finalizada. Envie uma mensagem para retomar a conversa.
            </p>
          )}
          <ChatComposer endpoint="/api/chat/messages" onSent={setThread} />
          <p className="chat-device-note">
            Volte a este navegador para acompanhar. Seu acesso é mantido por 30
            dias.
          </p>
        </>
      ) : (
        <form className="chat-start-form" onSubmit={start}>
          <OrderDoodles />
          <div className="chat-start-intro">
            <span>do seu jeito.</span>
            <p>
              Conte o que você está imaginando.
              <br />A Tesoob continua a conversa com você por aqui.
            </p>
          </div>
          <div className="chat-form-row">
            <label htmlFor={`${formId}-name`}>
              Seu nome
              <Input
                id={`${formId}-name`}
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={80}
                required
                autoComplete="name"
                placeholder="Como podemos chamar você?"
                disabled={sending}
              />
            </label>
            <label htmlFor={`${formId}-contact`}>
              Instagram ou e-mail <small>opcional</small>
              <Input
                id={`${formId}-contact`}
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                maxLength={160}
                placeholder="Um contato para sua encomenda"
                disabled={sending}
              />
            </label>
          </div>
          <label htmlFor={`${formId}-reference`}>
            Peça de interesse <small>opcional</small>
            <Input
              id={`${formId}-reference`}
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              maxLength={240}
              placeholder="Uma referência do site ou sua própria ideia"
              disabled={sending}
            />
          </label>
          <label htmlFor={`${formId}-idea`}>
            Sua ideia
            <Textarea
              id={`${formId}-idea`}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={2000}
              required
              rows={4}
              placeholder="Conte sobre a peça, o estilo, o tamanho ou a ocasião…"
              disabled={sending}
            />
          </label>
          {error && <ChatRetry message={error} onRetry={refresh} />}
          {sendError && (
            <p className="chat-error" role="alert">
              {sendError} Use “Iniciar conversa” para reenviar.
            </p>
          )}
          <Button
            className="action action-red chat-start-button"
            type="submit"
            disabled={sending || !name.trim() || !message.trim()}
          >
            {sending ? 'Enviando sua ideia…' : 'Iniciar conversa'}
            {sending ? (
              <LoaderCircle className="chat-spin" size={19} />
            ) : (
              <ArrowUpRight size={19} />
            )}
          </Button>
          <p className="chat-device-note">
            Usaremos essas informações para atender sua encomenda. A conversa
            fica disponível neste navegador por 30 dias.
          </p>
        </form>
      )}
    </div>
  );
}

function OrderDoodles() {
  return (
    <div className="chat-doodles" aria-hidden="true">
      <Shirt className="chat-doodle chat-doodle-shirt" strokeWidth={1.05} />
      <Scissors
        className="chat-doodle chat-doodle-scissors"
        strokeWidth={1.15}
      />
      <Sparkles
        className="chat-doodle chat-doodle-sparkles"
        strokeWidth={1.2}
      />
      <CircleDashed
        className="chat-doodle chat-doodle-circle"
        strokeWidth={0.9}
      />
      <MoveDownRight
        className="chat-doodle chat-doodle-arrow"
        strokeWidth={1.15}
      />
      <Asterisk
        className="chat-doodle chat-doodle-asterisk"
        strokeWidth={1.15}
      />
      <span className="chat-doodle-stitch" />
    </div>
  );
}
