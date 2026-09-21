/* oxlint-disable next/no-img-element -- This small logo is already optimized locally. */
import { SiteLink as Link } from '@/components/site-link';
export default function NotFound() {
  return (
    <main className="not-found section">
      <img src="/media/logo-tesoob.png" alt="Tesoob" width="180" height="37" />
      <p className="eyebrow">404 / FORA DO CAMINHO</p>
      <h1>
        ESSA PÁGINA
        <br />
        FICOU PARA TRÁS.
      </h1>
      <p>As peças e o editorial continuam por aqui.</p>
      <Link href="/" className="action action-red">
        Voltar para a Tesoob ↗
      </Link>
    </main>
  );
}
