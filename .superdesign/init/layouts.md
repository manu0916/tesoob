# Shared Layouts

## RootLayout

- Path: `app/layout.tsx`
- Description: Root HTML shell, metadata, global styles, skip link.

```tsx
import type { Metadata } from 'next';
import { absoluteUrl, siteConfig } from '@/lib/site-config';
import './globals.css';
import './chat.css';
import './store.css';
const title = 'Tesoob â€” O comum ficou para trÃ¡s.';
const description =
  'PeÃ§as exclusivas, recortes e atitude. ConheÃ§a os looks e o universo da Tesoob e converse sobre sua encomenda.';
const previewImage = absoluteUrl('/media/social-card.jpg');
export const metadata: Metadata = {
  title,
  description,
  metadataBase: siteConfig.publicOrigin
    ? new URL(siteConfig.publicOrigin)
    : undefined,
  alternates: siteConfig.publicOrigin
    ? { canonical: siteConfig.publicOrigin }
    : undefined,
  openGraph: {
    title,
    description,
    siteName: 'Tesoob',
    locale: 'pt_BR',
    type: 'website',
    url: siteConfig.publicOrigin || undefined,
    images: previewImage
      ? [
          {
            url: previewImage,
            width: 1200,
            height: 630,
            alt: 'Tesoob â€” O comum ficou para trÃ¡s. Editorial de looks vermelho e verde.',
          },
        ]
      : [],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: previewImage ? [previewImage] : [],
  },
  icons: { icon: '/media/favicon.png' },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <a href="#conteudo" className="skip-link">
          Pular para o conteÃºdo
        </a>
        <div id="conteudo">{children}</div>
      </body>
    </html>
  );
}
```

## SiteHeader and SiteFooter

- Path: `components/tesoob.tsx`
- Description: Primary public-site navigation, footer, logo, and shared homepage presentation.

```tsx
/* oxlint-disable next/no-img-element -- Media is preoptimized locally; ArtImage supplies responsive srcsets and dimensions. */
'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { SiteLink as Link } from '@/components/site-link';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Copy,
  Minus,
  Play,
  Plus,
  UserRound,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrderLauncher } from '@/components/order-chat';
import {
  editorialPhotos,
  looks,
  photo,
  video,
  type Look,
  type Photo,
} from '@/lib/catalog';
import {
  absoluteUrl,
  hasWhatsApp,
  orderMessage,
  siteConfig,
  type OrderInput,
} from '@/lib/site-config';
import { cloneWhatsAppUrl } from '@/lib/clone-whatsapp';

type CloneContact = { cloneWhatsAppNumber?: string | null };

export function ArtImage({
  item,
  className = '',
  priority = false,
  sizes = '(max-width: 700px) 88vw, 45vw',
  style,
}: {
  item: Photo;
  className?: string;
  priority?: boolean;
  sizes?: string;
  style?: CSSProperties;
}) {
  return (
    <img
      src={`/media/${item.src}`}
      srcSet={item.variants
        .map((variant) => `/media/${variant.src} ${variant.width}w`)
        .join(', ')}
      sizes={sizes}
      width={item.width}
      height={item.height}
      alt={item.alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      className={className}
      style={style}
    />
  );
}

export function ContactLink({
  children,
  className = 'action action-red',
  input,
  cloneWhatsAppNumber,
}: {
  children?: React.ReactNode;
  className?: string;
  input?: OrderInput;
} & CloneContact) {
  if (cloneWhatsAppNumber !== undefined)
    return (
      <a
        className={className}
        href={cloneWhatsAppUrl(cloneWhatsAppNumber, input)}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children || 'Encomendar sua peÃ§a'} <ArrowUpRight size={18} />
      </a>
    );
  return (
    <OrderLauncher className={className} input={input}>
      {children || 'Encomendar sua peÃ§a'}
    </OrderLauncher>
  );
}

export function SiteHeader({ cloneWhatsAppNumber }: CloneContact = {}) {
  const clone = cloneWhatsAppNumber !== undefined;
  return (
    <header className="site-header">
      <Link href={clone ? '/clone' : '/'} aria-label="Tesoob, inÃ­cio">
        <img
          className="brand-logo"
          src="/media/logo-tesoob.png"
          alt="Tesoob"
          width="701"
          height="144"
        />
      </Link>
      <nav aria-label="Principal">
        {!clone && <Link href="/loja">Vitrine</Link>}
        {[
          ['PeÃ§as', 'pecas'],
          ['Editorial', 'editorial'],
          ['Processo', 'processo'],
        ].map(([label, id]) => (
          <Link key={id} href={clone ? `/clone#${id}` : `/#${id}`}>
            {label}
          </Link>
        ))}
      </nav>
      <div className="header-right">
        <ContactLink
          className="header-contact"
          cloneWhatsAppNumber={cloneWhatsAppNumber}
        >
          Encomendar
        </ContactLink>
        {!clone && (
          <Link href="/loja/conta" className="account-link" aria-label="Contas">
            <UserRound size={18} />
            <span className="account-link-label">Contas</span>
          </Link>
        )}
      </div>
    </header>
  );
}

export function SiteFooter({ cloneWhatsAppNumber }: CloneContact = {}) {
  const clone = cloneWhatsAppNumber !== undefined;
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <Link href={clone ? '/clone' : '/'} aria-label="Tesoob, inÃ­cio">
          <img
            src="/media/logo-tesoob.png"
            alt="Tesoob"
            width="220"
            height="45"
          />
        </Link>
        <p>O comum ficou para trÃ¡s.</p>
        <a
          href={siteConfig.instagram}
          target="_blank"
          rel="noopener noreferrer"
        >
          @vistatesoob <ArrowUpRight size={17} />
        </a>
      </div>
      <div className="footer-bottom">
        <span>TESOOB / PEÃ‡AS EXCLUSIVAS</span>
        <a
          href={siteConfig.creatorInstagram}
          target="_blank"
          rel="noopener noreferrer"
        >
          Por LÃºcio Henrique <ArrowUpRight size={12} />
        </a>
        <span className="footer-credit">
          Site criado por <strong>emanuel silv</strong>
        </span>
        <Link href={clone ? '/admin/clone' : '/admin'}>
          {clone ? 'Configurar WhatsApp' : 'Ãrea do ateliÃª'}
        </Link>
        {!clone && <Link href="/loja">Vitrine de vendas</Link>}
        <span>{siteConfig.locality} / Envio para todo o Brasil</span>
        <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
        <Link href="/politica-de-privacidade">PolÃ­tica de Privacidade</Link>
        <Link href="/termos-de-uso">Termos de Uso</Link>
        <a href="#conteudo">Voltar ao topo â†‘</a>
      </div>
    </footer>
  );
}

