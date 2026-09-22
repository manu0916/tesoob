/* oxlint-disable next/no-img-element -- Local editorial media is optimized during export. */
import { SiteLink as Link } from '@/components/site-link';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { photo } from '@/lib/catalog';

export default function NotFound() {
  const image = photo('editorial-08');
  return (
    <main className="not-found">
      <div className="not-found-copy">
        <Link href="/" className="not-found-brand" aria-label="Tesoob, início">
          <img src="/media/logo-tesoob.png" alt="Tesoob" width="190" height="39" />
        </Link>
        <p className="eyebrow">ERRO 404 / FORA DA ROTA</p>
        <p className="not-found-number" aria-hidden="true">404</p>
        <h1>
          ESSA HISTÓRIA
          <br />
          <span>NÃO ESTÁ AQUI.</span>
        </h1>
        <p className="not-found-description">
          O inesperado mora em outro lugar. Volte para a seleção e encontre a
          próxima peça que vai marcar.
        </p>
        <div className="not-found-actions">
          <Link href="/loja" className="action action-red">
            Visitar a vitrine <ArrowUpRight size={19} />
          </Link>
          <Link href="/" className="not-found-home">
            <ArrowLeft size={17} /> Voltar ao início
          </Link>
        </div>
      </div>
      <figure className="not-found-art">
        <img
          src={`/media/${image.src}`}
          srcSet={image.variants
            .map((variant) => `/media/${variant.src} ${variant.width}w`)
            .join(', ')}
          sizes="(max-width: 760px) 100vw, 48vw"
          width={image.width}
          height={image.height}
          alt="Editorial Tesoob"
        />
        <figcaption>TESOOB / CONTINUE O INESPERADO</figcaption>
      </figure>
    </main>
  );
}
