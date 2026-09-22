import type { Metadata } from 'next';
import { SiteHeader, SiteFooter } from '@/components/tesoob';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Política de Privacidade — Tesoob',
  description:
    'Como a Tesoob coleta, usa, protege e permite o controle dos seus dados pessoais.',
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <SiteHeader />
      <main className="legal-page">
        <p className="eyebrow">TESOOB / DOCUMENTO LEGAL</p>
        <h1>Política de Privacidade</h1>
        <p className="legal-updated">Última atualização: 21 de setembro de 2026.</p>

        <p>
          Esta política explica quais dados pessoais a Tesoob coleta quando você
          navega pelo site, cria uma conta ou faz um pedido, para que servem e
          quais direitos você tem sobre eles. Ela se aplica à loja em{' '}
          <strong>/loja</strong> e às áreas de conta associadas.
        </p>

        <h2>1. Quem é o controlador dos dados</h2>
        <p>
          A Tesoob é uma marca autoral de peças exclusivas. O canal oficial de
          contato para assuntos de privacidade é o Instagram{' '}
          <a href={siteConfig.instagram} target="_blank" rel="noopener noreferrer">
            @vistatesoob
          </a>
          .
        </p>

        <h2>2. Quais dados coletamos</h2>
        <p>Coletamos apenas o necessário para operar a loja e sua conta:</p>
        <ul>
          <li>
            <strong>Cadastro por e-mail e senha:</strong> nome, e-mail e senha.
            A senha nunca é armazenada em texto puro — apenas um hash
            criptográfico (bcrypt) é salvo.
          </li>
          <li>
            <strong>Cadastro com Google:</strong> se você optar por entrar com o
            Google, recebemos seu e-mail verificado e o identificador da sua
            conta Google, por meio do protocolo padrão OpenID Connect. Não
            recebemos sua senha do Google.
          </li>
          <li>
            <strong>Dados de pedido:</strong> ao comprar uma peça, pedimos nome
            do destinatário, CPF e endereço de entrega. Esses dados são
            criptografados (AES-256-GCM) antes de serem gravados no banco de
            dados; não ficam salvos em texto legível.
          </li>
          <li>
            <strong>Dados de encomenda/conversa:</strong> se você fala conosco
            pelo chat do site ou pelo WhatsApp/Instagram para encomendar uma
            peça, guardamos seu nome, contato informado e as mensagens trocadas.
          </li>
          <li>
            <strong>Cookies de sessão:</strong> um cookie de sessão (HttpOnly)
            mantém você conectado à sua conta, e um cookie técnico de segurança
            protege formulários contra ataques (CSRF). Nenhum dos dois é usado
            para publicidade ou rastreamento entre sites.
          </li>
        </ul>

        <h2>3. Para que usamos esses dados</h2>
        <ul>
          <li>Criar e proteger sua conta e sua sessão de acesso.</li>
          <li>Processar e registrar os pedidos que você fizer.</li>
          <li>Responder dúvidas e tratar encomendas personalizadas.</li>
          <li>Prevenir fraude e uso indevido (por exemplo, limites de tentativas de login).</li>
        </ul>
        <p>
          Não usamos seus dados para publicidade direcionada, não fazemos
          perfilamento de comportamento e não vendemos dados pessoais a
          terceiros.
        </p>

        <h2>4. Com quem os dados são compartilhados</h2>
        <p>Alguns dados passam por prestadores que operam a infraestrutura do site:</p>
        <ul>
          <li>
            <strong>Cloudflare:</strong> hospeda o site e armazena o banco de
            dados (D1) e as imagens dos produtos (R2).
          </li>
          <li>
            <strong>Google:</strong> processa a autenticação quando você escolhe
            entrar com sua conta Google.
          </li>
        </ul>
        <p>
          O pagamento online ainda está em preparação. Enquanto isso, nenhuma
          cobrança é feita automaticamente e nenhum dado de cartão é coletado.
          Quando a integração de pagamento entrar em operação, esta política
          será atualizada para nomear o provedor.
        </p>

        <h2>5. Como protegemos seus dados</h2>
        <ul>
          <li>Senhas protegidas por hash (bcrypt), nunca em texto puro.</li>
          <li>CPF e endereço de entrega criptografados (AES-256-GCM) no banco de dados.</li>
          <li>Sessões em cookies HttpOnly, com proteção contra CSRF.</li>
          <li>Autenticação Google validada com verificação de assinatura e emissor (OpenID Connect).</li>
        </ul>

        <h2>6. Seus direitos</h2>
        <p>
          De acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018),
          você pode solicitar, a qualquer momento:
        </p>
        <ul>
          <li>Confirmação de que tratamos seus dados e acesso a eles.</li>
          <li>Correção de dados incompletos, inexatos ou desatualizados.</li>
          <li>Exclusão da sua conta e dos dados associados a ela.</li>
          <li>Portabilidade dos seus dados a outro fornecedor, quando aplicável.</li>
          <li>Revogação do consentimento dado, quando o tratamento depender dele.</li>
        </ul>
        <p>
          Para exercer qualquer um desses direitos, fale conosco pelo Instagram{' '}
          <a href={siteConfig.instagram} target="_blank" rel="noopener noreferrer">
            @vistatesoob
          </a>
          .
        </p>

        <h2>7. Retenção dos dados</h2>
        <p>
          Mantemos os dados da sua conta enquanto ela existir. Dados de pedidos
          já criptografados podem ser mantidos por período adicional para fins
          contábeis e de defesa em eventuais disputas, conforme exigido por lei.
        </p>

        <h2>8. Alterações nesta política</h2>
        <p>
          Podemos atualizar esta política para refletir mudanças no site ou na
          legislação. A data no topo desta página indica a versão vigente.
        </p>

        <h2>9. Contato</h2>
        <p>
          Dúvidas sobre privacidade podem ser enviadas pelo Instagram{' '}
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