function Motion() {
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (preference.matches) return;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.08 },
    );
    document
      .querySelectorAll<HTMLElement>('[data-reveal]')
      .forEach((element) => {
        const bounds = element.getBoundingClientRect();
        if (bounds.top > window.innerHeight)
          element.classList.add('reveal-ready');
        observer.observe(element);
      });
    const clear = () => {
      if (preference.matches) {
        document
          .querySelectorAll('.reveal-ready')
          .forEach((element) => element.classList.remove('reveal-ready'));
        observer.disconnect();
      }
    };
    preference.addEventListener('change', clear);
    return () => {
      observer.disconnect();
      preference.removeEventListener('change', clear);
    };
  }, []);
  return null;
}

function Hero({ cloneWhatsAppNumber }: CloneContact) {
  const clone = cloneWhatsAppNumber !== undefined;
  const frame = useRef<HTMLDivElement>(null);
  function parallax(event: React.PointerEvent<HTMLDivElement>) {
    if (
      event.pointerType !== 'mouse' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !frame.current
    )
      return;
    const rect = event.currentTarget.getBoundingClientRect();
    frame.current.style.setProperty(
      '--pointer-x',
      `${((event.clientX - rect.left) / rect.width - 0.5) * 14}px`,
    );
    frame.current.style.setProperty(
      '--pointer-y',
      `${((event.clientY - rect.top) / rect.height - 0.5) * 14}px`,
    );
  }
  return (
    <section className="hero" id="inicio">
      <div className="hero-copy">
        <p className="eyebrow">
          <span className="red-dot" /> VISTA SUA PRÃ“PRIA ATITUDE
        </p>
        <h1>
          <span className="title-line">
            <span>O COMUM</span>
          </span>
          <span className="title-line">
            <span>FICOU</span>
          </span>
          <span className="title-line title-red title-brand">
            <span className="brand-accent">PARA TRÃS.</span>
          </span>
        </h1>
        <div className="hero-bottom">
          <p>
            PeÃ§as exclusivas.
            <br />
            PresenÃ§a que nÃ£o pede licenÃ§a.
          </p>
        </div>
        <div className="hero-ctas">
          <Link href={clone ? '#pecas' : '/loja'} className="action action-red">
            {clone ? 'Explorar as peÃ§as' : 'Ver peÃ§as disponÃ­veis'}{' '}
            <ArrowUpRight size={20} />
          </Link>
          <ContactLink
            className="hero-order-cta"
            cloneWhatsAppNumber={cloneWhatsAppNumber}
          >
            Encomendar uma peÃ§a
          </ContactLink>
        </div>
        <a className="scroll-note" href="#pecas">
          <ArrowDown size={14} /> UM NOVO OLHAR, LOGO ABAIXO
        </a>
      </div>
      <div
        className="hero-art"
        onPointerMove={parallax}
        onPointerLeave={() => {
          frame.current?.style.setProperty('--pointer-x', '0px');
          frame.current?.style.setProperty('--pointer-y', '0px');
        }}
      >
        <div className="hero-frame" ref={frame}>
          <ArtImage item={photo('editorial-01')} priority />
          <span className="photo-caption">TESOOB / EDITORIAL</span>
        </div>
        <span className="side-caption">THE ORDINARY HAS BEEN LEFT BEHIND.</span>
        <span className="hero-stamp">
          PEÃ‡AS
          <br />
          EXCLUSIVAS <ArrowUpRight size={24} />
        </span>
      </div>
    </section>
  );
}

function LookCard({
  look,
  index,
  cloneWhatsAppNumber,
}: { look: Look; index: number } & CloneContact) {
  const clone = cloneWhatsAppNumber !== undefined;
  const href = clone
    ? cloneWhatsAppUrl(cloneWhatsAppNumber, {
        reference: `REF. ${look.ref} â€” ${look.name}`,
        publicUrl: absoluteUrl('/clone#pecas'),
      })
    : `/pecas/${look.slug}`;
  const external = clone ? { target: '_blank', rel: 'noopener noreferrer' } : {};
  return (
    <article className={`look-card look-${index + 1}`} data-reveal>
      <Link
        href={href}
        {...external}
        className="look-image-link"
        aria-label={`Ver ${look.name}`}
      >
        <ArtImage item={photo(look.cover)} className="look-image" />
        <ArtImage
          item={photo(look.alternate)}
          className="look-image-alternate"
        />
        <span className="look-badge">REF. {look.ref}</span>
        <span className="look-open">
          <ArrowUpRight size={24} />
          <span>VER DETALHES</span>
        </span>
      </Link>
      <div className="look-card-copy">
        <div className="look-label">
          <span className={`color-swatch ${look.color}`} />
          <p>REFERÃŠNCIA {look.ref}</p>
          <span>CONSULTE A ENCOMENDA</span>
        </div>
        <Link href={href} {...external}>
          <h3>{look.title}</h3>
        </Link>
        {index === 2 && <p className="look-description">{look.description}</p>}
        <Link className="text-link" href={href} {...external}>
          Conhecer a referÃªncia <ArrowUpRight size={16} />
        </Link>
      </div>
    </article>
  );
}

