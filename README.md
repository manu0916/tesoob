# Tesoob

## Vitrine de vendas

A loja em `/loja` agora usa Cloudflare Pages/D1, preservando banco e login administrativo antigos. Migração aditiva, configuração e testes estão em [STOREFRONT.md](STOREFRONT.md). Build Pages: `npm run build:pages`, saída `.pages-dist`. Registrar pedido não realiza cobrança.

Site editorial com fotografias reais, três referências de looks, galeria completa, bastidores, vídeos sob demanda e consultas de encomenda.

## Desenvolvimento

Dentro desta pasta, execute `npm install` e `npm run dev`. A prévia de desenvolvimento usa http://localhost:3000 e atualiza com as alterações. `npm run build` gera o Worker e os arquivos estáticos em `dist/`.

## Contato e conteúdo

- `lib/site-config.ts`: configure `whatsappNumber` com o número verdadeiro, somente dígitos, incluindo país e DDD. Está `null` porque o número não foi fornecido. Nesse estado os links levam ao Instagram com rótulo correto; as páginas de referência permitem copiar o texto da consulta. Informar um telefone válido ativa os links do WhatsApp, com mensagens contextualizadas. Reinicie ou publique uma nova versão após modificar a configuração.
- `lib/site-config.ts`: `publicOrigin` contém a origem real fornecida por Sites. Ela é usada em metadados e links de referência nas mensagens; caminhos locais não são enviados.
- `lib/catalog.ts`: nomes descritivos, agrupamento, textos e fotos das três referências. São referências para consulta, sem afirmação de disponibilidade ou venda do look como conjunto.
- `components/tesoob.tsx`: página inicial, galeria, menu, vídeos e página de referência.
- `app/globals.css`: cores, tipografia, composição, estados responsivos e animações.

Rotas compartilháveis: `/pecas/vermelho-amarracoes`, `/pecas/verde-ferragens` e `/pecas/jeans-camadas`.

## Mídias

`public/media/media-manifest.json` relaciona os 22 arquivos originais do ZIP aos derivados, dimensões e textos alternativos. `details-manifest.json` registra a origem e as coordenadas dos três recortes de detalhes. Nenhuma roupa ou modelo foi gerado ou alterado por IA.

As 16 fotos estão disponíveis na galeria e no restante do site. As imagens WebP originalmente nomeadas `.jpg` foram preservadas no tamanho principal e recebem a extensão correta. Existem derivados de 480 e 800 pixels e `srcset` para otimização responsiva. As imagens de referência podem ser ampliadas sem recorte.

Os seis vídeos estão preservados com `faststart`. Os cinco vídeos principais estão acessíveis por reprodução voluntária; o clipe de menos de um segundo fica no acervo e possui pôster. Vídeos começam sem som após clique, têm controles e pausam ao sair da tela. As fotografias e o texto tornam o site compreensível sem depender do áudio.

O logo foi extraído fielmente do quadro de 54 segundos do reel original. A imagem de compartilhamento usa a fotografia real. Fontes Barlow Condensed e Manrope são servidas localmente; licenças OFL estão em `public/fonts/`.

## Verificação

- `npm run lint` e `npm exec -- tsc --noEmit` verificam o código.
- `npm run build` verifica a compilação de publicação.
- A revisão no navegador cobriu larguras de 320, 360, 390, 768 e 1440 px, galerias com 16 fotos, setas/Escape e devolução de foco, abas de detalhes, navegação móvel, rotas diretas, campos opcionais, redução de movimento e pausa dos vídeos fora da tela.
- Sem erros de execução ou arquivos HTTP ausentes durante os fluxos conferidos.
- O envio ao WhatsApp real depende do telefone correto e permanece pendente. Nenhum botão confirma pedido ou envia mensagem automaticamente.

O repositório de Sites e `.openai/hosting.json` identificam o projeto. Chat e vitrine usam a mesma binding D1 (`DB`), em tabelas separadas, preservando os registros existentes. Java/PostgreSQL não são usados pelo site atual. Não há cobrança automática.

## Chat de encomendas

O botão superior **Encomendar** e os CTAs de encomenda abrem duas opções: Instagram ou chat no próprio site. O cliente informa nome e ideia, com contato e referência opcionais. Ao abrir a partir de uma peça, referência, medidas e observações já preenchidas acompanham o formulário.

- `/admin`: painel de atendimento com login por e-mail e senha, busca, filtros, mensagens não lidas, respostas e finalização/reabertura da encomenda.
- `components/order-chat.tsx`, `components/chat-ui.tsx` e `components/admin-orders.tsx`: interfaces e consultas periódicas enquanto a tela está visível. Rascunhos ficam apenas na memória da página; mensagens enviadas ficam no servidor.
- `app/chat.css`: identidade visual, modal, conversa e painel responsivo.
- `lib/chat-server.ts`, `app/api/chat/**` e `app/api/admin/**`: sessões, autorização, validação, limites de envio, idempotência e API.
- `db/schema.ts` e `drizzle/`: schema e migração gerada. Consultas usam prepared statements D1. A migração inicial é aplicada de forma idempotente no primeiro acesso local; Sites inclui `drizzle/` no pacote de publicação.

O visitante acessa somente a conversa vinculada a um cookie aleatório `HttpOnly`, `SameSite=Lax` e `Secure` em HTTPS. O servidor guarda o hash do token. O acesso dura 30 dias e é renovado ao usar o chat; expirar ou apagar o cookie exige iniciar outra conversa. O histórico permanece no banco para atendimento. Não há notificações fora do site ou anexos nesta versão.

### Acesso administrativo

No primeiro acesso local a `/admin`, cadastre seu e-mail e uma senha de pelo menos 12 caracteres. Depois, o painel mostra o login normal. O cadastro inicial fecha assim que existe um administrador e é desabilitado em produção. As senhas usam PBKDF2 SHA-256 com salt aleatório; os tokens de sessão têm apenas seus hashes persistidos, expiram após 8 horas e são revogados ao sair. O login tem limitação de tentativas e não aceita identidade recebida em headers do visitante.

Para publicar usando o mesmo acesso escolhido localmente, configure `TESOOB_ADMIN_EMAIL` e o hash já gerado em `TESOOB_ADMIN_PASSWORD_HASH` nas configurações de runtime do Sites, tratando o hash como segredo. Esses valores criam o primeiro administrador somente se o banco ainda não tiver um; não sobrescrevem contas existentes. Nunca use a senha em texto puro nessas variáveis. O login não depende de uma conta do ChatGPT.

`.dev.vars.example` documenta essas variáveis; valores reais devem ficar em arquivos locais ignorados e nas configurações de runtime do Sites. Não há senha padrão ou recuperação de senha por e-mail nesta versão. A última tentativa de consultar o projeto pelo conector retornou `project_not_found`; nenhuma publicação do chat foi realizada.

### Verificação do chat

Com `npm run dev` ativo, `npm run test:chat` verifica as APIs contra `localhost:3000`, usando visitantes separados e uma conta administrativa temporária com senha aleatória. Testa login, hash, persistência, privacidade, origem, tamanho da mensagem, reenvios, resposta do admin, leitura, paginação, reabertura e sessão expirada. O script cria registros identificados de teste e remove apenas esses registros e a conta temporária do banco local ao terminar. Também execute `npm run lint`, `npm exec -- tsc --noEmit` e `npm run build` após alterações.
