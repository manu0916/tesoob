import type { Metadata } from 'next';
import { SiteHeader, SiteFooter } from '@/components/tesoob';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Termos de Uso — Tesoob',
  description:
    'Regras de uso da loja Tesoob: contas, pedidos, pagamento e responsabilidades.',
};

export default function TermsOfUsePage() {
  return (
    <>
      <SiteHeader />
      <main className="legal-page">
        <p className="eyebrow">TESOOB / DOCUMENTO LEGAL</p>
        <h1>Termos de Uso</h1>
        <p className="legal-updated">Última atualização: 21 de setembro de 2026.</p>

        <p>
          Estes termos regem o uso do site e da loja da Tesoob. Ao criar uma
          conta ou fazer um pedido, você concorda com o que está descrito
          abaixo. Se não concordar, não utilize a loja.
        </p>

        <h2>1. Sobre a Tesoob</h2>
        <p>
          A Tesoob é uma marca autoral de peças exclusivas. O site apresenta o
          editorial da marca e uma vitrine para compra das peças disponíveis.
        </p>

        <h2>2. Criação de conta</h2>
        <ul>
          <li>
            Você pode criar uma conta informando nome, e-mail e senha, ou
            entrar diretamente com sua conta Google.
          </li>
          <li>Você é responsável por manter sua senha em sigilo e por toda atividade realizada na sua conta.</li>
          <li>
            Dados adicionais, como CPF e endereço, só são solicitados no
            momento da compra de uma peça — nunca no cadastro inicial.
          </li>
          <li>
            É necessário ter capacidade civil para contratar, ou autorização de
            um responsável legal, para criar uma conta e realizar pedidos.
          </li>
        </ul>

        <h2>3. Pedidos e pagamento</h2>
        <ul>
          <li>Cada pedido pode incluir de 1 a 10 unidades da mesma peça.</li>
          <li>
            O pagamento online ainda está em preparação. Ao concluir o
            checkout, o pedido é registrado, mas <strong>nenhuma cobrança é
            feita automaticamente</strong> nesta etapa.
          </li>
          <li>
            Os preços exibidos na vitrine podem mudar; o valor cobrado é sempre
            o vigente no momento da confirmação do pedido.
          </li>
          <li>
            Enquanto a integração de pagamento não estiver disponível, os
            próximos passos do pedido serão combinados diretamente com você
            pelo canal de contato informado na sua conta.
          </li>
        </ul>

        <h2>4. Alterações e cancelamentos</h2>
        <p>
          Até a loja disponibilizar cancelamento automático, qualquer alteração
          ou cancelamento de pedido deve ser solicitado pelo Instagram{' '}
          <a href={siteConfig.instagram} target="_blank" rel="noopener noreferrer">
            @vistatesoob
          </a>
          , informando o número do pedido.
        </p>

        <h2>5. Propriedade intelectual</h2>
        <p>
          Fotos, textos, identidade visual e as peças apresentadas no site
          pertencem à Tesoob ou aos seus criadores parceiros. Não é permitido
          reproduzir esse conteúdo sem autorização.
        </p>

        <h2>6. Uso aceitável</h2>
        <p>Ao usar o site, você concorda em não:</p>
        <ul>
          <li>Tentar acessar contas de outras pessoas ou burlar a autenticação.</li>
          <li>Enviar dados falsos no cadastro ou no checkout.</li>
          <li>Usar o site para fins ilegais ou que violem direitos de terceiros.</li>
        </ul>

        <h2>7. Limitação de responsabilidade</h2>
        <p>
          A Tesoob se esforça para manter as informações da vitrine corretas e
          o site disponível, mas não garante disponibilidade ininterrupta nem
          se responsabiliza por indisponibilidades causadas por terceiros
          (como provedores de infraestrutura) fora do nosso controle razoável.
        </p>

        <h2>8. Encerramento de conta</h2>
        <p>
          Você pode solicitar o encerramento da sua conta a qualquer momento
          pelo Instagram{' '}
          <a href={siteConfig.instagram} target="_blank" rel="noopener noreferrer">
            @vistatesoob
          </a>
          . A Tesoob também pode suspender contas usadas de forma fraudulenta
          ou em violação a estes termos.
        </p>

        <h2>9. Alterações nestes termos</h2>
        <p>
          Podemos atualizar estes termos conforme a loja evolui, especialmente
          quando o pagamento online for integrado. A data no topo desta página
          indica a versão vigente.
        </p>

        <h2>10. Legislação aplicável</h2>
        <p>
          Estes termos são regidos pela legislação brasileira, incluindo o
          Código de Defesa do Consumidor e a Lei Geral de Proteção de Dados
          (Lei nº 13.709/2018).
        </p>

        <h2>11. Contato</h2>
        <p>
          Dúvidas sobre estes termos podem ser enviadas pelo Instagram{' '}
          <a href={siteConfig.instagram} target="_blank" rel="noopener noreferrer">
            @vistatesoob
          </a>
          .
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