export function PhotoGallery({
  images = editorialPhotos,
  compact = false,
}: {
  images?: Photo[];
  compact?: boolean;
}) {
  const [active, setActive] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const returnFocus = useRef<HTMLElement | null>(null);
  const touchStart = useRef<number | null>(null);
  const current = images[active ?? 0];
  const move = (step: number) =>
    setActive((value) =>
      value === null ? null : (value + step + images.length) % images.length,
    );
  function open(index: number, event: React.MouseEvent<HTMLElement>) {
    returnFocus.current = event.currentTarget;
    setActive(index);
  }
  return (
    <>
      <div className={compact ? 'detail-photo-grid' : 'editorial-grid'}>
        {images
          .slice(0, expanded || compact ? images.length : 6)
          .map((item, index) => (
            <button
              key={item.id}
              className={`gallery-photo gallery-photo-${index + 1}`}
              type="button"
              onClick={(event) => open(index, event)}
              aria-label={`Ampliar foto ${index + 1}: ${item.alt}`}
            >
              <ArtImage
                item={item}
                sizes={
                  compact
                    ? '(max-width:700px) 43vw, 24vw'
                    : '(max-width:700px) 43vw, 30vw'
                }
              />
              <span className="image-expand">
                <Plus size={19} />
              </span>
              <span className="gallery-number">
                {String(index + 1).padStart(2, '0')} / TESOOB
              </span>
            </button>
          ))}
      </div>
      {!compact && (
        <div className="gallery-bottom">
          <p>Um olhar por inteiro. {images.length} fotografias.</p>
          <Button
            className="action gallery-more"
            variant="outline"
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded
              ? 'Recolher arquivo'
              : `Ver arquivo completo â€” ${images.length} fotos`}
            {expanded ? <Minus size={17} /> : <Plus size={17} />}
          </Button>
        </div>
      )}
      <Dialog
        open={active !== null}
        onOpenChange={(open) => {
          if (!open) setActive(null);
        }}
      >
        <DialogContent
          className="lightbox"
          showCloseButton={false}
          fullScreen
          finalFocus={returnFocus}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') {
              event.preventDefault();
              move(1);
            }
            if (event.key === 'ArrowLeft') {
              event.preventDefault();
              move(-1);
            }
          }}
        >
          <DialogTitle className="sr-only">Fotografias Tesoob</DialogTitle>
          <DialogDescription className="sr-only">
            {current.alt} Use as setas para navegar e Escape para fechar.
          </DialogDescription>
          <div className="lightbox-top">
            <span>
              TESOOB / {String((active ?? 0) + 1).padStart(2, '0')} â€”{' '}
              {images.length}
            </span>
            <DialogClose
              render={
                <Button
                  className="icon-button"
                  variant="ghost"
                  aria-label="Fechar fotografia"
                />
              }
            >
              <X />
            </DialogClose>
          </div>
          <div
            className="lightbox-photo"
            onTouchStart={(event) => {
              touchStart.current = event.touches[0].clientX;
            }}
            onTouchEnd={(event) => {
              if (touchStart.current !== null) {
                const delta =
                  event.changedTouches[0].clientX - touchStart.current;
                if (Math.abs(delta) > 60) move(delta < 0 ? 1 : -1);
              }
              touchStart.current = null;
            }}
          >
            <ArtImage
              item={current}
              priority
              sizes="(max-width:700px) 95vw, 80vw"
            />
          </div>
          <div className="lightbox-bottom">
            <Button
              className="icon-button"
              variant="ghost"
              onClick={() => move(-1)}
              aria-label="Fotografia anterior"
            >
              <ArrowLeft />
            </Button>
            <p aria-live="polite">{current.alt}</p>
            <Button
              className="icon-button"
              variant="ghost"
              onClick={() => move(1)}
              aria-label="PrÃ³xima fotografia"
            >
              <ArrowRight />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function VideoPlayer({
  id,
  className = '',
  continuous = false,
}: {
  id: string;
  className?: string;
  continuous?: boolean;
}) {
  const item = video(id);
  const element = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(continuous);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!started || !element.current) return;
    if (continuous) {
      // Muted inline playback is eligible for autoplay on mobile too.
      // Keep native controls available if the browser blocks it or the visitor pauses.
      element.current.muted = true;
      void element.current.play().catch(() => {});
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) element.current?.pause();
      },
      { threshold: 0.1 },
    );
    observer.observe(element.current);
    return () => observer.disconnect();
  }, [started, continuous]);
  return (
    <div
      className={`video-player ${className}`}
      style={
        { '--video-ratio': `${item.width} / ${item.height}` } as CSSProperties
      }
    >
      {started ? (
        <video
          ref={element}
          src={`/media/${item.src}`}
          poster={`/media/${item.poster}`}
          width={item.width}
          height={item.height}
          controls
          playsInline
          muted
          loop={continuous}
          preload="metadata"
          autoPlay
          onError={() => setError(true)}
          aria-label={item.title}
        />
      ) : (
        <button
          type="button"
          className="video-poster"
          onClick={() => setStarted(true)}
          aria-label={`Reproduzir: ${item.title}`}
        >
          <img
            src={`/media/${item.poster}`}
            width={item.width}
            height={item.height}
            alt={item.title}
            loading="lazy"
          />
          <span className="play-circle">
            <Play fill="currentColor" size={20} />
          </span>
          <span className="video-caption">
            {item.title}
            <small>
              {Math.round(item.duration)} S / ASSISTIR{' '}
              <ArrowUpRight size={14} />
            </small>
          </span>
        </button>
      )}
      {error && (
        <p className="video-error">
          NÃ£o foi possÃ­vel carregar o vÃ­deo.{' '}
          <a href={`/media/${item.src}`}>Abrir o arquivo</a>
        </p>
      )}
    </div>
  );
}

function CloseDetails({ cloneWhatsAppNumber }: CloneContact) {
  const clone = cloneWhatsAppNumber !== undefined;
  const entries = [
    {
      id: 'amarracoes',
      label: 'AmarraÃ§Ãµes',
      title: 'O detalhe que conecta.',
      copy: 'Linhas que atravessam o vermelho. AmarraÃ§Ãµes e ilhoses fazem parte do desenho do look.',
      photo: 'editorial-06',
      look: looks[0],
    },
    {
      id: 'ferragens',
      label: 'Ferragens',
      title: 'PresenÃ§a em cada encontro.',
      copy: 'Cintos, ilhoses e fivelas no verde militar. A forÃ§a estÃ¡ nos encontros entre os detalhes.',
      photo: 'editorial-09',
      look: looks[1],
    },
    {
      id: 'camadas',
      label: 'Camadas',
      title: 'Mais de uma forma de olhar.',
      copy: 'Jeans claro, roxo e aplicaÃ§Ãµes. Cada camada deixa outro detalhe aparecer.',
      photo: 'processo-04',
      look: looks[2],
    },
  ];
  return (
    <section className="close-section section" data-reveal>
      <p className="eyebrow">03 / DE PERTO</p>
      <Tabs defaultValue="amarracoes" className="close-tabs">
        <div className="close-tabs-heading">
          <h2>
            NADA AQUI Ã‰<br />
            <span className="brand-accent">POR ACASO.</span>
          </h2>
          <TabsList
            className="detail-tabs"
            variant="line"
            aria-label="Detalhes das peÃ§as"
          >
            {entries.map((item, index) => (
              <TabsTrigger key={item.id} value={item.id}>
                <span>0{index + 1}</span>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {entries.map((item) => (
          <TabsContent key={item.id} value={item.id} className="close-content">
            <div className="close-photo">
              <img
                src={`/media/detalhes-${item.id}.webp`}
                width={
                  item.id === 'camadas'
                    ? 800
                    : item.id === 'ferragens'
                      ? 520
                      : 490
                }
                height={
                  item.id === 'camadas'
                    ? 800
                    : item.id === 'ferragens'
                      ? 520
                      : 490
                }
                alt={`Detalhe de ${item.label.toLowerCase()} da referÃªncia ${item.look.ref}`}
                loading="lazy"
              />
              <span className="detail-cross" aria-hidden="true">
                +
              </span>
            </div>
            <div className="close-copy">
              <span className="eyebrow">AMPLIE SEU OLHAR</span>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
              <div className="stitch-line" aria-hidden="true">
                <svg viewBox="0 0 320 46" fill="none">
                  <path d="M0 23H56L72 9L88 37L104 9L120 37L136 9L152 37L168 9L184 37L200 9L216 37L232 23H320" />
                </svg>
              </div>
              <Link
                className="text-link"
                href={
                  clone
                    ? cloneWhatsAppUrl(cloneWhatsAppNumber, {
                        reference: `REF. ${item.look.ref} â€” ${item.look.name}`,
                        publicUrl: absoluteUrl('/clone#pecas'),
                      })
                    : `/pecas/${item.look.slug}`
                }
                {...(clone
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
              >
                Ver a referÃªncia completa <ArrowUpRight size={17} />
              </Link>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}

function ProcessSection() {
  return (
    <section className="process-section" id="processo">
      <div className="section">
        <div className="process-heading" data-reveal>
          <div>
            <p className="eyebrow">04 / POR TRÃS DA PEÃ‡A</p>
            <h2>
              O DETALHE FAZ
              <br />
              PARTE DA PEÃ‡A.
            </h2>
          </div>
          <p>
            Do recorte Ã  aplicaÃ§Ã£o.
            <br />
            Um olhar para o processo, para as mÃ£os
            <br />e para o que se constrÃ³i de perto.
          </p>
        </div>
        <div className="process-grid">
          <figure className="process-main" data-reveal>
            <ArtImage item={photo('processo-01')} />
            <figcaption>01 / ENTRE IDEIAS, RECORTES E APLICAÃ‡Ã•ES.</figcaption>
          </figure>
          <div className="process-film" data-reveal>
            <VideoPlayer id="processo-filme" continuous />
            <p>
              O processo em movimento. <ArrowUpRight size={15} />
            </p>
          </div>
          <figure className="process-bw" data-reveal>
            <ArtImage item={photo('processo-03')} />
            <figcaption>02 / UM OLHAR SOBRE A CONSTRUÃ‡ÃƒO.</figcaption>
          </figure>
          <div className="process-note" data-reveal>
            <span className="editorial-plus" aria-hidden="true">
              +
            </span>
            <p>
              ANTES DE VESTIR,
              <br />
              EXISTE UM
              <br />
              <span className="brand-accent">OLHAR.</span>
            </p>
            <a
              className="text-link"
              href={siteConfig.creatorInstagram}
              target="_blank"
              rel="noopener noreferrer"
            >
              Por LÃºcio Henrique <ArrowUpRight size={15} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function OrderSection({ cloneWhatsAppNumber }: CloneContact) {
  const clone = cloneWhatsAppNumber !== undefined;
  return (
    <section className="order-section section" id="encomendar">
      <div className="order-intro" data-reveal>
        <p className="eyebrow">
          <span className="red-dot" /> 05 / DO SEU JEITO
        </p>
        <h2>
          SUA PRÃ“XIMA PEÃ‡A
          <br />
          COMEÃ‡A NUMA
          <br />
          <span className="brand-accent">CONVERSA.</span>
        </h2>
        <p className="order-description">
          Envie a referÃªncia que chamou sua atenÃ§Ã£o.
          <br />
          Converse com a Tesoob sobre valores, disponibilidade
          <br />e possibilidades para sua encomenda.
        </p>
        <ContactLink cloneWhatsAppNumber={cloneWhatsAppNumber} />
        <p className="contact-note">
          {clone
            ? 'Sem cadastro. Contato direto pelo WhatsApp.'
            : 'Sem cadastro. Pelo Instagram ou pelo chat do site.'}
        </p>
      </div>
      <div className="order-side" data-reveal>
        <figure className="plate-photo">
          <ArtImage
            item={photo('placa')}
            sizes="(max-width:700px) 70vw, 25vw"
          />
          <figcaption>O COMUM FICOU PARA TRÃS.</figcaption>
        </figure>
        <ol className="order-steps">
          <li>
            <span>01</span>
            <div>
              Escolha uma referÃªncia
              <small>Encontre o look ou detalhe que Ã© a sua cara.</small>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              Comece a conversa
              <small>Envie a referÃªncia e conte sua ideia.</small>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              Combine os detalhes
              <small>Consulte valores e possibilidades com a marca.</small>
            </div>
          </li>
        </ol>
      </div>
    </section>
  );
}

function MobileContact({ cloneWhatsAppNumber }: CloneContact) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const start = document.getElementById('inicio');
    const end = document.getElementById('encomendar');
    if (!start || !end) return;
    let afterHero = false;
    let inContact = false;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target === start)
          afterHero =
            !entry.isIntersecting && entry.boundingClientRect.bottom < 0;
        else inContact = entry.isIntersecting;
      });
      setVisible(afterHero && !inContact);
    });
    observer.observe(start);
    observer.observe(end);
    return () => observer.disconnect();
  }, []);
  return visible ? (
    <div className="mobile-contact">
      <span>Sua prÃ³xima peÃ§a?</span>
      <ContactLink
        className="action action-red"
        cloneWhatsAppNumber={cloneWhatsAppNumber}
      >
        Encomendar
      </ContactLink>
    </div>
  ) : null;
}

export function HomePage({ cloneWhatsAppNumber }: CloneContact = {}) {
  return (
    <>
      <SiteHeader cloneWhatsAppNumber={cloneWhatsAppNumber} />
      <main>
        <Hero cloneWhatsAppNumber={cloneWhatsAppNumber} />
        <div className="statement-strip" aria-hidden="true">
          <span>ROUPA Ã‰ EXPRESSÃƒO.</span>
          <span>TESOOB</span>
          <span>O COMUM FICOU PARA TRÃS.</span>
          <ArrowUpRight />
        </div>
        <section id="pecas" className="section looks-section">
          <div className="section-heading" data-reveal>
            <div>
              <p className="eyebrow">01 / AS PEÃ‡AS</p>
              <h2>
                ATITUDE EM
                <br />
                <span className="brand-accent">CADA DETALHE.</span>
              </h2>
            </div>
            <p>
              AmarraÃ§Ãµes. Ferragens. Recortes.
              <br />
              Explore as referÃªncias e encontre
              <br />o que conversa com vocÃª.
            </p>
          </div>
          <div className="looks-grid">
            {looks.map((look, index) => (
              <LookCard
                look={look}
                index={index}
                key={look.slug}
                cloneWhatsAppNumber={cloneWhatsAppNumber}
              />
            ))}
          </div>
        </section>
        <section className="editorial-section section" id="editorial">
          <div className="section-heading" data-reveal>
            <div>
              <p className="eyebrow">02 / NOSSO UNIVERSO</p>
              <h2>
                FORA DO Ã“BVIO.
                <br />
                <span className="brand-accent">DENTRO DA CENA.</span>
              </h2>
            </div>
            <p>
              Entre metal, cor e movimento.
              <br />O editorial Tesoob, por inteiro.
            </p>
          </div>
          <PhotoGallery />
          <div className="editorial-film-row" data-reveal>
            <div>
              <p className="eyebrow">APERTE O PLAY</p>
              <h3>
                A CENA
                <br />
                CONTINUA.
              </h3>
              <p>
                As peÃ§as, as pessoas e o cenÃ¡rio.
                <br />
                Veja o editorial em movimento.
              </p>
            </div>
            <VideoPlayer id="editorial-filme" continuous />
          </div>
        </section>
        <CloseDetails cloneWhatsAppNumber={cloneWhatsAppNumber} />
        <ProcessSection />
        <OrderSection cloneWhatsAppNumber={cloneWhatsAppNumber} />
      </main>
      <SiteFooter cloneWhatsAppNumber={cloneWhatsAppNumber} />
      <MobileContact cloneWhatsAppNumber={cloneWhatsAppNumber} />
      <Motion />
    </>
  );
}

export function LookPage({ look }: { look: Look }) {
  const [selected, setSelected] = useState(0);
  const [piece, setPiece] = useState('');
  const [size, setSize] = useState('');
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState('');
  const [copyError, setCopyError] = useState(false);
  const [fullImage, setFullImage] = useState(false);
  const imageButton = useRef<HTMLButtonElement>(null);
  const images = look.images.map(photo);
  const input = {
    reference: `REF. ${look.ref} â€” ${look.name}`,
    piece,
    size,
    notes,
    publicUrl: absoluteUrl(`/pecas/${look.slug}`),
  };
  async function copy(value: string, kind: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  }
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(''), 2500);
    return () => clearTimeout(timer);
  }, [copied]);
  return (
    <>
      <SiteHeader />
      <main className="look-page section">
        <Link href="/#pecas" className="back-link">
          <ArrowLeft size={15} /> Voltar Ã s peÃ§as
        </Link>
        <div className="look-detail-layout">
          <div className="look-detail-visual">
            <button
              ref={imageButton}
              className="detail-main-image"
              type="button"
              onClick={() => setFullImage(true)}
              aria-label="Ampliar fotografia da referÃªncia"
            >
              <ArtImage item={images[selected]} priority />
              <span className="image-expand">
                <Plus size={21} />
              </span>
            </button>
            <div
              className="detail-thumbnails"
              aria-label="Fotografias da referÃªncia"
            >
              {images.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Ver fotografia ${index + 1}`}
                  aria-pressed={selected === index}
                  onClick={() => setSelected(index)}
                >
                  <ArtImage item={item} sizes="100px" />
                </button>
              ))}
            </div>
            <p className="image-hint">
              Toque na foto para ver todos os detalhes.
            </p>
          </div>
          <div className="look-detail-copy">
            <p className="eyebrow">
              <span className={`color-swatch ${look.color}`} /> REFERÃŠNCIA{' '}
              {look.ref}
            </p>
            <h1>{look.name}</h1>
            <p className="detail-description">{look.description}</p>
            <ul className="detail-tags">
              {look.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
            <div className="order-form">
              <h2>Vamos conversar sobre essa peÃ§a?</h2>
              <p>
                Consulte valores, disponibilidade e possibilidades pelo
                Instagram ou pelo chat do site. VocÃª pode se interessar pelo
                look ou por uma das peÃ§as.
              </p>
              <details className="optional-fields">
                <summary>
                  Quer contar um pouco da sua ideia? <Plus size={16} />
                </summary>
                <div>
                  <label htmlFor="piece">
                    Qual peÃ§a chamou sua atenÃ§Ã£o? <span>opcional</span>
                  </label>
                  <Input
                    id="piece"
                    value={piece}
                    onChange={(event) => setPiece(event.target.value)}
                    maxLength={160}
                    placeholder="Ex.: o top, a saia ou o look"
                  />
                  <label htmlFor="size">
                    Tamanho ou medidas <span>opcional</span>
                  </label>
                  <Input
                    id="size"
                    value={size}
                    onChange={(event) => setSize(event.target.value)}
                    maxLength={160}
                    placeholder="O que vocÃª deseja informar"
                  />
                  <label htmlFor="notes">
                    Sua ideia <span>opcional</span>
                  </label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    maxLength={800}
                    placeholder="Conte o que vocÃª estÃ¡ imaginando"
                  />
                </div>
              </details>
              <ContactLink input={input}>
                Encomendar esta referÃªncia
              </ContactLink>
              {!hasWhatsApp && (
                <>
                  <Button
                    variant="ghost"
                    className="copy-reference"
                    onClick={() => copy(orderMessage(input), 'reference')}
                  >
                    {copied === 'reference' ? (
                      <Check size={16} />
                    ) : (
                      <Copy size={16} />
                    )}{' '}
                    {copied === 'reference'
                      ? 'ReferÃªncia copiada'
                      : 'Copiar referÃªncia para a conversa'}
                  </Button>
                  {copyError && (
                    <label className="copy-fallback" htmlFor="copy-order-text">
                      Copie o texto abaixo para a conversa
                      <Textarea
                        id="copy-order-text"
                        readOnly
                        value={orderMessage(input)}
                        onFocus={(event) => event.target.select()}
                      />
                    </label>
                  )}
                </>
              )}
              <p className="form-note">
                O contato inicia uma conversa. Valores e detalhes sÃ£o combinados
                diretamente com a Tesoob.
              </p>
            </div>
            <Button
              variant="ghost"
              className="share-reference"
              onClick={() => copy(window.location.href, 'link')}
            >
              {copied === 'link' ? <Check size={15} /> : <Copy size={15} />}{' '}
              {copied === 'link'
                ? 'Link copiado'
                : 'Copiar link desta referÃªncia'}
            </Button>
            <output className="sr-only" aria-live="polite">
              {copied ? 'Copiado para a Ã¡rea de transferÃªncia.' : ''}
            </output>
          </div>
        </div>
        <section className="look-motion">
          <div>
            <p className="eyebrow">OUTROS Ã‚NGULOS</p>
            <h2>
              A PEÃ‡A
              <br />
              <span className="brand-accent">EM MOVIMENTO.</span>
            </h2>
          </div>
          <div className="look-videos">
            {look.videoIds.map((id) => (
              <VideoPlayer id={id} key={id} />
            ))}
          </div>
        </section>
        <section className="related-looks">
          <div className="section-heading">
            <h2>
              OUTRAS
              <br />
              REFERÃŠNCIAS.
            </h2>
            <Link href="/#pecas" className="text-link">
              Ver todas <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="related-grid">
            {looks
              .filter((item) => item.slug !== look.slug)
              .map((item) => (
                <Link href={`/pecas/${item.slug}`} key={item.slug}>
                  <ArtImage item={photo(item.cover)} />
                  <span>REF. {item.ref}</span>
                  <h3>
                    {item.title}
                    <ArrowUpRight />
                  </h3>
                </Link>
              ))}
          </div>
        </section>
      </main>
      <SiteFooter />
      <Dialog open={fullImage} onOpenChange={setFullImage}>
        <DialogContent
          className="lightbox detail-lightbox"
          showCloseButton={false}
          fullScreen
          finalFocus={imageButton}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight')
              setSelected((value) => (value + 1) % images.length);
            if (event.key === 'ArrowLeft')
              setSelected(
                (value) => (value - 1 + images.length) % images.length,
              );
          }}
        >
          <DialogTitle className="sr-only">{look.name}</DialogTitle>
          <DialogDescription className="sr-only">
            {images[selected].alt}
          </DialogDescription>
          <div className="lightbox-top">
            <span>
              REF. {look.ref} / {selected + 1} â€” {images.length}
            </span>
            <DialogClose
              render={
                <Button
                  className="icon-button"
                  variant="ghost"
                  aria-label="Fechar fotografia"
                />
              }
            >
              <X />
            </DialogClose>
          </div>
          <div className="lightbox-photo">
            <ArtImage item={images[selected]} priority sizes="90vw" />
          </div>
          <div className="lightbox-bottom">
            <Button
              className="icon-button"
              variant="ghost"
              onClick={() =>
                setSelected(
                  (value) => (value - 1 + images.length) % images.length,
                )
              }
              aria-label="Fotografia anterior"
            >
              <ArrowLeft />
            </Button>
            <p aria-live="polite">{images[selected].alt}</p>
            <Button
              className="icon-button"
              variant="ghost"
              onClick={() =>
                setSelected((value) => (value + 1) % images.length)
              }
              aria-label="PrÃ³xima fotografia"
            >
              <ArrowRight />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

## AdminNavigation

- Path: `components/admin-navigation.tsx`
- Description: Shared administration navigation.

```tsx
import { ArrowUpRight, Layers2, MessageSquare, Plus } from 'lucide-react';
import { SiteLink as Link } from '@/components/site-link';

export function AdminNavigation({ current }: { current: 'orders' | 'products' }) {
  return (
    <nav className="admin-workspace-nav" aria-label="Ãreas do administrador">
      <div>
        <Link href="/admin" aria-current={current === 'orders' ? 'page' : undefined}>
          <MessageSquare size={16} aria-hidden="true" /> Encomendas
        </Link>
        <Link href="/admin/produtos" aria-current={current === 'products' ? 'page' : undefined}>
          <Layers2 size={16} aria-hidden="true" /> Vitrine
        </Link>
      </div>
      <Link href="/loja" className="admin-preview-link">
        Ver vitrine <ArrowUpRight size={16} aria-hidden="true" />
      </Link>
    </nav>
  );
}

export function AdminStoreAccess() {
  return (
    <section className="admin-store-access" aria-labelledby="admin-store-title">
      <div className="admin-store-copy">
        <p className="eyebrow">CATÃLOGO / PEÃ‡AS Ã€ VENDA</p>
        <h2 id="admin-store-title">SUA VITRINE.</h2>
        <p>Cuide das fotos, dos preÃ§os e das peÃ§as que estÃ£o no ar.</p>
      </div>
      <div className="admin-store-controls">
        <Link href="/admin/produtos" className="admin-store-manage">
          Gerenciar peÃ§as <ArrowUpRight size={20} aria-hidden="true" />
        </Link>
        <Link href="/admin/produtos?novo=1" className="admin-store-add">
          <Plus size={18} aria-hidden="true" /> Adicionar peÃ§a
        </Link>
      </div>
    </section>
  );
}
```

## StoreFrame

- Path: `components/storefront.tsx`
- Description: Store shell that composes the public header, store main area, and footer.

```tsx
/* oxlint-disable next/no-img-element -- Product image URLs are administrator-managed. */
'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { SiteLink as Link } from '@/components/site-link';
import {
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  Trash2,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { SiteHeader, SiteFooter } from '@/components/tesoob';
import {
  storeApi,
  storeMessage,
  money,
  type Product,
  type ProductPage,
  type StoreDrop,
} from '@/lib/store-api';
import { DropCountdown } from '@/components/drop-countdown';

export function StoreFrame({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="store-shell">{children}</main>
      <SiteFooter />
    </>
  );
}
export function StoreNotice({
  children,
  retry,
}: {
  children: ReactNode;
  retry?: () => void;
}) {
  return (
    <div className="store-notice" aria-live="polite">
      <div>{children}</div>
      {retry && (
        <button className="store-button store-button-secondary" onClick={retry}>
          <RefreshCw size={16} />
          Tentar novamente
        </button>
      )}
    </div>
  );
}
export function ProductObservation({ value }: { value?: string | null }) {
  const observation = value?.trim();
  return observation ? (
    <aside className="store-observation">
      <span>ObservaÃ§Ãµes</span>
      <p>{observation}</p>
    </aside>
  ) : null;
}
export function ProductImage({
  product,
  eager = false,
}: {
  product: Product;
  eager?: boolean;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  return failedUrl === product.imageUrl ? (
    <div className="store-image-error">Imagem indisponÃ­vel</div>
  ) : (
    <img
      src={product.imageUrl}
      alt={product.name}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailedUrl(product.imageUrl)}
    />
  );
}
export function Storefront() {
  const [cart, setCart] = useState<Product[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [catalog, setCatalog] = useState<ProductPage | null>(null);
  const [nextDrop, setNextDrop] = useState<StoreDrop | null>(null);
  const [page, setPage] = useState(0);
  const [retry, setRetry] = useState(0);
  const [error, setError] = useState('');
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const saved = JSON.parse(localStorage.getItem('tesoob:cart') || '[]');
        if (Array.isArray(saved)) setCart(saved);
      } catch {
        localStorage.removeItem('tesoob:cart');
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  function updateCart(next: Product[]) {
    setCart(next);
    localStorage.setItem('tesoob:cart', JSON.stringify(next));
  }
  function addToCart(product: Product) {
    if (!cart.some((item) => item.id === product.id)) updateCart([...cart, product]);
    setCartOpen(true);
  }
  useEffect(() => {
    const controller = new AbortController();
    storeApi<ProductPage>(`/products?page=${page}`, {
      signal: controller.signal,
    })
      .then((data) => {
        setError('');
        setCatalog(data);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(storeMessage(e));
      });
    return () => controller.abort();
  }, [page, retry]);
  useEffect(() => {
    const controller = new AbortController();
    const loadNextDrop = () => {
      storeApi<{ drop: StoreDrop | null }>('/drops/next', {
        signal: controller.signal,
      })
        .then(({ drop }) => setNextDrop(drop))
        .catch(() => {
          if (!controller.signal.aborted) setNextDrop(null);
        });
    };
    loadNextDrop();
    const timer = window.setInterval(loadNextDrop, 60_000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [retry]);
  return (
    <StoreFrame>
      <div className="store-toolbar">
        <Link href="/">
          <ArrowLeft size={15} /> O universo Tesoob
        </Link>
        <Link href="/loja/conta">
          <UserRound size={16} /> Minha conta
        </Link>
        <button
          type="button"
          className="store-cart-trigger"
          aria-expanded={cartOpen}
          aria-controls="store-cart"
          onClick={() => setCartOpen((open) => !open)}
        >
          <ShoppingBag size={16} /> Carrinho <span>{cart.length}</span>
        </button>
      </div>
      {cartOpen && (
        <aside id="store-cart" className="store-cart" aria-label="Carrinho">
          <div className="store-cart-heading">
            <div>
              <p className="store-kicker">SUA SELEÃ‡ÃƒO</p>
              <h2>CARRINHO</h2>
            </div>
            <button type="button" onClick={() => setCartOpen(false)}>
              Fechar
            </button>
          </div>
          {!cart.length ? (
            <p className="store-fine-print">Sua seleÃ§Ã£o ainda estÃ¡ vazia.</p>
          ) : (
            <div className="store-cart-items">
              {cart.map((product) => (
                <article key={product.id}>
                  <img src={product.imageUrl} alt="" />
                  <div>
                    <h3>{product.name}</h3>
                    <p>{money(product.price)}</p>
                    <Link href={`/loja/checkout/${product.id}`}>
                      Finalizar esta peÃ§a <ArrowUpRight size={15} />
                    </Link>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remover ${product.name} do carrinho`}
                    onClick={() => updateCart(cart.filter((item) => item.id !== product.id))}
                  >
                    <Trash2 size={17} />
                  </button>
                </article>
              ))}
            </div>
          )}
        </aside>
      )}
      <header className="store-intro">
        <div>
          <p className="store-kicker">TESOOB / SELEÃ‡ÃƒO AUTORAL</p>
          <h1>
            VISTA O<br />
            <em>INESPERADO.</em>
          </h1>
        </div>
        <div className="store-intro-note">
          <span>01 â€” A VITRINE</span>
          <p>
            Recortes que surpreendem.
            <br />
            Detalhes que ficam.
            <br />A prÃ³xima histÃ³ria Ã© sua.
          </p>
          <a href="#vitrine">
            Explore a seleÃ§Ã£o <ArrowRight size={17} />
          </a>
        </div>
      </header>
      {nextDrop && (
        <section
          className="store-drop-announcement"
          aria-labelledby="next-drop-title"
        >
          <div className="store-drop-announcement-copy">
            <p className="store-kicker">PRÃ“XIMO DROP</p>
            <h2 id="next-drop-title">{nextDrop.name}</h2>
            <p className="store-drop-announcement-message">
              Um novo drop serÃ¡ lanÃ§ado daqui a:
            </p>
          </div>
          <DropCountdown
            target={nextDrop.launchesAt}
            onComplete={() => {
              setNextDrop(null);
              setPage(0);
              setRetry((value) => value + 1);
            }}
          />
        </section>
      )}
      <section
        id="vitrine"
        className="store-catalog"
        aria-label="Produtos Ã  venda"
      >
        <div className="store-section-label">
          <span>PEÃ‡AS EM DESTAQUE</span>
          <span>
            {catalog
              ? `${catalog.totalElements.toString().padStart(2, '0')} / DISPONÃVEIS`
              : 'TESOOB / STORE'}
          </span>
        </div>
        {error ? (
          <StoreNotice retry={() => setRetry((n) => n + 1)}>
            {error}
          </StoreNotice>
        ) : !catalog ? (
          <StoreNotice>Carregando a seleÃ§Ã£oâ€¦</StoreNotice>
        ) : !catalog.items.length ? (
          <StoreNotice>
            A prÃ³xima seleÃ§Ã£o estÃ¡ sendo preparada. Volte em breve.
          </StoreNotice>
        ) : (
          <div className="store-grid">
            {catalog.items.map((product, index) => (
              <article
                key={product.id}
                className={`store-card store-card-${index % 3}`}
                style={
                  { '--card-delay': `${(index % 6) * 65}ms` } as CSSProperties
                }
              >
                <Link
                  href={`/loja/produtos/${product.id}`}
                  className="store-card-image"
                  aria-label={`Conhecer ${product.name}`}
                >
                  <ProductImage product={product} eager={index < 2} />
                  <span className="store-piece-number">
                    {String(page * 12 + index + 1).padStart(2, '0')} / TESOOB
                  </span>
                  <span className="store-card-arrow">
                    <ArrowUpRight size={24} />
                  </span>
                </Link>
                <div className="store-card-body">
                  <div className="store-card-title">
                    <h2>
                      <Link href={`/loja/produtos/${product.id}`}>
                        {product.name}
                      </Link>
                    </h2>
                    <p>{money(product.price)}</p>
                  </div>
                  <p className="store-description">{product.description}</p>
                  <ProductObservation value={product.observation} />
                  <Link
                    className="store-text-link"
                    href={`/loja/produtos/${product.id}`}
                  >
                    Conhecer a peÃ§a <ArrowUpRight size={17} />
                  </Link>
                  <button
                    type="button"
                    className="store-add-to-cart"
                    onClick={() => addToCart(product)}
                  >
                    <ShoppingBag size={16} />
                    {cart.some((item) => item.id === product.id)
                      ? 'Na sua seleÃ§Ã£o'
                      : 'Adicionar ao carrinho'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
        {catalog && catalog.totalPages > 1 && (
          <nav className="store-pagination" aria-label="PÃ¡ginas da vitrine">
            <button
              disabled={page === 0}
              onClick={() => setPage((n) => n - 1)}
              className="store-button store-button-secondary"
            >
              Anterior
            </button>
            <span>
              {page + 1} / {catalog.totalPages}
            </span>
            <button
              disabled={page + 1 === catalog.totalPages}
              onClick={() => setPage((n) => n + 1)}
              className="store-button store-button-secondary"
            >
              PrÃ³xima
            </button>
          </nav>
        )}
      </section>
      <div className="store-footnote">
        <ShieldCheck size={20} />
        <p>
          Uma peÃ§a de cada vez. Seus dados de entrega sÃ£o solicitados somente no
          checkout.
        </p>
        <span>FEITO PARA MARCAR.</span>
      </div>
    </StoreFrame>
  );
}
export function ProductDetail({ id }: { id: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    storeApi<Product>(`/products/${id}`, { signal: controller.signal })
      .then((data) => {
        setError('');
        setProduct(data);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(storeMessage(e));
      });
    return () => controller.abort();
  }, [id, retry]);
  return (
    <StoreFrame>
      <Link href="/loja" className="store-back">
        <ArrowLeft size={16} /> Voltar Ã  vitrine
      </Link>
      {error ? (
        <StoreNotice retry={() => setRetry((n) => n + 1)}>{error}</StoreNotice>
      ) : !product ? (
        <StoreNotice>Carregando a peÃ§aâ€¦</StoreNotice>
      ) : (
        <div className="store-detail">
          <div className="store-detail-image">
            <ProductImage product={product} eager />
          </div>
          <div className="store-detail-copy">
            <p className="store-kicker">TESOOB / PEÃ‡A AUTORAL</p>
            <h1>{product.name}</h1>
            <p className="store-price">{money(product.price)}</p>
            <p className="store-description">{product.description}</p>
            <ProductObservation value={product.observation} />
            <Link
              href={`/loja/checkout/${product.id}`}
              className="store-button"
            >
              Comprar <ArrowUpRight size={20} />
            </Link>
            <p className="store-fine-print">
              VocÃª entrarÃ¡ na sua conta antes de informar os dados de entrega.
              Pagamento online em preparaÃ§Ã£o; nenhuma cobranÃ§a automÃ¡tica.
            </p>
          </div>
        </div>
      )}
    </StoreFrame>
  );
}
```


